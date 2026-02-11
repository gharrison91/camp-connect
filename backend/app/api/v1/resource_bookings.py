"""
Camp Connect - Resource Booking API Endpoints
Full CRUD for resources and bookings.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.resource_booking import (
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    ResourceCreate,
    ResourceResponse,
    ResourceStats,
    ResourceUpdate,
)
from app.services import resource_booking_service

router = APIRouter(prefix="/resource-bookings", tags=["Resource Bookings"])


# -----------------------------------------------------------------------
# Resource endpoints
# -----------------------------------------------------------------------

@router.get("/resources/stats", response_model=ResourceStats)
async def get_resource_stats(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate resource booking statistics."""
    return await resource_booking_service.get_stats(
        db, organization_id=current_user["organization_id"]
    )


@router.get("/resources", response_model=List[ResourceResponse])
async def list_resources(
    search: Optional[str] = Query(default=None, description="Search by name"),
    resource_type: Optional[str] = Query(
        default=None, description="Filter by type (facility, equipment, vehicle, other)"
    ),
    available: Optional[bool] = Query(default=None, description="Filter by availability"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all bookable resources for the current organization."""
    return await resource_booking_service.list_resources(
        db,
        organization_id=current_user["organization_id"],
        resource_type=resource_type,
        available=available,
        search=search,
    )


@router.get("/resources/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single resource by ID."""
    resource = await resource_booking_service.get_resource(
        db,
        organization_id=current_user["organization_id"],
        resource_id=resource_id,
    )
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )
    return resource


@router.post(
    "/resources",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_resource(
    body: ResourceCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new bookable resource."""
    return await resource_booking_service.create_resource(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put("/resources/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: uuid.UUID,
    body: ResourceUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a resource."""
    result = await resource_booking_service.update_resource(
        db,
        organization_id=current_user["organization_id"],
        resource_id=resource_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )
    return result


@router.delete(
    "/resources/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_resource(
    resource_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a resource."""
    deleted = await resource_booking_service.delete_resource(
        db,
        organization_id=current_user["organization_id"],
        resource_id=resource_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )


# -----------------------------------------------------------------------
# Booking endpoints
# -----------------------------------------------------------------------

@router.get("/bookings", response_model=List[BookingResponse])
async def list_bookings(
    resource_id: Optional[uuid.UUID] = Query(default=None, description="Filter by resource"),
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by status (pending, confirmed, cancelled)"
    ),
    date_from: Optional[datetime] = Query(default=None, description="Start date filter"),
    date_to: Optional[datetime] = Query(default=None, description="End date filter"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all bookings for the current organization."""
    return await resource_booking_service.list_bookings(
        db,
        organization_id=current_user["organization_id"],
        resource_id=resource_id,
        status=status_filter,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single booking by ID."""
    booking = await resource_booking_service.get_booking(
        db,
        organization_id=current_user["organization_id"],
        booking_id=booking_id,
    )
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )
    return booking


@router.post(
    "/bookings",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_booking(
    body: BookingCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Book a resource. Checks for time conflicts automatically."""
    try:
        return await resource_booking_service.create_booking(
            db,
            organization_id=current_user["organization_id"],
            booked_by=current_user["id"],
            data=body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: uuid.UUID,
    body: BookingUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a booking."""
    try:
        result = await resource_booking_service.update_booking(
            db,
            organization_id=current_user["organization_id"],
            booking_id=booking_id,
            data=body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )
    return result


@router.delete(
    "/bookings/{booking_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_booking(
    booking_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.resources.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a booking."""
    deleted = await resource_booking_service.delete_booking(
        db,
        organization_id=current_user["organization_id"],
        booking_id=booking_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )
