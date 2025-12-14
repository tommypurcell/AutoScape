# RAG API Deployment Guide

## Overview
The RAG Enhancement API is a Python FastAPI server that provides:
- Plant/material lookup from Qdrant vector database
- Price estimates from RAG data
- Image URLs for materials

## Local Development
```bash
cd /Users/dalrae/Downloads/Freepik_hackathon_25Nov22/plant-rag/frontend/servers
python rag_enhancement_api.py
```
Server runs on `http://localhost:8002`

## Production Deployment (Google Cloud Run)

### Prerequisites
1. Google Cloud SDK installed
2. Docker installed
3. Project configured: `gcloud config set project autoscape-dfc00`

### Option 1: Deploy to Cloud Run (Recommended)

1. **Build and push Docker image:**
```bash
cd /Users/dalrae/Downloads/Freepik_hackathon_25Nov22/plant-rag/frontend/servers

# Build image
docker build -t gcr.io/autoscape-dfc00/rag-api:latest .

# Push to Container Registry
docker push gcr.io/autoscape-dfc00/rag-api:latest
```

2. **Deploy to Cloud Run:**
```bash
gcloud run deploy rag-api \
  --image gcr.io/autoscape-dfc00/rag-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "QDRANT_URL=https://d96eab71-b548-4424-8c50-0ebfaeacfa7e.us-east4-0.gcp.cloud.qdrant.io" \
  --set-secrets "QDRANT_API_KEY=QDRANT_API_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

3. **Update frontend environment:**
Add to `.env.production`:
```
VITE_RAG_API_URL=https://rag-api-XXXXX-uc.a.run.app
```

### Option 2: Use Render.com (Easy)

1. Create a new Web Service on render.com
2. Connect your GitHub repo
3. Set build command: `pip install -r requirements-cloud.txt`
4. Set start command: `python -c "import uvicorn; from rag_enhancement_api import app; uvicorn.run(app, host='0.0.0.0', port=int(__import__('os').environ.get('PORT', 8080)))"`
5. Add environment variables:
   - `QDRANT_URL`
   - `QDRANT_API_KEY`

### Option 3: Skip RAG in Production (Current Fallback)

The frontend is configured to gracefully handle when RAG is unavailable:
- Material list shows AI-generated estimates instead of RAG prices
- Images show placeholder icons
- Cost calculations use Gemini-generated estimates

This is the current production behavior until RAG is deployed.

## Environment Variables Required
```
QDRANT_URL=https://your-qdrant-instance.qdrant.io
QDRANT_API_KEY=your_api_key
QDRANT_COLLECTION=freepik_landscaping  # optional, defaults to this
GEMINI_API_KEY=your_gemini_key  # optional, for AI features
```

## Testing the API
```bash
# Health check
curl http://localhost:8002/health

# Test RAG enhancement
curl -X POST http://localhost:8002/api/enhance-with-rag \
  -H "Content-Type: application/json" \
  -d '{"plants": [{"name": "Japanese Maple", "quantity": 2}]}'
```
