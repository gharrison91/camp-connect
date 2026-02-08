"""
Camp Connect - Location Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LocationCreate(BaseModel):
    """Request to create a new location."""
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    is_primary: bool = False


class LocationResponse(BaseModel):
    """Location details."""
    id: uuid.UUID
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    is_primary: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LocationUpdate(BaseModel):
    """Update location details."""
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    is_primary: Optional[bool] = None
