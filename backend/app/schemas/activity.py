"""
Camp Connect - Activity Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ActivityCreate(BaseModel):
    """Request to create a new activity."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(
        default="other",
        pattern="^(sports|arts|nature|water|education|other)$",
    )
    location: Optional[str] = Field(default=None, max_length=255)
    capacity: int = Field(default=0, ge=0)
    min_age: Optional[int] = Field(default=None, ge=0)
    max_age: Optional[int] = Field(default=None, ge=0)
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    staff_required: int = Field(default=1, ge=0)
    equipment_needed: Optional[List[str]] = None
    is_active: bool = True


class ActivityUpdate(BaseModel):
    """Update activity details."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(
        default=None,
        pattern="^(sports|arts|nature|water|education|other)$",
    )
    location: Optional[str] = Field(default=None, max_length=255)
    capacity: Optional[int] = Field(default=None, ge=0)
    min_age: Optional[int] = Field(default=None, ge=0)
    max_age: Optional[int] = Field(default=None, ge=0)
    duration_minutes: Optional[int] = Field(default=None, ge=1)
    staff_required: Optional[int] = Field(default=None, ge=0)
    equipment_needed: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ActivityResponse(BaseModel):
    """Activity details."""

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: str
    location: Optional[str] = None
    capacity: int
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    duration_minutes: Optional[int] = None
    staff_required: int
    equipment_needed: Optional[List[str]] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
