"""
Camp Connect - Announcement Service
Business logic for the announcement board, using raw SQL via text().
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table DDL (idempotent)
# ---------------------------------------------------------------------------

_CREATE_ANNOUNCEMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'general',
    priority VARCHAR(10) NOT NULL DEFAULT 'normal',
    author VARCHAR(255) NOT NULL,
    target_audience VARCHAR(20) NOT NULL DEFAULT 'all',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    """Create the announcements table if it does not exist (idempotent)."""
    await db.execute(text(_CREATE_ANNOUNCEMENTS_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


async def list_announcements(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    target_audience: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List announcements for an organization with optional filters."""
    await _ensure_table(db)

    q = "SELECT * FROM announcements WHERE org_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if category:
        q += " AND category = :category"
        params["category"] = category

    if priority:
        q += " AND priority = :priority"
        params["priority"] = priority

    if target_audience:
        q += " AND target_audience = :target_audience"
        params["target_audience"] = target_audience

    if search:
        q += " AND (LOWER(title) LIKE :search OR LOWER(content) LIKE :search)"
        params["search"] = f"%{search.lower()}%"

    # Pinned first, then by created_at descending
    q += " ORDER BY is_pinned DESC, created_at DESC"

    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_announcement(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    announcement_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single announcement by ID."""
    await _ensure_table(db)

    result = await db.execute(
        text(
            "SELECT * FROM announcements "
            "WHERE id = :id AND org_id = :org_id"
        ),
        {"id": str(announcement_id), "org_id": str(org_id)},
    )
    row = result.first()
    if not row:
        return None
    return dict(row._mapping)


async def create_announcement(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new announcement."""
    await _ensure_table(db)

    announcement_id = uuid.uuid4()

    q = text("""
        INSERT INTO announcements (
            id, org_id, title, content, category, priority,
            author, target_audience, is_pinned, expires_at
        ) VALUES (
            :id, :org_id, :title, :content, :category, :priority,
            :author, :target_audience, :is_pinned, :expires_at
        ) RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(announcement_id),
        "org_id": str(org_id),
        "title": data["title"],
        "content": data["content"],
        "category": data.get("category", "general"),
        "priority": data.get("priority", "normal"),
        "author": data["author"],
        "target_audience": data.get("target_audience", "all"),
        "is_pinned": data.get("is_pinned", False),
        "expires_at": data.get("expires_at"),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping)


async def update_announcement(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    announcement_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing announcement."""
    await _ensure_table(db)

    sets = ["updated_at = NOW()"]
    params: Dict[str, Any] = {
        "announcement_id": str(announcement_id),
        "org_id": str(org_id),
    }

    allowed_fields = [
        "title", "content", "category", "priority",
        "author", "target_audience", "is_pinned", "expires_at",
    ]
    for field in allowed_fields:
        if field in data:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]

    if len(sets) == 1:
        # Only updated_at -- nothing to change
        return await get_announcement(
            db, org_id=org_id, announcement_id=announcement_id
        )

    q = text(
        f"UPDATE announcements SET {', '.join(sets)} "
        f"WHERE id = :announcement_id AND org_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    if not row:
        return None
    return dict(row._mapping)


async def delete_announcement(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    announcement_id: uuid.UUID,
) -> bool:
    """Delete an announcement."""
    await _ensure_table(db)

    result = await db.execute(
        text(
            "DELETE FROM announcements "
            "WHERE id = :id AND org_id = :org_id"
        ),
        {"id": str(announcement_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Pin / Unpin
# ---------------------------------------------------------------------------


async def toggle_pin(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    announcement_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Toggle the pinned status of an announcement."""
    await _ensure_table(db)

    result = await db.execute(
        text(
            "UPDATE announcements "
            "SET is_pinned = NOT is_pinned, updated_at = NOW() "
            "WHERE id = :id AND org_id = :org_id RETURNING *"
        ),
        {"id": str(announcement_id), "org_id": str(org_id)},
    )
    await db.commit()
    row = result.first()
    if not row:
        return None
    return dict(row._mapping)


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


async def get_announcement_stats(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Aggregate announcement statistics for the organization."""
    await _ensure_table(db)

    org = str(org_id)

    # Total count
    total = await db.scalar(
        text("SELECT COUNT(*) FROM announcements WHERE org_id = :org_id"),
        {"org_id": org},
    ) or 0

    # Active (not expired)
    active = await db.scalar(
        text(
            "SELECT COUNT(*) FROM announcements "
            "WHERE org_id = :org_id "
            "AND (expires_at IS NULL OR expires_at > NOW())"
        ),
        {"org_id": org},
    ) or 0

    # Pinned count
    pinned = await db.scalar(
        text(
            "SELECT COUNT(*) FROM announcements "
            "WHERE org_id = :org_id AND is_pinned = TRUE"
        ),
        {"org_id": org},
    ) or 0

    # By category
    cat_result = await db.execute(
        text(
            "SELECT category, COUNT(*) AS cnt FROM announcements "
            "WHERE org_id = :org_id GROUP BY category"
        ),
        {"org_id": org},
    )
    by_category = {row.category: row.cnt for row in cat_result}

    # By priority
    pri_result = await db.execute(
        text(
            "SELECT priority, COUNT(*) AS cnt FROM announcements "
            "WHERE org_id = :org_id GROUP BY priority"
        ),
        {"org_id": org},
    )
    by_priority = {row.priority: row.cnt for row in pri_result}

    return {
        "total": total,
        "active": active,
        "pinned": pinned,
        "by_category": by_category,
        "by_priority": by_priority,
    }
