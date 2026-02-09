"""
Camp Connect - Schedule & Event Bunk Config Schemas
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Schedule schemas
# ---------------------------------------------------------------------------


class ScheduleCreate(BaseModel):
    """Request to create a new scheduled session."""

    event_id: uuid.UUID
    activity_id: uuid.UUID
    date: date
    start_time: time
    end_time: time
    location: Optional[str] = Field(default=None, max_length=255)
    staff_user_ids: Optional[List[uuid.UUID]] = None
    max_capacity: Optional[int] = Field(default=None, ge=1)
    notes: Optional[str] = None
    is_cancelled: bool = False


class ScheduleUpdate(BaseModel):
    """Update a scheduled session."""

    activity_id: Optional[uuid.UUID] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = Field(default=None, max_length=255)
    staff_user_ids: Optional[List[uuid.UUID]] = None
    max_capacity: Optional[int] = Field(default=None, ge=1)
    notes: Optional[str] = None
    is_cancelled: Optional[bool] = None


class ScheduleAssignmentResponse(BaseModel):
    """A camper or bunk assignment to a schedule session."""

    id: uuid.UUID
    schedule_id: uuid.UUID
    camper_id: Optional[uuid.UUID] = None
    bunk_id: Optional[uuid.UUID] = None
    assigned_by: Optional[uuid.UUID] = None
    camper_name: Optional[str] = None
    bunk_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScheduleResponse(BaseModel):
    """Scheduled session details."""

    id: uuid.UUID
    event_id: uuid.UUID
    activity_id: uuid.UUID
    activity_name: Optional[str] = None
    date: date
    start_time: time
    end_time: time
    location: Optional[str] = None
    staff_user_ids: Optional[List[uuid.UUID]] = None
    max_capacity: Optional[int] = None
    notes: Optional[str] = None
    is_cancelled: bool
    assignments: List[ScheduleAssignmentResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyViewResponse(BaseModel):
    """Grouped daily schedule view keyed by time slot."""

    date: date
    event_id: uuid.UUID
    time_slots: List[DailyTimeSlot] = []

    model_config = ConfigDict(from_attributes=True)


class DailyTimeSlot(BaseModel):
    """A single time slot with its sessions."""

    start_time: time
    end_time: time
    sessions: List[ScheduleResponse] = []


# Resolve forward reference
DailyViewResponse.model_rebuild()


# ---------------------------------------------------------------------------
# Schedule Assignment schemas
# ---------------------------------------------------------------------------


class ScheduleAssignmentCreate(BaseModel):
    """Request to assign a camper or bunk to a schedule session."""

    schedule_id: uuid.UUID
    camper_id: Optional[uuid.UUID] = None
    bunk_id: Optional[uuid.UUID] = None
    assigned_by: Optional[uuid.UUID] = None


# ---------------------------------------------------------------------------
# Event Bunk Config schemas
# ---------------------------------------------------------------------------


class EventBunkConfigCreate(BaseModel):
    """Request to create an event-specific bunk configuration."""

    event_id: uuid.UUID
    bunk_id: uuid.UUID
    is_active: bool = True
    event_capacity: Optional[int] = Field(default=None, ge=0)
    counselor_user_ids: Optional[List[uuid.UUID]] = None
    notes: Optional[str] = None


class EventBunkConfigUpdate(BaseModel):
    """Update an event-specific bunk configuration."""

    is_active: Optional[bool] = None
    event_capacity: Optional[int] = Field(default=None, ge=0)
    counselor_user_ids: Optional[List[uuid.UUID]] = None
    notes: Optional[str] = None


class EventBunkConfigResponse(BaseModel):
    """Event bunk configuration details."""

    id: uuid.UUID
    event_id: uuid.UUID
    bunk_id: uuid.UUID
    bunk_name: Optional[str] = None
    is_active: bool
    event_capacity: Optional[int] = None
    counselor_user_ids: Optional[List[uuid.UUID]] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
