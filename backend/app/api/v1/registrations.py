"""
Camp Connect - Registration API Endpoints
Register campers for events, manage registrations and waitlists.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.registration import (
    RegistrationCreate,
    RegistrationResponse,
    RegistrationUpdate,
)
from app.schemas.waitlist import WaitlistResponse
from app.services import registration_service

router = APIRouter(prefix="/registrations", tags=["Registrations"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def register_camper(
    body: RegistrationCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.registrations.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Register a camper for an event.
    If the event is full, the camper is added to the waitlist instead.
    """
    try:
        return await registration_service.register_camper(
            db,
            organization_id=current_user["organization_id"],
            camper_id=body.camper_id,
            event_id=body.event_id,
            registered_by=body.registered_by,
            activity_requests=body.activity_requests,
            special_requests=body.special_requests,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=List[RegistrationResponse],
)
async def list_registrations(
    event_id: Optional[uuid.UUID] = Query(default=None, description="Filter by event"),
    camper_id: Optional[uuid.UUID] = Query(default=None, description="Filter by camper"),
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by status"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.registrations.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List registrations with optional filters."""
    return await registration_service.list_registrations(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
        camper_id=camper_id,
        status_filter=status_filter,
    )


@router.get(
    "/{registration_id}",
    response_model=RegistrationResponse,
)
async def get_registration(
    registration_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.registrations.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single registration by ID."""
    reg = await registration_service.get_registration(
        db,
        organization_id=current_user["organization_id"],
        registration_id=registration_id,
    )
    if reg is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found",
        )
    return reg


@router.put(
    "/{registration_id}",
    response_model=RegistrationResponse,
)
async def update_registration(
    registration_id: uuid.UUID,
    body: RegistrationUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.registrations.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a registration."""
    result = await registration_service.update_registration(
        db,
        organization_id=current_user["organization_id"],
        registration_id=registration_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found",
        )
    return result


@router.post(
    "/{registration_id}/cancel",
    response_model=RegistrationResponse,
)
async def cancel_registration(
    registration_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.registrations.cancel")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a registration. Promotes next from waitlist if applicable."""
    try:
        result = await registration_service.cancel_registration(
            db,
            organization_id=current_user["organization_id"],
            registration_id=registration_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found",
        )
    return result


# ─── Waitlist ─────────────────────────────────────────────────

@router.get(
    "/events/{event_id}/waitlist",
    response_model=List[WaitlistResponse],
)
async def get_event_waitlist(
    event_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.registrations.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get the waitlist for an event, ordered by position."""
    return await registration_service.get_waitlist(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
    )


@router.post(
    "/waitlist/{waitlist_id}/promote",
)
async def promote_from_waitlist(
    waitlist_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.registrations.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Manually promote a waitlist entry to a confirmed registration."""
    try:
        return await registration_service.promote_from_waitlist(
            db,
            organization_id=current_user["organization_id"],
            waitlist_id=waitlist_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
