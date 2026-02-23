import re
import time
from typing import Optional

import structlog
from rank_bm25 import BM25Okapi

from app.config import settings
from app.models.database import db
from app.models.schemas import SearchRequest, SearchResponse, SearchResultItem
from app.services.law_service import law_service
from app.utils.embeddings import embedder
from app.utils.text_processing import extract_snippet, split_keywords

log = structlog.get_logger()


def _tokenize(text: str) -> list[str]:
    """Lowercase, strip punctuation, split on whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return [t for t in text.split() if len(t) > 1]


class SearchService:
    """Hybrid BM25 + LanceDB semantic search with Reciprocal Rank Fusion."""

    _bm25_docs: list[dict] = []        # all LanceDB rows cached for BM25
    _bm25_index: Optional[BM25Okapi] = None   # pre-built BM25 index (full corpus, no category filter)

    @classmethod
    def build_bm25_index(cls) -> None:
        """
        Read all LanceDB rows and build the BM25 index once at startup.
        Subsequent searches reuse cls._bm25_index instead of rebuilding it
        on every request (which was O(n) tokenisation per query call).
        """
        rows = db.table.to_pandas().to_dict(orient="records")
        cls._bm25_docs = rows
        # Pre-build the full-corpus BM25 index so searches don't rebuild it
        corpus = [
            _tokenize(
                d.get("title", "")
                + " "
                + d.get("content", "")
                + " "
                + d.get("keywords", "")
            )
            for d in rows
        ]
        cls._bm25_index = BM25Okapi(corpus)
        log.info("bm25.indexed", docs=len(rows))

    @classmethod
    def search(cls, req: SearchRequest) -> SearchResponse:
        t0 = time.perf_counter()
        query_tokens = _tokenize(req.query)

        # ----------------------------------------------------------------
        # 1. Semantic search via LanceDB
        # ----------------------------------------------------------------
        query_vec = embedder.encode(req.query)
        semantic_limit = req.top_k * 3  # over-fetch for fusion

        lancedb_query = db.table.search(query_vec).limit(semantic_limit)
        semantic_rows: list[dict] = lancedb_query.to_list()

        # Apply category + subcategory filter on Python side
        if req.category:
            semantic_rows = [r for r in semantic_rows if r["category"] == req.category]
        if req.subcategory:
            semantic_rows = [r for r in semantic_rows if r.get("subcategory") == req.subcategory]

        semantic_rank_map: dict[str, int] = {
            row["id"]: idx + 1 for idx, row in enumerate(semantic_rows)
        }

        # ----------------------------------------------------------------
        # 2. BM25 search
        # ----------------------------------------------------------------
        if req.category:
            pool = [d for d in cls._bm25_docs if d["category"] == req.category]
        else:
            pool = cls._bm25_docs

        if req.subcategory:
            pool = [d for d in pool if d.get("subcategory") == req.subcategory]

        bm25_rank_map: dict[str, int] = {}

        if pool and query_tokens and cls._bm25_index is not None:
            if req.category or req.subcategory:
                # Filtered pool: rebuild a small sub-index for the subset.
                # This is only done when a category/subcategory filter is active,
                # which is rare; the common (unfiltered) path uses the cached index.
                corpus = [
                    _tokenize(
                        d.get("title", "")
                        + " "
                        + d.get("content", "")
                        + " "
                        + d.get("keywords", "")
                    )
                    for d in pool
                ]
                bm25_idx = BM25Okapi(corpus)
                bm25_scores = bm25_idx.get_scores(query_tokens)
            else:
                # Unfiltered path: reuse the pre-built full-corpus index (fast).
                pool = cls._bm25_docs  # ensure pool matches the cached index order
                bm25_scores = cls._bm25_index.get_scores(query_tokens)

            ranked = sorted(
                zip(pool, bm25_scores),
                key=lambda x: x[1],
                reverse=True,
            )
            bm25_rank_map = {
                doc["id"]: idx + 1 for idx, (doc, _) in enumerate(ranked)
            }

        # ----------------------------------------------------------------
        # 3. Reciprocal Rank Fusion (k=60)
        # ----------------------------------------------------------------
        k = settings.rrf_k
        all_ids = set(semantic_rank_map) | set(bm25_rank_map)

        rrf_scores: dict[str, float] = {}
        for doc_id in all_ids:
            score = 0.0
            if doc_id in semantic_rank_map:
                score += 1.0 / (k + semantic_rank_map[doc_id])
            if doc_id in bm25_rank_map:
                score += 1.0 / (k + bm25_rank_map[doc_id])
            rrf_scores[doc_id] = score

        top_ids = sorted(rrf_scores, key=lambda x: rrf_scores[x], reverse=True)[
            : req.top_k
        ]

        # ----------------------------------------------------------------
        # 4. Build result items with full enrichment from JSON store
        # ----------------------------------------------------------------
        row_by_id = {row["id"]: row for row in semantic_rows}
        bm25_row_by_id = {doc["id"]: doc for doc in cls._bm25_docs}

        results: list[SearchResultItem] = []
        for doc_id in top_ids:
            row = row_by_id.get(doc_id) or bm25_row_by_id.get(doc_id)
            if row is None:
                continue

            enrichment = law_service.enrich(doc_id)
            keywords = enrichment["keywords_list"] or split_keywords(
                row.get("keywords", "")
            )
            snippet = extract_snippet(row.get("content", ""), req.query)
            rrf_score = rrf_scores[doc_id]

            results.append(
                SearchResultItem(
                    id=row["id"],
                    category=row["category"],
                    subcategory=enrichment.get("subcategory"),
                    title=row["title"],
                    title_da=enrichment.get("title_da"),
                    law_reference=row["law_reference"],
                    content=row["content"],
                    summary=enrichment.get("summary"),
                    keywords=keywords,
                    key_facts=enrichment.get("key_facts"),
                    related_laws=enrichment.get("related_laws", []),
                    source_url=enrichment.get("source_url"),
                    practical_tips=enrichment.get("practical_tips"),
                    last_verified=enrichment.get("last_verified"),
                    date_enacted=enrichment.get("date_enacted"),
                    date_updated=enrichment.get("date_updated"),
                    score=rrf_score,
                    relevance_score=round(rrf_score, 4),
                    semantic_rank=semantic_rank_map.get(doc_id),
                    bm25_rank=bm25_rank_map.get(doc_id),
                    snippet=snippet,
                )
            )

        elapsed_ms = (time.perf_counter() - t0) * 1000
        log.info(
            "search.done",
            query=req.query,
            category=req.category,
            results=len(results),
            ms=round(elapsed_ms, 1),
        )

        return SearchResponse(
            query=req.query,
            category=req.category,
            results=results,
            total=len(results),
            search_time_ms=round(elapsed_ms, 2),
            top_k=req.top_k,
        )


search_service = SearchService()
