"""
Camp Connect - Budget API Endpoints
Full CRUD for budget tracking: budgets, categories, and expenses.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.budget import (
    BudgetCategoryCreate,
    BudgetCategoryResponse,
    BudgetCategoryUpdate,
    BudgetCreate,
    BudgetExpenseCreate,
    BudgetExpenseResponse,
    BudgetExpenseUpdate,
    BudgetResponse,
    BudgetStats,
    BudgetUpdate,
)
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["Budgets"])


# ---------------------------------------------------------------------------
# Budget CRUD
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[BudgetResponse],
)
async def list_budgets(
    fiscal_year: Optional[int] = Query(default=None, description="Filter by fiscal year"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all budgets for the current organization."""
    return await budget_service.list_budgets(
        db,
        organization_id=current_user["organization_id"],
        fiscal_year=fiscal_year,
        is_active=is_active,
    )


@router.get(
    "/{budget_id}",
    response_model=BudgetResponse,
)
async def get_budget(
    budget_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single budget by ID."""
    budget = await budget_service.get_budget(
        db,
        organization_id=current_user["organization_id"],
        budget_id=budget_id,
    )
    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )
    return budget


@router.post(
    "",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_budget(
    body: BudgetCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new budget."""
    return await budget_service.create_budget(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{budget_id}",
    response_model=BudgetResponse,
)
async def update_budget(
    budget_id: uuid.UUID,
    body: BudgetUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a budget."""
    result = await budget_service.update_budget(
        db,
        organization_id=current_user["organization_id"],
        budget_id=budget_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )
    return result


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_budget(
    budget_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) a budget."""
    deleted = await budget_service.delete_budget(
        db,
        organization_id=current_user["organization_id"],
        budget_id=budget_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )


# ---------------------------------------------------------------------------
# Category CRUD
# ---------------------------------------------------------------------------


@router.get(
    "/{budget_id}/categories",
    response_model=List[BudgetCategoryResponse],
)
async def list_categories(
    budget_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List categories for a budget."""
    return await budget_service.list_categories(
        db,
        organization_id=current_user["organization_id"],
        budget_id=budget_id,
    )


@router.post(
    "/{budget_id}/categories",
    response_model=BudgetCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    budget_id: uuid.UUID,
    body: BudgetCategoryCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new budget category."""
    result = await budget_service.create_category(
        db,
        organization_id=current_user["organization_id"],
        budget_id=budget_id,
        data=body.model_dump(),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )
    return result


@router.put(
    "/categories/{category_id}",
    response_model=BudgetCategoryResponse,
)
async def update_category(
    category_id: uuid.UUID,
    body: BudgetCategoryUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a budget category."""
    result = await budget_service.update_category(
        db,
        organization_id=current_user["organization_id"],
        category_id=category_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return result


@router.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_category(
    category_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a budget category and all its expenses."""
    deleted = await budget_service.delete_category(
        db,
        organization_id=current_user["organization_id"],
        category_id=category_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )


# ---------------------------------------------------------------------------
# Expense CRUD
# ---------------------------------------------------------------------------


@router.get(
    "/{budget_id}/expenses",
    response_model=List[BudgetExpenseResponse],
)
async def list_expenses(
    budget_id: uuid.UUID,
    category_id: Optional[uuid.UUID] = Query(default=None, description="Filter by category"),
    expense_status: Optional[str] = Query(
        default=None, alias="status", description="Filter by status (pending, approved, rejected)"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List expenses for a budget."""
    return await budget_service.list_expenses(
        db,
        organization_id=current_user["organization_id"],
        budget_id=budget_id,
        category_id=category_id,
        status=expense_status,
    )


@router.post(
    "/{budget_id}/expenses",
    response_model=BudgetExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_expense(
    budget_id: uuid.UUID,
    body: BudgetExpenseCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new expense."""
    result = await budget_service.create_expense(
        db,
        organization_id=current_user["organization_id"],
        budget_id=budget_id,
        data=body.model_dump(),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category or budget not found",
        )
    return result


@router.put(
    "/expenses/{expense_id}",
    response_model=BudgetExpenseResponse,
)
async def update_expense(
    expense_id: uuid.UUID,
    body: BudgetExpenseUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an expense."""
    result = await budget_service.update_expense(
        db,
        organization_id=current_user["organization_id"],
        expense_id=expense_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )
    return result


@router.delete(
    "/expenses/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_expense(
    expense_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete an expense."""
    deleted = await budget_service.delete_expense(
        db,
        organization_id=current_user["organization_id"],
        expense_id=expense_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


@router.get(
    "/{budget_id}/stats",
    response_model=BudgetStats,
)
async def get_budget_stats(
    budget_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.budgets.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated statistics for a budget."""
    stats = await budget_service.get_budget_stats(
        db,
        organization_id=current_user["organization_id"],
        budget_id=budget_id,
    )
    if stats is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )
    return stats
