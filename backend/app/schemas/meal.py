"""
Camp Connect - Meal Planning & Dietary Management Schemas
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---- Meals ----

class MealBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    date: date
    description: Optional[str] = None
    menu_items: List[str] = Field(default_factory=list)
    allergens: List[str] = Field(default_factory=list)
    nutritional_info: Dict[str, Any] = Field(default_factory=dict)


class MealCreate(MealBase):
    pass


class MealUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    meal_type: Optional[str] = Field(default=None, pattern="^(breakfast|lunch|dinner|snack)$")
    date: Optional[date] = None
    description: Optional[str] = None
    menu_items: Optional[List[str]] = None
    allergens: Optional[List[str]] = None
    nutritional_info: Optional[Dict[str, Any]] = None


class MealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    meal_type: str
    date: date
    description: Optional[str] = None
    menu_items: List[str] = Field(default_factory=list)
    allergens: List[str] = Field(default_factory=list)
    nutritional_info: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


# ---- Meal Plans ----

class MealPlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    week_start: date
    meal_ids: List[uuid.UUID] = Field(default_factory=list)


class MealPlanCreate(MealPlanBase):
    pass


class MealPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    week_start: date
    meals: List[MealResponse] = Field(default_factory=list)
    created_at: datetime


# ---- Dietary Restrictions ----

class DietaryRestrictionBase(BaseModel):
    camper_id: uuid.UUID
    restriction_type: str = Field(..., pattern="^(allergy|intolerance|preference|religious)$")
    item: str = Field(..., min_length=1, max_length=255)
    severity: str = Field(default="moderate", pattern="^(mild|moderate|severe)$")
    notes: Optional[str] = None


class DietaryRestrictionCreate(DietaryRestrictionBase):
    pass


class DietaryRestrictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    camper_id: uuid.UUID
    camper_name: Optional[str] = None
    restriction_type: str
    item: str
    severity: str
    notes: Optional[str] = None
    created_at: datetime
