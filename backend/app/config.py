from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parents[1] / ".env"),
        env_file_encoding="utf-8",
        env_ignore_empty=True,
    )

    # ── Environment ───────────────────────────────────────────────────────────
    env: str = "development"  # development | staging | production

    # ── Paths (resolved relative to repo root) ────────────────────────────────
    db_path: str = str(Path(__file__).parents[2] / "database" / "danish_legal_db")
    laws_json_path: str = str(Path(__file__).parents[2] / "data" / "danish_laws_production.json")
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"

    # ── API ───────────────────────────────────────────────────────────────────
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:80",
        "http://localhost",
    ]

    # ── Rate limiting ─────────────────────────────────────────────────────────
    rate_limit: str = "20/minute"  # per IP

    # ── Search defaults ───────────────────────────────────────────────────────
    default_top_k: int = 3
    max_top_k: int = 10
    rrf_k: int = 60  # RRF constant

    # ── Pagination ────────────────────────────────────────────────────────────
    default_page_size: int = 10
    max_page_size: int = 50

    # ── LLM (Claude) ──────────────────────────────────────────────────────────
    anthropic_api_key: str = ""
    llm_model: str = "claude-sonnet-4-5-20250929"
    llm_max_tokens: int = 2048
    llm_temperature: float = 0.3
    max_conversation_turns: int = 10

    # ── Redis cache ───────────────────────────────────────────────────────────
    redis_url: str = ""  # e.g. redis://localhost:6379

    # ── Monitoring (optional) ─────────────────────────────────────────────────
    sentry_dsn: str = ""  # Sentry DSN for error tracking
    log_level: str = "info"  # debug | info | warning | error


settings = Settings()
