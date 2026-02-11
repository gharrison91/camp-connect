"""
Camp Connect - Parent Portal API Endpoints
Scoped endpoints that let parents view campers, photos, invoices,
and submit health forms through the Parent Portal.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.portal_deps import get_portal_user
from app.database import get_db
from app.models.payment import Invoice
from app.services import portal_service
from app.services.stripe_service import create_checkout_session, create_ach_checkout_session

router = APIRouter(prefix="/portal", tags=["Parent Portal"])


# ---------------------------------------------------------------------------
# Request / Response schemas (inline for portal-specific payloads)
# ---------------------------------------------------------------------------

class HealthFormSubmitRequest(BaseModel):
    """Body for submitting a health form."""
    form_data: Dict[str, Any]


class PortalCheckoutRequest(BaseModel):
    """Body for creating a Stripe checkout session from the portal."""
    success_url: str
    cancel_url: str
    payment_method: str = "card"  # "card" or "ach"


# ---------------------------------------------------------------------------
# GET /portal/campers -- list my campers
# ---------------------------------------------------------------------------

@router.get("/campers")
async def list_my_campers(
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List all campers linked to the authenticated parent/guardian."""
    return await portal_service.list_my_campers(
        db,
        organization_id=portal_user["organization_id"],
        contact_id=portal_user["contact_id"],
    )


# ---------------------------------------------------------------------------
# GET /portal/campers/{camper_id} -- get camper profile (scoped)
# ---------------------------------------------------------------------------

@router.get("/campers/{camper_id}")
async def get_my_camper_profile(
    camper_id: uuid.UUID,
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get full camper profile for a camper linked to the authenticated parent.
    Returns 404 if the camper is not found or not linked to this contact.
    """
    profile = await portal_service.get_my_camper_profile(
        db,
        organization_id=portal_user["organization_id"],
        camper_id=camper_id,
        contact_id=portal_user["contact_id"],
    )
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camper not found or not linked to your account.",
        )
    return profile


# ---------------------------------------------------------------------------
# GET /portal/invoices -- list my invoices
# ---------------------------------------------------------------------------

@router.get("/invoices")
async def list_my_invoices(
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List invoices for the authenticated parent/guardian."""
    return await portal_service.list_my_invoices(
        db,
        organization_id=portal_user["organization_id"],
        contact_id=portal_user["contact_id"],
    )


# ---------------------------------------------------------------------------
# POST /portal/invoices/{invoice_id}/checkout -- create Stripe checkout
# ---------------------------------------------------------------------------

@router.post("/invoices/{invoice_id}/checkout")
async def create_portal_checkout(
    invoice_id: uuid.UUID,
    body: PortalCheckoutRequest,
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a Stripe checkout session for a portal invoice.
    Supports both card and ACH (US bank account) payment methods.

    Returns:
        { session_id: str, checkout_url: str }
    """
    # Fetch the invoice, scoped to this contact and org
    result = await db.execute(
        select(Invoice)
        .where(Invoice.id == invoice_id)
        .where(Invoice.organization_id == portal_user["organization_id"])
        .where(Invoice.contact_id == portal_user["contact_id"])
        .where(Invoice.deleted_at.is_(None))
    )
    invoice = result.scalar_one_or_none()

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found or not linked to your account.",
        )

    if invoice.status in ("paid", "cancelled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoice is already {invoice.status}. Cannot create checkout.",
        )

    # Build line items from the invoice
    line_items: List[Dict[str, Any]] = []
    if invoice.line_items:
        for item in invoice.line_items:
            line_items.append({
                "name": item.get("description", "Camp Invoice Item"),
                "amount": int(float(item.get("amount", 0)) * 100),  # dollars to cents
                "quantity": item.get("quantity", 1),
            })
    else:
        # Fallback: single line item for the total
        line_items.append({
            "name": f"Invoice Payment",
            "amount": int(float(invoice.total) * 100),
            "quantity": 1,
        })

    try:
        if body.payment_method == "ach":
            session_data = await create_ach_checkout_session(
                organization_id=portal_user["organization_id"],
                invoice_id=invoice.id,
                line_items=line_items,
                return_url=body.success_url,
            )
        else:
            session_data = await create_checkout_session(
                organization_id=portal_user["organization_id"],
                invoice_id=invoice.id,
                line_items=line_items,
                success_url=body.success_url,
                cancel_url=body.cancel_url,
            )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return session_data


# ---------------------------------------------------------------------------
# GET /portal/photos -- list photos for my campers
# ---------------------------------------------------------------------------

@router.get("/photos")
async def list_my_photos(
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List photos for all campers linked to the authenticated parent."""
    return await portal_service.list_my_photos(
        db,
        organization_id=portal_user["organization_id"],
        camper_ids=portal_user["linked_camper_ids"],
    )


# ---------------------------------------------------------------------------
# POST /portal/health-forms/{health_form_id}/submit -- submit a health form
# ---------------------------------------------------------------------------

@router.post("/health-forms/{health_form_id}/submit")
async def submit_health_form(
    health_form_id: uuid.UUID,
    body: HealthFormSubmitRequest,
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Submit a health form for a camper linked to the authenticated parent.
    Returns 404 if the form is not found or not linked to one of the
    parent's campers.
    """
    result = await portal_service.submit_health_form(
        db,
        organization_id=portal_user["organization_id"],
        health_form_id=health_form_id,
        contact_id=portal_user["contact_id"],
        form_data=body.form_data,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health form not found or not linked to your campers.",
        )
    return result
