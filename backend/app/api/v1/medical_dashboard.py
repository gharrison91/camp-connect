from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ...database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/medical-dashboard", tags=["medical-dashboard"])


@router.get("")
async def get_medical_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get medical overview dashboard data"""
    org_id = str(current_user.organization_id)

    # Total campers
    total = await db.execute(
        text("SELECT COUNT(*) FROM campers WHERE organization_id = :org"),
        {"org": org_id},
    )
    total_campers = total.scalar() or 0

    # Campers with health forms
    forms = await db.execute(
        text(
            "SELECT COUNT(DISTINCT camper_id) FROM health_forms WHERE organization_id = :org"
        ),
        {"org": org_id},
    )
    with_forms = forms.scalar() or 0

    # Recent incidents (last 7 days)
    incidents_count = 0
    try:
        inc = await db.execute(
            text(
                "SELECT COUNT(*) FROM incidents WHERE organization_id = :org "
                "AND created_at >= CURRENT_DATE - INTERVAL '7 days'"
            ),
            {"org": org_id},
        )
        incidents_count = inc.scalar() or 0
    except Exception:
        pass

    # Medication logs (placeholder)
    active_medications = 0

    return {
        "total_campers": total_campers,
        "health_forms_completed": with_forms,
        "health_forms_pending": max(0, total_campers - with_forms),
        "recent_incidents": incidents_count,
        "active_medications": active_medications,
        "compliance_rate": round((with_forms / max(total_campers, 1)) * 100, 1),
    }


@router.get("/campers")
async def get_camper_health_list(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Search by name"),
    status: str = Query("all", description="Filter: all, complete, incomplete"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get list of campers with health status summary"""
    org_id = str(current_user.organization_id)
    offset = (page - 1) * per_page

    where_clause = "WHERE c.organization_id = :org"
    params: dict = {"org": org_id, "limit": per_page, "offset": offset}

    if search:
        where_clause += (
            " AND (LOWER(c.first_name) LIKE :q OR LOWER(c.last_name) LIKE :q)"
        )
        params["q"] = f"%{search.lower()}%"

    having_clause = ""
    if status == "complete":
        having_clause = "HAVING COUNT(hf.id) > 0"
    elif status == "incomplete":
        having_clause = "HAVING COUNT(hf.id) = 0"

    query = text(
        f"""
        SELECT c.id, c.first_name, c.last_name, c.date_of_birth, c.photo_url,
               c.allergies, c.medications, c.medical_notes,
               COUNT(hf.id) as form_count
        FROM campers c
        LEFT JOIN health_forms hf ON hf.camper_id = c.id
        {where_clause}
        GROUP BY c.id, c.first_name, c.last_name, c.date_of_birth, c.photo_url,
                 c.allergies, c.medications, c.medical_notes
        {having_clause}
        ORDER BY c.last_name, c.first_name
        LIMIT :limit OFFSET :offset
    """
    )

    rows = await db.execute(query, params)
    campers = [dict(r._mapping) for r in rows]

    if having_clause:
        count_query = text(
            f"""
            SELECT COUNT(*) FROM (
                SELECT c.id
                FROM campers c
                LEFT JOIN health_forms hf ON hf.camper_id = c.id
                {where_clause}
                GROUP BY c.id
                {having_clause}
            ) sub
        """
        )
    else:
        count_query = text(f"SELECT COUNT(*) FROM campers c {where_clause}")

    count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}
    total = (await db.execute(count_query, count_params)).scalar() or 0

    return {"items": campers, "total": total, "page": page, "per_page": per_page}
