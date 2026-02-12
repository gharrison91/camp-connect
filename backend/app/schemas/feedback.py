"""
Camp Connect - Feedback Schemas
Pydantic schemas for feedback collection (entries, stats).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class FeedbackBase(BaseModel):
    """Shared fields for feedback entries."""

    submitted_by: str = Field(..., min_length=1, max_length=255)
    submitter_type: str = Field(..., pattern="^(parent|camper|staff)$")
    category: str = Field(default="general", pattern="^(general|activity|facility|food|staff|safety|other)$")
    rating: int = Field(..., ge=1, le=5)
    title: str = Field(..., min_length=1, max_length=255)
    comment: str = Field(..., min_length=1, max_length=5000)
    is_anonymous: bool = False
    response: Optional[str] = Field(default=None, max_length=5000)
    responded_by: Optional[str] = Field(default=None, max_length=255)
    responded_at: Optional[datetime] = None
    status: str = Field(default="new", pattern="^(new|reviewed|addressed|archived)$")


class FeedbackCreate(FeedbackBase):
    """Request to create a new feedback entry."""
    pass


class FeedbackUpdate(BaseModel):
    """Update a feedback entry (all fields optional)."""

    submitted_by: Optional[str] = Field(default=None, min_length=1, max_length=255)
    submitter_type: Optional[str] = Field(default=None, pattern="^(parent|camper|staff)$")
    category: Optional[str] = Field(default=None, pattern="^(general|activity|facility|food|staff|safety|other)$")
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    comment: Optional[str] = Field(default=None, min_length=1, max_length=5000)
    is_anonymous: Optional[bool] = None
    response: Optional[str] = Field(default=None, max_length=5000)
    responded_by: Optional[str] = Field(default=None, max_length=255)
    responded_at: Optional[datetime] = None
    status: Optional[str] = Field(default=None, pattern="^(new|reviewed|addressed|archived)$")


class FeedbackResponse(FeedbackBase):
    """Full feedback entry response with id, org_id, timestamps."""

    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedbackStats(BaseModel):
    """Aggregated feedback statistics."""

    total: int = 0
    avg_rating: float = 0.0
    new_count: int = 0
    by_category: Dict[str, int] = {}
    by_submitter_type: Dict[str, int] = {}
