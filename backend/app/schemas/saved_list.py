"""
Camp Connect - Saved List Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SavedListCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    list_type: str = "static"  # static, dynamic
    entity_type: str = "contact"  # contact, camper
    filter_criteria: Optional[Dict[str, Any]] = None


class SavedListUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    list_type: Optional[str] = None
    entity_type: Optional[str] = None
    filter_criteria: Optional[Dict[str, Any]] = None


class SavedListResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    list_type: str
    entity_type: str
    filter_criteria: Optional[Dict[str, Any]] = None
    member_count: int = 0
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime


class SavedListMemberResponse(BaseModel):
    id: uuid.UUID
    list_id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    entity_name: Optional[str] = None
    entity_email: Optional[str] = None
    added_at: datetime


class SavedListMemberCreate(BaseModel):
    entity_type: str
    entity_id: uuid.UUID


class SavedListDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    list_type: str
    entity_type: str
    filter_criteria: Optional[Dict[str, Any]] = None
    member_count: int = 0
    members: List[SavedListMemberResponse] = []
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
