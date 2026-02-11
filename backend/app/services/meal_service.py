"""
Camp Connect - Meal Planning Service
Business logic for meal planning and dietary management.
Uses in-memory JSON storage (no database model required).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional


# ---- In-memory stores (per-org, keyed by org_id) ----
_meals_store: Dict[str, List[Dict[str, Any]]] = {}
_meal_plans_store: Dict[str, List[Dict[str, Any]]] = {}
_dietary_restrictions_store: Dict[str, List[Dict[str, Any]]] = {}


def _org_key(org_id: uuid.UUID) -> str:
    return str(org_id)


# ---- Meals CRUD ----

async def get_meals(
    org_id: uuid.UUID,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    meal_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List meals for an organization with optional date range and type filters."""
    key = _org_key(org_id)
    meals = _meals_store.get(key, [])

    results = []
    for m in meals:
        if date_from and m["date"] < date_from.isoformat():
            continue
        if date_to and m["date"] > date_to.isoformat():
            continue
        if meal_type and m["meal_type"] != meal_type:
            continue
        results.append(m)

    return sorted(results, key=lambda x: (x["date"], x["meal_type"]))


async def create_meal(
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new meal."""
    key = _org_key(org_id)
    if key not in _meals_store:
        _meals_store[key] = []

    meal = {
        "id": str(uuid.uuid4()),
        "org_id": str(org_id),
        "name": data["name"],
        "meal_type": data["meal_type"],
        "date": data["date"].isoformat() if isinstance(data["date"], date) else data["date"],
        "description": data.get("description"),
        "menu_items": data.get("menu_items", []),
        "allergens": data.get("allergens", []),
        "nutritional_info": data.get("nutritional_info", {}),
        "created_at": datetime.utcnow().isoformat(),
    }
    _meals_store[key].append(meal)
    return meal


async def update_meal(
    org_id: uuid.UUID,
    meal_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing meal."""
    key = _org_key(org_id)
    meals = _meals_store.get(key, [])

    for i, m in enumerate(meals):
        if m["id"] == str(meal_id):
            for field, value in data.items():
                if value is not None:
                    if isinstance(value, date):
                        meals[i][field] = value.isoformat()
                    else:
                        meals[i][field] = value
            return meals[i]
    return None


async def delete_meal(
    org_id: uuid.UUID,
    meal_id: uuid.UUID,
) -> bool:
    """Delete a meal."""
    key = _org_key(org_id)
    meals = _meals_store.get(key, [])

    for i, m in enumerate(meals):
        if m["id"] == str(meal_id):
            meals.pop(i)
            return True
    return False


# ---- Meal Plans ----

async def get_meal_plan(
    org_id: uuid.UUID,
    week_start: Optional[date] = None,
) -> List[Dict[str, Any]]:
    """Get meal plans, optionally filtered by week start date."""
    key = _org_key(org_id)
    plans = _meal_plans_store.get(key, [])

    if week_start:
        plans = [p for p in plans if p["week_start"] == week_start.isoformat()]

    # Attach meals to each plan
    all_meals = _meals_store.get(key, [])
    for plan in plans:
        meal_ids = plan.get("meal_ids", [])
        plan["meals"] = [m for m in all_meals if m["id"] in meal_ids]

    return plans


async def create_meal_plan(
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new meal plan."""
    key = _org_key(org_id)
    if key not in _meal_plans_store:
        _meal_plans_store[key] = []

    plan = {
        "id": str(uuid.uuid4()),
        "org_id": str(org_id),
        "name": data["name"],
        "week_start": data["week_start"].isoformat() if isinstance(data["week_start"], date) else data["week_start"],
        "meal_ids": [str(mid) for mid in data.get("meal_ids", [])],
        "meals": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    _meal_plans_store[key].append(plan)

    # Attach meals
    all_meals = _meals_store.get(key, [])
    plan["meals"] = [m for m in all_meals if m["id"] in plan["meal_ids"]]

    return plan


async def update_meal_plan(
    org_id: uuid.UUID,
    plan_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing meal plan."""
    key = _org_key(org_id)
    plans = _meal_plans_store.get(key, [])

    for i, p in enumerate(plans):
        if p["id"] == str(plan_id):
            for field, value in data.items():
                if value is not None:
                    if isinstance(value, date):
                        plans[i][field] = value.isoformat()
                    elif field == "meal_ids":
                        plans[i][field] = [str(mid) for mid in value]
                    else:
                        plans[i][field] = value
            # Refresh attached meals
            all_meals = _meals_store.get(key, [])
            plans[i]["meals"] = [m for m in all_meals if m["id"] in plans[i].get("meal_ids", [])]
            return plans[i]
    return None


# ---- Dietary Restrictions ----

async def get_dietary_restrictions(
    org_id: uuid.UUID,
    camper_id: Optional[uuid.UUID] = None,
) -> List[Dict[str, Any]]:
    """List dietary restrictions, optionally filtered by camper."""
    key = _org_key(org_id)
    restrictions = _dietary_restrictions_store.get(key, [])

    if camper_id:
        restrictions = [r for r in restrictions if r["camper_id"] == str(camper_id)]

    return restrictions


async def create_dietary_restriction(
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Add a dietary restriction for a camper."""
    key = _org_key(org_id)
    if key not in _dietary_restrictions_store:
        _dietary_restrictions_store[key] = []

    restriction = {
        "id": str(uuid.uuid4()),
        "camper_id": str(data["camper_id"]),
        "camper_name": data.get("camper_name"),
        "restriction_type": data["restriction_type"],
        "item": data["item"],
        "severity": data.get("severity", "moderate"),
        "notes": data.get("notes"),
        "created_at": datetime.utcnow().isoformat(),
    }
    _dietary_restrictions_store[key].append(restriction)
    return restriction


# ---- Allergen Conflict Check ----

async def check_allergen_conflicts(
    org_id: uuid.UUID,
    meal_id: uuid.UUID,
) -> Dict[str, Any]:
    """Cross-reference a meal's allergens with camper dietary restrictions."""
    key = _org_key(org_id)
    meals = _meals_store.get(key, [])
    restrictions = _dietary_restrictions_store.get(key, [])

    meal = None
    for m in meals:
        if m["id"] == str(meal_id):
            meal = m
            break

    if meal is None:
        return {"meal_id": str(meal_id), "conflicts": [], "warning_count": 0}

    meal_allergens = [a.lower() for a in meal.get("allergens", [])]
    conflicts = []

    for r in restrictions:
        item_lower = r["item"].lower()
        if item_lower in meal_allergens or any(a in item_lower for a in meal_allergens):
            conflicts.append({
                "camper_id": r["camper_id"],
                "camper_name": r.get("camper_name", "Unknown"),
                "restriction_type": r["restriction_type"],
                "item": r["item"],
                "severity": r["severity"],
                "meal_allergen": next((a for a in meal.get("allergens", []) if a.lower() == item_lower or item_lower in a.lower()), r["item"]),
            })

    return {
        "meal_id": str(meal_id),
        "meal_name": meal["name"],
        "meal_allergens": meal.get("allergens", []),
        "conflicts": conflicts,
        "warning_count": len(conflicts),
        "severe_count": len([c for c in conflicts if c["severity"] == "severe"]),
    }


# ---- Statistics ----

async def get_meal_stats(
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Get meal planning statistics for the organization."""
    key = _org_key(org_id)
    meals = _meals_store.get(key, [])
    restrictions = _dietary_restrictions_store.get(key, [])
    plans = _meal_plans_store.get(key, [])

    # Count meals by type
    type_counts: Dict[str, int] = {}
    for m in meals:
        mt = m["meal_type"]
        type_counts[mt] = type_counts.get(mt, 0) + 1

    # Allergen frequency
    allergen_counts: Dict[str, int] = {}
    for m in meals:
        for a in m.get("allergens", []):
            allergen_counts[a] = allergen_counts.get(a, 0) + 1

    # Top allergens
    top_allergens = sorted(allergen_counts.items(), key=lambda x: -x[1])[:10]

    # Restriction type counts
    restriction_type_counts: Dict[str, int] = {}
    for r in restrictions:
        rt = r["restriction_type"]
        restriction_type_counts[rt] = restriction_type_counts.get(rt, 0) + 1

    # Unique campers with restrictions
    campers_with_restrictions = len(set(r["camper_id"] for r in restrictions))

    return {
        "total_meals": len(meals),
        "total_plans": len(plans),
        "total_restrictions": len(restrictions),
        "campers_with_restrictions": campers_with_restrictions,
        "meals_by_type": type_counts,
        "top_allergens": [{"name": a[0], "count": a[1]} for a in top_allergens],
        "restrictions_by_type": restriction_type_counts,
    }
