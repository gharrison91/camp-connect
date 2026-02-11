"""
Camp Connect - Deal / CRM Pipeline Service
Business logic for deal management.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal
from app.models.contact import Contact
from app.models.family import Family
from app.models.user import User


STAGE_LABELS = {
    "lead": "Lead",
    "qualified": "Qualified",
    "proposal": "Proposal",
    "negotiation": "Negotiation",
    "closed_won": "Won",
    "closed_lost": "Lost",
}

STAGE_ORDER = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]


async def list_deals(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    stage: Optional[str] = None,
    assigned_to: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List deals for an organization with optional filters."""
    query = (
        select(Deal)
        .where(Deal.organization_id == organization_id)
    )

    if stage:
        query = query.where(Deal.stage == stage)

    if assigned_to:
        query = query.where(Deal.assigned_to == assigned_to)

    if search:
        query = query.where(Deal.title.ilike(f"%{search}%"))

    query = query.order_by(Deal.stage, Deal.position, Deal.created_at.desc())
    result = await db.execute(query)
    deals = result.scalars().all()

    # Batch-load contact names, family names, and assigned user names
    contact_ids = {d.contact_id for d in deals if d.contact_id}
    family_ids = {d.family_id for d in deals if d.family_id}
    assigned_ids = {d.assigned_to for d in deals if d.assigned_to}

    contact_map: Dict[uuid.UUID, str] = {}
    family_map: Dict[uuid.UUID, str] = {}
    user_map: Dict[uuid.UUID, str] = {}

    if contact_ids:
        res = await db.execute(select(Contact).where(Contact.id.in_(contact_ids)))
        for c in res.scalars().all():
            contact_map[c.id] = f"{c.first_name} {c.last_name}"

    if family_ids:
        res = await db.execute(select(Family).where(Family.id.in_(family_ids)))
        for f in res.scalars().all():
            family_map[f.id] = f.name

    if assigned_ids:
        res = await db.execute(select(User).where(User.id.in_(assigned_ids)))
        for u in res.scalars().all():
            user_map[u.id] = f"{u.first_name} {u.last_name}"

    return [_deal_to_dict(d, contact_map, family_map, user_map) for d in deals]


async def get_deal(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    deal_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single deal by ID."""
    result = await db.execute(
        select(Deal)
        .where(Deal.id == deal_id)
        .where(Deal.organization_id == organization_id)
    )
    deal = result.scalar_one_or_none()
    if deal is None:
        return None

    contact_map: Dict[uuid.UUID, str] = {}
    family_map: Dict[uuid.UUID, str] = {}
    user_map: Dict[uuid.UUID, str] = {}

    if deal.contact_id:
        res = await db.execute(select(Contact).where(Contact.id == deal.contact_id))
        c = res.scalar_one_or_none()
        if c:
            contact_map[c.id] = f"{c.first_name} {c.last_name}"

    if deal.family_id:
        res = await db.execute(select(Family).where(Family.id == deal.family_id))
        f = res.scalar_one_or_none()
        if f:
            family_map[f.id] = f.name

    if deal.assigned_to:
        res = await db.execute(select(User).where(User.id == deal.assigned_to))
        u = res.scalar_one_or_none()
        if u:
            user_map[u.id] = f"{u.first_name} {u.last_name}"

    return _deal_to_dict(deal, contact_map, family_map, user_map)


async def create_deal(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new deal."""
    deal = Deal(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    return _deal_to_dict(deal, {}, {}, {})


async def update_deal(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    deal_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing deal."""
    result = await db.execute(
        select(Deal)
        .where(Deal.id == deal_id)
        .where(Deal.organization_id == organization_id)
    )
    deal = result.scalar_one_or_none()
    if deal is None:
        return None

    for key, value in data.items():
        setattr(deal, key, value)

    await db.commit()
    await db.refresh(deal)
    return _deal_to_dict(deal, {}, {}, {})


async def delete_deal(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    deal_id: uuid.UUID,
) -> bool:
    """Delete a deal."""
    result = await db.execute(
        select(Deal)
        .where(Deal.id == deal_id)
        .where(Deal.organization_id == organization_id)
    )
    deal = result.scalar_one_or_none()
    if deal is None:
        return False

    await db.delete(deal)
    await db.commit()
    return True


async def move_deal_stage(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    deal_id: uuid.UUID,
    stage: str,
    position: int = 0,
) -> Optional[Dict[str, Any]]:
    """Move a deal to a new stage with a given position."""
    result = await db.execute(
        select(Deal)
        .where(Deal.id == deal_id)
        .where(Deal.organization_id == organization_id)
    )
    deal = result.scalar_one_or_none()
    if deal is None:
        return None

    deal.stage = stage
    deal.position = position

    # If moved to closed_won or closed_lost, set actual_close_date
    if stage in ("closed_won", "closed_lost") and deal.actual_close_date is None:
        deal.actual_close_date = datetime.utcnow()
    elif stage not in ("closed_won", "closed_lost"):
        deal.actual_close_date = None

    await db.commit()
    await db.refresh(deal)
    return _deal_to_dict(deal, {}, {}, {})


async def get_pipeline(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> Dict[str, Any]:
    """Get deals grouped by stage with counts and total values."""
    result = await db.execute(
        select(Deal)
        .where(Deal.organization_id == organization_id)
        .order_by(Deal.position, Deal.created_at.desc())
    )
    deals = result.scalars().all()

    # Batch-load names
    contact_ids = {d.contact_id for d in deals if d.contact_id}
    family_ids = {d.family_id for d in deals if d.family_id}
    assigned_ids = {d.assigned_to for d in deals if d.assigned_to}

    contact_map: Dict[uuid.UUID, str] = {}
    family_map: Dict[uuid.UUID, str] = {}
    user_map: Dict[uuid.UUID, str] = {}

    if contact_ids:
        res = await db.execute(select(Contact).where(Contact.id.in_(contact_ids)))
        for c in res.scalars().all():
            contact_map[c.id] = f"{c.first_name} {c.last_name}"

    if family_ids:
        res = await db.execute(select(Family).where(Family.id.in_(family_ids)))
        for f in res.scalars().all():
            family_map[f.id] = f.name

    if assigned_ids:
        res = await db.execute(select(User).where(User.id.in_(assigned_ids)))
        for u in res.scalars().all():
            user_map[u.id] = f"{u.first_name} {u.last_name}"

    # Group by stage
    stage_groups: Dict[str, List[Dict[str, Any]]] = {s: [] for s in STAGE_ORDER}
    for deal in deals:
        stage_key = deal.stage if deal.stage in stage_groups else "lead"
        stage_groups[stage_key].append(_deal_to_dict(deal, contact_map, family_map, user_map))

    stages = []
    total_deals = 0
    total_value = 0.0
    for stage_key in STAGE_ORDER:
        stage_deals = stage_groups[stage_key]
        stage_value = sum(d["value"] for d in stage_deals)
        stages.append({
            "stage": stage_key,
            "label": STAGE_LABELS[stage_key],
            "deals": stage_deals,
            "count": len(stage_deals),
            "total_value": stage_value,
        })
        total_deals += len(stage_deals)
        total_value += stage_value

    return {
        "stages": stages,
        "total_deals": total_deals,
        "total_value": total_value,
    }


def _deal_to_dict(
    deal: Deal,
    contact_map: Dict[uuid.UUID, str],
    family_map: Dict[uuid.UUID, str],
    user_map: Dict[uuid.UUID, str],
) -> Dict[str, Any]:
    """Convert a Deal model to a response dict."""
    return {
        "id": str(deal.id),
        "organization_id": str(deal.organization_id),
        "contact_id": str(deal.contact_id) if deal.contact_id else None,
        "family_id": str(deal.family_id) if deal.family_id else None,
        "contact_name": contact_map.get(deal.contact_id) if deal.contact_id else None,
        "family_name": family_map.get(deal.family_id) if deal.family_id else None,
        "title": deal.title,
        "description": deal.description,
        "value": deal.value or 0,
        "stage": deal.stage,
        "priority": deal.priority,
        "source": deal.source,
        "expected_close_date": deal.expected_close_date.isoformat() if deal.expected_close_date else None,
        "actual_close_date": deal.actual_close_date.isoformat() if deal.actual_close_date else None,
        "assigned_to": str(deal.assigned_to) if deal.assigned_to else None,
        "assigned_to_name": user_map.get(deal.assigned_to) if deal.assigned_to else None,
        "notes": deal.notes,
        "position": deal.position or 0,
        "created_at": deal.created_at.isoformat() if deal.created_at else None,
        "updated_at": deal.updated_at.isoformat() if deal.updated_at else None,
    }
