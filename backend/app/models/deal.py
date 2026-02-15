"""Deal / CRM Pipeline model."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class Deal(Base):
    __tablename__ = "deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    value = Column(Float, default=0)
    stage = Column(String(50), default="lead")  # lead, qualified, proposal, negotiation, closed_won, closed_lost
    priority = Column(String(20), default="medium")  # low, medium, high
    source = Column(String(100), nullable=True)  # website, referral, event, walk-in, etc.
    expected_close_date = Column(DateTime, nullable=True)
    actual_close_date = Column(DateTime, nullable=True)
    assigned_to = Column(UUID(as_uuid=True), nullable=True)  # staff user_id
    notes = Column(Text, nullable=True)
    position = Column(Integer, default=0)  # for ordering within a stage
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
