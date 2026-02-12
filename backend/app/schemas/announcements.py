"""
Camp Connect - Announcement Schemas
Pydantic schemas for the announcement board feature.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Base / Create / Update
# ---------------------------------------------------------------------------


class AnnouncementBase(BaseModel):
    """Shared fields for announcements."""

    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    category: str = Field(
        default="general",
        pattern="^(general|event|safety|schedule|weather|other)$",
    )
    priority: str = Field(
        default="normal",
        pattern="^(low|normal|high|urgent)$",
    )
    author: str = Field(..., min_length=1, max_length=255)
    target_audience: str = Field(
        default="all",
        pattern="^(all|staff|parents|campers)$",
    )
    is_pinned: bool = False
    expires_at: Optional[datetime] = None


class AnnouncementCreate(AnnouncementBase):
    """Request body to create a new announcement."""

    pass


class AnnouncementUpdate(BaseModel):
    """Request body to update an existing announcement (all fields optional)."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    content: Optional[str] = Field(default=None, min_length=1)
    category: Optional[str] = Field(
        default=None,
        pattern="^(general|event|safety|schedule|weather|other)$",
    )
    priority: Optional[str] = Field(
        default=None,
        pattern="^(low|normal|high|urgent)$",
    )
    author: Optional[str] = Field(default=None, min_length=1, max_length=255)
    target_audience: Optional[str] = Field(
        default=None,
        pattern="^(all|staff|parents|campers)$",
    )
    is_pinned: Optional[bool] = None
    expires_at: Optional[datetime] = None


class Announcement(AnnouncementBase):
    """Full announcement response with server-generated fields."""

    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


class AnnouncementStats(BaseModel):
    """Aggregated announcement statistics."""

    total: int = 0
    active: int = 0
    pinned: int = 0
    by_category: Dict[str, int] = {}
    by_priority: Dict[str, int] = {}
