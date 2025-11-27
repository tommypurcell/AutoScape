#!/usr/bin/env python3
"""
Plant RAG API - FastAPI Backend
================================
REST API for plant and agriculture question answering using RAG.

Endpoints:
- POST /api/plant/query - Answer a plant-related question
- POST /api/plant/query/stream - Streaming version with progress updates
- GET /api/plant/health - Health check and system status

Usage:
    python plant_api.py
    
Then access at: http://localhost:8001
"""

import os
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from plant_agent import PlantRAGAgent

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Plant RAG API",
    description="Question answering API for plant and agriculture knowledge",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global agent instance
agent: Optional[PlantRAGAgent] = None


def get_agent() -> PlantRAGAgent:
    """Get or initialize the global agent instance."""
    global agent
    if agent is None:
        qdrant_url = os.getenv("QDRANT_URL") or os.getenv("VITE_QUADRANT_ENDPOINT")
        qdrant_api_key = os.getenv("QDRANT_API_KEY") or os.getenv("VITE_QUADRANT_API_KEY")
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        collection_name = os.getenv("PLANT_COLLECTION", "plant-knowledge")
        
        if not all([qdrant_url, qdrant_api_key, gemini_api_key]):
            raise RuntimeError("Missing required environment variables")
        
        agent = PlantRAGAgent(
            qdrant_url=qdrant_url,
            qdrant_api_key=qdrant_api_key,
            gemini_api_key=gemini_api_key,
            collection_name=collection_name
        )
    return agent


# Request/Response Models
class QueryRequest(BaseModel):
    """Request model for plant queries."""
    query: str
    num_sources: int = 5
    include_sources: bool = True


class QueryResponse(BaseModel):
    """Response model for plant queries."""
    query: str
    answer: str
    sources: list
    confidence: float
    num_sources: int


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    collection: str
    collection_exists: bool
    collection_points: Optional[int] = None
    message: str


# Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Plant RAG API",
        "version": "1.0.0",
        "description": "Question answering API for plant and agriculture knowledge",
        "endpoints": {
            "query": "/api/plant/query",
            "query_stream": "/api/plant/query/stream",
            "health": "/api/plant/health"
        }
    }


@app.post("/api/plant/query", response_model=QueryResponse)
async def query_plant(request: QueryRequest):
    """
    Answer a plant-related question using RAG.
    
    Args:
        request: QueryRequest with question and options
        
    Returns:
        QueryResponse with answer, sources, and confidence
    """
    try:
        agent = get_agent()
        
        logger.info(f"Processing query: {request.query}")
        
        result = agent.answer_question(
            query=request.query,
            num_sources=request.num_sources,
            include_sources=request.include_sources
        )
        
        return QueryResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/plant/query/stream")
async def query_plant_stream(request: QueryRequest):
    """
    Streaming version of plant query endpoint.
    Yields progress updates as the query is processed.
    """
    import json
    
    async def generate_stream():
        try:
            agent = get_agent()
            
            # Send initial status
            yield f"data: {json.dumps({'status': 'searching', 'message': 'Searching knowledge base...'})}\n\n"
            
            # Search for sources
            sources = agent.search_knowledge(
                query=request.query,
                limit=request.num_sources
            )
            
            yield f"data: {json.dumps({'status': 'found_sources', 'num_sources': len(sources)})}\n\n"
            
            # Generate answer
            yield f"data: {json.dumps({'status': 'generating', 'message': 'Generating answer...'})}\n\n"
            
            result = agent.generate_answer(
                query=request.query,
                sources=sources,
                include_sources=request.include_sources
            )
            
            # Send final result
            yield f"data: {json.dumps({'status': 'complete', 'result': result})}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming query: {e}")
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream"
    )


@app.get("/api/plant/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    Verifies Qdrant connection and collection status.
    """
    try:
        agent = get_agent()
        
        # Check if collection exists
        collection_exists = agent.qdrant_client.collection_exists(
            agent.collection_name
        )
        
        if collection_exists:
            # Get collection info
            collection_info = agent.qdrant_client.get_collection(
                agent.collection_name
            )
            points_count = collection_info.points_count
            
            return HealthResponse(
                status="healthy",
                collection=agent.collection_name,
                collection_exists=True,
                collection_points=points_count,
                message=f"System operational. Collection has {points_count:,} knowledge entries."
            )
        else:
            return HealthResponse(
                status="warning",
                collection=agent.collection_name,
                collection_exists=False,
                message=f"Collection '{agent.collection_name}' does not exist. Please run data ingestion."
            )
            
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            collection="unknown",
            collection_exists=False,
            message=f"System error: {str(e)}"
        )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize agent on startup."""
    logger.info("=" * 80)
    logger.info("🌱 Plant RAG API Starting...")
    logger.info("=" * 80)
    
    try:
        get_agent()
        logger.info("✅ Agent initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize agent: {e}")
        logger.error("API will start but queries will fail until configuration is fixed")
    
    logger.info("=" * 80)
    logger.info("🚀 API is ready!")
    logger.info("📍 Endpoints:")
    logger.info("   • POST /api/plant/query - Answer questions")
    logger.info("   • POST /api/plant/query/stream - Streaming answers")
    logger.info("   • GET /api/plant/health - Health check")
    logger.info("=" * 80)


if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.getenv("PORT", "8001"))
    
    logger.info(f"Starting server on port {port}...")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
