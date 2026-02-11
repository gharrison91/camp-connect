"""
Camp Connect - Cabin API Endpoints
Full CRUD for cabins, plus endpoints to list/assign/unassign bunks within a cabin.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.cabin import (
    CabinCreate,
    CabinResponse,
    CabinUpdate,
    CabinWithBunksResponse,
    CabinBunkSummary,
)
from app.services import cabin_service

router = APIRouter(prefix="/cabins", tags=["Cabins"])


# ---------------------------------------------------------------------------
# Cabin CRUD
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[CabinResponse],
)
async def list_cabins(
    include_inactive: bool = Query(default=False),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all cabins for the current organization."""
    return await cabin_service.list_cabins(
        db,
        organization_id=current_user["organization_id"],
        include_inactive=include_inactive,
    )


@router.get(
    "/{cabin_id}",
    response_model=CabinWithBunksResponse,
)
async def get_cabin(
    cabin_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single cabin by ID, including its bunks."""
    cabin = await cabin_service.get_cabin(
        db,
        organization_id=current_user["organization_id"],
        cabin_id=cabin_id,
    )
    if cabin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cabin not found",
        )
    return cabin


@router.post(
    "",
    response_model=CabinResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_cabin(
    body: CabinCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new cabin."""
    try:
        return await cabin_service.create_cabin(
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
    "/{cabin_id}",
    response_model=CabinResponse,
)
async def update_cabin(
    cabin_id: uuid.UUID,
    body: CabinUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a cabin."""
    result = await cabin_service.update_cabin(
        db,
        organization_id=current_user["organization_id"],
        cabin_id=cabin_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cabin not found",
        )
    return result


@router.delete(
    "/{cabin_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_cabin(
    cabin_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) a cabin. Bunks inside become unassigned."""
    deleted = await cabin_service.delete_cabin(
        db,
        organization_id=current_user["organization_id"],
        cabin_id=cabin_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cabin not found",
        )


# ---------------------------------------------------------------------------
# Bunks within a cabin
# ---------------------------------------------------------------------------


@router.get(
    "/{cabin_id}/bunks",
    response_model=List[CabinBunkSummary],
)
async def list_cabin_bunks(
    cabin_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all bunks belonging to a specific cabin."""
    return await cabin_service.list_cabin_bunks(
        db,
        organization_id=current_user["organization_id"],
        cabin_id=cabin_id,
    )


@router.post(
    "/{cabin_id}/bunks/{bunk_id}",
    response_model=CabinBunkSummary,
)
async def assign_bunk_to_cabin(
    cabin_id: uuid.UUID,
    bunk_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Assign an existing bunk to this cabin."""
    try:
        result = await cabin_service.assign_bunk_to_cabin(
            db,
            organization_id=current_user["organization_id"],
            cabin_id=cabin_id,
            bunk_id=bunk_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunk not found",
        )
    return result


@router.delete(
    "/{cabin_id}/bunks/{bunk_id}",
    response_model=CabinBunkSummary,
)
async def unassign_bunk_from_cabin(
    cabin_id: uuid.UUID,
    bunk_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.bunks.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Remove a bunk from this cabin (sets cabin_id to null)."""
    result = await cabin_service.unassign_bunk_from_cabin(
        db,
        organization_id=current_user["organization_id"],
        bunk_id=bunk_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunk not found",
        )
    return result
