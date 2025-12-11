# Servers

This folder contains active server files for the AutoScape application.

## Active Servers

### rag_enhancement_api.py
- **Port**: 8002
- **Purpose**: RAG Enhancement API for landscape design
- **Status**: ✅ ACTIVE - Called by frontend (geminiService.ts)
- **Endpoints**:
  - POST `/api/enhance-with-rag` - Enhances design materials with RAG data
  - POST `/api/generate-video` - Generates transformation video with angle rotation
  - GET `/health` - Health check endpoint
- **Dependencies**:
  - `plant_catalog.py` (in root)
  - `budget_calculator_rag.py` (in root)
  - `freepik_agent.py` (in root)
  - `pricing_data.py` (in root)

## Running the Server

```bash
cd servers
python rag_enhancement_api.py
```

Or from project root:
```bash
python servers/rag_enhancement_api.py
```
