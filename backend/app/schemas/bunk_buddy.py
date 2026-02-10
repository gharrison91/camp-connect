"""
Camp Connect - Bunk Buddy Request Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class BuddyRequestCreate(BaseModel):
    """Create a bunk buddy request."""
    event_id: uuid.UUID
    requester_camper_id: uuid.UUID
    requested_camper_id: uuid.UUID
    submitted_by_contact_id: Optional[uuid.UUID] = None


class BuddyRequestUpdate(BaseModel):
    """Approve or deny a bunk buddy request."""
    status: str = Field(..., pattern="^(approved|denied)$")
    admin_notes: Optional[str] = None


class BuddyRequestResponse(BaseModel):
    """Bunk buddy request response."""
    id: uuid.UUID
    event_id: uuid.UUID
    event_name: Optional[str] = None
    requester_camper_id: uuid.UUID
    requester_name: str
    requested_camper_id: uuid.UUID
    requested_name: str
    status: str
    is_mutual: bool = False
    submitted_by_contact_id: Optional[uuid.UUID] = None
    submitted_by_name: Optional[str] = None
    admin_notes: Optional[str] = None
    reviewed_by: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
