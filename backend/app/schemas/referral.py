"""
Camp Connect - Referral Tracking Schemas
Pydantic models for the referral tracking system.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class ReferralBase(BaseModel):
    referrer_name: str = Field(..., min_length=1, max_length=255)
    referrer_email: Optional[str] = Field(default=None, max_length=255)
    referrer_family_id: Optional[uuid.UUID] = None
    referred_name: str = Field(..., min_length=1, max_length=255)
    referred_email: Optional[str] = Field(default=None, max_length=255)
    referred_phone: Optional[str] = Field(default=None, max_length=50)
    status: str = Field(
        default="pending",
        pattern="^(pending|contacted|registered|completed|expired)$",
    )
    source: str = Field(
        default="word_of_mouth",
        pattern="^(word_of_mouth|social_media|website|event|other)$",
    )
    incentive_type: str = Field(
        default="none",
        pattern="^(discount|credit|gift|none)$",
    )
    incentive_amount: Optional[float] = Field(default=None, ge=0)
    incentive_status: str = Field(
        default="pending",
        pattern="^(pending|awarded|redeemed)$",
    )
    notes: Optional[str] = None


class ReferralCreate(ReferralBase):
    pass


class ReferralUpdate(BaseModel):
    referrer_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    referrer_email: Optional[str] = Field(default=None, max_length=255)
    referrer_family_id: Optional[uuid.UUID] = None
    referred_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    referred_email: Optional[str] = Field(default=None, max_length=255)
    referred_phone: Optional[str] = Field(default=None, max_length=50)
    status: Optional[str] = Field(
        default=None,
        pattern="^(pending|contacted|registered|completed|expired)$",
    )
    source: Optional[str] = Field(
        default=None,
        pattern="^(word_of_mouth|social_media|website|event|other)$",
    )
    incentive_type: Optional[str] = Field(
        default=None,
        pattern="^(discount|credit|gift|none)$",
    )
    incentive_amount: Optional[float] = Field(default=None, ge=0)
    incentive_status: Optional[str] = Field(
        default=None,
        pattern="^(pending|awarded|redeemed)$",
    )
    notes: Optional[str] = None


class Referral(ReferralBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ReferralStats(BaseModel):
    total: int
    converted: int
    conversion_rate: float
    total_incentives: float
    by_source: Dict[str, int]
    by_status: Dict[str, int]
