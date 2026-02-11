"""
Camp Connect - Weather Service
Business logic for weather monitoring, alerts, conditions, and forecasts.
Uses in-memory storage for alerts and mock data for conditions/forecast.
"""

from __future__ import annotations

import uuid
import random
import math
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

# In-memory alert store (keyed by org_id)
_alerts: Dict[str, List[Dict[str, Any]]] = {}


def _get_org_alerts(org_id: str) -> List[Dict[str, Any]]:
    if org_id not in _alerts:
        _alerts[org_id] = []
    return _alerts[org_id]


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


async def get_current_conditions(org_id: str) -> Dict[str, Any]:
    """Return mock current weather conditions."""
    now = datetime.now()
    hour = now.hour
    # Simulate temperature curve: warmer midday, cooler at night
    base_temp = 78
    temp_offset = 8 * math.sin((hour - 6) * math.pi / 12) if 6 <= hour <= 18 else -5
    temperature = round(base_temp + temp_offset, 1)
    feels_like = round(temperature + random.uniform(-2, 4), 1)

    conditions_options = ["sunny", "cloudy", "sunny", "sunny", "cloudy"]
    conditions = conditions_options[now.minute % len(conditions_options)]

    if hour < 6 or hour > 20:
        conditions = "cloudy"

    return {
        "temperature": temperature,
        "feels_like": feels_like,
        "humidity": random.randint(40, 75),
        "wind_speed": round(random.uniform(2, 15), 1),
        "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
        "conditions": conditions,
        "uv_index": min(11, max(0, int(6 * math.sin((hour - 6) * math.pi / 12)))) if 6 <= hour <= 18 else 0,
        "precipitation_chance": random.randint(0, 30),
    }


async def get_forecast(org_id: str) -> List[Dict[str, Any]]:
    """Return mock 7-day forecast."""
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    conditions_options = ["sunny", "cloudy", "rainy", "sunny", "sunny", "cloudy", "stormy"]
    icon_map = {
        "sunny": "Sun",
        "cloudy": "Cloud",
        "rainy": "CloudRain",
        "stormy": "CloudLightning",
        "snowy": "CloudSnow",
    }
    today = datetime.now(timezone.utc)
    forecast = []
    for i in range(7):
        d = today + timedelta(days=i)
        cond = conditions_options[(d.day + i) % len(conditions_options)]
        high = round(random.uniform(75, 92), 1)
        low = round(high - random.uniform(10, 20), 1)
        forecast.append({
            "date": d.strftime("%Y-%m-%d"),
            "day": days[d.weekday()] if i > 0 else "Today",
            "high": high,
            "low": low,
            "conditions": cond,
            "precipitation_chance": random.randint(0, 80),
            "icon": icon_map.get(cond, "Sun"),
        })
    return forecast
