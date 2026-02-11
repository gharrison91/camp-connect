"""
Camp Connect - Group Notes Schemas
Shift-based notes for bunks, activities, age groups, and custom groups.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class GroupNoteBase(BaseModel):
    group_name: str = Field(..., min_length=1, max_length=255)
    group_type: str = Field(
        default="bunk",
        pattern="^(bunk|activity|age_group|custom)$",
    )
    note_text: str = Field(..., min_length=1, max_length=5000)
    author_name: str = Field(..., min_length=1, max_length=255)
    shift: str = Field(
        default="morning",
        pattern="^(morning|afternoon|evening|overnight)$",
    )
    priority: str = Field(
        default="normal",
        pattern="^(normal|important|urgent)$",
    )
    tags: List[str] = Field(default_factory=list)


class GroupNoteCreate(GroupNoteBase):
    pass


class GroupNoteUpdate(BaseModel):
    group_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    group_type: Optional[str] = Field(
        default=None,
        pattern="^(bunk|activity|age_group|custom)$",
    )
    note_text: Optional[str] = Field(default=None, min_length=1, max_length=5000)
    author_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    shift: Optional[str] = Field(
        default=None,
        pattern="^(morning|afternoon|evening|overnight)$",
    )
    priority: Optional[str] = Field(
        default=None,
        pattern="^(normal|important|urgent)$",
    )
    tags: Optional[List[str]] = None


class GroupNote(GroupNoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime


class GroupNoteStats(BaseModel):
    total_notes: int
    urgent_count: int
    groups_with_notes: int
    today_count: int
