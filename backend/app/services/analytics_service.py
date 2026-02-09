"""
Camp Connect - Analytics Service
Business logic for analytics aggregation queries.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import case, cast, Date, extract, func, Integer, select, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.camper import Camper
from app.models.event import Event
from app.models.message import Message
from app.models.registration import Registration


async def get_enrollment_trends(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Group registrations by date (registered_at cast to date), count per day.
    Returns {"trends": [{"date": "2025-01-15", "count": 5}, ...], "total": N}.
    """
    reg_date = cast(Registration.registered_at, Date).label("reg_date")

    query = (
        select(reg_date, func.count().label("count"))
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
    )

    if start_date:
        query = query.where(cast(Registration.registered_at, Date) >= start_date)
    if end_date:
        query = query.where(cast(Registration.registered_at, Date) <= end_date)

    query = query.group_by(reg_date).order_by(reg_date)

    result = await db.execute(query)
    rows = result.all()

    trends = [
        {"date": row.reg_date.isoformat(), "count": row.count}
        for row in rows
    ]
    total = sum(r["count"] for r in trends)

    return {"trends": trends, "total": total}


async def get_revenue_metrics(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Join registrations with events to get price data.
    Calculate total revenue (paid registrations * event price), pending, deposits.
    Group by month for trend data.
    """
    # Base query: join registrations with events to get price
    base_filter = [
        Registration.organization_id == organization_id,
        Registration.deleted_at.is_(None),
        Event.deleted_at.is_(None),
    ]
    if start_date:
        base_filter.append(cast(Registration.registered_at, Date) >= start_date)
    if end_date:
        base_filter.append(cast(Registration.registered_at, Date) <= end_date)

    # Total revenue: sum of event prices for paid registrations
    total_query = (
        select(
            func.coalesce(
                func.sum(
                    case(
                        (Registration.payment_status == "paid", Event.price),
                        else_=0,
                    )
                ),
                0,
            ).label("total_revenue"),
            func.coalesce(
                func.sum(
                    case(
                        (Registration.payment_status == "unpaid", Event.price),
                        else_=0,
                    )
                ),
                0,
            ).label("pending_revenue"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            Registration.payment_status == "deposit_paid",
                            func.coalesce(Event.deposit_amount, 0),
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("deposit_revenue"),
        )
        .select_from(Registration)
        .join(Event, Registration.event_id == Event.id)
        .where(*base_filter)
    )

    totals_result = await db.execute(total_query)
    totals = totals_result.one()

    # Revenue by month
    period_label = func.to_char(Registration.registered_at, "YYYY-MM").label("period")
    period_query = (
        select(
            period_label,
            func.coalesce(
                func.sum(
                    case(
                        (Registration.payment_status == "paid", Event.price),
                        (
                            Registration.payment_status == "deposit_paid",
                            func.coalesce(Event.deposit_amount, 0),
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("amount"),
        )
        .select_from(Registration)
        .join(Event, Registration.event_id == Event.id)
        .where(*base_filter)
        .group_by(period_label)
        .order_by(period_label)
    )

    period_result = await db.execute(period_query)
    period_rows = period_result.all()

    return {
        "total_revenue": float(totals.total_revenue),
        "pending_revenue": float(totals.pending_revenue),
        "deposit_revenue": float(totals.deposit_revenue),
        "revenue_by_period": [
            {"period": row.period, "amount": float(row.amount)}
            for row in period_rows
        ],
    }


async def get_event_capacity_stats(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    For each non-deleted event, calculate utilization = enrolled_count / capacity.
    Returns {"events": [{"event_id": ..., "event_name": ..., "capacity": ..., "enrolled": ..., "utilization": ...}]}
    """
    query = (
        select(Event)
        .where(Event.organization_id == organization_id)
        .where(Event.deleted_at.is_(None))
        .where(Event.capacity > 0)
        .order_by(Event.start_date.desc())
    )

    result = await db.execute(query)
    events = result.scalars().all()

    return {
        "events": [
            {
                "event_id": e.id,
                "event_name": e.name,
                "capacity": e.capacity,
                "enrolled": e.enrolled_count,
                "utilization": round(
                    (e.enrolled_count / e.capacity) * 100, 1
                )
                if e.capacity > 0
                else 0.0,
            }
            for e in events
        ]
    }


async def get_registration_status_breakdown(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Count registrations by status.
    Returns {"pending": N, "confirmed": N, "cancelled": N, "waitlisted": N, "total": N}.
    """
    query = (
        select(
            Registration.status,
            func.count().label("count"),
        )
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
    )

    if start_date:
        query = query.where(cast(Registration.registered_at, Date) >= start_date)
    if end_date:
        query = query.where(cast(Registration.registered_at, Date) <= end_date)

    query = query.group_by(Registration.status)

    result = await db.execute(query)
    rows = result.all()

    breakdown = {"pending": 0, "confirmed": 0, "cancelled": 0, "waitlisted": 0}
    for row in rows:
        if row.status in breakdown:
            breakdown[row.status] = row.count

    breakdown["total"] = sum(breakdown.values())
    return breakdown


async def get_communication_stats(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Count messages by channel and delivery status.
    Returns {"total_sent": N, "email_sent": N, "sms_sent": N, "delivered": N, "failed": N, "bounced": N, "delivery_rate": N}.
    """
    base_filter = [
        Message.organization_id == organization_id,
        Message.deleted_at.is_(None),
    ]

    if start_date:
        base_filter.append(cast(Message.sent_at, Date) >= start_date)
    if end_date:
        base_filter.append(cast(Message.sent_at, Date) <= end_date)

    query = (
        select(
            func.count().label("total"),
            func.count().filter(Message.channel == "email").label("email_sent"),
            func.count().filter(Message.channel == "sms").label("sms_sent"),
            func.count().filter(Message.status == "delivered").label("delivered"),
            func.count().filter(Message.status == "failed").label("failed"),
            func.count().filter(Message.status == "bounced").label("bounced"),
        )
        .where(*base_filter)
        .where(Message.status.in_(["sent", "delivered", "failed", "bounced"]))
    )

    result = await db.execute(query)
    row = result.one()

    total_sent = row.total or 0
    delivered = row.delivered or 0
    delivery_rate = round((delivered / total_sent) * 100, 1) if total_sent > 0 else 0.0

    return {
        "total_sent": total_sent,
        "email_sent": row.email_sent or 0,
        "sms_sent": row.sms_sent or 0,
        "delivered": delivered,
        "failed": row.failed or 0,
        "bounced": row.bounced or 0,
        "delivery_rate": delivery_rate,
    }


async def get_camper_demographics(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    Age distribution (bucketed), gender distribution, and location (top 10 states).
    """
    # --- Age distribution ---
    # Calculate age from date_of_birth using database-level date arithmetic
    today = date.today()

    age_query = (
        select(Camper.date_of_birth)
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
        .where(Camper.date_of_birth.isnot(None))
    )

    age_result = await db.execute(age_query)
    dobs = age_result.scalars().all()

    # Bucket ages in Python for clarity
    buckets = {"5-7": 0, "8-10": 0, "11-13": 0, "14-16": 0, "17+": 0}
    for dob in dobs:
        age = (
            today.year
            - dob.year
            - ((today.month, today.day) < (dob.month, dob.day))
        )
        if age <= 7:
            buckets["5-7"] += 1
        elif age <= 10:
            buckets["8-10"] += 1
        elif age <= 13:
            buckets["11-13"] += 1
        elif age <= 16:
            buckets["14-16"] += 1
        else:
            buckets["17+"] += 1

    age_distribution = [
        {"range": k, "count": v} for k, v in buckets.items()
    ]

    # --- Gender distribution ---
    gender_query = (
        select(
            func.coalesce(Camper.gender, "unspecified").label("gender"),
            func.count().label("count"),
        )
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
        .group_by(func.coalesce(Camper.gender, "unspecified"))
    )

    gender_result = await db.execute(gender_query)
    gender_rows = gender_result.all()
    gender_distribution = [
        {"gender": row.gender, "count": row.count}
        for row in gender_rows
    ]

    # --- Location distribution (top 10 states) ---
    location_query = (
        select(
            func.coalesce(Camper.state, "Unknown").label("state"),
            func.count().label("count"),
        )
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
        .group_by(func.coalesce(Camper.state, "Unknown"))
        .order_by(func.count().desc())
        .limit(10)
    )

    location_result = await db.execute(location_query)
    location_rows = location_result.all()
    location_distribution = [
        {"state": row.state, "count": row.count}
        for row in location_rows
    ]

    return {
        "age_distribution": age_distribution,
        "gender_distribution": gender_distribution,
        "location_distribution": location_distribution,
    }
