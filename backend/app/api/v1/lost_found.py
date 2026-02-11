"""
Camp Connect - Lost & Found API Endpoints
CRUD, claim/unclaim workflow, and statistics.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.lost_found import (
    LostFoundStats,
    LostItem,
    LostItemCreate,
    LostItemUpdate,
)
from app.services import lost_found_service

router = APIRouter(prefix="/lost-found", tags=["Lost & Found"])


# ---------------------------------------------------------------------------
# List / Get
# ---------------------------------------------------------------------------


@router.get("", response_model=List[LostItem])
async def list_items(
    category: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all lost & found items for the organization."""
    return await lost_found_service.list_items(
        db,
        org_id=current_user["organization_id"],
        category=category,
        status=status_filter,
        search=search,
    )


@router.get("/stats", response_model=LostFoundStats)
async def get_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get lost & found statistics."""
    return await lost_found_service.get_stats(
        db, org_id=current_user["organization_id"],
    )


@router.get("/{item_id}", response_model=LostItem)
async def get_item(
    item_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single lost & found item."""
    item = await lost_found_service.get_item(
        db, org_id=current_user["organization_id"], item_id=item_id,
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


# ---------------------------------------------------------------------------
# Create / Update / Delete
# ---------------------------------------------------------------------------


@router.post("", response_model=LostItem, status_code=status.HTTP_201_CREATED)
async def create_item(
    body: LostItemCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Report a new found item."""
    return await lost_found_service.create_item(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put("/{item_id}", response_model=LostItem)
async def update_item(
    item_id: uuid.UUID,
    body: LostItemUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing lost & found item."""
    item = await lost_found_service.update_item(
        db,
        org_id=current_user["organization_id"],
        item_id=item_id,
        data=body.model_dump(exclude_unset=True),
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a lost & found item."""
    deleted = await lost_found_service.delete_item(
        db, org_id=current_user["organization_id"], item_id=item_id,
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")


# ---------------------------------------------------------------------------
# Claim / Unclaim workflow
# ---------------------------------------------------------------------------


@router.post("/{item_id}/claim", response_model=LostItem)
async def claim_item(
    item_id: uuid.UUID,
    claimed_by: str = Query(..., description="Name of person claiming the item"),
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Mark an unclaimed item as claimed."""
    item = await lost_found_service.claim_item(
        db,
        org_id=current_user["organization_id"],
        item_id=item_id,
        claimed_by=claimed_by,
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item not found or not in unclaimed status",
        )
    return item


@router.post("/{item_id}/unclaim", response_model=LostItem)
async def unclaim_item(
    item_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.campers.update")),
    db: AsyncSession = Depends(get_db),
):
    """Revert a claimed item back to unclaimed."""
    item = await lost_found_service.unclaim_item(
        db,
        org_id=current_user["organization_id"],
        item_id=item_id,
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item not found or not in claimed status",
        )
    return item
