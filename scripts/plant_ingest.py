#!/usr/bin/env python3
"""
Plant Knowledge Ingestion Script
==================================
Ingest plant/agriculture Q&A data from Hugging Face into Qdrant vector database.

This script:
1. Loads agricultural Q&A dataset from Hugging Face
2. Generates text embeddings for questions
3. Stores Q&A pairs in Qdrant for RAG retrieval

Dataset: KisanVaani/agriculture-qa-english-only (default)
Collection: plant-knowledge
"""

import os
import uuid
import logging
import argparse
from typing import List, Dict, Any
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from datasets import load_dataset
from fastembed import TextEmbedding

# ==========================================
# CONFIGURATION
# ==========================================
DEFAULT_COLLECTION_NAME = "plant-knowledge"
DEFAULT_DATASET_NAME = "KisanVaani/agriculture-qa-english-only"
DEFAULT_BATCH_SIZE = 50
DEFAULT_LIMIT = 1000  # Set to None to ingest entire dataset

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
    
    # Try multiple environment variable names for flexibility
    endpoint = os.getenv("QDRANT_URL") or os.getenv("VITE_QUADRANT_ENDPOINT")
    api_key = os.getenv("QDRANT_API_KEY") or os.getenv("VITE_QUADRANT_API_KEY")
    
    if not endpoint or not api_key:
        logger.error("❌ Missing environment variables!")
        logger.error("Please ensure QDRANT_URL and QDRANT_API_KEY are set in your .env file.")
        logger.error("(or VITE_QUADRANT_ENDPOINT and VITE_QUADRANT_API_KEY)")
        exit(1)
        
    return endpoint, api_key


def init_qdrant(endpoint: str, api_key: str, collection_name: str, vector_size: int) -> QdrantClient:
    """Initialize Qdrant client and create collection if needed."""
    try:
        client = QdrantClient(url=endpoint, api_key=api_key)
        
        # Check if collection exists
        if not client.collection_exists(collection_name):
            logger.info(f"✨ Creating collection '{collection_name}' with vector size {vector_size}...")
            client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE
                )
            )
            logger.info("✅ Collection created successfully.")
        else:
            logger.info(f"ℹ️  Collection '{collection_name}' already exists.")
            
        return client
    except Exception as e:
        logger.error(f"❌ Failed to initialize Qdrant: {e}")
        exit(1)


def upsert_batch(
    client: QdrantClient,
    collection_name: str,
    model: TextEmbedding,
    texts: List[str],
    payloads: List[Dict]
):
    """Generate embeddings and upsert a batch of points."""
    try:
        # Generate embeddings for questions
        embeddings = list(model.embed(texts))
        
        points = [
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=emb.tolist(),
                payload=payload
            )
            for emb, payload in zip(embeddings, payloads)
        ]

        client.upsert(
            collection_name=collection_name,
            points=points
        )
    except Exception as e:
        logger.error(f"❌ Error upserting batch: {e}")
        raise


def extract_qa_pair(item: Dict) -> tuple[str, str, str]:
    """
    Extract question, answer, and category from dataset item.
    Handles different dataset schemas flexibly.
    """
    # Try different field names for question
    question = (
        item.get('question') or 
        item.get('query') or 
        item.get('text') or 
        item.get('input') or
        ""
    )
    
    # Try different field names for answer
    answer = (
        item.get('answer') or 
        item.get('response') or 
        item.get('output') or
        item.get('completion') or
        ""
    )
    
    # Try to extract category/topic
    category = (
        item.get('category') or 
        item.get('topic') or 
        item.get('label') or
        "general"
    )
    
    return question.strip(), answer.strip(), category


def main():
    parser = argparse.ArgumentParser(description="Ingest plant/agriculture Q&A data into Qdrant")
    parser.add_argument(
        "--dataset",
        default=DEFAULT_DATASET_NAME,
        help=f"Hugging Face dataset name (default: {DEFAULT_DATASET_NAME})"
    )
    parser.add_argument(
        "--collection",
        default=DEFAULT_COLLECTION_NAME,
        help=f"Qdrant collection name (default: {DEFAULT_COLLECTION_NAME})"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help=f"Maximum number of items to ingest (default: {DEFAULT_LIMIT}, use 0 for all)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help=f"Batch size for ingestion (default: {DEFAULT_BATCH_SIZE})"
    )
    parser.add_argument(
        "--model",
        default="Qdrant/clip-ViT-B-32-text",
        help="Text embedding model to use"
    )
    
    args = parser.parse_args()
    
    endpoint, api_key = load_environment()
    
    logger.info("=" * 80)
    logger.info("🌱 PLANT KNOWLEDGE INGESTION PIPELINE")
    logger.info("=" * 80)
    logger.info(f"📂 Dataset: {args.dataset}")
    logger.info(f"🗄️  Target Collection: {args.collection}")
    logger.info(f"📊 Limit: {args.limit if args.limit > 0 else 'All'}")
    
    # Initialize Embedding Model first to get vector size
    logger.info(f"🧠 Loading text embedding model: {args.model}...")
    try:
        embedding_model = TextEmbedding(model_name=args.model)
        
        # Detect vector size by generating a test embedding
        test_embedding = list(embedding_model.embed(["test"]))[0]
        vector_size = len(test_embedding)
        
        logger.info(f"📏 Detected vector size: {vector_size}")
    except Exception as e:
        logger.error(f"❌ Failed to load embedding model: {e}")
        exit(1)

    # Initialize Qdrant with detected size
    client = init_qdrant(endpoint, api_key, args.collection, vector_size)

    # Load Dataset
    logger.info("📥 Loading dataset from Hugging Face...")
    try:
        dataset = load_dataset(args.dataset, split="train")
        logger.info(f"✅ Dataset loaded: {len(dataset)} total items")
    except Exception as e:
        logger.error(f"❌ Failed to load dataset: {e}")
        logger.error("💡 Tip: Make sure the dataset name is correct and publicly accessible")
        exit(1)

    # Processing Loop
    batch_texts = []
    batch_payloads = []
    total_processed = 0
    skipped = 0
    
    logger.info("⚙️  Processing Q&A pairs...")
    
    try:
        limit = args.limit if args.limit > 0 else len(dataset)
        
        for i, item in enumerate(dataset):
            if total_processed >= limit:
                logger.info(f"🛑 Reached limit of {limit} items.")
                break

            # Extract Q&A pair
            question, answer, category = extract_qa_pair(item)
            
            # Skip if question or answer is empty
            if not question or not answer:
                skipped += 1
                continue

            # Prepare payload with all metadata
            payload = {
                "question": question,
                "answer": answer,
                "category": category,
                "dataset_source": args.dataset,
            }
            
            # Add any additional metadata fields
            for key, value in item.items():
                if key not in ['question', 'answer', 'query', 'response', 'text', 'input', 'output', 'completion']:
                    # Only add simple types (str, int, float, bool)
                    if isinstance(value, (str, int, float, bool)):
                        payload[f"meta_{key}"] = value

            # Use question as the text to embed (for retrieval)
            batch_texts.append(question)
            batch_payloads.append(payload)

            # Process batch
            if len(batch_texts) >= args.batch_size:
                upsert_batch(client, args.collection, embedding_model, batch_texts, batch_payloads)
                total_processed += len(batch_texts)
                logger.info(f"✅ Processed {total_processed}/{limit} Q&A pairs... (skipped: {skipped})")
                batch_texts = []
                batch_payloads = []

        # Process remaining items
        if batch_texts:
            upsert_batch(client, args.collection, embedding_model, batch_texts, batch_payloads)
            total_processed += len(batch_texts)

        logger.info("=" * 80)
        logger.info(f"🎉 Ingestion complete!")
        logger.info(f"✅ Total Q&A pairs ingested: {total_processed}")
        logger.info(f"⚠️  Skipped (empty): {skipped}")
        logger.info(f"📊 Collection: {args.collection}")
        logger.info("=" * 80)

    except KeyboardInterrupt:
        logger.info("\n⚠️  Ingestion stopped by user.")
        logger.info(f"Processed {total_processed} items before stopping.")
    except Exception as e:
        logger.error(f"❌ Unexpected error during processing: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
