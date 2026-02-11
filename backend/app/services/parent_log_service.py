"""
Camp Connect - Parent Log Service
Business logic for parent communication logs & camper check-ins (in-memory store).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

# In-memory stores keyed by org_id
_logs: Dict[str, List[Dict[str, Any]]] = {}
_check_ins: Dict[str, List[Dict[str, Any]]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _get_org_logs(org_id: str) -> List[Dict[str, Any]]:
    return _logs.setdefault(org_id, [])


def _get_org_check_ins(org_id: str) -> List[Dict[str, Any]]:
    return _check_ins.setdefault(org_id, [])


# ── Log Entry CRUD ────────────────────────────────────────────


async def get_log_entries(
    org_id: str,
    *,
    parent_id: Optional[str] = None,
    camper_id: Optional[str] = None,
    log_type: Optional[str] = None,
    sentiment: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    items = _get_org_logs(org_id)
    results = []
    for entry in items:
        if parent_id and entry["parent_id"] != parent_id:
            continue
        if camper_id and entry["camper_id"] != camper_id:
            continue
        if log_type and entry["log_type"] != log_type:
            continue
        if sentiment and entry["sentiment"] != sentiment:
            continue
        if date_from and entry["created_at"] < date_from:
            continue
        if date_to and entry["created_at"] > date_to:
            continue
        if search:
            q = search.lower()
            if (
                q not in entry["subject"].lower()
                and q not in entry["notes"].lower()
                and q not in entry["parent_name"].lower()
                and q not in entry["camper_name"].lower()
            ):
                continue
        results.append(entry)
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results


async def get_log_entry(org_id: str, entry_id: str) -> Optional[Dict[str, Any]]:
    for entry in _get_org_logs(org_id):
        if entry["id"] == entry_id:
            return entry
    return None


async def create_log_entry(
    org_id: str, staff_id: str, staff_name: str, data: Dict[str, Any]
) -> Dict[str, Any]:
    entry = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "staff_id": staff_id,
        "staff_name": staff_name,
        "parent_id": data["parent_id"],
        "parent_name": data["parent_name"],
        "camper_id": data["camper_id"],
        "camper_name": data["camper_name"],
        "log_type": data.get("log_type", "phone_call"),
        "direction": data.get("direction", "outbound"),
        "subject": data.get("subject", ""),
        "notes": data.get("notes", ""),
        "sentiment": data.get("sentiment", "neutral"),
        "follow_up_required": data.get("follow_up_required", False),
        "follow_up_date": data.get("follow_up_date"),
        "follow_up_completed": False,
        "tags": data.get("tags", []),
        "created_at": _now_iso(),
    }
    _get_org_logs(org_id).append(entry)
    return entry


async def update_log_entry(
    org_id: str, entry_id: str, data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    entry = await get_log_entry(org_id, entry_id)
    if not entry:
        return None
    for key, value in data.items():
        if value is not None and key in entry:
            entry[key] = value
    return entry


async def delete_log_entry(org_id: str, entry_id: str) -> bool:
    items = _get_org_logs(org_id)
    for i, entry in enumerate(items):
        if entry["id"] == entry_id:
            items.pop(i)
            return True
    return False


# ── Parent History ────────────────────────────────────────────


async def get_parent_history(org_id: str, parent_id: str) -> List[Dict[str, Any]]:
    items = _get_org_logs(org_id)
    results = [e for e in items if e["parent_id"] == parent_id]
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results


# ── Follow-Ups ────────────────────────────────────────────────


async def get_follow_ups_due(
    org_id: str, *, overdue_only: bool = False
) -> List[Dict[str, Any]]:
    items = _get_org_logs(org_id)
    today = _today_iso()
    results = []
    for entry in items:
        if not entry["follow_up_required"] or entry["follow_up_completed"]:
            continue
        if overdue_only:
            if entry["follow_up_date"] and entry["follow_up_date"] < today:
                results.append(entry)
        else:
            results.append(entry)
    results.sort(key=lambda x: x.get("follow_up_date") or "9999", reverse=False)
    return results


async def complete_follow_up(org_id: str, entry_id: str) -> Optional[Dict[str, Any]]:
    entry = await get_log_entry(org_id, entry_id)
    if not entry:
        return None
    entry["follow_up_completed"] = True
    return entry


# ── Check-In CRUD ─────────────────────────────────────────────


async def get_check_ins(
    org_id: str,
    *,
    camper_id: Optional[str] = None,
    date: Optional[str] = None,
    check_in_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    items = _get_org_check_ins(org_id)
    results = []
    for ci in items:
        if camper_id and ci["camper_id"] != camper_id:
            continue
        if date and ci["date"] != date:
            continue
        if check_in_type and ci["check_in_type"] != check_in_type:
            continue
        results.append(ci)
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results


async def create_check_in(
    org_id: str, data: Dict[str, Any]
) -> Dict[str, Any]:
    ci = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "camper_id": data["camper_id"],
        "camper_name": data["camper_name"],
        "check_in_type": data.get("check_in_type", "daily"),
        "date": data["date"],
        "mood": data.get("mood", "good"),
        "activities_participated": data.get("activities_participated", []),
        "meals_eaten": data.get("meals_eaten", "all"),
        "health_notes": data.get("health_notes", ""),
        "staff_notes": data.get("staff_notes", ""),
        "shared_with_parents": False,
        "created_at": _now_iso(),
    }
    _get_org_check_ins(org_id).append(ci)
    return ci


async def share_check_in_with_parents(
    org_id: str, check_in_id: str
) -> Optional[Dict[str, Any]]:
    for ci in _get_org_check_ins(org_id):
        if ci["id"] == check_in_id:
            ci["shared_with_parents"] = True
            return ci
    return None


async def get_camper_check_ins(
    org_id: str, camper_id: str
) -> List[Dict[str, Any]]:
    items = _get_org_check_ins(org_id)
    results = [ci for ci in items if ci["camper_id"] == camper_id]
    results.sort(key=lambda x: x["date"], reverse=True)
    return results


# ── Stats ─────────────────────────────────────────────────────


async def get_log_stats(org_id: str) -> Dict[str, Any]:
    logs = _get_org_logs(org_id)
    check_ins = _get_org_check_ins(org_id)
    today = _today_iso()
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    week_logs = [e for e in logs if e["created_at"] >= week_ago]
    today_check_ins = [ci for ci in check_ins if ci["date"] == today]
    follow_ups_due = [
        e for e in logs
        if e["follow_up_required"] and not e["follow_up_completed"]
    ]

    by_type: Dict[str, int] = {}
    by_sentiment: Dict[str, int] = {}
    for e in logs:
        by_type[e["log_type"]] = by_type.get(e["log_type"], 0) + 1
        by_sentiment[e["sentiment"]] = by_sentiment.get(e["sentiment"], 0) + 1

    total = len(logs)
    inbound = len([e for e in logs if e["direction"] == "inbound"])
    response_rate = (inbound / total * 100) if total > 0 else 0.0

    return {
        "total_communications_this_week": len(week_logs),
        "check_ins_today": len(today_check_ins),
        "follow_ups_due": len(follow_ups_due),
        "response_rate": round(response_rate, 1),
        "by_type": by_type,
        "by_sentiment": by_sentiment,
    }
