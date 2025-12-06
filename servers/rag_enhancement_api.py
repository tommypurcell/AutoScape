"""
RAG Enhancement API for Landscaping Design.
Enriches material lists with RAG plant data, images, and pricing.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import os
from dotenv import load_dotenv
import sys
import traceback
import google.generativeai as genai

load_dotenv()

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

# --- Data Models ---

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
    design_style: Optional[str] = "Modern" # New field for Curated RAG
    zip_code: Optional[str] = None # For Stewardship/Native check

class NarrativeRequest(BaseModel):
    design_style: str
    plant_palette: List[Dict[str, Any]]
    location_type: Optional[str] = "Garden"

# --- Curatorial Logic ---

STYLE_VECTORS = {
    "Modern": ["architectural", "clean", "minimalist", "linear", "structured", "geometric"],
    "Cottage": ["wispy", "flowering", "wild", "soft", "romantic", "informal", "colorful"],
    "Mediterranean": ["drought-tolerant", "silver-foliage", "warm", "rugged", "aromatic", "olive", "lavender"],
    "Tropical": ["lush", "bold-leaf", "vibrant", "dense", "exotic", "fern", "palm"],
    "Native": ["wild", "local", "resilient", "prairie", "naturalistic", "meadow", "pollinator"]
}

@app.post("/api/enhance-with-rag")
async def enhance_with_rag(request: EnhancementRequest):
    """
    Enhance a design with RAG data.
    Focuses on identifying plants and providing accurate pricing, filtered by STYLE.
    """
    if not PlantCatalog or not calculate_budget_with_rag:
        raise HTTPException(status_code=500, detail="RAG modules not available")
    
    try:
        catalog = PlantCatalog()
        plant_palette = []
        
        # Get style keywords to steer the search
        style_keywords = STYLE_VECTORS.get(request.design_style, [])
        style_context = " ".join(style_keywords)
        
        # Process Plants
        for plant_item in request.plants:
            # Curated Search strategy:
            # Append style keywords to the query to influence vector retrieval.
            # e.g. "Tree" -> "Modern architectural geometric Tree"
            
            query = f"{style_context} {plant_item.name}"
            # Only use style context if the item name is somewhat generic (less than 3 words)
            # If user asks for "Japanese Maple", style context is nice but optional.
            # If user asks for "Tree", style context is vital.
            
            # Query RAG using the curated query
            rag_results = catalog.find_plant(query, top_k=1)
            
            # Fallback: if curated search yields nothing (unlikely with RAG but possible), try generic
            if not rag_results:
                 rag_results = catalog.find_plant(plant_item.name, top_k=1)
            
            if rag_results and len(rag_results) > 0:
                plant = rag_results[0]
                
                # Handle quantity (it might be int, float, or string)
                quantity = 1
                if isinstance(plant_item.quantity, (int, float)):
                    quantity = int(plant_item.quantity)
                elif isinstance(plant_item.quantity, str) and plant_item.quantity.isdigit():
                    quantity = int(plant_item.quantity)
                
                 # Mock Stewardship Audit (Native Check)
                # In a real app, this would check a native plant DB against the zip_code
                is_native = request.design_style == "Native" or "native" in plant.get('tags', [])
                
                plant_palette.append({
                    "common_name": plant['common_name'],
                    "botanical_name": plant['botanical_name'],
                    "image_url": plant['image_url'],
                    "quantity": quantity,
                    "size": "5-gallon",  # Default size
                    "unit_price": plant.get('price_estimate', "$0"), # Use RAG price
                    "total_estimate": "$0", # Placeholder
                    "rag_verified": True,
                    "original_name": plant_item.name,
                    "role": "Curated Selection", # Could use AI to generate role
                    "is_native": is_native
                })
        
        # TODO: Process hardscape/features for budget if needed
        
        return {
            "success": True,
            "plantPalette": plant_palette,
            "rag_enhanced": True,
            "curated_style": request.design_style
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-narrative")
async def generate_narrative(request: NarrativeRequest):
    """
    Generates a high-end, editorial design narrative based on the curated palette.
    """
    try:
        # Initialize Gemini for narrative generation
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
             return {"success": False, "narrative": "API Key missing for narrative generation."}
             
        genai.configure(api_key=api_key)
        gemini = genai.GenerativeModel("gemini-2.0-flash")
        
        plants_str = ", ".join([p.get('common_name', 'plants') for p in request.plant_palette[:5]])
        
        prompt = f"""
        You are the Lead Editor of 'Madroño', a high-end landscape design publication.
        Write a short, evocative design narrative (approx. 60-80 words) for a new landscape project.
        
        Design Style: {request.design_style}
        Key Flora: {plants_str}
        Context: {request.location_type}
        
        Tone: Poetic, architectural, sophisticated. 
        - Avoid generic real estate language like "curb appeal", "backyard oasis", or "stunning".
        - Focus on texture, light, form, and the dialogue between nature and the built environment.
        - Use architectural terms like "threshold," "volume," "vernacular," "canopy," "filtration."
        
        Output only the narrative text.
        """
        
        response = gemini.generate_content(prompt)
        narrative = response.text.replace('"', '').strip()
        
        return {"success": True, "narrative": narrative}
        
    except Exception as e:
        print(f"Narrative Error: {e}")
        return {"success": False, "narrative": f"A curated selection of {request.design_style} flora designed to harmonize with the local vernacular."}


class VideoRequest(BaseModel):
    original_image: str  # Base64 encoded
    redesign_image: str  # Base64 encoded
    duration: int = 5

@app.post("/api/generate-video")
async def generate_video(request: VideoRequest):
    """Generate transformation video with angle rotation"""
    try:
        print(f"📥 Received video request - original: {len(request.original_image)} chars, redesign: {len(request.redesign_image)} chars")
        # Import inside function to avoid circular imports or startup errors if module issues
        from video_generator import generate_transformation_video
        
        result = generate_transformation_video(
            request.original_image,
            request.redesign_image,
            request.duration
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
