# Dockerfile for RAG Enhancement API
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements-cloud.txt .
RUN pip install --no-cache-dir -r requirements-cloud.txt

# Copy all Python files
COPY *.py ./

# Port
ENV PORT=8080
EXPOSE 8080

# Run the API
CMD exec uvicorn rag_enhancement_api:app --host 0.0.0.0 --port $PORT
