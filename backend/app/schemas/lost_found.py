"""
Camp Connect - Lost & Found Schemas
Item tracking: report found items, claim workflow, disposal.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LostItemBase(BaseModel):
    item_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(
        default="other",
        pattern="^(clothing|electronics|sports|personal|other)$",
    )
    location_found: Optional[str] = Field(default=None, max_length=255)
    found_date: Optional[date] = None
    found_by: Optional[str] = Field(default=None, max_length=255)
    photo_url: Optional[str] = None
    claimed_by: Optional[str] = Field(default=None, max_length=255)
    claimed_date: Optional[date] = None
    status: str = Field(
        default="unclaimed",
        pattern="^(unclaimed|claimed|disposed)$",
    )


class LostItemCreate(LostItemBase):
    pass


class LostItemUpdate(BaseModel):
    item_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(
        default=None,
        pattern="^(clothing|electronics|sports|personal|other)$",
    )
    location_found: Optional[str] = Field(default=None, max_length=255)
    found_date: Optional[date] = None
    found_by: Optional[str] = Field(default=None, max_length=255)
    photo_url: Optional[str] = None
    claimed_by: Optional[str] = Field(default=None, max_length=255)
    claimed_date: Optional[date] = None
    status: Optional[str] = Field(
        default=None,
        pattern="^(unclaimed|claimed|disposed)$",
    )


class LostItem(LostItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime


class LostFoundStats(BaseModel):
    total_items: int = 0
    unclaimed: int = 0
    claimed: int = 0
    disposed: int = 0
