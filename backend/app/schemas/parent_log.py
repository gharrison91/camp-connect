"""
Camp Connect - Parent Communication Log & Check-In Schemas
"""
from __future__ import annotations
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ParentLogBase(BaseModel):
    parent_id: str
    parent_name: str
    camper_id: str
    camper_name: str
    log_type: str = Field("phone_call", description="phone_call, email, in_person, portal_message, emergency, note")
    direction: str = Field("outbound", description="inbound or outbound")
    subject: str = Field("", max_length=300)
    notes: str = Field("", max_length=5000)
    sentiment: str = Field("neutral", description="positive, neutral, concerned, urgent")
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class ParentLogCreate(ParentLogBase):
    pass


class ParentLogUpdate(BaseModel):
    subject: Optional[str] = None
    notes: Optional[str] = None
    sentiment: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None
    follow_up_completed: Optional[bool] = None
    tags: Optional[List[str]] = None


class ParentLogResponse(BaseModel):
    id: str
    org_id: str
    parent_id: str
    parent_name: str
    camper_id: str
    camper_name: str
    staff_id: str
    staff_name: str
    log_type: str
    direction: str
    subject: str
    notes: str
    sentiment: str
    follow_up_required: bool
    follow_up_date: Optional[str] = None
    follow_up_completed: bool = False
    tags: List[str] = Field(default_factory=list)
    created_at: str
    model_config = {"from_attributes": True}


class CheckInBase(BaseModel):
    camper_id: str
    camper_name: str
    check_in_type: str = Field("daily", description="daily, weekly, custom")
    date: str
    mood: str = Field("good", description="great, good, okay, struggling")
    activities_participated: List[str] = Field(default_factory=list)
    meals_eaten: str = Field("all", description="all, most, some, few")
    health_notes: str = Field("", max_length=2000)
    staff_notes: str = Field("", max_length=2000)


class CheckInCreate(CheckInBase):
    pass


class CheckInResponse(BaseModel):
    id: str
    org_id: str
    camper_id: str
    camper_name: str
    check_in_type: str
    date: str
    mood: str
    activities_participated: List[str] = Field(default_factory=list)
    meals_eaten: str
    health_notes: str
    staff_notes: str
    shared_with_parents: bool = False
    created_at: str
    model_config = {"from_attributes": True}


class ParentLogStats(BaseModel):
    total_communications_this_week: int = 0
    check_ins_today: int = 0
    follow_ups_due: int = 0
    response_rate: float = 0.0
    by_type: Dict[str, int] = Field(default_factory=dict)
    by_sentiment: Dict[str, int] = Field(default_factory=dict)
