import time
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.models.database import db
from app.models.schemas import HealthResponse
from app.routers import chat, laws, search
from app.services.cache_service import cache
from app.services.law_service import law_service
from app.services.search_service import search_service
from app.utils.embeddings import embedder
from app.utils.limiter import limiter  # shared singleton used by routers too

# Configure structured JSON logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)
log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    log.info("startup.begin")
    # Order matters: JSON → DB → model → BM25 index → cache
    law_service.load()
    db.connect()
    embedder.load()
    search_service.build_bm25_index()
    cache.connect()
    log.info("startup.complete", laws=db.count(), cache=cache.is_connected)
    yield
    log.info("shutdown")


app = FastAPI(
    title="Danish Legal Assistant API",
    description="Hybrid semantic + BM25 search over 41 Danish immigration, tax, labor, and business laws.",
    version="2.0.0",
    lifespan=lifespan,
)

# Rate limit error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_and_timing_middleware(request: Request, call_next):
    """Add security headers and X-Response-Time to every response."""
    start = time.perf_counter()
    response: Response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

    # Timing header
    response.headers["X-Response-Time"] = f"{elapsed_ms}ms"
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    # Remove server info disclosure
    if "server" in response.headers:
        del response.headers["server"]

    return response


# Routers
prefix = settings.api_prefix
app.include_router(search.router, prefix=prefix)
app.include_router(chat.router, prefix=prefix)
app.include_router(laws.router, prefix=prefix)


@app.get(f"{prefix}/health", response_model=HealthResponse, tags=["health"])
async def health():
    """Service health check including cache status."""
    ok = db.is_connected() and embedder.is_loaded()
    return HealthResponse(
        status="ok" if ok else "degraded",
        db_connected=db.is_connected(),
        model_loaded=embedder.is_loaded(),
        laws_indexed=db.count(),
    )


@app.get(f"{prefix}/cache/stats", tags=["health"])
async def cache_stats():
    """Redis cache statistics."""
    return cache.stats()
