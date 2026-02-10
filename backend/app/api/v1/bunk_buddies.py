"""
Camp Connect - Bunk Buddy Request API Routes
CRUD for bunk buddy requests with mutual detection.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.bunk_buddy import BunkBuddyRequest
from app.models.camper import Camper
from app.models.event import Event
from app.models.contact import Contact
from app.schemas.bunk_buddy import (
    BuddyRequestCreate,
    BuddyRequestUpdate,
    BuddyRequestResponse,
)

router = APIRouter(prefix="/bunks/buddy-requests", tags=["bunk-buddies"])


async def _request_to_dict(
    req: BunkBuddyRequest,
    db: AsyncSession,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Convert a buddy request to response dict with mutual detection."""
    # Load camper names
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

    # Contact name
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
