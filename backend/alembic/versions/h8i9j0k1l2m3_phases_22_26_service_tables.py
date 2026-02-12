"""Phases 22-26: Add service-layer tables to Alembic tracking

Creates 17 tables that were previously managed by raw SQL
CREATE TABLE IF NOT EXISTS in service files. This migration
brings them under Alembic version control.

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-02-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

# revision identifiers, used by Alembic.
revision: str = "h8i9j0k1l2m3"
down_revision: Union[str, None] = "g7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── Room Booking ────────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'other',
        capacity INT NOT NULL DEFAULT 0,
        amenities JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS room_bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        booked_by VARCHAR(255) NOT NULL,
        purpose VARCHAR(500) NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        recurring BOOLEAN NOT NULL DEFAULT FALSE,
        recurrence_pattern VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Announcements ───────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(20) NOT NULL DEFAULT 'general',
        priority VARCHAR(10) NOT NULL DEFAULT 'normal',
        author VARCHAR(255) NOT NULL,
        target_audience VARCHAR(20) NOT NULL DEFAULT 'all',
        is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
    """)

    # ─── Behavior Logs ───────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS behavior_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        camper_id UUID NOT NULL,
        camper_name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'concern',
        category VARCHAR(20) NOT NULL DEFAULT 'other',
        description TEXT NOT NULL,
        severity VARCHAR(10) NOT NULL DEFAULT 'low',
        reported_by VARCHAR(255) NOT NULL,
        action_taken TEXT,
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_date VARCHAR(20),
        parent_notified BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Allergy Entries ─────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS allergy_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        camper_id UUID NOT NULL,
        allergy_type VARCHAR(20) NOT NULL DEFAULT 'food',
        allergen VARCHAR(255) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'moderate',
        treatment TEXT,
        epipen_required BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Program Evaluations ─────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS program_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        program_name VARCHAR(255) NOT NULL,
        category VARCHAR(20) DEFAULT 'other',
        evaluator_name VARCHAR(255) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        strengths TEXT,
        improvements TEXT,
        camper_engagement VARCHAR(10) DEFAULT 'medium',
        safety_rating INT NOT NULL CHECK (safety_rating >= 1 AND safety_rating <= 5),
        notes TEXT,
        eval_date VARCHAR(20),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
    )
    """)

    # ─── Alumni ──────────────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS alumni (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        years_attended INTEGER[] DEFAULT '{}',
        role VARCHAR(20) DEFAULT 'camper',
        graduation_year INTEGER,
        current_city VARCHAR(255),
        current_state VARCHAR(100),
        bio TEXT,
        linkedin_url VARCHAR(500),
        profile_photo_url VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Lost & Found ────────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS lost_found_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(20) DEFAULT 'other',
        location_found VARCHAR(255),
        found_date DATE,
        found_by VARCHAR(255),
        photo_url TEXT,
        claimed_by VARCHAR(255),
        claimed_date DATE,
        status VARCHAR(20) DEFAULT 'unclaimed',
        created_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Supply Requests ─────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS supply_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(30) DEFAULT 'other',
        priority VARCHAR(10) DEFAULT 'medium',
        quantity INTEGER DEFAULT 1,
        estimated_cost NUMERIC(12, 2),
        needed_by DATE,
        requested_by VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        approved_by VARCHAR(255),
        approved_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Referrals ───────────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        referrer_name VARCHAR(255) NOT NULL,
        referrer_email VARCHAR(255),
        referrer_family_id UUID,
        referred_name VARCHAR(255) NOT NULL,
        referred_email VARCHAR(255),
        referred_phone VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        source VARCHAR(30) DEFAULT 'word_of_mouth',
        incentive_type VARCHAR(20) DEFAULT 'none',
        incentive_amount FLOAT,
        incentive_status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Feedback Entries ────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS feedback_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        submitted_by VARCHAR(255) NOT NULL,
        submitter_type VARCHAR(20) NOT NULL DEFAULT 'parent',
        category VARCHAR(20) NOT NULL DEFAULT 'general',
        rating INTEGER NOT NULL DEFAULT 3,
        title VARCHAR(255) NOT NULL,
        comment TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT FALSE,
        response TEXT,
        responded_by VARCHAR(255),
        responded_at TIMESTAMPTZ,
        status VARCHAR(20) NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Dietary Restrictions ────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS dietary_restrictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        camper_id UUID NOT NULL,
        restriction_type VARCHAR(20) NOT NULL DEFAULT 'food_allergy',
        restriction VARCHAR(255) NOT NULL,
        severity VARCHAR(10) NOT NULL DEFAULT 'moderate',
        alternatives TEXT,
        meal_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Staff Shifts ────────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS staff_shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        staff_name VARCHAR(255) NOT NULL,
        staff_id UUID,
        role VARCHAR(255) NOT NULL,
        shift_type VARCHAR(20) DEFAULT 'full_day',
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        location VARCHAR(255),
        day_of_week VARCHAR(10) NOT NULL,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Camper Goals ────────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS camper_goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        camper_id UUID NOT NULL,
        camper_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(20) NOT NULL DEFAULT 'personal',
        target_date VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'not_started',
        progress INTEGER NOT NULL DEFAULT 0,
        milestones JSONB,
        counselor_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Award Badges ────────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS award_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50) DEFAULT '⭐',
        color VARCHAR(20) DEFAULT '#F59E0B',
        category VARCHAR(20) DEFAULT 'achievement',
        points INTEGER DEFAULT 10,
        criteria TEXT,
        max_awards_per_session INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS award_grants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        badge_id UUID NOT NULL REFERENCES award_badges(id) ON DELETE CASCADE,
        camper_id UUID NOT NULL,
        granted_by UUID NOT NULL,
        reason TEXT,
        granted_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Group Notes ─────────────────────────────────────────────────────
    op.execute("""
    CREATE TABLE IF NOT EXISTS group_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL,
        group_name VARCHAR(255) NOT NULL,
        group_type VARCHAR(20) NOT NULL DEFAULT 'bunk',
        note_text TEXT NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        shift VARCHAR(20) NOT NULL DEFAULT 'morning',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
    )
    """)

    # ─── Indexes for common query patterns ───────────────────────────────
    op.execute("CREATE INDEX IF NOT EXISTS idx_rooms_org_id ON rooms(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_room_bookings_org_id ON room_bookings(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_room_bookings_room_id ON room_bookings(room_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_announcements_org_id ON announcements(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_behavior_logs_org_id ON behavior_logs(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_behavior_logs_camper_id ON behavior_logs(camper_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_allergy_entries_org_id ON allergy_entries(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_allergy_entries_camper_id ON allergy_entries(camper_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_program_evaluations_org_id ON program_evaluations(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_alumni_organization_id ON alumni(organization_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_lost_found_items_org_id ON lost_found_items(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_supply_requests_org_id ON supply_requests(organization_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_referrals_org_id ON referrals(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_feedback_entries_org_id ON feedback_entries(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_dietary_restrictions_org_id ON dietary_restrictions(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_dietary_restrictions_camper_id ON dietary_restrictions(camper_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_staff_shifts_org_id ON staff_shifts(organization_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_camper_goals_org_id ON camper_goals(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_camper_goals_camper_id ON camper_goals(camper_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_award_badges_org_id ON award_badges(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_award_grants_org_id ON award_grants(org_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_award_grants_badge_id ON award_grants(badge_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_award_grants_camper_id ON award_grants(camper_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_group_notes_org_id ON group_notes(org_id)")


def downgrade() -> None:
    # Drop indexes first
    op.execute("DROP INDEX IF EXISTS idx_group_notes_org_id")
    op.execute("DROP INDEX IF EXISTS idx_award_grants_camper_id")
    op.execute("DROP INDEX IF EXISTS idx_award_grants_badge_id")
    op.execute("DROP INDEX IF EXISTS idx_award_grants_org_id")
    op.execute("DROP INDEX IF EXISTS idx_award_badges_org_id")
    op.execute("DROP INDEX IF EXISTS idx_camper_goals_camper_id")
    op.execute("DROP INDEX IF EXISTS idx_camper_goals_org_id")
    op.execute("DROP INDEX IF EXISTS idx_staff_shifts_org_id")
    op.execute("DROP INDEX IF EXISTS idx_dietary_restrictions_camper_id")
    op.execute("DROP INDEX IF EXISTS idx_dietary_restrictions_org_id")
    op.execute("DROP INDEX IF EXISTS idx_feedback_entries_org_id")
    op.execute("DROP INDEX IF EXISTS idx_referrals_org_id")
    op.execute("DROP INDEX IF EXISTS idx_supply_requests_org_id")
    op.execute("DROP INDEX IF EXISTS idx_lost_found_items_org_id")
    op.execute("DROP INDEX IF EXISTS idx_alumni_organization_id")
    op.execute("DROP INDEX IF EXISTS idx_program_evaluations_org_id")
    op.execute("DROP INDEX IF EXISTS idx_allergy_entries_camper_id")
    op.execute("DROP INDEX IF EXISTS idx_allergy_entries_org_id")
    op.execute("DROP INDEX IF EXISTS idx_behavior_logs_camper_id")
    op.execute("DROP INDEX IF EXISTS idx_behavior_logs_org_id")
    op.execute("DROP INDEX IF EXISTS idx_announcements_org_id")
    op.execute("DROP INDEX IF EXISTS idx_room_bookings_room_id")
    op.execute("DROP INDEX IF EXISTS idx_room_bookings_org_id")
    op.execute("DROP INDEX IF EXISTS idx_rooms_org_id")

    # Drop tables in reverse dependency order
    op.execute("DROP TABLE IF EXISTS group_notes")
    op.execute("DROP TABLE IF EXISTS award_grants")
    op.execute("DROP TABLE IF EXISTS award_badges")
    op.execute("DROP TABLE IF EXISTS camper_goals")
    op.execute("DROP TABLE IF EXISTS staff_shifts")
    op.execute("DROP TABLE IF EXISTS dietary_restrictions")
    op.execute("DROP TABLE IF EXISTS feedback_entries")
    op.execute("DROP TABLE IF EXISTS referrals")
    op.execute("DROP TABLE IF EXISTS supply_requests")
    op.execute("DROP TABLE IF EXISTS lost_found_items")
    op.execute("DROP TABLE IF EXISTS alumni")
    op.execute("DROP TABLE IF EXISTS program_evaluations")
    op.execute("DROP TABLE IF EXISTS allergy_entries")
    op.execute("DROP TABLE IF EXISTS behavior_logs")
    op.execute("DROP TABLE IF EXISTS announcements")
    op.execute("DROP TABLE IF EXISTS room_bookings")
    op.execute("DROP TABLE IF EXISTS rooms")
