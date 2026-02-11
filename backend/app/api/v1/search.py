"""
Camp Connect – Global Search API
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ...database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def global_search(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Search across campers, staff, events, contacts."""
    org_id = str(current_user.organization_id)
    term = f"%{q.lower()}%"

    results: list[dict] = []

    # Campers
    rows = await db.execute(
        text(
            "SELECT id, first_name, last_name FROM campers "
            "WHERE organization_id = :org AND (LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q) "
            "LIMIT 5"
        ),
        {"org": org_id, "q": term},
    )
    for r in rows:
        results.append(
            {
                "id": str(r.id),
                "type": "camper",
                "title": f"{r.first_name} {r.last_name}",
                "subtitle": "Camper",
                "path": f"/app/campers/{r.id}",
            }
        )

    # Staff / employees
    try:
        rows = await db.execute(
            text(
                "SELECT e.id, u.first_name, u.last_name FROM employees e "
                "JOIN users u ON e.user_id = u.id "
                "WHERE e.organization_id = :org "
                "AND (LOWER(u.first_name) LIKE :q OR LOWER(u.last_name) LIKE :q) "
                "LIMIT 5"
            ),
            {"org": org_id, "q": term},
        )
        for r in rows:
            results.append(
                {
                    "id": str(r.id),
                    "type": "staff",
                    "title": f"{r.first_name} {r.last_name}",
                    "subtitle": "Staff",
                    "path": f"/app/staff/{r.id}",
                }
            )
    except Exception:
        pass

    # Events
    try:
        rows = await db.execute(
            text(
                "SELECT id, name FROM events "
                "WHERE organization_id = :org AND LOWER(name) LIKE :q "
                "ORDER BY start_date DESC LIMIT 5"
            ),
            {"org": org_id, "q": term},
        )
        for r in rows:
            results.append(
                {
                    "id": str(r.id),
                    "type": "event",
                    "title": r.name,
                    "subtitle": "Event",
                    "path": f"/app/events/{r.id}",
                }
            )
    except Exception:
        pass

    # Contacts
    try:
        rows = await db.execute(
            text(
                "SELECT id, first_name, last_name, email FROM contacts "
                "WHERE organization_id = :org "
                "AND (LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q OR LOWER(email) LIKE :q) "
                "LIMIT 5"
            ),
            {"org": org_id, "q": term},
        )
        for r in rows:
            results.append(
                {
                    "id": str(r.id),
                    "type": "contact",
                    "title": f"{r.first_name} {r.last_name}",
                    "subtitle": r.email or "Contact",
                    "path": f"/app/contacts/{r.id}",
                }
            )
    except Exception:
        pass

    return results
