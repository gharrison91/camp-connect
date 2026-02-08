"""
Camp Connect - Role and Permission Models
Custom roles per organization with granular permissions.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Role(Base, TimestampMixin):
    """
    Role model - custom roles per organization.
    Each role has a set of permission strings.
    """

    __tablename__ = "roles"

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
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_system: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationships
    organization = relationship("Organization", back_populates="roles")
    users = relationship("User", back_populates="role")
    permissions = relationship(
        "RolePermission",
        back_populates="role",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}')>"


class RolePermission(Base):
    """
    RolePermission model - stores individual permission flags per role.
    Permission strings follow the format: module.resource.action
    e.g., 'core.events.create', 'health.forms.read'
    """

    __tablename__ = "role_permissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    permission: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    role = relationship("Role", back_populates="permissions")

    __table_args__ = (
        UniqueConstraint("role_id", "permission", name="uq_role_permission"),
    )

    def __repr__(self) -> str:
        return f"<RolePermission(role_id={self.role_id}, permission='{self.permission}')>"
