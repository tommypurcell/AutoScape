"""
Cloud-compatible RAG Enhancement API for Landscaping Design.
Uses Qdrant's scroll/filter instead of fastembed embeddings for cloud deployment.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import os
from dotenv import load_dotenv
import logging
import traceback

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try fastembed first, fall back to keyword search
USE_EMBEDDINGS = False
try:
    from fastembed import TextEmbedding
    text_model = TextEmbedding(model_name="Qdrant/clip-ViT-B-32-text")
    USE_EMBEDDINGS = True
    logger.info("✅ Fastembed loaded - using semantic search")
except Exception as e:
    logger.warning(f"⚠️ Fastembed not available ({e}) - using keyword search fallback")
    text_model = None

from qdrant_client import QdrantClient
from qdrant_client.http import models

# Initialize Qdrant
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "freepik_landscaping")

qdrant_client = None
if QDRANT_URL and QDRANT_API_KEY:
    try:
        qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        logger.info(f"✅ Connected to Qdrant collection: {COLLECTION_NAME}")
    except Exception as e:
        logger.error(f"❌ Qdrant connection failed: {e}")

app = FastAPI(title="RAG Enhancement API (Cloud)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DesignItem(BaseModel):
    name: str
    quantity: Union[int, float, str] = 1
    description: Optional[str] = None


class EnhancementRequest(BaseModel):
    plants: List[DesignItem] = []
    hardscape: List[DesignItem] = []
    features: List[DesignItem] = []
    structures: List[DesignItem] = []
    furniture: List[DesignItem] = []


def search_by_keyword(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Search Qdrant using keyword matching on payload fields."""
    if not qdrant_client:
        return []
    
    try:
        # Use scroll with keyword filter on specific_name or title
        keywords = query.lower().split()
        
        # Search using scroll and filter results locally
        all_points, _ = qdrant_client.scroll(
            collection_name=COLLECTION_NAME,
            limit=500,  # Get a batch
            with_payload=True,
            with_vectors=False
        )
        
        # Score each point based on keyword matches
        scored_results = []
        for point in all_points:
            payload = point.payload or {}
            searchable_text = f"{payload.get('specific_name', '')} {payload.get('title', '')} {payload.get('description', '')}".lower()
            
            # Count keyword matches
            matches = sum(1 for kw in keywords if kw in searchable_text)
            if matches > 0:
                scored_results.append({
                    "score": matches / len(keywords),
                    "specific_name": payload.get("specific_name"),
                    "title": payload.get("title"),
                    "image_url": payload.get("image_url"),
                    "price_estimate": payload.get("price_estimate"),
                    "description": payload.get("description"),
                    **payload
                })
        
        # Sort by score and return top_k
        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:top_k]
        
    except Exception as e:
        logger.error(f"Keyword search failed: {e}")
        return []


def search_by_embedding(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Search Qdrant using fastembed embeddings."""
    if not qdrant_client or not text_model:
        return []
    
    try:
        # Generate query embedding
        embeddings = list(text_model.embed([query]))
        query_vector = embeddings[0].tolist()
        
        # Search
        search_results = qdrant_client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=top_k
        ).points
        
        results = []
        for hit in search_results:
            results.append({
                "score": hit.score,
                "specific_name": hit.payload.get("specific_name"),
                "title": hit.payload.get("title"),
                "image_url": hit.payload.get("image_url"),
                "price_estimate": hit.payload.get("price_estimate"),
                "description": hit.payload.get("description"),
                **hit.payload
            })
        
        return results
        
    except Exception as e:
        logger.error(f"Embedding search failed: {e}")
        return []


def search_plants(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Search for plants using best available method."""
    if USE_EMBEDDINGS:
        return search_by_embedding(query, top_k)
    return search_by_keyword(query, top_k)


@app.post("/api/enhance-with-rag")
async def enhance_with_rag(request: EnhancementRequest):
    """Enhance a design with RAG data."""
    if not qdrant_client:
        raise HTTPException(status_code=500, detail="Qdrant not connected")
    
    try:
        plant_palette = []
        
        for plant_item in request.plants:
            results = search_plants(plant_item.name, top_k=1)
            
            if results:
                plant = results[0]
                
                # Handle quantity
                quantity = 1
                if isinstance(plant_item.quantity, (int, float)):
                    quantity = int(plant_item.quantity)
                elif isinstance(plant_item.quantity, str) and plant_item.quantity.isdigit():
                    quantity = int(plant_item.quantity)
                
                # Get price
                unit_price = plant.get('price_estimate', '$25')
                if not unit_price:
                    unit_price = '$25'
                
                # Calculate total
                try:
                    price_num = float(unit_price.replace('$', '').replace(',', '').split()[0])
                    total = price_num * quantity
                    total_estimate = f'${total:.0f}'
                except:
                    total_estimate = f'{unit_price} x{quantity}'
                
                plant_palette.append({
                    "common_name": plant.get('specific_name') or plant.get('title', ''),
                    "botanical_name": "",
                    "image_url": plant.get('image_url', ''),
                    "quantity": quantity,
                    "size": "5-gallon",
                    "unit_price": unit_price,
                    "total_estimate": total_estimate,
                    "rag_verified": True,
                    "original_name": plant_item.name,
                    "description": plant.get('description', '')
                })
        
        return {
            "success": True,
            "plantPalette": plant_palette,
            "rag_enhanced": True,
            "search_method": "semantic" if USE_EMBEDDINGS else "keyword"
        }
    
    except Exception as e:
        logger.error(f"Enhancement failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "rag_available": qdrant_client is not None,
        "search_method": "semantic" if USE_EMBEDDINGS else "keyword",
        "collection": COLLECTION_NAME
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    logger.info(f"🚀 Starting RAG Enhancement API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
