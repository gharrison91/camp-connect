"""
Camp Connect - Allergy Matrix Schemas
Structured allergy tracking with severity levels and matrix view.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AllergyCreate(BaseModel):
    """Request to create a new allergy entry."""
    camper_id: uuid.UUID
    allergy_type: str = Field(
        ...,
        pattern="^(food|environmental|medication|insect|other)$",
        description="Category of allergen",
    )
    allergen: str = Field(..., min_length=1, max_length=255)
    severity: str = Field(
        ...,
        pattern="^(mild|moderate|severe|life_threatening)$",
        description="Severity level",
    )
    treatment: Optional[str] = Field(default=None, max_length=1000)
    epipen_required: bool = False
    notes: Optional[str] = Field(default=None, max_length=2000)


class AllergyUpdate(BaseModel):
    """Request to update an existing allergy entry."""
    allergy_type: Optional[str] = Field(
        default=None,
        pattern="^(food|environmental|medication|insect|other)$",
    )
    allergen: Optional[str] = Field(default=None, min_length=1, max_length=255)
    severity: Optional[str] = Field(
        default=None,
        pattern="^(mild|moderate|severe|life_threatening)$",
    )
    treatment: Optional[str] = Field(default=None, max_length=1000)
    epipen_required: Optional[bool] = None
    notes: Optional[str] = Field(default=None, max_length=2000)


class AllergyEntry(BaseModel):
    """Full allergy entry response."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    camper_id: uuid.UUID
    camper_name: str
    allergy_type: str
    allergen: str
    severity: str
    treatment: Optional[str] = None
    epipen_required: bool = False
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class AllergyStats(BaseModel):
    """Aggregate statistics for the allergy matrix."""
    total_entries: int
    campers_with_allergies: int
    severe_count: int
    epipen_count: int
    top_allergens: List[dict]


class AllergyMatrixRow(BaseModel):
    """One row of the matrix: a camper with their allergen flags per type."""
    camper_id: uuid.UUID
    camper_name: str
    allergies: List[AllergyEntry]
