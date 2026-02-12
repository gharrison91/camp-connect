"""
Camp Connect - Behavior Tracking Schemas
Pydantic models for behavior log entries, stats, and CRUD operations.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---- Base ----

class BehaviorLogBase(BaseModel):
    camper_id: uuid.UUID
    camper_name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(
        ...,
        pattern="^(positive|concern|incident|follow_up)$",
        description="Log type: positive, concern, incident, or follow_up",
    )
    category: str = Field(
        default="other",
        pattern="^(social|academic|safety|health|behavioral|other)$",
        description="Behavior category",
    )
    description: str = Field(..., min_length=1)
    severity: str = Field(
        default="low",
        pattern="^(low|medium|high|critical)$",
        description="Severity level",
    )
    reported_by: str = Field(..., min_length=1, max_length=255)
    action_taken: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    parent_notified: bool = False
    notes: Optional[str] = None


class BehaviorLogCreate(BehaviorLogBase):
    pass


class BehaviorLogUpdate(BaseModel):
    camper_id: Optional[uuid.UUID] = None
    camper_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional[str] = Field(
        default=None,
        pattern="^(positive|concern|incident|follow_up)$",
    )
    category: Optional[str] = Field(
        default=None,
        pattern="^(social|academic|safety|health|behavioral|other)$",
    )
    description: Optional[str] = Field(default=None, min_length=1)
    severity: Optional[str] = Field(
        default=None,
        pattern="^(low|medium|high|critical)$",
    )
    reported_by: Optional[str] = Field(default=None, min_length=1, max_length=255)
    action_taken: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None
    parent_notified: Optional[bool] = None
    notes: Optional[str] = None


class BehaviorLog(BehaviorLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class BehaviorStats(BaseModel):
    total_logs: int = 0
    positive: int = 0
    concerns: int = 0
    incidents: int = 0
    follow_ups_pending: int = 0
    by_severity: Dict[str, int] = {}
