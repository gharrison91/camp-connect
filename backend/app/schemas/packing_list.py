"""
Camp Connect - Packing List Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PackingListItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(
        default="Other",
        pattern="^(Clothing|Toiletries|Bedding|Equipment|Personal|Other)$",
    )
    required: bool = Field(default=True)
    quantity: int = Field(default=1, ge=1)


class PackingListTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="", max_length=2000)
    event_id: Optional[str] = None
    items: List[PackingListItem] = Field(default_factory=list)


class PackingListTemplateCreate(PackingListTemplateBase):
    pass


class PackingListTemplateUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    event_id: Optional[str] = None
    items: Optional[List[PackingListItem]] = None


class PackingListTemplateResponse(PackingListTemplateBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime


class PackingListAssignRequest(BaseModel):
    template_id: uuid.UUID
    camper_ids: List[uuid.UUID] = Field(..., min_length=1)


class PackingListCheckRequest(BaseModel):
    item_name: str = Field(..., min_length=1)
    checked: bool


class PackingListAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    template_id: uuid.UUID
    template_name: str = ""
    camper_id: uuid.UUID
    camper_name: str = ""
    event_name: str = ""
    items: List[PackingListItem] = Field(default_factory=list)
    items_checked: List[str] = Field(default_factory=list)
    status: str = "not_started"
    created_at: datetime


class PackingListStats(BaseModel):
    total_templates: int = 0
    active_assignments: int = 0
    completion_rate: float = 0.0
    fully_packed: int = 0
