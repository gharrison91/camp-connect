"""
Camp Connect - Alumni Service
Business logic for the alumni network directory.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table DDL (idempotent)
# ---------------------------------------------------------------------------

_CREATE_ALUMNI_TABLE = """
CREATE TABLE IF NOT EXISTS alumni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    years_attended INTEGER[] DEFAULT '{}',
    role VARCHAR(20) DEFAULT 'camper',
    graduation_year INTEGER,
    current_city VARCHAR(255),
    current_state VARCHAR(100),
    bio TEXT,
    linkedin_url VARCHAR(500),
    profile_photo_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    """Create the alumni table if it does not exist (idempotent)."""
    await db.execute(text(_CREATE_ALUMNI_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def list_alumni(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    search: Optional[str] = None,
    role: Optional[str] = None,
    graduation_year: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """List alumni with optional search and filters."""
    await _ensure_table(db)

    q = "SELECT * FROM alumni WHERE organization_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if search:
        q += " AND (LOWER(first_name) LIKE :search OR LOWER(last_name) LIKE :search OR LOWER(email) LIKE :search)"
        params["search"] = f"%{search.lower()}%"

    if role:
        q += " AND role = :role"
        params["role"] = role

    if graduation_year:
        q += " AND graduation_year = :graduation_year"
        params["graduation_year"] = graduation_year

    q += " ORDER BY last_name ASC, first_name ASC"

    result = await db.execute(text(q), params)
    rows = []
    for r in result:
        row = dict(r._mapping)
        # PostgreSQL integer arrays come back as lists already via asyncpg,
        # but ensure it's always a list for JSON serialization.
        if row.get("years_attended") is None:
            row["years_attended"] = []
        rows.append(row)
    return rows


async def get_alumni(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    alumni_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single alumni record by ID."""
    await _ensure_table(db)

    result = await db.execute(
        text("SELECT * FROM alumni WHERE id = :id AND organization_id = :org_id"),
        {"id": str(alumni_id), "org_id": str(org_id)},
    )
    row = result.first()
    if not row:
        return None
    d = dict(row._mapping)
    if d.get("years_attended") is None:
        d["years_attended"] = []
    return d


async def create_alumni(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new alumni record."""
    await _ensure_table(db)

    alumni_id = uuid.uuid4()
    years = data.get("years_attended", [])
    years_pg = "{" + ",".join(str(y) for y in years) + "}" if years else "{}"

    q = text("""
        INSERT INTO alumni (
            id, organization_id, first_name, last_name, email, phone,
            years_attended, role, graduation_year, current_city, current_state,
            bio, linkedin_url, profile_photo_url
        ) VALUES (
            :id, :org_id, :first_name, :last_name, :email, :phone,
            :years_attended, :role, :graduation_year, :current_city, :current_state,
            :bio, :linkedin_url, :profile_photo_url
        ) RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(alumni_id),
        "org_id": str(org_id),
        "first_name": data["first_name"],
        "last_name": data["last_name"],
        "email": data.get("email"),
        "phone": data.get("phone"),
        "years_attended": years_pg,
        "role": data.get("role", "camper"),
        "graduation_year": data.get("graduation_year"),
        "current_city": data.get("current_city"),
        "current_state": data.get("current_state"),
        "bio": data.get("bio"),
        "linkedin_url": data.get("linkedin_url"),
        "profile_photo_url": data.get("profile_photo_url"),
    })
    await db.commit()
    row = result.first()
    d = dict(row._mapping)
    if d.get("years_attended") is None:
        d["years_attended"] = []
    return d


async def update_alumni(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    alumni_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing alumni record."""
    await _ensure_table(db)

    sets = []
    params: Dict[str, Any] = {"alumni_id": str(alumni_id), "org_id": str(org_id)}

    for field in [
        "first_name", "last_name", "email", "phone", "role",
        "graduation_year", "current_city", "current_state",
        "bio", "linkedin_url", "profile_photo_url",
    ]:
        if field in data and data[field] is not None:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]

    # Handle years_attended array specially
    if "years_attended" in data and data["years_attended"] is not None:
        years = data["years_attended"]
        years_pg = "{" + ",".join(str(y) for y in years) + "}" if years else "{}"
        sets.append("years_attended = :years_attended")
        params["years_attended"] = years_pg

    if not sets:
        return await get_alumni(db, org_id=org_id, alumni_id=alumni_id)

    q = text(
        f"UPDATE alumni SET {', '.join(sets)} "
        f"WHERE id = :alumni_id AND organization_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    if not row:
        return None
    d = dict(row._mapping)
    if d.get("years_attended") is None:
        d["years_attended"] = []
    return d


async def delete_alumni(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    alumni_id: uuid.UUID,
) -> bool:
    """Delete an alumni record."""
    await _ensure_table(db)

    result = await db.execute(
        text("DELETE FROM alumni WHERE id = :id AND organization_id = :org_id"),
        {"id": str(alumni_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

async def get_alumni_stats(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Aggregate alumni statistics for the organization."""
    await _ensure_table(db)

    org = str(org_id)

    # Total alumni
    r1 = await db.execute(
        text("SELECT COUNT(*) FROM alumni WHERE organization_id = :org_id"),
        {"org_id": org},
    )
    total = r1.scalar() or 0

    # Camper alumni (role = 'camper' or 'both')
    r2 = await db.execute(
        text("SELECT COUNT(*) FROM alumni WHERE organization_id = :org_id AND role IN ('camper', 'both')"),
        {"org_id": org},
    )
    camper_count = r2.scalar() or 0

    # Staff alumni (role = 'staff' or 'both')
    r3 = await db.execute(
        text("SELECT COUNT(*) FROM alumni WHERE organization_id = :org_id AND role IN ('staff', 'both')"),
        {"org_id": org},
    )
    staff_count = r3.scalar() or 0

    # Average years attended
    r4 = await db.execute(
        text(
            "SELECT AVG(array_length(years_attended, 1)) "
            "FROM alumni WHERE organization_id = :org_id AND array_length(years_attended, 1) > 0"
        ),
        {"org_id": org},
    )
    avg_years = r4.scalar()
    avg_years = round(float(avg_years), 1) if avg_years else 0.0

    return {
        "total_alumni": total,
        "camper_alumni": camper_count,
        "staff_alumni": staff_count,
        "avg_years_attended": avg_years,
    }
