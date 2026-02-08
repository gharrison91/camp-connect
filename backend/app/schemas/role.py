"""
Camp Connect - Role Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class RoleCreate(BaseModel):
    """Request to create a new role."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    permissions: list = []


class RoleResponse(BaseModel):
    """Role with permissions."""
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_system: bool = False
    permissions: list = []
    user_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoleUpdate(BaseModel):
    """Update role details."""
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[list] = None
