"""
Camp Connect - Budget Schemas
Pydantic schemas for budget tracking (budgets, categories, expenses).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- Budget ---


class BudgetCreate(BaseModel):
    """Request to create a new budget."""

    name: str = Field(..., min_length=1, max_length=255)
    fiscal_year: int = Field(..., ge=2000, le=2100)
    total_budget: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None
    is_active: bool = True


class BudgetUpdate(BaseModel):
    """Update budget details."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    fiscal_year: Optional[int] = Field(default=None, ge=2000, le=2100)
    total_budget: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class BudgetCategoryResponse(BaseModel):
    """Budget category details (nested in budget response)."""

    id: uuid.UUID
    budget_id: uuid.UUID
    name: str
    planned_amount: float
    actual_amount: float = 0.0  # computed from expenses
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetExpenseResponse(BaseModel):
    """Budget expense details."""

    id: uuid.UUID
    category_id: uuid.UUID
    category_name: str = ""
    description: str
    amount: float
    date: date
    vendor: Optional[str] = None
    receipt_url: Optional[str] = None
    approved_by: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BudgetResponse(BaseModel):
    """Full budget details with categories."""

    id: uuid.UUID
    name: str
    fiscal_year: int
    total_budget: float
    notes: Optional[str] = None
    is_active: bool
    categories: List[BudgetCategoryResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Category ---


class BudgetCategoryCreate(BaseModel):
    """Request to create a budget category."""

    name: str = Field(..., min_length=1, max_length=255)
    planned_amount: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None


class BudgetCategoryUpdate(BaseModel):
    """Update a budget category."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    planned_amount: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None


# --- Expense ---


class BudgetExpenseCreate(BaseModel):
    """Request to create a budget expense."""

    category_id: uuid.UUID
    description: str = Field(..., min_length=1, max_length=500)
    amount: float = Field(..., gt=0)
    date: date
    vendor: Optional[str] = Field(default=None, max_length=255)
    receipt_url: Optional[str] = Field(default=None, max_length=1000)
    approved_by: Optional[str] = Field(default=None, max_length=255)
    status: str = Field(
        default="pending",
        pattern="^(pending|approved|rejected)$",
    )


class BudgetExpenseUpdate(BaseModel):
    """Update a budget expense."""

    category_id: Optional[uuid.UUID] = None
    description: Optional[str] = Field(default=None, min_length=1, max_length=500)
    amount: Optional[float] = Field(default=None, gt=0)
    date: Optional[date] = None
    vendor: Optional[str] = Field(default=None, max_length=255)
    receipt_url: Optional[str] = Field(default=None, max_length=1000)
    approved_by: Optional[str] = Field(default=None, max_length=255)
    status: Optional[str] = Field(
        default=None,
        pattern="^(pending|approved|rejected)$",
    )


# --- Stats ---


class BudgetStats(BaseModel):
    """Aggregated budget statistics."""

    total_budget: float = 0.0
    total_planned: float = 0.0
    total_spent: float = 0.0
    remaining: float = 0.0
    category_count: int = 0
