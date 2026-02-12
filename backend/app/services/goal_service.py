"""
Camp Connect - Goal Setting Service
Business logic for camper goal CRUD, milestones, and statistics.
"""

from __future__ import annotations

import json
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table creation (idempotent)
# ---------------------------------------------------------------------------

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS camper_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    camper_id UUID NOT NULL,
    camper_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL DEFAULT 'personal',
    target_date VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started',
    progress INTEGER NOT NULL DEFAULT 0,
    milestones JSONB,
    counselor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    """Create the camper_goals table if it does not exist."""
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


def _row_to_dict(row_mapping: Any) -> Dict[str, Any]:
    """Convert a row mapping to a dict, parsing JSONB milestones."""
    d = dict(row_mapping)
    if d.get("milestones") and isinstance(d["milestones"], str):
        d["milestones"] = json.loads(d["milestones"])
    return d


# ---------------------------------------------------------------------------
# List goals
# ---------------------------------------------------------------------------

async def list_goals(
    db: AsyncSession,
    org_id: uuid.UUID,
    *,
    status: Optional[str] = None,
    category: Optional[str] = None,
    camper_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List goals for an organization with optional filters."""
    await _ensure_table(db)
    q = "SELECT * FROM camper_goals WHERE org_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if status:
        q += " AND status = :status"
        params["status"] = status
    if category:
        q += " AND category = :category"
        params["category"] = category
    if camper_id:
        q += " AND camper_id = :camper_id"
        params["camper_id"] = str(camper_id)
    if search:
        q += " AND (title ILIKE :search OR camper_name ILIKE :search OR description ILIKE :search)"
        params["search"] = f"%{search}%"

    q += " ORDER BY created_at DESC"
    result = await db.execute(text(q), params)
    return [_row_to_dict(r._mapping) for r in result]


# ---------------------------------------------------------------------------
# Get single goal
# ---------------------------------------------------------------------------

async def get_goal(
    db: AsyncSession,
    org_id: uuid.UUID,
    goal_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single goal by ID."""
    await _ensure_table(db)
    q = "SELECT * FROM camper_goals WHERE id = :goal_id AND org_id = :org_id"
    result = await db.execute(text(q), {"goal_id": str(goal_id), "org_id": str(org_id)})
    row = result.first()
    return _row_to_dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Create goal
# ---------------------------------------------------------------------------

async def create_goal(
    db: AsyncSession,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new camper goal."""
    await _ensure_table(db)
    goal_id = uuid.uuid4()
    milestones = data.get("milestones")
    milestones_json = json.dumps(milestones) if milestones else None

    q = text("""
        INSERT INTO camper_goals (
            id, org_id, camper_id, camper_name, title, description,
            category, target_date, status, progress, milestones, counselor_notes
        ) VALUES (
            :id, :org_id, :camper_id, :camper_name, :title, :description,
            :category, :target_date, :status, :progress, :milestones, :counselor_notes
        ) RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(goal_id),
        "org_id": str(org_id),
        "camper_id": str(data["camper_id"]),
        "camper_name": data["camper_name"],
        "title": data["title"],
        "description": data.get("description"),
        "category": data.get("category", "personal"),
        "target_date": data.get("target_date"),
        "status": data.get("status", "not_started"),
        "progress": data.get("progress", 0),
        "milestones": milestones_json,
        "counselor_notes": data.get("counselor_notes"),
    })
    await db.commit()
    row = result.first()
    return _row_to_dict(row._mapping)


# ---------------------------------------------------------------------------
# Update goal
# ---------------------------------------------------------------------------

async def update_goal(
    db: AsyncSession,
    org_id: uuid.UUID,
    goal_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing camper goal."""
    await _ensure_table(db)
    fields = [
        "camper_id", "camper_name", "title", "description",
        "category", "target_date", "status", "progress",
        "milestones", "counselor_notes",
    ]
    sets = []
    params: Dict[str, Any] = {"goal_id": str(goal_id), "org_id": str(org_id)}
    for field in fields:
        if field in data and data[field] is not None:
            val = data[field]
            if field == "camper_id":
                val = str(val)
            elif field == "milestones":
                val = json.dumps(val) if val else None
            sets.append(f"{field} = :{field}")
            params[field] = val
    if not sets:
        return await get_goal(db, org_id, goal_id)

    sets.append("updated_at = NOW()")
    q = text(
        f"UPDATE camper_goals SET {', '.join(sets)} "
        f"WHERE id = :goal_id AND org_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return _row_to_dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Delete goal
# ---------------------------------------------------------------------------

async def delete_goal(
    db: AsyncSession,
    org_id: uuid.UUID,
    goal_id: uuid.UUID,
) -> bool:
    """Delete a camper goal."""
    await _ensure_table(db)
    result = await db.execute(
        text("DELETE FROM camper_goals WHERE id = :goal_id AND org_id = :org_id"),
        {"goal_id": str(goal_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

async def get_stats(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Get goal statistics for an organization."""
    await _ensure_table(db)
    org = str(org_id)

    # Total
    r = await db.execute(
        text("SELECT COUNT(*) FROM camper_goals WHERE org_id = :org_id"),
        {"org_id": org},
    )
    total = r.scalar() or 0

    # Completed
    r = await db.execute(
        text("SELECT COUNT(*) FROM camper_goals WHERE org_id = :org_id AND status = 'completed'"),
        {"org_id": org},
    )
    completed = r.scalar() or 0

    # In progress
    r = await db.execute(
        text("SELECT COUNT(*) FROM camper_goals WHERE org_id = :org_id AND status = 'in_progress'"),
        {"org_id": org},
    )
    in_progress = r.scalar() or 0

    # Completion rate
    completion_rate = round((completed / total * 100), 1) if total > 0 else 0.0

    # By category
    r = await db.execute(
        text(
            "SELECT category, COUNT(*) AS cnt FROM camper_goals "
            "WHERE org_id = :org_id GROUP BY category"
        ),
        {"org_id": org},
    )
    by_category = {row._mapping["category"]: row._mapping["cnt"] for row in r}

    return {
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "completion_rate": completion_rate,
        "by_category": by_category,
    }
