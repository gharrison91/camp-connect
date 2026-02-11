"""
Camp Connect - Team Chat API Endpoints
Full CRUD for channels and messages.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.team_chat import (
    ChatChannelCreate,
    ChatChannelResponse,
    ChatChannelUpdate,
    ChatMessageCreate,
    ChatMessageResponse,
    UnreadCount,
)
from app.services import team_chat_service

router = APIRouter(prefix="/team-chat", tags=["Team Chat"])


# ---------------------------------------------------------------------------
# Channels
# ---------------------------------------------------------------------------


@router.get(
    "/channels",
    response_model=List[ChatChannelResponse],
)
async def list_channels(
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all channels for the current organization."""
    return await team_chat_service.list_channels(current_user["organization_id"])


@router.get(
    "/channels/{channel_id}",
    response_model=ChatChannelResponse,
)
async def get_channel(
    channel_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single channel by ID."""
    channel = await team_chat_service.get_channel(
        current_user["organization_id"], channel_id,
    )
    if channel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")
    return channel


@router.post(
    "/channels",
    response_model=ChatChannelResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_channel(
    body: ChatChannelCreate,
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.send")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new chat channel."""
    return await team_chat_service.create_channel(
        current_user["organization_id"],
        body.model_dump(),
        created_by=str(current_user["user_id"]),
    )


@router.put(
    "/channels/{channel_id}",
    response_model=ChatChannelResponse,
)
async def update_channel(
    channel_id: str,
    body: ChatChannelUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.send")),
    db: AsyncSession = Depends(get_db),
):
    """Update a channel."""
    channel = await team_chat_service.update_channel(
        current_user["organization_id"],
        channel_id,
        body.model_dump(exclude_unset=True),
    )
    if channel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")
    return channel


@router.delete(
    "/channels/{channel_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_channel(
    channel_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.send")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a channel and its messages."""
    deleted = await team_chat_service.delete_channel(
        current_user["organization_id"], channel_id,
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")
    return None


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------


@router.get(
    "/channels/{channel_id}/messages",
    response_model=List[ChatMessageResponse],
)
async def list_messages(
    channel_id: str,
    before: Optional[str] = Query(default=None, description="ISO timestamp cursor for pagination"),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get messages in a channel."""
    return await team_chat_service.get_messages(channel_id, before=before, limit=limit)


@router.post(
    "/channels/{channel_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    channel_id: str,
    body: ChatMessageCreate,
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.send")),
    db: AsyncSession = Depends(get_db),
):
    """Send a message in a channel."""
    user = current_user
    return await team_chat_service.send_message(
        channel_id=channel_id,
        org_id=user["organization_id"],
        sender_id=str(user["user_id"]),
        sender_name=f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get("email", "User"),
        sender_avatar=user.get("avatar_url"),
        data=body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Pin / React
# ---------------------------------------------------------------------------


@router.post(
    "/channels/{channel_id}/messages/{message_id}/pin",
    response_model=ChatMessageResponse,
)
async def pin_message(
    channel_id: str,
    message_id: str,
    pinned: bool = Query(default=True),
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.send")),
    db: AsyncSession = Depends(get_db),
):
    """Pin or unpin a message."""
    msg = await team_chat_service.pin_message(channel_id, message_id, pinned)
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return msg


@router.post(
    "/channels/{channel_id}/messages/{message_id}/react",
    response_model=ChatMessageResponse,
)
async def react_to_message(
    channel_id: str,
    message_id: str,
    emoji: str = Query(..., description="Emoji to toggle"),
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.send")),
    db: AsyncSession = Depends(get_db),
):
    """Toggle a reaction on a message."""
    msg = await team_chat_service.add_reaction(
        channel_id, message_id, emoji, str(current_user["user_id"]),
    )
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return msg


@router.get(
    "/channels/{channel_id}/pinned",
    response_model=List[ChatMessageResponse],
)
async def get_pinned_messages(
    channel_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all pinned messages in a channel."""
    return await team_chat_service.get_pinned_messages(channel_id)


# ---------------------------------------------------------------------------
# Unread / Mark-read
# ---------------------------------------------------------------------------


@router.get(
    "/unread",
    response_model=List[UnreadCount],
)
async def get_unread_counts(
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get unread message counts per channel for the current user."""
    return await team_chat_service.get_unread_counts(
        str(current_user["user_id"]),
        current_user["organization_id"],
    )


@router.post(
    "/channels/{channel_id}/mark-read",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def mark_channel_read(
    channel_id: str,
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.read")),
    db: AsyncSession = Depends(get_db),
):
    """Mark a channel as read for the current user."""
    await team_chat_service.mark_as_read(str(current_user["user_id"]), channel_id)
    return None


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


@router.get(
    "/search",
    response_model=List[ChatMessageResponse],
)
async def search_messages(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: Dict[str, Any] = Depends(require_permission("comms.messages.read")),
    db: AsyncSession = Depends(get_db),
):
    """Search messages across all channels."""
    return await team_chat_service.search_messages(
        current_user["organization_id"], q, limit=limit,
    )
