"""
Camp Connect - Audit Log Service
Business logic for audit log CRUD operations.
Uses in-memory store (same pattern as visitor/transportation services).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple


_audit_store: Dict[str, List[Dict[str, Any]]] = {}


def _org_key(org_id: uuid.UUID) -> str:
    return str(org_id)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

async def log_action(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    user_name: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    resource_name: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new audit log entry."""
    key = _org_key(org_id)
    now = datetime.utcnow().isoformat()
    entry = {
        "id": str(uuid.uuid4()),
        "organization_id": str(org_id),
        "user_id": str(user_id),
        "user_name": user_name,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "resource_name": resource_name,
        "details": details,
        "ip_address": ip_address,
        "created_at": now,
    }
    _audit_store.setdefault(key, []).append(entry)
    return entry


# ---------------------------------------------------------------------------
# List with filters + pagination
# ---------------------------------------------------------------------------

async def get_audit_logs(
    org_id: uuid.UUID,
    page: int = 1,
    per_page: int = 25,
    action_filter: Optional[str] = None,
    resource_type_filter: Optional[str] = None,
    user_id_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
) -> Dict[str, Any]:
    """List audit logs with filters and pagination."""
    key = _org_key(org_id)
    logs = list(_audit_store.get(key, []))

    # Apply filters
    if action_filter:
        logs = [e for e in logs if e["action"] == action_filter]
    if resource_type_filter:
        logs = [e for e in logs if e["resource_type"] == resource_type_filter]
    if user_id_filter:
        logs = [e for e in logs if e["user_id"] == user_id_filter]
    if date_from:
        logs = [e for e in logs if e["created_at"][:10] >= date_from]
    if date_to:
        logs = [e for e in logs if e["created_at"][:10] <= date_to]
    if search:
        q = search.lower()
        logs = [
            e for e in logs
            if q in e.get("user_name", "").lower()
            or q in e.get("resource_type", "").lower()
            or q in e.get("resource_name", "").lower()
            or q in e.get("details", "").lower()
            or q in e.get("action", "").lower()
        ]

    # Sort newest first
    logs.sort(key=lambda e: e["created_at"], reverse=True)

    total = len(logs)
    start = (page - 1) * per_page
    end = start + per_page
    items = logs[start:end]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
    }


# ---------------------------------------------------------------------------
# Stats (last 30 days)
# ---------------------------------------------------------------------------

async def get_audit_stats(
    org_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Return counts by action type for the last 30 days."""
    key = _org_key(org_id)
    logs = _audit_store.get(key, [])

    cutoff = (datetime.utcnow() - timedelta(days=30)).isoformat()
    recent = [e for e in logs if e["created_at"] >= cutoff]

    counts: Dict[str, int] = {}
    for entry in recent:
        action = entry["action"]
        counts[action] = counts.get(action, 0) + 1

    return [{"action": action, "count": count} for action, count in counts.items()]
