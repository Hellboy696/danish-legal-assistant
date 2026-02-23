from __future__ import annotations

from typing import Optional

import numpy as np
import structlog
from sentence_transformers import SentenceTransformer

from app.config import settings

log = structlog.get_logger()


class EmbeddingModel:
    """Singleton wrapper around the SentenceTransformer model."""

    _model: Optional[SentenceTransformer] = None

    @classmethod
    def load(cls) -> None:
        if cls._model is None:
            log.info("embeddings.loading", model=settings.model_name)
            cls._model = SentenceTransformer(settings.model_name)
            log.info("embeddings.ready")

    @classmethod
    def encode(cls, text: str) -> list[float]:
        if cls._model is None:
            raise RuntimeError("Model not loaded. Call load() first.")
        vec: np.ndarray = cls._model.encode(text)
        return vec.tolist()

    @classmethod
    def is_loaded(cls) -> bool:
        return cls._model is not None


embedder = EmbeddingModel()
