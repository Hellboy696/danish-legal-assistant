from fastapi import APIRouter, Request

from app.models.schemas import SearchRequest, SearchResponse
from app.services.search_service import search_service
from app.utils.limiter import limiter

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
@limiter.limit("30/minute")
async def search(request: Request, body: SearchRequest):
    """
    Hybrid semantic + BM25 search over Danish laws.
    Uses Reciprocal Rank Fusion to combine both ranking signals.
    """
    return search_service.search(body)
