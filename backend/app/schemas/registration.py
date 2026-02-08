"""
Camp Connect - Registration Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class RegistrationCreate(BaseModel):
    """Request to register a camper for an event."""
    camper_id: uuid.UUID
    event_id: uuid.UUID
    registered_by: Optional[uuid.UUID] = None  # contact_id
    activity_requests: Optional[List[str]] = None
    special_requests: Optional[str] = None


class RegistrationResponse(BaseModel):
    """Registration details."""
    id: uuid.UUID
    camper_id: uuid.UUID
    event_id: uuid.UUID
    registered_by: Optional[uuid.UUID] = None
    camper_name: Optional[str] = None
    event_name: Optional[str] = None
    status: str
    payment_status: str
    activity_requests: Optional[List[str]] = None
    special_requests: Optional[str] = None
    registered_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RegistrationUpdate(BaseModel):
    """Update registration details."""
    status: Optional[str] = Field(
        default=None,
        pattern="^(pending|confirmed|cancelled|waitlisted)$",
    )
    payment_status: Optional[str] = Field(
        default=None,
        pattern="^(unpaid|deposit_paid|paid|refunded)$",
    )
    activity_requests: Optional[List[str]] = None
    special_requests: Optional[str] = None
