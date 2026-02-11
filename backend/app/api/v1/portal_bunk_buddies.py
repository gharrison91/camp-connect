"""
Camp Connect - Portal Bunk Buddy API Routes
Parent-facing endpoints for viewing and submitting bunk buddy requests.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.portal_deps import get_portal_user
from app.models.bunk_buddy import BunkBuddyRequest
from app.models.camper import Camper
from app.models.event import Event
from app.models.organization import Organization
from app.schemas.bunk_buddy import (
    PortalBuddyRequestCreate,
    PortalBuddyRequestResponse,
    BuddySettingsResponse,
)

router = APIRouter(prefix="/portal/bunk-buddies", tags=["Portal Bunk Buddies"])

BUDDY_SETTINGS_KEY = "bunk_buddy_settings"


def _get_buddy_settings(org: Organization) -> dict:
    """Extract buddy settings from the org settings JSONB, with defaults."""
    settings = (org.settings or {}).get(BUDDY_SETTINGS_KEY, {})
    return {
        "max_requests_per_camper": settings.get("max_requests_per_camper", 3),
        "request_deadline": settings.get("request_deadline", None),
        "allow_portal_requests": settings.get("allow_portal_requests", True),
    }


async def _portal_request_to_dict(
    req: BunkBuddyRequest,
    db: AsyncSession,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Convert a buddy request to a portal-safe response dict."""
    requester = await db.get(Camper, req.requester_camper_id)
    requested = await db.get(Camper, req.requested_camper_id)
    event = await db.get(Event, req.event_id)

    # Check for mutual request
    mutual_result = await db.execute(
        select(BunkBuddyRequest).where(
            BunkBuddyRequest.event_id == req.event_id,
            BunkBuddyRequest.requester_camper_id == req.requested_camper_id,
            BunkBuddyRequest.requested_camper_id == req.requester_camper_id,
            BunkBuddyRequest.organization_id == org_id,
        )
    )
    is_mutual = mutual_result.scalar_one_or_none() is not None

    return {
        "id": req.id,
        "event_id": req.event_id,
        "event_name": event.name if event else None,
        "requester_camper_id": req.requester_camper_id,
        "requester_name": (
            f"{requester.first_name} {requester.last_name}" if requester else "Unknown"
        ),
        "requested_camper_id": req.requested_camper_id,
        "requested_name": (
            f"{requested.first_name} {requested.last_name}" if requested else "Unknown"
        ),
        "status": req.status,
        "is_mutual": is_mutual,
        "created_at": req.created_at,
    }


@router.get("")
async def list_portal_buddy_requests(
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    List buddy requests for the parent's linked campers.
    Also returns settings (max requests, deadline) so the UI can show limits.
    """
    org_id = portal_user["organization_id"]
    linked_camper_ids = portal_user["linked_camper_ids"]

    org = await db.get(Organization, org_id)
    buddy_settings = _get_buddy_settings(org) if org else {
        "max_requests_per_camper": 3,
        "request_deadline": None,
        "allow_portal_requests": True,
    }

    if not linked_camper_ids:
        return {"requests": [], "settings": buddy_settings}

    # Get all requests where any linked camper is the requester
    result = await db.execute(
        select(BunkBuddyRequest)
        .where(
            BunkBuddyRequest.organization_id == org_id,
            BunkBuddyRequest.requester_camper_id.in_(linked_camper_ids),
        )
        .order_by(BunkBuddyRequest.created_at.desc())
    )
    requests = result.scalars().all()

    items = [await _portal_request_to_dict(r, db, org_id) for r in requests]

    # Calculate per-camper request counts for limit display
    camper_counts: Dict[str, int] = {}
    for r in requests:
        cid = str(r.requester_camper_id)
        camper_counts[cid] = camper_counts.get(cid, 0) + 1

    return {
        "requests": items,
        "settings": buddy_settings,
        "camper_request_counts": camper_counts,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_portal_buddy_request(
    body: PortalBuddyRequestCreate,
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Submit a bunk buddy request from the parent portal.
    The parent provides a camper name (free text), which admin will match later.
    Enforces request limits and deadline from org settings.
    """
    org_id = portal_user["organization_id"]
    contact_id = portal_user["contact_id"]
    linked_camper_ids = portal_user["linked_camper_ids"]

    # Verify the requester camper is linked to this parent
    if body.requester_camper_id not in linked_camper_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit requests for your own campers.",
        )

    # Load org settings
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    buddy_settings = _get_buddy_settings(org)

    # Check if portal requests are allowed
    if not buddy_settings["allow_portal_requests"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bunk buddy requests are currently not being accepted.",
        )

    # Check deadline
    deadline_str = buddy_settings.get("request_deadline")
    if deadline_str:
        try:
            deadline = date.fromisoformat(deadline_str)
            if date.today() > deadline:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"The deadline for buddy requests was {deadline_str}.",
                )
        except ValueError:
            pass  # Invalid date format in settings, skip check

    # Check max requests per camper
    max_requests = buddy_settings["max_requests_per_camper"]
    count_result = await db.execute(
        select(func.count(BunkBuddyRequest.id)).where(
            BunkBuddyRequest.organization_id == org_id,
            BunkBuddyRequest.requester_camper_id == body.requester_camper_id,
            BunkBuddyRequest.event_id == body.event_id,
        )
    )
    current_count = count_result.scalar() or 0

    if current_count >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum of {max_requests} buddy requests per camper reached.",
        )

    # Try to find the requested camper by name (best-effort fuzzy match)
    name_parts = body.requested_camper_name.strip().split()
    requested_camper_id = None

    if len(name_parts) >= 2:
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:])
        match_result = await db.execute(
            select(Camper).where(
                Camper.organization_id == org_id,
                func.lower(Camper.first_name) == first_name.lower(),
                func.lower(Camper.last_name) == last_name.lower(),
            )
        )
        matched = match_result.scalar_one_or_none()
        if matched:
            requested_camper_id = matched.id
    elif len(name_parts) == 1:
        match_result = await db.execute(
            select(Camper).where(
                Camper.organization_id == org_id,
                func.lower(Camper.first_name) == name_parts[0].lower(),
            )
        )
        matched = match_result.scalars().all()
        if len(matched) == 1:
            requested_camper_id = matched[0].id

    # If we could not match, create a placeholder camper record
    # so the admin can resolve it later. For now, we use a sentinel approach:
    # store the name in admin_notes and use a self-reference placeholder.
    if requested_camper_id is None:
        # Create the request with the requester as both sides (placeholder)
        # and store the requested name in admin_notes for admin resolution.
        request_obj = BunkBuddyRequest(
            id=uuid.uuid4(),
            organization_id=org_id,
            event_id=body.event_id,
            requester_camper_id=body.requester_camper_id,
            requested_camper_id=body.requester_camper_id,  # placeholder
            submitted_by_contact_id=contact_id,
            admin_notes=f"Portal request - buddy name: {body.requested_camper_name}",
            status="pending",
        )
        db.add(request_obj)
        await db.commit()
        await db.refresh(request_obj)

        requester = await db.get(Camper, body.requester_camper_id)
        event = await db.get(Event, body.event_id)

        return {
            "id": request_obj.id,
            "event_id": request_obj.event_id,
            "event_name": event.name if event else None,
            "requester_camper_id": request_obj.requester_camper_id,
            "requester_name": (
                f"{requester.first_name} {requester.last_name}" if requester else "Unknown"
            ),
            "requested_camper_id": None,
            "requested_name": body.requested_camper_name,
            "status": "pending",
            "is_mutual": False,
            "created_at": request_obj.created_at,
        }

    # Prevent self-request
    if body.requester_camper_id == requested_camper_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A camper cannot request themselves as a buddy.",
        )

    # Check for duplicate
    existing = await db.execute(
        select(BunkBuddyRequest).where(
            BunkBuddyRequest.event_id == body.event_id,
            BunkBuddyRequest.requester_camper_id == body.requester_camper_id,
            BunkBuddyRequest.requested_camper_id == requested_camper_id,
            BunkBuddyRequest.organization_id == org_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This buddy request already exists.",
        )

    request_obj = BunkBuddyRequest(
        id=uuid.uuid4(),
        organization_id=org_id,
        event_id=body.event_id,
        requester_camper_id=body.requester_camper_id,
        requested_camper_id=requested_camper_id,
        submitted_by_contact_id=contact_id,
        status="pending",
    )
    db.add(request_obj)
    await db.commit()
    await db.refresh(request_obj)

    return await _portal_request_to_dict(request_obj, db, org_id)


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portal_buddy_request(
    request_id: uuid.UUID,
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a buddy request from the portal (only if still pending)."""
    org_id = portal_user["organization_id"]
    linked_camper_ids = portal_user["linked_camper_ids"]

    result = await db.execute(
        select(BunkBuddyRequest).where(
            BunkBuddyRequest.id == request_id,
            BunkBuddyRequest.organization_id == org_id,
        )
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")

    # Only allow cancelling own camper requests
    if req.requester_camper_id not in linked_camper_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel requests for your own campers.",
        )

    if req.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be cancelled.",
        )

    await db.delete(req)
    await db.commit()
