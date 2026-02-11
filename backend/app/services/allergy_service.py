"""
Camp Connect - Allergy Service
Business logic for the allergy matrix: CRUD, matrix view, and stats.
"""

from __future__ import annotations

import uuid
from collections import Counter
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table creation (idempotent, raw SQL — same pattern as award_service)
# ---------------------------------------------------------------------------

_CREATE_ALLERGY_TABLE = """
CREATE TABLE IF NOT EXISTS allergy_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    camper_id UUID NOT NULL,
    allergy_type VARCHAR(20) NOT NULL DEFAULT 'food',
    allergen VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'moderate',
    treatment TEXT,
    epipen_required BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_tables(db: AsyncSession) -> None:
    """Create the allergy_entries table if it does not exist."""
    await db.execute(text(_CREATE_ALLERGY_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def list_allergies(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    allergy_type: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Dict[str, Any]]:
    """List allergy entries with optional filters."""
    await _ensure_tables(db)
    q = """
        SELECT a.*,
               COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name
        FROM allergy_entries a
        LEFT JOIN campers c ON c.id = a.camper_id
        WHERE a.org_id = :org_id
    """
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if allergy_type:
        q += " AND a.allergy_type = :allergy_type"
        params["allergy_type"] = allergy_type
    if severity:
        q += " AND a.severity = :severity"
        params["severity"] = severity
    if search:
        q += " AND (a.allergen ILIKE :search OR c.first_name ILIKE :search OR c.last_name ILIKE :search)"
        params["search"] = f"%{search}%"

    q += " ORDER BY c.last_name ASC, c.first_name ASC, a.allergen ASC"
    q += " OFFSET :skip LIMIT :lim"
    params["skip"] = skip
    params["lim"] = limit

    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_allergy(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    allergy_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single allergy entry by ID."""
    await _ensure_tables(db)
    q = """
        SELECT a.*,
               COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name
        FROM allergy_entries a
        LEFT JOIN campers c ON c.id = a.camper_id
        WHERE a.id = :allergy_id AND a.org_id = :org_id
    """
    result = await db.execute(text(q), {
        "allergy_id": str(allergy_id),
        "org_id": str(org_id),
    })
    row = result.first()
    return dict(row._mapping) if row else None


async def create_allergy(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new allergy entry."""
    await _ensure_tables(db)
    allergy_id = uuid.uuid4()
    q = text("""
        INSERT INTO allergy_entries
            (id, org_id, camper_id, allergy_type, allergen, severity, treatment, epipen_required, notes)
        VALUES
            (:id, :org_id, :camper_id, :allergy_type, :allergen, :severity, :treatment, :epipen_required, :notes)
        RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(allergy_id),
        "org_id": str(org_id),
        "camper_id": str(data["camper_id"]),
        "allergy_type": data["allergy_type"],
        "allergen": data["allergen"],
        "severity": data["severity"],
        "treatment": data.get("treatment"),
        "epipen_required": data.get("epipen_required", False),
        "notes": data.get("notes"),
    })
    await db.commit()
    # Re-fetch with camper name
    return await get_allergy(db, org_id=org_id, allergy_id=allergy_id)


async def update_allergy(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    allergy_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing allergy entry."""
    await _ensure_tables(db)
    sets = ["updated_at = NOW()"]
    params: Dict[str, Any] = {
        "allergy_id": str(allergy_id),
        "org_id": str(org_id),
    }
    for field in ["allergy_type", "allergen", "severity", "treatment", "epipen_required", "notes"]:
        if field in data and data[field] is not None:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]

    if len(sets) == 1:
        # Nothing to update besides timestamp
        return await get_allergy(db, org_id=org_id, allergy_id=allergy_id)

    q = text(
        f"UPDATE allergy_entries SET {', '.join(sets)} "
        f"WHERE id = :allergy_id AND org_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    if not row:
        return None
    return await get_allergy(db, org_id=org_id, allergy_id=allergy_id)


async def delete_allergy(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    allergy_id: uuid.UUID,
) -> bool:
    """Delete an allergy entry."""
    await _ensure_tables(db)
    result = await db.execute(
        text("DELETE FROM allergy_entries WHERE id = :allergy_id AND org_id = :org_id"),
        {"allergy_id": str(allergy_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Matrix view
# ---------------------------------------------------------------------------

async def get_matrix(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    allergy_type: Optional[str] = None,
    severity: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Return the allergy matrix: grouped by camper, each row contains
    camper info and a list of their allergy entries.
    """
    await _ensure_tables(db)
    q = """
        SELECT a.*,
               COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name
        FROM allergy_entries a
        LEFT JOIN campers c ON c.id = a.camper_id
        WHERE a.org_id = :org_id
    """
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if allergy_type:
        q += " AND a.allergy_type = :allergy_type"
        params["allergy_type"] = allergy_type
    if severity:
        q += " AND a.severity = :severity"
        params["severity"] = severity

    q += " ORDER BY c.last_name ASC, c.first_name ASC, a.allergen ASC"

    result = await db.execute(text(q), params)
    rows = [dict(r._mapping) for r in result]

    # Group by camper
    camper_map: Dict[str, Dict[str, Any]] = {}
    for row in rows:
        cid = str(row["camper_id"])
        if cid not in camper_map:
            camper_map[cid] = {
                "camper_id": row["camper_id"],
                "camper_name": row["camper_name"],
                "allergies": [],
            }
        camper_map[cid]["allergies"].append(row)

    return list(camper_map.values())


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

async def get_stats(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Compute aggregate allergy statistics."""
    await _ensure_tables(db)

    # Total entries
    r1 = await db.execute(
        text("SELECT COUNT(*) FROM allergy_entries WHERE org_id = :org_id"),
        {"org_id": str(org_id)},
    )
    total_entries = r1.scalar() or 0

    # Distinct campers with allergies
    r2 = await db.execute(
        text("SELECT COUNT(DISTINCT camper_id) FROM allergy_entries WHERE org_id = :org_id"),
        {"org_id": str(org_id)},
    )
    campers_with_allergies = r2.scalar() or 0

    # Severe + life-threatening count
    r3 = await db.execute(
        text(
            "SELECT COUNT(*) FROM allergy_entries "
            "WHERE org_id = :org_id AND severity IN ('severe', 'life_threatening')"
        ),
        {"org_id": str(org_id)},
    )
    severe_count = r3.scalar() or 0

    # EpiPen count
    r4 = await db.execute(
        text(
            "SELECT COUNT(*) FROM allergy_entries "
            "WHERE org_id = :org_id AND epipen_required = TRUE"
        ),
        {"org_id": str(org_id)},
    )
    epipen_count = r4.scalar() or 0

    # Top allergens
    r5 = await db.execute(
        text(
            "SELECT allergen, COUNT(*) AS count "
            "FROM allergy_entries WHERE org_id = :org_id "
            "GROUP BY allergen ORDER BY count DESC LIMIT 10"
        ),
        {"org_id": str(org_id)},
    )
    top_allergens = [{"allergen": r._mapping["allergen"], "count": r._mapping["count"]} for r in r5]

    return {
        "total_entries": total_entries,
        "campers_with_allergies": campers_with_allergies,
        "severe_count": severe_count,
        "epipen_count": epipen_count,
        "top_allergens": top_allergens,
    }
