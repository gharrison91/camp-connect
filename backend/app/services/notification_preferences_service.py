"""
Camp Connect - Notification Preferences Service
Manages per-user notification preference settings.
"""

from __future__ import annotations

import json
import logging
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Default notification categories
# ---------------------------------------------------------------------------

DEFAULT_CATEGORIES: List[Dict[str, Any]] = [
    {
        "category": "events",
        "label": "Event Updates",
        "description": "New events, changes, and reminders",
        "channels": {"email": True, "in_app": True, "push": False},
    },
    {
        "category": "registrations",
        "label": "Registration Updates",
        "description": "Registration confirmations and waitlist changes",
        "channels": {"email": True, "in_app": True, "push": False},
    },
    {
        "category": "messages",
        "label": "Messages",
        "description": "Direct messages and announcements",
        "channels": {"email": True, "in_app": True, "push": True},
    },
    {
        "category": "health",
        "label": "Health & Safety",
        "description": "Health form updates and incident reports",
        "channels": {"email": True, "in_app": True, "push": True},
    },
    {
        "category": "payments",
        "label": "Payments",
        "description": "Payment receipts, due dates, and reminders",
        "channels": {"email": True, "in_app": True, "push": False},
    },
    {
        "category": "photos",
        "label": "Photos",
        "description": "New photo uploads and tagged photos",
        "channels": {"email": False, "in_app": True, "push": False},
    },
    {
        "category": "schedule",
        "label": "Schedule",
        "description": "Schedule changes and activity updates",
        "channels": {"email": True, "in_app": True, "push": False},
    },
    {
        "category": "staff",
        "label": "Staff",
        "description": "Staff assignments and shift changes",
        "channels": {"email": True, "in_app": True, "push": False},
    },
    {
        "category": "system",
        "label": "System",
        "description": "Account security and system updates",
        "channels": {"email": True, "in_app": True, "push": False},
    },
]


def get_default_preferences() -> List[Dict[str, Any]]:
    """Return the full list of notification categories with defaults."""
    return [dict(cat) for cat in DEFAULT_CATEGORIES]


async def get_preferences(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Return current preferences for a user, with defaults if none saved."""
    result = await db.execute(
        text(
            """
            SELECT preferences, quiet_hours_enabled, quiet_hours_start,
                   quiet_hours_end, digest_frequency
            FROM notification_preferences
            WHERE user_id = :user_id AND organization_id = :org_id
            """
        ),
        {"user_id": str(user_id), "org_id": str(org_id)},
    )
    row = result.first()

    defaults = get_default_preferences()

    if row is None:
        return {
            "user_id": user_id,
            "preferences": defaults,
            "quiet_hours_enabled": False,
            "quiet_hours_start": None,
            "quiet_hours_end": None,
            "digest_frequency": "instant",
        }

    # Merge saved preferences with defaults (in case new categories were added)
    saved_prefs_raw = row[0] if row[0] else []
    if isinstance(saved_prefs_raw, str):
        saved_prefs_raw = json.loads(saved_prefs_raw)

    saved_map: Dict[str, Dict[str, Any]] = {}
    for sp in saved_prefs_raw:
        saved_map[sp["category"]] = sp

    merged: List[Dict[str, Any]] = []
    for default_cat in defaults:
        if default_cat["category"] in saved_map:
            saved = saved_map[default_cat["category"]]
            merged.append(
                {
                    "category": default_cat["category"],
                    "label": default_cat["label"],
                    "description": default_cat["description"],
                    "channels": saved.get("channels", default_cat["channels"]),
                }
            )
        else:
            merged.append(default_cat)

    return {
        "user_id": user_id,
        "preferences": merged,
        "quiet_hours_enabled": bool(row[1]) if row[1] is not None else False,
        "quiet_hours_start": row[2],
        "quiet_hours_end": row[3],
        "digest_frequency": row[4] or "instant",
    }


async def update_preferences(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Upsert notification preferences for a user."""
    # Check if record exists
    result = await db.execute(
        text(
            """
            SELECT id FROM notification_preferences
            WHERE user_id = :user_id AND organization_id = :org_id
            """
        ),
        {"user_id": str(user_id), "org_id": str(org_id)},
    )
    existing = result.first()

    prefs_json = json.dumps(data.get("preferences", []))
    quiet_enabled = data.get("quiet_hours_enabled")
    quiet_start = data.get("quiet_hours_start")
    quiet_end = data.get("quiet_hours_end")
    digest = data.get("digest_frequency")

    if existing:
        # Build dynamic SET clause for non-None fields
        set_parts = []
        params: Dict[str, Any] = {
            "user_id": str(user_id),
            "org_id": str(org_id),
        }

        if data.get("preferences") is not None:
            set_parts.append("preferences = :prefs::jsonb")
            params["prefs"] = prefs_json

        if quiet_enabled is not None:
            set_parts.append("quiet_hours_enabled = :qe")
            params["qe"] = quiet_enabled

        if quiet_start is not None:
            set_parts.append("quiet_hours_start = :qs")
            params["qs"] = quiet_start

        if quiet_end is not None:
            set_parts.append("quiet_hours_end = :qend")
            params["qend"] = quiet_end

        if digest is not None:
            set_parts.append("digest_frequency = :df")
            params["df"] = digest

        if set_parts:
            set_parts.append("updated_at = now()")
            query = f"""
                UPDATE notification_preferences
                SET {', '.join(set_parts)}
                WHERE user_id = :user_id AND organization_id = :org_id
            """
            await db.execute(text(query), params)
    else:
        await db.execute(
            text(
                """
                INSERT INTO notification_preferences
                    (id, user_id, organization_id, preferences,
                     quiet_hours_enabled, quiet_hours_start, quiet_hours_end,
                     digest_frequency, created_at, updated_at)
                VALUES
                    (:id, :user_id, :org_id, :prefs::jsonb,
                     :qe, :qs, :qend, :df, now(), now())
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "user_id": str(user_id),
                "org_id": str(org_id),
                "prefs": prefs_json,
                "qe": quiet_enabled if quiet_enabled is not None else False,
                "qs": quiet_start,
                "qend": quiet_end,
                "df": digest or "instant",
            },
        )

    await db.commit()
    return await get_preferences(db, user_id=user_id, org_id=org_id)


async def reset_preferences(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Delete saved preferences so defaults are returned."""
    await db.execute(
        text(
            """
            DELETE FROM notification_preferences
            WHERE user_id = :user_id AND organization_id = :org_id
            """
        ),
        {"user_id": str(user_id), "org_id": str(org_id)},
    )
    await db.commit()
    return await get_preferences(db, user_id=user_id, org_id=org_id)
