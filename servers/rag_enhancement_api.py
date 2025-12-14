"""
RAG Enhancement API for Landscaping Design.
Enriches material lists with RAG plant data, images, and pricing.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

import sys
import os
import traceback

# Ensure parent directory (project root) is in path for importing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our RAG modules
try:
    from plant_catalog import PlantCatalog
    from budget_calculator_rag import calculate_budget_with_rag
    print("✅ Successfully imported RAG modules")
except Exception as e:
    print(f"❌ Import failed: {e}")
    traceback.print_exc()
    PlantCatalog = None
    calculate_budget_with_rag = None

print(f"DEBUG: PlantCatalog = {PlantCatalog}")
print(f"DEBUG: calculate_budget_with_rag = {calculate_budget_with_rag}")

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class CatchUnicodeErrorMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except UnicodeDecodeError:
            print("❌ UnicodeDecodeError caught! The client likely sent binary data (e.g. an image) to an endpoint expecting JSON.")
            print("   Please refresh the frontend to ensure you are using the latest code.")
            return Response("Invalid request body encoding. Expected JSON.", status_code=400)

app = FastAPI(title="RAG Enhancement API")

app.add_middleware(CatchUnicodeErrorMiddleware)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import List, Dict, Any, Optional, Union

class DesignItem(BaseModel):
    name: str
    quantity: Union[int, float, str] = 1
    description: Optional[str] = None

class Quantities(BaseModel):
    sod_sqft: Optional[float] = 0
    mulch_sqft: Optional[float] = 0
    gravel_sqft: Optional[float] = 0
    pavers_sqft: Optional[float] = 0
    deck_sqft: Optional[float] = 0

class EnhancementRequest(BaseModel):
    plants: List[DesignItem] = []
    hardscape: List[DesignItem] = []
    features: List[DesignItem] = []
    structures: List[DesignItem] = []
    furniture: List[DesignItem] = []
    quantities: Optional[Quantities] = None

@app.post("/api/enhance-with-rag")
async def enhance_with_rag(request: EnhancementRequest):
    """
    Enhance a design with RAG data.
    Focuses on identifying plants and providing accurate pricing.
    """
    if not PlantCatalog or not calculate_budget_with_rag:
        raise HTTPException(status_code=500, detail="RAG modules not available")
    
    try:
        catalog = PlantCatalog()
        plant_palette = []
        
        # Process Plants
        for plant_item in request.plants:
            # Query RAG for this item
            rag_results = catalog.find_plant(plant_item.name, top_k=1)
            
            if rag_results and len(rag_results) > 0:
                plant = rag_results[0]
                
                # Handle quantity (it might be int, float, or string)
                quantity = 1
                if isinstance(plant_item.quantity, (int, float)):
                    quantity = int(plant_item.quantity)
                elif isinstance(plant_item.quantity, str) and plant_item.quantity.isdigit():
                    quantity = int(plant_item.quantity)
                
                plant_palette.append({
                    "common_name": plant['common_name'],
                    "botanical_name": plant['botanical_name'],
                    "image_url": plant['image_url'],
                    "quantity": quantity,
                    "size": "5-gallon",  # Default size
                    "unit_price": "$0", # Placeholder, would come from pricing service
                    "total_estimate": "$0", # Placeholder
                    "rag_verified": True,
                    "original_name": plant_item.name
                })
        
        # TODO: Process hardscape/features for budget if needed
        
        return {
            "success": True,
            "plantPalette": plant_palette,
            "rag_enhanced": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VideoRequest(BaseModel):
    original_image: str  # Base64 encoded
    redesign_image: str  # Base64 encoded
    duration: int = 5
    provider: str = "gemini"

@app.post("/api/generate-video")
async def generate_video(request: VideoRequest):
    """Generate transformation video with angle rotation"""
    try:
        print(f"📥 Received video request - original: {len(request.original_image)} chars, redesign: {len(request.redesign_image)} chars, provider: {request.provider}")
        # Import inside function to avoid circular imports or startup errors if module issues
        from video_generator import generate_transformation_video
        
        result = generate_transformation_video(
            request.original_image,
            request.redesign_image,
            request.duration,
            request.provider
        )
        
        if result.get("status") == "completed":
            return {"success": True, "video_url": result["video_url"]}
        else:
            raise HTTPException(
                status_code=500, 
                detail=result.get("error", "Video generation failed")
            )
    except Exception as e:
        print(f"❌ Video generation error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "rag_available": PlantCatalog is not None}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("RAG_API_PORT", "8002"))
    print(f"🚀 Starting RAG Enhancement API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
