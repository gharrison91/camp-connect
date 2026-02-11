"""
Camp Connect - Carpool API Endpoints
Full CRUD for carpool coordination: carpools, riders, and stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.carpool import (
    CarpoolCreate,
    CarpoolResponse,
    CarpoolRiderCreate,
    CarpoolRiderResponse,
    CarpoolRiderUpdate,
    CarpoolStats,
    CarpoolUpdate,
)
from app.services import carpool_service

router = APIRouter(prefix="/carpools", tags=["Carpools"])


# ---------------------------------------------------------------------------
# Carpool CRUD
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[CarpoolResponse],
)
async def list_carpools(
    search: Optional[str] = Query(
        default=None, description="Search by driver name or pickup location"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all carpools for the current organization."""
    return await carpool_service.list_carpools(
        db,
        organization_id=current_user["organization_id"],
        search=search,
    )


@router.get(
    "/stats",
    response_model=CarpoolStats,
)
async def get_carpool_stats(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated carpool statistics."""
    return await carpool_service.get_stats(
        db,
        organization_id=current_user["organization_id"],
    )


@router.get(
    "/{carpool_id}",
    response_model=CarpoolResponse,
)
async def get_carpool(
    carpool_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single carpool by ID."""
    carpool = await carpool_service.get_carpool(
        db,
        organization_id=current_user["organization_id"],
        carpool_id=carpool_id,
    )
    if carpool is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool not found",
        )
    return carpool


@router.post(
    "",
    response_model=CarpoolResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_carpool(
    body: CarpoolCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new carpool."""
    return await carpool_service.create_carpool(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{carpool_id}",
    response_model=CarpoolResponse,
)
async def update_carpool(
    carpool_id: uuid.UUID,
    body: CarpoolUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a carpool."""
    result = await carpool_service.update_carpool(
        db,
        organization_id=current_user["organization_id"],
        carpool_id=carpool_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool not found",
        )
    return result


@router.delete(
    "/{carpool_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_carpool(
    carpool_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) a carpool."""
    deleted = await carpool_service.delete_carpool(
        db,
        organization_id=current_user["organization_id"],
        carpool_id=carpool_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carpool not found",
        )


# ---------------------------------------------------------------------------
# Rider CRUD
# ---------------------------------------------------------------------------


@router.get(
    "/{carpool_id}/riders",
    response_model=List[CarpoolRiderResponse],
)
async def list_riders(
    carpool_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List riders for a carpool."""
    return await carpool_service.list_riders(
        db,
        organization_id=current_user["organization_id"],
        carpool_id=carpool_id,
    )


@router.post(
    "/{carpool_id}/riders",
    response_model=CarpoolRiderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_rider(
    carpool_id: uuid.UUID,
    body: CarpoolRiderCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Add a rider to a carpool."""
    result = await carpool_service.add_rider(
        db,
        organization_id=current_user["organization_id"],
        carpool_id=carpool_id,
        data=body.model_dump(),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Carpool not found or no seats available",
        )
    return result


@router.put(
    "/riders/{rider_id}",
    response_model=CarpoolRiderResponse,
)
async def update_rider(
    rider_id: uuid.UUID,
    body: CarpoolRiderUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a rider (e.g. confirm status)."""
    result = await carpool_service.update_rider(
        db,
        organization_id=current_user["organization_id"],
        rider_id=rider_id,
        data=body.model_dump(),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found",
        )
    return result


@router.delete(
    "/riders/{rider_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_rider(
    rider_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.carpools.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Remove a rider from a carpool."""
    removed = await carpool_service.remove_rider(
        db,
        organization_id=current_user["organization_id"],
        rider_id=rider_id,
    )
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rider not found",
        )
