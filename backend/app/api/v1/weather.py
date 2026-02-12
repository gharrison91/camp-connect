"""
Camp Connect - Weather Monitoring API
Endpoints for weather alerts, current conditions, and forecasts.
"""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.weather import (
    WeatherAlertCreate,
    WeatherAlertResponse,
    WeatherAlertUpdate,
    WeatherCondition,
    WeatherForecast,
)
from app.services import weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


# ─── Current Conditions ──────────────────────────────────

@router.get("/conditions", response_model=WeatherCondition)
async def get_conditions(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current weather conditions for the camp location."""
    org_id = str(current_user["organization_id"])
    return await weather_service.get_current_conditions(org_id, db)


# ─── Forecast ────────────────────────────────────────────

@router.get("/forecast", response_model=List[WeatherForecast])
async def get_forecast(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get 7-day weather forecast for the camp location."""
    org_id = str(current_user["organization_id"])
    return await weather_service.get_forecast(org_id, db)


# ─── Active Alerts ───────────────────────────────────────

@router.get("/alerts", response_model=List[WeatherAlertResponse])
async def get_active_alerts(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get all active weather alerts."""
    org_id = str(current_user["organization_id"])
    return await weather_service.get_active_alerts(org_id)


# ─── Alert History ───────────────────────────────────────

@router.get("/history", response_model=List[WeatherAlertResponse])
async def get_alert_history(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get weather alert history."""
    org_id = str(current_user["organization_id"])
    return await weather_service.get_alert_history(org_id)


# ─── Create Alert ────────────────────────────────────────

@router.post("/alerts", response_model=WeatherAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: WeatherAlertCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create a manual weather alert."""
    org_id = str(current_user["organization_id"])
    data = payload.model_dump()
    return await weather_service.create_alert(org_id, data)


# ─── Update Alert ────────────────────────────────────────

@router.put("/alerts/{alert_id}", response_model=WeatherAlertResponse)
async def update_alert(
    alert_id: str,
    payload: WeatherAlertUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Update a weather alert."""
    org_id = str(current_user["organization_id"])
    data = payload.model_dump(exclude_unset=True)
    result = await weather_service.update_alert(org_id, alert_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return result


# ─── Dismiss Alert ───────────────────────────────────────

@router.post("/alerts/{alert_id}/dismiss", response_model=WeatherAlertResponse)
async def dismiss_alert(
    alert_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Dismiss a weather alert."""
    org_id = str(current_user["organization_id"])
    result = await weather_service.dismiss_alert(org_id, alert_id)
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return result


# ─── Acknowledge Alert ───────────────────────────────────

@router.post("/alerts/{alert_id}/acknowledge", response_model=WeatherAlertResponse)
async def acknowledge_alert(
    alert_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Acknowledge a weather alert."""
    org_id = str(current_user["organization_id"])
    user_id = str(current_user["id"])
    result = await weather_service.acknowledge_alert(org_id, alert_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return result
