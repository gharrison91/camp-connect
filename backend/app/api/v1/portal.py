"""
Camp Connect - Parent Portal API Endpoints
Scoped endpoints that let parents view campers, photos, invoices,
and submit health forms through the Parent Portal.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.portal_deps import get_portal_user
from app.database import get_db
from app.services import portal_service

router = APIRouter(prefix="/portal", tags=["Parent Portal"])


# ---------------------------------------------------------------------------
# Request / Response schemas (inline for portal-specific payloads)
# ---------------------------------------------------------------------------

class HealthFormSubmitRequest(BaseModel):
    """Body for submitting a health form."""
    form_data: Dict[str, Any]


# ---------------------------------------------------------------------------
# GET /portal/campers — list my campers
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
# GET /portal/campers/{camper_id} — get camper profile (scoped)
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
# GET /portal/invoices — list my invoices
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
# GET /portal/photos — list photos for my campers
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
# POST /portal/health-forms/{health_form_id}/submit — submit a health form
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
