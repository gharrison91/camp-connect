"""
Camp Connect - Location API Endpoints
Full CRUD for organization locations.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationResponse, LocationUpdate

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get(
    "",
    response_model=List[LocationResponse],
)
async def list_locations(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.locations.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all locations for the current organization."""
    result = await db.execute(
        select(Location)
        .where(Location.organization_id == current_user["organization_id"])
        .order_by(Location.is_primary.desc(), Location.name)
    )
    return result.scalars().all()


@router.get(
    "/{location_id}",
    response_model=LocationResponse,
)
async def get_location(
    location_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.locations.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single location by ID."""
    result = await db.execute(
        select(Location)
        .where(Location.id == location_id)
        .where(Location.organization_id == current_user["organization_id"])
    )
    location = result.scalar_one_or_none()
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )
    return location


@router.post(
    "",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_location(
    body: LocationCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.locations.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new location."""
    # If this is marked as primary, unset any existing primary
    if body.is_primary:
        result = await db.execute(
            select(Location)
            .where(Location.organization_id == current_user["organization_id"])
            .where(Location.is_primary.is_(True))
        )
        for loc in result.scalars().all():
            loc.is_primary = False

    location = Location(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        name=body.name,
        address=body.address,
        city=body.city,
        state=body.state,
        zip_code=body.zip_code,
        phone=body.phone,
        is_primary=body.is_primary,
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


@router.put(
    "/{location_id}",
    response_model=LocationResponse,
)
async def update_location(
    location_id: uuid.UUID,
    body: LocationUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.locations.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a location."""
    result = await db.execute(
        select(Location)
        .where(Location.id == location_id)
        .where(Location.organization_id == current_user["organization_id"])
    )
    location = result.scalar_one_or_none()
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )

    update_data = body.model_dump(exclude_unset=True)

    # Handle primary flag — unset others if setting this as primary
    if update_data.get("is_primary") is True:
        others = await db.execute(
            select(Location)
            .where(Location.organization_id == current_user["organization_id"])
            .where(Location.id != location_id)
            .where(Location.is_primary.is_(True))
        )
        for loc in others.scalars().all():
            loc.is_primary = False

    for key, value in update_data.items():
        setattr(location, key, value)

    await db.commit()
    await db.refresh(location)
    return location


@router.delete(
    "/{location_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_location(
    location_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.locations.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a location."""
    result = await db.execute(
        select(Location)
        .where(Location.id == location_id)
        .where(Location.organization_id == current_user["organization_id"])
    )
    location = result.scalar_one_or_none()
    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )

    await db.delete(location)
    await db.commit()
