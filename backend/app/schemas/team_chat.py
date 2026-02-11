"""
Camp Connect - Team Chat Schemas
Channels and messages for staff group chat / team messaging.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChatAttachment(BaseModel):
    url: str = ""
    name: str = ""
    type: str = ""


class ChatReaction(BaseModel):
    emoji: str = ""
    user_ids: List[str] = Field(default_factory=list)


class ChatChannelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    channel_type: str = Field(
        default="general",
        pattern="^(general|cabin|activity|staff|announcement)$",
    )
    members: List[str] = Field(default_factory=list)


class ChatChannelCreate(ChatChannelBase):
    pass


class ChatChannelUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    channel_type: Optional[str] = Field(
        default=None,
        pattern="^(general|cabin|activity|staff|announcement)$",
    )
    members: Optional[List[str]] = None
    is_archived: Optional[bool] = None


class ChatChannelResponse(ChatChannelBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    created_by: str
    is_archived: bool = False
    created_at: str
    last_message_at: Optional[str] = None
    last_message_preview: Optional[str] = None


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    message_type: str = Field(
        default="text",
        pattern="^(text|image|file|system)$",
    )
    attachments: List[ChatAttachment] = Field(default_factory=list)


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    channel_id: str
    sender_id: str
    sender_name: str
    sender_avatar: Optional[str] = None
    content: str
    message_type: str = "text"
    attachments: List[ChatAttachment] = Field(default_factory=list)
    reactions: List[ChatReaction] = Field(default_factory=list)
    is_pinned: bool = False
    created_at: str
    updated_at: Optional[str] = None


class UnreadCount(BaseModel):
    channel_id: str
    count: int = 0
