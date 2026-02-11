""""
Camp Connect - Quote Service
Business logic for creating, updating, and managing quotes.
""""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quote import Quote
from app.models.payment import Invoice


async def list_quotes(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    status: Optional[str] = None,
    contact_id: Optional[uuid.UUID] = None,
) -> List[Dict[str, Any]]:
    """"List quotes with optional filters.""""
    query = (
        select(Quote)
        .where(Quote.organization_id == organization_id)
        .where(Quote.is_deleted == False)  # noqa: E712
    )

    if status:
        query = query.where(Quote.status == status)
    if contact_id:
        query = query.where(Quote.contact_id == contact_id)

    query = query.order_by(Quote.created_at.desc())
    result = await db.execute(query)
    quotes = result.scalars().all()

    return [_quote_to_dict(q) for q in quotes]


async def get_quote(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    quote_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """"Get a single quote.""""
    result = await db.execute(
        select(Quote)
        .where(Quote.id == quote_id)
        .where(Quote.organization_id == organization_id)
        .where(Quote.is_deleted == False)  # noqa: E712
    )
    quote = result.scalar_one_or_none()
    if quote is None:
        return None
    return _quote_to_dict(quote)


async def create_quote(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """"Create a new quote.""""
    line_items_raw = data.get("line_items")
    if line_items_raw:
        line_items_raw = [
            item if isinstance(item, dict) else item.model_dump()
            for item in line_items_raw
        ]

    quote = Quote(
        id=uuid.uuid4(),
        organization_id=organization_id,
        contact_id=data.get("contact_id"),
        family_id=data.get("family_id"),
        quote_number=data.get("quote_number"),
        line_items=line_items_raw,
        subtotal=data.get("subtotal", Decimal("0.00")),
        tax=data.get("tax", Decimal("0.00")),
        total=data.get("total", Decimal("0.00")),
        valid_until=data.get("valid_until"),
        notes=data.get("notes"),
        status="draft",
    )
    db.add(quote)
    await db.commit()
    await db.refresh(quote)

    return _quote_to_dict(quote)


async def update_quote(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    quote_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """"Update an existing quote.""""
    result = await db.execute(
        select(Quote)
        .where(Quote.id == quote_id)
        .where(Quote.organization_id == organization_id)
        .where(Quote.is_deleted == False)  # noqa: E712
    )
    quote = result.scalar_one_or_none()
    if quote is None:
        return None

    if "line_items" in data and data["line_items"] is not None:
        data["line_items"] = [
            item if isinstance(item, dict) else item.model_dump()
            for item in data["line_items"]
        ]

    for key, value in data.items():
        if hasattr(quote, key):
            setattr(quote, key, value)

    await db.commit()
    await db.refresh(quote)
    return _quote_to_dict(quote)


async def delete_quote(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    quote_id: uuid.UUID,
) -> bool:
    """"Soft delete a quote.""""
    result = await db.execute(
        select(Quote)
        .where(Quote.id == quote_id)
        .where(Quote.organization_id == organization_id)
        .where(Quote.is_deleted == False)  # noqa: E712
    )
    quote = result.scalar_one_or_none()
    if quote is None:
        return False

    quote.is_deleted = True
    quote.deleted_at = datetime.utcnow()
    await db.commit()
    return True


async def send_quote(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    quote_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """"Mark a quote as sent.""""
    result = await db.execute(
        select(Quote)
        .where(Quote.id == quote_id)
        .where(Quote.organization_id == organization_id)
        .where(Quote.is_deleted == False)  # noqa: E712
    )
    quote = result.scalar_one_or_none()
    if quote is None:
        return None

    quote.status = "sent"
    await db.commit()
    await db.refresh(quote)
    return _quote_to_dict(quote)


async def convert_quote_to_invoice(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    quote_id: uuid.UUID,
) -> Dict[str, Any]:
    """"Convert a quote to an invoice. Creates a new invoice and links it.""""
    result = await db.execute(
        select(Quote)
        .where(Quote.id == quote_id)
        .where(Quote.organization_id == organization_id)
        .where(Quote.is_deleted == False)  # noqa: E712
    )
    quote = result.scalar_one_or_none()
    if quote is None:
        raise ValueError("Quote not found")

    if quote.converted_invoice_id is not None:
        raise ValueError("Quote has already been converted to an invoice")

    # Create an invoice from the quote data
    invoice = Invoice(
        id=uuid.uuid4(),
        organization_id=organization_id,
        contact_id=quote.contact_id,
        family_id=quote.family_id,
        line_items=quote.line_items,
        subtotal=quote.subtotal,
        tax=quote.tax,
        total=quote.total,
        notes=quote.notes,
        status="draft",
    )
    db.add(invoice)
    await db.flush()

    # Link the quote to the invoice and mark as accepted
    quote.converted_invoice_id = invoice.id
    quote.status = "accepted"
    quote.accepted_at = datetime.utcnow()

    await db.commit()
    await db.refresh(quote)

    return _quote_to_dict(quote)


# --- Internal helpers ---


def _quote_to_dict(quote: Quote) -> Dict[str, Any]:
    """"Convert a Quote model to a response dict.""""
    contact_name = None
    family_name = None
    if quote.contact:
        contact_name = f"{quote.contact.first_name} {quote.contact.last_name}"
    if quote.family:
        family_name = quote.family.family_name

    return {
        "id": quote.id,
        "organization_id": quote.organization_id,
        "contact_id": quote.contact_id,
        "family_id": quote.family_id,
        "contact_name": contact_name,
        "family_name": family_name,
        "quote_number": quote.quote_number,
        "line_items": quote.line_items,
        "subtotal": quote.subtotal,
        "tax": quote.tax,
        "total": quote.total,
        "status": quote.status,
        "valid_until": quote.valid_until,
        "notes": quote.notes,
        "accepted_at": quote.accepted_at,
        "accepted_signature": quote.accepted_signature,
        "converted_invoice_id": quote.converted_invoice_id,
        "created_at": quote.created_at,
        "updated_at": quote.updated_at,
    }
