from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import (
    CategoriesResponse,
    LawDetail,
    LawsListResponse,
    StatsResponse,
)
from app.services.law_service import law_service

router = APIRouter(prefix="/laws", tags=["laws"])

_VALID_CATEGORIES = ("immigration", "tax", "labor", "business")


@router.get("/categories", response_model=CategoriesResponse)
async def get_categories():
    """Return all categories with subcategories and law counts."""
    return law_service.get_categories()


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Return database statistics (counts per category, last verified, disclaimer)."""
    return law_service.get_stats()


@router.get("", response_model=LawsListResponse)
async def list_laws(
    category: Optional[str] = Query(None, description="Filter: immigration | tax | labor | business"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory slug"),
    search: Optional[str] = Query(None, description="Full-text search across title, content, keywords"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(10, ge=1, le=50, description="Results per page"),
):
    """Paginated list of laws with optional category, subcategory, and search filters."""
    if category and category not in _VALID_CATEGORIES:
        raise HTTPException(status_code=422, detail=f"Invalid category '{category}'")
    return law_service.get_all(
        category=category,
        subcategory=subcategory,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get("/{law_id}", response_model=LawDetail)
async def get_law(law_id: str):
    """Return full details of a single law by id, including key_facts, practical_tips, related_laws."""
    law = law_service.get_by_id(law_id)
    if not law:
        raise HTTPException(status_code=404, detail=f"Law '{law_id}' not found")
    return law
