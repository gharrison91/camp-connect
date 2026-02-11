"""
Camp Connect - Bunk Buddy Request API Routes
CRUD for bunk buddy requests with mutual detection.
v2: Adds configurable settings (max requests, deadline) stored in org settings JSONB.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.bunk_buddy import BunkBuddyRequest
from app.models.camper import Camper
from app.models.event import Event
from app.models.contact import Contact
from app.models.organization import Organization
from app.schemas.bunk_buddy import (
    BuddyRequestCreate,
    BuddyRequestUpdate,
    BuddyRequestResponse,
    BuddySettingsResponse,
    BuddySettingsUpdate,
)

router = APIRouter(prefix="/bunks/buddy-requests", tags=["bunk-buddies"])

# --- Helpers -----------------------------------------------------------------

BUDDY_SETTINGS_KEY = "bunk_buddy_settings"


def _get_buddy_settings(org: Organization) -> dict:
    """Extract buddy settings from the org settings JSONB, with defaults."""
    settings = (org.settings or {}).get(BUDDY_SETTINGS_KEY, {})
    return {
        "max_requests_per_camper": settings.get("max_requests_per_camper", 3),
        "request_deadline": settings.get("request_deadline", None),
        "allow_portal_requests": settings.get("allow_portal_requests", True),
    }


async def _request_to_dict(
    req: BunkBuddyRequest,
    db: AsyncSession,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Convert a buddy request to response dict with mutual detection."""
    requester = await db.get(Camper, req.requester_camper_id)
    requested = await db.get(Camper, req.requested_camper_id)
    event = await db.get(Event, req.event_id)

    # Check for mutual request (reverse direction)
    mutual_result = await db.execute(
        select(BunkBuddyRequest).where(
            BunkBuddyRequest.event_id == req.event_id,
            BunkBuddyRequest.requester_camper_id == req.requested_camper_id,
            BunkBuddyRequest.requested_camper_id == req.requester_camper_id,
            BunkBuddyRequest.organization_id == org_id,
        )
    )
    is_mutual = mutual_result.scalar_one_or_none() is not None

    submitted_by_name = None
    if req.submitted_by_contact_id:
        contact = await db.get(Contact, req.submitted_by_contact_id)
        if contact:
            submitted_by_name = f"{contact.first_name} {contact.last_name}"

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
        "submitted_by_contact_id": req.submitted_by_contact_id,
        "submitted_by_name": submitted_by_name,
        "admin_notes": req.admin_notes,
        "reviewed_by": req.reviewed_by,
        "reviewed_at": req.reviewed_at,
        "created_at": req.created_at,
    }


# --- Settings Endpoints (v2) ------------------------------------------------


@router.get("/settings", response_model=BuddySettingsResponse)
async def get_buddy_settings(
    current_user: Dict[str, Any] = Depends(
        require_permission("campers.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get the organization's bunk buddy request settings."""
    org = await db.get(Organization, current_user["organization_id"])
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return _get_buddy_settings(org)


@router.put("/settings", response_model=BuddySettingsResponse)
async def update_buddy_settings(
    body: BuddySettingsUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("campers.bunks.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update the organization's bunk buddy request settings."""
    org = await db.get(Organization, current_user["organization_id"])
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    current_settings = dict(org.settings or {})
    buddy = current_settings.get(BUDDY_SETTINGS_KEY, {})

    if body.max_requests_per_camper is not None:
        buddy["max_requests_per_camper"] = body.max_requests_per_camper
    if body.request_deadline is not None:
        buddy["request_deadline"] = body.request_deadline if body.request_deadline else None
    if body.allow_portal_requests is not None:
        buddy["allow_portal_requests"] = body.allow_portal_requests

    current_settings[BUDDY_SETTINGS_KEY] = buddy
    org.settings = current_settings
    # Force SQLAlchemy to detect the JSONB mutation
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(org, "settings")

    await db.commit()
    await db.refresh(org)
    return _get_buddy_settings(org)


# --- CRUD Endpoints ----------------------------------------------------------


@router.get("", response_model=List[BuddyRequestResponse])
async def list_buddy_requests(
    event_id: Optional[uuid.UUID] = Query(default=None),
    status_filter: Optional[str] = Query(default=None),
    current_user: Dict[str, Any] = Depends(
        require_permission("campers.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all buddy requests, optionally filtered by event and status."""
    org_id = current_user["organization_id"]

    query = (
        select(BunkBuddyRequest)
        .where(BunkBuddyRequest.organization_id == org_id)
        .order_by(BunkBuddyRequest.created_at.desc())
    )

    if event_id:
        query = query.where(BunkBuddyRequest.event_id == event_id)
    if status_filter:
        query = query.where(BunkBuddyRequest.status == status_filter)

    result = await db.execute(query)
    requests = result.scalars().all()

    return [await _request_to_dict(r, db, org_id) for r in requests]


@router.post(
    "",
    response_model=BuddyRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_buddy_request(
    body: BuddyRequestCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new buddy request."""
    org_id = current_user["organization_id"]

    # Prevent self-request
    if body.requester_camper_id == body.requested_camper_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A camper cannot request themselves as a buddy",
        )

    # Check for duplicate
    existing = await db.execute(
        select(BunkBuddyRequest).where(
            BunkBuddyRequest.event_id == body.event_id,
            BunkBuddyRequest.requester_camper_id == body.requester_camper_id,
            BunkBuddyRequest.requested_camper_id == body.requested_camper_id,
            BunkBuddyRequest.organization_id == org_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This buddy request already exists",
        )

    request = BunkBuddyRequest(
        id=uuid.uuid4(),
        organization_id=org_id,
        event_id=body.event_id,
        requester_camper_id=body.requester_camper_id,
        requested_camper_id=body.requested_camper_id,
        submitted_by_contact_id=body.submitted_by_contact_id,
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)

    return await _request_to_dict(request, db, org_id)


@router.put("/{request_id}", response_model=BuddyRequestResponse)
async def update_buddy_request(
    request_id: uuid.UUID,
    body: BuddyRequestUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("campers.bunks.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Approve or deny a buddy request."""
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(BunkBuddyRequest).where(
            BunkBuddyRequest.id == request_id,
            BunkBuddyRequest.organization_id == org_id,
        )
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buddy request not found",
        )

    req.status = body.status
    req.admin_notes = body.admin_notes
    req.reviewed_by = current_user["id"]
    req.reviewed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(req)

    return await _request_to_dict(req, db, org_id)


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_buddy_request(
    request_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete/cancel a buddy request."""
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(BunkBuddyRequest).where(
            BunkBuddyRequest.id == request_id,
            BunkBuddyRequest.organization_id == org_id,
        )
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buddy request not found",
        )

    await db.delete(req)
    await db.commit()


@router.get(
    "/camper/{camper_id}",
    response_model=List[BuddyRequestResponse],
)
async def get_camper_buddy_requests(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("campers.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get all buddy requests for a specific camper."""
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(BunkBuddyRequest)
        .where(
            BunkBuddyRequest.organization_id == org_id,
            (BunkBuddyRequest.requester_camper_id == camper_id)
            | (BunkBuddyRequest.requested_camper_id == camper_id),
        )
        .order_by(BunkBuddyRequest.created_at.desc())
    )
    requests = result.scalars().all()

    return [await _request_to_dict(r, db, org_id) for r in requests]
