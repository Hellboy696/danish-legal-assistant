# HuggingFace Space Dockerfile
# Single container: Redis + FastAPI backend + Nginx/React frontend
# HF Spaces runs on port 7860 by default

# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
# API calls go to /api/ which nginx proxies to localhost:8000
RUN VITE_API_URL="" npm run build

# ── Stage 2: Python deps + ML model ────────────────────────────────────────
FROM python:3.11-slim AS python-builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl git \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Pre-download embedding model into image (avoids runtime download)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# ── Stage 3: Runtime ────────────────────────────────────────────────────────
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl nginx redis-server supervisor \
    && rm -rf /var/lib/apt/lists/*

# Python packages + model from builder
COPY --from=python-builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=python-builder /usr/local/bin /usr/local/bin
COPY --from=python-builder /root/.cache /root/.cache

# App source
WORKDIR /app
COPY backend/ ./backend/
COPY data/  ./data/

# Frontend build
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html

# Dirs
RUN mkdir -p /app/database /var/log/supervisor /run/redis

# ── Nginx config ────────────────────────────────────────────────────────────
RUN rm -f /etc/nginx/sites-enabled/default
COPY space_configs/nginx.conf /etc/nginx/conf.d/space.conf

# ── Supervisor config ────────────────────────────────────────────────────────
COPY space_configs/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# HF Spaces requires port 7860
EXPOSE 7860

ENV PYTHONUNBUFFERED=1 \
    REDIS_URL=redis://localhost:6379 \
    CORS_ORIGINS='["http://localhost:7860","https://hellboyserhii-danish-legal-assistant.hf.space"]' \
    HF_HOME=/root/.cache/huggingface

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
