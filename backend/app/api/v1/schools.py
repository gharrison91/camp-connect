"""
Camp Connect - Schools API
NCES school database with autocomplete search and custom entries.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.school import School

router = APIRouter(prefix="/schools", tags=["Schools"])


# ─── Schemas ──────────────────────────────────────────────

class SchoolCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    school_type: Optional[str] = None
    grade_range: Optional[str] = None


class SchoolResponse(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    school_type: Optional[str] = None
    grade_range: Optional[str] = None
    enrollment: Optional[int] = None
    nces_id: Optional[str] = None
    is_custom: bool


# ─── Endpoints ────────────────────────────────────────────

@router.get("/search", response_model=List[SchoolResponse])
async def search_schools(
    q: str = Query(..., min_length=2, description="Search query"),
    state: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Autocomplete school search — searches NCES database + org custom entries."""
    query = (
        select(School)
        .where(School.name.ilike(f"%{q}%"))
        .where(
            or_(
                School.organization_id.is_(None),  # National/shared
                School.organization_id == current_user["organization_id"],  # Org custom
            )
        )
        .order_by(School.name)
        .limit(limit)
    )
    if state:
        query = query.where(School.state == state.upper())

    result = await db.execute(query)
    schools = result.scalars().all()

    return [
        SchoolResponse(
            id=str(s.id),
            name=s.name,
            address=s.address,
            city=s.city,
            state=s.state,
            zip_code=s.zip_code,
            phone=s.phone,
            school_type=s.school_type,
            grade_range=s.grade_range,
            enrollment=s.enrollment,
            nces_id=s.nces_id,
            is_custom=s.is_custom,
        )
        for s in schools
    ]


@router.post("", response_model=SchoolResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_school(
    body: SchoolCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a custom school entry (not from NCES)."""
    # Check for duplicates within org
    existing = await db.execute(
        select(School)
        .where(School.name.ilike(body.name))
        .where(
            or_(
                School.organization_id.is_(None),
                School.organization_id == current_user["organization_id"],
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="A school with this name already exists. Use the existing entry or modify the name.",
        )

    school = School(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        name=body.name,
        address=body.address,
        city=body.city,
        state=body.state.upper() if body.state else None,
        zip_code=body.zip_code,
        phone=body.phone,
        school_type=body.school_type,
        grade_range=body.grade_range,
        is_custom=True,
        is_verified=False,
    )
    db.add(school)
    await db.commit()
    await db.refresh(school)

    return SchoolResponse(
        id=str(school.id),
        name=school.name,
        address=school.address,
        city=school.city,
        state=school.state,
        zip_code=school.zip_code,
        phone=school.phone,
        school_type=school.school_type,
        grade_range=school.grade_range,
        enrollment=school.enrollment,
        nces_id=school.nces_id,
        is_custom=school.is_custom,
    )


@router.get("", response_model=List[SchoolResponse])
async def list_schools(
    state: Optional[str] = Query(None),
    school_type: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all schools visible to the org."""
    query = (
        select(School)
        .where(
            or_(
                School.organization_id.is_(None),
                School.organization_id == current_user["organization_id"],
            )
        )
        .order_by(School.name)
        .limit(100)
    )
    if state:
        query = query.where(School.state == state.upper())
    if school_type:
        query = query.where(School.school_type == school_type)

    result = await db.execute(query)
    schools = result.scalars().all()

    return [
        SchoolResponse(
            id=str(s.id),
            name=s.name,
            address=s.address,
            city=s.city,
            state=s.state,
            zip_code=s.zip_code,
            phone=s.phone,
            school_type=s.school_type,
            grade_range=s.grade_range,
            enrollment=s.enrollment,
            nces_id=s.nces_id,
            is_custom=s.is_custom,
        )
        for s in schools
    ]
