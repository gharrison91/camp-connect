""""
Camp Connect - Quote Schemas
Pydantic v2 schemas for quotes.
""""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class QuoteLineItem(BaseModel):
    """"A single line item on a quote.""""
    description: str
    amount: Decimal = Field(..., ge=0)
    quantity: int = Field(default=1, ge=1)


class QuoteCreate(BaseModel):
    """"Request to create a new quote.""""
    contact_id: Optional[uuid.UUID] = None
    family_id: Optional[uuid.UUID] = None
    quote_number: Optional[str] = None
    line_items: Optional[List[QuoteLineItem]] = None
    subtotal: Decimal = Field(default=Decimal("0.00"), ge=0)
    tax: Decimal = Field(default=Decimal("0.00"), ge=0)
    total: Decimal = Field(default=Decimal("0.00"), ge=0)
    valid_until: Optional[date] = None
    notes: Optional[str] = None


class QuoteUpdate(BaseModel):
    """"Update an existing quote.""""
    contact_id: Optional[uuid.UUID] = None
    family_id: Optional[uuid.UUID] = None
    quote_number: Optional[str] = None
    line_items: Optional[List[QuoteLineItem]] = None
    subtotal: Optional[Decimal] = Field(default=None, ge=0)
    tax: Optional[Decimal] = Field(default=None, ge=0)
    total: Optional[Decimal] = Field(default=None, ge=0)
    status: Optional[str] = Field(
        default=None,
        pattern="^(draft|sent|viewed|accepted|rejected|expired)$",
    )
    valid_until: Optional[date] = None
    notes: Optional[str] = None


class QuoteResponse(BaseModel):
    """"Quote details returned from the API.""""
    id: uuid.UUID
    organization_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    family_id: Optional[uuid.UUID] = None
    contact_name: Optional[str] = None
    family_name: Optional[str] = None
    quote_number: Optional[str] = None
    line_items: Optional[List[Dict[str, Any]]] = None
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    status: str
    valid_until: Optional[date] = None
    notes: Optional[str] = None
    accepted_at: Optional[datetime] = None
    accepted_signature: Optional[str] = None
    converted_invoice_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
