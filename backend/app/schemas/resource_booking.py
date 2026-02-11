"""
Camp Connect - Resource Booking Schemas
Pydantic models for resource booking API requests and responses.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Resource schemas
# ---------------------------------------------------------------------------

class ResourceCreate(BaseModel):
    """Request to create a new bookable resource."""

    name: str = Field(..., min_length=1, max_length=255)
    resource_type: str = Field(
        default="facility",
        pattern="^(facility|equipment|vehicle|other)$",
    )
    description: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=255)
    capacity: Optional[int] = Field(default=None, ge=1)
    available: bool = True


class ResourceUpdate(BaseModel):
    """Update a resource. All fields optional."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    resource_type: Optional[str] = Field(
        default=None,
        pattern="^(facility|equipment|vehicle|other)$",
    )
    description: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=255)
    capacity: Optional[int] = Field(default=None, ge=1)
    available: Optional[bool] = None


class ResourceResponse(BaseModel):
    """Resource details returned by the API."""

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    resource_type: str
    description: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    available: bool
    booking_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Booking schemas
# ---------------------------------------------------------------------------

class BookingCreate(BaseModel):
    """Request to book a resource."""

    resource_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=255)
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None
    status: str = Field(
        default="pending",
        pattern="^(pending|confirmed|cancelled)$",
    )


class BookingUpdate(BaseModel):
    """Update a booking. All fields optional."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(
        default=None,
        pattern="^(pending|confirmed|cancelled)$",
    )


class BookingResponse(BaseModel):
    """Booking details returned by the API."""

    id: uuid.UUID
    resource_id: uuid.UUID
    resource_name: str = ""
    booked_by: uuid.UUID
    booked_by_name: str = ""
    title: str
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

class ResourceStats(BaseModel):
    """Aggregate stats for the resource booking dashboard."""

    total_resources: int = 0
    total_bookings: int = 0
    upcoming_bookings: int = 0
    utilization_rate: float = 0.0
