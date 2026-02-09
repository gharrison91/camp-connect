"""Camp Connect - Store Pydantic Schemas (Pydantic v2)."""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ── StoreItem ──────────────────────────────────────────────────────────────

class StoreItemCreate(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    price: Decimal = Field(default=Decimal("0.00"), ge=0)
    quantity_in_stock: int = Field(default=0, ge=0)
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class StoreItemUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class StoreItemResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Decimal
    quantity_in_stock: int
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── SpendingAccount ────────────────────────────────────────────────────────

class SpendingAccountResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    camper_id: uuid.UUID
    balance: Decimal
    daily_limit: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SpendingAccountUpdate(BaseModel):
    balance: Optional[Decimal] = Field(None, ge=0)
    daily_limit: Optional[Decimal] = Field(None, ge=0)


# ── Purchase / Transactions ────────────────────────────────────────────────

class PurchaseRequest(BaseModel):
    camper_id: uuid.UUID
    item_id: uuid.UUID
    quantity: int = Field(default=1, ge=1)


class StoreTransactionResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    camper_id: uuid.UUID
    item_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    total: Decimal
    transaction_date: datetime
    recorded_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
