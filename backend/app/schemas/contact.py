"""
Camp Connect - Contact Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LinkedCamperResponse(BaseModel):
    """A camper linked to a contact."""
    id: uuid.UUID
    first_name: str
    last_name: str
    relationship_type: str
    is_primary: bool


class ContactCreate(BaseModel):
    """Request to create a new contact."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    relationship_type: str = Field(default="parent", max_length=50)
    notification_preferences: Optional[dict] = None
    account_status: str = Field(default="active", pattern="^(active|guest)$")
    communication_preference: str = Field(
        default="email", pattern="^(email|sms|both)$"
    )


class ContactResponse(BaseModel):
    """Contact details."""
    id: uuid.UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    relationship_type: str
    notification_preferences: Optional[dict] = None
    account_status: str
    communication_preference: str = "email"
    camper_count: int = 0
    linked_campers: list[LinkedCamperResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContactUpdate(BaseModel):
    """Update contact details."""
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    relationship_type: Optional[str] = None
    notification_preferences: Optional[dict] = None
    account_status: Optional[str] = Field(
        default=None, pattern="^(active|guest)$"
    )
    communication_preference: Optional[str] = Field(
        default=None, pattern="^(email|sms|both)$"
    )
