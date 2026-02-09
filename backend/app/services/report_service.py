"""
Camp Connect - Report Service
CSV report generators for camper rosters, registrations, health forms,
financial summaries, and attendance.
"""
from __future__ import annotations

import csv
import io
import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camper import Camper
from app.models.registration import Registration
from app.models.event import Event
from app.models.health_form import HealthForm, HealthFormTemplate
from app.models.bunk import BunkAssignment, Bunk
from app.models.payment import Payment


# ── Helpers ────────────────────────────────────────────────────────────────

def _make_csv(headers: list[str], rows: list[list]) -> str:
    """Build a CSV string from headers and row data."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    return buf.getvalue()


def _age_from_dob(dob) -> str:
    """Return age as a string, or empty if DOB is None."""
    if dob is None:
        return ""
    from datetime import date
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return str(age)


# ── Camper Roster ──────────────────────────────────────────────────────────

async def generate_camper_roster(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID | None = None,
) -> str:
    """
    CSV report of campers.
    Columns: First Name, Last Name, Age, Gender, School, Grade, City, State.
    If event_id is given, only campers registered for that event.
    """
    if event_id is not None:
        stmt = (
            select(Camper)
            .join(Registration, Registration.camper_id == Camper.id)
            .where(
                Camper.organization_id == organization_id,
                Registration.event_id == event_id,
                Registration.organization_id == organization_id,
            )
        )
    else:
        stmt = select(Camper).where(Camper.organization_id == organization_id)

    # Respect soft-delete
    stmt = stmt.where(Camper.is_deleted.is_(False))

    result = await db.execute(stmt)
    campers = result.scalars().all()

    headers = [
        "First Name", "Last Name", "Age", "Gender",
        "School", "Grade", "City", "State",
    ]
    rows = [
        [
            c.first_name,
            c.last_name,
            _age_from_dob(c.date_of_birth),
            c.gender or "",
            c.school or "",
            c.grade or "",
            c.city or "",
            c.state or "",
        ]
        for c in campers
    ]
    return _make_csv(headers, rows)


# ── Registration Report ───────────────────────────────────────────────────

async def generate_registration_report(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID | None = None,
    status: str | None = None,
) -> str:
    """
    CSV report of registrations.
    Columns: Camper Name, Event Name, Status, Payment Status, Registered At, Special Requests.
    """
    stmt = (
        select(Registration)
        .options(selectinload(Registration.camper), selectinload(Registration.event))
        .where(
            Registration.organization_id == organization_id,
            Registration.is_deleted.is_(False),
        )
    )
    if event_id is not None:
        stmt = stmt.where(Registration.event_id == event_id)
    if status is not None:
        stmt = stmt.where(Registration.status == status)

    result = await db.execute(stmt)
    registrations = result.scalars().all()

    headers = [
        "Camper Name", "Event Name", "Status",
        "Payment Status", "Registered At", "Special Requests",
    ]
    rows = [
        [
            f"{r.camper.first_name} {r.camper.last_name}" if r.camper else "",
            r.event.name if r.event else "",
            r.status,
            r.payment_status,
            r.registered_at.isoformat() if r.registered_at else "",
            r.special_requests or "",
        ]
        for r in registrations
    ]
    return _make_csv(headers, rows)


# ── Health Form Report ─────────────────────────────────────────────────────

async def generate_health_form_report(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID | None = None,
) -> str:
    """
    CSV report of health forms.
    Columns: Camper Name, Form Template, Status, Due Date, Submitted At.
    """
    stmt = (
        select(HealthForm)
        .options(
            selectinload(HealthForm.camper),
            selectinload(HealthForm.template),
        )
        .where(
            HealthForm.organization_id == organization_id,
            HealthForm.is_deleted.is_(False),
        )
    )
    if event_id is not None:
        stmt = stmt.where(HealthForm.event_id == event_id)

    result = await db.execute(stmt)
    forms = result.scalars().all()

    headers = [
        "Camper Name", "Form Template", "Status", "Due Date", "Submitted At",
    ]
    rows = [
        [
            f"{f.camper.first_name} {f.camper.last_name}" if f.camper else "",
            f.template.name if f.template else "",
            f.status,
            f.due_date.isoformat() if f.due_date else "",
            f.submitted_at.isoformat() if f.submitted_at else "",
        ]
        for f in forms
    ]
    return _make_csv(headers, rows)


# ── Financial Report ───────────────────────────────────────────────────────

async def generate_financial_report(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID | None = None,
) -> str:
    """
    CSV report of financial data per registration.
    Columns: Event Name, Camper Name, Price, Payment Status, Amount Paid.
    Amount Paid is the sum of completed payments linked to the registration.
    """
    stmt = (
        select(Registration)
        .options(selectinload(Registration.camper), selectinload(Registration.event))
        .where(
            Registration.organization_id == organization_id,
            Registration.is_deleted.is_(False),
        )
    )
    if event_id is not None:
        stmt = stmt.where(Registration.event_id == event_id)

    result = await db.execute(stmt)
    registrations = result.scalars().all()

    # Build a map of registration_id -> total amount paid
    reg_ids = [r.id for r in registrations]
    amount_paid_map: dict[uuid.UUID, float] = {}
    if reg_ids:
        pay_stmt = (
            select(
                Payment.registration_id,
                func.coalesce(func.sum(Payment.amount), 0).label("total_paid"),
            )
            .where(
                Payment.registration_id.in_(reg_ids),
                Payment.status == "completed",
            )
            .group_by(Payment.registration_id)
        )
        pay_result = await db.execute(pay_stmt)
        for row in pay_result:
            amount_paid_map[row.registration_id] = float(row.total_paid)

    headers = [
        "Event Name", "Camper Name", "Price", "Payment Status", "Amount Paid",
    ]
    rows = [
        [
            r.event.name if r.event else "",
            f"{r.camper.first_name} {r.camper.last_name}" if r.camper else "",
            str(r.event.price) if r.event else "0.00",
            r.payment_status,
            f"{amount_paid_map.get(r.id, 0):.2f}",
        ]
        for r in registrations
    ]
    return _make_csv(headers, rows)


# ── Attendance Report ──────────────────────────────────────────────────────

async def generate_attendance_report(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
) -> str:
    """
    CSV report for attendance at a specific event.
    Columns: Camper Name, Bunk, Registration Status.
    """
    # Get all registrations for the event
    reg_stmt = (
        select(Registration)
        .options(selectinload(Registration.camper))
        .where(
            Registration.organization_id == organization_id,
            Registration.event_id == event_id,
            Registration.is_deleted.is_(False),
        )
    )
    reg_result = await db.execute(reg_stmt)
    registrations = reg_result.scalars().all()

    # Get bunk assignments for this event
    camper_ids = [r.camper_id for r in registrations]
    bunk_map: dict[uuid.UUID, str] = {}
    if camper_ids:
        bunk_stmt = (
            select(BunkAssignment)
            .options(selectinload(BunkAssignment.bunk))
            .where(
                BunkAssignment.event_id == event_id,
                BunkAssignment.camper_id.in_(camper_ids),
            )
        )
        bunk_result = await db.execute(bunk_stmt)
        assignments = bunk_result.scalars().all()
        for a in assignments:
            bunk_map[a.camper_id] = a.bunk.name if a.bunk else ""

    headers = ["Camper Name", "Bunk", "Registration Status"]
    rows = [
        [
            f"{r.camper.first_name} {r.camper.last_name}" if r.camper else "",
            bunk_map.get(r.camper_id, ""),
            r.status,
        ]
        for r in registrations
    ]
    return _make_csv(headers, rows)
