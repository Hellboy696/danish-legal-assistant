"""
Redis cache service for Danish Legal Assistant.
Caches popular search queries to reduce LLM API calls and latency.
Falls back gracefully when Redis is unavailable.
"""
from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Optional

import structlog

log = structlog.get_logger()

# Try to import redis; if unavailable, run without cache
try:
    import redis
    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False


class CacheService:
    """
    Thin wrapper around Redis for query-level caching.
    All methods are safe to call even if Redis is down (no-op fallback).
    """

    # TTL values
    CHAT_TTL     = 3600        # 1 hour for chat responses
    SEARCH_TTL   = 1800        # 30 min for search results
    LAWS_TTL     = 86400       # 24 hours for law listings

    def __init__(self) -> None:
        self._client: Optional[Any] = None
        self._connected = False

    def connect(self) -> None:
        """Initialize Redis connection from REDIS_URL env var."""
        if not _REDIS_AVAILABLE:
            log.warning("cache.redis_not_installed")
            return

        redis_url = os.getenv("REDIS_URL", "")
        if not redis_url:
            log.info("cache.redis_disabled", reason="REDIS_URL not set")
            return

        try:
            self._client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            # Ping to verify connection
            self._client.ping()
            self._connected = True
            log.info("cache.redis_connected", url=redis_url.split("@")[-1])
        except Exception as exc:
            log.warning("cache.redis_unavailable", error=str(exc))
            self._client = None
            self._connected = False

    @property
    def is_connected(self) -> bool:
        return self._connected and self._client is not None

    def _make_key(self, namespace: str, data: str) -> str:
        digest = hashlib.md5(data.encode()).hexdigest()
        return f"danish_legal:{namespace}:{digest}"

    def get(self, namespace: str, key_data: str) -> Optional[dict]:
        if not self.is_connected:
            return None
        try:
            raw = self._client.get(self._make_key(namespace, key_data))
            return json.loads(raw) if raw else None
        except Exception:
            return None

    def set(self, namespace: str, key_data: str, value: dict, ttl: int = CHAT_TTL) -> None:
        if not self.is_connected:
            return
        try:
            self._client.setex(
                self._make_key(namespace, key_data),
                ttl,
                json.dumps(value, default=str),
            )
        except Exception:
            pass

    def delete(self, namespace: str, key_data: str) -> None:
        if not self.is_connected:
            return
        try:
            self._client.delete(self._make_key(namespace, key_data))
        except Exception:
            pass

    def flush_namespace(self, namespace: str) -> int:
        """Delete all keys in a namespace. Returns count deleted."""
        if not self.is_connected:
            return 0
        try:
            pattern = f"danish_legal:{namespace}:*"
            keys = list(self._client.scan_iter(pattern))
            if keys:
                return self._client.delete(*keys)
            return 0
        except Exception:
            return 0

    def stats(self) -> dict:
        if not self.is_connected:
            return {"connected": False}
        try:
            info = self._client.info("stats")
            return {
                "connected": True,
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "hit_rate": round(
                    info.get("keyspace_hits", 0)
                    / max(1, info.get("keyspace_hits", 0) + info.get("keyspace_misses", 0))
                    * 100,
                    1,
                ),
            }
        except Exception:
            return {"connected": False}


# Singleton
cache = CacheService()
