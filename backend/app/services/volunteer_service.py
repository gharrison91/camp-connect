"""
Camp Connect - Volunteer Service
Business logic for volunteer management and shift scheduling.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional


# In-memory stores keyed by org_id
_volunteers: Dict[str, List[Dict[str, Any]]] = {}
_shifts: Dict[str, List[Dict[str, Any]]] = {}


def _org_key(org_id: uuid.UUID) -> str:
    return str(org_id)


# ── Volunteers ─────────────────────────────────────────────────────

async def list_volunteers(
    org_id: uuid.UUID,
    *,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    items = _volunteers.get(key, [])
    if status:
        items = [v for v in items if v["status"] == status]
    if search:
        q = search.lower()
        items = [
            v for v in items
            if q in v["first_name"].lower()
            or q in v["last_name"].lower()
            or q in v["email"].lower()
        ]
    return items


async def get_volunteer(org_id: uuid.UUID, volunteer_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for v in _volunteers.get(key, []):
        if v["id"] == volunteer_id:
            return v
    return None


async def create_volunteer(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    key = _org_key(org_id)
    if key not in _volunteers:
        _volunteers[key] = []
    volunteer = {
        "id": uuid.uuid4(),
        "org_id": org_id,
        **data,
        "created_at": datetime.utcnow(),
    }
    _volunteers[key].append(volunteer)
    return volunteer


async def update_volunteer(
    org_id: uuid.UUID, volunteer_id: uuid.UUID, data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for v in _volunteers.get(key, []):
        if v["id"] == volunteer_id:
            for k, val in data.items():
                v[k] = val
            return v
    return None


async def delete_volunteer(org_id: uuid.UUID, volunteer_id: uuid.UUID) -> bool:
    key = _org_key(org_id)
    vols = _volunteers.get(key, [])
    for i, v in enumerate(vols):
        if v["id"] == volunteer_id:
            vols.pop(i)
            return True
    return False


async def log_hours(
    org_id: uuid.UUID, volunteer_id: uuid.UUID, hours: float,
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for v in _volunteers.get(key, []):
        if v["id"] == volunteer_id:
            v["hours_logged"] = v.get("hours_logged", 0.0) + hours
            return v
    return None


async def get_volunteer_stats(org_id: uuid.UUID) -> Dict[str, Any]:
    key = _org_key(org_id)
    vols = _volunteers.get(key, [])
    shifts = _shifts.get(key, [])
    active = sum(1 for v in vols if v["status"] == "active")
    pending = sum(1 for v in vols if v["status"] == "pending")
    cleared = sum(1 for v in vols if v.get("background_check_status") == "cleared")
    total_hours = sum(v.get("hours_logged", 0.0) for v in vols)
    upcoming_shifts = sum(1 for s in shifts if s["status"] == "scheduled")
    completed_shifts = sum(1 for s in shifts if s["status"] == "completed")
    return {
        "total_volunteers": len(vols),
        "active": active,
        "pending": pending,
        "background_cleared": cleared,
        "total_hours": total_hours,
        "upcoming_shifts": upcoming_shifts,
        "completed_shifts": completed_shifts,
    }


# ── Shifts ─────────────────────────────────────────────────────────

async def list_shifts(
    org_id: uuid.UUID,
    *,
    volunteer_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    items = _shifts.get(key, [])
    if volunteer_id:
        items = [s for s in items if s["volunteer_id"] == volunteer_id]
    if status:
        items = [s for s in items if s["status"] == status]
    if date_from:
        items = [s for s in items if str(s["date"]) >= date_from]
    if date_to:
        items = [s for s in items if str(s["date"]) <= date_to]
    return items


async def create_shift(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    key = _org_key(org_id)
    if key not in _shifts:
        _shifts[key] = []
    shift = {
        "id": uuid.uuid4(),
        "org_id": org_id,
        **data,
        "created_at": datetime.utcnow(),
    }
    _shifts[key].append(shift)
    return shift


async def update_shift(
    org_id: uuid.UUID, shift_id: uuid.UUID, data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for s in _shifts.get(key, []):
        if s["id"] == shift_id:
            for k, val in data.items():
                s[k] = val
            return s
    return None


async def delete_shift(org_id: uuid.UUID, shift_id: uuid.UUID) -> bool:
    key = _org_key(org_id)
    shifts = _shifts.get(key, [])
    for i, s in enumerate(shifts):
        if s["id"] == shift_id:
            shifts.pop(i)
            return True
    return False


async def get_shift_schedule(
    org_id: uuid.UUID, week_start: str, week_end: str,
) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    items = _shifts.get(key, [])
    return [
        s for s in items
        if str(s["date"]) >= week_start and str(s["date"]) <= week_end
    ]
