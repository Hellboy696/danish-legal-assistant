from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Law models
# ---------------------------------------------------------------------------

class LawBase(BaseModel):
    id: str
    category: str
    subcategory: Optional[str] = None
    title: str
    title_da: Optional[str] = None
    law_reference: str
    content: str
    summary: Optional[str] = None
    keywords: list[str]
    key_facts: Optional[dict[str, Any]] = None
    related_laws: Optional[list[str]] = None
    source_url: Optional[str] = None
    practical_tips: Optional[str] = None
    last_verified: Optional[str] = None
    # Legacy date fields (kept for compatibility)
    date_enacted: Optional[str] = None
    date_updated: Optional[str] = None


class LawDetail(LawBase):
    """Full law object for GET /laws/{id}."""
    pass


class LawSummary(BaseModel):
    """Compact law object for paginated catalog listing."""
    id: str
    category: str
    subcategory: Optional[str] = None
    title: str
    title_da: Optional[str] = None
    law_reference: str
    summary: Optional[str] = None
    keywords: list[str]
    key_facts: Optional[dict[str, Any]] = None
    source_url: Optional[str] = None
    last_verified: Optional[str] = None
    date_enacted: Optional[str] = None
    date_updated: Optional[str] = None
    content_preview: str = Field(description="First 200 characters of content")


# ---------------------------------------------------------------------------
# Search models
# ---------------------------------------------------------------------------

_VALID_CATEGORIES = ("immigration", "tax", "labor", "business")


def _validate_category(v: Optional[str]) -> Optional[str]:
    if v is not None and v not in _VALID_CATEGORIES:
        raise ValueError(f"category must be one of: {', '.join(_VALID_CATEGORIES)}")
    return v


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    category: Optional[str] = None
    subcategory: Optional[str] = None
    top_k: int = Field(default=3, ge=1, le=10)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        return _validate_category(v)


class SearchResultItem(LawBase):
    """A law enriched with search-specific metadata."""
    score: float
    relevance_score: Optional[float] = None
    semantic_rank: Optional[int] = None
    bm25_rank: Optional[int] = None
    snippet: str


class SearchResponse(BaseModel):
    query: str
    category: Optional[str]
    results: list[SearchResultItem]
    total: int
    search_time_ms: float
    top_k: int


# ---------------------------------------------------------------------------
# Chat models
# ---------------------------------------------------------------------------

class ConversationMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    category: Optional[str] = None
    top_k: int = Field(default=7, ge=1, le=10)
    conversation_id: Optional[str] = None
    history: Optional[list[ConversationMessage]] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        return _validate_category(v)


class CitedSource(BaseModel):
    law_id: str
    title: str
    law_reference: str
    relevance: str  # "high" | "medium" | "low"
    cited_text: Optional[str] = None
    source_url: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    laws: list[SearchResultItem]
    sources: list[CitedSource] = []
    follow_up_questions: list[str] = []
    confidence: str = "medium"  # "high" | "medium" | "low"
    query: str
    category: Optional[str]
    search_time_ms: float
    llm_used: bool = False
    conversation_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Laws catalog models
# ---------------------------------------------------------------------------

class LawsListResponse(BaseModel):
    laws: list[LawSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class SubcategoryInfo(BaseModel):
    name: str
    count: int


class CategoryInfo(BaseModel):
    name: str
    count: int
    label: str
    subcategories: Optional[list[SubcategoryInfo]] = None


class CategoriesResponse(BaseModel):
    categories: list[CategoryInfo]
    total_laws: int


# ---------------------------------------------------------------------------
# Stats model
# ---------------------------------------------------------------------------

class StatsResponse(BaseModel):
    total_laws: int
    categories: dict[str, int]
    last_verified: Optional[str]
    version: str
    disclaimer: str


# ---------------------------------------------------------------------------
# Health model
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    model_loaded: bool
    laws_indexed: int
    version: str = "2.0.0"
