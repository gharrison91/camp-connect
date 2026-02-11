"""Phase 11: Camper Messaging, Medicine Schedules, Schools, Alerts, Cabins, Photo Albums

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-02-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers
revision = "g7h8i9j0k1l2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Cabins table ─────────────────────────────────────
    op.create_table(
        "cabins",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("total_capacity", sa.Integer, nullable=False, server_default="0"),
        sa.Column("gender_restriction", sa.String(20), nullable=False, server_default="all"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Add cabin_id to bunks
    op.add_column("bunks", sa.Column("cabin_id", UUID(as_uuid=True), sa.ForeignKey("cabins.id"), nullable=True))
    op.create_index("ix_bunks_cabin_id", "bunks", ["cabin_id"])

    # ─── Photo Albums table ───────────────────────────────
    op.create_table(
        "photo_albums",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("cover_photo_id", UUID(as_uuid=True), nullable=True),
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=True, index=True),
        sa.Column("activity_id", UUID(as_uuid=True), sa.ForeignKey("activities.id"), nullable=True),
        sa.Column("photo_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_auto_generated", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Add album_id to photos
    op.add_column("photos", sa.Column("album_id", UUID(as_uuid=True), sa.ForeignKey("photo_albums.id"), nullable=True))
    op.create_index("ix_photos_album_id", "photos", ["album_id"])

    # ─── Camper Messages table ────────────────────────────
    op.create_table(
        "camper_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("camper_id", UUID(as_uuid=True), sa.ForeignKey("campers.id"), nullable=False, index=True),
        sa.Column("contact_id", UUID(as_uuid=True), sa.ForeignKey("contacts.id"), nullable=False, index=True),
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=False, index=True),
        sa.Column("message_text", sa.Text, nullable=False),
        sa.Column("scheduled_date", sa.Date, nullable=False, index=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("read_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ─── Medicine Schedules table ─────────────────────────
    op.create_table(
        "medicine_schedules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("camper_id", UUID(as_uuid=True), sa.ForeignKey("campers.id"), nullable=False, index=True),
        sa.Column("event_id", UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=False, index=True),
        sa.Column("medicine_name", sa.String(255), nullable=False),
        sa.Column("dosage", sa.String(100), nullable=False),
        sa.Column("frequency", sa.String(50), nullable=False, server_default="daily"),
        sa.Column("scheduled_times", JSONB, nullable=True),
        sa.Column("special_instructions", sa.Text, nullable=True),
        sa.Column("prescribed_by", sa.String(255), nullable=True),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("submitted_by_contact_id", UUID(as_uuid=True), sa.ForeignKey("contacts.id"), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ─── Medicine Administrations table ───────────────────
    op.create_table(
        "medicine_administrations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("schedule_id", UUID(as_uuid=True), sa.ForeignKey("medicine_schedules.id"), nullable=False, index=True),
        sa.Column("administered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("administered_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("scheduled_time", sa.String(10), nullable=True),
        sa.Column("administration_date", sa.Date, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="given"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("parent_notified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("parent_notified_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ─── Schools table ────────────────────────────────────
    op.create_table(
        "schools",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=True, index=True),
        sa.Column("nces_id", sa.String(20), nullable=True, unique=True, index=True),
        sa.Column("name", sa.String(255), nullable=False, index=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("city", sa.String(100), nullable=True, index=True),
        sa.Column("state", sa.String(2), nullable=True, index=True),
        sa.Column("zip_code", sa.String(10), nullable=True),
        sa.Column("county", sa.String(100), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("school_type", sa.String(50), nullable=True),
        sa.Column("grade_range", sa.String(20), nullable=True),
        sa.Column("enrollment", sa.Integer, nullable=True),
        sa.Column("is_custom", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_verified", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ─── Contact Alerts table ─────────────────────────────
    op.create_table(
        "contact_alerts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("contact_id", UUID(as_uuid=True), sa.ForeignKey("contacts.id"), nullable=True, index=True),
        sa.Column("alert_type", sa.String(50), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("severity", sa.String(20), nullable=False, server_default="info"),
        sa.Column("entity_type", sa.String(50), nullable=True),
        sa.Column("entity_id", UUID(as_uuid=True), nullable=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_dismissed", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("metadata_json", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("contact_alerts")
    op.drop_table("schools")
    op.drop_table("medicine_administrations")
    op.drop_table("medicine_schedules")
    op.drop_table("camper_messages")
    op.drop_index("ix_photos_album_id", table_name="photos")
    op.drop_column("photos", "album_id")
    op.drop_table("photo_albums")
    op.drop_index("ix_bunks_cabin_id", table_name="bunks")
    op.drop_column("bunks", "cabin_id")
    op.drop_table("cabins")
