"""
Camp Connect - Staff Directory Schemas
Pydantic models for the staff directory listing and profiles.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class StaffListItem(BaseModel):
    """Staff member in directory listings."""

    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    role_name: Optional[str] = None
    department: Optional[str] = None
    onboarding_status: Optional[str] = None
    is_active: bool = True
    phone: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StaffProfile(StaffListItem):
    """Full staff profile with certifications and onboarding details."""

    certifications: List[dict] = Field(default_factory=list)
    onboarding: Optional[dict] = None
    seasonal_access_start: Optional[date] = None
    seasonal_access_end: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class StaffListResponse(BaseModel):
    """Paginated list of staff members."""

    items: List[StaffListItem]
    total: int
