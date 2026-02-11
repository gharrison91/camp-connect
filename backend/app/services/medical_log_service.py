"""
Camp Connect - Medical Log Service
Business logic for medical log entries (in-memory store).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, date
from typing import Any, Dict, List, Optional


_logs: Dict[str, List[Dict[str, Any]]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today_str() -> str:
    return date.today().isoformat()


def _get_org_logs(org_id: str) -> List[Dict[str, Any]]:
    return _logs.setdefault(org_id, [])


async def get_logs(
    org_id: str,
    *,
    page: int = 1,
    per_page: int = 20,
    camper_id: Optional[str] = None,
    visit_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
) -> Dict[str, Any]:
    items = _get_org_logs(org_id)
    results = []
    for entry in items:
        if camper_id and entry["camper_id"] != camper_id:
            continue
        if visit_type and entry["visit_type"] != visit_type:
            continue
        if date_from and entry["created_at"][:10] < date_from:
            continue
        if date_to and entry["created_at"][:10] > date_to:
            continue
        if search:
            q = search.lower()
            searchable = f"{entry['camper_name']} {entry['chief_complaint']} {entry['description']}".lower()
            if q not in searchable:
                continue
        results.append(entry)
    results.sort(key=lambda x: x["created_at"], reverse=True)
    total = len(results)
    start = (page - 1) * per_page
    end = start + per_page
    return {"items": results[start:end], "total": total, "page": page, "per_page": per_page}


async def create_log(
    org_id: str,
    *,
    user_id: str,
    user_name: str,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    now = _now_iso()
    vitals_data = data.get("vitals")
    if vitals_data and hasattr(vitals_data, "model_dump"):
        vitals_data = vitals_data.model_dump()
    meds_data = data.get("medications_given", [])
    meds_serialized = [
        m.model_dump() if hasattr(m, "model_dump") else m
        for m in meds_data
    ]
    entry = {
        "id": str(uuid.uuid4()),
        "organization_id": org_id,
        "camper_id": data["camper_id"],
        "camper_name": data["camper_name"],
        "staff_id": user_id,
        "staff_name": user_name,
        "visit_type": data["visit_type"],
        "chief_complaint": data.get("chief_complaint", ""),
        "description": data.get("description", ""),
        "vitals": vitals_data,
        "medications_given": meds_serialized,
        "treatment_notes": data.get("treatment_notes", ""),
        "follow_up_required": data.get("follow_up_required", False),
        "follow_up_date": data.get("follow_up_date"),
        "disposition": data.get("disposition", "returned_to_activity"),
        "parent_notified": data.get("parent_notified", False),
        "created_at": now,
        "updated_at": now,
    }
    _get_org_logs(org_id).append(entry)
    return entry


async def update_log(
    org_id: str,
    log_id: str,
    *,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    for entry in _get_org_logs(org_id):
        if entry["id"] == log_id:
            for key, val in data.items():
                if val is not None:
                    if hasattr(val, "model_dump"):
                        val = val.model_dump()
                    elif isinstance(val, list):
                        val = [i.model_dump() if hasattr(i, "model_dump") else i for i in val]
                    entry[key] = val
            entry["updated_at"] = _now_iso()
            return entry
    return None


async def get_stats(org_id: str) -> Dict[str, Any]:
    items = _get_org_logs(org_id)
    today = _today_str()
    total_visits = len(items)
    visits_today = sum(1 for e in items if e["created_at"][:10] == today)
    meds_today = sum(
        len(e.get("medications_given", []))
        for e in items
        if e["created_at"][:10] == today
    )
    follow_ups = sum(
        1 for e in items
        if e.get("follow_up_required") and e.get("follow_up_date") and e["follow_up_date"] >= today
    )
    return {
        "total_visits": total_visits,
        "visits_today": visits_today,
        "medications_given_today": meds_today,
        "follow_ups_pending": follow_ups,
    }


async def get_follow_ups(org_id: str) -> List[Dict[str, Any]]:
    items = _get_org_logs(org_id)
    today = _today_str()
    results = [
        e for e in items
        if e.get("follow_up_required") and e.get("follow_up_date") and e["follow_up_date"] >= today
    ]
    results.sort(key=lambda x: x.get("follow_up_date", ""))
    return results
