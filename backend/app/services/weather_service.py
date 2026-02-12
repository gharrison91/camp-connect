"""
Camp Connect - Weather Service
Real weather data via Open-Meteo API (free, no API key required).
Pulls camp location from the organization's primary Location record.
Falls back to mock data if location not set or API unavailable.
"""

from __future__ import annotations

import logging
import uuid
import random
import math
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.location import Location

logger = logging.getLogger(__name__)

# ─── In-memory alert store (keyed by org_id) ───────────────────────────
_alerts: Dict[str, List[Dict[str, Any]]] = {}

# ─── Geocode + weather cache (15 min TTL) ──────────────────────────────
_coord_cache: Dict[str, Dict[str, Any]] = {}   # org_id → {lat, lon, name, fetched_at}
_weather_cache: Dict[str, Dict[str, Any]] = {}  # org_id → {data, fetched_at}
_forecast_cache: Dict[str, Dict[str, Any]] = {}

CACHE_TTL = 900  # 15 minutes


def _get_org_alerts(org_id: str) -> List[Dict[str, Any]]:
    if org_id not in _alerts:
        _alerts[org_id] = []
    return _alerts[org_id]


# ─── Location lookup ───────────────────────────────────────────────────

async def _get_camp_coords(org_id: str, db: AsyncSession) -> Optional[Dict[str, Any]]:
    """Look up the org's primary location and geocode it. Cached 15 min."""
    now = datetime.now(timezone.utc).timestamp()

    # Check cache
    cached = _coord_cache.get(org_id)
    if cached and (now - cached["fetched_at"]) < CACHE_TTL:
        return cached

    # Query primary location (prefer is_primary=True, fallback to first)
    result = await db.execute(
        select(Location).where(
            Location.organization_id == org_id,
            Location.deleted_at.is_(None),
        ).order_by(Location.is_primary.desc()).limit(1)
    )
    location = result.scalar_one_or_none()
    if not location or not location.city:
        return None

    location_name = f"{location.city}, {location.state}" if location.state else location.city

    # Geocode using Open-Meteo geocoding API
    try:
        search_term = f"{location.city} {location.state or ''} {location.zip_code or ''}".strip()
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": search_term, "count": 1, "language": "en", "format": "json"},
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if not results:
                return None
            lat = results[0]["latitude"]
            lon = results[0]["longitude"]
    except Exception as e:
        logger.warning(f"Geocoding failed for org {org_id}: {e}")
        return None

    entry = {"lat": lat, "lon": lon, "name": location_name, "fetched_at": now}
    _coord_cache[org_id] = entry
    return entry


# ─── WMO weather code → condition string ──────────────────────────────
_WMO_CONDITIONS = {
    0: "sunny", 1: "sunny", 2: "cloudy", 3: "cloudy",
    45: "cloudy", 48: "cloudy",
    51: "rainy", 53: "rainy", 55: "rainy",
    56: "rainy", 57: "rainy",
    61: "rainy", 63: "rainy", 65: "rainy",
    66: "rainy", 67: "rainy",
    71: "snowy", 73: "snowy", 75: "snowy", 77: "snowy",
    80: "rainy", 81: "rainy", 82: "rainy",
    85: "snowy", 86: "snowy",
    95: "stormy", 96: "stormy", 99: "stormy",
}

_ICON_MAP = {
    "sunny": "Sun", "cloudy": "Cloud", "rainy": "CloudRain",
    "stormy": "CloudLightning", "snowy": "CloudSnow",
}

_WIND_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]


# ─── Real weather fetchers ─────────────────────────────────────────────

async def get_current_conditions(org_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Get real current weather conditions from Open-Meteo."""
    coords = await _get_camp_coords(org_id, db)
    if not coords:
        return _mock_conditions("")

    now = datetime.now(timezone.utc).timestamp()
    cached = _weather_cache.get(org_id)
    if cached and (now - cached["fetched_at"]) < CACHE_TTL:
        return cached["data"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": coords["lat"],
                    "longitude": coords["lon"],
                    "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index",
                    "temperature_unit": "fahrenheit",
                    "wind_speed_unit": "mph",
                    "timezone": "auto",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        current = data.get("current", {})
        wmo_code = current.get("weather_code", 0)
        wind_deg = current.get("wind_direction_10m", 0)
        wind_dir = _WIND_DIRS[int((wind_deg + 22.5) / 45) % 8]

        result = {
            "temperature": round(current.get("temperature_2m", 72), 1),
            "feels_like": round(current.get("apparent_temperature", 72), 1),
            "humidity": int(current.get("relative_humidity_2m", 50)),
            "wind_speed": round(current.get("wind_speed_10m", 5), 1),
            "wind_direction": wind_dir,
            "conditions": _WMO_CONDITIONS.get(wmo_code, "sunny"),
            "uv_index": int(current.get("uv_index", 0)),
            "precipitation_chance": 0,
            "location_name": coords["name"],
        }

        _weather_cache[org_id] = {"data": result, "fetched_at": now}
        return result

    except Exception as e:
        logger.warning(f"Open-Meteo current weather failed for org {org_id}: {e}")
        return _mock_conditions(coords["name"])


async def get_forecast(org_id: str, db: AsyncSession) -> List[Dict[str, Any]]:
    """Get real 7-day forecast from Open-Meteo."""
    coords = await _get_camp_coords(org_id, db)
    if not coords:
        return _mock_forecast()

    now = datetime.now(timezone.utc).timestamp()
    cached = _forecast_cache.get(org_id)
    if cached and (now - cached["fetched_at"]) < CACHE_TTL:
        return cached["data"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": coords["lat"],
                    "longitude": coords["lon"],
                    "daily": "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
                    "temperature_unit": "fahrenheit",
                    "timezone": "auto",
                    "forecast_days": 7,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        daily = data.get("daily", {})
        dates = daily.get("time", [])
        highs = daily.get("temperature_2m_max", [])
        lows = daily.get("temperature_2m_min", [])
        codes = daily.get("weather_code", [])
        precip = daily.get("precipitation_probability_max", [])

        days_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        forecast = []
        for i in range(len(dates)):
            d = datetime.strptime(dates[i], "%Y-%m-%d")
            cond = _WMO_CONDITIONS.get(codes[i] if i < len(codes) else 0, "sunny")
            forecast.append({
                "date": dates[i],
                "day": "Today" if i == 0 else days_names[d.weekday()],
                "high": round(highs[i], 1) if i < len(highs) else 75,
                "low": round(lows[i], 1) if i < len(lows) else 60,
                "conditions": cond,
                "precipitation_chance": precip[i] if i < len(precip) else 0,
                "icon": _ICON_MAP.get(cond, "Sun"),
            })

        _forecast_cache[org_id] = {"data": forecast, "fetched_at": now}
        return forecast

    except Exception as e:
        logger.warning(f"Open-Meteo forecast failed for org {org_id}: {e}")
        return _mock_forecast()


# ─── Mock fallbacks ────────────────────────────────────────────────────

def _mock_conditions(location_name: str) -> Dict[str, Any]:
    now = datetime.now()
    hour = now.hour
    base_temp = 78
    temp_offset = 8 * math.sin((hour - 6) * math.pi / 12) if 6 <= hour <= 18 else -5
    temperature = round(base_temp + temp_offset, 1)
    return {
        "temperature": temperature,
        "feels_like": round(temperature + random.uniform(-2, 4), 1),
        "humidity": random.randint(40, 75),
        "wind_speed": round(random.uniform(2, 15), 1),
        "wind_direction": random.choice(_WIND_DIRS),
        "conditions": "sunny" if 6 <= hour <= 18 else "cloudy",
        "uv_index": min(11, max(0, int(6 * math.sin((hour - 6) * math.pi / 12)))) if 6 <= hour <= 18 else 0,
        "precipitation_chance": random.randint(0, 30),
        "location_name": location_name or "Location not set",
    }


def _mock_forecast() -> List[Dict[str, Any]]:
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    conditions_options = ["sunny", "cloudy", "rainy", "sunny", "sunny", "cloudy", "stormy"]
    today = datetime.now(timezone.utc)
    forecast = []
    for i in range(7):
        d = today + timedelta(days=i)
        cond = conditions_options[(d.day + i) % len(conditions_options)]
        high = round(random.uniform(75, 92), 1)
        low = round(high - random.uniform(10, 20), 1)
        forecast.append({
            "date": d.strftime("%Y-%m-%d"),
            "day": "Today" if i == 0 else days[d.weekday()],
            "high": high,
            "low": low,
            "conditions": cond,
            "precipitation_chance": random.randint(0, 80),
            "icon": _ICON_MAP.get(cond, "Sun"),
        })
    return forecast


# ─── Alert CRUD (still in-memory) ─────────────────────────────────────

async def create_alert(org_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    alert = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "alert_type": data["alert_type"],
        "severity": data["severity"],
        "title": data["title"],
        "description": data.get("description", ""),
        "source": data.get("source", "Manual"),
        "starts_at": data["starts_at"],
        "expires_at": data["expires_at"],
        "affected_areas": data.get("affected_areas", []),
        "recommended_actions": data.get("recommended_actions", []),
        "status": "active",
        "acknowledged_by": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _get_org_alerts(org_id).append(alert)
    return alert


async def update_alert(org_id: str, alert_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    for alert in _get_org_alerts(org_id):
        if alert["id"] == alert_id:
            for key, value in data.items():
                if value is not None and key in alert:
                    alert[key] = value
            return alert
    return None


async def dismiss_alert(org_id: str, alert_id: str) -> Optional[Dict[str, Any]]:
    for alert in _get_org_alerts(org_id):
        if alert["id"] == alert_id:
            alert["status"] = "dismissed"
            return alert
    return None


async def acknowledge_alert(org_id: str, alert_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    for alert in _get_org_alerts(org_id):
        if alert["id"] == alert_id:
            if user_id not in alert["acknowledged_by"]:
                alert["acknowledged_by"].append(user_id)
            return alert
    return None


async def get_active_alerts(org_id: str) -> List[Dict[str, Any]]:
    return [a for a in _get_org_alerts(org_id) if a["status"] == "active"]


async def get_alert_history(org_id: str) -> List[Dict[str, Any]]:
    return sorted(_get_org_alerts(org_id), key=lambda a: a["created_at"], reverse=True)
