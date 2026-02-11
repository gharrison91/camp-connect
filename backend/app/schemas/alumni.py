"""
Camp Connect - Alumni Network Schemas
Pydantic models for the alumni directory and stats.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AlumniBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=255)
    last_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    years_attended: List[int] = Field(default_factory=list)
    role: str = Field(
        default="camper",
        pattern="^(camper|staff|both)$",
    )
    graduation_year: Optional[int] = None
    current_city: Optional[str] = Field(default=None, max_length=255)
    current_state: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = None
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    profile_photo_url: Optional[str] = Field(default=None, max_length=500)


class AlumniCreate(AlumniBase):
    pass


class AlumniUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    years_attended: Optional[List[int]] = None
    role: Optional[str] = Field(
        default=None,
        pattern="^(camper|staff|both)$",
    )
    graduation_year: Optional[int] = None
    current_city: Optional[str] = Field(default=None, max_length=255)
    current_state: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = None
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    profile_photo_url: Optional[str] = Field(default=None, max_length=500)


class AlumniResponse(AlumniBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime


class AlumniStats(BaseModel):
    total_alumni: int = 0
    camper_alumni: int = 0
    staff_alumni: int = 0
    avg_years_attended: float = 0.0
