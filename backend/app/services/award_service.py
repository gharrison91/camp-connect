"""
Camp Connect - Award Service
Business logic for the awards & achievements gamification system.
"""

from __future__ import annotations

import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# In-memory store (no new DB tables required)
# We store badges and grants in two simple tables keyed by org_id.
# This uses raw SQL against two lightweight tables:
#   award_badges  and  award_grants
# For production these would be created via Alembic migration.
# ---------------------------------------------------------------------------

_CREATE_BADGES_TABLE = """
CREATE TABLE IF NOT EXISTS award_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '⭐',
    color VARCHAR(20) DEFAULT '#F59E0B',
    category VARCHAR(20) DEFAULT 'achievement',
    points INTEGER DEFAULT 10,
    criteria TEXT,
    max_awards_per_session INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

_CREATE_GRANTS_TABLE = """
CREATE TABLE IF NOT EXISTS award_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    badge_id UUID NOT NULL REFERENCES award_badges(id) ON DELETE CASCADE,
    camper_id UUID NOT NULL,
    granted_by UUID NOT NULL,
    reason TEXT,
    granted_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_tables(db: AsyncSession) -> None:
    """Create tables if they don't exist (idempotent)."""
    await db.execute(text(_CREATE_BADGES_TABLE))
    await db.execute(text(_CREATE_GRANTS_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# Badge CRUD
# ---------------------------------------------------------------------------

async def get_badges(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List all badges for an organization, with award counts."""
    await _ensure_tables(db)
    q = """
        SELECT b.*,
               COALESCE(g.cnt, 0) AS times_awarded
        FROM award_badges b
        LEFT JOIN (
            SELECT badge_id, COUNT(*) AS cnt FROM award_grants GROUP BY badge_id
        ) g ON g.badge_id = b.id
        WHERE b.org_id = :org_id
    """
    params: Dict[str, Any] = {"org_id": str(org_id)}
    if category:
        q += " AND b.category = :category"
        params["category"] = category
    q += " ORDER BY b.created_at DESC"
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_badge(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    badge_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    await _ensure_tables(db)
    q = """
        SELECT b.*,
               COALESCE(g.cnt, 0) AS times_awarded
        FROM award_badges b
        LEFT JOIN (
            SELECT badge_id, COUNT(*) AS cnt FROM award_grants GROUP BY badge_id
        ) g ON g.badge_id = b.id
        WHERE b.id = :badge_id AND b.org_id = :org_id
    """
    result = await db.execute(text(q), {"badge_id": str(badge_id), "org_id": str(org_id)})
    row = result.first()
    return dict(row._mapping) if row else None


async def create_badge(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    await _ensure_tables(db)
    badge_id = uuid.uuid4()
    q = text("""
        INSERT INTO award_badges (id, org_id, name, description, icon, color, category, points, criteria, max_awards_per_session)
        VALUES (:id, :org_id, :name, :description, :icon, :color, :category, :points, :criteria, :max_awards_per_session)
        RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(badge_id),
        "org_id": str(org_id),
        "name": data["name"],
        "description": data.get("description"),
        "icon": data.get("icon", "⭐"),
        "color": data.get("color", "#F59E0B"),
        "category": data.get("category", "achievement"),
        "points": data.get("points", 10),
        "criteria": data.get("criteria"),
        "max_awards_per_session": data.get("max_awards_per_session"),
    })
    await db.commit()
    row = result.first()
    d = dict(row._mapping)
    d["times_awarded"] = 0
    return d


async def update_badge(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    badge_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    await _ensure_tables(db)
    sets = []
    params: Dict[str, Any] = {"badge_id": str(badge_id), "org_id": str(org_id)}
    for field in ["name", "description", "icon", "color", "category", "points", "criteria", "max_awards_per_session"]:
        if field in data and data[field] is not None:
            sets.append(f"{field} = :{field}")
            params[field] = data[field]
    if not sets:
        return await get_badge(db, org_id=org_id, badge_id=badge_id)
    q = text(f"UPDATE award_badges SET {', '.join(sets)} WHERE id = :badge_id AND org_id = :org_id RETURNING *")
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    if not row:
        return None
    return dict(row._mapping)


async def delete_badge(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    badge_id: uuid.UUID,
) -> bool:
    await _ensure_tables(db)
    result = await db.execute(
        text("DELETE FROM award_badges WHERE id = :badge_id AND org_id = :org_id"),
        {"badge_id": str(badge_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Grants
# ---------------------------------------------------------------------------

async def grant_award(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    badge_id: uuid.UUID,
    camper_id: uuid.UUID,
    granted_by: uuid.UUID,
    reason: Optional[str] = None,
) -> Dict[str, Any]:
    """Grant a badge to a camper. Returns the grant with badge + camper info."""
    await _ensure_tables(db)
    grant_id = uuid.uuid4()
    await db.execute(text("""
        INSERT INTO award_grants (id, org_id, badge_id, camper_id, granted_by, reason)
        VALUES (:id, :org_id, :badge_id, :camper_id, :granted_by, :reason)
    """), {
        "id": str(grant_id),
        "org_id": str(org_id),
        "badge_id": str(badge_id),
        "camper_id": str(camper_id),
        "granted_by": str(granted_by),
        "reason": reason,
    })
    await db.commit()
    return await _get_grant_with_details(db, grant_id)


async def revoke_award(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    grant_id: uuid.UUID,
) -> bool:
    await _ensure_tables(db)
    result = await db.execute(
        text("DELETE FROM award_grants WHERE id = :grant_id AND org_id = :org_id"),
        {"grant_id": str(grant_id), "org_id": str(org_id)},
    )
    await db.commit()
    return result.rowcount > 0


async def get_camper_awards(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    camper_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    await _ensure_tables(db)
    q = text("""
        SELECT g.id, g.badge_id, b.name AS badge_name, b.icon AS badge_icon, b.color AS badge_color,
               g.camper_id, COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name,
               g.granted_by, COALESCE(u.full_name, 'Staff') AS granted_by_name,
               g.reason, g.granted_at
        FROM award_grants g
        JOIN award_badges b ON b.id = g.badge_id
        LEFT JOIN campers c ON c.id = g.camper_id
        LEFT JOIN users u ON u.id = g.granted_by
        WHERE g.org_id = :org_id AND g.camper_id = :camper_id
        ORDER BY g.granted_at DESC
    """)
    result = await db.execute(q, {"org_id": str(org_id), "camper_id": str(camper_id)})
    return [dict(r._mapping) for r in result]


async def get_award_summary(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    camper_id: uuid.UUID,
) -> Dict[str, Any]:
    awards = await get_camper_awards(db, org_id=org_id, camper_id=camper_id)
    total_points = 0
    for a in awards:
        badge = await get_badge(db, org_id=org_id, badge_id=a["badge_id"])
        if badge:
            total_points += badge.get("points", 0)
    camper_name = awards[0]["camper_name"] if awards else "Unknown"
    return {
        "camper_id": camper_id,
        "camper_name": camper_name,
        "total_points": total_points,
        "badges": awards,
        "recent_awards": awards[:5],
    }


async def get_leaderboard(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    limit: int = 20,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    await _ensure_tables(db)
    cat_filter = ""
    params: Dict[str, Any] = {"org_id": str(org_id), "lim": limit}
    if category:
        cat_filter = "AND b.category = :category"
        params["category"] = category
    q = text(f"""
        SELECT g.camper_id,
               COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name,
               COALESCE(SUM(b.points), 0) AS total_points,
               COUNT(g.id) AS badge_count
        FROM award_grants g
        JOIN award_badges b ON b.id = g.badge_id
        LEFT JOIN campers c ON c.id = g.camper_id
        WHERE g.org_id = :org_id {cat_filter}
        GROUP BY g.camper_id, c.first_name, c.last_name
        ORDER BY total_points DESC, badge_count DESC
        LIMIT :lim
    """)
    result = await db.execute(q, params)
    rows = [dict(r._mapping) for r in result]
    for i, row in enumerate(rows):
        row["rank"] = i + 1
    return rows


async def get_recent_awards(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    await _ensure_tables(db)
    q = text("""
        SELECT g.id, g.badge_id, b.name AS badge_name, b.icon AS badge_icon, b.color AS badge_color,
               g.camper_id, COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name,
               g.granted_by, COALESCE(u.full_name, 'Staff') AS granted_by_name,
               g.reason, g.granted_at
        FROM award_grants g
        JOIN award_badges b ON b.id = g.badge_id
        LEFT JOIN campers c ON c.id = g.camper_id
        LEFT JOIN users u ON u.id = g.granted_by
        WHERE g.org_id = :org_id
        ORDER BY g.granted_at DESC
        LIMIT :lim
    """)
    result = await db.execute(q, {"org_id": str(org_id), "lim": limit})
    return [dict(r._mapping) for r in result]


async def get_badge_recipients(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    badge_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    await _ensure_tables(db)
    q = text("""
        SELECT g.id, g.badge_id, b.name AS badge_name, b.icon AS badge_icon, b.color AS badge_color,
               g.camper_id, COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name,
               g.granted_by, COALESCE(u.full_name, 'Staff') AS granted_by_name,
               g.reason, g.granted_at
        FROM award_grants g
        JOIN award_badges b ON b.id = g.badge_id
        LEFT JOIN campers c ON c.id = g.camper_id
        LEFT JOIN users u ON u.id = g.granted_by
        WHERE g.org_id = :org_id AND g.badge_id = :badge_id
        ORDER BY g.granted_at DESC
    """)
    result = await db.execute(q, {"org_id": str(org_id), "badge_id": str(badge_id)})
    return [dict(r._mapping) for r in result]


async def get_award_stats(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    await _ensure_tables(db)
    # Total grants
    r1 = await db.execute(
        text("SELECT COUNT(*) FROM award_grants WHERE org_id = :org_id"),
        {"org_id": str(org_id)},
    )
    total_awards = r1.scalar() or 0

    # Active badges
    r2 = await db.execute(
        text("SELECT COUNT(*) FROM award_badges WHERE org_id = :org_id"),
        {"org_id": str(org_id)},
    )
    active_badges = r2.scalar() or 0

    # Most popular badge
    r3 = await db.execute(text("""
        SELECT b.name, COUNT(g.id) AS cnt
        FROM award_grants g
        JOIN award_badges b ON b.id = g.badge_id
        WHERE g.org_id = :org_id
        GROUP BY b.name
        ORDER BY cnt DESC LIMIT 1
    """), {"org_id": str(org_id)})
    pop = r3.first()
    most_popular = pop._mapping["name"] if pop else None

    # Top earner
    leaders = await get_leaderboard(db, org_id=org_id, limit=1)
    top_name = leaders[0]["camper_name"] if leaders else None
    top_points = leaders[0]["total_points"] if leaders else 0

    return {
        "total_awards_given": total_awards,
        "active_badges": active_badges,
        "most_popular_badge": most_popular,
        "top_earner_name": top_name,
        "top_earner_points": top_points,
    }


async def _get_grant_with_details(db: AsyncSession, grant_id: uuid.UUID) -> Dict[str, Any]:
    q = text("""
        SELECT g.id, g.badge_id, b.name AS badge_name, b.icon AS badge_icon, b.color AS badge_color,
               g.camper_id, COALESCE(c.first_name || ' ' || c.last_name, 'Unknown') AS camper_name,
               g.granted_by, COALESCE(u.full_name, 'Staff') AS granted_by_name,
               g.reason, g.granted_at
        FROM award_grants g
        JOIN award_badges b ON b.id = g.badge_id
        LEFT JOIN campers c ON c.id = g.camper_id
        LEFT JOIN users u ON u.id = g.granted_by
        WHERE g.id = :grant_id
    """)
    result = await db.execute(q, {"grant_id": str(grant_id)})
    row = result.first()
    return dict(row._mapping) if row else {}
