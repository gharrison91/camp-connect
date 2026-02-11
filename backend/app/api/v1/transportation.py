"""
Camp Connect - Transportation API Endpoints
Full CRUD for vehicles and routes.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.transportation import (
    RouteCreate,
    RouteResponse,
    RouteStop,
    RouteUpdate,
    TransportationStats,
    VehicleCreate,
    VehicleResponse,
    VehicleUpdate,
)
from app.services import transportation_service

router = APIRouter(prefix="/transportation", tags=["Transportation"])


# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------


@router.get(
    "/vehicles",
    response_model=List[VehicleResponse],
)
async def list_vehicles(
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by vehicle status"
    ),
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all vehicles for the current organization."""
    return await transportation_service.get_vehicles(
        current_user["organization_id"],
        status=status_filter,
    )


@router.get(
    "/vehicles/{vehicle_id}",
    response_model=VehicleResponse,
)
async def get_vehicle(
    vehicle_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single vehicle by ID."""
    vehicle = await transportation_service.get_vehicle(
        current_user["organization_id"], vehicle_id
    )
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    return vehicle


@router.post(
    "/vehicles",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_vehicle(
    body: VehicleCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new vehicle."""
    return await transportation_service.create_vehicle(
        current_user["organization_id"],
        body.model_dump(),
    )


@router.put(
    "/vehicles/{vehicle_id}",
    response_model=VehicleResponse,
)
async def update_vehicle(
    vehicle_id: uuid.UUID,
    body: VehicleUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update a vehicle."""
    vehicle = await transportation_service.update_vehicle(
        current_user["organization_id"],
        vehicle_id,
        body.model_dump(exclude_unset=True),
    )
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    return vehicle


@router.delete(
    "/vehicles/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_vehicle(
    vehicle_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a vehicle."""
    deleted = await transportation_service.delete_vehicle(
        current_user["organization_id"], vehicle_id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )
    return None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get(
    "/routes",
    response_model=List[RouteResponse],
)
async def list_routes(
    route_date: Optional[str] = Query(default=None, alias="date", description="Filter by date (YYYY-MM-DD)"),
    route_type: Optional[str] = Query(default=None, description="Filter by route type"),
    vehicle_id: Optional[str] = Query(default=None, description="Filter by vehicle ID"),
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all routes for the current organization."""
    return await transportation_service.get_routes(
        current_user["organization_id"],
        route_date=route_date,
        route_type=route_type,
        vehicle_id=vehicle_id,
    )


@router.get(
    "/routes/{route_id}",
    response_model=RouteResponse,
)
async def get_route(
    route_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single route by ID."""
    route = await transportation_service.get_route(
        current_user["organization_id"], route_id
    )
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
        )
    return route


@router.post(
    "/routes",
    response_model=RouteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_route(
    body: RouteCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new route."""
    return await transportation_service.create_route(
        current_user["organization_id"],
        body.model_dump(),
    )


@router.put(
    "/routes/{route_id}",
    response_model=RouteResponse,
)
async def update_route(
    route_id: uuid.UUID,
    body: RouteUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update a route."""
    route = await transportation_service.update_route(
        current_user["organization_id"],
        route_id,
        body.model_dump(exclude_unset=True),
    )
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
        )
    return route


@router.delete(
    "/routes/{route_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_route(
    route_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a route."""
    deleted = await transportation_service.delete_route(
        current_user["organization_id"], route_id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
        )
    return None


# ---------------------------------------------------------------------------
# Route Stops
# ---------------------------------------------------------------------------


@router.get(
    "/routes/{route_id}/stops",
    response_model=RouteResponse,
)
async def get_route_stops(
    route_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a route with all stop details."""
    route = await transportation_service.get_route_with_stops(
        current_user["organization_id"], route_id
    )
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
        )
    return route


@router.post(
    "/routes/{route_id}/stops/{stop_order}/assign",
    response_model=RouteResponse,
)
async def assign_campers_to_stop(
    route_id: uuid.UUID,
    stop_order: int,
    camper_ids: List[uuid.UUID],
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Assign campers to a specific stop on a route."""
    route = await transportation_service.assign_campers_to_stop(
        current_user["organization_id"],
        route_id,
        stop_order,
        camper_ids,
    )
    if route is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route or stop not found",
        )
    return route


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


@router.get(
    "/stats",
    response_model=TransportationStats,
)
async def get_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get transportation dashboard statistics."""
    return await transportation_service.get_transportation_stats(
        current_user["organization_id"]
    )


# ---------------------------------------------------------------------------
# Camper Routes
# ---------------------------------------------------------------------------


@router.get(
    "/campers/{camper_id}/routes",
    response_model=List[RouteResponse],
)
async def get_camper_routes(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all routes a camper is assigned to."""
    return await transportation_service.get_camper_routes(
        current_user["organization_id"], camper_id
    )
