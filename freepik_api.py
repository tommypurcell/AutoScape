import os
import logging
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO
import base64

from freepik_agent import FreepikLandscapingAgent

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Global agent instance
agent: Optional[FreepikLandscapingAgent] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources."""
    global agent
    logger.info("🚀 Starting Freepik Landscaping API...")
    
    try:
        agent = FreepikLandscapingAgent()
        logger.info("✅ Agent initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize agent: {e}")
        raise
    
    yield
    
    logger.info("👋 Shutting down Freepik Landscaping API")

# Initialize FastAPI app
app = FastAPI(
    title="Freepik Landscaping RAG API",
    description="Semantic search and AI recommendations for landscaping images from Freepik",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# REQUEST/RESPONSE MODELS
# ==========================================

class SearchRequest(BaseModel):
    """Request model for image search."""
    query: str = Field(..., description="Natural language search query")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of results to return")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Optional filters")

class SearchResponse(BaseModel):
    """Response model for image search."""
    query: str
    results: List[Dict[str, Any]]
    count: int

class RecommendationRequest(BaseModel):
    """Request model for AI recommendations."""
    query: str = Field(..., description="User's landscaping question or need")
    context: Optional[str] = Field(default=None, description="Additional context")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of results")

class RecommendationResponse(BaseModel):
    """Response model for AI recommendations."""
    query: str
    context: Optional[str]
    results: List[Dict[str, Any]]
    explanation: str
    count: int

class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    collection_name: str
    points_count: Optional[int]

# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Freepik Landscaping RAG API",
        "version": "1.0.0",
        "endpoints": {
            "search": "/api/freepik/search",
            "recommend": "/api/freepik/recommend",
            "health": "/api/freepik/health"
        }
    }

@app.post("/api/freepik/search", response_model=SearchResponse, tags=["Search"])
async def search_images(request: SearchRequest):
    """
    Perform semantic search for landscaping images.
    
    Example filters:
    - {"search_term": "tree"}
    - {"premium": false}
    - {"content_type": "photo"}
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        results = agent.search_images(
            query=request.query,
            top_k=request.top_k,
            filters=request.filters
        )
        
        return SearchResponse(
            query=request.query,
            results=results,
            count=len(results)
        )
        
    except Exception as e:
        logger.error(f"❌ Search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/api/freepik/recommend", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_recommendations(request: RecommendationRequest):
    """
    Get AI-powered landscaping recommendations with explanations.
    
    Combines semantic search with Gemini-generated insights.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        recommendation = agent.get_recommendations(
            query=request.query,
            context=request.context,
            top_k=request.top_k
        )
        
        return RecommendationResponse(
            query=recommendation["query"],
            context=recommendation.get("context"),
            results=recommendation["results"],
            explanation=recommendation["explanation"],
            count=len(recommendation["results"])
        )
        
    except Exception as e:
        logger.error(f"❌ Recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")

@app.get("/api/freepik/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check API and collection health."""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        stats = agent.get_collection_stats()
        
        return HealthResponse(
            status=stats["status"],
            collection_name=stats["collection_name"],
            points_count=stats.get("points_count")
        )
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/api/freepik/stats", tags=["Stats"])
async def get_stats():
    """Get detailed collection statistics."""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        stats = agent.get_collection_stats()
        return stats
        
    except Exception as e:
        logger.error(f"❌ Stats retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stats retrieval failed: {str(e)}")

@app.post("/api/freepik/generate-design", tags=["Generative Design"])
async def generate_design(
    place_image: UploadFile = File(...),
    concept_image: UploadFile = File(...)
):
    """
    Generate a landscape design and budget from place and concept images.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
        
    try:
        # Read images
        place_bytes = await place_image.read()
        concept_bytes = await concept_image.read()
        
        place_img = Image.open(BytesIO(place_bytes)).convert("RGB")
        concept_img = Image.open(BytesIO(concept_bytes)).convert("RGB")
        
        # Run workflow
        result = agent.generate_design_and_budget(place_img, concept_img)
        
        # Convert generated image to base64
        buffered = BytesIO()
        result["generated_design"].save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "analysis": result["analysis"],
            "generated_image_base64": img_str,
            "items": result["items"],
            "budget": result["budget"]
        }
        
    except Exception as e:
        logger.error(f"❌ Design generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Design generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    load_dotenv()
    port = int(os.getenv("PORT", 8002))
    
    logger.info(f"🌐 Starting server on port {port}")
    
    uvicorn.run(
        "freepik_api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
