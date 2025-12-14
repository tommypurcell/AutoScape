# Dockerfile for RAG Enhancement API
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for fastembed/ONNX
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements-cloud.txt .
RUN pip install --no-cache-dir -r requirements-cloud.txt

# Copy application code
COPY rag_enhancement_api.py .
COPY video_generator.py .

# Copy parent directory modules (for imports)
COPY ../plant_catalog.py .
COPY ../freepik_agent.py .
COPY ../budget_calculator_rag.py .
COPY ../pricing_data.py .

# Port
ENV PORT=8080
EXPOSE 8080

# Run the API
CMD ["python", "-c", "import uvicorn; from rag_enhancement_api import app; uvicorn.run(app, host='0.0.0.0', port=int(__import__('os').environ.get('PORT', 8080)))"]
