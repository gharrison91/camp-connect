"""Add platform_role column to users table for Super Admin support

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-02-11 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "i9j0k1l2m3n4"
down_revision: Union[str, None] = "h8i9j0k1l2m3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if column already exists before adding
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'users' AND column_name = 'platform_role'"
        )
    )
    if result.fetchone() is None:
        op.add_column(
            "users",
            sa.Column("platform_role", sa.String(30), nullable=True, default=None),
        )


def downgrade() -> None:
    # Check if column exists before dropping
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'users' AND column_name = 'platform_role'"
        )
    )
    if result.fetchone() is not None:
        op.drop_column("users", "platform_role")
