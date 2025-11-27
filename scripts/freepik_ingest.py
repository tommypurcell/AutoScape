import os
import uuid
import logging
import time
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from fastembed import ImageEmbedding
import requests
from PIL import Image
from io import BytesIO

# ==========================================
# CONFIGURATION
# ==========================================
COLLECTION_NAME = "freepik_landscaping"
BATCH_SIZE = 20
RATE_LIMIT_DELAY = 1.0  # Seconds between API requests
LIMIT = 10000  # Total images to ingest (set to None for unlimited)

# Landscaping-focused search terms
SEARCH_TERMS = [
    # Whole plants for landscaping
    "ornamental tree full plant",
    "shrub bush whole plant landscaping",
    "ornamental grass full plant",
    "hedge plant full shape",
    "flowering tree whole plant",
    "evergreen tree full plant",
    "palm tree full plant",
    "bamboo plant full",
    "topiary plant full shape",
    "perennial plant full",
    "succulent garden plant",
    "cactus landscaping full",
    "fern plant outdoor",
    "vine climbing plant",
    "ground cover plant",
    "rose bush full plant",
    "lavender plant full",
    "hydrangea bush full",
    "boxwood shrub full",
    "japanese maple tree full",
    
    # Hardscape materials
    "paving stone landscaping",
    "garden gravel texture",
    "landscape rock material",
    "brick paver landscaping",
    "concrete paver garden",
    "flagstone patio material",
    "mulch landscaping material",
    "decorative stone garden",
    "retaining wall stone",
    "garden edging material",
    "wooden deck texture",
    "garden trellis design",
    "outdoor fire pit stone",
    "garden fountain stone",
    "stepping stones garden",
    "artificial turf texture",
    "outdoor lighting landscape",
    "garden fence wood",
    "pergola wood structure",
    "raised garden bed wood",
]

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
    
    # Qdrant configuration
    endpoint = os.getenv("VITE_QUADRANT_ENDPOINT") or os.getenv("QDRANT_URL")
    api_key = os.getenv("VITE_QUADRANT_API_KEY") or os.getenv("QDRANT_API_KEY")
    
    # Freepik API key
    freepik_key = os.getenv("FREEPIK_API_KEY")
    
    if not endpoint or not api_key:
        logger.error("❌ Missing Qdrant environment variables!")
        logger.error("Please ensure VITE_QUADRANT_ENDPOINT and VITE_QUADRANT_API_KEY are set in your .env file.")
        exit(1)
    
    if not freepik_key:
        logger.error("❌ Missing FREEPIK_API_KEY!")
        logger.error("Please ensure FREEPIK_API_KEY is set in your .env file.")
        exit(1)
        
    return endpoint, api_key, freepik_key

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

def fetch_freepik_images(api_key: str, search_term: str, page: int = 1, limit: int = 20) -> Optional[Dict]:
    """Fetch images from Freepik API."""
    api_url = "https://api.freepik.com/v1/resources"
    
    headers = {
        "x-freepik-api-key": api_key,
        "Accept-Language": "en-US",
    }
    
    params = {
        "term": search_term,
        "page": page,
        "limit": limit,
        "order": "relevance",
        "filters[content_type][photo]": 1,  # Only photos
        "filters[orientation][landscape]": 1,  # Prefer landscape orientation
        "filters[orientation][square]": 1,  # Also allow square
    }
    
    try:
        response = requests.get(api_url, headers=headers, params=params)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            logger.warning("⚠️  Rate limit hit, waiting 5 seconds...")
            time.sleep(5)
            return None
        else:
            logger.error(f"❌ API error {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"❌ Request failed: {e}")
        return None

def download_image(url: str) -> Optional[Image.Image]:
    """Download and convert image to RGB PIL Image."""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            image = Image.open(BytesIO(response.content))
            if image.mode != "RGB":
                image = image.convert("RGB")
            return image
        return None
    except Exception as e:
        logger.warning(f"⚠️  Failed to download image: {e}")
        return None

def upsert_batch(client: QdrantClient, model: ImageEmbedding, images: List[Image.Image], payloads: List[Dict]):
    """Generate embeddings and upsert a batch of points."""
    try:
        # Generate embeddings
        embeddings = list(model.embed(images))
        
        points = [
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=emb.tolist(),
                payload=payload
            )
            for emb, payload in zip(embeddings, payloads)
        ]

        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        logger.info(f"✅ Upserted batch of {len(points)} images")
    except Exception as e:
        logger.error(f"❌ Error upserting batch: {e}")

def main():
    endpoint, api_key, freepik_key = load_environment()
    
    logger.info("🚀 Starting Freepik Landscaping ingestion pipeline...")
    logger.info(f"🗄️  Target Collection: {COLLECTION_NAME}")
    logger.info(f"🔍 Search Terms: {len(SEARCH_TERMS)} categories")
    
    # Initialize Embedding Model
    logger.info("🧠 Loading FastEmbed CLIP vision model...")
    try:
        embedding_model = ImageEmbedding(model_name="Qdrant/clip-ViT-B-32-vision")
        vector_size = 512  # CLIP ViT-B/32 standard size
        logger.info(f"📏 Vector size: {vector_size}")
    except Exception as e:
        logger.error(f"❌ Failed to load embedding model: {e}")
        exit(1)

    # Initialize Qdrant
    client = init_qdrant(endpoint, api_key, vector_size)

    # Processing Loop
    batch_images = []
    batch_payloads = []
    total_processed = 0
    
    logger.info("⚙️  Fetching and processing images from Freepik...")
    
    try:
        for search_term in SEARCH_TERMS:
            if LIMIT and total_processed >= LIMIT:
                logger.info(f"🛑 Reached limit of {LIMIT} images.")
                break
            
            logger.info(f"🔍 Searching: '{search_term}'")
            
            # Fetch multiple pages for each search term
            for page in range(1, 4):  # Get 3 pages per search term
                if LIMIT and total_processed >= LIMIT:
                    break
                
                # Rate limiting
                time.sleep(RATE_LIMIT_DELAY)
                
                result = fetch_freepik_images(freepik_key, search_term, page=page, limit=10)
                
                if not result or "data" not in result:
                    logger.warning(f"⚠️  No results for '{search_term}' page {page}")
                    break
                
                items = result["data"]
                if not items:
                    break
                
                logger.info(f"  📄 Page {page}: {len(items)} items")
                
                for item in items:
                    if LIMIT and total_processed >= LIMIT:
                        break
                    
                    # Get image URL from the correct location in API response
                    image_url = None
                    if "image" in item and "source" in item["image"]:
                        image_url = item["image"]["source"].get("url")
                    
                    if not image_url:
                        logger.warning("⚠️  No image URL found, skipping")
                        continue
                    
                    # Download image
                    image = download_image(image_url)
                    if not image:
                        continue
                    
                    # Prepare payload with metadata
                    payload = {
                        "freepik_id": str(item.get("id", "")),
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "image_url": image_url,
                        "filename": item.get("filename", ""),
                        "search_term": search_term,
                        "content_type": item.get("image", {}).get("type", "photo"),
                        "orientation": item.get("image", {}).get("orientation", ""),
                        "premium": any(lic.get("type") == "premium" for lic in item.get("licenses", [])),
                        "source": "freepik",
                    }
                    
                    # Add optional fields if available
                    if "author" in item:
                        payload["author"] = item["author"].get("name", "")
                    
                    if "stats" in item:
                        payload["downloads"] = item["stats"].get("downloads", 0)
                        payload["likes"] = item["stats"].get("likes", 0)
                    
                    batch_images.append(image)
                    batch_payloads.append(payload)
                    
                    # Process batch when full
                    if len(batch_images) >= BATCH_SIZE:
                        upsert_batch(client, embedding_model, batch_images, batch_payloads)
                        total_processed += len(batch_images)
                        logger.info(f"📊 Total processed: {total_processed} images")
                        batch_images = []
                        batch_payloads = []

        # Process remaining images
        if batch_images:
            upsert_batch(client, embedding_model, batch_images, batch_payloads)
            total_processed += len(batch_images)

        logger.info(f"🎉 Ingestion complete! Total documents: {total_processed}")
        
        # Show collection stats
        collection_info = client.get_collection(COLLECTION_NAME)
        logger.info(f"📊 Collection '{COLLECTION_NAME}' now has {collection_info.points_count} points")

    except KeyboardInterrupt:
        logger.info("\n⚠️  Ingestion stopped by user.")
        if batch_images:
            logger.info("💾 Saving remaining batch...")
            upsert_batch(client, embedding_model, batch_images, batch_payloads)
            total_processed += len(batch_images)
        logger.info(f"📊 Final count: {total_processed} images")
    except Exception as e:
        logger.error(f"❌ Unexpected error during processing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
