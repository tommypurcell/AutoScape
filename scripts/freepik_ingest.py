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
import google.generativeai as genai
import json
import re
import argparse

# ==========================================
# CONFIGURATION
# ==========================================
COLLECTION_NAME = "freepik_landscaping"
BATCH_SIZE = 20
RATE_LIMIT_DELAY = 4.0  # Increased delay to respect Gemini rate limits
LIMIT = 20000  # Increased limit for better coverage

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
        
    # Gemini API key
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        logger.warning("⚠️  GEMINI_API_KEY not found. AI features (naming/pricing) will be disabled.")
    else:
        genai.configure(api_key=gemini_key)
        
    return endpoint, api_key, freepik_key, gemini_key

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

def analyze_image_with_gemini(image: Image.Image, search_term: str) -> Dict[str, Any]:
    """
    Analyze image using Gemini Vision to identify exact name and estimate price.
    """
    max_retries = 3
    base_delay = 5
    
    for attempt in range(max_retries):
        try:
            # Use gemini-2.0-flash for better rate limits and speed
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            prompt = f"""
            Analyze this landscaping image found with search term "{search_term}".
            
            1. Identify the EXACT specific plant species or hardscape material shown (e.g., "Acer palmatum" instead of just "maple").
            2. Estimate the MINIMUM typical market price for this item in USD (e.g., "$50 per 5-gallon pot" or "$5 per sq ft"). Take the lower bound of any range.
            
            Return ONLY a JSON object with these keys:
            - "specific_name": string (the specific name)
            - "price_estimate": string (the minimum price with unit)
            - "description": string (brief 1-sentence description of the visual)
            """
            
            response = model.generate_content([prompt, image])
            text = response.text.strip()
            
            # Extract JSON from response (handle markdown code blocks)
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            return json.loads(text)
            
        except Exception as e:
            if "429" in str(e):
                wait_time = base_delay * (2 ** attempt)
                logger.warning(f"⚠️  Rate limit hit (attempt {attempt+1}/{max_retries}). Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.warning(f"⚠️  Gemini analysis failed: {e}")
                break
    
    return {
        "specific_name": "",
        "price_estimate": "",
        "description": ""
    }

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
    parser = argparse.ArgumentParser(description="Ingest Freepik landscaping images with Gemini analysis")
    parser.add_argument("--limit", type=int, default=LIMIT, help="Number of images to ingest")
    parser.add_argument("--collection", default=COLLECTION_NAME, help="Qdrant collection name")
    args = parser.parse_args()

    endpoint, api_key, freepik_key, gemini_key = load_environment()
    
    logger.info("🚀 Starting Freepik Landscaping ingestion pipeline...")
    logger.info(f"🗄️  Target Collection: {args.collection}")
    logger.info(f"🔍 Search Terms: {len(SEARCH_TERMS)} categories")
    logger.info(f"📊 Limit: {args.limit}")
    
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
            if args.limit and total_processed >= args.limit:
                logger.info(f"🛑 Reached limit of {args.limit} images.")
                break
            
            logger.info(f"🔍 Searching: '{search_term}'")
            
            # Fetch multiple pages for each search term
            for page in range(1, 11):  # Get 10 pages per search term
                if args.limit and total_processed >= args.limit:
                    break
                
                # Rate limiting
                time.sleep(RATE_LIMIT_DELAY)
                
                result = fetch_freepik_images(freepik_key, search_term, page=page, limit=50)
                
                if not result or "data" not in result:
                    logger.warning(f"⚠️  No results for '{search_term}' page {page}")
                    break
                
                items = result["data"]
                if not items:
                    break
                
                logger.info(f"  📄 Page {page}: {len(items)} items")
                
                for item in items:
                    if args.limit and (total_processed + len(batch_images)) >= args.limit:
                        break
                    
                    # Add optional fields if available
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
                    
                    # Gemini Analysis
                    if gemini_key:
                        logger.info(f"  🤖 Analyzing image with Gemini...")
                        analysis = analyze_image_with_gemini(image, search_term)
                        payload.update(analysis)
                        logger.info(f"     Identified: {analysis.get('specific_name', 'N/A')} | Price: {analysis.get('price_estimate', 'N/A')}")
                        # Rate limit for Gemini
                        time.sleep(1.0)
                    
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
