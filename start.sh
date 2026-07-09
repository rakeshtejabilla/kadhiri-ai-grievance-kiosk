#!/usr/bin/env bash
# ============================================================
# Render startup script for Kadhiri AI Grievance Backend
# Runs DB migrations first, then starts the API server.
# ============================================================

set -e  # Exit immediately on any error

echo "=== Kadhiri AI Grievance Backend ==="
echo "=== Running Alembic database migrations ==="
alembic upgrade head

echo "=== Starting FastAPI server ==="
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --workers 1
