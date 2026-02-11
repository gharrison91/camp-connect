"""
Camp Connect - Waitlist API Endpoints
Full CRUD + offer/accept/decline workflow for event waitlists.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.waitlist import (
    WaitlistEntryCreate,
    WaitlistEntryRead,
    WaitlistEntryUpdate,
    WaitlistOfferRequest,
    WaitlistReorderRequest,
)
from app.services import waitlist_service

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])


@router.get(
    "/event/{event_id}",
    response_model=List[WaitlistEntryRead],
)
async def get_event_waitlist(
    event_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get the full waitlist for an event, ordered by position."""
    return await waitlist_service.get_waitlist(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
    )


@router.get(
    "/{entry_id}",
    response_model=WaitlistEntryRead,
)
async def get_waitlist_entry(
    entry_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single waitlist entry by ID."""
    entry = await waitlist_service.get_entry(
        db,
        organization_id=current_user["organization_id"],
        entry_id=entry_id,
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found",
        )
    return entry


@router.post(
    "",
    response_model=WaitlistEntryRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_to_waitlist(
    body: WaitlistEntryCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Add a camper to an event's waitlist."""
    try:
        return await waitlist_service.add_to_waitlist(
            db,
            organization_id=current_user["organization_id"],
            data=body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/{entry_id}",
    response_model=WaitlistEntryRead,
)
async def update_waitlist_entry(
    entry_id: uuid.UUID,
    body: WaitlistEntryUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a waitlist entry (priority, notes, contact)."""
    result = await waitlist_service.update_entry(
        db,
        organization_id=current_user["organization_id"],
        entry_id=entry_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found",
        )
    return result


@router.delete(
    "/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_from_waitlist(
    entry_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Remove an entry from the waitlist."""
    deleted = await waitlist_service.remove_from_waitlist(
        db,
        organization_id=current_user["organization_id"],
        entry_id=entry_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found",
        )


@router.post(
    "/{entry_id}/offer",
    response_model=WaitlistEntryRead,
)
async def offer_spot(
    entry_id: uuid.UUID,
    body: WaitlistOfferRequest = WaitlistOfferRequest(),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Offer a spot to a waitlisted camper with an expiry window."""
    try:
        result = await waitlist_service.offer_spot(
            db,
            organization_id=current_user["organization_id"],
            entry_id=entry_id,
            expires_in_hours=body.expires_in_hours,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found",
        )
    return result


@router.post(
    "/{entry_id}/accept",
    response_model=WaitlistEntryRead,
)
async def accept_spot(
    entry_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Accept an offered spot on the waitlist."""
    try:
        result = await waitlist_service.accept_spot(
            db,
            organization_id=current_user["organization_id"],
            entry_id=entry_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found",
        )
    return result


@router.post(
    "/{entry_id}/decline",
    response_model=WaitlistEntryRead,
)
async def decline_spot(
    entry_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Decline an offered spot and auto-advance the next in queue."""
    try:
        result = await waitlist_service.decline_spot(
            db,
            organization_id=current_user["organization_id"],
            entry_id=entry_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found",
        )
    return result


@router.post(
    "/reorder",
    response_model=List[WaitlistEntryRead],
)
async def reorder_waitlist(
    body: WaitlistReorderRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Manually reorder waitlist entries."""
    try:
        return await waitlist_service.reorder(
            db,
            organization_id=current_user["organization_id"],
            items=[item.model_dump() for item in body.items],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
