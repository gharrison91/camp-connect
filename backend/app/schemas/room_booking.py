"""
Camp Connect - Room Booking Schemas
Pydantic schemas for room/space booking management.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Room schemas
# ---------------------------------------------------------------------------


class RoomBase(BaseModel):
    """Base room fields."""

    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(
        default="other",
        pattern="^(classroom|gym|auditorium|outdoor|meeting_room|arts_room|other)$",
    )
    capacity: int = Field(default=0, ge=0)
    amenities: Optional[List[str]] = None
    is_active: bool = True


class RoomCreate(RoomBase):
    """Request to create a new room."""

    pass


class RoomUpdate(BaseModel):
    """Update room details (all optional)."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional[str] = Field(
        default=None,
        pattern="^(classroom|gym|auditorium|outdoor|meeting_room|arts_room|other)$",
    )
    capacity: Optional[int] = Field(default=None, ge=0)
    amenities: Optional[List[str]] = None
    is_active: Optional[bool] = None


class RoomResponse(BaseModel):
    """Full room response."""

    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    type: str
    capacity: int
    amenities: Optional[List[str]] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Booking schemas
# ---------------------------------------------------------------------------


class BookingBase(BaseModel):
    """Base booking fields."""

    room_id: uuid.UUID
    booked_by: str = Field(..., min_length=1, max_length=255)
    purpose: str = Field(..., min_length=1, max_length=500)
    start_time: datetime
    end_time: datetime
    recurring: bool = False
    recurrence_pattern: Optional[str] = Field(default=None, max_length=255)
    status: str = Field(
        default="confirmed",
        pattern="^(confirmed|pending|cancelled)$",
    )
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    """Request to create a new booking."""

    pass


class BookingUpdate(BaseModel):
    """Update booking details (all optional)."""

    room_id: Optional[uuid.UUID] = None
    booked_by: Optional[str] = Field(default=None, min_length=1, max_length=255)
    purpose: Optional[str] = Field(default=None, min_length=1, max_length=500)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = Field(default=None, max_length=255)
    status: Optional[str] = Field(
        default=None,
        pattern="^(confirmed|pending|cancelled)$",
    )
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    """Full booking response."""

    id: uuid.UUID
    org_id: uuid.UUID
    room_id: uuid.UUID
    room_name: Optional[str] = None
    booked_by: str
    purpose: str
    start_time: datetime
    end_time: datetime
    recurring: bool
    recurrence_pattern: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


class RoomBookingStats(BaseModel):
    """Aggregated room booking statistics."""

    total_rooms: int = 0
    total_bookings: int = 0
    most_booked_room: Optional[str] = None
    utilization_rate: float = 0.0
