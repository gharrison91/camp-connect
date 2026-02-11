"""
Camp Connect - Survey Models
Feedback/survey system with questions, responses, and analytics.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Survey(Base, TimestampMixin, SoftDeleteMixin):
    """
    Survey model - feedback surveys with configurable questions.
    Scoped to an organization via organization_id.
    """

    __tablename__ = "surveys"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
        nullable=False,
    )

    # Basic info
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_audience: Mapped[str] = mapped_column(
        String(50), nullable=False, default="all"
    )  # parents, staff, campers, all
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="draft"
    )  # draft, active, closed

    # Schedule
    start_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization = relationship("Organization", backref="surveys")
    questions = relationship(
        "SurveyQuestion",
        back_populates="survey",
        cascade="all, delete-orphan",
        order_by="SurveyQuestion.order",
    )
    responses = relationship(
        "SurveyResponse",
        back_populates="survey",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Survey(id={self.id}, title='{self.title}', status='{self.status}')>"


class SurveyQuestion(Base, TimestampMixin):
    """
    SurveyQuestion model - individual questions within a survey.
    """

    __tablename__ = "survey_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    survey_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("surveys.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="text"
    )  # text, rating, multiple_choice, yes_no
    options: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    survey = relationship("Survey", back_populates="questions")

    def __repr__(self) -> str:
        return f"<SurveyQuestion(id={self.id}, type='{self.question_type}', order={self.order})>"


class SurveyResponse(Base, TimestampMixin):
    """
    SurveyResponse model - submitted answers to a survey.
    """

    __tablename__ = "survey_responses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    survey_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("surveys.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    respondent_name: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    respondent_email: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    answers: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
    )

    # Relationships
    survey = relationship("Survey", back_populates="responses")

    def __repr__(self) -> str:
        return f"<SurveyResponse(id={self.id}, survey_id={self.survey_id})>"
