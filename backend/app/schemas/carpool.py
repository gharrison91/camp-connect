"""
Camp Connect - Carpool Schemas
Pydantic schemas for carpool coordination (carpools, riders, stats).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- Carpool ---


class CarpoolBase(BaseModel):
    """Shared carpool fields."""

    driver_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=30)
    email: Optional[str] = Field(default=None, max_length=255)
    pickup_location: str = Field(..., min_length=1, max_length=500)
    dropoff_location: str = Field(default="Camp", max_length=500)
    departure_time: str = Field(
        ..., min_length=1, max_length=50, description="e.g. 7:30 AM"
    )
    seats_available: int = Field(..., ge=1, le=20)
    days: List[str] = Field(
        default_factory=list,
        description="e.g. ['Monday', 'Wednesday', 'Friday']",
    )
    notes: Optional[str] = Field(default=None, max_length=1000)


class CarpoolCreate(CarpoolBase):
    """Request to create a new carpool."""

    pass


class CarpoolUpdate(BaseModel):
    """Update carpool details (all fields optional)."""

    driver_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=30)
    email: Optional[str] = Field(default=None, max_length=255)
    pickup_location: Optional[str] = Field(
        default=None, min_length=1, max_length=500
    )
    dropoff_location: Optional[str] = Field(default=None, max_length=500)
    departure_time: Optional[str] = Field(default=None, max_length=50)
    seats_available: Optional[int] = Field(default=None, ge=1, le=20)
    days: Optional[List[str]] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class CarpoolRiderResponse(BaseModel):
    """A rider assigned to a carpool."""

    id: uuid.UUID
    carpool_id: uuid.UUID
    camper_name: str
    parent_name: str
    status: str  # pending | confirmed
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CarpoolResponse(BaseModel):
    """Full carpool details with rider count."""

    id: uuid.UUID
    org_id: uuid.UUID
    driver_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    pickup_location: str
    dropoff_location: str
    departure_time: str
    seats_available: int
    days: List[str] = []
    notes: Optional[str] = None
    rider_count: int = 0
    riders: List[CarpoolRiderResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Rider Create ---


class CarpoolRiderCreate(BaseModel):
    """Request to add a rider to a carpool."""

    camper_name: str = Field(..., min_length=1, max_length=255)
    parent_name: str = Field(..., min_length=1, max_length=255)
    status: str = Field(
        default="pending",
        pattern="^(pending|confirmed)$",
    )


class CarpoolRiderUpdate(BaseModel):
    """Update a rider status."""

    status: str = Field(
        ...,
        pattern="^(pending|confirmed)$",
    )


# --- Stats ---


class CarpoolStats(BaseModel):
    """Aggregated carpool statistics."""

    total: int = 0
    active: int = 0
    total_riders: int = 0
    avg_occupancy: float = 0.0
