"""
Camp Connect - Camp Session Schemas
"""

from pydantic import BaseModel
from datetime import date, datetime
from uuid import UUID
from typing import Optional


class CampSessionBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    capacity: int = 50
    price: Optional[float] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None


class CampSessionCreate(CampSessionBase):
    pass


class CampSessionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    capacity: Optional[int] = None
    price: Optional[float] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    status: Optional[str] = None


class CampSession(CampSessionBase):
    id: UUID
    organization_id: UUID
    enrolled_count: int = 0
    waitlist_count: int = 0
    status: str = "upcoming"
    created_at: datetime

    class Config:
        from_attributes = True


class SessionEnrollment(BaseModel):
    id: UUID
    session_id: UUID
    camper_id: UUID
    camper_name: Optional[str] = None
    status: str = "enrolled"
    enrolled_at: datetime

    class Config:
        from_attributes = True


class SessionStats(BaseModel):
    total_sessions: int
    active_sessions: int
    total_enrolled: int
    total_capacity: int
    occupancy_rate: float
