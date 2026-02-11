"""
Camp Connect - Emergency Service
Business logic for emergency action plans & drills (in-memory store).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

_plans: Dict[str, List[Dict[str, Any]]] = {}
_drills: Dict[str, List[Dict[str, Any]]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_org_plans(org_id: str) -> List[Dict[str, Any]]:
    return _plans.setdefault(org_id, [])


def _get_org_drills(org_id: str) -> List[Dict[str, Any]]:
    return _drills.setdefault(org_id, [])


# ---- Plans CRUD ----

async def list_plans(
    org_id: str,
    *,
    status: Optional[str] = None,
    plan_type: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    items = _get_org_plans(org_id)
    results = []
    for p in items:
        if status and p["status"] != status:
            continue
        if plan_type and p["plan_type"] != plan_type:
            continue
        if search:
            q = search.lower()
            if q not in p["name"].lower() and q not in p["description"].lower():
                continue
        results.append(p)
    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results


async def get_plan(org_id: str, plan_id: str) -> Optional[Dict[str, Any]]:
    for p in _get_org_plans(org_id):
        if p["id"] == plan_id:
            return p
    return None


async def create_plan(org_id: str, *, data: Dict[str, Any]) -> Dict[str, Any]:
    now = _now_iso()
    plan = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "name": data["name"],
        "plan_type": data.get("plan_type", "other"),
        "description": data.get("description", ""),
        "steps": [s if isinstance(s, dict) else s.model_dump() for s in data.get("steps", [])],
        "assembly_points": [a if isinstance(a, dict) else a.model_dump() for a in data.get("assembly_points", [])],
        "emergency_contacts": [c if isinstance(c, dict) else c.model_dump() for c in data.get("emergency_contacts", [])],
        "status": data.get("status", "draft"),
        "last_reviewed": now,
        "next_review_date": data.get("next_review_date"),
        "version": 1,
        "created_at": now,
    }
    _get_org_plans(org_id).append(plan)
    return plan


async def update_plan(org_id: str, plan_id: str, *, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    plan = await get_plan(org_id, plan_id)
    if not plan:
        return None
    for key, val in data.items():
        if val is not None:
            if key in ("steps", "assembly_points", "emergency_contacts"):
                plan[key] = [v if isinstance(v, dict) else v.model_dump() for v in val]
            else:
                plan[key] = val
    plan["last_reviewed"] = _now_iso()
    plan["version"] = plan.get("version", 1) + 1
    return plan


async def delete_plan(org_id: str, plan_id: str) -> bool:
    plans = _get_org_plans(org_id)
    for i, p in enumerate(plans):
        if p["id"] == plan_id:
            plans.pop(i)
            return True
    return False


# ---- Drills CRUD ----

async def list_drills(
    org_id: str,
    *,
    status: Optional[str] = None,
    plan_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    items = _get_org_drills(org_id)
    results = []
    for d in items:
        if status and d["status"] != status:
            continue
        if plan_id and d["plan_id"] != plan_id:
            continue
        results.append(d)
    results.sort(key=lambda x: x["drill_date"], reverse=True)
    return results


async def get_drill(org_id: str, drill_id: str) -> Optional[Dict[str, Any]]:
    for d in _get_org_drills(org_id):
        if d["id"] == drill_id:
            return d
    return None


async def create_drill(org_id: str, *, data: Dict[str, Any]) -> Dict[str, Any]:
    now = _now_iso()
    plan = await get_plan(org_id, data["plan_id"])
    plan_name = plan["name"] if plan else "Unknown Plan"
    drill = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "plan_id": data["plan_id"],
        "plan_name": plan_name,
        "drill_date": data["drill_date"],
        "start_time": data.get("start_time"),
        "end_time": data.get("end_time"),
        "duration_minutes": data.get("duration_minutes"),
        "participants_count": data.get("participants_count", 0),
        "evaluator": data.get("evaluator", ""),
        "score": data.get("score", 0),
        "observations": data.get("observations", ""),
        "improvements_needed": data.get("improvements_needed", []),
        "status": data.get("status", "scheduled"),
        "created_at": now,
    }
    _get_org_drills(org_id).append(drill)
    return drill


async def update_drill(org_id: str, drill_id: str, *, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    drill = await get_drill(org_id, drill_id)
    if not drill:
        return None
    for key, val in data.items():
        if val is not None:
            drill[key] = val
    if data.get("plan_id"):
        plan = await get_plan(org_id, data["plan_id"])
        drill["plan_name"] = plan["name"] if plan else "Unknown Plan"
    return drill


async def delete_drill(org_id: str, drill_id: str) -> bool:
    drills = _get_org_drills(org_id)
    for i, d in enumerate(drills):
        if d["id"] == drill_id:
            drills.pop(i)
            return True
    return False


# ---- Aggregation ----

async def get_upcoming_drills(org_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    drills = _get_org_drills(org_id)
    upcoming = [d for d in drills if d["status"] == "scheduled" and d["drill_date"] >= today]
    upcoming.sort(key=lambda x: x["drill_date"])
    return upcoming[:limit]


async def get_drill_history(org_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    drills = _get_org_drills(org_id)
    completed = [d for d in drills if d["status"] == "completed"]
    completed.sort(key=lambda x: x["drill_date"], reverse=True)
    return completed[:limit]


async def get_overdue_reviews(org_id: str) -> List[Dict[str, Any]]:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    plans = _get_org_plans(org_id)
    return [p for p in plans if p["status"] == "active" and p.get("next_review_date") and p["next_review_date"] < today]


async def get_plan_stats(org_id: str) -> Dict[str, Any]:
    plans = _get_org_plans(org_id)
    drills = _get_org_drills(org_id)
    active_plans = [p for p in plans if p["status"] == "active"]
    now = datetime.now(timezone.utc)
    quarter_start = datetime(now.year, ((now.month - 1) // 3) * 3 + 1, 1, tzinfo=timezone.utc)
    quarter_drills = [d for d in drills if d["status"] == "completed" and d["drill_date"] >= quarter_start.strftime("%Y-%m-%d")]
    scores = [d["score"] for d in quarter_drills if d.get("score", 0) > 0]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None
    today = now.strftime("%Y-%m-%d")
    overdue = [p for p in active_plans if p.get("next_review_date") and p["next_review_date"] < today]
    return {
        "total_active_plans": len(active_plans),
        "drills_this_quarter": len(quarter_drills),
        "avg_drill_score": avg_score,
        "overdue_reviews": len(overdue),
    }
