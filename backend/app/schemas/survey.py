"""
Camp Connect - Survey Schemas
Pydantic models for survey CRUD operations.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Question schemas
# ---------------------------------------------------------------------------

class SurveyQuestionCreate(BaseModel):
    """Create a question within a survey."""

    question_text: str = Field(..., min_length=1)
    question_type: str = Field(
        default="text",
        pattern="^(text|rating|multiple_choice|yes_no)$",
    )
    options: Optional[List[str]] = None
    required: bool = True
    order: int = Field(default=0, ge=0)


class SurveyQuestionUpdate(BaseModel):
    """Update a question."""

    question_text: Optional[str] = Field(default=None, min_length=1)
    question_type: Optional[str] = Field(
        default=None,
        pattern="^(text|rating|multiple_choice|yes_no)$",
    )
    options: Optional[List[str]] = None
    required: Optional[bool] = None
    order: Optional[int] = Field(default=None, ge=0)


class SurveyQuestionResponse(BaseModel):
    """Question details in API response."""

    id: uuid.UUID
    survey_id: uuid.UUID
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    required: bool
    order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Answer schemas (embedded in responses)
# ---------------------------------------------------------------------------

class AnswerItem(BaseModel):
    """A single answer to a question."""

    question_id: str
    answer: str


# ---------------------------------------------------------------------------
# Response schemas (survey submissions)
# ---------------------------------------------------------------------------

class SurveyResponseCreate(BaseModel):
    """Submit a response to a survey."""

    respondent_name: Optional[str] = Field(default=None, max_length=255)
    respondent_email: Optional[str] = Field(default=None, max_length=255)
    answers: List[AnswerItem] = Field(default_factory=list)


class SurveyResponseDetail(BaseModel):
    """A single survey response in API output."""

    id: uuid.UUID
    survey_id: uuid.UUID
    respondent_name: Optional[str] = None
    respondent_email: Optional[str] = None
    answers: Optional[List[AnswerItem]] = None
    submitted_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Survey schemas
# ---------------------------------------------------------------------------

class SurveyCreate(BaseModel):
    """Request to create a new survey."""

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    target_audience: str = Field(
        default="all",
        pattern="^(parents|staff|campers|all)$",
    )
    status: str = Field(
        default="draft",
        pattern="^(draft|active|closed)$",
    )
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    questions: Optional[List[SurveyQuestionCreate]] = None


class SurveyUpdate(BaseModel):
    """Update survey details."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    target_audience: Optional[str] = Field(
        default=None,
        pattern="^(parents|staff|campers|all)$",
    )
    status: Optional[str] = Field(
        default=None,
        pattern="^(draft|active|closed)$",
    )
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SurveyListItem(BaseModel):
    """Survey details in API response."""

    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    description: Optional[str] = None
    target_audience: str
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    question_count: int = 0
    response_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SurveyDetail(SurveyListItem):
    """Survey with full question list."""

    questions: List[SurveyQuestionResponse] = []


# ---------------------------------------------------------------------------
# Stats schema
# ---------------------------------------------------------------------------

class SurveyStats(BaseModel):
    """Aggregate stats for the surveys dashboard."""

    total_surveys: int = 0
    active_count: int = 0
    total_responses: int = 0
    avg_completion_rate: float = 0.0
