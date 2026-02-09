"""Camp Connect - Camp Store Models."""
from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, TenantMixin


class StoreItem(Base, TimestampMixin, TenantMixin):
    """An item available in the camp store."""
    __tablename__ = "store_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # snacks, clothing, gear, other
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    quantity_in_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    organization = relationship("Organization", backref="store_items")


class SpendingAccount(Base, TimestampMixin, TenantMixin):
    """Per-camper spending account for the camp store."""
    __tablename__ = "spending_accounts"
    __table_args__ = (
        UniqueConstraint("organization_id", "camper_id", name="uq_spending_account_org_camper"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camper_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("campers.id"), index=True, nullable=False)
    balance: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    daily_limit: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    # Relationships
    camper = relationship("Camper", lazy="selectin")


class StoreTransaction(Base, TimestampMixin, TenantMixin):
    """Record of a camp store purchase."""
    __tablename__ = "store_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camper_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("campers.id"), index=True, nullable=False)
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("store_items.id"), index=True, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    transaction_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    recorded_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    camper = relationship("Camper", lazy="selectin")
    item = relationship("StoreItem", lazy="selectin")
