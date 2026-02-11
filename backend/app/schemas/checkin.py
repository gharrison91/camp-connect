"""
Camp Connect - Check-In / Check-Out Schemas
Pydantic models for daily camper check-in and check-out tracking.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CheckInCreate(BaseModel):
    """Request body to create a check-in or check-out record."""

    camper_id: uuid.UUID
    camper_name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(
        ...,
        pattern="^(check_in|check_out)$",
        description="Whether this is a check-in or check-out event",
    )
    guardian_name: Optional[str] = Field(default=None, max_length=255)
    guardian_relationship: Optional[str] = Field(default=None, max_length=100)
    guardian_id_verified: bool = False
    method: str = Field(
        default="in_person",
        pattern="^(in_person|carpool|bus)$",
    )
    notes: Optional[str] = None
    checked_by: Optional[str] = Field(default=None, max_length=255)


class CheckInRecord(BaseModel):
    """A single check-in / check-out record returned from the API."""

    id: uuid.UUID
    org_id: uuid.UUID
    camper_id: uuid.UUID
    camper_name: str
    type: str
    guardian_name: Optional[str] = None
    guardian_relationship: Optional[str] = None
    guardian_id_verified: bool = False
    method: str = "in_person"
    notes: Optional[str] = None
    checked_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckInStats(BaseModel):
    """Aggregate check-in statistics for the current day."""

    total_today: int = 0
    checked_in: int = 0
    checked_out: int = 0
    pending: int = 0
    attendance_rate: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class TodayStatus(BaseModel):
    """A camper's current check-in status for the day."""

    camper_id: uuid.UUID
    camper_name: str
    status: str = Field(
        description="Current status: checked_in | checked_out | pending"
    )
    last_action: Optional[CheckInRecord] = None

    model_config = ConfigDict(from_attributes=True)


class TodayResponse(BaseModel):
    """Response wrapper for today's check-in list."""

    campers: List[TodayStatus]
    stats: CheckInStats

    model_config = ConfigDict(from_attributes=True)
