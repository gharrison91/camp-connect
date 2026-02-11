"""
Camp Connect - Incident Service
Business logic for incident & safety reporting (in-memory store for now).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

# In-memory store keyed by org_id -> list of incidents
_incidents: Dict[str, List[Dict[str, Any]]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_org_incidents(org_id: str) -> List[Dict[str, Any]]:
    return _incidents.setdefault(org_id, [])


async def get_incidents(
    org_id: str,
    *,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    incident_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List incidents with optional filters."""
    items = _get_org_incidents(org_id)
    results = []
    for inc in items:
        if status and inc["status"] != status:
            continue
        if severity and inc["severity"] != severity:
            continue
        if incident_type and inc["incident_type"] != incident_type:
            continue
        if date_from and inc["date_time"] < date_from:
            continue
        if date_to and inc["date_time"] > date_to:
            continue
        if search:
            q = search.lower()
            if q not in inc["title"].lower() and q not in inc["description"].lower() and q not in inc["location"].lower():
                continue
        results.append(inc)
    results.sort(key=lambda x: x["date_time"], reverse=True)
    return results


async def get_incident(org_id: str, incident_id: str) -> Optional[Dict[str, Any]]:
    """Get single incident by ID."""
    for inc in _get_org_incidents(org_id):
        if inc["id"] == incident_id:
            return inc
    return None


async def create_incident(
    org_id: str,
    *,
    data: Dict[str, Any],
    reported_by: str,
    reported_by_name: str,
) -> Dict[str, Any]:
    """Create a new incident report."""
    now = _now_iso()
    incident = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "title": data["title"],
        "description": data.get("description", ""),
        "incident_type": data.get("incident_type", "other"),
        "severity": data.get("severity", "medium"),
        "status": "open",
        "location": data.get("location", ""),
        "date_time": data["date_time"],
        "reported_by": reported_by,
        "reported_by_name": reported_by_name,
        "involved_parties": [p if isinstance(p, dict) else p.dict() for p in data.get("involved_parties", [])],
        "actions_taken": data.get("actions_taken", ""),
        "follow_ups": [],
        "resolution": "",
        "attachments": data.get("attachments", []),
        "created_at": now,
        "updated_at": now,
    }
    _get_org_incidents(org_id).append(incident)
    return incident


async def update_incident(
    org_id: str,
    incident_id: str,
    *,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing incident."""
    inc = await get_incident(org_id, incident_id)
    if inc is None:
        return None
    for key, value in data.items():
        if value is not None and key in inc:
            if key == "involved_parties":
                inc[key] = [p if isinstance(p, dict) else p.dict() for p in value]
            else:
                inc[key] = value
    inc["updated_at"] = _now_iso()
    return inc


async def delete_incident(org_id: str, incident_id: str) -> bool:
    """Delete an incident."""
    items = _get_org_incidents(org_id)
    for i, inc in enumerate(items):
        if inc["id"] == incident_id:
            items.pop(i)
            return True
    return False


async def add_follow_up(
    org_id: str,
    incident_id: str,
    *,
    note: str,
    author_id: str,
    author_name: str,
) -> Optional[Dict[str, Any]]:
    """Add a follow-up note to an incident."""
    inc = await get_incident(org_id, incident_id)
    if inc is None:
        return None
    follow_up = {
        "id": str(uuid.uuid4()),
        "note": note,
        "author_id": author_id,
        "author_name": author_name,
        "created_at": _now_iso(),
    }
    inc["follow_ups"].append(follow_up)
    inc["updated_at"] = _now_iso()
    if inc["status"] == "open":
        inc["status"] = "investigating"
    return inc


async def resolve_incident(
    org_id: str,
    incident_id: str,
    *,
    resolution: str,
) -> Optional[Dict[str, Any]]:
    """Mark an incident as resolved."""
    inc = await get_incident(org_id, incident_id)
    if inc is None:
        return None
    inc["resolution"] = resolution
    inc["status"] = "resolved"
    inc["updated_at"] = _now_iso()
    return inc


async def get_incident_stats(org_id: str) -> Dict[str, Any]:
    """Compute incident statistics."""
    items = _get_org_incidents(org_id)
    total = len(items)
    open_count = sum(1 for i in items if i["status"] == "open")
    critical_count = sum(1 for i in items if i["severity"] == "critical" and i["status"] in ("open", "investigating"))
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    resolved_this_week = sum(
        1 for i in items
        if i["status"] in ("resolved", "closed") and i["updated_at"] >= week_ago
    )
    by_type: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    by_status: Dict[str, int] = {}
    for i in items:
        by_type[i["incident_type"]] = by_type.get(i["incident_type"], 0) + 1
        by_severity[i["severity"]] = by_severity.get(i["severity"], 0) + 1
        by_status[i["status"]] = by_status.get(i["status"], 0) + 1
    return {
        "total": total,
        "open_count": open_count,
        "critical_count": critical_count,
        "resolved_this_week": resolved_this_week,
        "avg_resolution_hours": None,
        "by_type": by_type,
        "by_severity": by_severity,
        "by_status": by_status,
        "recent_trend": [],
    }


async def get_person_incidents(
    org_id: str,
    person_type: str,
    person_id: str,
) -> List[Dict[str, Any]]:
    """Get incidents involving a specific person."""
    items = _get_org_incidents(org_id)
    results = []
    for inc in items:
        for party in inc.get("involved_parties", []):
            if party.get("person_type") == person_type and party.get("person_id") == person_id:
                results.append(inc)
                break
    results.sort(key=lambda x: x["date_time"], reverse=True)
    return results
