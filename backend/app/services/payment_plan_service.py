"""
Camp Connect - Payment Plan Service
Business logic for creating and managing payment plans with installments.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.payment_plan import PaymentPlan, PaymentPlanInstallment


def _calculate_due_dates(start_date: date, num: int, frequency: str) -> List[date]:
    """Generate due dates for installments based on frequency."""
    dates = []
    current = start_date
    for _ in range(num):
        dates.append(current)
        if frequency == "weekly":
            current = current + timedelta(weeks=1)
        elif frequency == "biweekly":
            current = current + timedelta(weeks=2)
        else:  # monthly
            month = current.month + 1
            year = current.year
            if month > 12:
                month = 1
                year += 1
            day = min(current.day, 28)  # safe day for all months
            current = date(year, month, day)
    return dates


async def list_plans(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    status: Optional[str] = None,
    contact_id: Optional[uuid.UUID] = None,
) -> List[Dict[str, Any]]:
    """List payment plans with optional filters."""
    query = (
        select(PaymentPlan)
        .options(selectinload(PaymentPlan.installments))
        .where(PaymentPlan.organization_id == organization_id)
    )

    if status:
        query = query.where(PaymentPlan.status == status)
    if contact_id:
        query = query.where(PaymentPlan.contact_id == contact_id)

    query = query.order_by(PaymentPlan.created_at.desc())
    result = await db.execute(query)
    plans = result.scalars().all()

    return [_plan_to_dict(p) for p in plans]


async def get_plan(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    plan_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single payment plan with its installments."""
    result = await db.execute(
        select(PaymentPlan)
        .options(selectinload(PaymentPlan.installments))
        .where(PaymentPlan.id == plan_id)
        .where(PaymentPlan.organization_id == organization_id)
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        return None
    return _plan_to_dict(plan)


async def create_plan(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new payment plan and auto-generate installments."""
    total_amount = Decimal(str(data["total_amount"]))
    num = data["num_installments"]
    frequency = data.get("frequency", "monthly")
    start = data["start_date"]

    # Calculate installment amounts (evenly split, remainder on last)
    base_amount = (total_amount / num).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    remainder = total_amount - (base_amount * (num - 1))

    due_dates = _calculate_due_dates(start, num, frequency)

    plan = PaymentPlan(
        id=uuid.uuid4(),
        organization_id=organization_id,
        invoice_id=data.get("invoice_id"),
        contact_id=data.get("contact_id"),
        total_amount=total_amount,
        num_installments=num,
        frequency=frequency,
        start_date=start,
        status="active",
    )
    db.add(plan)
    await db.flush()

    # Generate installments
    for i in range(num):
        amount = remainder if i == num - 1 else base_amount
        inst = PaymentPlanInstallment(
            id=uuid.uuid4(),
            plan_id=plan.id,
            installment_number=i + 1,
            amount=amount,
            due_date=due_dates[i],
            status="pending",
        )
        db.add(inst)

    await db.commit()
    await db.refresh(plan)
    return _plan_to_dict(plan)


async def update_plan(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    plan_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update a payment plan (status, frequency)."""
    result = await db.execute(
        select(PaymentPlan)
        .options(selectinload(PaymentPlan.installments))
        .where(PaymentPlan.id == plan_id)
        .where(PaymentPlan.organization_id == organization_id)
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        return None

    for key, value in data.items():
        if hasattr(plan, key):
            setattr(plan, key, value)

    await db.commit()
    await db.refresh(plan)
    return _plan_to_dict(plan)


async def mark_installment_paid(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    plan_id: uuid.UUID,
    installment_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Mark a single installment as paid."""
    # Verify the plan belongs to this org
    plan_result = await db.execute(
        select(PaymentPlan)
        .options(selectinload(PaymentPlan.installments))
        .where(PaymentPlan.id == plan_id)
        .where(PaymentPlan.organization_id == organization_id)
    )
    plan = plan_result.scalar_one_or_none()
    if plan is None:
        return None

    # Find the installment
    inst_result = await db.execute(
        select(PaymentPlanInstallment)
        .where(PaymentPlanInstallment.id == installment_id)
        .where(PaymentPlanInstallment.plan_id == plan_id)
    )
    installment = inst_result.scalar_one_or_none()
    if installment is None:
        return None

    installment.status = "paid"
    installment.paid_at = datetime.utcnow()

    # Check if all installments are now paid -> mark plan completed
    await db.refresh(plan)
    all_paid = all(inst.status == "paid" for inst in plan.installments)
    if all_paid:
        plan.status = "completed"

    await db.commit()
    await db.refresh(plan)
    return _plan_to_dict(plan)


# --- Internal helpers ---


def _plan_to_dict(plan: PaymentPlan) -> Dict[str, Any]:
    """Convert a PaymentPlan model to a response dict."""
    contact_name = None
    if plan.contact:
        contact_name = f"{plan.contact.first_name} {plan.contact.last_name}"

    installments = []
    paid_count = 0
    paid_amount = Decimal("0.00")
    if plan.installments:
        for inst in plan.installments:
            if inst.status == "paid":
                paid_count += 1
                paid_amount += inst.amount
            installments.append({
                "id": inst.id,
                "plan_id": inst.plan_id,
                "installment_number": inst.installment_number,
                "amount": inst.amount,
                "due_date": inst.due_date,
                "status": inst.status,
                "paid_at": inst.paid_at,
                "payment_id": inst.payment_id,
                "created_at": inst.created_at,
                "updated_at": inst.updated_at,
            })

    return {
        "id": plan.id,
        "organization_id": plan.organization_id,
        "invoice_id": plan.invoice_id,
        "contact_id": plan.contact_id,
        "contact_name": contact_name,
        "total_amount": plan.total_amount,
        "num_installments": plan.num_installments,
        "frequency": plan.frequency,
        "start_date": plan.start_date,
        "status": plan.status,
        "paid_count": paid_count,
        "paid_amount": paid_amount,
        "installments": installments,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
    }
