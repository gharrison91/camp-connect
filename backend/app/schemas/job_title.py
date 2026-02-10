"""
Camp Connect - Job Title Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class JobTitleCreate(BaseModel):
    """Request to create a new job title."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class JobTitleUpdate(BaseModel):
    """Request to update a job title."""
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)


class JobTitleResponse(BaseModel):
    """Job title response."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_system: bool = False
    staff_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
