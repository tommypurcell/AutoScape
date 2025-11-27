# Plant RAG System - Setup Guide

## Overview

This is a **Retrieval-Augmented Generation (RAG)** system for answering plant and agriculture questions. It combines:
- **Qdrant** vector database for knowledge storage
- **FastEmbed** for text embeddings
- **Google Gemini** for answer generation
- **FastAPI** for REST API backend

## Prerequisites

- Python 3.8+
- Qdrant Cloud account (or local Qdrant instance)
- Google Gemini API key
- Node.js (for frontend, optional)

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.plant.example .env
```

Edit `.env` and add your API keys:

```bash
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-api-key
GEMINI_API_KEY=your-gemini-key
```

### 3. Ingest Plant Knowledge

Load agricultural Q&A data into Qdrant:

```bash
# Ingest 1000 Q&A pairs (default)
python scripts/plant_ingest.py

# Or ingest more data
python scripts/plant_ingest.py --limit 5000

# Or ingest entire dataset
python scripts/plant_ingest.py --limit 0
```

**Expected output:**
```
🌱 PLANT KNOWLEDGE INGESTION PIPELINE
📂 Dataset: KisanVaani/agriculture-qa-english-only
✅ Processed 1000/1000 Q&A pairs...
🎉 Ingestion complete!
```

### 4. Verify Setup

Run the verification script to check all components:

```bash
python scripts/verify_setup.py
```

### 5. Test the System

Run end-to-end tests:

```bash
python scripts/test_plant_rag.py
```

This will test several queries like "How do I prevent tomato blight?" and show the answers.

### 6. Start the API

```bash
python plant_api.py
```

The API will start on `http://localhost:8001`

## Usage

### Command Line Interface

Ask questions directly from the command line:

```bash
python plant_agent.py "How do I grow tomatoes?"
```

### REST API

#### Query Endpoint

```bash
curl -X POST http://localhost:8001/api/plant/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I prevent tomato blight?",
    "num_sources": 5,
    "include_sources": true
  }'
```

**Response:**
```json
{
  "query": "How do I prevent tomato blight?",
  "answer": "To prevent tomato blight, ensure proper spacing...",
  "sources": [
    {
      "question": "What causes tomato blight?",
      "answer": "Tomato blight is caused by...",
      "category": "plant_diseases",
      "score": 0.89
    }
  ],
  "confidence": 0.85,
  "num_sources": 5
}
```

#### Health Check

```bash
curl http://localhost:8001/api/plant/health
```

#### Streaming Endpoint

```bash
curl -X POST http://localhost:8001/api/plant/query/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I compost?"}' \
  --no-buffer
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `QDRANT_URL` | Qdrant cluster URL | Required |
| `QDRANT_API_KEY` | Qdrant API key | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `PLANT_COLLECTION` | Collection name in Qdrant | `plant-knowledge` |
| `PLANT_DATASET` | HuggingFace dataset | `KisanVaani/agriculture-qa-english-only` |
| `TEXT_EMBEDDING_MODEL` | Embedding model | `Qdrant/clip-ViT-B-32-text` |
| `PORT` | API server port | `8001` |

### Ingestion Options

```bash
python scripts/plant_ingest.py --help
```

Options:
- `--dataset`: HuggingFace dataset name
- `--collection`: Qdrant collection name
- `--limit`: Max items to ingest (0 = all)
- `--batch-size`: Batch size for processing
- `--model`: Text embedding model

## Example Queries

Try these questions with the system:

**Crop Management:**
- "How do I prevent tomato blight?"
- "What are the best practices for growing corn?"
- "When should I harvest potatoes?"

**Soil & Composting:**
- "How do I improve soil fertility?"
- "What are the best practices for composting?"
- "How do I test soil pH?"

**Plant Care:**
- "How often should I water succulents?"
- "What causes yellow leaves on plants?"
- "How do I propagate herbs?"

**Pest Management:**
- "How do I control aphids naturally?"
- "What are organic pest control methods?"
- "How do I prevent fungal diseases?"

## Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FastAPI       │  ← plant_api.py
│   Endpoints     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PlantRAGAgent  │  ← plant_agent.py
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ Qdrant │ │  Gemini  │
│ Search │ │ Generate │
└────────┘ └──────────┘
```

## Troubleshooting

### "Collection does not exist"

Run the ingestion script:
```bash
python scripts/plant_ingest.py
```

### "No sources found"

The collection might be empty. Check:
```bash
python scripts/check_collection.py
```

### "Missing environment variables"

Make sure `.env` file exists and has all required variables:
```bash
cat .env
```

### Import errors

Reinstall dependencies:
```bash
pip install -r requirements.txt --upgrade
```

## Advanced Usage

### Using Different Datasets

You can use other agricultural datasets from HuggingFace:

```bash
# Use a different dataset
python scripts/plant_ingest.py \
  --dataset "Tasfiul/Agricultural-dataset" \
  --collection "agriculture-knowledge"
```

Then update your `.env`:
```bash
PLANT_COLLECTION=agriculture-knowledge
```

### Custom Embedding Models

Try different embedding models for better results:

```bash
python scripts/plant_ingest.py \
  --model "BAAI/bge-small-en-v1.5"
```

### Dual System Setup

You can run both the landscape design system and plant RAG simultaneously:

1. Keep existing `api.py` on port 8000
2. Run `plant_api.py` on port 8001
3. Frontend can switch between modes

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Next Steps

1. **Frontend Integration**: Connect your React app to the API
2. **Fine-tuning**: Adjust `num_sources` and `score_threshold` for better results
3. **Dataset Expansion**: Ingest additional plant datasets
4. **Caching**: Add Redis for faster repeated queries
5. **Monitoring**: Add logging and analytics

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the verification script output
3. Check API logs for detailed error messages

---

**Built with ❤️ using Qdrant, FastEmbed, and Google Gemini**
