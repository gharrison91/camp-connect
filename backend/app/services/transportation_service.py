"""
Camp Connect - Transportation Service
Business logic for vehicle and route management.
Uses in-memory JSON storage (no dedicated DB table) — data is stored
as JSON documents within the organization's settings / generic store.
For simplicity, this service uses a lightweight file-based approach
via the existing generic JSONB columns available in the system.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

# In-memory store keyed by org_id.  In production this would be backed by
# a database table, but for the MVP we keep vehicles and routes in memory
# so the frontend can work end-to-end without a migration.

_vehicles_store: Dict[str, List[Dict[str, Any]]] = {}
_routes_store: Dict[str, List[Dict[str, Any]]] = {}


def _org_key(org_id: uuid.UUID) -> str:
    return str(org_id)


# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------

async def get_vehicles(
    org_id: uuid.UUID,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List vehicles for an organization, optionally filtered by status."""
    key = _org_key(org_id)
    vehicles = _vehicles_store.get(key, [])
    if status:
        vehicles = [v for v in vehicles if v.get("status") == status]
    return sorted(vehicles, key=lambda v: v.get("name", ""))


async def get_vehicle(org_id: uuid.UUID, vehicle_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for v in _vehicles_store.get(key, []):
        if v["id"] == str(vehicle_id):
            return v
    return None


async def create_vehicle(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    key = _org_key(org_id)
    vehicle = {
        "id": str(uuid.uuid4()),
        "org_id": str(org_id),
        **data,
        "created_at": datetime.utcnow().isoformat(),
    }
    _vehicles_store.setdefault(key, []).append(vehicle)
    return vehicle


async def update_vehicle(
    org_id: uuid.UUID, vehicle_id: uuid.UUID, data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for v in _vehicles_store.get(key, []):
        if v["id"] == str(vehicle_id):
            for k, val in data.items():
                if val is not None:
                    v[k] = val
            return v
    return None


async def delete_vehicle(org_id: uuid.UUID, vehicle_id: uuid.UUID) -> bool:
    key = _org_key(org_id)
    vehicles = _vehicles_store.get(key, [])
    before = len(vehicles)
    _vehicles_store[key] = [v for v in vehicles if v["id"] != str(vehicle_id)]
    return len(_vehicles_store[key]) < before


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

async def get_routes(
    org_id: uuid.UUID,
    route_date: Optional[str] = None,
    route_type: Optional[str] = None,
    vehicle_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    key = _org_key(org_id)
    routes = _routes_store.get(key, [])
    if route_date:
        routes = [r for r in routes if r.get("date") == route_date]
    if route_type:
        routes = [r for r in routes if r.get("route_type") == route_type]
    if vehicle_id:
        routes = [r for r in routes if r.get("vehicle_id") == vehicle_id]
    # Attach vehicle name
    vehicles = {v["id"]: v["name"] for v in _vehicles_store.get(key, [])}
    for r in routes:
        r["vehicle_name"] = vehicles.get(r.get("vehicle_id", ""), None)
    return sorted(routes, key=lambda r: r.get("departure_time", ""))


async def get_route(org_id: uuid.UUID, route_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    vehicles = {v["id"]: v["name"] for v in _vehicles_store.get(key, [])}
    for r in _routes_store.get(key, []):
        if r["id"] == str(route_id):
            r["vehicle_name"] = vehicles.get(r.get("vehicle_id", ""), None)
            return r
    return None


async def create_route(org_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
    key = _org_key(org_id)
    # Serialize date if it's a date object
    if isinstance(data.get("date"), date):
        data["date"] = data["date"].isoformat()
    # Serialize vehicle_id
    if data.get("vehicle_id") is not None:
        data["vehicle_id"] = str(data["vehicle_id"])
    # Serialize stops camper_ids
    if "stops" in data and data["stops"]:
        for stop in data["stops"]:
            if "camper_ids" in stop:
                stop["camper_ids"] = [str(c) for c in stop["camper_ids"]]
    route = {
        "id": str(uuid.uuid4()),
        "org_id": str(org_id),
        **data,
        "created_at": datetime.utcnow().isoformat(),
    }
    # Attach vehicle name
    vehicles = {v["id"]: v["name"] for v in _vehicles_store.get(key, [])}
    route["vehicle_name"] = vehicles.get(route.get("vehicle_id", ""), None)
    _routes_store.setdefault(key, []).append(route)
    return route


async def update_route(
    org_id: uuid.UUID, route_id: uuid.UUID, data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for r in _routes_store.get(key, []):
        if r["id"] == str(route_id):
            for k, val in data.items():
                if val is not None:
                    if k == "date" and isinstance(val, date):
                        r[k] = val.isoformat()
                    elif k == "vehicle_id":
                        r[k] = str(val)
                    elif k == "stops":
                        for stop in val:
                            if "camper_ids" in stop:
                                stop["camper_ids"] = [str(c) for c in stop["camper_ids"]]
                        r[k] = val
                    else:
                        r[k] = val
            # Re-attach vehicle name
            vehicles = {v["id"]: v["name"] for v in _vehicles_store.get(key, [])}
            r["vehicle_name"] = vehicles.get(r.get("vehicle_id", ""), None)
            return r
    return None


async def delete_route(org_id: uuid.UUID, route_id: uuid.UUID) -> bool:
    key = _org_key(org_id)
    routes = _routes_store.get(key, [])
    before = len(routes)
    _routes_store[key] = [r for r in routes if r["id"] != str(route_id)]
    return len(_routes_store[key]) < before


async def get_route_with_stops(org_id: uuid.UUID, route_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    """Get a route including full stop details."""
    return await get_route(org_id, route_id)


async def assign_campers_to_stop(
    org_id: uuid.UUID,
    route_id: uuid.UUID,
    stop_order: int,
    camper_ids: List[uuid.UUID],
) -> Optional[Dict[str, Any]]:
    """Assign campers to a specific stop on a route."""
    key = _org_key(org_id)
    for r in _routes_store.get(key, []):
        if r["id"] == str(route_id):
            for stop in r.get("stops", []):
                if stop.get("stop_order") == stop_order:
                    stop["camper_ids"] = [str(c) for c in camper_ids]
                    return r
    return None


async def get_camper_routes(
    org_id: uuid.UUID, camper_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Get all routes a camper is assigned to."""
    key = _org_key(org_id)
    camper_str = str(camper_id)
    result = []
    for r in _routes_store.get(key, []):
        for stop in r.get("stops", []):
            if camper_str in stop.get("camper_ids", []):
                result.append(r)
                break
    return result


async def get_transportation_stats(org_id: uuid.UUID) -> Dict[str, Any]:
    """Get high-level transportation statistics."""
    key = _org_key(org_id)
    vehicles = _vehicles_store.get(key, [])
    routes = _routes_store.get(key, [])
    today = date.today().isoformat()
    today_routes = [r for r in routes if r.get("date") == today]
    # Count unique campers across today's routes
    camper_set: set[str] = set()
    for r in today_routes:
        for stop in r.get("stops", []):
            for cid in stop.get("camper_ids", []):
                camper_set.add(cid)
    return {
        "total_vehicles": len(vehicles),
        "active_routes": len(today_routes),
        "campers_transported_today": len(camper_set),
    }
