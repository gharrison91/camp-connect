"""
Camp Connect - Payment Plan Schemas
Pydantic v2 schemas for payment plans and installments.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PaymentPlanCreate(BaseModel):
    """Request to create a new payment plan."""
    invoice_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    total_amount: Decimal = Field(..., gt=0)
    num_installments: int = Field(..., ge=2, le=60)
    frequency: str = Field(
        default="monthly",
        pattern="^(weekly|biweekly|monthly)$",
    )
    start_date: date


class PaymentPlanUpdate(BaseModel):
    """Update a payment plan."""
    status: Optional[str] = Field(
        default=None,
        pattern="^(active|completed|cancelled|defaulted)$",
    )
    frequency: Optional[str] = Field(
        default=None,
        pattern="^(weekly|biweekly|monthly)$",
    )


class InstallmentResponse(BaseModel):
    """Installment details returned from the API."""
    id: uuid.UUID
    plan_id: uuid.UUID
    installment_number: int
    amount: Decimal
    due_date: date
    status: str
    paid_at: Optional[datetime] = None
    payment_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentPlanResponse(BaseModel):
    """Payment plan details returned from the API."""
    id: uuid.UUID
    organization_id: uuid.UUID
    invoice_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    contact_name: Optional[str] = None
    total_amount: Decimal
    num_installments: int
    frequency: str
    start_date: date
    status: str
    paid_count: int = 0
    paid_amount: Decimal = Decimal("0.00")
    installments: List[InstallmentResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
