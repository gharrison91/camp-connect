"""
Camp Connect - Camp Session Service
"""

from uuid import uuid4
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def get_sessions(db: AsyncSession, org_id: str, status: str = None, search: str = None):
    where = "WHERE organization_id = :org"
    params: dict = {"org": org_id}
    if status:
        where += " AND status = :status"
        params["status"] = status
    if search:
        where += " AND LOWER(name) LIKE :q"
        params["q"] = f"%{search.lower()}%"
    rows = await db.execute(
        text(f"SELECT * FROM camp_sessions {where} ORDER BY start_date DESC"),
        params,
    )
    return [dict(r._mapping) for r in rows]


async def create_session(db: AsyncSession, org_id: str, data: dict):
    sid = str(uuid4())
    now = datetime.utcnow()
    await db.execute(
        text(
            "INSERT INTO camp_sessions (id, organization_id, name, description, start_date, end_date, "
            "capacity, price, age_min, age_max, status, enrolled_count, waitlist_count, created_at) "
            "VALUES (:id, :org, :name, :desc, :start, :end, :cap, :price, :amin, :amax, 'upcoming', 0, 0, :now)"
        ),
        {
            "id": sid, "org": org_id, "name": data["name"],
            "desc": data.get("description"), "start": data["start_date"],
            "end": data["end_date"], "cap": data.get("capacity", 50),
            "price": data.get("price"), "amin": data.get("age_min"),
            "amax": data.get("age_max"), "now": now,
        },
    )
    await db.commit()
    return {"id": sid, **data, "organization_id": org_id, "status": "upcoming",
            "enrolled_count": 0, "waitlist_count": 0, "created_at": now.isoformat()}


async def update_session(db: AsyncSession, org_id: str, session_id: str, data: dict):
    sets = []
    params: dict = {"org": org_id, "id": session_id}
    for k, v in data.items():
        if v is not None:
            sets.append(f"{k} = :{k}")
            params[k] = v
    if not sets:
        return
    await db.execute(
        text(f"UPDATE camp_sessions SET {', '.join(sets)} WHERE id = :id AND organization_id = :org"),
        params,
    )
    await db.commit()


async def delete_session(db: AsyncSession, org_id: str, session_id: str):
    await db.execute(
        text("DELETE FROM camp_sessions WHERE id = :id AND organization_id = :org"),
        {"id": session_id, "org": org_id},
    )
    await db.commit()


async def get_enrollments(db: AsyncSession, org_id: str, session_id: str):
    rows = await db.execute(
        text(
            "SELECT se.*, c.first_name || ' ' || c.last_name as camper_name "
            "FROM session_enrollments se "
            "JOIN campers c ON c.id = se.camper_id "
            "WHERE se.session_id = :sid ORDER BY se.enrolled_at"
        ),
        {"sid": session_id},
    )
    return [dict(r._mapping) for r in rows]


async def enroll_camper(db: AsyncSession, org_id: str, session_id: str, camper_id: str):
    eid = str(uuid4())
    now = datetime.utcnow()
    await db.execute(
        text(
            "INSERT INTO session_enrollments (id, session_id, camper_id, status, enrolled_at) "
            "VALUES (:id, :sid, :cid, 'enrolled', :now)"
        ),
        {"id": eid, "sid": session_id, "cid": camper_id, "now": now},
    )
    await db.execute(
        text("UPDATE camp_sessions SET enrolled_count = enrolled_count + 1 WHERE id = :sid"),
        {"sid": session_id},
    )
    await db.commit()
    return {"id": eid, "session_id": session_id, "camper_id": camper_id, "status": "enrolled", "enrolled_at": now.isoformat()}


async def unenroll(db: AsyncSession, org_id: str, enrollment_id: str):
    row = await db.execute(
        text("SELECT session_id FROM session_enrollments WHERE id = :id"),
        {"id": enrollment_id},
    )
    r = row.first()
    if r:
        await db.execute(text("DELETE FROM session_enrollments WHERE id = :id"), {"id": enrollment_id})
        await db.execute(
            text("UPDATE camp_sessions SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE id = :sid"),
            {"sid": str(r.session_id)},
        )
        await db.commit()


async def get_stats(db: AsyncSession, org_id: str):
    row = await db.execute(
        text(
            "SELECT COUNT(*) as total, "
            "SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active, "
            "SUM(enrolled_count) as enrolled, "
            "SUM(capacity) as capacity "
            "FROM camp_sessions WHERE organization_id = :org"
        ),
        {"org": org_id},
    )
    r = row.first()
    total = r.total or 0
    active = r.active or 0
    enrolled = r.enrolled or 0
    capacity = r.capacity or 1
    return {
        "total_sessions": total,
        "active_sessions": active,
        "total_enrolled": enrolled,
        "total_capacity": capacity,
        "occupancy_rate": round((enrolled / max(capacity, 1)) * 100, 1),
    }
