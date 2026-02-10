"""Phase 10: Job Titles + Bunk Buddy Requests

Revision ID: f6a7b8c9d0e1
Revises: b1c2d3e4f5g6
Create Date: 2026-02-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers
revision = "f6a7b8c9d0e1"
down_revision = "b1c2d3e4f5g6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create job_titles table
    op.create_table(
        "job_titles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default="false"),
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

    # Add job_title_id FK to users table
    op.add_column(
        "users",
        sa.Column(
            "job_title_id",
            UUID(as_uuid=True),
            sa.ForeignKey("job_titles.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


    # Create bunk_buddy_requests table
    op.create_table(
        "bunk_buddy_requests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "event_id",
            UUID(as_uuid=True),
            sa.ForeignKey("events.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "requester_camper_id",
            UUID(as_uuid=True),
            sa.ForeignKey("campers.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "requested_camper_id",
            UUID(as_uuid=True),
            sa.ForeignKey("campers.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column(
            "submitted_by_contact_id",
            UUID(as_uuid=True),
            sa.ForeignKey("contacts.id"),
            nullable=True,
        ),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column(
            "reviewed_by",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.UniqueConstraint(
            "requester_camper_id",
            "requested_camper_id",
            "event_id",
            name="uq_buddy_request_per_event",
        ),
    )


def downgrade() -> None:
    op.drop_table("bunk_buddy_requests")
    op.drop_column("users", "job_title_id")
    op.drop_table("job_titles")
