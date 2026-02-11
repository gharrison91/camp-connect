"""
Camp Connect - Skill Tracking Service
Business logic for camper skill progression and evaluation.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


# In-memory stores keyed by org_id
_categories: Dict[str, List[Dict[str, Any]]] = {}
_skills: Dict[str, List[Dict[str, Any]]] = {}
_progress: Dict[str, List[Dict[str, Any]]] = {}


def _org_key(org_id: uuid.UUID) -> str:
    return str(org_id)


# ---- Categories ----

async def list_categories(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    cats = _categories.get(key, [])
    skills = _skills.get(key, [])
    result = []
    for c in sorted(cats, key=lambda x: x["sort_order"]):
        count = sum(1 for s in skills if s["category_id"] == c["id"])
        result.append({**c, "org_id": org_id, "skill_count": count})
    return result


async def create_category(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    key = _org_key(org_id)
    if key not in _categories:
        _categories[key] = []
    cat = {
        "id": uuid.uuid4(),
        "org_id": org_id,
        "name": data["name"],
        "description": data.get("description"),
        "color": data.get("color", "#10B981"),
        "icon": data.get("icon", "star"),
        "sort_order": data.get("sort_order", len(_categories[key])),
        "skill_count": 0,
        "created_at": datetime.now(timezone.utc),
    }
    _categories[key].append(cat)
    return cat


async def update_category(
    org_id: uuid.UUID, category_id: uuid.UUID, data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for cat in _categories.get(key, []):
        if cat["id"] == category_id:
            for k, v in data.items():
                cat[k] = v
            return cat
    return None


async def delete_category(org_id: uuid.UUID, category_id: uuid.UUID) -> bool:
    key = _org_key(org_id)
    cats = _categories.get(key, [])
    before = len(cats)
    _categories[key] = [c for c in cats if c["id"] != category_id]
    # Also remove skills in this category
    skills = _skills.get(key, [])
    _skills[key] = [s for s in skills if s["category_id"] != category_id]
    return len(_categories[key]) < before


# ---- Skills ----

async def list_skills(
    org_id: uuid.UUID, category_id: Optional[uuid.UUID] = None
) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    skills = _skills.get(key, [])
    cats = {c["id"]: c["name"] for c in _categories.get(key, [])}
    result = []
    for s in skills:
        if category_id and s["category_id"] != category_id:
            continue
        result.append({**s, "org_id": org_id, "category_name": cats.get(s["category_id"], "")})
    return result


async def create_skill(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    key = _org_key(org_id)
    if key not in _skills:
        _skills[key] = []
    cats = {c["id"]: c["name"] for c in _categories.get(key, [])}
    cat_id = data["category_id"]
    skill = {
        "id": uuid.uuid4(),
        "org_id": org_id,
        "category_id": cat_id,
        "category_name": cats.get(cat_id, ""),
        "name": data["name"],
        "description": data.get("description"),
        "levels": data.get("levels", [
            {"level": 1, "name": "Beginner", "description": "Just starting out", "criteria": ""},
            {"level": 2, "name": "Novice", "description": "Basic understanding", "criteria": ""},
            {"level": 3, "name": "Intermediate", "description": "Competent", "criteria": ""},
            {"level": 4, "name": "Advanced", "description": "Skilled", "criteria": ""},
            {"level": 5, "name": "Expert", "description": "Mastery achieved", "criteria": ""},
        ]),
        "max_level": data.get("max_level", 5),
        "created_at": datetime.now(timezone.utc),
    }
    _skills[key].append(skill)
    return skill


async def update_skill(
    org_id: uuid.UUID, skill_id: uuid.UUID, data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    cats = {c["id"]: c["name"] for c in _categories.get(key, [])}
    for skill in _skills.get(key, []):
        if skill["id"] == skill_id:
            for k, v in data.items():
                skill[k] = v
            if "category_id" in data:
                skill["category_name"] = cats.get(data["category_id"], "")
            return skill
    return None


async def delete_skill(org_id: uuid.UUID, skill_id: uuid.UUID) -> bool:
    key = _org_key(org_id)
    skills = _skills.get(key, [])
    before = len(skills)
    _skills[key] = [s for s in skills if s["id"] != skill_id]
    return len(_skills[key]) < before


# ---- Evaluations / Progress ----

async def evaluate_camper(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    key = _org_key(org_id)
    if key not in _progress:
        _progress[key] = []

    camper_id = data["camper_id"]
    skill_id = data["skill_id"]
    level = data["level"]
    evaluator = data["evaluator"]
    notes = data.get("notes", "")
    target = data.get("target_level", 5)

    # Find skill name
    skill_name = ""
    category_name = ""
    for s in _skills.get(key, []):
        if s["id"] == skill_id:
            skill_name = s["name"]
            category_name = s.get("category_name", "")
            break

    now = datetime.now(timezone.utc)
    evaluation_entry = {
        "date": now.isoformat(),
        "evaluator": evaluator,
        "level": level,
        "notes": notes,
    }

    # Find existing progress or create new
    existing = None
    for p in _progress[key]:
        if p["camper_id"] == camper_id and p["skill_id"] == skill_id:
            existing = p
            break

    if existing:
        existing["current_level"] = level
        existing["last_evaluated"] = now
        existing["evaluations"].append(evaluation_entry)
        if target:
            existing["target_level"] = target
        return existing
    else:
        camper_name = f"Camper {str(camper_id)[:8]}"
        progress_entry = {
            "id": uuid.uuid4(),
            "camper_id": camper_id,
            "camper_name": camper_name,
            "skill_id": skill_id,
            "skill_name": skill_name,
            "category_name": category_name,
            "current_level": level,
            "target_level": target or 5,
            "evaluations": [evaluation_entry],
            "started_at": now,
            "last_evaluated": now,
        }
        _progress[key].append(progress_entry)
        return progress_entry


async def get_camper_progress(
    org_id: uuid.UUID, camper_id: uuid.UUID
) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    return [p for p in _progress.get(key, []) if p["camper_id"] == camper_id]


async def get_skill_leaderboard(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    progress = _progress.get(key, [])
    camper_map: Dict[uuid.UUID, Dict[str, Any]] = {}
    for p in progress:
        cid = p["camper_id"]
        if cid not in camper_map:
            camper_map[cid] = {
                "camper_id": cid,
                "camper_name": p["camper_name"],
                "total_levels": 0,
                "skills_count": 0,
            }
        camper_map[cid]["total_levels"] += p["current_level"]
        camper_map[cid]["skills_count"] += 1

    result = []
    for entry in camper_map.values():
        entry["avg_level"] = round(
            entry["total_levels"] / entry["skills_count"], 1
        ) if entry["skills_count"] > 0 else 0.0
        result.append(entry)

    return sorted(result, key=lambda x: x["total_levels"], reverse=True)


async def get_category_stats(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    cats = _categories.get(key, [])
    skills = _skills.get(key, [])
    progress = _progress.get(key, [])

    skill_cat_map = {s["id"]: s["category_id"] for s in skills}

    result = []
    for cat in cats:
        cat_skills = [s for s in skills if s["category_id"] == cat["id"]]
        cat_skill_ids = {s["id"] for s in cat_skills}
        cat_progress = [p for p in progress if p["skill_id"] in cat_skill_ids]
        total_evals = sum(len(p["evaluations"]) for p in cat_progress)
        avg = round(
            sum(p["current_level"] for p in cat_progress) / len(cat_progress), 1
        ) if cat_progress else 0.0
        result.append({
            "category_id": cat["id"],
            "category_name": cat["name"],
            "color": cat["color"],
            "total_skills": len(cat_skills),
            "total_evaluations": total_evals,
            "avg_level": avg,
        })
    return result
