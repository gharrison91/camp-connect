"""Background Check model for staff screening via Checkr."""
from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base


class BackgroundCheck(Base):
    __tablename__ = "background_checks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), nullable=False)
    staff_user_id = Column(UUID(as_uuid=True), nullable=False)
    provider = Column(String(50), default="checkr")  # checkr, manual
    external_id = Column(String(255), nullable=True)  # Checkr candidate/report ID
    package = Column(String(100), default="basic")  # basic, standard, professional
    status = Column(String(50), default="pending")  # pending, processing, complete, failed, flagged
    result = Column(String(50), nullable=True)  # clear, consider, suspended
    report_url = Column(Text, nullable=True)
    details = Column(JSONB, nullable=True)  # Full report details
    initiated_by = Column(UUID(as_uuid=True), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
