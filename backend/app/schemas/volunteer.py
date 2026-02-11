"""
Camp Connect - Volunteer Management Schemas
Pydantic models for volunteers and volunteer shifts.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class VolunteerBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    status: str = Field(default="pending", description="active | inactive | pending")
    skills: List[str] = Field(default_factory=list)
    availability: List[str] = Field(default_factory=list, description="List of day strings")
    background_check_status: str = Field(default="pending", description="pending | cleared | failed")
    hours_logged: float = 0.0
    start_date: Optional[date] = None
    notes: Optional[str] = None


class VolunteerCreate(VolunteerBase):
    pass


class VolunteerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    skills: Optional[List[str]] = None
    availability: Optional[List[str]] = None
    background_check_status: Optional[str] = None
    hours_logged: Optional[float] = None
    start_date: Optional[date] = None
    notes: Optional[str] = None


class VolunteerResponse(VolunteerBase):
    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShiftBase(BaseModel):
    volunteer_id: uuid.UUID
    volunteer_name: str
    activity: str
    location: Optional[str] = None
    date: date
    start_time: str = Field(description="HH:MM format")
    end_time: str = Field(description="HH:MM format")
    hours: float = 0.0
    status: str = Field(default="scheduled", description="scheduled | completed | cancelled | no_show")
    notes: Optional[str] = None


class ShiftCreate(ShiftBase):
    pass


class ShiftUpdate(BaseModel):
    volunteer_id: Optional[uuid.UUID] = None
    volunteer_name: Optional[str] = None
    activity: Optional[str] = None
    location: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    hours: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ShiftResponse(ShiftBase):
    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
