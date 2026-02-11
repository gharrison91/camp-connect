"""
Camp Connect - Skill Tracking Schemas
Camper skill progression and evaluation tracking.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SkillLevel(BaseModel):
    level: int = Field(..., ge=1, le=5)
    name: str
    description: str = ""
    criteria: str = ""


class SkillCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    color: str = Field(default="#10B981", max_length=20)
    icon: str = Field(default="star", max_length=50)
    sort_order: int = Field(default=0, ge=0)


class SkillCategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(default=None, max_length=20)
    icon: Optional[str] = Field(default=None, max_length=50)
    sort_order: Optional[int] = Field(default=None, ge=0)


class SkillCategoryResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    description: Optional[str] = None
    color: str
    icon: str
    sort_order: int
    skill_count: int = 0
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SkillCreate(BaseModel):
    category_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    levels: List[SkillLevel] = Field(default_factory=lambda: [
        SkillLevel(level=1, name="Beginner", description="Just starting out"),
        SkillLevel(level=2, name="Novice", description="Basic understanding"),
        SkillLevel(level=3, name="Intermediate", description="Competent"),
        SkillLevel(level=4, name="Advanced", description="Skilled"),
        SkillLevel(level=5, name="Expert", description="Mastery achieved"),
    ])
    max_level: int = Field(default=5, ge=1, le=5)


class SkillUpdate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    levels: Optional[List[SkillLevel]] = None
    max_level: Optional[int] = Field(default=None, ge=1, le=5)


class SkillResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    category_id: uuid.UUID
    category_name: str = ""
    name: str
    description: Optional[str] = None
    levels: List[SkillLevel]
    max_level: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EvaluationEntry(BaseModel):
    date: str
    evaluator: str
    level: int
    notes: str = ""


class EvaluateRequest(BaseModel):
    camper_id: uuid.UUID
    skill_id: uuid.UUID
    level: int = Field(..., ge=1, le=5)
    evaluator: str = Field(..., min_length=1, max_length=200)
    notes: Optional[str] = ""
    target_level: Optional[int] = Field(default=None, ge=1, le=5)


class CamperSkillProgressResponse(BaseModel):
    id: uuid.UUID
    camper_id: uuid.UUID
    camper_name: str
    skill_id: uuid.UUID
    skill_name: str
    category_name: str = ""
    current_level: int
    target_level: int
    evaluations: List[EvaluationEntry]
    started_at: datetime
    last_evaluated: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class SkillLeaderboardEntry(BaseModel):
    camper_id: uuid.UUID
    camper_name: str
    total_levels: int
    skills_count: int
    avg_level: float


class CategoryStatsResponse(BaseModel):
    category_id: uuid.UUID
    category_name: str
    color: str
    total_skills: int
    total_evaluations: int
    avg_level: float
