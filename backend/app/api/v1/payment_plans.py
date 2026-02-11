"""
Camp Connect - Payment Plan API Endpoints
Manage payment plans and installments.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.payment_plan import (
    PaymentPlanCreate,
    PaymentPlanResponse,
    PaymentPlanUpdate,
)
from app.services import payment_plan_service

router = APIRouter(prefix="/payment-plans", tags=["Payment Plans"])


@router.get(
    "",
    response_model=List[PaymentPlanResponse],
)
async def list_plans(
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by plan status"
    ),
    contact_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by contact"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List payment plans with optional filters."""
    return await payment_plan_service.list_plans(
        db,
        organization_id=current_user["organization_id"],
        status=status_filter,
        contact_id=contact_id,
    )


@router.get(
    "/{plan_id}",
    response_model=PaymentPlanResponse,
)
async def get_plan(
    plan_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single payment plan with its installments."""
    result = await payment_plan_service.get_plan(
        db,
        organization_id=current_user["organization_id"],
        plan_id=plan_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment plan not found",
        )
    return result


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=PaymentPlanResponse,
)
async def create_plan(
    body: PaymentPlanCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new payment plan (auto-generates installments)."""
    return await payment_plan_service.create_plan(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{plan_id}",
    response_model=PaymentPlanResponse,
)
async def update_plan(
    plan_id: uuid.UUID,
    body: PaymentPlanUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a payment plan."""
    result = await payment_plan_service.update_plan(
        db,
        organization_id=current_user["organization_id"],
        plan_id=plan_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment plan not found",
        )
    return result


@router.post(
    "/{plan_id}/installments/{installment_id}/mark-paid",
    response_model=PaymentPlanResponse,
)
async def mark_installment_paid(
    plan_id: uuid.UUID,
    installment_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.transactions.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single installment as paid."""
    result = await payment_plan_service.mark_installment_paid(
        db,
        organization_id=current_user["organization_id"],
        plan_id=plan_id,
        installment_id=installment_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment plan or installment not found",
        )
    return result
