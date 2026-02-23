from app.models.schemas import ChatRequest, ChatResponse, SearchRequest, SearchResultItem
from app.services.search_service import search_service

_CATEGORY_LABELS = {
    "immigration": "Danish immigration law",
    "tax": "Danish tax law",
    "labor": "Danish labor law",
    "business": "Danish business law",
}


class ChatService:
    """Format a human-readable answer from search results (no LLM required)."""

    @staticmethod
    def format_answer(query: str, results: list[SearchResultItem]) -> str:
        if not results:
            return (
                "I could not find specific information about that in the Danish law "
                "database. Please try rephrasing your question or consult a licensed "
                "legal professional for advice specific to your situation."
            )

        primary = results[0]
        cat_label = _CATEGORY_LABELS.get(primary.category, "Danish law")
        additional = len(results) - 1

        answer = (
            f"Based on {cat_label}, the most relevant regulation for your question "
            f"is **{primary.law_reference}**: {primary.title}."
        )

        if primary.snippet:
            import re
            plain_snippet = re.sub(r"</?mark>", "", primary.snippet)
            answer += f"\n\nKey excerpt: {plain_snippet}"

        if primary.practical_tips:
            answer += f"\n\n💡 Tip: {primary.practical_tips}"

        if additional > 0:
            noun = "regulation" if additional == 1 else "regulations"
            answer += (
                f"\n\nI also found {additional} additional relevant {noun} that may "
                "apply. Review the law cards below for complete information."
            )

        if primary.source_url:
            answer += f"\n\nOfficial source: {primary.source_url}"

        answer += (
            "\n\n*This is an informational summary only — not legal advice. "
            "Always verify with official Danish sources or a licensed attorney.*"
        )
        return answer

    @classmethod
    def chat(cls, req: ChatRequest) -> ChatResponse:
        search_req = SearchRequest(
            query=req.query,
            category=req.category,
            top_k=req.top_k,
        )
        result = search_service.search(search_req)
        answer = cls.format_answer(req.query, result.results)

        return ChatResponse(
            answer=answer,
            laws=result.results,
            query=req.query,
            category=req.category,
            search_time_ms=result.search_time_ms,
        )


chat_service = ChatService()
