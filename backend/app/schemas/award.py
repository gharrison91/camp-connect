"""
Camp Connect - Award & Badge Schemas
Gamification system: badges, grants, leaderboard.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---- Badge schemas ----

class AwardBadgeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    icon: str = Field(default="⭐", max_length=50)
    color: str = Field(default="#F59E0B", max_length=20)
    category: str = Field(
        default="achievement",
        pattern="^(skill|behavior|achievement|milestone|special)$",
    )
    points: int = Field(default=10, ge=0)
    criteria: Optional[str] = None
    max_awards_per_session: Optional[int] = Field(default=None, ge=1)


class AwardBadgeCreate(AwardBadgeBase):
    pass


class AwardBadgeUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    icon: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)
    category: Optional[str] = Field(
        default=None,
        pattern="^(skill|behavior|achievement|milestone|special)$",
    )
    points: Optional[int] = Field(default=None, ge=0)
    criteria: Optional[str] = None
    max_awards_per_session: Optional[int] = Field(default=None, ge=1)


class AwardBadgeResponse(AwardBadgeBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    times_awarded: int = 0
    created_at: datetime


# ---- Grant schemas ----

class AwardGrantBase(BaseModel):
    badge_id: uuid.UUID
    camper_id: uuid.UUID
    reason: Optional[str] = None


class AwardGrantCreate(AwardGrantBase):
    pass


class AwardGrantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    badge_id: uuid.UUID
    badge_name: str
    badge_icon: str
    badge_color: str
    camper_id: uuid.UUID
    camper_name: str
    granted_by: uuid.UUID
    granted_by_name: str
    reason: Optional[str] = None
    granted_at: datetime


# ---- Summary / Leaderboard schemas ----

class CamperAwardsSummary(BaseModel):
    camper_id: uuid.UUID
    camper_name: str
    total_points: int
    badges: List[AwardGrantResponse]
    recent_awards: List[AwardGrantResponse]


class LeaderboardEntry(BaseModel):
    rank: int
    camper_id: uuid.UUID
    camper_name: str
    total_points: int
    badge_count: int


class AwardStats(BaseModel):
    total_awards_given: int
    active_badges: int
    most_popular_badge: Optional[str] = None
    top_earner_name: Optional[str] = None
    top_earner_points: int = 0
