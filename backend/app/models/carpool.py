"""
Camp Connect - Carpool Models
Carpool coordination with riders for camp transportation.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Carpool(Base, TimestampMixin, SoftDeleteMixin):
    """
    Carpool model - a driver offering rides to/from camp.
    Scoped to an organization via organization_id.
    """

    __tablename__ = "carpools"

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

    driver_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    pickup_location: Mapped[str] = mapped_column(String(500), nullable=False)
    dropoff_location: Mapped[str] = mapped_column(
        String(500), nullable=False, default="Camp"
    )
    departure_time: Mapped[str] = mapped_column(String(50), nullable=False)
    seats_available: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    days: Mapped[Optional[list]] = mapped_column(
        ARRAY(String), nullable=True, default=list
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    organization = relationship("Organization", backref="carpools")
    riders: Mapped[list["CarpoolRider"]] = relationship(
        "CarpoolRider",
        back_populates="carpool",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Carpool(id={self.id}, driver='{self.driver_name}')>"


class CarpoolRider(Base, TimestampMixin):
    """
    A rider (camper) assigned to a carpool.
    """

    __tablename__ = "carpool_riders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    carpool_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("carpools.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    camper_name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, confirmed

    # Relationships
    carpool: Mapped["Carpool"] = relationship("Carpool", back_populates="riders")

    def __repr__(self) -> str:
        return f"<CarpoolRider(id={self.id}, camper='{self.camper_name}')>"
