from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Optional

import lancedb
import structlog

from app.config import settings

log = structlog.get_logger()

# File that stores the last-built JSON hash next to the LanceDB directory.
# When the hash changes (content/keywords updated), the table is rebuilt.
_HASH_FILE = Path(settings.db_path) / "_json_hash.txt"


def _compute_json_hash(laws: list[dict]) -> str:
    """SHA-256 of the content + keywords fields for all laws (sorted by id)."""
    stable = sorted(
        [
            {
                "id": law["id"],
                "content": law.get("content", ""),
                "keywords": law.get("keywords", []),
                "title": law.get("title", ""),
            }
            for law in laws
        ],
        key=lambda x: x["id"],
    )
    raw = json.dumps(stable, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode()).hexdigest()


def _read_stored_hash() -> str:
    try:
        return _HASH_FILE.read_text().strip()
    except FileNotFoundError:
        return ""


def _write_stored_hash(h: str) -> None:
    _HASH_FILE.parent.mkdir(parents=True, exist_ok=True)
    _HASH_FILE.write_text(h)


class Database:
    """Singleton wrapper around the LanceDB connection.

    Rebuild triggers (either condition forces a full rebuild):
      1. Row count in the table != number of laws in JSON  (new/removed laws)
      2. SHA-256 hash of content+keywords changed           (updated text)
    """

    _instance: Optional["Database"] = None
    _db = None
    _table = None

    @classmethod
    def get_instance(cls) -> "Database":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def connect(self) -> None:
        """Open the LanceDB connection; rebuild when laws or content changed."""
        from app.utils.embeddings import embedder

        self._db = lancedb.connect(settings.db_path)

        laws = self._load_laws_json()
        expected = len(laws)
        existing_count = self._existing_count()
        current_hash = _compute_json_hash(laws)
        stored_hash = _read_stored_hash()

        count_ok = existing_count == expected
        hash_ok = current_hash == stored_hash

        if count_ok and hash_ok:
            self._table = self._db.open_table("danish_laws")
            log.info(
                "lancedb.connected",
                table="danish_laws",
                rows=existing_count,
                hash=current_hash[:12],
            )
            return

        reason = []
        if not count_ok:
            reason.append(f"row count {existing_count}→{expected}")
        if not hash_ok:
            reason.append("content/keywords changed")

        log.info(
            "lancedb.rebuild",
            reason=", ".join(reason),
            existing=existing_count,
            expected=expected,
        )
        embedder.load()
        self._table = self._build_table(laws, embedder)
        _write_stored_hash(current_hash)
        log.info("lancedb.built", rows=self._table.count_rows(), hash=current_hash[:12])

    def _existing_count(self) -> int:
        try:
            tbl = self._db.open_table("danish_laws")
            return tbl.count_rows()
        except Exception:
            return 0

    def _load_laws_json(self) -> list[dict]:
        path = Path(settings.laws_json_path)
        with path.open(encoding="utf-8") as f:
            raw = json.load(f)
        if isinstance(raw, dict) and "laws" in raw:
            return raw["laws"]
        return raw

    def _build_table(self, laws: list[dict], embedder) -> lancedb.table.Table:
        """Create or overwrite the LanceDB table with fresh embeddings.

        Embedding text = title + content + keywords (all three fields).
        Including keywords in the embedding significantly improves recall for
        synonym queries like 'fired' → termination/A-kasse laws.
        """
        records = []
        for i, law in enumerate(laws):
            keywords_str = " ".join(law.get("keywords", []))
            # title + content + keywords → richer semantic embedding
            embed_text = (
                f"{law['title']} {law.get('content', '')} {keywords_str}"
            )
            vector = embedder.encode(embed_text)
            records.append(
                {
                    "id": law["id"],
                    "category": law["category"],
                    "subcategory": law.get("subcategory", ""),
                    "title": law["title"],
                    "law_reference": law["law_reference"],
                    "content": law["content"],
                    "keywords": keywords_str,
                    "vector": vector,
                }
            )
            if (i + 1) % 10 == 0:
                log.info(
                    "lancedb.embedding_progress",
                    done=i + 1,
                    total=len(laws),
                )

        try:
            self._db.drop_table("danish_laws")
        except Exception:
            pass

        return self._db.create_table("danish_laws", data=records)

    @property
    def table(self):
        if self._table is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._table

    def is_connected(self) -> bool:
        return self._table is not None

    def count(self) -> int:
        if self._table is None:
            return 0
        return self._table.count_rows()


db = Database.get_instance()
