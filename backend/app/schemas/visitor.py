"""
Camp Connect - Visitor Management Schemas
Pydantic models for visitor check-in/out tracking and pre-registration.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VisitorBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(default="", max_length=255)
    phone: str = Field(default="", max_length=30)
    company: str = Field(default="", max_length=255)
    visitor_type: str = Field(
        default="guest",
        pattern="^(parent|vendor|inspector|guest|contractor)$",
    )
    purpose: str = Field(default="", max_length=500)
    visiting_camper_id: Optional[str] = None
    visiting_camper_name: str = Field(default="", max_length=200)
    host_staff_id: Optional[str] = None
    host_staff_name: str = Field(default="", max_length=200)
    badge_number: str = Field(default="", max_length=20)
    photo_url: str = Field(default="", max_length=500)
    vehicle_info: str = Field(default="", max_length=300)
    id_verified: bool = False
    notes: str = Field(default="", max_length=2000)


class VisitorCreate(VisitorBase):
    status: str = Field(
        default="pre_registered",
        pattern="^(pre_registered|checked_in|checked_out|denied)$",
    )


class VisitorUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=30)
    company: Optional[str] = Field(default=None, max_length=255)
    visitor_type: Optional[str] = Field(
        default=None,
        pattern="^(parent|vendor|inspector|guest|contractor)$",
    )
    purpose: Optional[str] = Field(default=None, max_length=500)
    visiting_camper_id: Optional[str] = None
    visiting_camper_name: Optional[str] = Field(default=None, max_length=200)
    host_staff_id: Optional[str] = None
    host_staff_name: Optional[str] = Field(default=None, max_length=200)
    badge_number: Optional[str] = Field(default=None, max_length=20)
    photo_url: Optional[str] = Field(default=None, max_length=500)
    vehicle_info: Optional[str] = Field(default=None, max_length=300)
    id_verified: Optional[bool] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[str] = Field(
        default=None,
        pattern="^(pre_registered|checked_in|checked_out|denied)$",
    )


class VisitorResponse(VisitorBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    status: str
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    created_at: str


class VisitorStats(BaseModel):
    checked_in_today: int = 0
    total_today: int = 0
    most_common_type: str = "guest"
    avg_visit_duration: float = 0.0
