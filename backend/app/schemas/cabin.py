"""
Camp Connect - Cabin Schemas
CRUD schemas for the Cabin model (physical building containing multiple bunks).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CabinCreate(BaseModel):
    """Request to create a new cabin."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    location: Optional[str] = Field(default=None, max_length=255)
    total_capacity: int = Field(default=0, ge=0)
    gender_restriction: str = Field(default="all", pattern="^(all|male|female)$")
    is_active: bool = Field(default=True)


class CabinUpdate(BaseModel):
    """Update cabin details."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    location: Optional[str] = Field(default=None, max_length=255)
    total_capacity: Optional[int] = Field(default=None, ge=0)
    gender_restriction: Optional[str] = Field(
        default=None, pattern="^(all|male|female)$"
    )
    is_active: Optional[bool] = None


class CabinBunkSummary(BaseModel):
    """Compact bunk info nested inside a cabin response."""

    id: uuid.UUID
    name: str
    capacity: int
    gender_restriction: str
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    location: Optional[str] = None
    counselor_user_id: Optional[uuid.UUID] = None
    counselor_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CabinResponse(BaseModel):
    """Cabin details (flat, no nested bunks)."""

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    total_capacity: int
    gender_restriction: str
    is_active: bool
    bunk_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CabinWithBunksResponse(BaseModel):
    """Cabin with its nested bunk list."""

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    total_capacity: int
    gender_restriction: str
    is_active: bool
    bunks: List[CabinBunkSummary] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
