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


# --- Buddy Settings (v2) -------------------------------------------------


class BuddySettingsResponse(BaseModel):
    """Bunk buddy request settings for the organization."""
    max_requests_per_camper: int = 3
    request_deadline: Optional[str] = None
    allow_portal_requests: bool = True


class BuddySettingsUpdate(BaseModel):
    """Update bunk buddy request settings."""
    max_requests_per_camper: Optional[int] = Field(default=None, ge=1, le=20)
    request_deadline: Optional[str] = None
    allow_portal_requests: Optional[bool] = None


# --- Portal Buddy Request (v2) -------------------------------------------


class PortalBuddyRequestCreate(BaseModel):
    """Parent submits a buddy request from the portal."""
    event_id: uuid.UUID
    requester_camper_id: uuid.UUID
    requested_camper_name: str = Field(
        ..., min_length=1, max_length=200,
        description="Name of the buddy the parent wants (free text)"
    )


class PortalBuddyRequestResponse(BaseModel):
    """Portal-facing buddy request display."""
    id: uuid.UUID
    event_id: uuid.UUID
    event_name: Optional[str] = None
    requester_camper_id: uuid.UUID
    requester_name: str
    requested_camper_id: Optional[uuid.UUID] = None
    requested_name: str
    status: str
    is_mutual: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
