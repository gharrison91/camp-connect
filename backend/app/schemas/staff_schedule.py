"""
Camp Connect - Staff Schedule Schemas
Pydantic schemas for staff shift scheduling.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class ShiftBase(BaseModel):
    staff_name: str = Field(..., min_length=1, max_length=255)
    staff_id: Optional[uuid.UUID] = None
    role: str = Field(..., min_length=1, max_length=255)
    shift_type: str = Field(
        default="full_day",
        pattern="^(morning|afternoon|evening|overnight|full_day)$",
    )
    start_time: str = Field(..., min_length=1, max_length=20)
    end_time: str = Field(..., min_length=1, max_length=20)
    location: Optional[str] = Field(default=None, max_length=255)
    day_of_week: str = Field(
        ...,
        pattern="^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$",
    )
    notes: Optional[str] = None
    status: str = Field(
        default="scheduled",
        pattern="^(scheduled|confirmed|completed|cancelled)$",
    )


class ShiftCreate(ShiftBase):
    pass


class ShiftUpdate(BaseModel):
    staff_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    staff_id: Optional[uuid.UUID] = None
    role: Optional[str] = Field(default=None, min_length=1, max_length=255)
    shift_type: Optional[str] = Field(
        default=None,
        pattern="^(morning|afternoon|evening|overnight|full_day)$",
    )
    start_time: Optional[str] = Field(default=None, min_length=1, max_length=20)
    end_time: Optional[str] = Field(default=None, min_length=1, max_length=20)
    location: Optional[str] = Field(default=None, max_length=255)
    day_of_week: Optional[str] = Field(
        default=None,
        pattern="^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$",
    )
    notes: Optional[str] = None
    status: Optional[str] = Field(
        default=None,
        pattern="^(scheduled|confirmed|completed|cancelled)$",
    )


class ShiftResponse(ShiftBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime


class StaffScheduleStats(BaseModel):
    total_shifts: int = 0
    staff_count: int = 0
    by_shift_type: Dict[str, int] = {}
    by_day: Dict[str, int] = {}
    coverage_gaps: int = 0
