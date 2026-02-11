"""
Camp Connect - Portal Dashboard API
Aggregated dashboard data for parent portal landing page.
"""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.portal_deps import get_portal_user
from app.database import get_db

router = APIRouter(prefix="/portal/dashboard", tags=["portal-dashboard"])


@router.get("")
async def get_portal_dashboard(
    db: AsyncSession = Depends(get_db),
    portal_user: Dict[str, Any] = Depends(get_portal_user),
):
    """Get aggregated dashboard data for parent portal."""
    org_id = str(portal_user["organization_id"])
    linked_camper_ids = portal_user["linked_camper_ids"]

    # Campers
    campers: List[Dict[str, Any]] = []
    if linked_camper_ids:
        id_params = {f"cid_{i}": str(cid) for i, cid in enumerate(linked_camper_ids)}
        id_placeholders = ", ".join(f":{k}" for k in id_params)
        campers_query = text(f"""
            SELECT c.id, c.first_name, c.last_name, c.date_of_birth, c.photo_url,
                   b.name as bunk_name
            FROM campers c
            LEFT JOIN bunk_assignments ba ON ba.camper_id = c.id
            LEFT JOIN bunks b ON b.id = ba.bunk_id
            WHERE c.id IN ({id_placeholders})
              AND c.organization_id = :org_id
              AND c.deleted_at IS NULL
            ORDER BY c.first_name
            LIMIT 10
        """)
        campers_result = await db.execute(
            campers_query, {**id_params, "org_id": org_id}
        )
        campers = [dict(row._mapping) for row in campers_result]

    # Upcoming Events
    events_query = text("""
        SELECT id, name, start_date, end_date, location
        FROM events
        WHERE organization_id = :org_id
          AND start_date >= CURRENT_DATE
          AND deleted_at IS NULL
        ORDER BY start_date
        LIMIT 5
    """)
    events_result = await db.execute(events_query, {"org_id": org_id})
    upcoming_events = [dict(row._mapping) for row in events_result]

    # Recent Photos Count
    recent_photos_count = 0
    try:
        photos_query = text("""
            SELECT COUNT(*) as count
            FROM photos
            WHERE organization_id = :org_id
              AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        """)
        photos_result = await db.execute(photos_query, {"org_id": org_id})
        recent_photos_count = photos_result.scalar() or 0
    except Exception:
        pass

    # Unread Messages Count
    unread_count = 0
    if linked_camper_ids:
        try:
            id_params_msg = {
                f"mid_{i}": str(cid) for i, cid in enumerate(linked_camper_ids)
            }
            msg_placeholders = ", ".join(f":{k}" for k in id_params_msg)
            messages_query = text(f"""
                SELECT COUNT(*) as count
                FROM camper_messages
                WHERE organization_id = :org_id
                  AND camper_id IN ({msg_placeholders})
                  AND direction = 'from_camp'
                  AND read_at IS NULL
            """)
            messages_result = await db.execute(
                messages_query, {**id_params_msg, "org_id": org_id}
            )
            unread_count = messages_result.scalar() or 0
        except Exception:
            pass

    # Announcements
    announcements: List[Dict[str, Any]] = []
    try:
        announcements_query = text("""
            SELECT id, subject, body, created_at
            FROM communications
            WHERE organization_id = :org_id
              AND channel = 'announcement'
            ORDER BY created_at DESC
            LIMIT 3
        """)
        ann_result = await db.execute(announcements_query, {"org_id": org_id})
        announcements = [dict(row._mapping) for row in ann_result]
    except Exception:
        pass

    return {
        "campers": campers,
        "upcoming_events": upcoming_events,
        "recent_photos_count": recent_photos_count,
        "unread_messages_count": unread_count,
        "announcements": announcements,
        "parent_first_name": portal_user["first_name"],
        "parent_last_name": portal_user["last_name"],
    }
