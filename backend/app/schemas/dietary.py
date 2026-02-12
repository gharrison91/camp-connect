"""
Camp Connect - Dietary Restriction Schemas
Pydantic models for tracking camper dietary restrictions, allergies,
intolerances, preferences, and medical/religious requirements.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class DietaryRestrictionBase(BaseModel):
    """Shared fields for dietary restrictions."""
    camper_id: uuid.UUID
    camper_name: str = Field(default="", description="Read-only, resolved from campers table")
    restriction_type: str = Field(
        ...,
        pattern="^(food_allergy|intolerance|preference|medical|religious)$",
        description="Category: food_allergy, intolerance, preference, medical, religious",
    )
    restriction: str = Field(..., min_length=1, max_length=255)
    severity: str = Field(
        ...,
        pattern="^(mild|moderate|severe)$",
        description="Severity: mild, moderate, severe",
    )
    alternatives: Optional[str] = Field(default=None, max_length=1000)
    meal_notes: Optional[str] = Field(default=None, max_length=2000)


class DietaryRestrictionCreate(BaseModel):
    """Request to create a new dietary restriction."""
    camper_id: uuid.UUID
    restriction_type: str = Field(
        ...,
        pattern="^(food_allergy|intolerance|preference|medical|religious)$",
    )
    restriction: str = Field(..., min_length=1, max_length=255)
    severity: str = Field(
        ...,
        pattern="^(mild|moderate|severe)$",
    )
    alternatives: Optional[str] = Field(default=None, max_length=1000)
    meal_notes: Optional[str] = Field(default=None, max_length=2000)


class DietaryRestrictionUpdate(BaseModel):
    """Request to update an existing dietary restriction."""
    restriction_type: Optional[str] = Field(
        default=None,
        pattern="^(food_allergy|intolerance|preference|medical|religious)$",
    )
    restriction: Optional[str] = Field(default=None, min_length=1, max_length=255)
    severity: Optional[str] = Field(
        default=None,
        pattern="^(mild|moderate|severe)$",
    )
    alternatives: Optional[str] = Field(default=None, max_length=1000)
    meal_notes: Optional[str] = Field(default=None, max_length=2000)


class DietaryRestriction(BaseModel):
    """Full dietary restriction response."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    camper_id: uuid.UUID
    camper_name: str
    restriction_type: str
    restriction: str
    severity: str
    alternatives: Optional[str] = None
    meal_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class DietaryStats(BaseModel):
    """Aggregate statistics for dietary restrictions."""
    total_restrictions: int
    campers_affected: int
    by_type: Dict[str, int]
    severe_count: int
