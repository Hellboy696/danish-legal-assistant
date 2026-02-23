"""
Integration tests for the Danish Legal Assistant API.
Run from the `backend/` directory:
    pytest tests/test_api.py -v

Production dataset: 41 laws (immigration=16, tax=10, labor=10, business=5)
Law IDs follow the pattern: imm_*, tax_*, lab_*, bus_*
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

# Use context manager so the lifespan (startup) executes before tests run
_tc = TestClient(app)
_tc.__enter__()
client = _tc


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health_200():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200


def test_health_db_connected():
    resp = client.get("/api/v1/health")
    assert resp.json()["db_connected"] is True


def test_health_model_loaded():
    resp = client.get("/api/v1/health")
    assert resp.json()["model_loaded"] is True


def test_health_laws_indexed():
    resp = client.get("/api/v1/health")
    assert resp.json()["laws_indexed"] == 41


def test_health_status_ok():
    resp = client.get("/api/v1/health")
    assert resp.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

def test_search_basic():
    resp = client.post("/api/v1/search", json={"query": "work permit Denmark"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["query"] == "work permit Denmark"
    assert isinstance(data["results"], list)
    assert len(data["results"]) > 0


def test_search_with_category():
    resp = client.post("/api/v1/search", json={"query": "tax rate", "category": "tax"})
    assert resp.status_code == 200
    for result in resp.json()["results"]:
        assert result["category"] == "tax"


def test_search_top_k_respected():
    resp = client.post("/api/v1/search", json={"query": "employment", "top_k": 2})
    assert resp.status_code == 200
    assert len(resp.json()["results"]) <= 2


def test_search_result_has_snippet():
    resp = client.post("/api/v1/search", json={"query": "vacation days"})
    assert resp.status_code == 200
    for result in resp.json()["results"]:
        assert "snippet" in result
        assert isinstance(result["snippet"], str)
        assert len(result["snippet"]) > 0


def test_search_keywords_are_list():
    resp = client.post("/api/v1/search", json={"query": "immigration"})
    assert resp.status_code == 200
    for result in resp.json()["results"]:
        assert isinstance(result["keywords"], list)


def test_search_result_has_score():
    resp = client.post("/api/v1/search", json={"query": "tax card skattekort"})
    assert resp.status_code == 200
    for result in resp.json()["results"]:
        assert result["score"] > 0


def test_search_result_has_search_time():
    resp = client.post("/api/v1/search", json={"query": "blue card"})
    assert resp.status_code == 200
    assert resp.json()["search_time_ms"] > 0


def test_search_invalid_category_422():
    resp = client.post("/api/v1/search", json={"query": "test", "category": "criminal"})
    assert resp.status_code == 422


def test_search_short_query_422():
    resp = client.post("/api/v1/search", json={"query": "x"})
    assert resp.status_code == 422


def test_search_immigration_regression():
    """'Can I work in Denmark with Ukrainian passport?' must return immigration laws."""
    resp = client.post(
        "/api/v1/search",
        json={
            "query": "Can I work in Denmark with Ukrainian passport?",
            "category": "immigration",
            "top_k": 5,
        },
    )
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert len(results) > 0
    # All results must be immigration laws (category filter applied)
    for r in results:
        assert r["category"] == "immigration"
    # Pay Limit Scheme must appear somewhere in top-5 (canonical work permit law)
    ids = [r["id"] for r in results]
    assert "imm_pay_limit_001" in ids


def test_search_no_category_returns_all():
    """Without a category filter, results may span multiple categories."""
    resp = client.post("/api/v1/search", json={"query": "permit employment income"})
    assert resp.status_code == 200
    categories = {r["category"] for r in resp.json()["results"]}
    assert len(categories) >= 1


def test_search_result_fields_present():
    """Each result must have all required fields."""
    resp = client.post("/api/v1/search", json={"query": "work permit"})
    assert resp.status_code == 200
    for r in resp.json()["results"]:
        assert r.get("id") is not None
        assert r.get("title") is not None
        assert r.get("category") is not None
        assert r.get("law_reference") is not None
        assert r.get("score") is not None


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

def test_chat_basic():
    resp = client.post("/api/v1/chat", json={"query": "What is the tax rate?"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["answer"], str)
    assert len(data["answer"]) > 20
    assert isinstance(data["laws"], list)


def test_chat_answer_contains_law_reference():
    resp = client.post(
        "/api/v1/chat",
        json={"query": "vacation days", "category": "labor"},
    )
    data = resp.json()
    # Only assert if LLM is active (llm_used=True); fallback answer has law_reference too
    if data["laws"]:
        primary_ref = data["laws"][0]["law_reference"]
        # Law reference should appear somewhere in answer or sources
        sources_refs = [s.get("law_reference", "") for s in data.get("sources", [])]
        assert primary_ref in data["answer"] or primary_ref in sources_refs


def test_chat_graceful_no_results():
    """Unmatched query must not crash the endpoint."""
    resp = client.post("/api/v1/chat", json={"query": "zyxwvut qrstuv"})
    assert resp.status_code == 200
    assert isinstance(resp.json()["answer"], str)


def test_chat_laws_have_snippet():
    resp = client.post("/api/v1/chat", json={"query": "notice period termination"})
    assert resp.status_code == 200
    for law in resp.json()["laws"]:
        assert "snippet" in law


def test_chat_returns_search_time():
    resp = client.post("/api/v1/chat", json={"query": "blue card requirements"})
    assert resp.status_code == 200
    assert resp.json()["search_time_ms"] > 0


def test_chat_returns_conversation_id():
    resp = client.post("/api/v1/chat", json={"query": "work permit salary"})
    assert resp.status_code == 200
    assert resp.json().get("conversation_id") is not None


def test_chat_returns_confidence():
    resp = client.post("/api/v1/chat", json={"query": "tax brackets Denmark"})
    assert resp.status_code == 200
    assert resp.json().get("confidence") in ("high", "medium", "low")


# ---------------------------------------------------------------------------
# Laws catalog
# ---------------------------------------------------------------------------

def test_laws_list_default():
    resp = client.get("/api/v1/laws")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 41
    assert len(data["laws"]) > 0
    assert data["total_pages"] >= 1


def test_laws_list_category_immigration():
    resp = client.get("/api/v1/laws?category=immigration")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 16
    for law in data["laws"]:
        assert law["category"] == "immigration"


def test_laws_list_category_tax():
    resp = client.get("/api/v1/laws?category=tax")
    assert resp.status_code == 200
    assert resp.json()["total"] == 10


def test_laws_list_category_labor():
    resp = client.get("/api/v1/laws?category=labor")
    assert resp.status_code == 200
    assert resp.json()["total"] == 10


def test_laws_list_category_business():
    resp = client.get("/api/v1/laws?category=business")
    assert resp.status_code == 200
    assert resp.json()["total"] == 5


def test_laws_list_pagination():
    resp = client.get("/api/v1/laws?page=1&page_size=3")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["laws"]) == 3
    assert data["total_pages"] == 14  # ceil(41 / 3)


def test_laws_list_invalid_category_422():
    resp = client.get("/api/v1/laws?category=criminal")
    assert resp.status_code == 422


def test_law_detail_valid():
    resp = client.get("/api/v1/laws/imm_pay_limit_001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "imm_pay_limit_001"
    assert data["category"] == "immigration"
    assert isinstance(data["keywords"], list)


def test_law_detail_not_found():
    resp = client.get("/api/v1/laws/law_999")
    assert resp.status_code == 404


def test_law_detail_keywords_are_list():
    resp = client.get("/api/v1/laws/tax_personal_income_001")
    assert resp.status_code == 200
    assert isinstance(resp.json()["keywords"], list)


def test_law_detail_has_key_facts():
    resp = client.get("/api/v1/laws/imm_pay_limit_001")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("key_facts") is not None
    assert isinstance(data["key_facts"], dict)


def test_law_detail_has_source_url():
    resp = client.get("/api/v1/laws/imm_pay_limit_001")
    assert resp.status_code == 200
    assert resp.json().get("source_url") is not None


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

def test_categories_200():
    resp = client.get("/api/v1/laws/categories")
    assert resp.status_code == 200


def test_categories_total():
    resp = client.get("/api/v1/laws/categories")
    assert resp.json()["total_laws"] == 41


def test_categories_names():
    resp = client.get("/api/v1/laws/categories")
    names = {c["name"] for c in resp.json()["categories"]}
    assert names == {"immigration", "tax", "labor", "business"}


def test_categories_counts():
    resp = client.get("/api/v1/laws/categories")
    counts = {c["name"]: c["count"] for c in resp.json()["categories"]}
    assert counts["immigration"] == 16
    assert counts["tax"] == 10
    assert counts["labor"] == 10
    assert counts["business"] == 5
