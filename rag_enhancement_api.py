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

# Import our RAG modules
try:
    from plant_catalog import PlantCatalog
    from budget_calculator_rag import calculate_budget_with_rag
except ImportError as e:
    print(f"⚠️ Import warning: {e}")
    PlantCatalog = None
    calculate_budget_with_rag = None

app = FastAPI(title="RAG Enhancement API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MaterialItem(BaseModel):
    name: str
    quantity: str
    unitCost: str
    totalCost: str
    notes: str

class EnhancementRequest(BaseModel):
    materials: List[MaterialItem]

@app.post("/api/enhance-with-rag")
async def enhance_with_rag(request: EnhancementRequest):
    """
    Enhance a materials list with RAG data.
    Returns plant images, botanical names, and accurate pricing.
    """
    if not PlantCatalog or not calculate_budget_with_rag:
        raise HTTPException(status_code=500, detail="RAG modules not available")
    
    try:
        catalog = PlantCatalog()
        plant_palette = []
        
        for material in request.materials:
            # Skip labor and generic items
            if any(skip in material.name.lower() for skip in ['labor', 'installation', 'delivery', 'permit']):
                continue
            
            # Query RAG for this item
            rag_results = catalog.find_plant(material.name, top_k=1)
            
            if rag_results and len(rag_results) > 0:
                plant = rag_results[0]
                
                # Parse quantity from string
                qty_str = material.quantity.lower()
                quantity = 1
                if 'sq ft' in qty_str or 'sqft' in qty_str:
                    # Extract number
                    import re
                    nums = re.findall(r'\d+', qty_str)
                    quantity = int(nums[0]) if nums else 1
                elif 'plants' in qty_str or 'trees' in qty_str or 'shrubs' in qty_str:
                    nums = re.findall(r'\d+', qty_str)
                    quantity = int(nums[0]) if nums else 1
                
                plant_palette.append({
                    "common_name": plant['common_name'],
                    "botanical_name": plant['botanical_name'],
                    "image_url": plant['image_url'],
                    "quantity": quantity,
                    "size": "5-gallon",  # Default size
                    "unit_price": material.unitCost,
                    "total_estimate": material.totalCost,
                    "rag_verified": True,
                    "original_name": material.name
                })
        
        return {
            "success": True,
            "plantPalette": plant_palette,
            "rag_enhanced": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "rag_available": PlantCatalog is not None}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("RAG_API_PORT", "8002"))
    print(f"🚀 Starting RAG Enhancement API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
