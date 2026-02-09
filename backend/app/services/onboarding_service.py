"""
Camp Connect - Onboarding Service
Business logic for the multi-step staff onboarding workflow.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import UploadFile
from sqlalchemy import func as sqlfunc
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from supabase import create_client

from app.config import settings
from app.models.staff_onboarding import (
    PolicyAcknowledgment,
    StaffCertification,
    StaffDocument,
    StaffOnboarding,
)
from app.models.user import User

logger = logging.getLogger(__name__)

# Supabase client for storage operations
_supabase_client = None

# Document upload constraints
ALLOWED_DOC_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_DOC_SIZE = 25 * 1024 * 1024  # 25 MB
STORAGE_BUCKET = "staff-documents"


def _get_supabase():
    """Lazy-init Supabase client for storage operations."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _supabase_client


# ─── Core Onboarding Operations ─────────────────────────────────


async def create_onboarding(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    Create a new StaffOnboarding record for a user.

    Sets the onboarding status to 'invited' and initializes step tracking.
    Verifies the user exists and belongs to the organization.
    """
    # Verify user exists in org
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .where(User.organization_id == organization_id)
        .where(User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError("User not found in this organization")

    # Check if onboarding already exists
    existing = await db.execute(
        select(StaffOnboarding)
        .where(StaffOnboarding.user_id == user_id)
        .where(StaffOnboarding.organization_id == organization_id)
    )
    if existing.scalar_one_or_none() is not None:
        raise ValueError("Onboarding already exists for this user")

    onboarding = StaffOnboarding(
        id=uuid.uuid4(),
        organization_id=organization_id,
        user_id=user_id,
        status="invited",
        current_step=1,
    )
    db.add(onboarding)
    await db.commit()

    # Reload with relationships
    return await get_onboarding_by_user(db, organization_id=organization_id, user_id=user_id)


async def get_onboarding_by_user(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """
    Return the onboarding record for a user with nested certifications,
    documents, and policy acknowledgments.
    """
    result = await db.execute(
        select(StaffOnboarding)
        .options(
            selectinload(StaffOnboarding.user),
            selectinload(StaffOnboarding.certifications),
            selectinload(StaffOnboarding.documents),
            selectinload(StaffOnboarding.acknowledgments),
        )
        .where(StaffOnboarding.user_id == user_id)
        .where(StaffOnboarding.organization_id == organization_id)
    )
    onboarding = result.scalar_one_or_none()
    if onboarding is None:
        return None

    return _onboarding_to_dict(onboarding, onboarding.user)


async def list_onboardings(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Dict[str, Any]:
    """
    List all onboarding records for an organization.
    Supports filtering by status and pagination.
    """
    # Build base query
    query = (
        select(StaffOnboarding)
        .options(
            selectinload(StaffOnboarding.user),
            selectinload(StaffOnboarding.certifications),
            selectinload(StaffOnboarding.documents),
            selectinload(StaffOnboarding.acknowledgments),
        )
        .where(StaffOnboarding.organization_id == organization_id)
        .where(StaffOnboarding.is_deleted == False)  # noqa: E712
    )

    if status_filter:
        query = query.where(StaffOnboarding.status == status_filter)

    # Count total
    count_query = (
        select(sqlfunc.count())
        .select_from(StaffOnboarding)
        .where(StaffOnboarding.organization_id == organization_id)
        .where(StaffOnboarding.is_deleted == False)  # noqa: E712
    )
    if status_filter:
        count_query = count_query.where(StaffOnboarding.status == status_filter)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(StaffOnboarding.created_at.desc())
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    onboardings = result.scalars().all()

    return {
        "items": [
            _onboarding_to_dict(ob, ob.user) for ob in onboardings
        ],
        "total": total,
    }


# ─── Step 1: Personal Info ───────────────────────────────────────


async def update_personal_info(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Update user personal info fields and mark step 1 complete.
    Updates the User model directly with provided fields.
    """
    # Load onboarding
    ob_result = await db.execute(
        select(StaffOnboarding)
        .where(StaffOnboarding.user_id == user_id)
        .where(StaffOnboarding.organization_id == organization_id)
    )
    onboarding = ob_result.scalar_one_or_none()
    if onboarding is None:
        raise ValueError("Onboarding not found")

    # Load and update user
    user_result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .where(User.organization_id == organization_id)
        .where(User.deleted_at.is_(None))
    )
    user = user_result.scalar_one_or_none()
    if user is None:
        raise ValueError("User not found")

    # Apply updates to user profile
    updatable_fields = {"first_name", "last_name", "phone"}
    for key, value in data.items():
        if key in updatable_fields and value is not None:
            setattr(user, key, value)

    # Mark step complete and advance
    onboarding.personal_info_completed = True
    if onboarding.status == "invited":
        onboarding.status = "in_progress"
    if onboarding.current_step < 2:
        onboarding.current_step = 2

    await db.commit()
    return await get_onboarding_by_user(db, organization_id=organization_id, user_id=user_id)


# ─── Step 2: Emergency Contacts ──────────────────────────────────


async def save_emergency_contacts(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
    contacts_data: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Save emergency contacts as JSONB on the onboarding record.
    Marks step 2 complete.
    """
    ob_result = await db.execute(
        select(StaffOnboarding)
        .where(StaffOnboarding.user_id == user_id)
        .where(StaffOnboarding.organization_id == organization_id)
    )
    onboarding = ob_result.scalar_one_or_none()
    if onboarding is None:
        raise ValueError("Onboarding not found")

    onboarding.emergency_contacts_data = contacts_data
    onboarding.emergency_contacts_completed = True
    if onboarding.status == "invited":
        onboarding.status = "in_progress"
    if onboarding.current_step < 3:
        onboarding.current_step = 3

    await db.commit()
    return await get_onboarding_by_user(db, organization_id=organization_id, user_id=user_id)


# ─── Step 3: Certifications ──────────────────────────────────────


async def add_certification(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    onboarding_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Add a certification record to an onboarding.
    Marks the certifications step as complete.
    """
    # Verify onboarding belongs to org
    ob_result = await db.execute(
        select(StaffOnboarding)
        .where(StaffOnboarding.id == onboarding_id)
        .where(StaffOnboarding.organization_id == organization_id)
    )
    onboarding = ob_result.scalar_one_or_none()
    if onboarding is None:
        raise ValueError("Onboarding not found")

    cert = StaffCertification(
        id=uuid.uuid4(),
        onboarding_id=onboarding_id,
        organization_id=organization_id,
        name=data["name"],
        issuing_authority=data.get("issuing_authority"),
        certificate_number=data.get("certificate_number"),
        issued_date=data.get("issued_date"),
        expiry_date=data.get("expiry_date"),
    )
    db.add(cert)

    # Mark step complete
    onboarding.certifications_completed = True
    if onboarding.status == "invited":
        onboarding.status = "in_progress"
    if onboarding.current_step < 4:
        onboarding.current_step = 4

    await db.commit()
    return await get_onboarding_by_user(
        db, organization_id=organization_id, user_id=onboarding.user_id
    )


async def delete_certification(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    cert_id: uuid.UUID,
) -> bool:
    """Delete a certification by ID, scoped to the organization."""
    result = await db.execute(
        select(StaffCertification)
        .where(StaffCertification.id == cert_id)
        .where(StaffCertification.organization_id == organization_id)
    )
    cert = result.scalar_one_or_none()
    if cert is None:
        return False

    await db.delete(cert)
    await db.commit()
    return True


# ─── Step 3 (continued): Document Upload ─────────────────────────


async def upload_document(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    onboarding_id: uuid.UUID,
    file: UploadFile,
    document_type: str,
) -> Dict[str, Any]:
    """
    Upload a document to Supabase Storage and create a StaffDocument record.

    Validates file type, size, and uploads to the 'staff-documents' bucket.
    """
    # Verify onboarding
    ob_result = await db.execute(
        select(StaffOnboarding)
        .where(StaffOnboarding.id == onboarding_id)
        .where(StaffOnboarding.organization_id == organization_id)
    )
    onboarding = ob_result.scalar_one_or_none()
    if onboarding is None:
        raise ValueError("Onboarding not found")

    # Validate MIME type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_DOC_TYPES:
        raise ValueError(
            f"File type '{content_type}' not allowed. "
            f"Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX"
        )

    # Read and validate size
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > MAX_DOC_SIZE:
        raise ValueError(
            f"File size ({file_size / 1024 / 1024:.1f} MB) exceeds "
            f"maximum of {MAX_DOC_SIZE / 1024 / 1024:.0f} MB"
        )
    if file_size == 0:
        raise ValueError("File is empty")

    # Build storage path
    file_name = file.filename or "unnamed"
    unique_prefix = str(uuid.uuid4())[:8]
    safe_name = file_name.replace(" ", "_")
    storage_path = (
        f"{organization_id}/{onboarding_id}/{document_type}/"
        f"{unique_prefix}_{safe_name}"
    )

    # Upload to Supabase Storage
    try:
        supabase = _get_supabase()
        supabase.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        logger.error(f"Supabase Storage upload failed: {e}")
        raise ValueError(f"Failed to upload file to storage: {e}")

    # Create database record
    doc = StaffDocument(
        id=uuid.uuid4(),
        onboarding_id=onboarding_id,
        organization_id=organization_id,
        document_type=document_type,
        file_name=file_name,
        file_path=storage_path,
        file_size=file_size,
        mime_type=content_type,
    )
    db.add(doc)
    await db.commit()

    return await get_onboarding_by_user(
        db, organization_id=organization_id, user_id=onboarding.user_id
    )


# ─── Step 4: Policy Acknowledgments ──────────────────────────────


async def acknowledge_policy(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    onboarding_id: uuid.UUID,
    policy_name: str,
    ip_address: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Record a policy acknowledgment for an onboarding.
    Marks the policy acknowledgments step as complete.
    """
    ob_result = await db.execute(
        select(StaffOnboarding)
        .where(StaffOnboarding.id == onboarding_id)
        .where(StaffOnboarding.organization_id == organization_id)
    )
    onboarding = ob_result.scalar_one_or_none()
    if onboarding is None:
        raise ValueError("Onboarding not found")

    ack = PolicyAcknowledgment(
        id=uuid.uuid4(),
        onboarding_id=onboarding_id,
        organization_id=organization_id,
        policy_name=policy_name,
        acknowledged_at=datetime.now(timezone.utc),
        ip_address=ip_address,
    )
    db.add(ack)

    # Mark step complete
    onboarding.policy_acknowledgments_completed = True
    if onboarding.status == "invited":
        onboarding.status = "in_progress"
    if onboarding.current_step < 5:
        onboarding.current_step = 5

    await db.commit()
    return await get_onboarding_by_user(
        db, organization_id=organization_id, user_id=onboarding.user_id
    )


# ─── Step 5: Payroll ─────────────────────────────────────────────


async def complete_payroll_step(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    onboarding_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    Mark the payroll information step as done.
    Actual payroll data is handled externally; this just flags completion.
    """
    ob_result = await db.execute(
        select(StaffOnboarding)
        .where(StaffOnboarding.id == onboarding_id)
        .where(StaffOnboarding.organization_id == organization_id)
    )
    onboarding = ob_result.scalar_one_or_none()
    if onboarding is None:
        raise ValueError("Onboarding not found")

    onboarding.payroll_info_completed = True
    if onboarding.status == "invited":
        onboarding.status = "in_progress"

    await db.commit()
    return await get_onboarding_by_user(
        db, organization_id=organization_id, user_id=onboarding.user_id
    )


# ─── Complete Onboarding ─────────────────────────────────────────


async def complete_onboarding(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    Mark onboarding as fully completed.

    Sets all step flags to True, status to 'completed', and records
    the completion timestamp.
    """
    ob_result = await db.execute(
        select(StaffOnboarding)
        .where(StaffOnboarding.user_id == user_id)
        .where(StaffOnboarding.organization_id == organization_id)
    )
    onboarding = ob_result.scalar_one_or_none()
    if onboarding is None:
        raise ValueError("Onboarding not found")

    # Mark all steps complete
    onboarding.personal_info_completed = True
    onboarding.emergency_contacts_completed = True
    onboarding.certifications_completed = True
    onboarding.policy_acknowledgments_completed = True
    onboarding.payroll_info_completed = True
    onboarding.status = "completed"
    onboarding.current_step = 5
    onboarding.completed_at = datetime.now(timezone.utc)

    await db.commit()
    return await get_onboarding_by_user(db, organization_id=organization_id, user_id=user_id)


# ─── Helpers ──────────────────────────────────────────────────────


def _onboarding_to_dict(
    onboarding: StaffOnboarding,
    user: Optional[User],
) -> Dict[str, Any]:
    """Convert a StaffOnboarding model (with relationships) to a response dict."""
    certifications = []
    for cert in (onboarding.certifications or []):
        certifications.append({
            "id": cert.id,
            "name": cert.name,
            "issuing_authority": cert.issuing_authority,
            "certificate_number": cert.certificate_number,
            "issued_date": cert.issued_date,
            "expiry_date": cert.expiry_date,
            "document_url": cert.document_url,
            "status": cert.status,
            "created_at": cert.created_at,
        })

    documents = []
    for doc in (onboarding.documents or []):
        documents.append({
            "id": doc.id,
            "document_type": doc.document_type,
            "file_name": doc.file_name,
            "file_size": doc.file_size,
            "mime_type": doc.mime_type,
            "notes": doc.notes,
            "created_at": doc.created_at,
        })

    acknowledgments = []
    for ack in (onboarding.acknowledgments or []):
        acknowledgments.append({
            "id": ack.id,
            "policy_name": ack.policy_name,
            "policy_version": ack.policy_version,
            "acknowledged_at": ack.acknowledged_at,
        })

    return {
        "id": onboarding.id,
        "user_id": onboarding.user_id,
        "organization_id": onboarding.organization_id,
        "status": onboarding.status,
        "current_step": onboarding.current_step,
        "personal_info_completed": onboarding.personal_info_completed,
        "emergency_contacts_completed": onboarding.emergency_contacts_completed,
        "certifications_completed": onboarding.certifications_completed,
        "policy_acknowledgments_completed": onboarding.policy_acknowledgments_completed,
        "payroll_info_completed": onboarding.payroll_info_completed,
        "emergency_contacts_data": onboarding.emergency_contacts_data,
        "completed_at": onboarding.completed_at,
        "created_at": onboarding.created_at,
        # Flattened user info
        "first_name": user.first_name if user else None,
        "last_name": user.last_name if user else None,
        "email": user.email if user else None,
        "avatar_url": user.avatar_url if user else None,
        # Nested collections
        "certifications": certifications,
        "documents": documents,
        "acknowledgments": acknowledgments,
    }
