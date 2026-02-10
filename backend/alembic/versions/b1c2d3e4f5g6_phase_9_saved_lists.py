"""Phase 9: Saved Lists / Custom Segments

Revision ID: b1c2d3e4f5g6
Revises: a1b2c3d4e5f6
Create Date: 2026-02-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers
revision = "b1c2d3e4f5g6"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Saved Lists table
    op.create_table(
        "saved_lists",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("list_type", sa.String(20), nullable=False, server_default="static"),
        sa.Column("entity_type", sa.String(50), nullable=False, server_default="contact"),
        sa.Column("filter_criteria", JSONB, nullable=True),
        sa.Column("member_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Saved List Members table
    op.create_table(
        "saved_list_members",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("list_id", UUID(as_uuid=True), sa.ForeignKey("saved_lists.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("added_by", UUID(as_uuid=True), nullable=True),
    )

    # Unique constraint: one entity per list
    op.create_unique_constraint(
        "uq_saved_list_member_entity",
        "saved_list_members",
        ["list_id", "entity_id"],
    )


def downgrade() -> None:
    op.drop_table("saved_list_members")
    op.drop_table("saved_lists")
