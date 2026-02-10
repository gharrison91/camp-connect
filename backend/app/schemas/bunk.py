"""
Camp Connect - Bunk & Bunk Assignment Schemas
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Bunk schemas
# ---------------------------------------------------------------------------


class BunkCreate(BaseModel):
    """Request to create a new bunk."""

    name: str = Field(..., min_length=1, max_length=100)
    capacity: int = Field(default=0, ge=0)
    gender_restriction: str = Field(
        default="all", pattern="^(all|male|female)$"
    )
    min_age: Optional[int] = Field(default=None, ge=0)
    max_age: Optional[int] = Field(default=None, ge=0)
    location: Optional[str] = Field(default=None, max_length=255)
    counselor_user_id: Optional[uuid.UUID] = None


class BunkUpdate(BaseModel):
    """Update bunk details."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    capacity: Optional[int] = Field(default=None, ge=0)
    gender_restriction: Optional[str] = Field(
        default=None, pattern="^(all|male|female)$"
    )
    min_age: Optional[int] = Field(default=None, ge=0)
    max_age: Optional[int] = Field(default=None, ge=0)
    location: Optional[str] = Field(default=None, max_length=255)
    counselor_user_id: Optional[uuid.UUID] = None


class BunkResponse(BaseModel):
    """Bunk details."""

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


# ---------------------------------------------------------------------------
# Bunk Assignment schemas
# ---------------------------------------------------------------------------


class BunkAssignmentCreate(BaseModel):
    """Request to assign a camper to a bunk."""

    bunk_id: uuid.UUID
    camper_id: uuid.UUID
    event_id: uuid.UUID
    bed_number: Optional[int] = Field(default=None, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class BunkAssignmentResponse(BaseModel):
    """Bunk assignment with camper info from join."""

    id: uuid.UUID
    bunk_id: uuid.UUID
    camper_id: uuid.UUID
    event_id: uuid.UUID
    bed_number: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    camper_name: Optional[str] = None
    camper_age: Optional[int] = None
    camper_gender: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BunkWithAssignmentsResponse(BaseModel):
    """Bunk info with its current assignments and counselor."""

    id: uuid.UUID
    name: str
    capacity: int
    gender_restriction: str
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    location: Optional[str] = None
    counselor_user_id: Optional[uuid.UUID] = None
    counselor_name: Optional[str] = None
    assignments: List[BunkAssignmentResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BunkCounselorAssign(BaseModel):
    """Request to assign or unassign a counselor to a bunk."""

    counselor_user_id: Optional[uuid.UUID] = None


class BunkMoveRequest(BaseModel):
    """Request to move a camper to a different bunk."""

    new_bunk_id: uuid.UUID


class UnassignedCamperResponse(BaseModel):
    """Camper who is registered for an event but not assigned to a bunk."""

    id: uuid.UUID
    first_name: str
    last_name: str
    age: Optional[int] = None
    gender: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
