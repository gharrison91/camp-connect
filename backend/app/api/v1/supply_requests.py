"""
Camp Connect - Supply Requests API Endpoints
CRUD, approval workflow, and stats for supply requests.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.supply_request import (
    SupplyRequestCreate,
    SupplyRequestResponse,
    SupplyRequestUpdate,
    SupplyStats,
)
from app.services import supply_request_service

router = APIRouter(prefix="/supply-requests", tags=["Supply Requests"])


# ---------------------------------------------------------------------------
# Stats (must be before /{id} to avoid route conflict)
# ---------------------------------------------------------------------------


@router.get(
    "/stats",
    response_model=SupplyStats,
)
async def get_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get supply request statistics for the organization."""
    return await supply_request_service.get_supply_stats(
        db, org_id=current_user["organization_id"],
    )


# ---------------------------------------------------------------------------
# List / Create
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[SupplyRequestResponse],
)
async def list_supply_requests(
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        description="Filter by status",
    ),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    priority: Optional[str] = Query(default=None, description="Filter by priority"),
    search: Optional[str] = Query(default=None, description="Search title/description"),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all supply requests for the current organization."""
    return await supply_request_service.get_supply_requests(
        db,
        org_id=current_user["organization_id"],
        status=status_filter,
        category=category,
        priority=priority,
        search=search,
    )


@router.post(
    "",
    response_model=SupplyRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_supply_request(
    body: SupplyRequestCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new supply request."""
    data = body.model_dump()
    # Default requested_by to the current user name if not provided
    if not data.get("requested_by"):
        first = current_user.get("first_name", "")
        last = current_user.get("last_name", "")
        data["requested_by"] = f"{first} {last}".strip() or current_user.get("email", "Unknown")
    return await supply_request_service.create_supply_request(
        db,
        org_id=current_user["organization_id"],
        data=data,
    )


# ---------------------------------------------------------------------------
# Single item CRUD
# ---------------------------------------------------------------------------


@router.get(
    "/{request_id}",
    response_model=SupplyRequestResponse,
)
async def get_supply_request(
    request_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single supply request by ID."""
    item = await supply_request_service.get_supply_request(
        db, org_id=current_user["organization_id"], request_id=request_id,
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supply request not found")
    return item


@router.put(
    "/{request_id}",
    response_model=SupplyRequestResponse,
)
async def update_supply_request(
    request_id: uuid.UUID,
    body: SupplyRequestUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update a supply request."""
    item = await supply_request_service.update_supply_request(
        db,
        org_id=current_user["organization_id"],
        request_id=request_id,
        data=body.model_dump(exclude_unset=True),
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supply request not found")
    return item


@router.delete(
    "/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_supply_request(
    request_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a supply request."""
    deleted = await supply_request_service.delete_supply_request(
        db, org_id=current_user["organization_id"], request_id=request_id,
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supply request not found")


# ---------------------------------------------------------------------------
# Approve / Reject workflow
# ---------------------------------------------------------------------------


@router.post(
    "/{request_id}/approve",
    response_model=SupplyRequestResponse,
)
async def approve_request(
    request_id: uuid.UUID,
    notes: Optional[str] = Query(default=None, description="Approval notes"),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Approve a pending supply request."""
    first = current_user.get("first_name", "")
    last = current_user.get("last_name", "")
    approved_by = f"{first} {last}".strip() or current_user.get("email", "Unknown")

    item = await supply_request_service.approve_supply_request(
        db,
        org_id=current_user["organization_id"],
        request_id=request_id,
        approved_by=approved_by,
        notes=notes,
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supply request not found or is not in pending status",
        )
    return item


@router.post(
    "/{request_id}/reject",
    response_model=SupplyRequestResponse,
)
async def reject_request(
    request_id: uuid.UUID,
    notes: Optional[str] = Query(default=None, description="Rejection reason"),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Reject a pending supply request."""
    first = current_user.get("first_name", "")
    last = current_user.get("last_name", "")
    rejected_by = f"{first} {last}".strip() or current_user.get("email", "Unknown")

    item = await supply_request_service.reject_supply_request(
        db,
        org_id=current_user["organization_id"],
        request_id=request_id,
        rejected_by=rejected_by,
        notes=notes,
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supply request not found or is not in pending status",
        )
    return item
