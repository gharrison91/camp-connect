"""
Camp Connect - Payment & Invoice Schemas
Pydantic v2 schemas for invoices, payments, and Stripe checkout.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Line Items ───────────────────────────────────────────────


class LineItem(BaseModel):
    """A single line item on an invoice."""
    description: str
    amount: Decimal = Field(..., ge=0)
    quantity: int = Field(default=1, ge=1)


# ─── Invoice Schemas ──────────────────────────────────────────


class InvoiceCreate(BaseModel):
    """Request to create a new invoice."""
    family_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    registration_ids: Optional[List[uuid.UUID]] = None
    line_items: Optional[List[LineItem]] = None
    subtotal: Decimal = Field(default=Decimal("0.00"), ge=0)
    tax: Decimal = Field(default=Decimal("0.00"), ge=0)
    total: Decimal = Field(default=Decimal("0.00"), ge=0)
    due_date: Optional[date] = None
    notes: Optional[str] = None


class InvoiceUpdate(BaseModel):
    """Update an existing invoice."""
    status: Optional[str] = Field(
        default=None,
        pattern="^(draft|sent|paid|overdue|cancelled)$",
    )
    due_date: Optional[date] = None
    notes: Optional[str] = None
    line_items: Optional[List[LineItem]] = None
    subtotal: Optional[Decimal] = Field(default=None, ge=0)
    tax: Optional[Decimal] = Field(default=None, ge=0)
    total: Optional[Decimal] = Field(default=None, ge=0)


class InvoiceResponse(BaseModel):
    """Invoice details returned from the API."""
    id: uuid.UUID
    organization_id: uuid.UUID
    family_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    registration_ids: Optional[List[uuid.UUID]] = None
    line_items: Optional[List[Dict[str, Any]]] = None
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    status: str
    due_date: Optional[date] = None
    paid_at: Optional[datetime] = None
    stripe_invoice_id: Optional[str] = None
    notes: Optional[str] = None
    payments: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Payment Schemas ──────────────────────────────────────────


class PaymentCreate(BaseModel):
    """Request to record a payment."""
    invoice_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    amount: Decimal = Field(..., gt=0)
    payment_method: str = Field(
        default="stripe",
        pattern="^(stripe|cash|check|other)$",
    )
    stripe_payment_intent_id: Optional[str] = None


class PaymentResponse(BaseModel):
    """Payment details returned from the API."""
    id: uuid.UUID
    organization_id: uuid.UUID
    invoice_id: Optional[uuid.UUID] = None
    registration_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    amount: Decimal
    currency: str
    payment_method: str
    stripe_payment_intent_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    status: str
    refund_amount: Optional[Decimal] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Stripe Checkout Schemas ─────────────────────────────────


class CheckoutLineItem(BaseModel):
    """A line item for Stripe Checkout."""
    name: str
    amount: int = Field(..., gt=0, description="Amount in cents")
    quantity: int = Field(default=1, ge=1)


class CheckoutRequest(BaseModel):
    """Request to create a Stripe Checkout session."""
    invoice_id: uuid.UUID
    line_items: List[CheckoutLineItem]
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    """Response with the Stripe Checkout session URL."""
    session_id: str
    checkout_url: str


# ─── Generate Invoice Schema ─────────────────────────────────


class GenerateInvoiceRequest(BaseModel):
    """Request to auto-generate an invoice from registration IDs."""
    registration_ids: List[uuid.UUID] = Field(..., min_length=1)
    contact_id: Optional[uuid.UUID] = None
    family_id: Optional[uuid.UUID] = None
