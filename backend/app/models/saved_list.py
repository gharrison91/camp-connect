"""
Camp Connect - Saved Lists / Custom Segments Models
Static or dynamic lists of contacts/campers for retargeting.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class SavedList(Base, TimestampMixin, SoftDeleteMixin):
    """
    A saved list / segment of contacts or campers.
    Can be static (manual members) or dynamic (filter-based).
    """

    __tablename__ = "saved_lists"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    list_type: Mapped[str] = mapped_column(
        String(20), default="static"
    )  # static, dynamic
    entity_type: Mapped[str] = mapped_column(
        String(50), default="contact"
    )  # contact, camper
    filter_criteria: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # For dynamic lists
    member_count: Mapped[int] = mapped_column(Integer, default=0)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Relationships
    members = relationship("SavedListMember", back_populates="saved_list", cascade="all, delete-orphan")


class SavedListMember(Base):
    """
    A member of a static saved list.
    """

    __tablename__ = "saved_list_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    list_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("saved_lists.id", ondelete="CASCADE"),
        index=True,
    )
    entity_type: Mapped[str] = mapped_column(String(50))  # contact, camper
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    added_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Relationships
    saved_list = relationship("SavedList", back_populates="members")
