"""Add event_id and activity_id to photos

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-02-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "photos",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "photos",
        sa.Column("activity_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_photos_event_id",
        "photos",
        "events",
        ["event_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_photos_activity_id",
        "photos",
        "activities",
        ["activity_id"],
        ["id"],
    )
    op.create_index("ix_photos_event_id", "photos", ["event_id"])
    op.create_index("ix_photos_activity_id", "photos", ["activity_id"])


def downgrade() -> None:
    op.drop_index("ix_photos_activity_id", table_name="photos")
    op.drop_index("ix_photos_event_id", table_name="photos")
    op.drop_constraint("fk_photos_activity_id", "photos", type_="foreignkey")
    op.drop_constraint("fk_photos_event_id", "photos", type_="foreignkey")
    op.drop_column("photos", "activity_id")
    op.drop_column("photos", "event_id")
