"""
Camp Connect - Staff Certifications API Endpoints
Manage certification types and staff certification records.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import require_permission
from app.database import get_db
from app.models.staff_certification import CertificationType, StaffCertificationRecord
from app.models.user import User
from app.schemas.staff_certification import (
    CertificationTypeCreate,
    CertificationTypeResponse,
    CertificationTypeUpdate,
    StaffCertificationCreate,
    StaffCertificationResponse,
    StaffCertificationUpdate,
)

router = APIRouter(prefix="/staff", tags=["Staff Certifications"])


# ─── Certification Types ─────────────────────────────────────


@router.get(
    "/certification-types",
    response_model=List[CertificationTypeResponse],
)
async def list_certification_types(
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all certification types for the organization."""
    org_id = current_user["organization_id"]
    result = await db.execute(
        select(CertificationType)
        .where(CertificationType.organization_id == org_id)
        .order_by(CertificationType.name)
    )
    cert_types = result.scalars().all()
    return cert_types


@router.post(
    "/certification-types",
    response_model=CertificationTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_certification_type(
    body: CertificationTypeCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new certification type for the organization."""
    org_id = current_user["organization_id"]
    cert_type = CertificationType(
        id=uuid.uuid4(),
        organization_id=org_id,
        **body.model_dump(),
    )
    db.add(cert_type)
    await db.commit()
    await db.refresh(cert_type)
    return cert_type


@router.put(
    "/certification-types/{cert_type_id}",
    response_model=CertificationTypeResponse,
)
async def update_certification_type(
    cert_type_id: uuid.UUID,
    body: CertificationTypeUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a certification type."""
    org_id = current_user["organization_id"]
    result = await db.execute(
        select(CertificationType)
        .where(CertificationType.id == cert_type_id)
        .where(CertificationType.organization_id == org_id)
    )
    cert_type = result.scalar_one_or_none()
    if cert_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification type not found",
        )

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cert_type, key, value)

    await db.commit()
    await db.refresh(cert_type)
    return cert_type


@router.delete(
    "/certification-types/{cert_type_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_certification_type(
    cert_type_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a certification type."""
    org_id = current_user["organization_id"]
    result = await db.execute(
        select(CertificationType)
        .where(CertificationType.id == cert_type_id)
        .where(CertificationType.organization_id == org_id)
    )
    cert_type = result.scalar_one_or_none()
    if cert_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification type not found",
        )

    await db.delete(cert_type)
    await db.commit()


# ─── Staff Certification Records ─────────────────────────────


@router.get(
    "/{user_id}/certifications",
    response_model=List[StaffCertificationResponse],
)
async def list_staff_certifications(
    user_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all certification records for a specific staff member."""
    org_id = current_user["organization_id"]

    # Verify user exists in org
    user_result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .where(User.organization_id == org_id)
        .where(User.deleted_at.is_(None))
    )
    if user_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    result = await db.execute(
        select(StaffCertificationRecord)
        .options(selectinload(StaffCertificationRecord.certification_type))
        .where(StaffCertificationRecord.user_id == user_id)
        .where(StaffCertificationRecord.organization_id == org_id)
        .order_by(StaffCertificationRecord.created_at.desc())
    )
    records = result.scalars().all()

    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "certification_type_id": r.certification_type_id,
            "certification_type_name": (
                r.certification_type.name if r.certification_type else None
            ),
            "status": r.status,
            "issued_date": r.issued_date,
            "expiry_date": r.expiry_date,
            "document_url": r.document_url,
            "notes": r.notes,
            "verified_by": r.verified_by,
            "created_at": r.created_at,
        }
        for r in records
    ]


@router.post(
    "/{user_id}/certifications",
    response_model=StaffCertificationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_staff_certification(
    user_id: uuid.UUID,
    body: StaffCertificationCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Add a certification record to a staff member."""
    org_id = current_user["organization_id"]

    # Verify user exists in org
    user_result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .where(User.organization_id == org_id)
        .where(User.deleted_at.is_(None))
    )
    if user_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found",
        )

    # Verify certification type exists in org
    ct_result = await db.execute(
        select(CertificationType)
        .where(CertificationType.id == body.certification_type_id)
        .where(CertificationType.organization_id == org_id)
    )
    cert_type = ct_result.scalar_one_or_none()
    if cert_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification type not found",
        )

    record = StaffCertificationRecord(
        id=uuid.uuid4(),
        organization_id=org_id,
        user_id=user_id,
        **body.model_dump(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return {
        "id": record.id,
        "user_id": record.user_id,
        "certification_type_id": record.certification_type_id,
        "certification_type_name": cert_type.name,
        "status": record.status,
        "issued_date": record.issued_date,
        "expiry_date": record.expiry_date,
        "document_url": record.document_url,
        "notes": record.notes,
        "verified_by": record.verified_by,
        "created_at": record.created_at,
    }


@router.put(
    "/certifications/{cert_id}",
    response_model=StaffCertificationResponse,
)
async def update_staff_certification(
    cert_id: uuid.UUID,
    body: StaffCertificationUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a staff certification record."""
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(StaffCertificationRecord)
        .options(selectinload(StaffCertificationRecord.certification_type))
        .where(StaffCertificationRecord.id == cert_id)
        .where(StaffCertificationRecord.organization_id == org_id)
    )
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification record not found",
        )

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)

    await db.commit()
    await db.refresh(record)

    return {
        "id": record.id,
        "user_id": record.user_id,
        "certification_type_id": record.certification_type_id,
        "certification_type_name": (
            record.certification_type.name if record.certification_type else None
        ),
        "status": record.status,
        "issued_date": record.issued_date,
        "expiry_date": record.expiry_date,
        "document_url": record.document_url,
        "notes": record.notes,
        "verified_by": record.verified_by,
        "created_at": record.created_at,
    }


@router.delete(
    "/certifications/{cert_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_staff_certification(
    cert_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.employees.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a staff certification record."""
    org_id = current_user["organization_id"]

    result = await db.execute(
        select(StaffCertificationRecord)
        .where(StaffCertificationRecord.id == cert_id)
        .where(StaffCertificationRecord.organization_id == org_id)
    )
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification record not found",
        )

    await db.delete(record)
    await db.commit()
