import json
import math
from pathlib import Path
from typing import Optional

import structlog

from app.config import settings
from app.models.schemas import (
    CategoriesResponse,
    CategoryInfo,
    LawDetail,
    LawSummary,
    LawsListResponse,
    StatsResponse,
    SubcategoryInfo,
)

log = structlog.get_logger()

_CATEGORY_LABELS = {
    "immigration": "Immigration",
    "tax": "Tax",
    "labor": "Labor",
    "business": "Business",
}


class LawService:
    """In-memory law store loaded from danish_laws_production.json at startup."""

    _laws: list[dict] = []
    _laws_by_id: dict[str, dict] = {}
    _metadata: dict = {}

    @classmethod
    def load(cls) -> None:
        path = Path(settings.laws_json_path)
        with path.open(encoding="utf-8") as f:
            raw = json.load(f)

        # Support both production format {metadata, laws} and flat array
        if isinstance(raw, dict) and "laws" in raw:
            cls._laws = raw["laws"]
            cls._metadata = raw.get("metadata", {})
        else:
            cls._laws = raw
            cls._metadata = {}

        cls._laws_by_id = {law["id"]: law for law in cls._laws}
        log.info("law_service.loaded", count=len(cls._laws))

    @classmethod
    def get_all(
        cls,
        category: Optional[str] = None,
        subcategory: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> LawsListResponse:
        filtered = cls._laws

        if category:
            filtered = [l for l in filtered if l["category"] == category]

        if subcategory:
            filtered = [l for l in filtered if l.get("subcategory") == subcategory]

        if search:
            q = search.lower()
            filtered = [
                l for l in filtered
                if q in l["title"].lower()
                or q in l.get("content", "").lower()
                or any(q in kw.lower() for kw in l.get("keywords", []))
                or q in l.get("summary", "").lower()
            ]

        total = len(filtered)
        total_pages = max(1, math.ceil(total / page_size))
        start = (page - 1) * page_size
        page_laws = filtered[start: start + page_size]

        summaries = [
            LawSummary(
                id=l["id"],
                category=l["category"],
                subcategory=l.get("subcategory"),
                title=l["title"],
                title_da=l.get("title_da"),
                law_reference=l["law_reference"],
                summary=l.get("summary"),
                keywords=l.get("keywords", []),
                key_facts=l.get("key_facts"),
                source_url=l.get("source_url"),
                last_verified=l.get("last_verified"),
                date_enacted=l.get("date_enacted"),
                date_updated=l.get("date_updated") or l.get("last_verified"),
                content_preview=l["content"][:200],
            )
            for l in page_laws
        ]

        return LawsListResponse(
            laws=summaries,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    @classmethod
    def get_by_id(cls, law_id: str) -> Optional[LawDetail]:
        law = cls._laws_by_id.get(law_id)
        if not law:
            return None

        # Resolve related_laws to their titles for convenience
        return LawDetail(
            id=law["id"],
            category=law["category"],
            subcategory=law.get("subcategory"),
            title=law["title"],
            title_da=law.get("title_da"),
            law_reference=law["law_reference"],
            content=law["content"],
            summary=law.get("summary"),
            keywords=law.get("keywords", []),
            key_facts=law.get("key_facts"),
            related_laws=law.get("related_laws", []),
            source_url=law.get("source_url"),
            practical_tips=law.get("practical_tips"),
            last_verified=law.get("last_verified"),
            date_enacted=law.get("date_enacted"),
            date_updated=law.get("date_updated") or law.get("last_verified"),
        )

    @classmethod
    def get_categories(cls) -> CategoriesResponse:
        # Count by category and subcategory
        cat_counts: dict[str, int] = {}
        subcat_counts: dict[str, dict[str, int]] = {}

        for law in cls._laws:
            cat = law["category"]
            subcat = law.get("subcategory")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

            if subcat:
                if cat not in subcat_counts:
                    subcat_counts[cat] = {}
                subcat_counts[cat][subcat] = subcat_counts[cat].get(subcat, 0) + 1

        # Order: immigration, tax, labor, business
        order = ["immigration", "tax", "labor", "business"]
        categories = []
        for cat in order:
            if cat not in cat_counts:
                continue
            subcats = [
                SubcategoryInfo(name=name, count=count)
                for name, count in sorted(subcat_counts.get(cat, {}).items())
            ]
            categories.append(
                CategoryInfo(
                    name=cat,
                    count=cat_counts[cat],
                    label=_CATEGORY_LABELS.get(cat, cat.title()),
                    subcategories=subcats,
                )
            )

        # Add any unlisted categories
        for cat, count in sorted(cat_counts.items()):
            if cat not in order:
                categories.append(
                    CategoryInfo(
                        name=cat,
                        count=count,
                        label=cat.title(),
                    )
                )

        return CategoriesResponse(
            categories=categories,
            total_laws=len(cls._laws),
        )

    @classmethod
    def get_stats(cls) -> StatsResponse:
        cat_counts: dict[str, int] = {}
        last_verified_dates: list[str] = []

        for law in cls._laws:
            cat = law["category"]
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
            if law.get("last_verified"):
                last_verified_dates.append(law["last_verified"])

        last_verified = max(last_verified_dates) if last_verified_dates else None

        return StatsResponse(
            total_laws=len(cls._laws),
            categories=cat_counts,
            last_verified=last_verified,
            version=cls._metadata.get("version", "2.0"),
            disclaimer=cls._metadata.get(
                "disclaimer",
                "This database provides summaries of Danish law for informational purposes only.",
            ),
        )

    @classmethod
    def enrich(cls, law_id: str) -> dict:
        """Return all JSON-only fields for a given law id."""
        law = cls._laws_by_id.get(law_id, {})
        return {
            "date_enacted": law.get("date_enacted"),
            "date_updated": law.get("date_updated") or law.get("last_verified"),
            "keywords_list": law.get("keywords", []),
            "key_facts": law.get("key_facts"),
            "related_laws": law.get("related_laws", []),
            "source_url": law.get("source_url"),
            "practical_tips": law.get("practical_tips"),
            "summary": law.get("summary"),
            "subcategory": law.get("subcategory"),
            "title_da": law.get("title_da"),
            "last_verified": law.get("last_verified"),
        }


law_service = LawService()
