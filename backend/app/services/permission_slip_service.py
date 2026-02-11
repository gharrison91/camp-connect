"""
Camp Connect - Permission Slip Service
Business logic for digital permission slips (in-memory store).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional


# In-memory stores (per-org)
_slips: Dict[str, Dict[str, Any]] = {}
_assignments: Dict[str, Dict[str, Any]] = {}


def _org_slips(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    """Get all slips for an org."""
    oid = str(org_id)
    return [s for s in _slips.values() if s["organization_id"] == oid]


def _org_assignments(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    """Get all assignments for an org."""
    oid = str(org_id)
    return [a for a in _assignments.values() if a["organization_id"] == oid]


def _enrich_slip(slip: Dict[str, Any]) -> Dict[str, Any]:
    """Add computed counts to a slip."""
    slip_id = slip["id"]
    assigns = [a for a in _assignments.values() if a["slip_id"] == slip_id]
    slip["total_assignments"] = len(assigns)
    slip["signed_count"] = sum(1 for a in assigns if a["status"] == "signed")
    slip["pending_count"] = sum(1 for a in assigns if a["status"] == "pending")
    slip["declined_count"] = sum(1 for a in assigns if a["status"] == "declined")
    slip["expired_count"] = sum(1 for a in assigns if a["status"] == "expired")
    return slip


async def get_slips(
    org_id: uuid.UUID,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List permission slips for an org with optional filters."""
    slips = _org_slips(org_id)

    if search:
        q = search.lower()
        slips = [s for s in slips if q in s["title"].lower() or q in (s.get("description") or "").lower() or q in (s.get("activity_name") or "").lower()]

    # Enrich with assignment counts
    slips = [_enrich_slip(s) for s in slips]

    if status == "pending":
        slips = [s for s in slips if s["pending_count"] > 0]
    elif status == "complete":
        slips = [s for s in slips if s["total_assignments"] > 0 and s["pending_count"] == 0]

    slips.sort(key=lambda s: s["created_at"], reverse=True)
    return slips


async def create_slip(
    org_id: uuid.UUID,
    user_id: str,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new permission slip."""
    slip_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    slip = {
        "id": slip_id,
        "organization_id": str(org_id),
        "title": data["title"],
        "description": data.get("description"),
        "event_id": data.get("event_id"),
        "activity_name": data.get("activity_name"),
        "required_by": data["required_by"],
        "terms_text": data["terms_text"],
        "created_by": user_id,
        "created_at": now,
        "total_assignments": 0,
        "signed_count": 0,
        "pending_count": 0,
        "declined_count": 0,
        "expired_count": 0,
    }
    _slips[slip_id] = slip
    return slip


async def update_slip(
    org_id: uuid.UUID,
    slip_id: str,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Update a permission slip."""
    slip = _slips.get(slip_id)
    if not slip or slip["organization_id"] \!= str(org_id):
        raise ValueError("Permission slip not found")
    for key, value in data.items():
        if value is not None:
            slip[key] = value
    return _enrich_slip(slip)


async def delete_slip(
    org_id: uuid.UUID,
    slip_id: str,
) -> bool:
    """Delete a permission slip and its assignments."""
    slip = _slips.get(slip_id)
    if not slip or slip["organization_id"] \!= str(org_id):
        raise ValueError("Permission slip not found")
    # Remove assignments
    to_remove = [aid for aid, a in _assignments.items() if a["slip_id"] == slip_id]
    for aid in to_remove:
        del _assignments[aid]
    del _slips[slip_id]
    return True


async def assign_slip(
    org_id: uuid.UUID,
    slip_id: str,
    camper_ids: List[str],
) -> List[Dict[str, Any]]:
    """Assign a permission slip to a list of campers."""
    slip = _slips.get(slip_id)
    if not slip or slip["organization_id"] \!= str(org_id):
        raise ValueError("Permission slip not found")

    now = datetime.utcnow().isoformat()
    created = []
    for camper_id in camper_ids:
        # Check if already assigned
        existing = [a for a in _assignments.values() if a["slip_id"] == slip_id and a["camper_id"] == camper_id]
        if existing:
            continue
        assign_id = str(uuid.uuid4())
        assignment = {
            "id": assign_id,
            "organization_id": str(org_id),
            "slip_id": slip_id,
            "camper_id": camper_id,
            "camper_name": f"Camper {camper_id[:8]}",
            "parent_name": None,
            "status": "pending",
            "signed_at": None,
            "signature_text": None,
            "ip_address": None,
            "reminder_sent_at": None,
            "created_at": now,
        }
        _assignments[assign_id] = assignment
        created.append(assignment)
    return created


async def get_assignments(
    org_id: uuid.UUID,
    slip_id: Optional[str] = None,
    camper_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List assignments with optional filters."""
    assigns = _org_assignments(org_id)

    if slip_id:
        assigns = [a for a in assigns if a["slip_id"] == slip_id]
    if camper_id:
        assigns = [a for a in assigns if a["camper_id"] == camper_id]
    if status:
        assigns = [a for a in assigns if a["status"] == status]

    assigns.sort(key=lambda a: a["created_at"], reverse=True)
    return assigns


async def sign_assignment(
    org_id: uuid.UUID,
    assignment_id: str,
    signature_text: str,
    ip_address: Optional[str] = None,
) -> Dict[str, Any]:
    """Sign a permission slip assignment."""
    assignment = _assignments.get(assignment_id)
    if not assignment or assignment["organization_id"] \!= str(org_id):
        raise ValueError("Assignment not found")
    if assignment["status"] == "signed":
        raise ValueError("Assignment already signed")

    now = datetime.utcnow().isoformat()
    assignment["status"] = "signed"
    assignment["signed_at"] = now
    assignment["signature_text"] = signature_text
    assignment["ip_address"] = ip_address
    return assignment


async def get_stats(org_id: uuid.UUID) -> Dict[str, Any]:
    """Get aggregate stats for permission slips."""
    slips = _org_slips(org_id)
    assigns = _org_assignments(org_id)

    total_slips = len(slips)
    signed = sum(1 for a in assigns if a["status"] == "signed")
    pending = sum(1 for a in assigns if a["status"] == "pending")
    total_assigns = len(assigns)
    compliance = (signed / total_assigns * 100) if total_assigns > 0 else 100.0

    return {
        "total_slips": total_slips,
        "pending_signatures": pending,
        "signed_count": signed,
        "compliance_rate": round(compliance, 1),
    }


async def send_reminders(
    org_id: uuid.UUID,
    slip_id: str,
) -> int:
    """Mark reminders as sent for pending assignments."""
    slip = _slips.get(slip_id)
    if not slip or slip["organization_id"] \!= str(org_id):
        raise ValueError("Permission slip not found")

    now = datetime.utcnow().isoformat()
    count = 0
    for a in _assignments.values():
        if a["slip_id"] == slip_id and a["status"] == "pending":
            a["reminder_sent_at"] = now
            count += 1
    return count
