"""
Camp Connect - Packing List Service
In-memory storage for packing list templates and assignments.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional


_templates_store: Dict[str, List[Dict[str, Any]]] = {}
_assignments_store: Dict[str, List[Dict[str, Any]]] = {}


def _org_key(org_id: uuid.UUID) -> str:
    return str(org_id)


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

async def get_templates(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    return sorted(
        _templates_store.get(key, []),
        key=lambda t: t.get("created_at", ""),
        reverse=True,
    )


async def get_template(org_id: uuid.UUID, template_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for t in _templates_store.get(key, []):
        if t["id"] == str(template_id):
            return t
    return None


async def create_template(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    key = _org_key(org_id)
    template = {
        "id": str(uuid.uuid4()),
        "organization_id": str(org_id),
        **data,
        "created_at": datetime.utcnow().isoformat(),
    }
    _templates_store.setdefault(key, []).append(template)
    return template


async def update_template(
    org_id: uuid.UUID,
    template_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for t in _templates_store.get(key, []):
        if t["id"] == str(template_id):
            for k, val in data.items():
                if val is not None:
                    t[k] = val
            return t
    return None


async def delete_template(org_id: uuid.UUID, template_id: uuid.UUID) -> bool:
    key = _org_key(org_id)
    templates = _templates_store.get(key, [])
    before = len(templates)
    _templates_store[key] = [t for t in templates if t["id"] != str(template_id)]
    assignments = _assignments_store.get(key, [])
    _assignments_store[key] = [a for a in assignments if a["template_id"] != str(template_id)]
    return len(_templates_store[key]) < before


# ---------------------------------------------------------------------------
# Assignments
# ---------------------------------------------------------------------------

async def assign_template(
    org_id: uuid.UUID,
    template_id: uuid.UUID,
    camper_ids: List[uuid.UUID],
) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    template = await get_template(org_id, template_id)
    if template is None:
        return []

    new_assignments: List[Dict[str, Any]] = []
    existing = _assignments_store.get(key, [])

    for camper_id in camper_ids:
        already = any(
            a["template_id"] == str(template_id) and a["camper_id"] == str(camper_id)
            for a in existing
        )
        if already:
            continue

        assignment = {
            "id": str(uuid.uuid4()),
            "template_id": str(template_id),
            "template_name": template.get("name", ""),
            "camper_id": str(camper_id),
            "camper_name": "",
            "event_name": "",
            "items": template.get("items", []),
            "items_checked": [],
            "status": "not_started",
            "created_at": datetime.utcnow().isoformat(),
        }
        new_assignments.append(assignment)

    _assignments_store.setdefault(key, []).extend(new_assignments)
    return new_assignments


async def get_assignments(
    org_id: uuid.UUID,
    template_id: Optional[uuid.UUID] = None,
    camper_id: Optional[uuid.UUID] = None,
) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    assignments = _assignments_store.get(key, [])

    if template_id:
        assignments = [a for a in assignments if a["template_id"] == str(template_id)]
    if camper_id:
        assignments = [a for a in assignments if a["camper_id"] == str(camper_id)]

    return sorted(assignments, key=lambda a: a.get("created_at", ""), reverse=True)


async def check_item(
    org_id: uuid.UUID,
    assignment_id: uuid.UUID,
    item_name: str,
    checked: bool,
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for a in _assignments_store.get(key, []):
        if a["id"] == str(assignment_id):
            checked_items: List[str] = a.get("items_checked", [])
            if checked and item_name not in checked_items:
                checked_items.append(item_name)
            elif not checked and item_name in checked_items:
                checked_items.remove(item_name)
            a["items_checked"] = checked_items

            total_items = len(a.get("items", []))
            checked_count = len(checked_items)
            if checked_count == 0:
                a["status"] = "not_started"
            elif checked_count >= total_items:
                a["status"] = "complete"
            else:
                a["status"] = "in_progress"

            return a
    return None


async def get_stats(org_id: uuid.UUID) -> Dict[str, Any]:
    key = _org_key(org_id)
    templates = _templates_store.get(key, [])
    assignments = _assignments_store.get(key, [])

    total_templates = len(templates)
    active_assignments = len(assignments)
    fully_packed = sum(1 for a in assignments if a.get("status") == "complete")

    if active_assignments > 0:
        total_progress = 0.0
        for a in assignments:
            total_items = len(a.get("items", []))
            checked_count = len(a.get("items_checked", []))
            if total_items > 0:
                total_progress += checked_count / total_items
        completion_rate = round((total_progress / active_assignments) * 100, 1)
    else:
        completion_rate = 0.0

    return {
        "total_templates": total_templates,
        "active_assignments": active_assignments,
        "completion_rate": completion_rate,
        "fully_packed": fully_packed,
    }
