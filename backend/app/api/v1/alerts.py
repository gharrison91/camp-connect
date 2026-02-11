"""
Camp Connect - Contact Alerts Hub API
Aggregated alerts: messages, buddy requests, medicine, payments, etc.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.contact_alert import ContactAlert

router = APIRouter(prefix="/alerts", tags=["Alerts"])


# ─── Schemas ──────────────────────────────────────────────

class AlertResponse(BaseModel):
    id: str
    alert_type: str
    title: str
    message: Optional[str] = None
    severity: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    is_read: bool
    is_dismissed: bool
    metadata_json: Optional[dict] = None
    created_at: str


class AlertCreate(BaseModel):
    alert_type: str
    title: str
    message: Optional[str] = None
    severity: str = "info"
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    user_id: Optional[str] = None
    contact_id: Optional[str] = None
    metadata_json: Optional[dict] = None


# ─── Endpoints ────────────────────────────────────────────

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    alert_type: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List alerts for the current user."""
    query = (
        select(ContactAlert)
        .where(ContactAlert.organization_id == current_user["organization_id"])
        .where(ContactAlert.user_id == current_user["id"])
        .where(ContactAlert.is_dismissed == False)
        .order_by(ContactAlert.created_at.desc())
        .limit(limit)
    )
    if alert_type:
        query = query.where(ContactAlert.alert_type == alert_type)
    if is_read is not None:
        query = query.where(ContactAlert.is_read == is_read)

    result = await db.execute(query)
    alerts = result.scalars().all()

    return [
        AlertResponse(
            id=str(a.id),
            alert_type=a.alert_type,
            title=a.title,
            message=a.message,
            severity=a.severity,
            entity_type=a.entity_type,
            entity_id=str(a.entity_id) if a.entity_id else None,
            is_read=a.is_read,
            is_dismissed=a.is_dismissed,
            metadata_json=a.metadata_json,
            created_at=a.created_at.isoformat(),
        )
        for a in alerts
    ]


@router.get("/counts")
async def alert_counts(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get unread alert counts by type for the sidebar badges."""
    query = (
        select(ContactAlert.alert_type, func.count(ContactAlert.id))
        .where(ContactAlert.organization_id == current_user["organization_id"])
        .where(ContactAlert.user_id == current_user["id"])
        .where(ContactAlert.is_read == False)
        .where(ContactAlert.is_dismissed == False)
        .group_by(ContactAlert.alert_type)
    )
    result = await db.execute(query)
    rows = result.all()

    counts = {row[0]: row[1] for row in rows}
    total = sum(counts.values())

    return {"total": total, "by_type": counts}


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    body: AlertCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new alert."""
    alert = ContactAlert(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        user_id=uuid.UUID(body.user_id) if body.user_id else current_user["id"],
        contact_id=uuid.UUID(body.contact_id) if body.contact_id else None,
        alert_type=body.alert_type,
        title=body.title,
        message=body.message,
        severity=body.severity,
        entity_type=body.entity_type,
        entity_id=uuid.UUID(body.entity_id) if body.entity_id else None,
        metadata_json=body.metadata_json,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    return AlertResponse(
        id=str(alert.id),
        alert_type=alert.alert_type,
        title=alert.title,
        message=alert.message,
        severity=alert.severity,
        entity_type=alert.entity_type,
        entity_id=str(alert.entity_id) if alert.entity_id else None,
        is_read=alert.is_read,
        is_dismissed=alert.is_dismissed,
        metadata_json=alert.metadata_json,
        created_at=alert.created_at.isoformat(),
    )


@router.put("/{alert_id}/read")
async def mark_alert_read(
    alert_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an alert as read."""
    result = await db.execute(
        select(ContactAlert)
        .where(ContactAlert.id == alert_id)
        .where(ContactAlert.organization_id == current_user["organization_id"])
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    alert.read_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "read"}


@router.put("/read-all")
async def mark_all_read(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread alerts as read."""
    from sqlalchemy import update
    await db.execute(
        update(ContactAlert)
        .where(ContactAlert.user_id == current_user["id"])
        .where(ContactAlert.organization_id == current_user["organization_id"])
        .where(ContactAlert.is_read == False)
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return {"status": "all_read"}


@router.put("/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dismiss an alert (hide from list)."""
    result = await db.execute(
        select(ContactAlert)
        .where(ContactAlert.id == alert_id)
        .where(ContactAlert.organization_id == current_user["organization_id"])
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_dismissed = True
    await db.commit()
    return {"status": "dismissed"}
