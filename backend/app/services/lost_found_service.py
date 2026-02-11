"""
Camp Connect - Lost & Found Service
Business logic for lost item tracking, claiming, and disposal.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table creation (idempotent)
# ---------------------------------------------------------------------------

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS lost_found_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) DEFAULT 'other',
    location_found VARCHAR(255),
    found_date DATE,
    found_by VARCHAR(255),
    photo_url TEXT,
    claimed_by VARCHAR(255),
    claimed_date DATE,
    status VARCHAR(20) DEFAULT 'unclaimed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


async def list_items(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    await _ensure_table(db)
    q = "SELECT * FROM lost_found_items WHERE org_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if category:
        q += " AND category = :category"
        params["category"] = category
    if status:
        q += " AND status = :status"
        params["status"] = status
    if search:
        q += " AND (item_name ILIKE :search OR description ILIKE :search)"
        params["search"] = f"%{search}%"

    q += " ORDER BY created_at DESC"
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_item(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    item_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    await _ensure_table(db)
    q = "SELECT * FROM lost_found_items WHERE id = :item_id AND org_id = :org_id"
    result = await db.execute(text(q), {"item_id": str(item_id), "org_id": str(org_id)})
    row = result.first()
    return dict(row._mapping) if row else None


async def create_item(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    await _ensure_table(db)
    item_id = uuid.uuid4()
    q = text("""
        INSERT INTO lost_found_items (
            id, org_id, item_name, description, category,
            location_found, found_date, found_by, photo_url,
            claimed_by, claimed_date, status
        )
        VALUES (
            :id, :org_id, :item_name, :description, :category,
            :location_found, :found_date, :found_by, :photo_url,
            :claimed_by, :claimed_date, :status
        )
        RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(item_id),
        "org_id": str(org_id),
        "item_name": data["item_name"],
        "description": data.get("description"),
        "category": data.get("category", "other"),
        "location_found": data.get("location_found"),
        "found_date": data.get("found_date"),
        "found_by": data.get("found_by"),
        "photo_url": data.get("photo_url"),
        "claimed_by": data.get("claimed_by"),
        "claimed_date": data.get("claimed_date"),
        "status": data.get("status", "unclaimed"),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping)


async def update_item(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    item_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    await _ensure_table(db)
    fields = [
        "item_name", "description", "category", "location_found",
        "found_date", "found_by", "photo_url", "claimed_by",
        "claimed_date", "status",
    ]
    sets = []
    params: Dict[str, Any] = {"item_id": str(item_id), "org_id": str(org_id)}
    for field in fields:
        if field in data and data[field] is not None:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]
    if not sets:
        return await get_item(db, org_id=org_id, item_id=item_id)
    q = text(
        f"UPDATE lost_found_items SET {', '.join(sets)} "
        f"WHERE id = :item_id AND org_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


async def delete_item(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    item_id: uuid.UUID,
) -> bool:
    await _ensure_table(db)
    result = await db.execute(
        text("DELETE FROM lost_found_items WHERE id = :item_id AND org_id = :org_id"),
        {"item_id": str(item_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Claim / Unclaim workflow
# ---------------------------------------------------------------------------


async def claim_item(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    item_id: uuid.UUID,
    claimed_by: str,
) -> Optional[Dict[str, Any]]:
    """Mark an item as claimed."""
    await _ensure_table(db)
    today = date.today().isoformat()
    q = text(
        "UPDATE lost_found_items "
        "SET status = 'claimed', claimed_by = :claimed_by, claimed_date = :claimed_date "
        "WHERE id = :item_id AND org_id = :org_id AND status = 'unclaimed' "
        "RETURNING *"
    )
    result = await db.execute(q, {
        "item_id": str(item_id),
        "org_id": str(org_id),
        "claimed_by": claimed_by,
        "claimed_date": today,
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


async def unclaim_item(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    item_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Revert claimed item back to unclaimed."""
    await _ensure_table(db)
    q = text(
        "UPDATE lost_found_items "
        "SET status = 'unclaimed', claimed_by = NULL, claimed_date = NULL "
        "WHERE id = :item_id AND org_id = :org_id AND status = 'claimed' "
        "RETURNING *"
    )
    result = await db.execute(q, {
        "item_id": str(item_id),
        "org_id": str(org_id),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


async def get_stats(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
) -> Dict[str, int]:
    await _ensure_table(db)
    q = text("""
        SELECT
            COUNT(*) AS total_items,
            COUNT(*) FILTER (WHERE status = 'unclaimed') AS unclaimed,
            COUNT(*) FILTER (WHERE status = 'claimed') AS claimed,
            COUNT(*) FILTER (WHERE status = 'disposed') AS disposed
        FROM lost_found_items
        WHERE org_id = :org_id
    """)
    result = await db.execute(q, {"org_id": str(org_id)})
    row = result.first()
    if row:
        m = row._mapping
        return {
            "total_items": m["total_items"],
            "unclaimed": m["unclaimed"],
            "claimed": m["claimed"],
            "disposed": m["disposed"],
        }
    return {"total_items": 0, "unclaimed": 0, "claimed": 0, "disposed": 0}
