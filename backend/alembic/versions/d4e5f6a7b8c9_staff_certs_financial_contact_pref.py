"""staff_certs_financial_contact_pref

Revision ID: d4e5f6a7b8c9
Revises: b2c3d4e5f6a7
Create Date: 2026-02-09 22:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Certification Types table ──
    op.create_table(
        "certification_types",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("is_required", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("expiry_days", sa.Integer, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── Staff Certification Records table ──
    op.create_table(
        "staff_certification_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "certification_type_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("certification_types.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("issued_date", sa.Date, nullable=True),
        sa.Column("expiry_date", sa.Date, nullable=True),
        sa.Column("document_url", sa.String(500), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "verified_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── Add financial_info JSONB column to users table ──
    op.add_column(
        "users",
        sa.Column("financial_info", postgresql.JSONB, nullable=True),
    )

    # ── Add communication_preference to contacts table ──
    op.add_column(
        "contacts",
        sa.Column(
            "communication_preference",
            sa.String(20),
            nullable=False,
            server_default="email",
        ),
    )


def downgrade() -> None:
    op.drop_column("contacts", "communication_preference")
    op.drop_column("users", "financial_info")
    op.drop_table("staff_certification_records")
    op.drop_table("certification_types")
