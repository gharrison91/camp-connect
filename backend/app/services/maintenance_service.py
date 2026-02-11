"""
Camp Connect - Maintenance Service
Business logic for facility maintenance requests (in-memory store for now).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

# In-memory store keyed by org_id -> list of requests
_requests: Dict[str, List[Dict[str, Any]]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_org_requests(org_id: str) -> List[Dict[str, Any]]:
    return _requests.setdefault(org_id, [])


async def get_requests(
    org_id: str,
    *,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List maintenance requests with optional filters."""
    items = _get_org_requests(org_id)
    results = []
    for req in items:
        if status and req["status"] != status:
            continue
        if priority and req["priority"] != priority:
            continue
        if category and req["category"] != category:
            continue
        if search:
            q = search.lower()
            if (
                q not in req["title"].lower()
                and q not in req["description"].lower()
                and q not in req["location"].lower()
            ):
                continue
        results.append(req)
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results


async def get_request(org_id: str, request_id: str) -> Optional[Dict[str, Any]]:
    """Get single maintenance request by ID."""
    for req in _get_org_requests(org_id):
        if req["id"] == request_id:
            return req
    return None


async def create_request(
    org_id: str,
    *,
    data: Dict[str, Any],
    reported_by: str,
    reported_by_name: str,
) -> Dict[str, Any]:
    """Create a new maintenance request."""
    now = _now_iso()
    request = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "title": data["title"],
        "description": data.get("description", ""),
        "category": data.get("category", "other"),
        "priority": data.get("priority", "medium"),
        "status": "open",
        "location": data.get("location", ""),
        "reported_by": reported_by,
        "reported_by_name": reported_by_name,
        "assigned_to": "",
        "assigned_to_name": "",
        "estimated_cost": data.get("estimated_cost"),
        "actual_cost": data.get("actual_cost"),
        "scheduled_date": data.get("scheduled_date"),
        "completed_date": None,
        "photos": data.get("photos", []),
        "notes": data.get("notes", ""),
        "created_at": now,
        "updated_at": now,
    }
    _get_org_requests(org_id).append(request)
    return request


async def update_request(
    org_id: str,
    request_id: str,
    *,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing maintenance request."""
    req = await get_request(org_id, request_id)
    if req is None:
        return None
    for key, value in data.items():
        if value is not None and key in req:
            req[key] = value
    req["updated_at"] = _now_iso()
    return req


async def delete_request(org_id: str, request_id: str) -> bool:
    """Delete a maintenance request."""
    items = _get_org_requests(org_id)
    for i, req in enumerate(items):
        if req["id"] == request_id:
            items.pop(i)
            return True
    return False


async def assign_request(
    org_id: str,
    request_id: str,
    *,
    assigned_to: str,
    assigned_to_name: str,
) -> Optional[Dict[str, Any]]:
    """Assign a maintenance request to a staff member."""
    req = await get_request(org_id, request_id)
    if req is None:
        return None
    req["assigned_to"] = assigned_to
    req["assigned_to_name"] = assigned_to_name
    if req["status"] == "open":
        req["status"] = "assigned"
    req["updated_at"] = _now_iso()
    return req


async def complete_request(
    org_id: str,
    request_id: str,
    *,
    actual_cost: Optional[float] = None,
    notes: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Mark a maintenance request as completed."""
    req = await get_request(org_id, request_id)
    if req is None:
        return None
    req["status"] = "completed"
    req["completed_date"] = _now_iso()
    if actual_cost is not None:
        req["actual_cost"] = actual_cost
    if notes is not None:
        req["notes"] = notes
    req["updated_at"] = _now_iso()
    return req


async def get_stats(org_id: str) -> Dict[str, Any]:
    """Compute maintenance request statistics."""
    items = _get_org_requests(org_id)
    total = len(items)
    open_count = sum(1 for r in items if r["status"] == "open")
    urgent_count = sum(
        1 for r in items
        if r["priority"] == "urgent" and r["status"] not in ("completed", "cancelled")
    )
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    completed_this_week = sum(
        1 for r in items
        if r["status"] == "completed" and r["updated_at"] >= week_ago
    )

    # Calculate avg completion time
    completion_hours: List[float] = []
    for r in items:
        if r["status"] == "completed" and r["completed_date"]:
            try:
                created = datetime.fromisoformat(r["created_at"])
                completed = datetime.fromisoformat(r["completed_date"])
                hours = (completed - created).total_seconds() / 3600
                completion_hours.append(hours)
            except (ValueError, TypeError):
                pass
    avg_completion = (
        round(sum(completion_hours) / len(completion_hours), 1)
        if completion_hours
        else None
    )

    by_category: Dict[str, int] = {}
    by_priority: Dict[str, int] = {}
    by_status: Dict[str, int] = {}
    for r in items:
        by_category[r["category"]] = by_category.get(r["category"], 0) + 1
        by_priority[r["priority"]] = by_priority.get(r["priority"], 0) + 1
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1

    return {
        "total": total,
        "open_count": open_count,
        "urgent_count": urgent_count,
        "completed_this_week": completed_this_week,
        "avg_completion_hours": avg_completion,
        "by_category": by_category,
        "by_priority": by_priority,
        "by_status": by_status,
    }
