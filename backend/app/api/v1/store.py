"""
Camp Connect - Store API Router
CRUD for store items, spending accounts, purchases, and transaction history.
"""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.store import (
    StoreItemCreate,
    StoreItemUpdate,
    StoreItemResponse,
    SpendingAccountResponse,
    SpendingAccountUpdate,
    PurchaseRequest,
    StoreTransactionResponse,
)
from app.services import store_service

router = APIRouter(prefix="/store", tags=["Store"])


# ── Store Items ────────────────────────────────────────────────────────────

@router.get("/items", response_model=list[StoreItemResponse])
async def list_items(
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """List store items with optional filters."""
    return await store_service.list_items(
        db,
        organization_id=user["organization_id"],
        category=category,
        is_active=is_active,
    )


@router.get("/items/{item_id}", response_model=StoreItemResponse)
async def get_item(
    item_id: uuid.UUID,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single store item."""
    return await store_service.get_item(
        db,
        organization_id=user["organization_id"],
        item_id=item_id,
    )


@router.post("/items", response_model=StoreItemResponse, status_code=201)
async def create_item(
    body: StoreItemCreate,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new store item."""
    return await store_service.create_item(
        db,
        organization_id=user["organization_id"],
        data=body.model_dump(),
    )


@router.put("/items/{item_id}", response_model=StoreItemResponse)
async def update_item(
    item_id: uuid.UUID,
    body: StoreItemUpdate,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Update a store item."""
    return await store_service.update_item(
        db,
        organization_id=user["organization_id"],
        item_id=item_id,
        data=body.model_dump(exclude_unset=True),
    )


@router.delete("/items/{item_id}")
async def delete_item(
    item_id: uuid.UUID,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a store item (hard delete)."""
    return await store_service.delete_item(
        db,
        organization_id=user["organization_id"],
        item_id=item_id,
    )


# ── Spending Accounts ─────────────────────────────────────────────────────

@router.get("/accounts/{camper_id}", response_model=SpendingAccountResponse)
async def get_spending_account(
    camper_id: uuid.UUID,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get (or auto-create) a camper's spending account."""
    return await store_service.get_spending_account(
        db,
        organization_id=user["organization_id"],
        camper_id=camper_id,
    )


@router.put("/accounts/{camper_id}", response_model=SpendingAccountResponse)
async def update_spending_account(
    camper_id: uuid.UUID,
    body: SpendingAccountUpdate,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Update a camper's spending account (balance, daily limit)."""
    return await store_service.update_spending_account(
        db,
        organization_id=user["organization_id"],
        camper_id=camper_id,
        data=body.model_dump(exclude_unset=True),
    )


# ── Purchases ──────────────────────────────────────────────────────────────

@router.post("/purchase", response_model=StoreTransactionResponse, status_code=201)
async def purchase_item(
    body: PurchaseRequest,
    user: dict = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """
    Purchase a store item for a camper.
    Validates stock, balance, and daily spending limit.
    """
    return await store_service.purchase_item(
        db,
        organization_id=user["organization_id"],
        camper_id=body.camper_id,
        item_id=body.item_id,
        quantity=body.quantity,
        recorded_by=user["id"],
    )


# ── Transactions ───────────────────────────────────────────────────────────

@router.get("/transactions", response_model=list[StoreTransactionResponse])
async def list_transactions(
    camper_id: Optional[uuid.UUID] = Query(None),
    user: dict = Depends(require_permission("store.transactions.view")),
    db: AsyncSession = Depends(get_db),
):
    """List store transactions, optionally filtered by camper."""
    return await store_service.list_transactions(
        db,
        organization_id=user["organization_id"],
        camper_id=camper_id,
    )
