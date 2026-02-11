"""
Camp Connect - Payment & Invoice API Endpoints
Manage invoices, record payments, and integrate with Stripe.
"""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.payment import (
    ACHSetupRequest,
    ACHSetupResponse,
    CheckoutRequest,
    CheckoutResponse,
    GenerateInvoiceRequest,
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
    PaymentCreate,
    PaymentResponse,
)
from app.services import invoice_service, payment_service, stripe_service

router = APIRouter(prefix="/payments", tags=["Payments"])


# ─── Invoices ──────────────────────────────────────────────────


@router.get(
    "/invoices",
    response_model=List[InvoiceResponse],
)
async def list_invoices(
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by invoice status"
    ),
    family_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by family"
    ),
    contact_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by contact"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List invoices with optional filters."""
    return await invoice_service.list_invoices(
        db,
        organization_id=current_user["organization_id"],
        status=status_filter,
        family_id=family_id,
        contact_id=contact_id,
    )


@router.get(
    "/invoices/{invoice_id}",
    response_model=InvoiceResponse,
)
async def get_invoice(
    invoice_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single invoice by ID."""
    result = await invoice_service.get_invoice(
        db,
        organization_id=current_user["organization_id"],
        invoice_id=invoice_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    return result


@router.post(
    "/invoices",
    status_code=status.HTTP_201_CREATED,
    response_model=InvoiceResponse,
)
async def create_invoice(
    body: InvoiceCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new invoice."""
    return await invoice_service.create_invoice(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/invoices/{invoice_id}",
    response_model=InvoiceResponse,
)
async def update_invoice(
    invoice_id: uuid.UUID,
    body: InvoiceUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing invoice."""
    result = await invoice_service.update_invoice(
        db,
        organization_id=current_user["organization_id"],
        invoice_id=invoice_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    return result


@router.post(
    "/invoices/{invoice_id}/mark-paid",
    response_model=InvoiceResponse,
)
async def mark_invoice_paid(
    invoice_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Manually mark an invoice as paid."""
    result = await invoice_service.mark_invoice_paid(
        db,
        organization_id=current_user["organization_id"],
        invoice_id=invoice_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    return result


@router.post(
    "/invoices/generate",
    status_code=status.HTTP_201_CREATED,
    response_model=InvoiceResponse,
)
async def generate_invoice(
    body: GenerateInvoiceRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Auto-generate an invoice from registration IDs."""
    try:
        return await invoice_service.generate_invoice_from_registrations(
            db,
            organization_id=current_user["organization_id"],
            registration_ids=body.registration_ids,
            contact_id=body.contact_id,
            family_id=body.family_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ─── Payments / Transactions ──────────────────────────────────


@router.get(
    "/transactions",
    response_model=List[PaymentResponse],
)
async def list_payments(
    invoice_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by invoice"
    ),
    contact_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by contact"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.transactions.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List payment transactions."""
    return await payment_service.list_payments(
        db,
        organization_id=current_user["organization_id"],
        invoice_id=invoice_id,
        contact_id=contact_id,
    )


@router.post(
    "/transactions",
    status_code=status.HTTP_201_CREATED,
    response_model=PaymentResponse,
)
async def record_payment(
    body: PaymentCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.transactions.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Record a new payment."""
    return await payment_service.record_payment(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.post(
    "/transactions/{payment_id}/refund",
    response_model=PaymentResponse,
)
async def refund_payment(
    payment_id: uuid.UUID,
    amount: Optional[Decimal] = Query(
        default=None, description="Partial refund amount (omit for full refund)"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.transactions.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Refund a payment (full or partial)."""
    try:
        result = await payment_service.process_refund(
            db,
            organization_id=current_user["organization_id"],
            payment_id=payment_id,
            amount=amount,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )
    return result


# ─── Stripe Checkout ──────────────────────────────────────────


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
)
async def create_checkout_session(
    body: CheckoutRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.transactions.create")
    ),
):
    """Create a Stripe Checkout session for an invoice."""
    try:
        line_items = [
            {"name": item.name, "amount": item.amount, "quantity": item.quantity}
            for item in body.line_items
        ]
        result = await stripe_service.create_checkout_session(
            organization_id=current_user["organization_id"],
            invoice_id=body.invoice_id,
            line_items=line_items,
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )
        return result
    except (RuntimeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ─── ACH / Bank Transfer Checkout ─────────────────────────────


@router.post(
    "/ach-setup",
    response_model=ACHSetupResponse,
)
async def create_ach_setup(
    body: ACHSetupRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.transactions.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session for ACH/bank transfer."""
    # Verify the invoice exists
    invoice = await invoice_service.get_invoice(
        db,
        organization_id=current_user["organization_id"],
        invoice_id=body.invoice_id,
    )
    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    try:
        # Create Stripe Checkout session with us_bank_account payment method
        line_items = []
        if invoice.get("line_items"):
            for item in invoice["line_items"]:
                amount_cents = int(float(item.get("amount", 0)) * 100 * int(item.get("quantity", 1)))
                line_items.append({
                    "name": item.get("description", "Camp Fee"),
                    "amount": amount_cents,
                    "quantity": 1,
                })
        else:
            # Fallback to total
            line_items.append({
                "name": "Invoice Payment",
                "amount": int(float(invoice["total"]) * 100),
                "quantity": 1,
            })

        result = await stripe_service.create_ach_checkout_session(
            organization_id=current_user["organization_id"],
            invoice_id=body.invoice_id,
            line_items=line_items,
            return_url=body.return_url,
        )
        return result
    except (RuntimeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ─── Stripe Webhook (NO auth required) ───────────────────────


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
)
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events. No authentication required —
    verification is done via the Stripe-Signature header.
    """
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    try:
        result = await stripe_service.process_webhook(
            payload=payload,
            signature=signature,
        )
        return {"status": "ok", "event_type": result.get("event_type")}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except (RuntimeError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
