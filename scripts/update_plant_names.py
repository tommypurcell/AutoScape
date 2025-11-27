"""
Update Freepik Landscaping Collection with Gemini-Identified Plant Names.
Uses Gemini Vision to analyze images and provide specific botanical/material names.
"""

import os
import logging
import time
from typing import Dict, Any, List
from dotenv import load_dotenv
from qdrant_client import QdrantClient
import google.generativeai as genai
import requests
from PIL import Image
from io import BytesIO

load_dotenv()

# Configuration
COLLECTION_NAME = "freepik_landscaping"
BATCH_SIZE = 10  # Process in small batches to avoid rate limits
DELAY_BETWEEN_REQUESTS = 2  # Seconds between Gemini API calls

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

def init_clients():
    """Initialize Qdrant and Gemini clients."""
    # Qdrant
    endpoint = os.getenv("VITE_QUADRANT_ENDPOINT") or os.getenv("QDRANT_URL")
    api_key = os.getenv("VITE_QUADRANT_API_KEY") or os.getenv("QDRANT_API_KEY")
    
    if not endpoint or not api_key:
        raise ValueError("Missing Qdrant credentials")
    
    qdrant_client = QdrantClient(url=endpoint, api_key=api_key)
    
    # Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise ValueError("Missing GEMINI_API_KEY")
    
    genai.configure(api_key=gemini_key)
    gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")
    
    return qdrant_client, gemini_model

def download_image(url: str) -> Image.Image:
    """Download image from URL."""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return Image.open(BytesIO(response.content))
    except Exception as e:
        logger.error(f"Failed to download image from {url}: {e}")
    return None

def identify_plant_with_gemini(image: Image.Image, current_title: str, search_term: str, model) -> str:
    """
    Use Gemini Vision to identify the specific plant or material.
    
    Args:
        image: PIL Image object
        current_title: Current title from Freepik
        search_term: The search term used to find this image
        model: Gemini model instance
    
    Returns:
        Specific plant or material name
    """
    prompt = f"""Analyze this landscaping image and provide a SPECIFIC botanical or material name.

Current title: "{current_title}"
Search category: "{search_term}"

Instructions:
1. If it's a plant, provide the SPECIFIC common name and botanical name (e.g., "Japanese Maple (Acer palmatum)")
2. If it's a hardscape material, provide the SPECIFIC type (e.g., "Bluestone Paver", "Pea Gravel", "River Rock")
3. Be as specific as possible - avoid generic terms like "tree" or "rock"
4. If you can identify variety or cultivar, include it
5. Format: Common Name (Scientific Name) for plants, or Material Type for hardscape

Response format (ONE LINE ONLY):
[Specific Name]

Example responses:
- "Japanese Maple (Acer palmatum 'Bloodgood')"
- "Blue Fescue Grass (Festuca glauca)"
- "Irregular Flagstone Paving"
- "Mexican Beach Pebbles"
"""
    
    try:
        response = model.generate_content([prompt, image])
        specific_name = response.text.strip()
        
        # Clean up the response
        specific_name = specific_name.replace('"', '').replace('[', '').replace(']', '')
        
        logger.info(f"  Identified: {specific_name}")
        return specific_name
    except Exception as e:
        logger.error(f"  Gemini identification failed: {e}")
        return current_title  # Fallback to original title

def update_collection_names(limit: int = None):
    """
    Update all points in the collection with Gemini-identified names.
    
    Args:
        limit: Optional limit on number of points to update (for testing)
    """
    logger.info("🚀 Starting collection update with Gemini plant identification...")
    
    # Initialize clients
    qdrant_client, gemini_model = init_clients()
    
    # Get collection info
    collection_info = qdrant_client.get_collection(COLLECTION_NAME)
    total_points = collection_info.points_count
    logger.info(f"📊 Collection has {total_points} points")
    
    if limit:
        total_points = min(total_points, limit)
        logger.info(f"🔢 Limited to {total_points} points for this run")
    
    # Scroll through all points
    offset = None
    processed_count = 0
    updated_count = 0
    error_count = 0
    
    while True:
        # Get next batch
        scroll_result = qdrant_client.scroll(
            collection_name=COLLECTION_NAME,
            limit=BATCH_SIZE,
            offset=offset,
            with_payload=True,
            with_vectors=False
        )
        
        points, next_offset = scroll_result
        
        if not points:
            break
        
        logger.info(f"\n📦 Processing batch of {len(points)} points...")
        
        for point in points:
            if limit and processed_count >= limit:
                logger.info(f"✅ Reached limit of {limit} points")
                break
            
            processed_count += 1
            point_id = point.id
            payload = point.payload
            
            current_title = payload.get('title', 'Unknown')
            image_url = payload.get('image_url')
            search_term = payload.get('search_term', '')
            
            logger.info(f"\n[{processed_count}/{total_points}] Processing: {current_title[:50]}...")
            
            if not image_url:
                logger.warning("  ⚠️  No image URL, skipping")
                error_count += 1
                continue
            
            # Download image
            image = download_image(image_url)
            if not image:
                logger.warning("  ⚠️  Failed to download image, skipping")
                error_count += 1
                continue
            
            # Identify with Gemini
            try:
                specific_name = identify_plant_with_gemini(
                    image, 
                    current_title, 
                    search_term,
                    gemini_model
                )
                
                # Update Qdrant point
                qdrant_client.set_payload(
                    collection_name=COLLECTION_NAME,
                    payload={
                        "specific_name": specific_name,
                        "original_title": current_title
                    },
                    points=[point_id]
                )
                
                updated_count += 1
                logger.info(f"  ✅ Updated: {current_title[:40]} → {specific_name[:40]}")
                
                # Rate limiting
                time.sleep(DELAY_BETWEEN_REQUESTS)
                
            except Exception as e:
                logger.error(f"  ❌ Error updating point: {e}")
                error_count += 1
        
        # Check if we should continue
        if not next_offset or (limit and processed_count >= limit):
            break
        
        offset = next_offset
    
    # Summary
    logger.info(f"\n{'='*60}")
    logger.info(f"🎉 Update Complete!")
    logger.info(f"📊 Total processed: {processed_count}")
    logger.info(f"✅ Successfully updated: {updated_count}")
    logger.info(f"❌ Errors: {error_count}")
    logger.info(f"{'='*60}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Update plant names with Gemini Vision")
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of points to update (for testing)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Batch size for processing"
    )
    
    args = parser.parse_args()
    
    if args.batch_size:
        BATCH_SIZE = args.batch_size
    
    logger.info(f"Starting update with batch size: {BATCH_SIZE}")
    if args.limit:
        logger.info(f"Test mode: Will update {args.limit} points")
    
    update_collection_names(limit=args.limit)
