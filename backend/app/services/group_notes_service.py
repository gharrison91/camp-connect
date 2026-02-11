"""
Camp Connect - Group Notes Service
Business logic for shift-based group notes (bunks, activities, age groups, custom).
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table creation (idempotent)
# ---------------------------------------------------------------------------

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS group_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    group_type VARCHAR(20) NOT NULL DEFAULT 'bunk',
    note_text TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    shift VARCHAR(20) NOT NULL DEFAULT 'morning',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    """Create the group_notes table if it does not exist."""
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def list_notes(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    group_name: Optional[str] = None,
    group_type: Optional[str] = None,
    shift: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """List group notes with optional filters, newest first."""
    await _ensure_table(db)
    clauses = ["org_id = :org_id"]
    params: Dict[str, Any] = {"org_id": str(org_id), "lim": limit, "off": offset}

    if group_name:
        clauses.append("group_name = :group_name")
        params["group_name"] = group_name
    if group_type:
        clauses.append("group_type = :group_type")
        params["group_type"] = group_type
    if shift:
        clauses.append("shift = :shift")
        params["shift"] = shift
    if priority:
        clauses.append("priority = :priority")
        params["priority"] = priority

    where = " AND ".join(clauses)
    q = text(f"""
        SELECT * FROM group_notes
        WHERE {where}
        ORDER BY created_at DESC
        LIMIT :lim OFFSET :off
    """)
    result = await db.execute(q, params)
    rows = []
    for r in result:
        d = dict(r._mapping)
        # Ensure tags is always a list
        if d.get("tags") is None:
            d["tags"] = []
        rows.append(d)
    return rows


async def get_note(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    note_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single group note by ID."""
    await _ensure_table(db)
    q = text("SELECT * FROM group_notes WHERE id = :note_id AND org_id = :org_id")
    result = await db.execute(q, {"note_id": str(note_id), "org_id": str(org_id)})
    row = result.first()
    if not row:
        return None
    d = dict(row._mapping)
    if d.get("tags") is None:
        d["tags"] = []
    return d


async def create_note(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new group note."""
    await _ensure_table(db)
    note_id = uuid.uuid4()
    tags = data.get("tags", [])
    q = text("""
        INSERT INTO group_notes (id, org_id, group_name, group_type, note_text, author_name, shift, priority, tags)
        VALUES (:id, :org_id, :group_name, :group_type, :note_text, :author_name, :shift, :priority, :tags)
        RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(note_id),
        "org_id": str(org_id),
        "group_name": data["group_name"],
        "group_type": data.get("group_type", "bunk"),
        "note_text": data["note_text"],
        "author_name": data["author_name"],
        "shift": data.get("shift", "morning"),
        "priority": data.get("priority", "normal"),
        "tags": tags,
    })
    await db.commit()
    row = result.first()
    d = dict(row._mapping)
    if d.get("tags") is None:
        d["tags"] = []
    return d


async def update_note(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    note_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing group note."""
    await _ensure_table(db)
    sets = []
    params: Dict[str, Any] = {"note_id": str(note_id), "org_id": str(org_id)}
    for field in ["group_name", "group_type", "note_text", "author_name", "shift", "priority", "tags"]:
        if field in data and data[field] is not None:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]
    if not sets:
        return await get_note(db, org_id=org_id, note_id=note_id)
    q = text(f"UPDATE group_notes SET {', '.join(sets)} WHERE id = :note_id AND org_id = :org_id RETURNING *")
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    if not row:
        return None
    d = dict(row._mapping)
    if d.get("tags") is None:
        d["tags"] = []
    return d


async def delete_note(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    note_id: uuid.UUID,
) -> bool:
    """Delete a group note."""
    await _ensure_table(db)
    result = await db.execute(
        text("DELETE FROM group_notes WHERE id = :note_id AND org_id = :org_id"),
        {"note_id": str(note_id), "org_id": str(org_id)},
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
    """Get aggregate statistics for group notes."""
    await _ensure_table(db)
    org = str(org_id)

    # Total notes
    r1 = await db.execute(
        text("SELECT COUNT(*) FROM group_notes WHERE org_id = :org_id"),
        {"org_id": org},
    )
    total_notes = r1.scalar() or 0

    # Urgent count
    r2 = await db.execute(
        text("SELECT COUNT(*) FROM group_notes WHERE org_id = :org_id AND priority = 'urgent'"),
        {"org_id": org},
    )
    urgent_count = r2.scalar() or 0

    # Distinct groups with notes
    r3 = await db.execute(
        text("SELECT COUNT(DISTINCT group_name) FROM group_notes WHERE org_id = :org_id"),
        {"org_id": org},
    )
    groups_with_notes = r3.scalar() or 0

    # Notes created today
    r4 = await db.execute(
        text("SELECT COUNT(*) FROM group_notes WHERE org_id = :org_id AND created_at::date = CURRENT_DATE"),
        {"org_id": org},
    )
    today_count = r4.scalar() or 0

    return {
        "total_notes": total_notes,
        "urgent_count": urgent_count,
        "groups_with_notes": groups_with_notes,
        "today_count": today_count,
    }
