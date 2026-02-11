"""
Camp Connect - Attendance Tracking Schemas
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AttendanceRecordCreate(BaseModel):
    """Request to record a single attendance entry."""

    camper_id: uuid.UUID
    camper_name: str = Field(..., min_length=1, max_length=255)
    activity_id: uuid.UUID
    activity_name: str = Field(..., min_length=1, max_length=255)
    date: date
    status: str = Field(
        default="present",
        pattern="^(present|absent|late|excused)$",
    )
    check_in_time: Optional[time] = None
    check_out_time: Optional[time] = None
    checked_in_by: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None


class AttendanceBulkCreate(BaseModel):
    """Batch attendance submission for an activity session."""

    activity_id: uuid.UUID
    activity_name: str = Field(..., min_length=1, max_length=255)
    date: date
    period: Optional[str] = Field(default=None, max_length=100)
    records: List[AttendanceRecordCreate]


class AttendanceRecordResponse(BaseModel):
    """Single attendance record response."""

    id: uuid.UUID
    org_id: uuid.UUID
    camper_id: uuid.UUID
    camper_name: str
    activity_id: uuid.UUID
    activity_name: str
    date: date
    status: str
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    checked_in_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceSessionResponse(BaseModel):
    """Summary of a single attendance session."""

    id: uuid.UUID
    org_id: uuid.UUID
    activity_id: uuid.UUID
    activity_name: str
    date: date
    period: Optional[str] = None
    total_expected: int
    total_present: int
    total_absent: int
    total_late: int

    model_config = ConfigDict(from_attributes=True)


class FrequentAbsence(BaseModel):
    """A camper with frequent absences."""

    camper_id: uuid.UUID
    camper_name: str
    absence_count: int


class AttendanceStatsResponse(BaseModel):
    """Aggregate attendance statistics."""

    attendance_rate: float
    total_sessions: int
    perfect_attendance_count: int
    frequent_absences: List[FrequentAbsence]

    model_config = ConfigDict(from_attributes=True)
