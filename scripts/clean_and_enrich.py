import os
import time
import logging
import json
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
import google.generativeai as genai
from PIL import Image
from io import BytesIO

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

COLLECTION_NAME = "freepik_landscaping"
FIELDS_TO_REMOVE = ["source", "likes", "downloads", "original_title"]

def load_environment():
    load_dotenv()
    endpoint = os.getenv("VITE_QUADRANT_ENDPOINT") or os.getenv("QDRANT_URL")
    api_key = os.getenv("VITE_QUADRANT_API_KEY") or os.getenv("QDRANT_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not endpoint or not api_key:
        logger.error("❌ Missing Qdrant credentials")
        exit(1)
    
    if gemini_key:
        genai.configure(api_key=gemini_key)
    else:
        logger.warning("⚠️  GEMINI_API_KEY not found. Naming enrichment will be skipped.")
        
    return endpoint, api_key, gemini_key

def download_image(url: str) -> Optional[Image.Image]:
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

def analyze_image(image: Image.Image, title: str) -> Dict[str, str]:
    max_retries = 3
    base_delay = 5
    
    for attempt in range(max_retries):
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            prompt = f"""
            Analyze this landscaping image titled "{title}".
            
            1. Identify the EXACT specific plant species or hardscape material shown.
            2. Estimate the MINIMUM typical market price in USD. Take the lower bound of any range.
            
            Return ONLY a JSON object:
            {{
                "specific_name": "scientific or specific name",
                "price_estimate": "$X unit"
            }}
            """
            
            response = model.generate_content([prompt, image])
            text = response.text.strip()
            
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            return json.loads(text)
            
        except Exception as e:
            if "429" in str(e):
                wait_time = base_delay * (2 ** attempt)
                logger.warning(f"⚠️  Rate limit hit. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.warning(f"⚠️  Analysis failed: {e}")
                break
                
    return {}

def main():
    endpoint, api_key, gemini_key = load_environment()
    client = QdrantClient(url=endpoint, api_key=api_key)
    
    logger.info(f"🚀 Starting cleanup for collection: {COLLECTION_NAME}")
    
    # Scroll through all points
    offset = None
    total_processed = 0
    total_updated = 0
    
    while True:
        points, next_offset = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=50,
            offset=offset,
            with_payload=True,
            with_vectors=False
        )
        
        for point in points:
            payload = point.payload
            needs_update = False
            
            # 1. Remove unwanted fields
            for field in FIELDS_TO_REMOVE:
                if field in payload:
                    del payload[field]
                    needs_update = True
            
            # 2. Handle specific_name / exact_name
            if "exact_name" in payload:
                payload["specific_name"] = payload.pop("exact_name")
                needs_update = True
                
            # 3. Enrich if missing specific_name
            if "specific_name" not in payload or not payload["specific_name"]:
                if gemini_key and payload.get("image_url"):
                    logger.info(f"🔍 Enriching point {point.id}...")
                    image = download_image(payload["image_url"])
                    if image:
                        analysis = analyze_image(image, payload.get("title", ""))
                        if analysis.get("specific_name"):
                            payload["specific_name"] = analysis["specific_name"]
                            payload["price_estimate"] = analysis.get("price_estimate", "")
                            needs_update = True
                            logger.info(f"   ✅ Identified: {payload['specific_name']}")
                            time.sleep(2) # Rate limiting
            
            if needs_update:
                client.set_payload(
                    collection_name=COLLECTION_NAME,
                    payload=payload,
                    points=[point.id]
                )
                total_updated += 1
                
        total_processed += len(points)
        logger.info(f"📊 Processed {total_processed} points (Updated: {total_updated})")
        
        offset = next_offset
        if offset is None:
            break
            
    logger.info("🎉 Cleanup complete!")

if __name__ == "__main__":
    main()
