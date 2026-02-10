"""
Camp Connect - Job Title API Routes
CRUD for custom job titles and staff job title assignment.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user, require_permission
from app.models.job_title import JobTitle
from app.models.user import User
from app.schemas.job_title import (
    JobTitleCreate,
    JobTitleUpdate,
    JobTitleResponse,
)

router = APIRouter(prefix="/staff/job-titles", tags=["job-titles"])


@router.get("", response_model=List[JobTitleResponse])
async def list_job_titles(
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all job titles for the organization."""
    org_id = current_user["organization_id"]

    # Get titles with staff counts
    result = await db.execute(
        select(
            JobTitle,
            func.count(User.id).label("staff_count"),
        )
        .outerjoin(
            User,
            (User.job_title_id == JobTitle.id) & (User.deleted_at.is_(None)),
        )
        .where(JobTitle.organization_id == org_id)
        .group_by(JobTitle.id)
        .order_by(JobTitle.name)
    )
    rows = result.all()

    return [
        {
            "id": jt.id,
            "name": jt.name,
            "description": jt.description,
            "is_system": jt.is_system,
            "staff_count": count,
            "created_at": jt.created_at,
        }
        for jt, count in rows
    ]


@router.post(
    "",
    response_model=JobTitleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_job_title(
    body: JobTitleCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.roles.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new job title."""
    org_id = current_user["organization_id"]

    jt = JobTitle(
        id=uuid.uuid4(),
        organization_id=org_id,
        name=body.name,
        description=body.description,
    )
    db.add(jt)
    await db.commit()
    await db.refresh(jt)

    return {
        "id": jt.id,
        "name": jt.name,
        "description": jt.description,
        "is_system": jt.is_system,
        "staff_count": 0,
        "created_at": jt.created_at,
    }


@router.put("/{title_id}", response_model=JobTitleResponse)
async def update_job_title(
    title_id: uuid.UUID,
    body: JobTitleUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.roles.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a job title."""
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(JobTitle)
        .where(JobTitle.id == title_id)
        .where(JobTitle.organization_id == org_id)
    )
    jt = result.scalar_one_or_none()
    if jt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job title not found",
        )

    if jt.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify system job titles",
        )

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(jt, key, value)

    await db.commit()
    await db.refresh(jt)

    # Get staff count
    count_result = await db.execute(
        select(func.count(User.id)).where(
            User.job_title_id == jt.id,
            User.deleted_at.is_(None),
        )
    )
    staff_count = count_result.scalar() or 0

    return {
        "id": jt.id,
        "name": jt.name,
        "description": jt.description,
        "is_system": jt.is_system,
        "staff_count": staff_count,
        "created_at": jt.created_at,
    }


@router.delete("/{title_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_title(
    title_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.roles.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a job title. Unsets it from any assigned staff."""
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(JobTitle)
        .where(JobTitle.id == title_id)
        .where(JobTitle.organization_id == org_id)
    )
    jt = result.scalar_one_or_none()
    if jt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job title not found",
        )

    if jt.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system job titles",
        )

    # Unset from any assigned users
    users_result = await db.execute(
        select(User).where(
            User.job_title_id == jt.id,
            User.deleted_at.is_(None),
        )
    )
    for user in users_result.scalars().all():
        user.job_title_id = None

    await db.delete(jt)
    await db.commit()
