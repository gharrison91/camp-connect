"""
Camp Connect - Camper Messages API
Parent-to-camper messaging with daily scheduling.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.database import get_db
from app.models.camper_message import CamperMessage
from app.models.camper import Camper
from app.models.contact import Contact
from app.models.bunk import Bunk, BunkAssignment

router = APIRouter(prefix="/camper-messages", tags=["Camper Messages"])


# ─── Schemas ──────────────────────────────────────────────

class CamperMessageCreate(BaseModel):
    camper_id: str
    contact_id: str
    event_id: str
    message_text: str
    scheduled_date: date


class CamperMessageUpdate(BaseModel):
    message_text: Optional[str] = None


class CamperMessageResponse(BaseModel):
    id: str
    camper_id: str
    contact_id: str
    event_id: str
    message_text: str
    scheduled_date: str
    is_read: bool
    read_at: Optional[str] = None
    read_by: Optional[str] = None
    camper_name: Optional[str] = None
    contact_name: Optional[str] = None
    bunk_name: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


# ─── Endpoints ────────────────────────────────────────────

@router.get("", response_model=List[CamperMessageResponse])
async def list_camper_messages(
    camper_id: Optional[str] = Query(None),
    event_id: Optional[str] = Query(None),
    scheduled_date: Optional[date] = Query(None),
    is_read: Optional[bool] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List camper messages with filters."""
    query = (
        select(CamperMessage)
        .where(CamperMessage.organization_id == current_user["organization_id"])
        .order_by(CamperMessage.scheduled_date.desc(), CamperMessage.created_at.desc())
    )
    if camper_id:
        query = query.where(CamperMessage.camper_id == camper_id)
    if event_id:
        query = query.where(CamperMessage.event_id == event_id)
    if scheduled_date:
        query = query.where(CamperMessage.scheduled_date == scheduled_date)
    if is_read is not None:
        query = query.where(CamperMessage.is_read == is_read)

    result = await db.execute(query)
    messages = result.scalars().all()

    responses = []
    for msg in messages:
        camper_name = None
        contact_name = None
        bunk_name = None

        # Resolve camper name
        cr = await db.execute(select(Camper.first_name, Camper.last_name).where(Camper.id == msg.camper_id))
        row = cr.one_or_none()
        if row:
            camper_name = f"{row[0]} {row[1]}"

        # Resolve contact name
        cor = await db.execute(select(Contact.first_name, Contact.last_name).where(Contact.id == msg.contact_id))
        row = cor.one_or_none()
        if row:
            contact_name = f"{row[0]} {row[1]}"

        responses.append(CamperMessageResponse(
            id=str(msg.id),
            camper_id=str(msg.camper_id),
            contact_id=str(msg.contact_id),
            event_id=str(msg.event_id),
            message_text=msg.message_text,
            scheduled_date=msg.scheduled_date.isoformat(),
            is_read=msg.is_read,
            read_at=msg.read_at.isoformat() if msg.read_at else None,
            read_by=str(msg.read_by) if msg.read_by else None,
            camper_name=camper_name,
            contact_name=contact_name,
            bunk_name=bunk_name,
            created_at=msg.created_at.isoformat() if msg.created_at else "",
        ))
    return responses


@router.get("/daily/{target_date}")
async def daily_messages(
    target_date: date,
    event_id: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for a specific date, grouped by bunk."""
    query = (
        select(CamperMessage)
        .where(CamperMessage.organization_id == current_user["organization_id"])
        .where(CamperMessage.scheduled_date == target_date)
        .order_by(CamperMessage.created_at)
    )
    if event_id:
        query = query.where(CamperMessage.event_id == event_id)

    result = await db.execute(query)
    messages = result.scalars().all()

    # Group by bunk
    bunk_groups: Dict[str, Any] = {}
    for msg in messages:
        # Find camper's bunk
        bunk_query = (
            select(BunkAssignment, Bunk)
            .join(Bunk, BunkAssignment.bunk_id == Bunk.id)
            .where(BunkAssignment.camper_id == msg.camper_id)
            .where(BunkAssignment.event_id == msg.event_id)
        )
        br = await db.execute(bunk_query)
        ba_row = br.one_or_none()
        bunk_name = ba_row[1].name if ba_row else "Unassigned"
        bunk_id = str(ba_row[1].id) if ba_row else "unassigned"

        if bunk_id not in bunk_groups:
            bunk_groups[bunk_id] = {"bunk_name": bunk_name, "bunk_id": bunk_id, "messages": []}

        # Resolve names
        cr = await db.execute(select(Camper.first_name, Camper.last_name).where(Camper.id == msg.camper_id))
        camper_row = cr.one_or_none()

        bunk_groups[bunk_id]["messages"].append({
            "id": str(msg.id),
            "camper_id": str(msg.camper_id),
            "camper_name": f"{camper_row[0]} {camper_row[1]}" if camper_row else "Unknown",
            "message_text": msg.message_text,
            "is_read": msg.is_read,
            "contact_id": str(msg.contact_id),
        })

    return {"date": target_date.isoformat(), "bunk_groups": list(bunk_groups.values())}


@router.post("", response_model=CamperMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_camper_message(
    body: CamperMessageCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a scheduled message from parent to camper."""
    msg = CamperMessage(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        camper_id=uuid.UUID(body.camper_id),
        contact_id=uuid.UUID(body.contact_id),
        event_id=uuid.UUID(body.event_id),
        message_text=body.message_text,
        scheduled_date=body.scheduled_date,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    return CamperMessageResponse(
        id=str(msg.id),
        camper_id=str(msg.camper_id),
        contact_id=str(msg.contact_id),
        event_id=str(msg.event_id),
        message_text=msg.message_text,
        scheduled_date=msg.scheduled_date.isoformat(),
        is_read=msg.is_read,
        read_at=None,
        read_by=None,
        created_at=msg.created_at.isoformat() if msg.created_at else "",
    )


@router.put("/{message_id}", response_model=CamperMessageResponse)
async def update_camper_message(
    message_id: uuid.UUID,
    body: CamperMessageUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a camper message (before delivery date)."""
    result = await db.execute(
        select(CamperMessage)
        .where(CamperMessage.id == message_id)
        .where(CamperMessage.organization_id == current_user["organization_id"])
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if body.message_text is not None:
        msg.message_text = body.message_text

    await db.commit()
    await db.refresh(msg)

    return CamperMessageResponse(
        id=str(msg.id),
        camper_id=str(msg.camper_id),
        contact_id=str(msg.contact_id),
        event_id=str(msg.event_id),
        message_text=msg.message_text,
        scheduled_date=msg.scheduled_date.isoformat(),
        is_read=msg.is_read,
        read_at=msg.read_at.isoformat() if msg.read_at else None,
        read_by=str(msg.read_by) if msg.read_by else None,
        created_at=msg.created_at.isoformat() if msg.created_at else "",
    )


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_camper_message(
    message_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete/cancel a scheduled message."""
    result = await db.execute(
        select(CamperMessage)
        .where(CamperMessage.id == message_id)
        .where(CamperMessage.organization_id == current_user["organization_id"])
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    await db.delete(msg)
    await db.commit()


@router.put("/{message_id}/read")
async def mark_message_read(
    message_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a message as read by staff."""
    result = await db.execute(
        select(CamperMessage)
        .where(CamperMessage.id == message_id)
        .where(CamperMessage.organization_id == current_user["organization_id"])
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    msg.is_read = True
    msg.read_at = datetime.now(timezone.utc)
    msg.read_by = current_user["id"]
    await db.commit()

    return {"status": "read", "read_at": msg.read_at.isoformat()}
