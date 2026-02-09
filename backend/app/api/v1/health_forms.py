"""
Camp Connect - Health Forms API Endpoints
Manage health form templates, assign forms to campers, handle submissions and reviews.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, require_permission
from app.database import get_db
from app.schemas.health_form import (
    HealthFormAssign,
    HealthFormReview,
    HealthFormResponse,
    HealthFormSubmissionResponse,
    HealthFormSubmit,
    HealthFormTemplateCreate,
    HealthFormTemplateResponse,
    HealthFormTemplateUpdate,
)
from app.services import health_form_service

router = APIRouter(prefix="/health", tags=["Health & Safety"])


# ─── Template Endpoints ────────────────────────────────────────


@router.get(
    "/templates",
    response_model=List[HealthFormTemplateResponse],
)
async def list_templates(
    category: Optional[str] = Query(default=None, description="Filter by category"),
    search: Optional[str] = Query(default=None, description="Search by name"),
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all health form templates for the organization."""
    return await health_form_service.list_templates(
        db,
        organization_id=current_user["organization_id"],
        category=category,
        search=search,
    )


@router.get(
    "/templates/{template_id}",
    response_model=HealthFormTemplateResponse,
)
async def get_template(
    template_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single health form template by ID."""
    template = await health_form_service.get_template(
        db,
        organization_id=current_user["organization_id"],
        template_id=template_id,
    )
    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    return template


@router.post(
    "/templates",
    response_model=HealthFormTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_template(
    body: HealthFormTemplateCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new health form template."""
    return await health_form_service.create_template(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/templates/{template_id}",
    response_model=HealthFormTemplateResponse,
)
async def update_template(
    template_id: uuid.UUID,
    body: HealthFormTemplateUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing health form template."""
    result = await health_form_service.update_template(
        db,
        organization_id=current_user["organization_id"],
        template_id=template_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    return result


@router.delete(
    "/templates/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_template(
    template_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a health form template. System templates cannot be deleted."""
    try:
        deleted = await health_form_service.delete_template(
            db,
            organization_id=current_user["organization_id"],
            template_id=template_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )


# ─── Form Instance Endpoints ──────────────────────────────────


@router.post(
    "/forms/assign",
    response_model=HealthFormResponse,
    status_code=status.HTTP_201_CREATED,
)
async def assign_form(
    body: HealthFormAssign,
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Assign a health form template to a camper."""
    try:
        return await health_form_service.assign_form(
            db,
            organization_id=current_user["organization_id"],
            data=body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/forms",
    response_model=List[HealthFormResponse],
)
async def list_forms(
    camper_id: Optional[uuid.UUID] = Query(default=None, description="Filter by camper"),
    event_id: Optional[uuid.UUID] = Query(default=None, description="Filter by event"),
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by status"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List health forms with optional filters."""
    return await health_form_service.list_forms(
        db,
        organization_id=current_user["organization_id"],
        camper_id=camper_id,
        event_id=event_id,
        status=status_filter,
    )


@router.get(
    "/forms/{form_id}",
    response_model=HealthFormResponse,
)
async def get_form(
    form_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a health form by ID, including template field definitions."""
    form = await health_form_service.get_form(
        db,
        organization_id=current_user["organization_id"],
        form_id=form_id,
    )
    if form is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found",
        )
    return form


@router.post(
    "/forms/{form_id}/submit",
    response_model=HealthFormSubmissionResponse,
)
async def submit_form(
    form_id: uuid.UUID,
    body: HealthFormSubmit,
    request: Request,
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.submit")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Submit form data for a health form."""
    ip_address = await get_client_ip(request)
    try:
        return await health_form_service.submit_form(
            db,
            organization_id=current_user["organization_id"],
            form_id=form_id,
            data=body.model_dump(),
            submitted_by=current_user["id"],
            ip_address=ip_address,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/forms/{form_id}/review",
    response_model=HealthFormResponse,
)
async def review_form(
    form_id: uuid.UUID,
    body: HealthFormReview,
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.manage")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a submitted health form."""
    try:
        result = await health_form_service.review_form(
            db,
            organization_id=current_user["organization_id"],
            form_id=form_id,
            reviewer_id=current_user["id"],
            status=body.status,
            notes=body.review_notes,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found",
        )
    return result


@router.get(
    "/forms/{form_id}/submission",
    response_model=HealthFormSubmissionResponse,
)
async def get_submission(
    form_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("health.forms.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get the submission data for a health form."""
    submission = await health_form_service.get_submission(
        db,
        organization_id=current_user["organization_id"],
        form_id=form_id,
    )
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )
    return submission
