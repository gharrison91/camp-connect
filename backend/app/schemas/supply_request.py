"""
Camp Connect - Supply Request Schemas
Supply request lifecycle: create, approve/reject, track fulfillment.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SupplyRequestBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(
        default="other",
        pattern="^(office|craft|sports|medical|kitchen|maintenance|other)$",
    )
    priority: str = Field(
        default="medium",
        pattern="^(low|medium|high|urgent)$",
    )
    quantity: int = Field(default=1, ge=1)
    estimated_cost: Optional[float] = Field(default=None, ge=0)
    needed_by: Optional[date] = None
    requested_by: Optional[str] = Field(default=None, max_length=255)


class SupplyRequestCreate(SupplyRequestBase):
    pass


class SupplyRequestUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(
        default=None,
        pattern="^(office|craft|sports|medical|kitchen|maintenance|other)$",
    )
    priority: Optional[str] = Field(
        default=None,
        pattern="^(low|medium|high|urgent)$",
    )
    quantity: Optional[int] = Field(default=None, ge=1)
    estimated_cost: Optional[float] = Field(default=None, ge=0)
    needed_by: Optional[date] = None
    requested_by: Optional[str] = Field(default=None, max_length=255)
    status: Optional[str] = Field(
        default=None,
        pattern="^(pending|approved|ordered|received|rejected)$",
    )
    notes: Optional[str] = None


class SupplyRequestResponse(SupplyRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    status: str = "pending"
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime


class SupplyStats(BaseModel):
    total_requests: int = 0
    pending_count: int = 0
    approved_count: int = 0
    ordered_count: int = 0
    received_count: int = 0
    rejected_count: int = 0
    total_cost: float = 0.0
    avg_fulfillment_days: Optional[float] = None
