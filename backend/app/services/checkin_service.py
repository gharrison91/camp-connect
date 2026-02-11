"""
Camp Connect - Check-In / Check-Out Service
Business logic for daily camper check-in and check-out tracking.
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from datetime import date, datetime
from typing import Any, Dict, List, Optional


# In-memory store keyed by org_id
_records: Dict[uuid.UUID, List[Dict[str, Any]]] = defaultdict(list)

# Simulated roster of campers per org (for pending calculation)
_DEMO_CAMPERS: List[Dict[str, Any]] = [
    {"id": uuid.UUID("00000000-0000-0000-0000-000000000001"), "name": "Emma Johnson"},
    {"id": uuid.UUID("00000000-0000-0000-0000-000000000002"), "name": "Liam Smith"},
    {"id": uuid.UUID("00000000-0000-0000-0000-000000000003"), "name": "Olivia Williams"},
    {"id": uuid.UUID("00000000-0000-0000-0000-000000000004"), "name": "Noah Brown"},
    {"id": uuid.UUID("00000000-0000-0000-0000-000000000005"), "name": "Ava Davis"},
    {"id": uuid.UUID("00000000-0000-0000-0000-000000000006"), "name": "Ethan Martinez"},
    {"id": uuid.UUID("00000000-0000-0000-0000-000000000007"), "name": "Sophia Garcia"},
    {"id": uuid.UUID("00000000-0000-0000-0000-000000000008"), "name": "Mason Wilson"},
    {"id": uuid.UUID("00000000-0000-0000-0000-000000000009"), "name": "Isabella Anderson"},
    {"id": uuid.UUID("00000000-0000-0000-0000-00000000000a"), "name": "Lucas Thomas"},
    {"id": uuid.UUID("00000000-0000-0000-0000-00000000000b"), "name": "Mia Taylor"},
    {"id": uuid.UUID("00000000-0000-0000-0000-00000000000c"), "name": "Jackson Lee"},
]


def _today() -> date:
    return date.today()


def _records_for_today(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    """Return all records for today for the given org."""
    today = _today()
    return [
        r for r in _records[org_id]
        if r["created_at"].date() == today
    ]


async def create_checkin(
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new check-in or check-out record."""
    record = {
        "id": uuid.uuid4(),
        "org_id": organization_id,
        "camper_id": data["camper_id"],
        "camper_name": data["camper_name"],
        "type": data["type"],
        "guardian_name": data.get("guardian_name"),
        "guardian_relationship": data.get("guardian_relationship"),
        "guardian_id_verified": data.get("guardian_id_verified", False),
        "method": data.get("method", "in_person"),
        "notes": data.get("notes"),
        "checked_by": data.get("checked_by"),
        "created_at": datetime.utcnow(),
    }
    _records[organization_id].append(record)
    return record


async def get_today_status(
    *,
    organization_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    Build the today view: each camper's current status + aggregate stats.
    A camper's status is determined by their most recent action today.
    """
    today_records = _records_for_today(organization_id)

    # Group records by camper, keep the latest one
    latest_by_camper: Dict[uuid.UUID, Dict[str, Any]] = {}
    for rec in today_records:
        cid = rec["camper_id"]
        if cid not in latest_by_camper or rec["created_at"] > latest_by_camper[cid]["created_at"]:
            latest_by_camper[cid] = rec

    campers_list: List[Dict[str, Any]] = []
    checked_in_count = 0
    checked_out_count = 0
    pending_count = 0

    for demo in _DEMO_CAMPERS:
        cid = demo["id"]
        if cid in latest_by_camper:
            last = latest_by_camper[cid]
            if last["type"] == "check_in":
                status = "checked_in"
                checked_in_count += 1
            else:
                status = "checked_out"
                checked_out_count += 1
            campers_list.append({
                "camper_id": cid,
                "camper_name": demo["name"],
                "status": status,
                "last_action": last,
            })
        else:
            pending_count += 1
            campers_list.append({
                "camper_id": cid,
                "camper_name": demo["name"],
                "status": "pending",
                "last_action": None,
            })

    total = len(_DEMO_CAMPERS)
    attendance_rate = round((checked_in_count / total * 100) if total > 0 else 0.0, 1)

    stats = {
        "total_today": total,
        "checked_in": checked_in_count,
        "checked_out": checked_out_count,
        "pending": pending_count,
        "attendance_rate": attendance_rate,
    }

    return {"campers": campers_list, "stats": stats}


async def get_history(
    *,
    organization_id: uuid.UUID,
    camper_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    record_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve check-in/out history with optional filters."""
    records = _records[organization_id]
    results = []
    for r in records:
        if camper_id and r["camper_id"] != camper_id:
            continue
        rec_date = r["created_at"].date()
        if start_date and rec_date < start_date:
            continue
        if end_date and rec_date > end_date:
            continue
        if record_type and r["type"] != record_type:
            continue
        results.append(r)
    return sorted(results, key=lambda x: x["created_at"], reverse=True)


async def get_stats(
    *,
    organization_id: uuid.UUID,
) -> Dict[str, Any]:
    """Get aggregate check-in stats for today."""
    today_data = await get_today_status(organization_id=organization_id)
    return today_data["stats"]
