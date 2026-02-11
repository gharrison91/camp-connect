"""
Camp Connect - Attendance Service
Business logic for attendance tracking.
"""

from __future__ import annotations

import uuid
from collections import Counter, defaultdict
from datetime import date, datetime
from typing import Any, Dict, List, Optional


# In-memory store keyed by org_id
_records: Dict[uuid.UUID, List[Dict[str, Any]]] = defaultdict(list)
_sessions: Dict[uuid.UUID, List[Dict[str, Any]]] = defaultdict(list)


async def record_attendance(
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Record a single attendance entry."""
    record = {
        "id": uuid.uuid4(),
        "org_id": organization_id,
        "camper_id": data["camper_id"],
        "camper_name": data["camper_name"],
        "activity_id": data["activity_id"],
        "activity_name": data["activity_name"],
        "date": data["date"],
        "status": data.get("status", "present"),
        "check_in_time": str(data["check_in_time"]) if data.get("check_in_time") else None,
        "check_out_time": str(data["check_out_time"]) if data.get("check_out_time") else None,
        "checked_in_by": data.get("checked_in_by"),
        "notes": data.get("notes"),
        "created_at": datetime.utcnow(),
    }
    _records[organization_id].append(record)
    return record


async def bulk_attendance(
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Record attendance for an entire session (batch)."""
    activity_id = data["activity_id"]
    activity_name = data["activity_name"]
    record_date = data["date"]
    period = data.get("period")
    records_data = data.get("records", [])

    saved: List[Dict[str, Any]] = []
    status_counts: Counter = Counter()

    for rec in records_data:
        entry = {
            "id": uuid.uuid4(),
            "org_id": organization_id,
            "camper_id": rec["camper_id"],
            "camper_name": rec["camper_name"],
            "activity_id": activity_id,
            "activity_name": activity_name,
            "date": record_date,
            "status": rec.get("status", "present"),
            "check_in_time": str(rec["check_in_time"]) if rec.get("check_in_time") else None,
            "check_out_time": str(rec["check_out_time"]) if rec.get("check_out_time") else None,
            "checked_in_by": rec.get("checked_in_by"),
            "notes": rec.get("notes"),
            "created_at": datetime.utcnow(),
        }
        _records[organization_id].append(entry)
        saved.append(entry)
        status_counts[rec.get("status", "present")] += 1

    session = {
        "id": uuid.uuid4(),
        "org_id": organization_id,
        "activity_id": activity_id,
        "activity_name": activity_name,
        "date": record_date,
        "period": period,
        "total_expected": len(records_data),
        "total_present": status_counts.get("present", 0),
        "total_absent": status_counts.get("absent", 0),
        "total_late": status_counts.get("late", 0),
    }
    _sessions[organization_id].append(session)

    return {"session": session, "records": saved}


async def get_session_attendance(
    *,
    organization_id: uuid.UUID,
    activity_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[Dict[str, Any]]:
    """List attendance sessions with optional filters."""
    sessions = _sessions[organization_id]
    results = []
    for s in sessions:
        if activity_id and s["activity_id"] != activity_id:
            continue
        sess_date = s["date"] if isinstance(s["date"], date) else s["date"]
        if start_date and sess_date < start_date:
            continue
        if end_date and sess_date > end_date:
            continue
        results.append(s)
    return sorted(results, key=lambda x: str(x["date"]), reverse=True)


async def get_camper_attendance_history(
    *,
    organization_id: uuid.UUID,
    camper_id: uuid.UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[Dict[str, Any]]:
    """Get full attendance history for a single camper."""
    records = _records[organization_id]
    results = []
    for r in records:
        if r["camper_id"] != camper_id:
            continue
        rec_date = r["date"] if isinstance(r["date"], date) else r["date"]
        if start_date and rec_date < start_date:
            continue
        if end_date and rec_date > end_date:
            continue
        results.append(r)
    return sorted(results, key=lambda x: str(x["date"]), reverse=True)


async def get_attendance_stats(
    *,
    organization_id: uuid.UUID,
    activity_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """Compute aggregate attendance statistics."""
    records = _records[organization_id]
    filtered = []
    for r in records:
        if activity_id and r["activity_id"] != activity_id:
            continue
        rec_date = r["date"] if isinstance(r["date"], date) else r["date"]
        if start_date and rec_date < start_date:
            continue
        if end_date and rec_date > end_date:
            continue
        filtered.append(r)

    total = len(filtered)
    present_count = sum(1 for r in filtered if r["status"] in ("present", "late"))
    attendance_rate = (present_count / total * 100) if total > 0 else 0.0

    sessions = await get_session_attendance(
        organization_id=organization_id,
        activity_id=activity_id,
        start_date=start_date,
        end_date=end_date,
    )

    # Perfect attendance: campers who were never absent
    camper_statuses: Dict[uuid.UUID, List[str]] = defaultdict(list)
    camper_names: Dict[uuid.UUID, str] = {}
    for r in filtered:
        camper_statuses[r["camper_id"]].append(r["status"])
        camper_names[r["camper_id"]] = r["camper_name"]

    perfect = 0
    absence_counts: List[Dict[str, Any]] = []
    for cid, statuses in camper_statuses.items():
        absent_count = sum(1 for s in statuses if s == "absent")
        if absent_count == 0 and len(statuses) > 0:
            perfect += 1
        if absent_count >= 2:
            absence_counts.append({
                "camper_id": cid,
                "camper_name": camper_names[cid],
                "absence_count": absent_count,
            })

    absence_counts.sort(key=lambda x: x["absence_count"], reverse=True)

    return {
        "attendance_rate": round(attendance_rate, 1),
        "total_sessions": len(sessions),
        "perfect_attendance_count": perfect,
        "frequent_absences": absence_counts[:10],
    }


async def get_daily_report(
    *,
    organization_id: uuid.UUID,
    report_date: date,
) -> Dict[str, Any]:
    """Get a daily attendance summary across all activities."""
    records = _records[organization_id]
    day_records = [r for r in records if r["date"] == report_date]

    total = len(day_records)
    status_counts = Counter(r["status"] for r in day_records)

    activities: Dict[uuid.UUID, Dict[str, Any]] = {}
    for r in day_records:
        aid = r["activity_id"]
        if aid not in activities:
            activities[aid] = {
                "activity_id": aid,
                "activity_name": r["activity_name"],
                "total": 0,
                "present": 0,
                "absent": 0,
                "late": 0,
                "excused": 0,
            }
        activities[aid]["total"] += 1
        activities[aid][r["status"]] += 1

    return {
        "date": report_date,
        "total_records": total,
        "present": status_counts.get("present", 0),
        "absent": status_counts.get("absent", 0),
        "late": status_counts.get("late", 0),
        "excused": status_counts.get("excused", 0),
        "by_activity": list(activities.values()),
    }
