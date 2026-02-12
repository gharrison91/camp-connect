"""
Camp Connect - Staff Schedule Service
Business logic for staff shift scheduling: CRUD and stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table bootstrap (idempotent)
# ---------------------------------------------------------------------------

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS staff_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    staff_id UUID,
    role VARCHAR(255) NOT NULL,
    shift_type VARCHAR(20) DEFAULT 'full_day',
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    location VARCHAR(255),
    day_of_week VARCHAR(10) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# List shifts
# ---------------------------------------------------------------------------

async def list_shifts(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    day_of_week: Optional[str] = None,
    shift_type: Optional[str] = None,
    staff_name: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    await _ensure_table(db)
    q = "SELECT * FROM staff_shifts WHERE organization_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if day_of_week:
        q += " AND day_of_week = :day_of_week"
        params["day_of_week"] = day_of_week
    if shift_type:
        q += " AND shift_type = :shift_type"
        params["shift_type"] = shift_type
    if staff_name:
        q += " AND staff_name ILIKE :staff_name"
        params["staff_name"] = f"%{staff_name}%"
    if search:
        q += " AND (staff_name ILIKE :search OR role ILIKE :search OR location ILIKE :search)"
        params["search"] = f"%{search}%"

    q += (" ORDER BY CASE day_of_week"
          " WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3"
          " WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6"
          " WHEN 'sunday' THEN 7 END, start_time")
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


# ---------------------------------------------------------------------------
# Get single shift
# ---------------------------------------------------------------------------

async def get_shift(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    shift_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    await _ensure_table(db)
    result = await db.execute(
        text("SELECT * FROM staff_shifts WHERE id = :id AND organization_id = :org_id"),
        {"id": str(shift_id), "org_id": str(org_id)},
    )
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Create shift
# ---------------------------------------------------------------------------

async def create_shift(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    await _ensure_table(db)
    shift_id = uuid.uuid4()
    q = text("""
        INSERT INTO staff_shifts (
            id, organization_id, staff_name, staff_id, role, shift_type,
            start_time, end_time, location, day_of_week, notes, status
        ) VALUES (
            :id, :org_id, :staff_name, :staff_id, :role, :shift_type,
            :start_time, :end_time, :location, :day_of_week, :notes, :status
        ) RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(shift_id),
        "org_id": str(org_id),
        "staff_name": data["staff_name"],
        "staff_id": str(data["staff_id"]) if data.get("staff_id") else None,
        "role": data["role"],
        "shift_type": data.get("shift_type", "full_day"),
        "start_time": data["start_time"],
        "end_time": data["end_time"],
        "location": data.get("location"),
        "day_of_week": data["day_of_week"],
        "notes": data.get("notes"),
        "status": data.get("status", "scheduled"),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping)


# ---------------------------------------------------------------------------
# Update shift
# ---------------------------------------------------------------------------

async def update_shift(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    shift_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    await _ensure_table(db)
    fields = [
        "staff_name", "staff_id", "role", "shift_type",
        "start_time", "end_time", "location", "day_of_week",
        "notes", "status",
    ]
    sets = []
    params: Dict[str, Any] = {"id": str(shift_id), "org_id": str(org_id)}
    for field in fields:
        if field in data and data[field] is not None:
            if field == "staff_id":
                sets.append(f"{field} = :{field}")
                params[field] = str(data[field])
            else:
                sets.append(f"{field} = :{field}")
                params[field] = data[field]
    if not sets:
        return await get_shift(db, org_id=org_id, shift_id=shift_id)
    q = text(
        f"UPDATE staff_shifts SET {', '.join(sets)} "
        f"WHERE id = :id AND organization_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Delete shift
# ---------------------------------------------------------------------------

async def delete_shift(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    shift_id: uuid.UUID,
) -> bool:
    await _ensure_table(db)
    result = await db.execute(
        text("DELETE FROM staff_shifts WHERE id = :id AND organization_id = :org_id"),
        {"id": str(shift_id), "org_id": str(org_id)},
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
    await _ensure_table(db)
    org = str(org_id)

    # Total shifts (non-cancelled)
    r1 = await db.execute(
        text(
            "SELECT COUNT(*) AS cnt FROM staff_shifts "
            "WHERE organization_id = :org_id AND status != 'cancelled'"
        ),
        {"org_id": org},
    )
    total_shifts = int(r1.scalar() or 0)

    # Distinct staff count
    r2 = await db.execute(
        text(
            "SELECT COUNT(DISTINCT staff_name) AS cnt FROM staff_shifts "
            "WHERE organization_id = :org_id AND status != 'cancelled'"
        ),
        {"org_id": org},
    )
    staff_count = int(r2.scalar() or 0)

    # By shift type
    r3 = await db.execute(
        text(
            "SELECT shift_type, COUNT(*) AS cnt FROM staff_shifts "
            "WHERE organization_id = :org_id AND status != 'cancelled' "
            "GROUP BY shift_type"
        ),
        {"org_id": org},
    )
    by_shift_type: Dict[str, int] = {}
    for row in r3:
        m = row._mapping
        by_shift_type[m["shift_type"]] = m["cnt"]

    # By day of week
    r4 = await db.execute(
        text(
            "SELECT day_of_week, COUNT(*) AS cnt FROM staff_shifts "
            "WHERE organization_id = :org_id AND status != 'cancelled' "
            "GROUP BY day_of_week"
        ),
        {"org_id": org},
    )
    by_day: Dict[str, int] = {}
    for row in r4:
        m = row._mapping
        by_day[m["day_of_week"]] = m["cnt"]

    # Coverage gaps: days of the week with no shifts at all
    all_days = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
    covered_days = set(by_day.keys())
    coverage_gaps = len(all_days - covered_days)

    return {
        "total_shifts": total_shifts,
        "staff_count": staff_count,
        "by_shift_type": by_shift_type,
        "by_day": by_day,
        "coverage_gaps": coverage_gaps,
    }
