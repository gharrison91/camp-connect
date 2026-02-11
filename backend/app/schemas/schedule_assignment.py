"""
Camp Connect - Schedule Assignment v2 Schemas
Staff and camper assignment to activity/bunk slots with weekly schedule views.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Staff Assignment
# ---------------------------------------------------------------------------


class StaffAssignmentCreate(BaseModel):
    """Assign a staff member to a schedule session (activity time slot)."""

    schedule_id: uuid.UUID
    staff_user_id: uuid.UUID


class StaffAssignmentResponse(BaseModel):
    """Confirmation of staff assignment."""

    schedule_id: uuid.UUID
    staff_user_id: uuid.UUID
    activity_name: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    message: str = "Staff assigned successfully"


# ---------------------------------------------------------------------------
# Camper Assignment
# ---------------------------------------------------------------------------


class CamperAssignmentCreate(BaseModel):
    """Assign a camper to an activity slot or bunk."""

    schedule_id: uuid.UUID
    camper_id: uuid.UUID
    bunk_id: Optional[uuid.UUID] = None


class CamperAssignmentResponse(BaseModel):
    """Confirmation of camper assignment."""

    assignment_id: uuid.UUID
    schedule_id: uuid.UUID
    camper_id: uuid.UUID
    bunk_id: Optional[uuid.UUID] = None
    camper_name: Optional[str] = None
    activity_name: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    message: str = "Camper assigned successfully"


# ---------------------------------------------------------------------------
# Weekly Schedule Views
# ---------------------------------------------------------------------------


class WeeklySlot(BaseModel):
    """A single scheduled slot within a weekly view."""

    schedule_id: uuid.UUID
    activity_id: uuid.UUID
    activity_name: str
    activity_category: Optional[str] = None
    date: date
    start_time: time
    end_time: time
    location: Optional[str] = None
    is_cancelled: bool = False


class StaffWeeklySchedule(BaseModel):
    """A staff member's full weekly schedule."""

    staff_user_id: uuid.UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    department: Optional[str] = None
    week_start: date
    week_end: date
    slots: List[WeeklySlot] = []
    total_hours: float = 0.0


class CamperWeeklySchedule(BaseModel):
    """A camper's full weekly schedule including bunk and activity assignments."""

    camper_id: uuid.UUID
    first_name: str
    last_name: str
    age: Optional[int] = None
    bunk_name: Optional[str] = None
    week_start: date
    week_end: date
    slots: List[WeeklySlot] = []
    total_sessions: int = 0
