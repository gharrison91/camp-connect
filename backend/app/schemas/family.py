"""
Camp Connect - Family Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class FamilyCreate(BaseModel):
    """Request to create a new family."""
    family_name: str = Field(..., min_length=1, max_length=255)


class FamilyUpdate(BaseModel):
    """Update family details."""
    family_name: Optional[str] = Field(default=None, min_length=1, max_length=255)


class FamilyMemberCamper(BaseModel):
    """Camper summary within a family response."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: str
    last_name: str
    age: Optional[int] = None
    gender: Optional[str] = None


class FamilyMemberContact(BaseModel):
    """Contact summary within a family response."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    relationship_type: str
    user_id: Optional[uuid.UUID] = None  # non-null = has portal access


class FamilyResponse(BaseModel):
    """Full family details with members."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    family_name: str
    campers: List[FamilyMemberCamper] = []
    contacts: List[FamilyMemberContact] = []
    camper_count: int = 0
    contact_count: int = 0
    created_at: datetime


class FamilyListItem(BaseModel):
    """Family summary for list views."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    family_name: str
    camper_count: int = 0
    contact_count: int = 0
    created_at: datetime


class AddCamperRequest(BaseModel):
    """Request to add a camper to a family."""
    camper_id: uuid.UUID


class AddContactRequest(BaseModel):
    """Request to add a contact to a family."""
    contact_id: uuid.UUID
