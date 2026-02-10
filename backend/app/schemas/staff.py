"""
Camp Connect - Staff Directory Schemas
Pydantic models for the staff directory listing and profiles.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class StaffListItem(BaseModel):
    """Staff member in directory listings."""

    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None
    role_name: Optional[str] = None
    department: Optional[str] = None
    staff_category: Optional[str] = None
    status: Optional[str] = None
    is_active: bool = True
    phone: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StaffProfile(StaffListItem):
    """Full staff profile with certifications and onboarding details."""

    hire_date: Optional[datetime] = None
    certifications: List[dict] = Field(default_factory=list)
    emergency_contacts: List[Any] = Field(default_factory=list)
    onboarding: Optional[dict] = None
    seasonal_access_start: Optional[date] = None
    seasonal_access_end: Optional[date] = None
    financial_info: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class StaffCategoryUpdate(BaseModel):
    """Update a staff member's category."""

    staff_category: Optional[str] = Field(
        default=None,
        description="Staff category: full_time, counselor, director, or null",
    )


class CounselorListItem(BaseModel):
    """Counselor available for bunk assignment."""

    id: uuid.UUID
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StaffFinancialUpdate(BaseModel):
    """Update a staff member's financial information."""

    financial_info: Optional[dict] = Field(
        default=None,
        description="Financial info: pay_rate, rate_type, start_date, end_date, notes",
    )


class StaffListResponse(BaseModel):
    """Paginated list of staff members."""

    items: List[StaffListItem]
    total: int
