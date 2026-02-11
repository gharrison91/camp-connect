"""
Camp Connect - Budget Service
Business logic for budget tracking (budgets, categories, expenses).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.budget import Budget, BudgetCategory, BudgetExpense


# ---------------------------------------------------------------------------
# Budget CRUD
# ---------------------------------------------------------------------------


async def list_budgets(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    fiscal_year: Optional[int] = None,
    is_active: Optional[bool] = None,
) -> List[Dict[str, Any]]:
    """List budgets for an organization with optional filters."""
    query = (
        select(Budget)
        .options(selectinload(Budget.categories).selectinload(BudgetCategory.expenses))
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )

    if fiscal_year is not None:
        query = query.where(Budget.fiscal_year == fiscal_year)

    if is_active is not None:
        query = query.where(Budget.is_active == is_active)

    query = query.order_by(Budget.fiscal_year.desc(), Budget.name)
    result = await db.execute(query)
    budgets = result.scalars().unique().all()

    return [_budget_to_dict(b) for b in budgets]


async def get_budget(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    budget_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single budget by ID."""
    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.categories).selectinload(BudgetCategory.expenses))
        .where(Budget.id == budget_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    budget = result.scalar_one_or_none()
    if budget is None:
        return None
    return _budget_to_dict(budget)


async def create_budget(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new budget."""
    budget = Budget(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(budget)
    await db.commit()
    await db.refresh(budget, attribute_names=["categories"])
    return _budget_to_dict(budget)


async def update_budget(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    budget_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing budget."""
    result = await db.execute(
        select(Budget)
        .options(selectinload(Budget.categories).selectinload(BudgetCategory.expenses))
        .where(Budget.id == budget_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    budget = result.scalar_one_or_none()
    if budget is None:
        return None

    for key, value in data.items():
        setattr(budget, key, value)

    await db.commit()
    await db.refresh(budget, attribute_names=["categories"])
    return _budget_to_dict(budget)


async def delete_budget(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    budget_id: uuid.UUID,
) -> bool:
    """Soft-delete a budget."""
    result = await db.execute(
        select(Budget)
        .where(Budget.id == budget_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    budget = result.scalar_one_or_none()
    if budget is None:
        return False

    budget.is_deleted = True
    budget.deleted_at = datetime.utcnow()
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Category CRUD
# ---------------------------------------------------------------------------


async def list_categories(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    budget_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List categories for a budget."""
    # Verify budget belongs to org
    budget_check = await db.execute(
        select(Budget.id)
        .where(Budget.id == budget_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    if budget_check.scalar_one_or_none() is None:
        return []

    result = await db.execute(
        select(BudgetCategory)
        .options(selectinload(BudgetCategory.expenses))
        .where(BudgetCategory.budget_id == budget_id)
        .order_by(BudgetCategory.name)
    )
    categories = result.scalars().unique().all()
    return [_category_to_dict(c) for c in categories]


async def create_category(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    budget_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Create a new budget category."""
    # Verify budget belongs to org
    budget_check = await db.execute(
        select(Budget.id)
        .where(Budget.id == budget_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    if budget_check.scalar_one_or_none() is None:
        return None

    category = BudgetCategory(
        id=uuid.uuid4(),
        budget_id=budget_id,
        **data,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category, attribute_names=["expenses"])
    return _category_to_dict(category)


async def update_category(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    category_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing budget category."""
    result = await db.execute(
        select(BudgetCategory)
        .options(selectinload(BudgetCategory.expenses))
        .join(Budget, BudgetCategory.budget_id == Budget.id)
        .where(BudgetCategory.id == category_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    category = result.scalar_one_or_none()
    if category is None:
        return None

    for key, value in data.items():
        setattr(category, key, value)

    await db.commit()
    await db.refresh(category, attribute_names=["expenses"])
    return _category_to_dict(category)


async def delete_category(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    category_id: uuid.UUID,
) -> bool:
    """Delete a budget category (hard delete, cascades to expenses)."""
    result = await db.execute(
        select(BudgetCategory)
        .join(Budget, BudgetCategory.budget_id == Budget.id)
        .where(BudgetCategory.id == category_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    category = result.scalar_one_or_none()
    if category is None:
        return False

    await db.delete(category)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Expense CRUD
# ---------------------------------------------------------------------------


async def list_expenses(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    budget_id: uuid.UUID,
    category_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List expenses for a budget with optional filters."""
    query = (
        select(BudgetExpense)
        .join(BudgetCategory, BudgetExpense.category_id == BudgetCategory.id)
        .join(Budget, BudgetCategory.budget_id == Budget.id)
        .where(Budget.id == budget_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )

    if category_id is not None:
        query = query.where(BudgetExpense.category_id == category_id)

    if status is not None:
        query = query.where(BudgetExpense.status == status)

    query = query.order_by(BudgetExpense.date.desc())
    result = await db.execute(query)
    expenses = result.scalars().all()

    # Need category names - load them
    cat_ids = {e.category_id for e in expenses}
    cat_names: Dict[uuid.UUID, str] = {}
    if cat_ids:
        cat_result = await db.execute(
            select(BudgetCategory.id, BudgetCategory.name)
            .where(BudgetCategory.id.in_(cat_ids))
        )
        for row in cat_result:
            cat_names[row[0]] = row[1]

    return [_expense_to_dict(e, cat_names.get(e.category_id, "")) for e in expenses]


async def create_expense(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    budget_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Create a new expense."""
    # Verify category belongs to budget and budget belongs to org
    cat_id = data.get("category_id")
    cat_check = await db.execute(
        select(BudgetCategory)
        .join(Budget, BudgetCategory.budget_id == Budget.id)
        .where(BudgetCategory.id == cat_id)
        .where(Budget.id == budget_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    category = cat_check.scalar_one_or_none()
    if category is None:
        return None

    expense = BudgetExpense(
        id=uuid.uuid4(),
        **data,
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return _expense_to_dict(expense, category.name)


async def update_expense(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    expense_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing expense."""
    result = await db.execute(
        select(BudgetExpense)
        .join(BudgetCategory, BudgetExpense.category_id == BudgetCategory.id)
        .join(Budget, BudgetCategory.budget_id == Budget.id)
        .where(BudgetExpense.id == expense_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    expense = result.scalar_one_or_none()
    if expense is None:
        return None

    for key, value in data.items():
        setattr(expense, key, value)

    await db.commit()
    await db.refresh(expense)

    # Get category name
    cat_result = await db.execute(
        select(BudgetCategory.name).where(BudgetCategory.id == expense.category_id)
    )
    cat_name = cat_result.scalar_one_or_none() or ""

    return _expense_to_dict(expense, cat_name)


async def delete_expense(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    expense_id: uuid.UUID,
) -> bool:
    """Delete an expense (hard delete)."""
    result = await db.execute(
        select(BudgetExpense)
        .join(BudgetCategory, BudgetExpense.category_id == BudgetCategory.id)
        .join(Budget, BudgetCategory.budget_id == Budget.id)
        .where(BudgetExpense.id == expense_id)
        .where(Budget.organization_id == organization_id)
        .where(Budget.deleted_at.is_(None))
    )
    expense = result.scalar_one_or_none()
    if expense is None:
        return False

    await db.delete(expense)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


async def get_budget_stats(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    budget_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get aggregated budget statistics."""
    budget = await get_budget(db, organization_id=organization_id, budget_id=budget_id)
    if budget is None:
        return None

    total_planned = sum(c["planned_amount"] for c in budget["categories"])
    total_spent = sum(c["actual_amount"] for c in budget["categories"])

    return {
        "total_budget": budget["total_budget"],
        "total_planned": total_planned,
        "total_spent": total_spent,
        "remaining": budget["total_budget"] - total_spent,
        "category_count": len(budget["categories"]),
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _budget_to_dict(budget: Budget) -> Dict[str, Any]:
    """Convert a Budget model to a response dict."""
    categories = []
    for cat in budget.categories:
        categories.append(_category_to_dict(cat))

    return {
        "id": budget.id,
        "name": budget.name,
        "fiscal_year": budget.fiscal_year,
        "total_budget": budget.total_budget,
        "notes": budget.notes,
        "is_active": budget.is_active,
        "categories": categories,
        "created_at": budget.created_at,
    }


def _category_to_dict(category: BudgetCategory) -> Dict[str, Any]:
    """Convert a BudgetCategory model to a response dict."""
    actual_amount = sum(e.amount for e in category.expenses if e.status != "rejected")
    return {
        "id": category.id,
        "budget_id": category.budget_id,
        "name": category.name,
        "planned_amount": category.planned_amount,
        "actual_amount": actual_amount,
        "notes": category.notes,
        "created_at": category.created_at,
    }


def _expense_to_dict(expense: BudgetExpense, category_name: str = "") -> Dict[str, Any]:
    """Convert a BudgetExpense model to a response dict."""
    return {
        "id": expense.id,
        "category_id": expense.category_id,
        "category_name": category_name,
        "description": expense.description,
        "amount": expense.amount,
        "date": expense.date,
        "vendor": expense.vendor,
        "receipt_url": expense.receipt_url,
        "approved_by": expense.approved_by,
        "status": expense.status,
        "created_at": expense.created_at,
    }
