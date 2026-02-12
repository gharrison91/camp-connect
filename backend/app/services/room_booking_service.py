"""
Camp Connect - Room Booking Service
Business logic for room/space booking management using raw SQL.
Tables: rooms, room_bookings.
"""

from __future__ import annotations

import json
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Table creation (idempotent)
# ---------------------------------------------------------------------------

_CREATE_ROOMS_TABLE = """
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'other',
    capacity INT NOT NULL DEFAULT 0,
    amenities JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""

_CREATE_ROOM_BOOKINGS_TABLE = """
CREATE TABLE IF NOT EXISTS room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    booked_by VARCHAR(255) NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_pattern VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def _ensure_tables(db: AsyncSession) -> None:
    """Create tables if they do not exist."""
    await db.execute(text(_CREATE_ROOMS_TABLE))
    await db.execute(text(_CREATE_ROOM_BOOKINGS_TABLE))
    await db.flush()


# ---------------------------------------------------------------------------
# Room CRUD
# ---------------------------------------------------------------------------


async def list_rooms(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    room_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List rooms for an organization with optional filters."""
    await _ensure_tables(db)
    q = "SELECT * FROM rooms WHERE org_id = :org_id"
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if room_type:
        q += " AND type = :room_type"
        params["room_type"] = room_type
    if is_active is not None:
        q += " AND is_active = :is_active"
        params["is_active"] = is_active
    if search:
        q += " AND name ILIKE :search"
        params["search"] = f"%{search}%"

    q += " ORDER BY name ASC"
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_room(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    room_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single room by ID."""
    await _ensure_tables(db)
    q = "SELECT * FROM rooms WHERE id = :room_id AND org_id = :org_id"
    result = await db.execute(text(q), {
        "room_id": str(room_id),
        "org_id": str(org_id),
    })
    row = result.first()
    return dict(row._mapping) if row else None


async def create_room(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new room."""
    await _ensure_tables(db)
    room_id = uuid.uuid4()
    amenities_json = json.dumps(data.get("amenities") or [])

    q = text("""
        INSERT INTO rooms (id, org_id, name, type, capacity, amenities, is_active)
        VALUES (:id, :org_id, :name, :type, :capacity, :amenities::jsonb, :is_active)
        RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(room_id),
        "org_id": str(org_id),
        "name": data["name"],
        "type": data.get("type", "other"),
        "capacity": data.get("capacity", 0),
        "amenities": amenities_json,
        "is_active": data.get("is_active", True),
    })
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else {}


async def update_room(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    room_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing room."""
    await _ensure_tables(db)

    # Build dynamic SET clause
    set_parts: List[str] = []
    params: Dict[str, Any] = {
        "room_id": str(room_id),
        "org_id": str(org_id),
    }

    if "name" in data:
        set_parts.append("name = :name")
        params["name"] = data["name"]
    if "type" in data:
        set_parts.append("type = :type")
        params["type"] = data["type"]
    if "capacity" in data:
        set_parts.append("capacity = :capacity")
        params["capacity"] = data["capacity"]
    if "amenities" in data:
        set_parts.append("amenities = :amenities::jsonb")
        params["amenities"] = json.dumps(data["amenities"] or [])
    if "is_active" in data:
        set_parts.append("is_active = :is_active")
        params["is_active"] = data["is_active"]

    if not set_parts:
        return await get_room(db, org_id=org_id, room_id=room_id)

    set_parts.append("updated_at = NOW()")
    set_clause = ", ".join(set_parts)

    q = text(f"""
        UPDATE rooms SET {set_clause}
        WHERE id = :room_id AND org_id = :org_id
        RETURNING *
    """)
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    return dict(row._mapping) if row else None


async def delete_room(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    room_id: uuid.UUID,
) -> bool:
    """Delete a room (hard delete, cascades to bookings)."""
    await _ensure_tables(db)
    q = text("DELETE FROM rooms WHERE id = :room_id AND org_id = :org_id")
    result = await db.execute(q, {
        "room_id": str(room_id),
        "org_id": str(org_id),
    })
    await db.commit()
    return (result.rowcount or 0) > 0


# ---------------------------------------------------------------------------
# Booking CRUD
# ---------------------------------------------------------------------------


async def list_bookings(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    room_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List bookings for an organization with optional filters."""
    await _ensure_tables(db)
    q = """
        SELECT rb.*,
               r.name AS room_name
        FROM room_bookings rb
        LEFT JOIN rooms r ON r.id = rb.room_id
        WHERE rb.org_id = :org_id
    """
    params: Dict[str, Any] = {"org_id": str(org_id)}

    if room_id:
        q += " AND rb.room_id = :room_id"
        params["room_id"] = str(room_id)
    if status:
        q += " AND rb.status = :status"
        params["status"] = status

    q += " ORDER BY rb.start_time DESC"
    result = await db.execute(text(q), params)
    return [dict(r._mapping) for r in result]


async def get_booking(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    booking_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single booking by ID."""
    await _ensure_tables(db)
    q = """
        SELECT rb.*,
               r.name AS room_name
        FROM room_bookings rb
        LEFT JOIN rooms r ON r.id = rb.room_id
        WHERE rb.id = :booking_id AND rb.org_id = :org_id
    """
    result = await db.execute(text(q), {
        "booking_id": str(booking_id),
        "org_id": str(org_id),
    })
    row = result.first()
    return dict(row._mapping) if row else None


async def create_booking(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new room booking with conflict detection."""
    await _ensure_tables(db)

    room_id_str = str(data["room_id"])
    start_time = data["start_time"]
    end_time = data["end_time"]

    # Check for overlapping non-cancelled bookings
    conflict_q = text("""
        SELECT COUNT(*) FROM room_bookings
        WHERE room_id = :room_id
          AND org_id = :org_id
          AND status != 'cancelled'
          AND start_time < :end_time
          AND end_time > :start_time
    """)
    conflict_result = await db.execute(conflict_q, {
        "room_id": room_id_str,
        "org_id": str(org_id),
        "start_time": start_time,
        "end_time": end_time,
    })
    conflict_count = conflict_result.scalar() or 0
    if conflict_count > 0:
        raise ValueError(
            "Time conflict: this room is already booked during the requested period."
        )

    booking_id = uuid.uuid4()
    q = text("""
        INSERT INTO room_bookings
            (id, org_id, room_id, booked_by, purpose, start_time, end_time,
             recurring, recurrence_pattern, status, notes)
        VALUES
            (:id, :org_id, :room_id, :booked_by, :purpose, :start_time, :end_time,
             :recurring, :recurrence_pattern, :status, :notes)
        RETURNING *
    """)
    result = await db.execute(q, {
        "id": str(booking_id),
        "org_id": str(org_id),
        "room_id": room_id_str,
        "booked_by": data["booked_by"],
        "purpose": data["purpose"],
        "start_time": start_time,
        "end_time": end_time,
        "recurring": data.get("recurring", False),
        "recurrence_pattern": data.get("recurrence_pattern"),
        "status": data.get("status", "confirmed"),
        "notes": data.get("notes"),
    })
    await db.commit()
    row = result.first()
    if not row:
        return {}

    booking_dict = dict(row._mapping)

    # Fetch room name
    name_result = await db.execute(
        text("SELECT name FROM rooms WHERE id = :room_id"),
        {"room_id": room_id_str},
    )
    name_row = name_result.first()
    booking_dict["room_name"] = name_row[0] if name_row else None

    return booking_dict


async def update_booking(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    booking_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing booking."""
    await _ensure_tables(db)

    set_parts: List[str] = []
    params: Dict[str, Any] = {
        "booking_id": str(booking_id),
        "org_id": str(org_id),
    }

    field_map = {
        "room_id": "room_id",
        "booked_by": "booked_by",
        "purpose": "purpose",
        "start_time": "start_time",
        "end_time": "end_time",
        "recurring": "recurring",
        "recurrence_pattern": "recurrence_pattern",
        "status": "status",
        "notes": "notes",
    }

    for key, col in field_map.items():
        if key in data:
            val = data[key]
            if key == "room_id" and val is not None:
                val = str(val)
            set_parts.append(f"{col} = :{key}")
            params[key] = val

    if not set_parts:
        return await get_booking(db, org_id=org_id, booking_id=booking_id)

    set_parts.append("updated_at = NOW()")
    set_clause = ", ".join(set_parts)

    q = text(f"""
        UPDATE room_bookings SET {set_clause}
        WHERE id = :booking_id AND org_id = :org_id
        RETURNING *
    """)
    result = await db.execute(q, params)
    await db.commit()
    row = result.first()
    if not row:
        return None

    booking_dict = dict(row._mapping)
    # Fetch room name
    rid = booking_dict.get("room_id")
    if rid:
        name_result = await db.execute(
            text("SELECT name FROM rooms WHERE id = :room_id"),
            {"room_id": str(rid)},
        )
        name_row = name_result.first()
        booking_dict["room_name"] = name_row[0] if name_row else None
    else:
        booking_dict["room_name"] = None

    return booking_dict


async def delete_booking(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
    booking_id: uuid.UUID,
) -> bool:
    """Delete a booking (hard delete)."""
    await _ensure_tables(db)
    q = text("DELETE FROM room_bookings WHERE id = :booking_id AND org_id = :org_id")
    result = await db.execute(q, {
        "booking_id": str(booking_id),
        "org_id": str(org_id),
    })
    await db.commit()
    return (result.rowcount or 0) > 0


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


async def get_stats(
    db: AsyncSession,
    *,
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Get aggregated room booking statistics."""
    await _ensure_tables(db)

    # Total rooms
    total_rooms_result = await db.execute(
        text("SELECT COUNT(*) FROM rooms WHERE org_id = :org_id"),
        {"org_id": str(org_id)},
    )
    total_rooms = total_rooms_result.scalar() or 0

    # Total non-cancelled bookings
    total_bookings_result = await db.execute(
        text("""
            SELECT COUNT(*) FROM room_bookings
            WHERE org_id = :org_id AND status != 'cancelled'
        """),
        {"org_id": str(org_id)},
    )
    total_bookings = total_bookings_result.scalar() or 0

    # Most booked room
    most_booked_result = await db.execute(
        text("""
            SELECT r.name, COUNT(rb.id) AS cnt
            FROM room_bookings rb
            JOIN rooms r ON r.id = rb.room_id
            WHERE rb.org_id = :org_id AND rb.status != 'cancelled'
            GROUP BY r.name
            ORDER BY cnt DESC
            LIMIT 1
        """),
        {"org_id": str(org_id)},
    )
    most_booked_row = most_booked_result.first()
    most_booked_room = most_booked_row[0] if most_booked_row else None

    # Utilization rate: % of rooms with at least 1 non-cancelled booking
    if total_rooms > 0:
        booked_rooms_result = await db.execute(
            text("""
                SELECT COUNT(DISTINCT room_id) FROM room_bookings
                WHERE org_id = :org_id AND status != 'cancelled'
            """),
            {"org_id": str(org_id)},
        )
        booked_count = booked_rooms_result.scalar() or 0
        utilization_rate = round((booked_count / total_rooms) * 100, 1)
    else:
        utilization_rate = 0.0

    return {
        "total_rooms": total_rooms,
        "total_bookings": total_bookings,
        "most_booked_room": most_booked_room,
        "utilization_rate": utilization_rate,
    }
