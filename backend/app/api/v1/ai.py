"""
Camp Connect - AI Insights API Endpoints
Claude-powered natural language queries against camp data.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.config import settings
from app.database import get_db
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI Insights"])


# ---------- Request / Response schemas ----------

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    response: str
    sql: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    row_count: Optional[int] = None
    entity_links: Optional[Dict[str, str]] = None
    error: Optional[str] = None


class SuggestedPrompt(BaseModel):
    title: str
    prompt: str
    icon: str


# ---------- Endpoints ----------

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    body: ChatRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("analytics.insights.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a natural language question about camp data.
    Claude will generate a SQL query, execute it, and summarise the results.
    """
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Insights is not available. ANTHROPIC_API_KEY is not configured.",
        )

    if not body.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one message is required.",
        )

    # Convert pydantic models to dicts
    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    user_name = f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or "User"

    result = await ai_service.chat(
        db=db,
        organization_id=current_user["organization_id"],
        messages=messages,
        user_name=user_name,
    )

    return ChatResponse(**result)


@router.get("/suggested-prompts", response_model=List[SuggestedPrompt])
async def get_suggested_prompts(
    current_user: Dict[str, Any] = Depends(
        require_permission("analytics.insights.read")
    ),
):
    """Return curated suggested prompts for the AI chat interface."""
    return ai_service.get_suggested_prompts()
