"""Camp Connect - Spending Account Pydantic Schemas (Pydantic v2)."""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class SpendingAccountCreate(BaseModel):
    camper_id: uuid.UUID
    initial_balance: Decimal = Field(default=Decimal("0.00"), ge=0)
    daily_limit: Optional[Decimal] = Field(None, ge=0)


class SpendingAccountResponse(BaseModel):
    id: str
    camper_id: str
    camper_name: str
    balance: Decimal
    daily_limit: Optional[Decimal] = None
    is_active: bool = True
    last_transaction_at: Optional[str] = None
    created_at: str


class SpendingTransactionCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    type: str = Field(..., pattern=r"^(deposit|purchase|refund|adjustment)")
    description: Optional[str] = Field(None, max_length=500)


class SpendingTransactionResponse(BaseModel):
    id: str
    account_id: str
    camper_name: str
    amount: Decimal
    type: str
    description: Optional[str] = None
    staff_name: Optional[str] = None
    created_at: str


class SpendingSummaryResponse(BaseModel):
    total_accounts: int
    active_accounts: int
    total_balance: Decimal
    transactions_today: int
    average_balance: Decimal
