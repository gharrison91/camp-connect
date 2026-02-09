"""
Camp Connect - Store Service
CRUD operations for store items, spending accounts, and purchase workflow.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.store import StoreItem, SpendingAccount, StoreTransaction


# ── Store Items ────────────────────────────────────────────────────────────

async def list_items(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    category: str | None = None,
    is_active: bool | None = None,
) -> list[dict]:
    """List store items, optionally filtered by category and active status."""
    stmt = select(StoreItem).where(StoreItem.organization_id == organization_id)
    if category is not None:
        stmt = stmt.where(StoreItem.category == category)
    if is_active is not None:
        stmt = stmt.where(StoreItem.is_active == is_active)
    stmt = stmt.order_by(StoreItem.name)

    result = await db.execute(stmt)
    items = result.scalars().all()
    return [_item_to_dict(i) for i in items]


async def get_item(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    item_id: uuid.UUID,
) -> dict:
    """Get a single store item by ID."""
    stmt = select(StoreItem).where(
        StoreItem.id == item_id,
        StoreItem.organization_id == organization_id,
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store item not found.",
        )
    return _item_to_dict(item)


async def create_item(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: dict,
) -> dict:
    """Create a new store item."""
    item = StoreItem(organization_id=organization_id, **data)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _item_to_dict(item)


async def update_item(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    item_id: uuid.UUID,
    data: dict,
) -> dict:
    """Update an existing store item."""
    stmt = select(StoreItem).where(
        StoreItem.id == item_id,
        StoreItem.organization_id == organization_id,
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store item not found.",
        )
    for key, value in data.items():
        if value is not None:
            setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return _item_to_dict(item)


async def delete_item(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    item_id: uuid.UUID,
) -> dict:
    """Hard-delete a store item (no soft-delete mixin on StoreItem)."""
    stmt = select(StoreItem).where(
        StoreItem.id == item_id,
        StoreItem.organization_id == organization_id,
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store item not found.",
        )
    await db.delete(item)
    await db.commit()
    return {"detail": "Store item deleted."}


def _item_to_dict(item: StoreItem) -> dict:
    return {
        "id": item.id,
        "organization_id": item.organization_id,
        "name": item.name,
        "description": item.description,
        "category": item.category,
        "price": item.price,
        "quantity_in_stock": item.quantity_in_stock,
        "image_url": item.image_url,
        "is_active": item.is_active,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


# ── Spending Accounts ─────────────────────────────────────────────────────

async def get_spending_account(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
) -> dict:
    """Get or create a spending account for a camper."""
    stmt = select(SpendingAccount).where(
        SpendingAccount.organization_id == organization_id,
        SpendingAccount.camper_id == camper_id,
    )
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()

    if account is None:
        account = SpendingAccount(
            organization_id=organization_id,
            camper_id=camper_id,
            balance=Decimal("0.00"),
        )
        db.add(account)
        await db.commit()
        await db.refresh(account)

    return _account_to_dict(account)


async def update_spending_account(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
    data: dict,
) -> dict:
    """Update a camper's spending account balance and/or daily limit."""
    stmt = select(SpendingAccount).where(
        SpendingAccount.organization_id == organization_id,
        SpendingAccount.camper_id == camper_id,
    )
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()

    if account is None:
        # Auto-create if it doesn't exist
        account = SpendingAccount(
            organization_id=organization_id,
            camper_id=camper_id,
            balance=Decimal("0.00"),
        )
        db.add(account)
        await db.flush()

    for key, value in data.items():
        if value is not None:
            setattr(account, key, value)
    await db.commit()
    await db.refresh(account)
    return _account_to_dict(account)


def _account_to_dict(account: SpendingAccount) -> dict:
    return {
        "id": account.id,
        "organization_id": account.organization_id,
        "camper_id": account.camper_id,
        "balance": account.balance,
        "daily_limit": account.daily_limit,
        "created_at": account.created_at,
        "updated_at": account.updated_at,
    }


# ── Purchase Workflow ──────────────────────────────────────────────────────

async def purchase_item(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
    item_id: uuid.UUID,
    quantity: int = 1,
    recorded_by: uuid.UUID | None = None,
) -> dict:
    """
    Execute a camp store purchase.
    Validates: item exists & active, sufficient stock, camper has enough
    balance, daily spending limit not exceeded.
    Deducts balance, decrements stock, creates StoreTransaction.
    """
    # 1. Fetch item
    item_stmt = select(StoreItem).where(
        StoreItem.id == item_id,
        StoreItem.organization_id == organization_id,
    )
    item_result = await db.execute(item_stmt)
    item = item_result.scalar_one_or_none()
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store item not found.",
        )
    if not item.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store item is not active.",
        )
    if item.quantity_in_stock < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock.",
        )

    total_cost = item.price * quantity

    # 2. Fetch or create spending account
    acct_stmt = select(SpendingAccount).where(
        SpendingAccount.organization_id == organization_id,
        SpendingAccount.camper_id == camper_id,
    )
    acct_result = await db.execute(acct_stmt)
    account = acct_result.scalar_one_or_none()
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spending account not found for this camper.",
        )

    # 3. Balance check
    if account.balance < total_cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance.",
        )

    # 4. Daily limit check
    if account.daily_limit is not None:
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        daily_stmt = (
            select(func.coalesce(func.sum(StoreTransaction.total), 0))
            .where(
                StoreTransaction.organization_id == organization_id,
                StoreTransaction.camper_id == camper_id,
                StoreTransaction.transaction_date >= today_start,
            )
        )
        daily_result = await db.execute(daily_stmt)
        spent_today = daily_result.scalar() or Decimal("0.00")
        if spent_today + total_cost > account.daily_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Daily spending limit would be exceeded.",
            )

    # 5. Deduct balance and decrement stock
    account.balance -= total_cost
    item.quantity_in_stock -= quantity

    # 6. Create transaction record
    txn = StoreTransaction(
        organization_id=organization_id,
        camper_id=camper_id,
        item_id=item_id,
        quantity=quantity,
        unit_price=item.price,
        total=total_cost,
        recorded_by=recorded_by,
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)
    return _txn_to_dict(txn)


# ── Transactions ───────────────────────────────────────────────────────────

async def list_transactions(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID | None = None,
) -> list[dict]:
    """List store transactions, optionally filtered by camper."""
    stmt = (
        select(StoreTransaction)
        .where(StoreTransaction.organization_id == organization_id)
        .order_by(StoreTransaction.transaction_date.desc())
    )
    if camper_id is not None:
        stmt = stmt.where(StoreTransaction.camper_id == camper_id)

    result = await db.execute(stmt)
    transactions = result.scalars().all()
    return [_txn_to_dict(t) for t in transactions]


def _txn_to_dict(txn: StoreTransaction) -> dict:
    return {
        "id": txn.id,
        "organization_id": txn.organization_id,
        "camper_id": txn.camper_id,
        "item_id": txn.item_id,
        "quantity": txn.quantity,
        "unit_price": txn.unit_price,
        "total": txn.total,
        "transaction_date": txn.transaction_date,
        "recorded_by": txn.recorded_by,
        "created_at": txn.created_at,
        "updated_at": txn.updated_at,
    }
