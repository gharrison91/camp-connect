"""
Camp Connect - Program Evaluation Schemas
Pydantic schemas for program evaluation tracking.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProgramEvalBase(BaseModel):
    """Shared fields for program evaluations."""

    program_name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(
        default="other",
        pattern="^(arts|sports|outdoor|academic|social|other)$",
    )
    evaluator_name: str = Field(..., min_length=1, max_length=255)
    rating: int = Field(..., ge=1, le=5)
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    camper_engagement: str = Field(
        default="medium",
        pattern="^(low|medium|high)$",
    )
    safety_rating: int = Field(..., ge=1, le=5)
    notes: Optional[str] = None
    eval_date: Optional[str] = None


class ProgramEvalCreate(ProgramEvalBase):
    """Request to create a new program evaluation."""

    pass


class ProgramEvalUpdate(BaseModel):
    """Update program evaluation details (all optional)."""

    program_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[str] = Field(
        default=None,
        pattern="^(arts|sports|outdoor|academic|social|other)$",
    )
    evaluator_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    camper_engagement: Optional[str] = Field(
        default=None,
        pattern="^(low|medium|high)$",
    )
    safety_rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None
    eval_date: Optional[str] = None


class ProgramEval(ProgramEvalBase):
    """Full program evaluation response with server fields."""

    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProgramEvalStats(BaseModel):
    """Aggregated program evaluation statistics."""

    total_evals: int = 0
    avg_rating: float = 0.0
    avg_safety: float = 0.0
    by_category: Dict[str, Any] = {}
    top_programs: List[Dict[str, Any]] = []
