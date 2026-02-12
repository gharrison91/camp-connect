"""
Camp Connect - Goal Setting Schemas
Pydantic models for camper goals, milestones, stats, and CRUD operations.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---- Milestone sub-model ----

class Milestone(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    completed: bool = False


# ---- Base ----

class GoalBase(BaseModel):
    camper_id: uuid.UUID
    camper_name: str = Field(..., min_length=1, max_length=255)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(
        default="personal",
        pattern="^(academic|social|physical|creative|personal|other)$",
        description="Goal category",
    )
    target_date: Optional[str] = None
    status: str = Field(
        default="not_started",
        pattern="^(not_started|in_progress|completed|abandoned)$",
        description="Goal status",
    )
    progress: int = Field(default=0, ge=0, le=100)
    milestones: Optional[List[Milestone]] = None
    counselor_notes: Optional[str] = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    camper_id: Optional[uuid.UUID] = None
    camper_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(
        default=None,
        pattern="^(academic|social|physical|creative|personal|other)$",
    )
    target_date: Optional[str] = None
    status: Optional[str] = Field(
        default=None,
        pattern="^(not_started|in_progress|completed|abandoned)$",
    )
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    milestones: Optional[List[Milestone]] = None
    counselor_notes: Optional[str] = None


class Goal(GoalBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class GoalStats(BaseModel):
    total: int = 0
    completed: int = 0
    in_progress: int = 0
    completion_rate: float = 0.0
    by_category: Dict[str, int] = {}
