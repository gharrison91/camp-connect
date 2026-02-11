"""
Camp Connect - Visitor Service
Business logic for visitor check-in/out and pre-registration.
Uses in-memory store (same pattern as transportation).
"""

from __future__ import annotations

import uuid
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional

_visitors_store: Dict[str, List[Dict[str, Any]]] = {}


def _org_key(org_id: uuid.UUID) -> str:
    return str(org_id)


def _today_str() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def list_visitors(
    org_id: uuid.UUID,
    status: Optional[str] = None,
    visitor_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    visitors = list(_visitors_store.get(key, []))
    if status:
        visitors = [v for v in visitors if v.get("status") == status]
    if visitor_type:
        visitors = [v for v in visitors if v.get("visitor_type") == visitor_type]
    if date_from:
        visitors = [v for v in visitors if v.get("created_at", "")[:10] >= date_from]
    if date_to:
        visitors = [v for v in visitors if v.get("created_at", "")[:10] <= date_to]
    return sorted(visitors, key=lambda v: v.get("created_at", ""), reverse=True)


async def get_visitor(org_id: uuid.UUID, visitor_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for v in _visitors_store.get(key, []):
        if v["id"] == str(visitor_id):
            return v
    return None


async def create_visitor(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    key = _org_key(org_id)
    now = datetime.utcnow().isoformat()
    visitor = {
        "id": str(uuid.uuid4()),
        "org_id": str(org_id),
        **data,
        "check_in_time": None,
        "check_out_time": None,
        "created_at": now,
    }
    if data.get("status") == "checked_in":
        visitor["check_in_time"] = now
    _visitors_store.setdefault(key, []).append(visitor)
    return visitor


async def update_visitor(
    org_id: uuid.UUID, visitor_id: uuid.UUID, data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for v in _visitors_store.get(key, []):
        if v["id"] == str(visitor_id):
            for k, val in data.items():
                if val is not None:
                    v[k] = val
            return v
    return None


async def delete_visitor(org_id: uuid.UUID, visitor_id: uuid.UUID) -> bool:
    key = _org_key(org_id)
    visitors = _visitors_store.get(key, [])
    before = len(visitors)
    _visitors_store[key] = [v for v in visitors if v["id"] != str(visitor_id)]
    return len(_visitors_store[key]) < before


# ---------------------------------------------------------------------------
# Check-in / Check-out
# ---------------------------------------------------------------------------

async def check_in(org_id: uuid.UUID, visitor_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    now = datetime.utcnow().isoformat()
    for v in _visitors_store.get(key, []):
        if v["id"] == str(visitor_id):
            v["status"] = "checked_in"
            v["check_in_time"] = now
            return v
    return None


async def check_out(org_id: uuid.UUID, visitor_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    now = datetime.utcnow().isoformat()
    for v in _visitors_store.get(key, []):
        if v["id"] == str(visitor_id):
            v["status"] = "checked_out"
            v["check_out_time"] = now
            return v
    return None


# ---------------------------------------------------------------------------
# Pre-register
# ---------------------------------------------------------------------------

async def pre_register(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    data["status"] = "pre_registered"
    return await create_visitor(org_id, data)


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------

async def get_current_visitors(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    visitors = _visitors_store.get(key, [])
    return [v for v in visitors if v.get("status") == "checked_in"]


async def get_visitor_log(
    org_id: uuid.UUID,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    visitor_type: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    return await list_visitors(
        org_id, status=status, visitor_type=visitor_type,
        date_from=date_from, date_to=date_to,
    )


async def get_stats(org_id: uuid.UUID) -> Dict[str, Any]:
    key = _org_key(org_id)
    visitors = _visitors_store.get(key, [])
    today = _today_str()
    today_visitors = [v for v in visitors if v.get("created_at", "")[:10] == today]
    checked_in = [v for v in today_visitors if v.get("status") == "checked_in"]

    types = [v.get("visitor_type", "guest") for v in today_visitors]
    most_common = Counter(types).most_common(1)
    most_common_type = most_common[0][0] if most_common else "guest"

    durations: List[float] = []
    for v in today_visitors:
        if v.get("check_in_time") and v.get("check_out_time"):
            try:
                cin = datetime.fromisoformat(v["check_in_time"])
                cout = datetime.fromisoformat(v["check_out_time"])
                durations.append((cout - cin).total_seconds() / 60)
            except (ValueError, TypeError):
                pass
    avg_duration = sum(durations) / len(durations) if durations else 0.0

    return {
        "checked_in_today": len(checked_in),
        "total_today": len(today_visitors),
        "most_common_type": most_common_type,
        "avg_visit_duration": round(avg_duration, 1),
    }
