"""
Camp Connect - Feedback Service
Business logic for feedback collection CRUD and statistics.
Uses raw SQL via text() against the feedback_entries table.
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
CREATE TABLE IF NOT EXISTS feedback_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    submitted_by VARCHAR(255) NOT NULL,
    submitter_type VARCHAR(20) NOT NULL DEFAULT 'parent',
    category VARCHAR(20) NOT NULL DEFAULT 'general',
    rating INTEGER NOT NULL DEFAULT 3,
    title VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    response TEXT,
    responded_by VARCHAR(255),
    responded_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    """Create the feedback_entries table if it does not exist."""
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# List feedback entries
# ---------------------------------------------------------------------------

async def list_feedback(
    db: AsyncSession,
    org_id: uuid.UUID,
    *,
    category: Optional[str] = None,
    submitter_type: Optional[str] = None,
    status: Optional[str] = None,
    rating: Optional[int] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List feedback entries for an organization with optional filters."""
    await _ensure_table(db)
    q = "SELECT * FROM feedback_entries WHERE org_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if category:
        q += " AND category = :category"
        params["category"] = category
    if submitter_type:
        q += " AND submitter_type = :submitter_type"
        params["submitter_type"] = submitter_type
    if status:
        q += " AND status = :status"
        params["status"] = status
    if rating is not None:
        q += " AND rating = :rating"
        params["rating"] = rating
    if search:
        q += " AND (title ILIKE :search OR comment ILIKE :search OR submitted_by ILIKE :search)"
        params["search"] = f"%{search}%"

    q += " ORDER BY created_at DESC"
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


# ---------------------------------------------------------------------------
# Get single feedback entry
# ---------------------------------------------------------------------------

async def get_feedback(
    db: AsyncSession,
    org_id: uuid.UUID,
    feedback_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single feedback entry by ID."""
    await _ensure_table(db)
    q = "SELECT * FROM feedback_entries WHERE id = :feedback_id AND org_id = :org_id"
    result = await db.execute(text(q), {"feedback_id": str(feedback_id), "org_id": str(org_id)})
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Create feedback entry
# ---------------------------------------------------------------------------

async def create_feedback(
    db: AsyncSession,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new feedback entry."""
    await _ensure_table(db)
    feedback_id = uuid.uuid4()
    q = text("""
        INSERT INTO feedback_entries (
            id, org_id, submitted_by, submitter_type, category,
            rating, title, comment, is_anonymous, response,
            responded_by, responded_at, status
        ) VALUES (
            :id, :org_id, :submitted_by, :submitter_type, :category,
            :rating, :title, :comment, :is_anonymous, :response,
            :responded_by, :responded_at, :status
        ) RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(feedback_id),
        "org_id": str(org_id),
        "submitted_by": data["submitted_by"],
        "submitter_type": data.get("submitter_type", "parent"),
        "category": data.get("category", "general"),
        "rating": data["rating"],
        "title": data["title"],
        "comment": data["comment"],
        "is_anonymous": data.get("is_anonymous", False),
        "response": data.get("response"),
        "responded_by": data.get("responded_by"),
        "responded_at": data.get("responded_at"),
        "status": data.get("status", "new"),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping)


# ---------------------------------------------------------------------------
# Update feedback entry
# ---------------------------------------------------------------------------

async def update_feedback(
    db: AsyncSession,
    org_id: uuid.UUID,
    feedback_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing feedback entry."""
    await _ensure_table(db)
    fields = [
        "submitted_by", "submitter_type", "category", "rating",
        "title", "comment", "is_anonymous", "response",
        "responded_by", "responded_at", "status",
    ]
    sets = []
    params: Dict[str, Any] = {"feedback_id": str(feedback_id), "org_id": str(org_id)}
    for field in fields:
        if field in data and data[field] is not None:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]
    if not sets:
        return await get_feedback(db, org_id, feedback_id)

    sets.append("updated_at = NOW()")
    q = text(
        f"UPDATE feedback_entries SET {', '.join(sets)} "
        f"WHERE id = :feedback_id AND org_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Delete feedback entry
# ---------------------------------------------------------------------------

async def delete_feedback(
    db: AsyncSession,
    org_id: uuid.UUID,
    feedback_id: uuid.UUID,
) -> bool:
    """Delete a feedback entry."""
    await _ensure_table(db)
    result = await db.execute(
        text("DELETE FROM feedback_entries WHERE id = :feedback_id AND org_id = :org_id"),
        {"feedback_id": str(feedback_id), "org_id": str(org_id)},
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
    """Get feedback statistics for an organization."""
    await _ensure_table(db)
    org = str(org_id)

    # Total count
    r = await db.execute(
        text("SELECT COUNT(*) FROM feedback_entries WHERE org_id = :org_id"),
        {"org_id": org},
    )
    total = r.scalar() or 0

    # Average rating
    r = await db.execute(
        text("SELECT COALESCE(AVG(rating), 0) FROM feedback_entries WHERE org_id = :org_id"),
        {"org_id": org},
    )
    avg_rating = round(float(r.scalar() or 0), 1)

    # New count
    r = await db.execute(
        text("SELECT COUNT(*) FROM feedback_entries WHERE org_id = :org_id AND status = 'new'"),
        {"org_id": org},
    )
    new_count = r.scalar() or 0

    # By category
    r = await db.execute(
        text(
            "SELECT category, COUNT(*) AS cnt FROM feedback_entries "
            "WHERE org_id = :org_id GROUP BY category"
        ),
        {"org_id": org},
    )
    by_category = {row._mapping["category"]: row._mapping["cnt"] for row in r}

    # By submitter type
    r = await db.execute(
        text(
            "SELECT submitter_type, COUNT(*) AS cnt FROM feedback_entries "
            "WHERE org_id = :org_id GROUP BY submitter_type"
        ),
        {"org_id": org},
    )
    by_submitter_type = {row._mapping["submitter_type"]: row._mapping["cnt"] for row in r}

    return {
        "total": total,
        "avg_rating": avg_rating,
        "new_count": new_count,
        "by_category": by_category,
        "by_submitter_type": by_submitter_type,
    }
