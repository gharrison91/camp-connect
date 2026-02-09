"""
Camp Connect - Analytics Schemas
Pydantic v2 response models for analytics endpoints.
"""

from __future__ import annotations

import uuid
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# --- Enrollment Trends ---

class EnrollmentTrendItem(BaseModel):
    """Single data point for enrollment trend."""
    date: str
    count: int

    model_config = ConfigDict(from_attributes=True)


class EnrollmentTrendsResponse(BaseModel):
    """Enrollment trends over time."""
    trends: List[EnrollmentTrendItem]
    total: int

    model_config = ConfigDict(from_attributes=True)


# --- Revenue Metrics ---

class RevenuePeriodItem(BaseModel):
    """Revenue for a single period (month)."""
    period: str
    amount: float

    model_config = ConfigDict(from_attributes=True)


class RevenueMetricsResponse(BaseModel):
    """Revenue metrics summary."""
    total_revenue: float
    pending_revenue: float
    deposit_revenue: float
    revenue_by_period: List[RevenuePeriodItem]

    model_config = ConfigDict(from_attributes=True)


# --- Event Capacity ---

class EventCapacityItem(BaseModel):
    """Capacity stats for a single event."""
    event_id: uuid.UUID
    event_name: str
    capacity: int
    enrolled: int
    utilization: float

    model_config = ConfigDict(from_attributes=True)


class EventCapacityResponse(BaseModel):
    """Event capacity statistics."""
    events: List[EventCapacityItem]

    model_config = ConfigDict(from_attributes=True)


# --- Registration Status Breakdown ---

class RegistrationStatusResponse(BaseModel):
    """Registration counts by status."""
    pending: int
    confirmed: int
    cancelled: int
    waitlisted: int
    total: int

    model_config = ConfigDict(from_attributes=True)


# --- Communication Stats ---

class CommunicationStatsResponse(BaseModel):
    """Communication delivery statistics."""
    total_sent: int
    email_sent: int
    sms_sent: int
    delivered: int
    failed: int
    bounced: int
    delivery_rate: float

    model_config = ConfigDict(from_attributes=True)


# --- Camper Demographics ---

class AgeBucketItem(BaseModel):
    """Age distribution bucket."""
    range: str
    count: int

    model_config = ConfigDict(from_attributes=True)


class GenderItem(BaseModel):
    """Gender distribution item."""
    gender: str
    count: int

    model_config = ConfigDict(from_attributes=True)


class LocationItem(BaseModel):
    """Location distribution item."""
    state: str
    count: int

    model_config = ConfigDict(from_attributes=True)


class CamperDemographicsResponse(BaseModel):
    """Camper demographic breakdown."""
    age_distribution: List[AgeBucketItem]
    gender_distribution: List[GenderItem]
    location_distribution: List[LocationItem]

    model_config = ConfigDict(from_attributes=True)
