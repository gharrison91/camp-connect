"""phase_7_scheduling_payments_portal_store

Revision ID: a1b2c3d4e5f6
Revises: 13ee715b1156
Create Date: 2026-02-09 12:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '13ee715b1156'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Schedules ────────────────────────────────────────────
    op.create_table('schedules',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('event_id', sa.UUID(), nullable=False),
        sa.Column('activity_id', sa.UUID(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('staff_user_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('max_capacity', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_cancelled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['event_id'], ['events.id']),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'activity_id', 'date', 'start_time', name='uq_schedule_event_activity_date_time'),
    )
    op.create_index(op.f('ix_schedules_organization_id'), 'schedules', ['organization_id'], unique=False)
    op.create_index(op.f('ix_schedules_event_id'), 'schedules', ['event_id'], unique=False)
    op.create_index(op.f('ix_schedules_activity_id'), 'schedules', ['activity_id'], unique=False)

    # ── Schedule Assignments ─────────────────────────────────
    op.create_table('schedule_assignments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('schedule_id', sa.UUID(), nullable=False),
        sa.Column('camper_id', sa.UUID(), nullable=True),
        sa.Column('bunk_id', sa.UUID(), nullable=True),
        sa.Column('assigned_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['schedule_id'], ['schedules.id']),
        sa.ForeignKeyConstraint(['camper_id'], ['campers.id']),
        sa.ForeignKeyConstraint(['bunk_id'], ['bunks.id']),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('schedule_id', 'camper_id', name='uq_schedule_assignment_camper'),
    )
    op.create_index(op.f('ix_schedule_assignments_organization_id'), 'schedule_assignments', ['organization_id'], unique=False)
    op.create_index(op.f('ix_schedule_assignments_schedule_id'), 'schedule_assignments', ['schedule_id'], unique=False)
    op.create_index(op.f('ix_schedule_assignments_camper_id'), 'schedule_assignments', ['camper_id'], unique=False)
    op.create_index(op.f('ix_schedule_assignments_bunk_id'), 'schedule_assignments', ['bunk_id'], unique=False)

    # ── Invoices ─────────────────────────────────────────────
    op.create_table('invoices',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('family_id', sa.UUID(), nullable=True),
        sa.Column('contact_id', sa.UUID(), nullable=True),
        sa.Column('registration_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('line_items', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('tax', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('total', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('stripe_invoice_id', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['family_id'], ['families.id']),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_invoices_organization_id'), 'invoices', ['organization_id'], unique=False)
    op.create_index(op.f('ix_invoices_family_id'), 'invoices', ['family_id'], unique=False)
    op.create_index(op.f('ix_invoices_contact_id'), 'invoices', ['contact_id'], unique=False)

    # ── Payments ─────────────────────────────────────────────
    op.create_table('payments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('invoice_id', sa.UUID(), nullable=True),
        sa.Column('registration_id', sa.UUID(), nullable=True),
        sa.Column('contact_id', sa.UUID(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='usd'),
        sa.Column('payment_method', sa.String(length=50), nullable=False, server_default='stripe'),
        sa.Column('stripe_payment_intent_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_charge_id', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('refund_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id']),
        sa.ForeignKeyConstraint(['registration_id'], ['registrations.id']),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_payments_organization_id'), 'payments', ['organization_id'], unique=False)
    op.create_index(op.f('ix_payments_invoice_id'), 'payments', ['invoice_id'], unique=False)
    op.create_index(op.f('ix_payments_registration_id'), 'payments', ['registration_id'], unique=False)
    op.create_index(op.f('ix_payments_contact_id'), 'payments', ['contact_id'], unique=False)

    # ── Notification Configs ─────────────────────────────────
    op.create_table('notification_configs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('trigger_type', sa.String(length=50), nullable=False),
        sa.Column('channel', sa.String(length=20), nullable=False, server_default='email'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('template_id', sa.UUID(), nullable=True),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['template_id'], ['message_templates.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notification_configs_organization_id'), 'notification_configs', ['organization_id'], unique=False)

    # ── Store Items ──────────────────────────────────────────
    op.create_table('store_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('quantity_in_stock', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_store_items_organization_id'), 'store_items', ['organization_id'], unique=False)

    # ── Spending Accounts ────────────────────────────────────
    op.create_table('spending_accounts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('camper_id', sa.UUID(), nullable=False),
        sa.Column('balance', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('daily_limit', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['camper_id'], ['campers.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id', 'camper_id', name='uq_spending_account_org_camper'),
    )
    op.create_index(op.f('ix_spending_accounts_organization_id'), 'spending_accounts', ['organization_id'], unique=False)
    op.create_index(op.f('ix_spending_accounts_camper_id'), 'spending_accounts', ['camper_id'], unique=False)

    # ── Store Transactions ───────────────────────────────────
    op.create_table('store_transactions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('camper_id', sa.UUID(), nullable=False),
        sa.Column('item_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('transaction_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('recorded_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['camper_id'], ['campers.id']),
        sa.ForeignKeyConstraint(['item_id'], ['store_items.id']),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_store_transactions_organization_id'), 'store_transactions', ['organization_id'], unique=False)
    op.create_index(op.f('ix_store_transactions_camper_id'), 'store_transactions', ['camper_id'], unique=False)
    op.create_index(op.f('ix_store_transactions_item_id'), 'store_transactions', ['item_id'], unique=False)

    # ── Event Bunk Configs ───────────────────────────────────
    op.create_table('event_bunk_configs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('event_id', sa.UUID(), nullable=False),
        sa.Column('bunk_id', sa.UUID(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('event_capacity', sa.Integer(), nullable=True),
        sa.Column('counselor_user_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['event_id'], ['events.id']),
        sa.ForeignKeyConstraint(['bunk_id'], ['bunks.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'bunk_id', name='uq_event_bunk_config'),
    )
    op.create_index(op.f('ix_event_bunk_configs_organization_id'), 'event_bunk_configs', ['organization_id'], unique=False)
    op.create_index(op.f('ix_event_bunk_configs_event_id'), 'event_bunk_configs', ['event_id'], unique=False)
    op.create_index(op.f('ix_event_bunk_configs_bunk_id'), 'event_bunk_configs', ['bunk_id'], unique=False)

    # ── Contact portal columns ───────────────────────────────
    op.add_column('contacts', sa.Column('portal_access', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('contacts', sa.Column('portal_token', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('contacts', 'portal_token')
    op.drop_column('contacts', 'portal_access')

    op.drop_index(op.f('ix_event_bunk_configs_bunk_id'), table_name='event_bunk_configs')
    op.drop_index(op.f('ix_event_bunk_configs_event_id'), table_name='event_bunk_configs')
    op.drop_index(op.f('ix_event_bunk_configs_organization_id'), table_name='event_bunk_configs')
    op.drop_table('event_bunk_configs')

    op.drop_index(op.f('ix_store_transactions_item_id'), table_name='store_transactions')
    op.drop_index(op.f('ix_store_transactions_camper_id'), table_name='store_transactions')
    op.drop_index(op.f('ix_store_transactions_organization_id'), table_name='store_transactions')
    op.drop_table('store_transactions')

    op.drop_index(op.f('ix_spending_accounts_camper_id'), table_name='spending_accounts')
    op.drop_index(op.f('ix_spending_accounts_organization_id'), table_name='spending_accounts')
    op.drop_table('spending_accounts')

    op.drop_index(op.f('ix_store_items_organization_id'), table_name='store_items')
    op.drop_table('store_items')

    op.drop_index(op.f('ix_notification_configs_organization_id'), table_name='notification_configs')
    op.drop_table('notification_configs')

    op.drop_index(op.f('ix_payments_contact_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_registration_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_invoice_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_organization_id'), table_name='payments')
    op.drop_table('payments')

    op.drop_index(op.f('ix_invoices_contact_id'), table_name='invoices')
    op.drop_index(op.f('ix_invoices_family_id'), table_name='invoices')
    op.drop_index(op.f('ix_invoices_organization_id'), table_name='invoices')
    op.drop_table('invoices')

    op.drop_index(op.f('ix_schedule_assignments_bunk_id'), table_name='schedule_assignments')
    op.drop_index(op.f('ix_schedule_assignments_camper_id'), table_name='schedule_assignments')
    op.drop_index(op.f('ix_schedule_assignments_schedule_id'), table_name='schedule_assignments')
    op.drop_index(op.f('ix_schedule_assignments_organization_id'), table_name='schedule_assignments')
    op.drop_table('schedule_assignments')

    op.drop_index(op.f('ix_schedules_activity_id'), table_name='schedules')
    op.drop_index(op.f('ix_schedules_event_id'), table_name='schedules')
    op.drop_index(op.f('ix_schedules_organization_id'), table_name='schedules')
    op.drop_table('schedules')
