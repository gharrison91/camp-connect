"""
Camp Connect - Camper Schemas
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class CamperContactInfo(BaseModel):
    """Contact info attached to a camper."""
    contact_id: uuid.UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    relationship_type: str
    is_primary: bool = False
    is_emergency: bool = False
    is_authorized_pickup: bool = False


class CamperCreate(BaseModel):
    """Request to create a new camper."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(default=None, pattern="^(male|female|other)$")
    school: Optional[str] = Field(default=None, max_length=255)
    grade: Optional[str] = Field(default=None, max_length=20)
    city: Optional[str] = None
    state: Optional[str] = None
    allergies: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    custom_fields: Optional[dict] = None
    reference_photo_url: Optional[str] = None
    # Optional: link contacts during creation
    contacts: Optional[List[CamperContactLink]] = None


class CamperContactLink(BaseModel):
    """Link a contact to a camper during creation/update."""
    contact_id: uuid.UUID
    relationship_type: str = "parent"
    is_primary: bool = False
    is_emergency: bool = False
    is_authorized_pickup: bool = False


# Fix forward reference — CamperCreate references CamperContactLink
CamperCreate.model_rebuild()


class CamperResponse(BaseModel):
    """Camper details."""
    id: uuid.UUID
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    allergies: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    custom_fields: Optional[dict] = None
    reference_photo_url: Optional[str] = None
    contacts: List[CamperContactInfo] = []
    registration_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CamperUpdate(BaseModel):
    """Update camper details."""
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(default=None, pattern="^(male|female|other)$")
    school: Optional[str] = Field(default=None, max_length=255)
    grade: Optional[str] = Field(default=None, max_length=20)
    city: Optional[str] = None
    state: Optional[str] = None
    allergies: Optional[List[str]] = None
    dietary_restrictions: Optional[List[str]] = None
    custom_fields: Optional[dict] = None
    reference_photo_url: Optional[str] = None
