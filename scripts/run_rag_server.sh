#!/usr/bin/env bash
# Helper to run the RAG enhancement API locally.
# It will create a virtualenv in servers/ if missing, install deps, then start uvicorn.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="${ROOT_DIR}/servers"

cd "$SERVER_DIR"

# Prefer Python 3.12 if available, otherwise fall back to python3
PYTHON_BIN="${PYTHON_BIN:-}"
if [[ -z "${PYTHON_BIN}" ]]; then
  if command -v python3.12 >/dev/null 2>&1; then
    PYTHON_BIN="python3.12"
  else
    PYTHON_BIN="python3"
  fi
fi

# Create venv if missing
if [[ ! -d "venv" ]]; then
  echo "Creating virtualenv with ${PYTHON_BIN}..."
  "${PYTHON_BIN}" -m venv venv
fi

source venv/bin/activate

# Install/update dependencies
pip install --upgrade pip >/dev/null
pip install -r ../requirements.txt

# Run the FastAPI server
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8002}"
echo "Starting RAG server on ${HOST}:${PORT}..."
exec uvicorn rag_enhancement_api:app --host "${HOST}" --port "${PORT}"
