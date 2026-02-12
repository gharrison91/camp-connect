"""
Camp Connect - Dietary Service
Business logic for dietary restrictions: CRUD and stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table creation (idempotent, raw SQL)
# ---------------------------------------------------------------------------

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS dietary_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    camper_id UUID NOT NULL,
    restriction_type VARCHAR(20) NOT NULL DEFAULT 'food_allergy',
    restriction VARCHAR(255) NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'moderate',
    alternatives TEXT,
    meal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_tables(db: AsyncSession) -> None:
    """Create the dietary_restrictions table if it does not exist."""
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def list_restrictions(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    restriction_type: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """List dietary restrictions with optional filters."""
    await _ensure_tables(db)
    q = """
        SELECT d.*,
               COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name
        FROM dietary_restrictions d
        LEFT JOIN campers c ON c.id = d.camper_id
        WHERE d.org_id = :org_id
    """
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if restriction_type:
        q += " AND d.restriction_type = :restriction_type"
        params["restriction_type"] = restriction_type
    if severity:
        q += " AND d.severity = :severity"
        params["severity"] = severity
    if search:
        q += " AND (d.restriction ILIKE :search OR c.first_name ILIKE :search OR c.last_name ILIKE :search)"
        params["search"] = f"%{search}%"

    q += " ORDER BY c.last_name ASC, c.first_name ASC, d.restriction ASC"
    q += " OFFSET :skip LIMIT :lim"
    params["skip"] = skip
    params["lim"] = limit

    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_restriction(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    restriction_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single dietary restriction by ID."""
    await _ensure_tables(db)
    q = """
        SELECT d.*,
               COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name
        FROM dietary_restrictions d
        LEFT JOIN campers c ON c.id = d.camper_id
        WHERE d.id = :restriction_id AND d.org_id = :org_id
    """
    result = await db.execute(text(q), {
        "restriction_id": str(restriction_id),
        "org_id": str(org_id),
    })
    row = result.first()
    return dict(row._mapping) if row else None


async def create_restriction(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new dietary restriction."""
    await _ensure_tables(db)
    restriction_id = uuid.uuid4()
    q = text("""
        INSERT INTO dietary_restrictions
            (id, org_id, camper_id, restriction_type, restriction, severity, alternatives, meal_notes)
        VALUES
            (:id, :org_id, :camper_id, :restriction_type, :restriction, :severity, :alternatives, :meal_notes)
        RETURNING *
    """)
    await db.execute(q, {
        "id": str(restriction_id),
        "org_id": str(org_id),
        "camper_id": str(data["camper_id"]),
        "restriction_type": data["restriction_type"],
        "restriction": data["restriction"],
        "severity": data["severity"],
        "alternatives": data.get("alternatives"),
        "meal_notes": data.get("meal_notes"),
    })
    await db.commit()
    return await get_restriction(db, org_id=org_id, restriction_id=restriction_id)


async def update_restriction(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    restriction_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing dietary restriction."""
    await _ensure_tables(db)
    sets = ["updated_at = NOW()"]
    params: Dict[str, Any] = {
        "restriction_id": str(restriction_id),
        "org_id": str(org_id),
    }
    for field in ["restriction_type", "restriction", "severity", "alternatives", "meal_notes"]:
        if field in data and data[field] is not None:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]

    if len(sets) == 1:
        return await get_restriction(db, org_id=org_id, restriction_id=restriction_id)

    q = text(
        f"UPDATE dietary_restrictions SET {', '.join(sets)} "
        f"WHERE id = :restriction_id AND org_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    if not row:
        return None
    return await get_restriction(db, org_id=org_id, restriction_id=restriction_id)


async def delete_restriction(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    restriction_id: uuid.UUID,
) -> bool:
    """Delete a dietary restriction."""
    await _ensure_tables(db)
    result = await db.execute(
        text("DELETE FROM dietary_restrictions WHERE id = :restriction_id AND org_id = :org_id"),
        {"restriction_id": str(restriction_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

async def get_stats(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Compute aggregate dietary restriction statistics."""
    await _ensure_tables(db)

    # Total restrictions
    r1 = await db.execute(
        text("SELECT COUNT(*) FROM dietary_restrictions WHERE org_id = :org_id"),
        {"org_id": str(org_id)},
    )
    total_restrictions = r1.scalar() or 0

    # Distinct campers affected
    r2 = await db.execute(
        text("SELECT COUNT(DISTINCT camper_id) FROM dietary_restrictions WHERE org_id = :org_id"),
        {"org_id": str(org_id)},
    )
    campers_affected = r2.scalar() or 0

    # Severe count
    r3 = await db.execute(
        text(
            "SELECT COUNT(*) FROM dietary_restrictions "
            "WHERE org_id = :org_id AND severity = 'severe'"
        ),
        {"org_id": str(org_id)},
    )
    severe_count = r3.scalar() or 0

    # By type breakdown
    r4 = await db.execute(
        text(
            "SELECT restriction_type, COUNT(*) AS count "
            "FROM dietary_restrictions WHERE org_id = :org_id "
            "GROUP BY restriction_type ORDER BY count DESC"
        ),
        {"org_id": str(org_id)},
    )
    by_type = {r._mapping["restriction_type"]: r._mapping["count"] for r in r4}

    return {
        "total_restrictions": total_restrictions,
        "campers_affected": campers_affected,
        "by_type": by_type,
        "severe_count": severe_count,
    }
