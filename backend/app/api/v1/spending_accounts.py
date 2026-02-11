"""
Camp Connect - Spending Accounts API Router
CRUD for camper spending accounts and transactions.
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.spending_account import (
    SpendingAccountCreate,
    SpendingAccountResponse,
    SpendingSummaryResponse,
    SpendingTransactionCreate,
    SpendingTransactionResponse,
)
from app.services import spending_service

router = APIRouter(prefix="/spending-accounts", tags=["Spending Accounts"])


# ---------------------------------------------------------------------------
# Accounts
# ---------------------------------------------------------------------------


@router.get("", response_model=List[SpendingAccountResponse])
async def list_accounts(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: Dict[str, Any] = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """List all spending accounts for the organization."""
    return await spending_service.get_accounts(
        current_user["organization_id"],
        search=search,
        status=status_filter,
    )


@router.post("", response_model=SpendingAccountResponse, status_code=201)
async def create_account(
    body: SpendingAccountCreate,
    current_user: Dict[str, Any] = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new spending account for a camper."""
    data = body.model_dump()
    data["staff_name"] = current_user.get("name", "Staff")
    return await spending_service.create_account(
        current_user["organization_id"],
        data=data,
    )


@router.get("/summary", response_model=SpendingSummaryResponse)
async def get_summary(
    current_user: Dict[str, Any] = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard summary stats for spending accounts."""
    return await spending_service.get_summary(current_user["organization_id"])


@router.get("/{account_id}", response_model=SpendingAccountResponse)
async def get_account(
    account_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single spending account."""
    result = await spending_service.get_account(
        current_user["organization_id"],
        account_id=account_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spending account not found.",
        )
    return result


@router.get("/{account_id}/transactions")
async def get_account_transactions(
    account_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Get transactions for a specific account."""
    return await spending_service.get_transactions(
        current_user["organization_id"],
        account_id=account_id,
        page=page,
        per_page=per_page,
    )


@router.post(
    "/{account_id}/transactions",
    response_model=SpendingTransactionResponse,
    status_code=201,
)
async def add_transaction(
    account_id: uuid.UUID,
    body: SpendingTransactionCreate,
    current_user: Dict[str, Any] = Depends(require_permission("store.manage.manage")),
    db: AsyncSession = Depends(get_db),
):
    """Add a transaction (deposit, purchase, refund, adjustment) to an account."""
    try:
        return await spending_service.add_transaction(
            current_user["organization_id"],
            account_id=account_id,
            data=body.model_dump(),
            staff_name=current_user.get("name", "Staff"),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
