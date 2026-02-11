"""
Camp Connect - Supply Request Service
Business logic for supply request CRUD, approval workflow, and stats.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table bootstrap (idempotent)
# ---------------------------------------------------------------------------

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS supply_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(30) DEFAULT 'other',
    priority VARCHAR(10) DEFAULT 'medium',
    quantity INTEGER DEFAULT 1,
    estimated_cost NUMERIC(12, 2),
    needed_by DATE,
    requested_by VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# List / Get
# ---------------------------------------------------------------------------

async def get_supply_requests(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    await _ensure_table(db)
    q = "SELECT * FROM supply_requests WHERE organization_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if status:
        q += " AND status = :status"
        params["status"] = status
    if category:
        q += " AND category = :category"
        params["category"] = category
    if priority:
        q += " AND priority = :priority"
        params["priority"] = priority
    if search:
        q += " AND (title ILIKE :search OR description ILIKE :search)"
        params["search"] = f"%{search}%"

    q += " ORDER BY created_at DESC"
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_supply_request(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    request_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    await _ensure_table(db)
    result = await db.execute(
        text("SELECT * FROM supply_requests WHERE id = :id AND organization_id = :org_id"),
        {"id": str(request_id), "org_id": str(org_id)},
    )
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

async def create_supply_request(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    await _ensure_table(db)
    req_id = uuid.uuid4()
    q = text("""
        INSERT INTO supply_requests (
            id, organization_id, title, description, category, priority,
            quantity, estimated_cost, needed_by, requested_by
        ) VALUES (
            :id, :org_id, :title, :description, :category, :priority,
            :quantity, :estimated_cost, :needed_by, :requested_by
        ) RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(req_id),
        "org_id": str(org_id),
        "title": data["title"],
        "description": data.get("description"),
        "category": data.get("category", "other"),
        "priority": data.get("priority", "medium"),
        "quantity": data.get("quantity", 1),
        "estimated_cost": data.get("estimated_cost"),
        "needed_by": data.get("needed_by"),
        "requested_by": data.get("requested_by"),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping)


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

async def update_supply_request(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    request_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    await _ensure_table(db)
    fields = [
        "title", "description", "category", "priority", "quantity",
        "estimated_cost", "needed_by", "requested_by", "status", "notes",
    ]
    sets = []
    params: Dict[str, Any] = {"id": str(request_id), "org_id": str(org_id)}
    for field in fields:
        if field in data and data[field] is not None:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]
    if not sets:
        return await get_supply_request(db, org_id=org_id, request_id=request_id)
    q = text(
        f"UPDATE supply_requests SET {', '.join(sets)} "
        f"WHERE id = :id AND organization_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

async def delete_supply_request(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    request_id: uuid.UUID,
) -> bool:
    await _ensure_table(db)
    result = await db.execute(
        text("DELETE FROM supply_requests WHERE id = :id AND organization_id = :org_id"),
        {"id": str(request_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Approve / Reject workflow
# ---------------------------------------------------------------------------

async def approve_supply_request(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    request_id: uuid.UUID,
    approved_by: str,
    notes: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    await _ensure_table(db)
    now = datetime.now(timezone.utc).isoformat()
    params: Dict[str, Any] = {
        "id": str(request_id),
        "org_id": str(org_id),
        "approved_by": approved_by,
        "approved_at": now,
    }
    notes_clause = ""
    if notes:
        notes_clause = ", notes = :notes"
        params["notes"] = notes
    q = text(
        f"UPDATE supply_requests SET status = 'approved', approved_by = :approved_by, "
        f"approved_at = :approved_at{notes_clause} "
        f"WHERE id = :id AND organization_id = :org_id AND status = 'pending' RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


async def reject_supply_request(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    request_id: uuid.UUID,
    rejected_by: str,
    notes: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    await _ensure_table(db)
    now = datetime.now(timezone.utc).isoformat()
    params: Dict[str, Any] = {
        "id": str(request_id),
        "org_id": str(org_id),
        "approved_by": rejected_by,
        "approved_at": now,
    }
    notes_clause = ""
    if notes:
        notes_clause = ", notes = :notes"
        params["notes"] = notes
    q = text(
        f"UPDATE supply_requests SET status = 'rejected', approved_by = :approved_by, "
        f"approved_at = :approved_at{notes_clause} "
        f"WHERE id = :id AND organization_id = :org_id AND status = 'pending' RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

async def get_supply_stats(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    await _ensure_table(db)
    org = str(org_id)

    # Counts by status
    r = await db.execute(
        text("SELECT status, COUNT(*) AS cnt FROM supply_requests WHERE organization_id = :org_id GROUP BY status"),
        {"org_id": org},
    )
    counts: Dict[str, int] = {}
    total = 0
    for row in r:
        m = row._mapping
        counts[m["status"]] = m["cnt"]
        total += m["cnt"]

    # Total estimated cost (approved + ordered + received only)
    r2 = await db.execute(
        text(
            "SELECT COALESCE(SUM(estimated_cost * quantity), 0) AS total_cost "
            "FROM supply_requests WHERE organization_id = :org_id "
            "AND status IN ('approved', 'ordered', 'received')"
        ),
        {"org_id": org},
    )
    total_cost = float(r2.scalar() or 0)

    # Average fulfillment days (approved_at - created_at for received items)
    r3 = await db.execute(
        text(
            "SELECT AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 86400) AS avg_days "
            "FROM supply_requests WHERE organization_id = :org_id AND status = 'received' "
            "AND approved_at IS NOT NULL"
        ),
        {"org_id": org},
    )
    avg_days_raw = r3.scalar()
    avg_days = round(float(avg_days_raw), 1) if avg_days_raw is not None else None

    return {
        "total_requests": total,
        "pending_count": counts.get("pending", 0),
        "approved_count": counts.get("approved", 0),
        "ordered_count": counts.get("ordered", 0),
        "received_count": counts.get("received", 0),
        "rejected_count": counts.get("rejected", 0),
        "total_cost": total_cost,
        "avg_fulfillment_days": avg_days,
    }
