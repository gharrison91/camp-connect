"""
Camp Connect - Bunk Service
Business logic for bunk management and camper-to-bunk assignments.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.bunk import Bunk, BunkAssignment
from app.models.camper import Camper
from app.models.event import Event
from app.models.registration import Registration
from app.models.user import User


# ---------------------------------------------------------------------------
# Bunk CRUD
# ---------------------------------------------------------------------------


async def list_bunks(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List bunks for an organization."""
    query = (
        select(Bunk)
        .options(selectinload(Bunk.counselor))
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
        .order_by(Bunk.name)
    )
    result = await db.execute(query)
    bunks = result.scalars().all()

    return [_bunk_to_dict(b) for b in bunks]


async def get_bunk(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    bunk_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single bunk by ID with assignments."""
    result = await db.execute(
        select(Bunk)
        .options(
            selectinload(Bunk.counselor),
            selectinload(Bunk.assignments).selectinload(BunkAssignment.camper),
        )
        .where(Bunk.id == bunk_id)
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
    )
    bunk = result.scalar_one_or_none()
    if bunk is None:
        return None
    return _bunk_with_assignments_to_dict(bunk)


async def create_bunk(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new bunk."""
    bunk = Bunk(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(bunk)
    await db.commit()
    await db.refresh(bunk, ["counselor"])
    return _bunk_to_dict(bunk)


async def update_bunk(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    bunk_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing bunk."""
    result = await db.execute(
        select(Bunk)
        .options(selectinload(Bunk.counselor))
        .where(Bunk.id == bunk_id)
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
    )
    bunk = result.scalar_one_or_none()
    if bunk is None:
        return None

    for key, value in data.items():
        setattr(bunk, key, value)

    await db.commit()
    await db.refresh(bunk, ["counselor"])
    return _bunk_to_dict(bunk)


async def delete_bunk(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    bunk_id: uuid.UUID,
) -> bool:
    """Soft-delete a bunk."""
    result = await db.execute(
        select(Bunk)
        .where(Bunk.id == bunk_id)
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
    )
    bunk = result.scalar_one_or_none()
    if bunk is None:
        return False

    bunk.is_deleted = True
    bunk.deleted_at = datetime.utcnow()
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Assignment logic
# ---------------------------------------------------------------------------


async def list_assignments(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
    bunk_id: Optional[uuid.UUID] = None,
) -> List[Dict[str, Any]]:
    """List bunk assignments for an event, with camper details from join."""
    query = (
        select(BunkAssignment)
        .join(Bunk, BunkAssignment.bunk_id == Bunk.id)
        .options(selectinload(BunkAssignment.camper))
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
        .where(BunkAssignment.event_id == event_id)
    )

    if bunk_id:
        query = query.where(BunkAssignment.bunk_id == bunk_id)

    query = query.order_by(BunkAssignment.bed_number, BunkAssignment.created_at)
    result = await db.execute(query)
    assignments = result.scalars().all()

    return [_assignment_to_dict(a) for a in assignments]


async def assign_camper(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Assign a camper to a bunk for a specific event.

    Validates:
    1. Bunk exists and belongs to organization
    2. Camper is registered for this event
    3. Gender restriction (if bunk has male/female, camper must match)
    4. Age range (camper age must fit bunk min/max age)
    5. Capacity (existing assignments for this bunk+event < capacity)
    6. Not already assigned (unique constraint on camper+event)
    """
    bunk_id = data["bunk_id"]
    camper_id = data["camper_id"]
    event_id = data["event_id"]

    # 1. Check bunk exists and belongs to org
    bunk_result = await db.execute(
        select(Bunk)
        .where(Bunk.id == bunk_id)
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
    )
    bunk = bunk_result.scalar_one_or_none()
    if bunk is None:
        raise ValueError("Bunk not found or does not belong to this organization")

    # 2. Check camper is registered for this event
    reg_result = await db.execute(
        select(Registration)
        .where(Registration.camper_id == camper_id)
        .where(Registration.event_id == event_id)
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
        .where(Registration.status.in_(["pending", "confirmed"]))
    )
    registration = reg_result.scalar_one_or_none()
    if registration is None:
        raise ValueError("Camper is not registered for this event")

    # Load camper for validation checks
    camper_result = await db.execute(
        select(Camper)
        .where(Camper.id == camper_id)
        .where(Camper.deleted_at.is_(None))
    )
    camper = camper_result.scalar_one_or_none()
    if camper is None:
        raise ValueError("Camper not found")

    # 3. Check gender restriction
    if bunk.gender_restriction != "all" and camper.gender:
        if camper.gender != bunk.gender_restriction:
            raise ValueError(
                f"Bunk is restricted to '{bunk.gender_restriction}' "
                f"but camper gender is '{camper.gender}'"
            )

    # 4. Check age range
    camper_age = _calculate_age(camper.date_of_birth)
    if camper_age is not None:
        if bunk.min_age is not None and camper_age < bunk.min_age:
            raise ValueError(
                f"Camper age ({camper_age}) is below bunk minimum age ({bunk.min_age})"
            )
        if bunk.max_age is not None and camper_age > bunk.max_age:
            raise ValueError(
                f"Camper age ({camper_age}) is above bunk maximum age ({bunk.max_age})"
            )

    # 5. Check capacity
    if bunk.capacity > 0:
        count_result = await db.execute(
            select(func.count(BunkAssignment.id))
            .where(BunkAssignment.bunk_id == bunk_id)
            .where(BunkAssignment.event_id == event_id)
        )
        current_count = count_result.scalar() or 0
        if current_count >= bunk.capacity:
            raise ValueError(
                f"Bunk is at capacity ({current_count}/{bunk.capacity})"
            )

    # 6. Check not already assigned to a bunk for this event
    existing_result = await db.execute(
        select(BunkAssignment)
        .where(BunkAssignment.camper_id == camper_id)
        .where(BunkAssignment.event_id == event_id)
    )
    existing = existing_result.scalar_one_or_none()
    if existing is not None:
        raise ValueError("Camper is already assigned to a bunk for this event")

    # Create assignment
    assignment = BunkAssignment(
        id=uuid.uuid4(),
        bunk_id=bunk_id,
        camper_id=camper_id,
        event_id=event_id,
        bed_number=data.get("bed_number"),
        start_date=data["start_date"],
        end_date=data["end_date"],
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment, ["camper"])
    return _assignment_to_dict(assignment)


async def unassign_camper(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    assignment_id: uuid.UUID,
) -> bool:
    """Remove a camper's bunk assignment."""
    result = await db.execute(
        select(BunkAssignment)
        .join(Bunk, BunkAssignment.bunk_id == Bunk.id)
        .where(BunkAssignment.id == assignment_id)
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
    )
    assignment = result.scalar_one_or_none()
    if assignment is None:
        return False

    await db.delete(assignment)
    await db.commit()
    return True


async def move_camper(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    assignment_id: uuid.UUID,
    new_bunk_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Move a camper from one bunk to another (delete old, create new with validation)."""
    # Load existing assignment
    result = await db.execute(
        select(BunkAssignment)
        .join(Bunk, BunkAssignment.bunk_id == Bunk.id)
        .options(selectinload(BunkAssignment.camper))
        .where(BunkAssignment.id == assignment_id)
        .where(Bunk.organization_id == organization_id)
        .where(Bunk.deleted_at.is_(None))
    )
    assignment = result.scalar_one_or_none()
    if assignment is None:
        return None

    # Store the old assignment data for the new one
    camper_id = assignment.camper_id
    event_id = assignment.event_id
    bed_number = assignment.bed_number
    start_date = assignment.start_date
    end_date = assignment.end_date

    # Delete the old assignment
    await db.delete(assignment)
    await db.flush()

    # Create the new assignment with full validation
    new_data = {
        "bunk_id": new_bunk_id,
        "camper_id": camper_id,
        "event_id": event_id,
        "bed_number": bed_number,
        "start_date": start_date,
        "end_date": end_date,
    }
    return await assign_camper(
        db,
        organization_id=organization_id,
        data=new_data,
    )


async def get_unassigned_campers(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    event_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """
    Get all campers registered for an event who don't have a bunk assignment.
    Uses a subquery to find campers NOT IN the bunk_assignments table.
    """
    # Subquery: camper_ids that already have a bunk assignment for this event
    assigned_subquery = (
        select(BunkAssignment.camper_id)
        .where(BunkAssignment.event_id == event_id)
        .subquery()
    )

    # Main query: registered campers not in the assigned subquery
    query = (
        select(Camper)
        .join(Registration, Registration.camper_id == Camper.id)
        .where(Registration.event_id == event_id)
        .where(Registration.organization_id == organization_id)
        .where(Registration.deleted_at.is_(None))
        .where(Registration.status.in_(["pending", "confirmed"]))
        .where(Camper.deleted_at.is_(None))
        .where(Camper.id.not_in(select(assigned_subquery.c.camper_id)))
        .order_by(Camper.last_name, Camper.first_name)
    )
    result = await db.execute(query)
    campers = result.scalars().all()

    return [
        {
            "id": c.id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "age": _calculate_age(c.date_of_birth),
            "gender": c.gender,
        }
        for c in campers
    ]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _calculate_age(date_of_birth: Optional[date]) -> Optional[int]:
    """Calculate age in years from date of birth."""
    if date_of_birth is None:
        return None
    today = date.today()
    return (today - date_of_birth).days // 365


def _bunk_to_dict(bunk: Bunk) -> Dict[str, Any]:
    """Convert a Bunk model to a response dict."""
    return {
        "id": bunk.id,
        "name": bunk.name,
        "capacity": bunk.capacity,
        "gender_restriction": bunk.gender_restriction,
        "min_age": bunk.min_age,
        "max_age": bunk.max_age,
        "location": bunk.location,
        "counselor_user_id": bunk.counselor_user_id,
        "counselor_name": (
            f"{bunk.counselor.first_name} {bunk.counselor.last_name}"
            if bunk.counselor
            else None
        ),
        "created_at": bunk.created_at,
    }


def _bunk_with_assignments_to_dict(bunk: Bunk) -> Dict[str, Any]:
    """Convert a Bunk model with loaded assignments to a response dict."""
    result = _bunk_to_dict(bunk)
    result["assignments"] = [_assignment_to_dict(a) for a in bunk.assignments]
    return result


def _assignment_to_dict(assignment: BunkAssignment) -> Dict[str, Any]:
    """Convert a BunkAssignment model to a response dict."""
    camper = assignment.camper
    camper_age = _calculate_age(camper.date_of_birth) if camper else None

    return {
        "id": assignment.id,
        "bunk_id": assignment.bunk_id,
        "camper_id": assignment.camper_id,
        "event_id": assignment.event_id,
        "bed_number": assignment.bed_number,
        "start_date": assignment.start_date,
        "end_date": assignment.end_date,
        "camper_name": (
            f"{camper.first_name} {camper.last_name}" if camper else None
        ),
        "camper_age": camper_age,
        "camper_gender": camper.gender if camper else None,
        "created_at": assignment.created_at,
    }
