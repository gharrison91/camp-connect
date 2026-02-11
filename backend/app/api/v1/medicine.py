"""
Camp Connect - Medicine Schedule & Administration API
Nurse schedule, medication tracking, and parent notifications.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.medicine_schedule import MedicineSchedule, MedicineAdministration
from app.models.camper import Camper
from app.models.bunk import BunkAssignment, Bunk

router = APIRouter(prefix="/medicine", tags=["Medicine"])


# ─── Schemas ──────────────────────────────────────────────

class MedicineScheduleCreate(BaseModel):
    camper_id: str
    event_id: str
    medicine_name: str
    dosage: str
    frequency: str = "daily"
    scheduled_times: Optional[List[str]] = None
    special_instructions: Optional[str] = None
    prescribed_by: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    submitted_by_contact_id: Optional[str] = None


class MedicineScheduleUpdate(BaseModel):
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    scheduled_times: Optional[List[str]] = None
    special_instructions: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class MedicineScheduleResponse(BaseModel):
    id: str
    camper_id: str
    event_id: str
    medicine_name: str
    dosage: str
    frequency: str
    scheduled_times: Optional[List[str]] = None
    special_instructions: Optional[str] = None
    prescribed_by: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    is_active: bool
    camper_name: Optional[str] = None
    bunk_name: Optional[str] = None
    created_at: str


class AdministrationCreate(BaseModel):
    schedule_id: str
    scheduled_time: Optional[str] = None
    administration_date: date
    status: str = "given"  # given, skipped, refused
    notes: Optional[str] = None


class AdministrationResponse(BaseModel):
    id: str
    schedule_id: str
    administered_at: str
    administered_by: str
    scheduled_time: Optional[str] = None
    administration_date: str
    status: str
    notes: Optional[str] = None
    parent_notified: bool
    nurse_name: Optional[str] = None


# ─── Schedule Endpoints ───────────────────────────────────

@router.get("/schedules", response_model=List[MedicineScheduleResponse])
async def list_medicine_schedules(
    camper_id: Optional[str] = Query(None),
    event_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List medicine schedules with filters."""
    query = (
        select(MedicineSchedule)
        .where(MedicineSchedule.organization_id == current_user["organization_id"])
        .order_by(MedicineSchedule.created_at.desc())
    )
    if camper_id:
        query = query.where(MedicineSchedule.camper_id == camper_id)
    if event_id:
        query = query.where(MedicineSchedule.event_id == event_id)
    if is_active is not None:
        query = query.where(MedicineSchedule.is_active == is_active)

    result = await db.execute(query)
    schedules = result.scalars().all()

    responses = []
    for s in schedules:
        camper_name = None
        cr = await db.execute(select(Camper.first_name, Camper.last_name).where(Camper.id == s.camper_id))
        row = cr.one_or_none()
        if row:
            camper_name = f"{row[0]} {row[1]}"

        responses.append(MedicineScheduleResponse(
            id=str(s.id),
            camper_id=str(s.camper_id),
            event_id=str(s.event_id),
            medicine_name=s.medicine_name,
            dosage=s.dosage,
            frequency=s.frequency,
            scheduled_times=s.scheduled_times,
            special_instructions=s.special_instructions,
            prescribed_by=s.prescribed_by,
            start_date=s.start_date.isoformat(),
            end_date=s.end_date.isoformat() if s.end_date else None,
            is_active=s.is_active,
            camper_name=camper_name,
            created_at=s.created_at.isoformat() if s.created_at else "",
        ))
    return responses


@router.post("/schedules", status_code=status.HTTP_201_CREATED)
async def create_medicine_schedule(
    body: MedicineScheduleCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a medicine schedule for a camper."""
    schedule = MedicineSchedule(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        camper_id=uuid.UUID(body.camper_id),
        event_id=uuid.UUID(body.event_id),
        medicine_name=body.medicine_name,
        dosage=body.dosage,
        frequency=body.frequency,
        scheduled_times=body.scheduled_times,
        special_instructions=body.special_instructions,
        prescribed_by=body.prescribed_by,
        start_date=body.start_date,
        end_date=body.end_date,
        submitted_by_contact_id=uuid.UUID(body.submitted_by_contact_id) if body.submitted_by_contact_id else None,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)

    return {"id": str(schedule.id), "status": "created"}


@router.put("/schedules/{schedule_id}")
async def update_medicine_schedule(
    schedule_id: uuid.UUID,
    body: MedicineScheduleUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a medicine schedule."""
    result = await db.execute(
        select(MedicineSchedule)
        .where(MedicineSchedule.id == schedule_id)
        .where(MedicineSchedule.organization_id == current_user["organization_id"])
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)

    await db.commit()
    return {"status": "updated"}


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_medicine_schedule(
    schedule_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a medicine schedule."""
    result = await db.execute(
        select(MedicineSchedule)
        .where(MedicineSchedule.id == schedule_id)
        .where(MedicineSchedule.organization_id == current_user["organization_id"])
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    schedule.is_active = False
    await db.commit()


# ─── Nurse View ───────────────────────────────────────────

@router.get("/nurse-view/{target_date}")
async def nurse_view(
    target_date: date,
    event_id: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all medicines due for a date, grouped by time slot."""
    query = (
        select(MedicineSchedule)
        .where(MedicineSchedule.organization_id == current_user["organization_id"])
        .where(MedicineSchedule.is_active == True)
        .where(MedicineSchedule.start_date <= target_date)
        .where(
            (MedicineSchedule.end_date.is_(None)) | (MedicineSchedule.end_date >= target_date)
        )
    )
    if event_id:
        query = query.where(MedicineSchedule.event_id == event_id)

    result = await db.execute(query)
    schedules = result.scalars().all()

    # Get administrations for this date
    admin_query = (
        select(MedicineAdministration)
        .where(MedicineAdministration.administration_date == target_date)
    )
    admin_result = await db.execute(admin_query)
    administrations = admin_result.scalars().all()
    admin_map = {}
    for a in administrations:
        key = f"{a.schedule_id}_{a.scheduled_time or 'any'}"
        admin_map[key] = {
            "id": str(a.id),
            "status": a.status,
            "administered_at": a.administered_at.isoformat(),
            "notes": a.notes,
        }

    # Group by time slot
    time_slots = {"Morning (6-10am)": [], "Midday (10am-2pm)": [], "Afternoon (2-6pm)": [], "Evening (6-10pm)": []}

    for s in schedules:
        camper_name = None
        bunk_name = None

        cr = await db.execute(select(Camper.first_name, Camper.last_name).where(Camper.id == s.camper_id))
        row = cr.one_or_none()
        if row:
            camper_name = f"{row[0]} {row[1]}"

        # Find bunk
        ba = await db.execute(
            select(Bunk.name)
            .join(BunkAssignment, BunkAssignment.bunk_id == Bunk.id)
            .where(BunkAssignment.camper_id == s.camper_id)
            .where(BunkAssignment.event_id == s.event_id)
        )
        brow = ba.one_or_none()
        if brow:
            bunk_name = brow[0]

        times = s.scheduled_times or ["08:00"]
        for t in times:
            hour = int(t.split(":")[0]) if ":" in t else 8
            if hour < 10:
                slot = "Morning (6-10am)"
            elif hour < 14:
                slot = "Midday (10am-2pm)"
            elif hour < 18:
                slot = "Afternoon (2-6pm)"
            else:
                slot = "Evening (6-10pm)"

            admin_key = f"{s.id}_{t}"
            administered = admin_map.get(admin_key)

            time_slots[slot].append({
                "schedule_id": str(s.id),
                "camper_id": str(s.camper_id),
                "camper_name": camper_name,
                "bunk_name": bunk_name,
                "medicine_name": s.medicine_name,
                "dosage": s.dosage,
                "scheduled_time": t,
                "special_instructions": s.special_instructions,
                "administered": administered,
            })

    total_items = sum(len(v) for v in time_slots.values())
    completed_items = sum(1 for v in time_slots.values() for item in v if item["administered"])

    return {
        "date": target_date.isoformat(),
        "time_slots": time_slots,
        "total": total_items,
        "completed": completed_items,
        "completion_pct": round(completed_items / total_items * 100) if total_items > 0 else 0,
    }


# ─── Administration Endpoints ─────────────────────────────

@router.post("/administrations", status_code=status.HTTP_201_CREATED)
async def record_administration(
    body: AdministrationCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record that medicine was administered (nurse marks done)."""
    admin = MedicineAdministration(
        id=uuid.uuid4(),
        schedule_id=uuid.UUID(body.schedule_id),
        administered_at=datetime.now(timezone.utc),
        administered_by=current_user["id"],
        scheduled_time=body.scheduled_time,
        administration_date=body.administration_date,
        status=body.status,
        notes=body.notes,
    )
    db.add(admin)
    await db.commit()

    return {"id": str(admin.id), "status": "recorded", "administered_at": admin.administered_at.isoformat()}


@router.get("/administrations", response_model=List[AdministrationResponse])
async def list_administrations(
    schedule_id: Optional[str] = Query(None),
    administration_date: Optional[date] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List administration records."""
    query = select(MedicineAdministration).order_by(MedicineAdministration.administered_at.desc())
    if schedule_id:
        query = query.where(MedicineAdministration.schedule_id == schedule_id)
    if administration_date:
        query = query.where(MedicineAdministration.administration_date == administration_date)

    result = await db.execute(query)
    records = result.scalars().all()

    return [
        AdministrationResponse(
            id=str(r.id),
            schedule_id=str(r.schedule_id),
            administered_at=r.administered_at.isoformat(),
            administered_by=str(r.administered_by),
            scheduled_time=r.scheduled_time,
            administration_date=r.administration_date.isoformat(),
            status=r.status,
            notes=r.notes,
            parent_notified=r.parent_notified,
        )
        for r in records
    ]
