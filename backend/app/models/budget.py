"""
Camp Connect - Budget Models
Budget tracking with categories and expenses.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Budget(Base, TimestampMixin, SoftDeleteMixin):
    """
    Budget model - top-level budget for a fiscal year or campaign.
    Scoped to an organization via organization_id.
    """

    __tablename__ = "budgets"

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

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
    total_budget: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    organization = relationship("Organization", backref="budgets")
    categories: Mapped[list["BudgetCategory"]] = relationship(
        "BudgetCategory",
        back_populates="budget",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Budget(id={self.id}, name='{self.name}', year={self.fiscal_year})>"


class BudgetCategory(Base, TimestampMixin):
    """
    Budget category - a line item within a budget (e.g., Food & Supplies).
    """

    __tablename__ = "budget_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    budget_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("budgets.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    planned_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    budget: Mapped["Budget"] = relationship("Budget", back_populates="categories")
    expenses: Mapped[list["BudgetExpense"]] = relationship(
        "BudgetExpense",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<BudgetCategory(id={self.id}, name='{self.name}')>"


class BudgetExpense(Base, TimestampMixin):
    """
    Budget expense - an individual expense entry within a category.
    """

    __tablename__ = "budget_expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("budget_categories.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    description: Mapped[str] = mapped_column(String(500), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    vendor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    receipt_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, approved, rejected

    # Relationships
    category: Mapped["BudgetCategory"] = relationship(
        "BudgetCategory", back_populates="expenses"
    )

    def __repr__(self) -> str:
        return f"<BudgetExpense(id={self.id}, desc='{self.description}', amount={self.amount})>"
