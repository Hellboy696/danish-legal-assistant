"""
LLM Service — Claude-powered RAG answers for Danish Legal Assistant.

Flow:
  1. Receive query + top-k search results (already fetched by search_service)
  2. Build a structured prompt with law context
  3. Call Claude API (streaming or blocking)
  4. Parse structured JSON from Claude's response
  5. Fall back to template answer if API unavailable / key missing
"""
from __future__ import annotations

import json
import re
import uuid
from typing import AsyncGenerator, Optional

import structlog

from app.config import settings
from app.models.schemas import (
    ChatRequest,
    ChatResponse,
    CitedSource,
    ConversationMessage,
    SearchResultItem,
)
from app.services.search_service import search_service
from app.models.schemas import SearchRequest

log = structlog.get_logger()

# ---------------------------------------------------------------------------
# Anthropic client singleton — created once, reused for every request.
# Creating a new anthropic.Anthropic() on every call is wasteful: it
# re-initialises the HTTP client, SSL context, and auth headers each time.
# ---------------------------------------------------------------------------
_anthropic_client: Optional["anthropic.Anthropic"] = None  # type: ignore[name-defined]


def _get_client() -> "anthropic.Anthropic":  # type: ignore[name-defined]
    """Return (or lazily create) the shared Anthropic client."""
    global _anthropic_client
    if _anthropic_client is None:
        import anthropic as _anthropic
        _anthropic_client = _anthropic.Anthropic(api_key=settings.anthropic_api_key)
        log.info("anthropic.client.created")
    return _anthropic_client


# ---------------------------------------------------------------------------
# In-memory conversation store  (conversation_id → list[ConversationMessage])
# Max entries = max_conversation_turns * 2  (user + assistant per turn)
# ---------------------------------------------------------------------------
_CONVERSATIONS: dict[str, list[ConversationMessage]] = {}
_MAX_CONVERSATIONS = 500  # evict oldest entries when limit is reached


def _get_or_create_conversation(
    conversation_id: Optional[str],
    provided_history: Optional[list[ConversationMessage]],
) -> tuple[str, list[ConversationMessage]]:
    if conversation_id and conversation_id in _CONVERSATIONS:
        return conversation_id, _CONVERSATIONS[conversation_id]
    cid = conversation_id or str(uuid.uuid4())
    history = list(provided_history) if provided_history else []
    # Evict the oldest conversation when the store is full to prevent unbounded
    # memory growth on long-running servers.
    if len(_CONVERSATIONS) >= _MAX_CONVERSATIONS:
        oldest_key = next(iter(_CONVERSATIONS))
        del _CONVERSATIONS[oldest_key]
        log.warning("conversations.evicted", max=_MAX_CONVERSATIONS)
    _CONVERSATIONS[cid] = history
    return cid, history


def _trim_history(history: list[ConversationMessage]) -> list[ConversationMessage]:
    """Keep only the last N turns (pairs)."""
    max_msgs = settings.max_conversation_turns * 2
    return history[-max_msgs:] if len(history) > max_msgs else history


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a Danish Legal Assistant — an expert on Danish law, specializing in immigration, tax, labor, and business regulations.

ROLE & SCOPE:
- Answer questions ONLY based on the legal context provided in each message
- If the answer is not in the provided context, say so honestly and suggest consulting official sources
- If a question is outside Danish law (e.g., asking about another country), politely decline and redirect
- You are NOT a licensed attorney — always include a brief disclaimer

RESPONSE FORMAT:
CRITICAL: Respond ONLY with a raw JSON object. Do NOT wrap in markdown fences (no ```json, no ```). Do NOT include any text before or after the JSON. Start your response with { and end with }.
The exact structure required:
{
  "answer": "<markdown formatted answer>",
  "sources": [
    {
      "law_id": "<id from context>",
      "title": "<law title>",
      "law_reference": "<reference e.g. §9a>",
      "relevance": "<high|medium|low>",
      "cited_text": "<exact quote or key fact you used>",
      "source_url": "<url if available>"
    }
  ],
  "follow_up_questions": ["<3 natural follow-up questions the user might ask>"],
  "confidence": "<high|medium|low>"
}

ANSWER WRITING RULES:
- Write in clear English, markdown supported
- Lead with a direct, concise answer (1-2 sentences)
- Include specific numbers, dates, thresholds exactly as stated in the law
- Use **bold** for key numbers and terms
- Cite every law you use: e.g. "Under **Udlændingeloven §9a** (Pay Limit Scheme)..."
- For practical questions, include a 💡 practical tip from the context if one exists
- End every answer with: "*This summary is for informational purposes only — not legal advice. Always consult official Danish sources or a licensed attorney for your specific situation.*"
- Be precise: don't round numbers, don't guess dates
- If multiple laws apply, explain how they relate

CONFIDENCE LEVELS:
- high: question directly answered by provided law text
- medium: partially answered or requires inference
- low: tangentially related or no direct answer found"""


def _build_context(results: list[SearchResultItem]) -> str:
    """Format search results as structured context for Claude."""
    parts = []
    for i, law in enumerate(results, 1):
        key_facts_str = ""
        if law.key_facts:
            facts = "\n".join(f"    - {k}: {v}" for k, v in law.key_facts.items())
            key_facts_str = f"\n  Key Facts:\n{facts}"

        tips_str = f"\n  Practical Tips: {law.practical_tips}" if law.practical_tips else ""
        url_str = f"\n  Official Source: {law.source_url}" if law.source_url else ""

        parts.append(
            f"[LAW {i}]\n"
            f"  ID: {law.id}\n"
            f"  Title: {law.title}\n"
            f"  Reference: {law.law_reference}\n"
            f"  Category: {law.category} / {law.subcategory or 'general'}\n"
            f"  Summary: {law.summary or ''}\n"
            f"  Content: {law.content}"
            f"{key_facts_str}"
            f"{tips_str}"
            f"{url_str}"
        )
    return "\n\n".join(parts)


def _build_user_message(query: str, context: str) -> str:
    return (
        f"LEGAL CONTEXT (use only this to answer):\n\n{context}\n\n"
        f"USER QUESTION: {query}"
    )


# ---------------------------------------------------------------------------
# Fallback (no API key or API error)
# ---------------------------------------------------------------------------

def _fallback_response(
    query: str,
    results: list[SearchResultItem],
    conversation_id: str,
    search_time_ms: float,
    category: Optional[str],
) -> ChatResponse:
    """Template-based response when LLM is unavailable."""
    if not results:
        answer = (
            "I could not find specific information about that in the Danish law database. "
            "Please try rephrasing your question or consult a licensed legal professional."
        )
        return ChatResponse(
            answer=answer, laws=[], sources=[], follow_up_questions=[],
            confidence="low", query=query, category=category,
            search_time_ms=search_time_ms, llm_used=False,
            conversation_id=conversation_id,
        )

    primary = results[0]
    _CATEGORY_LABELS = {
        "immigration": "Danish immigration law",
        "tax": "Danish tax law",
        "labor": "Danish labor law",
        "business": "Danish business law",
    }
    cat_label = _CATEGORY_LABELS.get(primary.category, "Danish law")
    import re as _re
    snippet = _re.sub(r"</?mark>", "", primary.snippet) if primary.snippet else ""

    answer = (
        f"Based on {cat_label}, the most relevant regulation is "
        f"**{primary.law_reference}**: {primary.title}."
    )
    if snippet:
        answer += f"\n\n{snippet}"
    if primary.practical_tips:
        answer += f"\n\n💡 {primary.practical_tips}"
    if len(results) > 1:
        answer += f"\n\nI also found {len(results)-1} additional relevant regulation(s) — see law cards below."
    if primary.source_url:
        answer += f"\n\n[Official source]({primary.source_url})"
    answer += "\n\n*This summary is for informational purposes only — not legal advice.*"

    sources = [
        CitedSource(
            law_id=r.id, title=r.title, law_reference=r.law_reference,
            relevance="high" if i == 0 else "medium",
            source_url=r.source_url,
        )
        for i, r in enumerate(results)
    ]

    return ChatResponse(
        answer=answer, laws=results, sources=sources,
        follow_up_questions=[], confidence="medium",
        query=query, category=category,
        search_time_ms=search_time_ms, llm_used=False,
        conversation_id=conversation_id,
    )


# ---------------------------------------------------------------------------
# LLM Service
# ---------------------------------------------------------------------------

class LLMService:
    """RAG-based answers using Claude. Falls back to template if API unavailable."""

    @staticmethod
    def _is_available() -> bool:
        return bool(settings.anthropic_api_key)

    @classmethod
    def _parse_llm_response(cls, raw: str) -> dict:
        """Extract JSON from Claude's response text.

        Handles three formats Claude may return:
          1. Pure JSON object (ideal, as instructed)
          2. ```json ... ``` fenced block (Claude sometimes adds these despite instructions)
          3. Any { ... } block found in the text (last resort)
        """
        text = raw.strip()

        # 1. Direct parse — fastest path for well-behaved responses
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # 2. Strip markdown code fences (```json ... ``` or ``` ... ```)
        #    Use a greedy inner match so the full JSON body is captured.
        fence_match = re.search(
            r"```(?:json)?\s*(\{[\s\S]*\})\s*```", text
        )
        if fence_match:
            try:
                return json.loads(fence_match.group(1))
            except json.JSONDecodeError:
                pass

        # 3. Find the outermost { ... } block (greedy — captures the whole object)
        brace_match = re.search(r"\{[\s\S]*\}", text)
        if brace_match:
            try:
                return json.loads(brace_match.group(0))
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not parse LLM response as JSON: {raw[:200]}")

    @classmethod
    def chat(cls, req: ChatRequest) -> ChatResponse:
        """Blocking chat: search → LLM → ChatResponse."""
        import time
        t0 = time.perf_counter()

        # 1. Search
        search_req = SearchRequest(
            query=req.query,
            category=req.category,
            top_k=req.top_k,
        )
        search_result = search_service.search(search_req)
        results = search_result.results
        search_ms = search_result.search_time_ms

        # 2. Conversation management
        conv_id, history = _get_or_create_conversation(
            req.conversation_id, req.history
        )

        # 3. Fallback if no API key
        if not cls._is_available():
            log.warning("llm.unavailable", reason="no API key")
            resp = _fallback_response(req.query, results, conv_id, search_ms, req.category)
            # Still store in conversation history
            _CONVERSATIONS[conv_id] = _trim_history(history + [
                ConversationMessage(role="user", content=req.query),
                ConversationMessage(role="assistant", content=resp.answer),
            ])
            return resp

        # 4. Build Claude messages
        context = _build_context(results)
        messages = []
        for msg in _trim_history(history):
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": _build_user_message(req.query, context)})

        # 5. Call Claude
        try:
            client = _get_client()
            response = client.messages.create(
                model=settings.llm_model,
                max_tokens=settings.llm_max_tokens,
                temperature=settings.llm_temperature,
                system=SYSTEM_PROMPT,
                messages=messages,
            )
            raw_text = response.content[0].text
            parsed = cls._parse_llm_response(raw_text)

            answer = parsed.get("answer", "")
            confidence = parsed.get("confidence", "medium")
            follow_ups = parsed.get("follow_up_questions", [])[:3]

            # Build CitedSource list from parsed sources
            law_by_id = {r.id: r for r in results}
            sources = []
            for s in parsed.get("sources", []):
                law = law_by_id.get(s.get("law_id", ""))
                sources.append(CitedSource(
                    law_id=s.get("law_id", ""),
                    title=s.get("title", law.title if law else ""),
                    law_reference=s.get("law_reference", law.law_reference if law else ""),
                    relevance=s.get("relevance", "medium"),
                    cited_text=s.get("cited_text"),
                    source_url=s.get("source_url", law.source_url if law else None),
                ))

            elapsed_ms = (time.perf_counter() - t0) * 1000
            log.info("llm.chat.done", ms=round(elapsed_ms, 1), confidence=confidence)

            # Update conversation history
            _CONVERSATIONS[conv_id] = _trim_history(history + [
                ConversationMessage(role="user", content=req.query),
                ConversationMessage(role="assistant", content=answer),
            ])

            return ChatResponse(
                answer=answer,
                laws=results,
                sources=sources,
                follow_up_questions=follow_ups,
                confidence=confidence,
                query=req.query,
                category=req.category,
                search_time_ms=search_ms,
                llm_used=True,
                conversation_id=conv_id,
            )

        except Exception as exc:
            log.error("llm.chat.error", error=str(exc))
            return _fallback_response(req.query, results, conv_id, search_ms, req.category)

    @classmethod
    async def stream_chat(
        cls,
        req: ChatRequest,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming chat via Server-Sent Events.
        Yields SSE-formatted strings:
          - data: {"type":"token","text":"..."}
          - data: {"type":"sources","sources":[...]}
          - data: {"type":"follow_ups","questions":[...]}
          - data: {"type":"done","conversation_id":"...","llm_used":true}
          - data: {"type":"error","message":"..."}
        """
        import time
        t0 = time.perf_counter()

        # 1. Search
        search_req = SearchRequest(
            query=req.query,
            category=req.category,
            top_k=req.top_k,
        )
        search_result = search_service.search(search_req)
        results = search_result.results

        # 2. Conversation management
        conv_id, history = _get_or_create_conversation(
            req.conversation_id, req.history
        )

        # 3. Fallback streaming if no API key
        if not cls._is_available():
            fallback = _fallback_response(
                req.query, results, conv_id, search_result.search_time_ms, req.category
            )
            # Stream the answer word-by-word for consistent UX
            words = fallback.answer.split(" ")
            for word in words:
                yield f"data: {json.dumps({'type': 'token', 'text': word + ' '})}\n\n"
            sources_data = [s.model_dump() for s in fallback.sources]
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources_data})}\n\n"
            yield f"data: {json.dumps({'type': 'follow_ups', 'questions': []})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id, 'llm_used': False})}\n\n"
            return

        # 4. Build Claude messages
        context = _build_context(results)
        messages = []
        for msg in _trim_history(history):
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": _build_user_message(req.query, context)})

        # 5. Stream from Claude
        # Strategy: buffer the full JSON response first, parse it, then stream
        # only the clean "answer" text word-by-word. This avoids exposing the
        # raw JSON structure to the frontend during streaming.
        full_text = ""
        try:
            client = _get_client()

            with client.messages.stream(
                model=settings.llm_model,
                max_tokens=settings.llm_max_tokens,
                temperature=settings.llm_temperature,
                system=SYSTEM_PROMPT,
                messages=messages,
            ) as stream:
                # Accumulate the full response without streaming yet
                for text_chunk in stream.text_stream:
                    full_text += text_chunk

            # Parse final JSON for answer, sources, follow-ups
            parsed = cls._parse_llm_response(full_text)
            law_by_id = {r.id: r for r in results}
            sources = []
            for s in parsed.get("sources", []):
                law = law_by_id.get(s.get("law_id", ""))
                sources.append(CitedSource(
                    law_id=s.get("law_id", ""),
                    title=s.get("title", law.title if law else ""),
                    law_reference=s.get("law_reference", law.law_reference if law else ""),
                    relevance=s.get("relevance", "medium"),
                    cited_text=s.get("cited_text"),
                    source_url=s.get("source_url", law.source_url if law else None),
                ).model_dump())

            follow_ups = parsed.get("follow_up_questions", [])[:3]
            answer_text = parsed.get("answer", full_text)

            # Stream the clean answer word-by-word (same UX as fallback path)
            words = answer_text.split(" ")
            for word in words:
                yield f"data: {json.dumps({'type': 'token', 'text': word + ' '})}\n\n"

            # Update conversation
            _CONVERSATIONS[conv_id] = _trim_history(history + [
                ConversationMessage(role="user", content=req.query),
                ConversationMessage(role="assistant", content=answer_text),
            ])

            elapsed_ms = (time.perf_counter() - t0) * 1000
            log.info("llm.stream.done", ms=round(elapsed_ms, 1))

            yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
            yield f"data: {json.dumps({'type': 'follow_ups', 'questions': follow_ups})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id, 'llm_used': True})}\n\n"

        except Exception as exc:
            log.error("llm.stream.error", error=str(exc))
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
            # Send fallback
            fallback = _fallback_response(
                req.query, results, conv_id, search_result.search_time_ms, req.category
            )
            yield f"data: {json.dumps({'type': 'token', 'text': fallback.answer})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id, 'llm_used': False})}\n\n"


llm_service = LLMService()
