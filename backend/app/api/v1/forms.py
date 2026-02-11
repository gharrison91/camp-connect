"""
Camp Connect - Form Builder API Endpoints
CRUD for form templates and submissions.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.models.form_builder import FormSubmission, FormTemplate
from app.schemas.form_builder import (
    FormSubmissionCreate,
    FormSubmissionListResponse,
    FormSubmissionResponse,
    FormTemplateCreate,
    FormTemplateListItem,
    FormTemplateResponse,
    FormTemplateUpdate,
)

router = APIRouter(prefix="/forms", tags=["Form Builder"])


# ─── Templates ───────────────────────────────────────────────


@router.get("/templates", response_model=List[FormTemplateListItem])
async def list_form_templates(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all form templates for the organization."""
    query = (
        select(FormTemplate)
        .where(FormTemplate.organization_id == current_user["organization_id"])
        .where(FormTemplate.deleted_at.is_(None))
    )
    if category:
        query = query.where(FormTemplate.category == category)
    if status_filter:
        query = query.where(FormTemplate.status == status_filter)
    query = query.order_by(FormTemplate.updated_at.desc())

    result = await db.execute(query)
    templates = result.scalars().all()

    items = []
    for t in templates:
        # Count submissions
        sub_count = await db.execute(
            select(func.count(FormSubmission.id)).where(
                FormSubmission.template_id == t.id
            )
        )
        items.append(
            FormTemplateListItem(
                id=t.id,
                name=t.name,
                description=t.description,
                category=t.category,
                status=t.status,
                require_signature=t.require_signature,
                field_count=len(t.fields) if isinstance(t.fields, list) else 0,
                submission_count=sub_count.scalar() or 0,
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
        )
    return items




@router.get("/templates/trash", response_model=List[FormTemplateListItem])
async def list_trashed_forms(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List soft-deleted form templates (trash bin). Only shows forms deleted within last 30 days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    query = (
        select(FormTemplate)
        .where(FormTemplate.organization_id == current_user["organization_id"])
        .where(FormTemplate.deleted_at.isnot(None))
        .where(FormTemplate.deleted_at > cutoff)
        .order_by(FormTemplate.deleted_at.desc())
    )
    result = await db.execute(query)
    templates = result.scalars().all()

    items = []
    for t in templates:
        sub_count = await db.execute(
            select(func.count(FormSubmission.id)).where(
                FormSubmission.template_id == t.id
            )
        )
        items.append(
            FormTemplateListItem(
                id=t.id,
                name=t.name,
                description=t.description,
                category=t.category,
                status=t.status,
                require_signature=t.require_signature,
                field_count=len(t.fields) if isinstance(t.fields, list) else 0,
                submission_count=sub_count.scalar() or 0,
                created_at=t.created_at,
                updated_at=t.updated_at,
                deleted_at=t.deleted_at,
            )
        )
    return items


@router.get("/templates/{template_id}", response_model=FormTemplateResponse)
async def get_form_template(
    template_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single form template with full field definitions."""
    result = await db.execute(
        select(FormTemplate)
        .where(FormTemplate.id == template_id)
        .where(FormTemplate.organization_id == current_user["organization_id"])
        .where(FormTemplate.deleted_at.is_(None))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")
    return template


@router.post(
    "/templates",
    response_model=FormTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_form_template(
    body: FormTemplateCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new form template."""
    template = FormTemplate(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        name=body.name,
        description=body.description,
        category=body.category,
        status=body.status,
        fields=body.fields,
        settings=body.settings,
        require_signature=body.require_signature,
        created_by=current_user["id"],
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.put("/templates/{template_id}", response_model=FormTemplateResponse)
async def update_form_template(
    template_id: uuid.UUID,
    body: FormTemplateUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a form template."""
    result = await db.execute(
        select(FormTemplate)
        .where(FormTemplate.id == template_id)
        .where(FormTemplate.organization_id == current_user["organization_id"])
        .where(FormTemplate.deleted_at.is_(None))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)

    # Bump version if fields changed
    if "fields" in update_data:
        template.version += 1

    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form_template(
    template_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a form template."""
    result = await db.execute(
        select(FormTemplate)
        .where(FormTemplate.id == template_id)
        .where(FormTemplate.organization_id == current_user["organization_id"])
        .where(FormTemplate.deleted_at.is_(None))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")
    template.deleted_at = datetime.now(timezone.utc)
    await db.commit()


@router.post(
    "/templates/{template_id}/duplicate",
    response_model=FormTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def duplicate_form_template(
    template_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Duplicate a form template."""
    result = await db.execute(
        select(FormTemplate)
        .where(FormTemplate.id == template_id)
        .where(FormTemplate.organization_id == current_user["organization_id"])
        .where(FormTemplate.deleted_at.is_(None))
    )
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Form template not found")

    duplicate = FormTemplate(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        name=f"{original.name} (Copy)",
        description=original.description,
        category=original.category,
        status="draft",
        fields=original.fields,
        settings=original.settings,
        require_signature=original.require_signature,
        created_by=current_user["id"],
    )
    db.add(duplicate)
    await db.commit()
    await db.refresh(duplicate)
    return duplicate


@router.post("/templates/{template_id}/restore", response_model=FormTemplateResponse)
async def restore_form_template(
    template_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Restore a soft-deleted form template from trash."""
    result = await db.execute(
        select(FormTemplate)
        .where(FormTemplate.id == template_id)
        .where(FormTemplate.organization_id == current_user["organization_id"])
        .where(FormTemplate.deleted_at.isnot(None))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Trashed form template not found")
    template.deleted_at = None
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/templates/{template_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanently_delete_form_template(
    template_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a form template (must already be in trash)."""
    result = await db.execute(
        select(FormTemplate)
        .where(FormTemplate.id == template_id)
        .where(FormTemplate.organization_id == current_user["organization_id"])
        .where(FormTemplate.deleted_at.isnot(None))
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Trashed form template not found")
    await db.delete(template)
    await db.commit()


# ─── Submissions ─────────────────────────────────────────────


@router.get("/submissions", response_model=FormSubmissionListResponse)
async def list_form_submissions(
    template_id: Optional[uuid.UUID] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    contact_id: Optional[uuid.UUID] = Query(None),
    camper_id: Optional[uuid.UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List form submissions with filters."""
    query = (
        select(FormSubmission)
        .where(FormSubmission.organization_id == current_user["organization_id"])
    )
    count_query = (
        select(func.count(FormSubmission.id))
        .where(FormSubmission.organization_id == current_user["organization_id"])
    )

    if template_id:
        query = query.where(FormSubmission.template_id == template_id)
        count_query = count_query.where(FormSubmission.template_id == template_id)
    if status_filter:
        query = query.where(FormSubmission.status == status_filter)
        count_query = count_query.where(FormSubmission.status == status_filter)
    if contact_id:
        query = query.where(FormSubmission.submitted_by_contact_id == contact_id)
        count_query = count_query.where(FormSubmission.submitted_by_contact_id == contact_id)
    if camper_id:
        from sqlalchemy import or_
        camper_filter = or_(
            (FormSubmission.related_entity_type == "camper") & (FormSubmission.related_entity_id == str(camper_id)),
            FormSubmission.submitted_by_contact_id == camper_id,
        )
        query = query.where(camper_filter)
        count_query = count_query.where(camper_filter)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(
        query.order_by(FormSubmission.created_at.desc()).offset(skip).limit(limit)
    )
    submissions = result.scalars().all()

    items = []
    for s in submissions:
        # Get template name
        tmpl_result = await db.execute(
            select(FormTemplate.name).where(FormTemplate.id == s.template_id)
        )
        tmpl_name = tmpl_result.scalar_one_or_none()

        items.append(
            FormSubmissionResponse(
                id=s.id,
                template_id=s.template_id,
                template_name=tmpl_name,
                submitted_by_user_id=s.submitted_by_user_id,
                submitted_by_contact_id=s.submitted_by_contact_id,
                submitted_by_email=s.submitted_by_email,
                related_entity_type=s.related_entity_type,
                related_entity_id=s.related_entity_id,
                answers=s.answers,
                signature_data=s.signature_data,
                status=s.status,
                ip_address=s.ip_address,
                submitted_at=s.submitted_at,
                created_at=s.created_at,
            )
        )

    return FormSubmissionListResponse(items=items, total=total)


@router.get("/submissions/{submission_id}", response_model=FormSubmissionResponse)
async def get_form_submission(
    submission_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single submission."""
    result = await db.execute(
        select(FormSubmission)
        .where(FormSubmission.id == submission_id)
        .where(FormSubmission.organization_id == current_user["organization_id"])
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    tmpl_result = await db.execute(
        select(FormTemplate.name).where(FormTemplate.id == sub.template_id)
    )
    tmpl_name = tmpl_result.scalar_one_or_none()

    return FormSubmissionResponse(
        id=sub.id,
        template_id=sub.template_id,
        template_name=tmpl_name,
        submitted_by_user_id=sub.submitted_by_user_id,
        submitted_by_contact_id=sub.submitted_by_contact_id,
        submitted_by_email=sub.submitted_by_email,
        related_entity_type=sub.related_entity_type,
        related_entity_id=sub.related_entity_id,
        answers=sub.answers,
        signature_data=sub.signature_data,
        status=sub.status,
        ip_address=sub.ip_address,
        submitted_at=sub.submitted_at,
        created_at=sub.created_at,
    )


@router.post(
    "/submissions",
    response_model=FormSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_form_submission(
    body: FormSubmissionCreate,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a completed form."""
    # Verify template exists
    tmpl_result = await db.execute(
        select(FormTemplate)
        .where(FormTemplate.id == body.template_id)
        .where(FormTemplate.organization_id == current_user["organization_id"])
        .where(FormTemplate.deleted_at.is_(None))
    )
    template = tmpl_result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")

    submission = FormSubmission(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        template_id=body.template_id,
        submitted_by_user_id=current_user["id"],
        answers=body.answers,
        signature_data=body.signature_data,
        related_entity_type=body.related_entity_type,
        related_entity_id=body.related_entity_id,
        status=body.status,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500],
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    return FormSubmissionResponse(
        id=submission.id,
        template_id=submission.template_id,
        template_name=template.name,
        submitted_by_user_id=submission.submitted_by_user_id,
        submitted_by_contact_id=submission.submitted_by_contact_id,
        submitted_by_email=submission.submitted_by_email,
        related_entity_type=submission.related_entity_type,
        related_entity_id=submission.related_entity_id,
        answers=submission.answers,
        signature_data=submission.signature_data,
        status=submission.status,
        ip_address=submission.ip_address,
        submitted_at=submission.submitted_at,
        created_at=submission.created_at,
    )
