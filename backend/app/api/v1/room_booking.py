"""
Camp Connect - Room Booking API Endpoints
Full CRUD for rooms/spaces and their bookings.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.room_booking import (
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    RoomBookingStats,
    RoomCreate,
    RoomResponse,
    RoomUpdate,
)
from app.services import room_booking_service

router = APIRouter(prefix="/room-booking", tags=["Room Booking"])


# -----------------------------------------------------------------------
# Room endpoints
# -----------------------------------------------------------------------


@router.get("/rooms", response_model=List[RoomResponse])
async def list_rooms(
    search: Optional[str] = Query(default=None, description="Search rooms by name"),
    room_type: Optional[str] = Query(default=None, description="Filter by room type"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.rooms.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all rooms for the current organization."""
    return await room_booking_service.list_rooms(
        db,
        org_id=current_user["organization_id"],
        room_type=room_type,
        is_active=is_active,
        search=search,
    )


@router.post("/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    body: RoomCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.rooms.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new room/space."""
    return await room_booking_service.create_room(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put("/rooms/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: uuid.UUID,
    body: RoomUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.rooms.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing room."""
    result = await room_booking_service.update_room(
        db,
        org_id=current_user["organization_id"],
        room_id=room_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )
    return result


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.rooms.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a room and all its bookings."""
    deleted = await room_booking_service.delete_room(
        db,
        org_id=current_user["organization_id"],
        room_id=room_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )


# -----------------------------------------------------------------------
# Booking endpoints
# -----------------------------------------------------------------------


@router.get("/bookings", response_model=List[BookingResponse])
async def list_bookings(
    room_id: Optional[uuid.UUID] = Query(default=None, description="Filter by room"),
    booking_status: Optional[str] = Query(
        default=None, alias="status", description="Filter by status"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.rooms.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all bookings for the current organization."""
    return await room_booking_service.list_bookings(
        db,
        org_id=current_user["organization_id"],
        room_id=room_id,
        status=booking_status,
    )


@router.post(
    "/bookings",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_booking(
    body: BookingCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.rooms.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new room booking."""
    try:
        return await room_booking_service.create_booking(
            db,
            org_id=current_user["organization_id"],
            data=body.model_dump(),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.put("/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: uuid.UUID,
    body: BookingUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.rooms.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing booking."""
    try:
        result = await room_booking_service.update_booking(
            db,
            org_id=current_user["organization_id"],
            booking_id=booking_id,
            data=body.model_dump(exclude_unset=True),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )
    return result


@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(
    booking_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.rooms.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a booking."""
    deleted = await room_booking_service.delete_booking(
        db,
        org_id=current_user["organization_id"],
        booking_id=booking_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )


# -----------------------------------------------------------------------
# Stats
# -----------------------------------------------------------------------


@router.get("/stats", response_model=RoomBookingStats)
async def get_stats(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.rooms.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated room booking statistics."""
    return await room_booking_service.get_stats(
        db, org_id=current_user["organization_id"]
    )
