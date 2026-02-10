"""
Camp Connect - User Model
Staff and admin accounts linked to Supabase Auth.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class User(Base, TimestampMixin, SoftDeleteMixin):
    """
    User model - staff/admin accounts.
    Linked to Supabase auth.users via supabase_user_id.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    supabase_user_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
        nullable=False,
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
        nullable=False,
    )

    # Profile
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Staff fields
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    staff_category: Mapped[Optional[str]] = mapped_column(
        String(30), nullable=True, default=None
    )  # full_time, counselor, director
    onboarding_status: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True, default=None
    )  # invited, onboarding, active

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Financial info (JSONB for pay rate, employment dates, notes)
    financial_info: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Seasonal access
    seasonal_access_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    seasonal_access_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    role = relationship("Role", back_populates="users", lazy="joined")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"
