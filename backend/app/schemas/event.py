"""
Camp Connect - Event Schemas
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class EventCreate(BaseModel):
    """Request to create a new event."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    location_id: Optional[uuid.UUID] = None
    start_date: date
    end_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    capacity: int = Field(default=0, ge=0)
    min_age: Optional[int] = Field(default=None, ge=0)
    max_age: Optional[int] = Field(default=None, ge=0)
    gender_restriction: str = Field(default="all", pattern="^(all|male|female)$")
    price: Decimal = Field(default=Decimal("0.00"), ge=0)
    deposit_amount: Optional[Decimal] = Field(default=None, ge=0)
    deposit_required: bool = False
    tax_rate: Optional[Decimal] = Field(default=None, ge=0)
    status: str = Field(default="draft", pattern="^(draft|published|full|archived)$")
    registration_open_date: Optional[date] = None
    registration_close_date: Optional[date] = None


class EventResponse(BaseModel):
    """Event details."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    location_id: Optional[uuid.UUID] = None
    location_name: Optional[str] = None
    start_date: date
    end_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    capacity: int
    enrolled_count: int
    waitlist_count: int
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    gender_restriction: str
    price: Decimal
    deposit_amount: Optional[Decimal] = None
    deposit_required: bool
    tax_rate: Optional[Decimal] = None
    status: str
    registration_open_date: Optional[date] = None
    registration_close_date: Optional[date] = None
    cloned_from_event_id: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventUpdate(BaseModel):
    """Update event details."""
    name: Optional[str] = None
    description: Optional[str] = None
    location_id: Optional[uuid.UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    capacity: Optional[int] = Field(default=None, ge=0)
    min_age: Optional[int] = Field(default=None, ge=0)
    max_age: Optional[int] = Field(default=None, ge=0)
    gender_restriction: Optional[str] = Field(
        default=None, pattern="^(all|male|female)$"
    )
    price: Optional[Decimal] = Field(default=None, ge=0)
    deposit_amount: Optional[Decimal] = Field(default=None, ge=0)
    deposit_required: Optional[bool] = None
    tax_rate: Optional[Decimal] = Field(default=None, ge=0)
    status: Optional[str] = Field(
        default=None, pattern="^(draft|published|full|archived)$"
    )
    registration_open_date: Optional[date] = None
    registration_close_date: Optional[date] = None


class EventClone(BaseModel):
    """Request to clone an event."""
    name: Optional[str] = None
    start_date: date
    end_date: date
