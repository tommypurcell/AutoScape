# Freepik Landscaping RAG System Setup Guide

Complete guide for setting up and using the Freepik Landscaping RAG system with Qdrant vector database and Google Gemini.

## Overview

This system enables semantic search and AI-powered recommendations for landscaping images from Freepik, focusing on:
- **Whole plants** (trees, shrubs, grasses) for landscaping use
- **Hardscape materials** (pavers, stones, gravel, edging)

## Prerequisites

1. **Freepik API Key** - Get from [Freepik API](https://freepik.com/api)
2. **Qdrant Cloud Account** - Set up at [qdrant.io](https://qdrant.io)
3. **Google Gemini API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **Python 3.8+** installed

## Installation

### 1. Install Dependencies

```bash
cd /Users/dalrae/Downloads/Freepik_hackathon_25Nov22/plant-rag/frontend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
# Freepik API
FREEPIK_API_KEY=your-freepik-api-key-here

# Qdrant Configuration
VITE_QUADRANT_ENDPOINT=https://your-cluster.qdrant.io
VITE_QUADRANT_API_KEY=your-qdrant-api-key-here

# Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: API Server Port
PORT=8002
```

## Data Ingestion

### Ingest Landscaping Images from Freepik

The ingestion script fetches images across 20 landscaping categories:

**Plants:**
- Ornamental trees, shrubs, grasses
- Hedges, flowering trees, evergreens
- Palms, bamboo, topiaries, perennials

**Hardscape:**
- Paving stones, gravel, landscape rocks
- Brick pavers, concrete pavers, flagstone
- Mulch, decorative stones, retaining walls, edging

```bash
# Run ingestion (default: 200 images)
python scripts/freepik_ingest.py

# The script will:
# 1. Create 'freepik_landscaping' collection in Qdrant
# 2. Fetch images from Freepik API (20 search terms × 3 pages each)
# 3. Download thumbnails and generate CLIP embeddings
# 4. Store vectors and metadata in Qdrant
```

### Configuration Options

Edit `scripts/freepik_ingest.py` to customize:

```python
COLLECTION_NAME = "freepik_landscaping"  # Collection name
BATCH_SIZE = 20                          # Batch size for upsert
RATE_LIMIT_DELAY = 1.0                   # Delay between API calls (seconds)
LIMIT = 200                              # Total images to ingest (None = unlimited)
```

### Search Terms

The script uses curated search terms for landscaping:

```python
SEARCH_TERMS = [
    "ornamental tree full plant",
    "shrub bush whole plant landscaping",
    "paving stone landscaping",
    "garden gravel texture",
    # ... and 16 more
]
```

## Usage

### 1. Python Agent (Direct Usage)

```python
from freepik_agent import FreepikLandscapingAgent

# Initialize agent
agent = FreepikLandscapingAgent()

# Semantic search
results = agent.search_images(
    query="evergreen trees for privacy screen",
    top_k=10
)

for result in results:
    print(f"{result['title']} - Score: {result['score']:.3f}")
    print(f"URL: {result['url']}")

# AI-powered recommendations
recommendation = agent.get_recommendations(
    query="low maintenance plants for sunny garden",
    context="Small backyard in California, drought-tolerant preferred",
    top_k=5
)

print(f"AI Explanation: {recommendation['explanation']}")
print(f"Found {len(recommendation['results'])} recommendations")
```

### 2. API Server

Start the FastAPI server:

```bash
python freepik_api.py
```

The server will start on `http://localhost:8002` (or your configured PORT).

#### API Endpoints

**Search for Images**
```bash
curl -X POST http://localhost:8002/api/freepik/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ornamental grasses for landscaping",
    "top_k": 5
  }'
```

**Get AI Recommendations**
```bash
curl -X POST http://localhost:8002/api/freepik/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "shade tolerant plants",
    "context": "North-facing garden, moist soil",
    "top_k": 5
  }'
```

**Health Check**
```bash
curl http://localhost:8002/api/freepik/health
```

**Collection Stats**
```bash
curl http://localhost:8002/api/freepik/stats
```

### 3. Interactive Demo

Run the agent demo:

```bash
python freepik_agent.py
```

This will run example searches and show AI recommendations.

## Testing

Run the comprehensive test suite:

```bash
python scripts/test_freepik_rag.py
```

Tests include:
- ✅ Collection existence and schema
- ✅ Search functionality
- ✅ AI recommendations
- ✅ API endpoints (requires server running)

## Advanced Features

### Filtering Results

Filter by metadata fields:

```python
# Only free (non-premium) images
results = agent.search_images(
    query="decorative stones",
    filters={"premium": False}
)

# Filter by specific search term
results = agent.search_images(
    query="plants",
    filters={"search_term": "ornamental tree full plant"}
)
```

### API Filtering

```bash
curl -X POST http://localhost:8002/api/freepik/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "landscape materials",
    "top_k": 10,
    "filters": {"premium": false}
  }'
```

## Metadata Schema

Each image in Qdrant contains:

```python
{
    "freepik_id": str,        # Unique Freepik ID
    "title": str,             # Image title
    "url": str,               # Freepik page URL
    "image_url": str,         # Direct image URL
    "thumbnail_url": str,     # Thumbnail URL
    "search_term": str,       # Original search query
    "content_type": "photo",  # Always "photo"
    "tags": List[str],        # Image tags
    "premium": bool,          # Premium content flag
    "author": str,            # Creator name
    "source": "freepik"       # Always "freepik"
}
```

## Troubleshooting

### Collection Not Found
```bash
# Run ingestion to create collection
python scripts/freepik_ingest.py
```

### Rate Limiting
If you hit Freepik API rate limits:
1. Increase `RATE_LIMIT_DELAY` in `freepik_ingest.py`
2. Reduce `BATCH_SIZE`
3. Check your API tier limits

### No Results
- Ensure collection has data: `python scripts/test_freepik_rag.py`
- Check Qdrant connection in `.env`
- Verify embeddings are generated correctly

### Gemini Not Working
- Verify `GEMINI_API_KEY` in `.env`
- Check API quota at Google AI Studio
- Agent will still work for search without Gemini

## Architecture

```
┌─────────────────┐
│  Freepik API    │
│  (Image Source) │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  freepik_ingest.py  │
│  - Fetch images     │
│  - Generate CLIP    │
│    embeddings       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Qdrant Vector DB   │
│  Collection:        │
│  freepik_landscaping│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  freepik_agent.py   │
│  - Semantic search  │
│  - AI recommendations│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  freepik_api.py     │
│  FastAPI Server     │
│  Port: 8002         │
└─────────────────────┘
```

## Example Queries

**Plants:**
- "ornamental trees for front yard"
- "evergreen shrubs for privacy hedge"
- "drought tolerant grasses"
- "flowering trees for spring color"
- "shade tolerant ground cover"

**Hardscape:**
- "natural stone pavers for patio"
- "decorative gravel for pathways"
- "retaining wall materials"
- "landscape edging options"
- "mulch for garden beds"

## Next Steps

1. **Expand Dataset**: Increase `LIMIT` in ingestion script for more images
2. **Custom Search Terms**: Add specific plant species or materials to `SEARCH_TERMS`
3. **Frontend Integration**: Connect to React frontend for visual search interface
4. **Hybrid Search**: Combine with existing plant knowledge RAG for comprehensive landscaping advice

## Support

For issues or questions:
1. Check test results: `python scripts/test_freepik_rag.py`
2. Review logs for error messages
3. Verify all API keys are valid and active
