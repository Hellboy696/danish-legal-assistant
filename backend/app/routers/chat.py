from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse
from app.services.llm_service import llm_service, _CONVERSATIONS
from app.utils.limiter import limiter

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(request: Request, body: ChatRequest):
    """
    RAG-based answer: hybrid search → Claude API → structured response.
    Falls back to template answer if ANTHROPIC_API_KEY is not set.
    """
    return llm_service.chat(body)


@router.post("/stream")
@limiter.limit("10/minute")
async def chat_stream(request: Request, body: ChatRequest):
    """
    Streaming SSE endpoint. Yields tokens as they arrive from Claude.
    Event types: token | sources | follow_ups | done | error
    """
    return StreamingResponse(
        llm_service.stream_chat(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history/{conversation_id}")
async def get_history(conversation_id: str):
    """Return conversation history for a given conversation_id."""
    history = _CONVERSATIONS.get(conversation_id, [])
    return {"conversation_id": conversation_id, "messages": [m.model_dump() for m in history]}
