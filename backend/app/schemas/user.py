"""
Camp Connect - User Schemas
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UserResponse(BaseModel):
    """Full user response."""
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role_id: uuid.UUID
    role_name: Optional[str] = None
    is_active: bool
    seasonal_access_start: Optional[date] = None
    seasonal_access_end: Optional[date] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserInvite(BaseModel):
    """Request to invite a new user."""
    email: EmailStr
    first_name: str
    last_name: str
    role_id: uuid.UUID


class UserUpdate(BaseModel):
    """Update user details."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    seasonal_access_start: Optional[date] = None
    seasonal_access_end: Optional[date] = None
