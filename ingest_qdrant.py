import os
import uuid
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from datasets import load_dataset
from fastembed import ImageEmbedding

# ==========================================
# CONFIGURATION
# ==========================================
COLLECTION_NAME = "landscape_designs"
DATASET_NAME = "tommypurcell/landscape_designs"
BATCH_SIZE = 50
LIMIT = 200  # Set to None to ingest the entire dataset

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

def load_environment():
    """Load and validate environment variables."""
    load_dotenv()
    
    endpoint = os.getenv("VITE_QUADRANT_ENDPOINT")
    api_key = os.getenv("VITE_QUADRANT_API_KEY")
    
    if not endpoint or not api_key:
        logger.error("❌ Missing environment variables!")
        logger.error("Please ensure VITE_QUADRANT_ENDPOINT and VITE_QUADRANT_API_KEY are set in your .env file.")
        exit(1)
        
    return endpoint, api_key

def init_qdrant(endpoint: str, api_key: str, vector_size: int) -> QdrantClient:
    """Initialize Qdrant client and create collection if needed."""
    try:
        client = QdrantClient(url=endpoint, api_key=api_key)
        
        # Check if collection exists
        if not client.collection_exists(COLLECTION_NAME):
            logger.info(f"✨ Creating collection '{COLLECTION_NAME}' with vector size {vector_size}...")
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE
                )
            )
            logger.info("✅ Collection created successfully.")
        else:
            logger.info(f"ℹ️  Collection '{COLLECTION_NAME}' already exists.")
            
        return client
    except Exception as e:
        logger.error(f"❌ Failed to initialize Qdrant: {e}")
        exit(1)

def upsert_batch(client: QdrantClient, model: ImageEmbedding, images: List[Any], payloads: List[Dict]):
    """Generate embeddings and upsert a batch of points."""
    try:
        # Generate embeddings
        # fastembed returns a generator, convert to list
        embeddings = list(model.embed(images))
        
        points = [
            models.PointStruct(
                id=str(uuid.uuid4()),
                # The user's collection has a named vector "512vector"
                # We must pass a dictionary { "vector_name": [values] }
                vector={"512vector": emb.tolist()},
                payload=payload
            )
            for emb, payload in zip(embeddings, payloads)
        ]

        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
    except Exception as e:
        logger.error(f"❌ Error upserting batch: {e}")

def main():
    endpoint, api_key = load_environment()
    
    logger.info("🚀 Starting ingestion pipeline...")
    logger.info(f"📂 Dataset: {DATASET_NAME}")
    logger.info(f"🗄️  Target Collection: {COLLECTION_NAME}")
    
    # Initialize Embedding Model first to get vector size
    logger.info("🧠 Loading FastEmbed CLIP model (Qdrant/clip-ViT-B-32-vision)...")
    try:
        embedding_model = ImageEmbedding(model_name="Qdrant/clip-ViT-B-32-vision")
        # Try to detect vector size, fallback to 512 if not found
        # FastEmbed models usually have a config or we can infer from a dummy run, 
        # but for CLIP ViT-B/32 it is known to be 512. 
        # However, let's try to be dynamic if possible or just use the known size for this model.
        # Inspecting FastEmbed source, we can check the model config if accessible.
        # For safety with this specific model request, we'll default to 512 but allow override if we can detect it.
        vector_size = 512 
        # Attempt to get size from internal model config if available (implementation detail dependent)
        if hasattr(embedding_model, "_model") and hasattr(embedding_model._model, "config"):
             if hasattr(embedding_model._model.config, "projection_dim"):
                 vector_size = embedding_model._model.config.projection_dim
             elif hasattr(embedding_model._model.config, "hidden_size"):
                 vector_size = embedding_model._model.config.hidden_size
        
        logger.info(f"📏 Detected vector size: {vector_size}")

    except Exception as e:
        logger.error(f"❌ Failed to load embedding model: {e}")
        exit(1)

    # Initialize Qdrant with detected size
    client = init_qdrant(endpoint, api_key, vector_size)

    # Load Dataset
    logger.info("📥 Loading dataset from Hugging Face (streaming mode)...")
    try:
        dataset = load_dataset(DATASET_NAME, split="train")
    except Exception as e:
        logger.error(f"❌ Failed to load dataset: {e}")
        exit(1)

    # Create directory for local images if needed
    local_image_dir = "downloaded_images"
    os.makedirs(local_image_dir, exist_ok=True)

    # Processing Loop
    batch_images = []
    batch_payloads = []
    total_processed = 0
    
    logger.info("⚙️  Processing images...")
    
    try:
        for i, item in enumerate(dataset):
            if LIMIT and total_processed >= LIMIT:
                logger.info(f"🛑 Reached limit of {LIMIT} images.")
                break

            # Handle different dataset structures (some use 'image', some 'img', etc.)
            image = item.get('image') or item.get('img')
            if not image:
                continue

            # Ensure RGB
            if image.mode != "RGB":
                image = image.convert("RGB")

            # Prepare payload
            # We try to capture all metadata fields except the image itself
            payload = {k: v for k, v in item.items() if k not in ['image', 'img']}
            payload['dataset_source'] = DATASET_NAME
            
            # Always construct HuggingFace public URL
            # HF gives a dict with .path inside
            filename = os.path.basename(item["image"]["path"])
            
            # Build HuggingFace raw URL
            image_url = (
                f"https://huggingface.co/datasets/"
                f"{DATASET_NAME}/resolve/main/landscape_designs/{filename}"
            )
            
            payload["image_url"] = image_url

            batch_images.append(image)
            batch_payloads.append(payload)

            # Process batch
            if len(batch_images) >= BATCH_SIZE:
                upsert_batch(client, embedding_model, batch_images, batch_payloads)
                total_processed += len(batch_images)
                logger.info(f"✅ Processed {total_processed} images...")
                batch_images = []
                batch_payloads = []

        # Process remaining
        if batch_images:
            upsert_batch(client, embedding_model, batch_images, batch_payloads)
            total_processed += len(batch_images)

        logger.info(f"🎉 Ingestion complete! Total documents: {total_processed}")

    except KeyboardInterrupt:
        logger.info("\n⚠️  Ingestion stopped by user.")
    except Exception as e:
        logger.error(f"❌ Unexpected error during processing: {e}")

if __name__ == "__main__":
    main()
