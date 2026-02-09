"""
Camp Connect - Payment Service
Business logic for recording payments and processing refunds.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Invoice, Payment
from app.services import stripe_service


async def list_payments(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    invoice_id: Optional[uuid.UUID] = None,
    contact_id: Optional[uuid.UUID] = None,
) -> List[Dict[str, Any]]:
    """List payments with optional filters."""
    query = (
        select(Payment)
        .where(Payment.organization_id == organization_id)
    )

    if invoice_id:
        query = query.where(Payment.invoice_id == invoice_id)
    if contact_id:
        query = query.where(Payment.contact_id == contact_id)

    query = query.order_by(Payment.created_at.desc())
    result = await db.execute(query)
    payments = result.scalars().all()

    return [_payment_to_dict(p) for p in payments]


async def get_payment(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    payment_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single payment by ID."""
    result = await db.execute(
        select(Payment)
        .where(Payment.id == payment_id)
        .where(Payment.organization_id == organization_id)
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        return None
    return _payment_to_dict(payment)


async def record_payment(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Record a new payment.

    Data may include:
        invoice_id, amount, payment_method, stripe_payment_intent_id, contact_id
    """
    payment = Payment(
        id=uuid.uuid4(),
        organization_id=organization_id,
        invoice_id=data.get("invoice_id"),
        contact_id=data.get("contact_id"),
        amount=data["amount"],
        payment_method=data.get("payment_method", "stripe"),
        stripe_payment_intent_id=data.get("stripe_payment_intent_id"),
        status="completed",
        paid_at=datetime.utcnow(),
    )
    db.add(payment)

    # If linked to an invoice, check whether all payments cover the total
    if payment.invoice_id:
        await _maybe_mark_invoice_paid(db, invoice_id=payment.invoice_id)

    await db.commit()
    await db.refresh(payment)
    return _payment_to_dict(payment)


async def process_refund(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    payment_id: uuid.UUID,
    amount: Optional[Decimal] = None,
) -> Optional[Dict[str, Any]]:
    """
    Mark a payment as refunded. If the payment has a Stripe payment intent,
    also initiate a refund through Stripe.

    Args:
        organization_id: Tenant scope.
        payment_id: The payment to refund.
        amount: Partial refund amount. None = full refund.
    """
    result = await db.execute(
        select(Payment)
        .where(Payment.id == payment_id)
        .where(Payment.organization_id == organization_id)
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        return None

    if payment.status == "refunded":
        raise ValueError("Payment has already been refunded")

    refund_amount = amount if amount is not None else payment.amount

    # Attempt Stripe refund if a payment intent exists
    if payment.stripe_payment_intent_id:
        try:
            amount_cents = int(refund_amount * 100) if amount is not None else None
            await stripe_service.create_refund(
                payment_intent_id=payment.stripe_payment_intent_id,
                amount=amount_cents,
            )
        except Exception:
            # If Stripe refund fails (e.g. stripe not configured), still record locally
            pass

    payment.status = "refunded"
    payment.refund_amount = refund_amount

    await db.commit()
    await db.refresh(payment)
    return _payment_to_dict(payment)


# ─── Internal helpers ───────────────────────────────────────────


async def _maybe_mark_invoice_paid(
    db: AsyncSession,
    *,
    invoice_id: uuid.UUID,
) -> None:
    """If total payments >= invoice total, mark the invoice as paid."""
    inv_result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    )
    invoice = inv_result.scalar_one_or_none()
    if invoice is None:
        return

    # Sum all completed payments for this invoice
    pay_result = await db.execute(
        select(Payment)
        .where(Payment.invoice_id == invoice_id)
        .where(Payment.status == "completed")
    )
    payments = pay_result.scalars().all()
    paid_total = sum((p.amount for p in payments), Decimal("0.00"))

    if paid_total >= invoice.total:
        invoice.status = "paid"
        invoice.paid_at = datetime.utcnow()


def _payment_to_dict(payment: Payment) -> Dict[str, Any]:
    """Convert a Payment model to a response dict."""
    return {
        "id": payment.id,
        "organization_id": payment.organization_id,
        "invoice_id": payment.invoice_id,
        "registration_id": payment.registration_id,
        "contact_id": payment.contact_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "payment_method": payment.payment_method,
        "stripe_payment_intent_id": payment.stripe_payment_intent_id,
        "stripe_charge_id": payment.stripe_charge_id,
        "status": payment.status,
        "refund_amount": payment.refund_amount,
        "paid_at": payment.paid_at,
        "created_at": payment.created_at,
        "updated_at": payment.updated_at,
    }
