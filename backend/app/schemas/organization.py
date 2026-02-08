"""
Camp Connect - Organization Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class OrganizationResponse(BaseModel):
    """Organization details."""
    id: uuid.UUID
    name: str
    slug: str
    logo_url: Optional[str] = None
    brand_colors: Optional[dict] = None
    domain: Optional[str] = None
    settings: dict = {}
    enabled_modules: list = ["core"]
    subscription_tier: str = "free"
    marketplace_visible: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationUpdate(BaseModel):
    """Update organization details."""
    name: Optional[str] = None
    logo_url: Optional[str] = None
    brand_colors: Optional[dict] = None
    domain: Optional[str] = None
    settings: Optional[dict] = None
    enabled_modules: Optional[list] = None
    marketplace_visible: Optional[bool] = None
