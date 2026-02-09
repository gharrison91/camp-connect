"""
Camp Connect - Staff Onboarding API Endpoints
Multi-step onboarding workflow for new employees.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_current_user, require_permission
from app.database import get_db
from app.schemas.staff_onboarding import (
    CertificationCreate,
    EmergencyContactsUpdate,
    OnboardingCreate,
    OnboardingListResponse,
    OnboardingResponse,
    PersonalInfoUpdate,
)
from app.services import onboarding_service

router = APIRouter(prefix="/onboarding", tags=["Staff Onboarding"])


# ─── Manager Endpoints ───────────────────────────────────────────


@router.post(
    "/initiate",
    response_model=OnboardingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initiate_onboarding(
    body: OnboardingCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.onboarding.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate the onboarding process for a staff member.

    Requires **staff.onboarding.manage** permission.
    Creates a new onboarding record with status 'invited'.
    """
    try:
        return await onboarding_service.create_onboarding(
            db,
            organization_id=current_user["organization_id"],
            user_id=body.user_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=OnboardingListResponse,
)
async def list_onboardings(
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        description="Filter by status: invited, in_progress, completed",
    ),
    skip: int = Query(default=0, ge=0, description="Pagination offset"),
    limit: int = Query(default=50, ge=1, le=100, description="Page size"),
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.onboarding.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    List all onboarding records for the organization.

    Requires **staff.onboarding.manage** permission.
    Supports filtering by status and pagination.
    """
    return await onboarding_service.list_onboardings(
        db,
        organization_id=current_user["organization_id"],
        status_filter=status_filter,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{user_id}",
    response_model=OnboardingResponse,
)
async def get_onboarding(
    user_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("staff.onboarding.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get onboarding details for a specific user.

    Requires **staff.onboarding.manage** permission.
    """
    result = await onboarding_service.get_onboarding_by_user(
        db,
        organization_id=current_user["organization_id"],
        user_id=user_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not found for this user",
        )
    return result


# ─── Self-Service Endpoints (/me) ────────────────────────────────


@router.get(
    "/me",
    response_model=OnboardingResponse,
)
async def get_my_onboarding(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current user's own onboarding record.

    No special permission required (self-service).
    """
    result = await onboarding_service.get_onboarding_by_user(
        db,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"],
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No onboarding found. Contact your administrator.",
        )
    return result


@router.put(
    "/me/personal-info",
    response_model=OnboardingResponse,
)
async def update_my_personal_info(
    body: PersonalInfoUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update personal information (step 1).

    Updates the user profile fields and marks the personal info step complete.
    """
    try:
        return await onboarding_service.update_personal_info(
            db,
            organization_id=current_user["organization_id"],
            user_id=current_user["id"],
            data=body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/me/emergency-contacts",
    response_model=OnboardingResponse,
)
async def update_my_emergency_contacts(
    body: EmergencyContactsUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Save emergency contacts (step 2).

    Stores the contacts list as JSONB on the onboarding record.
    """
    contacts_data = [c.model_dump() for c in body.contacts]
    try:
        return await onboarding_service.save_emergency_contacts(
            db,
            organization_id=current_user["organization_id"],
            user_id=current_user["id"],
            contacts_data=contacts_data,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/me/certifications",
    response_model=OnboardingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_my_certification(
    body: CertificationCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a certification (step 3).

    Creates a StaffCertification record linked to the user's onboarding.
    """
    # Look up onboarding to get its ID
    onboarding = await onboarding_service.get_onboarding_by_user(
        db,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"],
    )
    if onboarding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not found",
        )

    try:
        return await onboarding_service.add_certification(
            db,
            organization_id=current_user["organization_id"],
            onboarding_id=onboarding["id"],
            data=body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/me/certifications/{cert_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_my_certification(
    cert_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete one of the current user's certifications."""
    deleted = await onboarding_service.delete_certification(
        db,
        organization_id=current_user["organization_id"],
        cert_id=cert_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )


@router.post(
    "/me/documents",
    response_model=OnboardingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_my_document(
    file: UploadFile = File(...),
    document_type: str = Form(default="other"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a document (W-4, I-9, ID, etc.) during onboarding.

    Accepts multipart file upload with a document_type form field.
    """
    onboarding = await onboarding_service.get_onboarding_by_user(
        db,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"],
    )
    if onboarding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not found",
        )

    try:
        return await onboarding_service.upload_document(
            db,
            organization_id=current_user["organization_id"],
            onboarding_id=onboarding["id"],
            file=file,
            document_type=document_type,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/me/policies/{policy_name}/acknowledge",
    response_model=OnboardingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def acknowledge_my_policy(
    policy_name: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Acknowledge a policy (step 4).

    Records the policy name, timestamp, and client IP address.
    """
    onboarding = await onboarding_service.get_onboarding_by_user(
        db,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"],
    )
    if onboarding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not found",
        )

    ip_address = await get_client_ip(request)

    try:
        return await onboarding_service.acknowledge_policy(
            db,
            organization_id=current_user["organization_id"],
            onboarding_id=onboarding["id"],
            policy_name=policy_name,
            ip_address=ip_address,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/me/payroll/complete",
    response_model=OnboardingResponse,
)
async def complete_my_payroll(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark the payroll step (step 5) as complete.

    Actual payroll data is handled externally; this endpoint just
    flags the step as done in the onboarding workflow.
    """
    onboarding = await onboarding_service.get_onboarding_by_user(
        db,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"],
    )
    if onboarding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not found",
        )

    try:
        return await onboarding_service.complete_payroll_step(
            db,
            organization_id=current_user["organization_id"],
            onboarding_id=onboarding["id"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/me/complete",
    response_model=OnboardingResponse,
)
async def complete_my_onboarding(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark onboarding as fully completed.

    Sets all steps to complete, status to 'completed', and records
    the completion timestamp.
    """
    try:
        return await onboarding_service.complete_onboarding(
            db,
            organization_id=current_user["organization_id"],
            user_id=current_user["id"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
