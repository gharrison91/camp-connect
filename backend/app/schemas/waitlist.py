"""
Camp Connect - Waitlist Schemas
Pydantic schemas for waitlist entry CRUD and workflow actions.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class WaitlistEntryCreate(BaseModel):
    """Request to add a camper to the waitlist."""
    event_id: uuid.UUID
    camper_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    priority: str = Field(default="normal", pattern="^(normal|high|vip)$")
    notes: Optional[str] = None


class WaitlistEntryUpdate(BaseModel):
    """Request to update a waitlist entry."""
    priority: Optional[str] = Field(default=None, pattern="^(normal|high|vip)$")
    notes: Optional[str] = None
    contact_id: Optional[uuid.UUID] = None


class WaitlistEntryRead(BaseModel):
    """Waitlist entry details returned by the API."""
    id: uuid.UUID
    event_id: uuid.UUID
    camper_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    camper_name: Optional[str] = None
    contact_name: Optional[str] = None
    event_name: Optional[str] = None
    position: int
    status: str
    priority: str
    notes: Optional[str] = None
    offered_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WaitlistReorderItem(BaseModel):
    """A single item in a reorder request."""
    id: uuid.UUID
    position: int


class WaitlistReorderRequest(BaseModel):
    """Request to reorder waitlist entries."""
    items: List[WaitlistReorderItem]


class WaitlistOfferRequest(BaseModel):
    """Optional expiry override when offering a spot."""
    expires_in_hours: int = Field(default=48, ge=1, le=720)


# Backwards-compatible alias
WaitlistResponse = WaitlistEntryRead
