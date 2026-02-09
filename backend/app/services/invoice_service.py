"""
Camp Connect - Invoice Service
Business logic for creating, updating, and managing invoices.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event import Event
from app.models.payment import Invoice, Payment
from app.models.registration import Registration


async def list_invoices(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    status: Optional[str] = None,
    family_id: Optional[uuid.UUID] = None,
    contact_id: Optional[uuid.UUID] = None,
) -> List[Dict[str, Any]]:
    """List invoices with optional filters."""
    query = (
        select(Invoice)
        .options(selectinload(Invoice.payments))
        .where(Invoice.organization_id == organization_id)
        .where(Invoice.is_deleted == False)  # noqa: E712
    )

    if status:
        query = query.where(Invoice.status == status)
    if family_id:
        query = query.where(Invoice.family_id == family_id)
    if contact_id:
        query = query.where(Invoice.contact_id == contact_id)

    query = query.order_by(Invoice.created_at.desc())
    result = await db.execute(query)
    invoices = result.scalars().all()

    return [_invoice_to_dict(inv) for inv in invoices]


async def get_invoice(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    invoice_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single invoice with its payments."""
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.payments))
        .where(Invoice.id == invoice_id)
        .where(Invoice.organization_id == organization_id)
        .where(Invoice.is_deleted == False)  # noqa: E712
    )
    invoice = result.scalar_one_or_none()
    if invoice is None:
        return None
    return _invoice_to_dict(invoice)


async def create_invoice(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Create a new invoice.

    Data may include:
        family_id, contact_id, registration_ids, line_items,
        subtotal, tax, total, due_date, notes
    """
    # Serialize line_items from Pydantic models to dicts if needed
    line_items_raw = data.get("line_items")
    if line_items_raw:
        line_items_raw = [
            item if isinstance(item, dict) else item.model_dump()
            for item in line_items_raw
        ]

    # Serialize registration_ids to strings for JSONB storage
    registration_ids_raw = data.get("registration_ids")
    if registration_ids_raw:
        registration_ids_raw = [str(rid) for rid in registration_ids_raw]

    invoice = Invoice(
        id=uuid.uuid4(),
        organization_id=organization_id,
        family_id=data.get("family_id"),
        contact_id=data.get("contact_id"),
        registration_ids=registration_ids_raw,
        line_items=line_items_raw,
        subtotal=data.get("subtotal", Decimal("0.00")),
        tax=data.get("tax", Decimal("0.00")),
        total=data.get("total", Decimal("0.00")),
        due_date=data.get("due_date"),
        notes=data.get("notes"),
        status="draft",
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)

    return _invoice_to_dict(invoice)


async def update_invoice(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    invoice_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing invoice (status, due_date, notes, line_items, totals)."""
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.payments))
        .where(Invoice.id == invoice_id)
        .where(Invoice.organization_id == organization_id)
        .where(Invoice.is_deleted == False)  # noqa: E712
    )
    invoice = result.scalar_one_or_none()
    if invoice is None:
        return None

    # Serialize line_items from Pydantic models to dicts if present
    if "line_items" in data and data["line_items"] is not None:
        data["line_items"] = [
            item if isinstance(item, dict) else item.model_dump()
            for item in data["line_items"]
        ]

    for key, value in data.items():
        if hasattr(invoice, key):
            setattr(invoice, key, value)

    await db.commit()
    await db.refresh(invoice)
    return _invoice_to_dict(invoice)


async def mark_invoice_paid(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    invoice_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Mark an invoice as paid and set paid_at timestamp."""
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.payments))
        .where(Invoice.id == invoice_id)
        .where(Invoice.organization_id == organization_id)
        .where(Invoice.is_deleted == False)  # noqa: E712
    )
    invoice = result.scalar_one_or_none()
    if invoice is None:
        return None

    invoice.status = "paid"
    invoice.paid_at = datetime.utcnow()

    await db.commit()
    await db.refresh(invoice)
    return _invoice_to_dict(invoice)


async def generate_invoice_from_registrations(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    registration_ids: List[uuid.UUID],
    contact_id: Optional[uuid.UUID] = None,
    family_id: Optional[uuid.UUID] = None,
) -> Dict[str, Any]:
    """
    Auto-generate an invoice by looking up registration events and their prices.
    Creates line items from each registration's event name and price.
    """
    # Fetch registrations with their events
    result = await db.execute(
        select(Registration)
        .options(selectinload(Registration.event))
        .where(Registration.id.in_(registration_ids))
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
    )
    registrations = result.scalars().all()

    if not registrations:
        raise ValueError("No valid registrations found for the given IDs")

    # Build line items from events
    line_items = []
    subtotal = Decimal("0.00")

    for reg in registrations:
        event = reg.event
        if event is None:
            continue
        price = event.price or Decimal("0.00")
        line_items.append({
            "description": event.name,
            "amount": str(price),
            "quantity": 1,
        })
        subtotal += price

    # Calculate tax from the first event's tax_rate (if set)
    tax = Decimal("0.00")
    first_event = registrations[0].event if registrations else None
    if first_event and first_event.tax_rate:
        tax = (subtotal * first_event.tax_rate).quantize(Decimal("0.01"))

    total = subtotal + tax

    # Serialize registration IDs for JSONB storage
    registration_id_strings = [str(rid) for rid in registration_ids]

    # Try to infer contact_id from registrations if not provided
    if contact_id is None:
        for reg in registrations:
            if reg.registered_by:
                contact_id = reg.registered_by
                break

    invoice = Invoice(
        id=uuid.uuid4(),
        organization_id=organization_id,
        family_id=family_id,
        contact_id=contact_id,
        registration_ids=registration_id_strings,
        line_items=line_items,
        subtotal=subtotal,
        tax=tax,
        total=total,
        status="draft",
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)

    return _invoice_to_dict(invoice)


# ─── Internal helpers ───────────────────────────────────────────


def _invoice_to_dict(invoice: Invoice) -> Dict[str, Any]:
    """Convert an Invoice model to a response dict."""
    payments_list = []
    if invoice.payments:
        payments_list = [
            {
                "id": p.id,
                "amount": p.amount,
                "currency": p.currency,
                "payment_method": p.payment_method,
                "status": p.status,
                "paid_at": p.paid_at,
            }
            for p in invoice.payments
        ]

    return {
        "id": invoice.id,
        "organization_id": invoice.organization_id,
        "family_id": invoice.family_id,
        "contact_id": invoice.contact_id,
        "registration_ids": invoice.registration_ids,
        "line_items": invoice.line_items,
        "subtotal": invoice.subtotal,
        "tax": invoice.tax,
        "total": invoice.total,
        "status": invoice.status,
        "due_date": invoice.due_date,
        "paid_at": invoice.paid_at,
        "stripe_invoice_id": invoice.stripe_invoice_id,
        "notes": invoice.notes,
        "payments": payments_list,
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
    }
