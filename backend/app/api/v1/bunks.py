"""
Camp Connect - Bunk API Endpoints
Bunk CRUD, camper assignments, and unassigned camper queries.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.bunk import (
    BunkAssignmentCreate,
    BunkAssignmentResponse,
    BunkCounselorAssign,
    BunkCreate,
    BunkMoveRequest,
    BunkResponse,
    BunkUpdate,
    BunkWithAssignmentsResponse,
    UnassignedCamperResponse,
)
from app.schemas.schedule import (
    EventBunkConfigCreate,
    EventBunkConfigResponse,
    EventBunkConfigUpdate,
)
from app.services import bunk_service, event_bunk_config_service

router = APIRouter(prefix="/bunks", tags=["Bunks"])


# ---------------------------------------------------------------------------
# Static path endpoints MUST come before /{bunk_id} to avoid path conflicts
# ---------------------------------------------------------------------------


@router.get(
    "/assignments",
    response_model=List[BunkAssignmentResponse],
)
async def list_assignments(
    event_id: uuid.UUID = Query(..., description="Event ID (required)"),
    bunk_id: Optional[uuid.UUID] = Query(default=None, description="Filter by bunk ID"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List bunk assignments for an event, optionally filtered by bunk."""
    return await bunk_service.list_assignments(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
        bunk_id=bunk_id,
    )


@router.post(
    "/assignments",
    response_model=BunkAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def assign_camper(
    body: BunkAssignmentCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Assign a camper to a bunk for a specific event."""
    try:
        return await bunk_service.assign_camper(
            db,
            organization_id=current_user["organization_id"],
            data=body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unassign_camper(
    assignment_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Remove a camper's bunk assignment."""
    deleted = await bunk_service.unassign_camper(
        db,
        organization_id=current_user["organization_id"],
        assignment_id=assignment_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )


@router.put(
    "/assignments/{assignment_id}/move",
    response_model=BunkAssignmentResponse,
)
async def move_camper(
    assignment_id: uuid.UUID,
    body: BunkMoveRequest,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Move a camper from one bunk to another."""
    try:
        result = await bunk_service.move_camper(
            db,
            organization_id=current_user["organization_id"],
            assignment_id=assignment_id,
            new_bunk_id=body.new_bunk_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )
    return result


@router.get(
    "/unassigned-campers",
    response_model=List[UnassignedCamperResponse],
)
async def get_unassigned_campers(
    event_id: uuid.UUID = Query(..., description="Event ID (required)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get campers registered for an event who are not yet assigned to a bunk."""
    return await bunk_service.get_unassigned_campers(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
    )


# ---------------------------------------------------------------------------
# Event Bunk Config endpoints (static paths before /{bunk_id})
# ---------------------------------------------------------------------------


@router.get(
    "/event-config",
    response_model=List[EventBunkConfigResponse],
)
async def list_event_bunk_configs(
    event_id: uuid.UUID = Query(..., description="Event ID (required)"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all bunk configurations for an event."""
    return await event_bunk_config_service.list_event_bunk_configs(
        db,
        organization_id=current_user["organization_id"],
        event_id=event_id,
    )


@router.post(
    "/event-config",
    response_model=EventBunkConfigResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event_bunk_config(
    body: EventBunkConfigCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create an event-specific bunk configuration."""
    try:
        return await event_bunk_config_service.create_event_bunk_config(
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
    "/event-config/{config_id}",
    response_model=EventBunkConfigResponse,
)
async def update_event_bunk_config(
    config_id: uuid.UUID,
    body: EventBunkConfigUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an event-specific bunk configuration."""
    result = await event_bunk_config_service.update_event_bunk_config(
        db,
        organization_id=current_user["organization_id"],
        config_id=config_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event bunk config not found",
        )
    return result


@router.delete(
    "/event-config/{config_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_event_bunk_config(
    config_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete an event-specific bunk configuration."""
    deleted = await event_bunk_config_service.delete_event_bunk_config(
        db,
        organization_id=current_user["organization_id"],
        config_id=config_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event bunk config not found",
        )


# ---------------------------------------------------------------------------
# Counselor assignment (static-ish but uses {bunk_id}, place before CRUD)
# ---------------------------------------------------------------------------


@router.put(
    "/{bunk_id}/counselor",
    response_model=BunkResponse,
)
async def assign_counselor(
    bunk_id: uuid.UUID,
    body: BunkCounselorAssign,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Assign or unassign a counselor to a bunk.

    Pass `counselor_user_id` to assign, or `null` to unassign.
    Requires **core.bunks.update** permission.
    """
    result = await bunk_service.assign_counselor(
        db,
        organization_id=current_user["organization_id"],
        bunk_id=bunk_id,
        counselor_user_id=body.counselor_user_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunk not found",
        )
    return result


# ---------------------------------------------------------------------------
# Bunk CRUD (dynamic /{bunk_id} paths come AFTER static paths)
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[BunkResponse],
)
async def list_bunks(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all bunks for the current organization."""
    return await bunk_service.list_bunks(
        db,
        organization_id=current_user["organization_id"],
    )


@router.get(
    "/{bunk_id}",
    response_model=BunkWithAssignmentsResponse,
)
async def get_bunk(
    bunk_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single bunk by ID, including its assignments."""
    bunk = await bunk_service.get_bunk(
        db,
        organization_id=current_user["organization_id"],
        bunk_id=bunk_id,
    )
    if bunk is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunk not found",
        )
    return bunk


@router.post(
    "",
    response_model=BunkResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_bunk(
    body: BunkCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new bunk."""
    try:
        return await bunk_service.create_bunk(
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
    "/{bunk_id}",
    response_model=BunkResponse,
)
async def update_bunk(
    bunk_id: uuid.UUID,
    body: BunkUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a bunk."""
    result = await bunk_service.update_bunk(
        db,
        organization_id=current_user["organization_id"],
        bunk_id=bunk_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunk not found",
        )
    return result


@router.delete(
    "/{bunk_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_bunk(
    bunk_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) a bunk."""
    deleted = await bunk_service.delete_bunk(
        db,
        organization_id=current_user["organization_id"],
        bunk_id=bunk_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunk not found",
        )
