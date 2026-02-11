"""
Camp Connect - Inventory & Equipment Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class InventoryItemBase(BaseModel):
    """Shared inventory item fields."""
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(
        default="other",
        pattern="^(sports|arts|kitchen|medical|maintenance|office|other)$",
    )
    sku: Optional[str] = Field(default=None, max_length=50)
    quantity: int = Field(default=0, ge=0)
    min_quantity: int = Field(default=0, ge=0)
    location: Optional[str] = Field(default=None, max_length=255)
    condition: str = Field(
        default="good",
        pattern="^(new|good|fair|poor|broken)$",
    )
    unit_cost: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    """Request to create an inventory item."""
    pass


class InventoryItemUpdate(BaseModel):
    """Update an inventory item (all fields optional)."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[str] = Field(
        default=None,
        pattern="^(sports|arts|kitchen|medical|maintenance|office|other)$",
    )
    sku: Optional[str] = Field(default=None, max_length=50)
    quantity: Optional[int] = Field(default=None, ge=0)
    min_quantity: Optional[int] = Field(default=None, ge=0)
    location: Optional[str] = Field(default=None, max_length=255)
    condition: Optional[str] = Field(
        default=None,
        pattern="^(new|good|fair|poor|broken)$",
    )
    unit_cost: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None


class InventoryItemResponse(BaseModel):
    """Inventory item response with computed fields."""
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    category: str
    sku: Optional[str] = None
    quantity: int
    min_quantity: int
    location: Optional[str] = None
    condition: str
    unit_cost: float
    total_value: float
    notes: Optional[str] = None
    last_checked: Optional[datetime] = None
    created_at: datetime


class CheckoutCreate(BaseModel):
    """Request to check out an inventory item."""
    quantity: int = Field(..., ge=1)
    checked_out_by: str = Field(..., min_length=1, max_length=255)
    checked_out_to: str = Field(..., min_length=1, max_length=255)
    expected_return: Optional[datetime] = None


class CheckoutRecord(BaseModel):
    """Checkout record response."""
    id: uuid.UUID
    item_id: uuid.UUID
    item_name: str
    checked_out_by: str
    checked_out_to: str
    quantity_out: int
    checkout_date: datetime
    expected_return: Optional[datetime] = None
    actual_return: Optional[datetime] = None
    status: str  # out, returned, overdue


class BulkQuantityItem(BaseModel):
    """Single item in a bulk quantity update."""
    id: uuid.UUID
    quantity: int = Field(..., ge=0)


class BulkQuantityUpdate(BaseModel):
    """Bulk update item quantities."""
    items: List[BulkQuantityItem]


class InventoryStats(BaseModel):
    """Aggregate inventory statistics."""
    total_items: int
    low_stock_count: int
    checked_out_count: int
    total_value: float
