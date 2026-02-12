"""
Camp Connect - Behavior Tracking Service
Business logic for behavior log CRUD and statistics.
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
CREATE TABLE IF NOT EXISTS behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    camper_id UUID NOT NULL,
    camper_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'concern',
    category VARCHAR(20) NOT NULL DEFAULT 'other',
    description TEXT NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'low',
    reported_by VARCHAR(255) NOT NULL,
    action_taken TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date VARCHAR(20),
    parent_notified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_table(db: AsyncSession) -> None:
    """Create the behavior_logs table if it does not exist."""
    await db.execute(text(_CREATE_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# List logs
# ---------------------------------------------------------------------------

async def list_logs(
    db: AsyncSession,
    org_id: uuid.UUID,
    *,
    type: Optional[str] = None,
    severity: Optional[str] = None,
    camper_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List behavior logs for an organization with optional filters."""
    await _ensure_table(db)
    q = "SELECT * FROM behavior_logs WHERE org_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if type:
        q += " AND type = :type"
        params["type"] = type
    if severity:
        q += " AND severity = :severity"
        params["severity"] = severity
    if camper_id:
        q += " AND camper_id = :camper_id"
        params["camper_id"] = str(camper_id)
    if search:
        q += " AND (description ILIKE :search OR camper_name ILIKE :search OR reported_by ILIKE :search)"
        params["search"] = f"%{search}%"

    q += " ORDER BY created_at DESC"
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


# ---------------------------------------------------------------------------
# Get single log
# ---------------------------------------------------------------------------

async def get_log(
    db: AsyncSession,
    org_id: uuid.UUID,
    log_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single behavior log by ID."""
    await _ensure_table(db)
    q = "SELECT * FROM behavior_logs WHERE id = :log_id AND org_id = :org_id"
    result = await db.execute(text(q), {"log_id": str(log_id), "org_id": str(org_id)})
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Create log
# ---------------------------------------------------------------------------

async def create_log(
    db: AsyncSession,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new behavior log entry."""
    await _ensure_table(db)
    log_id = uuid.uuid4()
    q = text("""
        INSERT INTO behavior_logs (
            id, org_id, camper_id, camper_name, type, category,
            description, severity, reported_by, action_taken,
            follow_up_required, follow_up_date, parent_notified, notes
        ) VALUES (
            :id, :org_id, :camper_id, :camper_name, :type, :category,
            :description, :severity, :reported_by, :action_taken,
            :follow_up_required, :follow_up_date, :parent_notified, :notes
        ) RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(log_id),
        "org_id": str(org_id),
        "camper_id": str(data["camper_id"]),
        "camper_name": data["camper_name"],
        "type": data.get("type", "concern"),
        "category": data.get("category", "other"),
        "description": data["description"],
        "severity": data.get("severity", "low"),
        "reported_by": data["reported_by"],
        "action_taken": data.get("action_taken"),
        "follow_up_required": data.get("follow_up_required", False),
        "follow_up_date": data.get("follow_up_date"),
        "parent_notified": data.get("parent_notified", False),
        "notes": data.get("notes"),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping)


# ---------------------------------------------------------------------------
# Update log
# ---------------------------------------------------------------------------

async def update_log(
    db: AsyncSession,
    org_id: uuid.UUID,
    log_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing behavior log entry."""
    await _ensure_table(db)
    fields = [
        "camper_id", "camper_name", "type", "category", "description",
        "severity", "reported_by", "action_taken", "follow_up_required",
        "follow_up_date", "parent_notified", "notes",
    ]
    sets = []
    params: Dict[str, Any] = {"log_id": str(log_id), "org_id": str(org_id)}
    for field in fields:
        if field in data and data[field] is not None:
            val = data[field]
            if field == "camper_id":
                val = str(val)
            sets.append(f"{field} = :{field}")
            params[field] = val
    if not sets:
        return await get_log(db, org_id, log_id)

    sets.append("updated_at = NOW()")
    q = text(
        f"UPDATE behavior_logs SET {', '.join(sets)} "
        f"WHERE id = :log_id AND org_id = :org_id RETURNING *"
    )
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


# ---------------------------------------------------------------------------
# Delete log
# ---------------------------------------------------------------------------

async def delete_log(
    db: AsyncSession,
    org_id: uuid.UUID,
    log_id: uuid.UUID,
) -> bool:
    """Delete a behavior log entry."""
    await _ensure_table(db)
    result = await db.execute(
        text("DELETE FROM behavior_logs WHERE id = :log_id AND org_id = :org_id"),
        {"log_id": str(log_id), "org_id": str(org_id)},
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
    """Get behavior log statistics for an organization."""
    await _ensure_table(db)
    org = str(org_id)

    # Total
    r = await db.execute(
        text("SELECT COUNT(*) FROM behavior_logs WHERE org_id = :org_id"),
        {"org_id": org},
    )
    total_logs = r.scalar() or 0

    # By type
    r = await db.execute(
        text("SELECT COUNT(*) FROM behavior_logs WHERE org_id = :org_id AND type = 'positive'"),
        {"org_id": org},
    )
    positive = r.scalar() or 0

    r = await db.execute(
        text("SELECT COUNT(*) FROM behavior_logs WHERE org_id = :org_id AND type = 'concern'"),
        {"org_id": org},
    )
    concerns = r.scalar() or 0

    r = await db.execute(
        text("SELECT COUNT(*) FROM behavior_logs WHERE org_id = :org_id AND type = 'incident'"),
        {"org_id": org},
    )
    incidents = r.scalar() or 0

    # Follow-ups pending
    r = await db.execute(
        text(
            "SELECT COUNT(*) FROM behavior_logs "
            "WHERE org_id = :org_id AND follow_up_required = TRUE"
        ),
        {"org_id": org},
    )
    follow_ups_pending = r.scalar() or 0

    # By severity
    r = await db.execute(
        text(
            "SELECT severity, COUNT(*) AS cnt FROM behavior_logs "
            "WHERE org_id = :org_id GROUP BY severity"
        ),
        {"org_id": org},
    )
    by_severity = {row._mapping["severity"]: row._mapping["cnt"] for row in r}

    return {
        "total_logs": total_logs,
        "positive": positive,
        "concerns": concerns,
        "incidents": incidents,
        "follow_ups_pending": follow_ups_pending,
        "by_severity": by_severity,
    }
