"""
Camp Connect - Transportation Schemas
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- Route Stop ---

class RouteStop(BaseModel):
    stop_order: int = Field(..., ge=1)
    location_name: str = Field(..., min_length=1, max_length=255)
    address: str = Field(default="", max_length=500)
    estimated_time: Optional[str] = None
    camper_ids: List[uuid.UUID] = Field(default_factory=list)


# --- Vehicles ---

class VehicleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(default="bus", pattern="^(bus|van|car)$")
    capacity: int = Field(default=40, ge=1)
    license_plate: str = Field(default="", max_length=20)
    driver_name: str = Field(default="", max_length=255)
    driver_phone: str = Field(default="", max_length=30)
    status: str = Field(default="active", pattern="^(active|maintenance|retired)$")
    notes: str = Field(default="", max_length=2000)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional[str] = Field(default=None, pattern="^(bus|van|car)$")
    capacity: Optional[int] = Field(default=None, ge=1)
    license_plate: Optional[str] = Field(default=None, max_length=20)
    driver_name: Optional[str] = Field(default=None, max_length=255)
    driver_phone: Optional[str] = Field(default=None, max_length=30)
    status: Optional[str] = Field(default=None, pattern="^(active|maintenance|retired)$")
    notes: Optional[str] = Field(default=None, max_length=2000)


class VehicleResponse(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime


# --- Routes ---

class RouteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    vehicle_id: Optional[uuid.UUID] = None
    route_type: str = Field(default="pickup", pattern="^(pickup|dropoff|field_trip)$")
    date: date
    departure_time: str = Field(default="08:00", max_length=10)
    arrival_time: str = Field(default="09:00", max_length=10)
    stops: List[RouteStop] = Field(default_factory=list)
    status: str = Field(default="scheduled", pattern="^(scheduled|in_progress|completed|cancelled)$")


class RouteCreate(RouteBase):
    pass


class RouteUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    vehicle_id: Optional[uuid.UUID] = None
    route_type: Optional[str] = Field(default=None, pattern="^(pickup|dropoff|field_trip)$")
    date: Optional[date] = None
    departure_time: Optional[str] = Field(default=None, max_length=10)
    arrival_time: Optional[str] = Field(default=None, max_length=10)
    stops: Optional[List[RouteStop]] = None
    status: Optional[str] = Field(default=None, pattern="^(scheduled|in_progress|completed|cancelled)$")


class RouteResponse(RouteBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    org_id: uuid.UUID
    vehicle_name: Optional[str] = None
    created_at: datetime


# --- Stats ---

class TransportationStats(BaseModel):
    total_vehicles: int = 0
    active_routes: int = 0
    campers_transported_today: int = 0
