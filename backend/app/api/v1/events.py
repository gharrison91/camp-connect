"""
Camp Connect - Event API Endpoints
Full CRUD for camp events/sessions.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.event import EventClone, EventCreate, EventResponse, EventUpdate
from app.services import event_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.get(
    "",
    response_model=List[EventResponse],
)
async def list_events(
    search: Optional[str] = Query(default=None, description="Search by event name"),
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by status"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all events for the current organization."""
    return await event_service.list_events(
        db,
        organization_id=current_user["organization_id"],
        status_filter=status_filter,
        search=search,
    )


@router.get(
    "/{event_id}",
    response_model=EventResponse,
)
async def get_event(
    event_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single event by ID."""
    event = await event_service.get_event(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
    )
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    return event


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    body: EventCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new event."""
    try:
        return await event_service.create_event(
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
    "/{event_id}",
    response_model=EventResponse,
)
async def update_event(
    event_id: uuid.UUID,
    body: EventUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an event."""
    result = await event_service.update_event(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    return result


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_event(
    event_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) an event."""
    deleted = await event_service.delete_event(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )


@router.post(
    "/{event_id}/clone",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def clone_event(
    event_id: uuid.UUID,
    body: EventClone,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.events.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Clone an event with new dates."""
    result = await event_service.clone_event(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
        new_name=body.name,
        new_start_date=body.start_date,
        new_end_date=body.end_date,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    return result
