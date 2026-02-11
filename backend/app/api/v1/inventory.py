"""
Camp Connect - Inventory API Endpoints
Full CRUD for inventory items, checkouts, and stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.inventory import (
    BulkQuantityUpdate,
    CheckoutCreate,
    CheckoutRecord,
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
    InventoryStats,
)
from app.services import inventory_service

router = APIRouter(prefix="/inventory", tags=["Inventory"])


# ---------------------------------------------------------------------------
# Items CRUD
# ---------------------------------------------------------------------------


@router.get(
    "/items",
    response_model=List[InventoryItemResponse],
)
async def list_items(
    category: Optional[str] = Query(
        default=None,
        description="Filter by category (sports, arts, kitchen, medical, maintenance, office, other)",
    ),
    search: Optional[str] = Query(default=None, description="Search by item name"),
    low_stock: Optional[bool] = Query(
        default=None, description="Only show items below min_quantity"
    ),
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all inventory items for the current organization."""
    return await inventory_service.get_items(
        org_id=current_user["organization_id"],
        category=category,
        search=search,
        low_stock_only=low_stock or False,
    )


@router.post(
    "/items",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    body: InventoryItemCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new inventory item."""
    return await inventory_service.create_item(
        org_id=current_user["organization_id"],
        data=body.model_dump(exclude_none=True),
    )


@router.get(
    "/items/{item_id}",
    response_model=InventoryItemResponse,
)
async def get_item(
    item_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single inventory item by ID."""
    item = await inventory_service.get_item(
        org_id=current_user["organization_id"],
        item_id=item_id,
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )
    return item


@router.put(
    "/items/{item_id}",
    response_model=InventoryItemResponse,
)
async def update_item(
    item_id: uuid.UUID,
    body: InventoryItemUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing inventory item."""
    item = await inventory_service.update_item(
        org_id=current_user["organization_id"],
        item_id=item_id,
        data=body.model_dump(exclude_none=True),
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )
    return item


@router.delete(
    "/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_item(
    item_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Delete an inventory item."""
    deleted = await inventory_service.delete_item(
        org_id=current_user["organization_id"],
        item_id=item_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )


# ---------------------------------------------------------------------------
# Checkout / Return
# ---------------------------------------------------------------------------


@router.post(
    "/items/{item_id}/checkout",
    response_model=CheckoutRecord,
    status_code=status.HTTP_201_CREATED,
)
async def checkout_item(
    item_id: uuid.UUID,
    body: CheckoutCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Check out quantity of an inventory item."""
    checkout = await inventory_service.checkout_item(
        org_id=current_user["organization_id"],
        item_id=item_id,
        quantity=body.quantity,
        checked_out_by=body.checked_out_by,
        checked_out_to=body.checked_out_to,
        expected_return=body.expected_return,
    )
    if checkout is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot checkout: item not found or insufficient quantity",
        )
    return checkout


@router.post(
    "/checkouts/{checkout_id}/return",
    response_model=CheckoutRecord,
)
async def return_item(
    checkout_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Return a checked-out item."""
    checkout = await inventory_service.return_item(
        org_id=current_user["organization_id"],
        checkout_id=checkout_id,
    )
    if checkout is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checkout record not found or already returned",
        )
    return checkout


@router.get(
    "/checkouts",
    response_model=List[CheckoutRecord],
)
async def list_checkouts(
    checkout_status: Optional[str] = Query(
        default=None,
        alias="status",
        description="Filter by status (out, returned, overdue)",
    ),
    item_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by item ID"
    ),
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """List checkout records with optional filters."""
    return await inventory_service.get_checkouts(
        org_id=current_user["organization_id"],
        status=checkout_status,
        item_id=item_id,
    )


# ---------------------------------------------------------------------------
# Aggregations
# ---------------------------------------------------------------------------


@router.get(
    "/low-stock",
    response_model=List[InventoryItemResponse],
)
async def low_stock_items(
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get inventory items that are below their minimum quantity threshold."""
    return await inventory_service.get_low_stock_items(
        org_id=current_user["organization_id"],
    )


@router.get(
    "/stats",
    response_model=InventoryStats,
)
async def inventory_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate inventory statistics."""
    return await inventory_service.get_inventory_stats(
        org_id=current_user["organization_id"],
    )


@router.post(
    "/bulk-update",
    response_model=List[InventoryItemResponse],
)
async def bulk_update(
    body: BulkQuantityUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Bulk update quantities for multiple inventory items."""
    items_data = [{"id": item.id, "quantity": item.quantity} for item in body.items]
    return await inventory_service.bulk_update_quantities(
        org_id=current_user["organization_id"],
        items=items_data,
    )
