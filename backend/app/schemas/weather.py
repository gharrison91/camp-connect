"""
Camp Connect - Weather Monitoring Schemas
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class WeatherCondition(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    wind_speed: float
    wind_direction: str
    conditions: str
    uv_index: int
    precipitation_chance: int


class WeatherForecast(BaseModel):
    date: str
    day: str
    high: float
    low: float
    conditions: str
    precipitation_chance: int
    icon: str


class WeatherAlertBase(BaseModel):
    alert_type: str
    severity: str
    title: str
    description: str = ""
    source: str = "Manual"
    starts_at: str
    expires_at: str
    affected_areas: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)


class WeatherAlertCreate(WeatherAlertBase):
    pass


class WeatherAlertUpdate(BaseModel):
    alert_type: Optional[str] = None
    severity: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    starts_at: Optional[str] = None
    expires_at: Optional[str] = None
    affected_areas: Optional[List[str]] = None
    recommended_actions: Optional[List[str]] = None
    status: Optional[str] = None


class WeatherAlertResponse(BaseModel):
    id: str
    org_id: str
    alert_type: str
    severity: str
    title: str
    description: str
    source: str
    starts_at: str
    expires_at: str
    affected_areas: List[str]
    recommended_actions: List[str]
    status: str
    acknowledged_by: List[str]
    created_at: str
