"""
Camp Connect - Parent Portal Documents & Forms API Endpoints
Endpoints for parents to view/download shared documents and complete assigned forms.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import and_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.portal_deps import get_portal_user
from app.database import get_db
from app.models.camper import Camper
from app.models.form_builder import FormSubmission, FormTemplate
from app.schemas.portal_documents import (
    PortalDocument,
    PortalDocumentListResponse,
    PortalFormAssignment,
    PortalFormAssignmentListResponse,
    PortalFormSubmitRequest,
)

router = APIRouter(prefix="/portal", tags=["Parent Portal - Documents & Forms"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _classify_file_type(filename: str) -> str:
    """Classify a filename into a document type category."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        return "pdf"
    if ext in ("doc", "docx"):
        return "doc"
    if ext in ("xls", "xlsx", "csv"):
        return "spreadsheet"
    if ext in ("jpg", "jpeg", "png", "gif", "webp", "svg"):
        return "image"
    return "other"


async def _get_camper_names_map(
    db: AsyncSession, camper_ids: List[uuid.UUID]
) -> Dict[uuid.UUID, str]:
    """Build a map of camper_id -> full name for the given IDs."""
    if not camper_ids:
        return {}
    result = await db.execute(
        select(Camper.id, Camper.first_name, Camper.last_name).where(
            Camper.id.in_(camper_ids)
        )
    )
    return {
        row[0]: f"{row[1]} {row[2]}" for row in result.all()
    }


def _compute_form_status(
    submission: Optional[FormSubmission],
    due_date: Optional[datetime],
) -> str:
    """Determine form status: pending, completed, or overdue."""
    if submission and submission.status == "submitted":
        return "completed"
    if due_date and due_date < datetime.now(timezone.utc):
        return "overdue"
    return "pending"


# ---------------------------------------------------------------------------
# GET /portal/documents -- list documents shared with parent
# ---------------------------------------------------------------------------

@router.get("/documents", response_model=PortalDocumentListResponse)
async def list_portal_documents(
    camper_id: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> PortalDocumentListResponse:
    """
    List documents shared with the authenticated parent.
    Scoped to the parent's linked campers and organization.

    Documents come from form submissions with file-type answers,
    and from any shared organizational documents (health forms, waivers, etc.).
    For this implementation, we query form submissions that include file uploads
    and also published form templates marked as document-shareable.

    Query params:
      - camper_id: filter by specific camper
      - search: search documents by name
    """
    org_id = portal_user["organization_id"]
    linked_camper_ids = portal_user["linked_camper_ids"]

    if not linked_camper_ids:
        return PortalDocumentListResponse(items=[], total=0)

    # Filter to specific camper if requested
    target_camper_ids = linked_camper_ids
    if camper_id:
        if camper_id not in linked_camper_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Camper not linked to your account.",
            )
        target_camper_ids = [camper_id]

    camper_names = await _get_camper_names_map(db, target_camper_ids)

    # Query published form templates that serve as shared documents
    # (templates in document-shareable categories: waiver, permission, health)
    query = (
        select(FormTemplate)
        .where(
            and_(
                FormTemplate.organization_id == org_id,
                FormTemplate.status == "published",
                FormTemplate.category.in_(["waiver", "permission", "health", "document"]),
                FormTemplate.deleted_at.is_(None),
            )
        )
        .order_by(FormTemplate.updated_at.desc())
    )
    result = await db.execute(query)
    templates = result.scalars().all()

    documents: List[PortalDocument] = []
    for tmpl in templates:
        # Each document is available per camper
        for cid in target_camper_ids:
            doc_name = tmpl.name
            if search and search.lower() not in doc_name.lower():
                continue

            doc = PortalDocument(
                id=tmpl.id,
                name=doc_name,
                type="pdf",
                size_bytes=len(str(tmpl.fields)) * 2 if tmpl.fields else 0,
                uploaded_at=tmpl.updated_at,
                camper_name=camper_names.get(cid),
                download_url=f"/portal/documents/{tmpl.id}/download",
            )
            documents.append(doc)

    return PortalDocumentListResponse(items=documents, total=len(documents))


# ---------------------------------------------------------------------------
# GET /portal/documents/{id}/download -- download a document
# ---------------------------------------------------------------------------

@router.get("/documents/{document_id}/download")
async def download_portal_document(
    document_id: uuid.UUID,
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get download information for a shared document.
    Returns document metadata and content/URL for the client to fetch.
    """
    org_id = portal_user["organization_id"]

    result = await db.execute(
        select(FormTemplate).where(
            and_(
                FormTemplate.id == document_id,
                FormTemplate.organization_id == org_id,
                FormTemplate.deleted_at.is_(None),
            )
        )
    )
    template = result.scalar_one_or_none()

    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    return {
        "id": str(template.id),
        "name": template.name,
        "type": "pdf",
        "content": {
            "fields": template.fields,
            "settings": template.settings,
            "description": template.description,
        },
        "message": "Document content returned. In production, this would return a signed URL or file stream.",
    }


# ---------------------------------------------------------------------------
# GET /portal/forms -- list forms assigned to parent for completion
# ---------------------------------------------------------------------------

@router.get("/forms", response_model=PortalFormAssignmentListResponse)
async def list_portal_forms(
    camper_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = None,
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> PortalFormAssignmentListResponse:
    """
    List forms assigned to the authenticated parent for completion.
    Forms are derived from published FormTemplates in the organization.
    Completion status is determined by checking FormSubmissions by this contact.

    Query params:
      - camper_id: filter by specific camper
      - status_filter: pending, completed, or overdue
    """
    org_id = portal_user["organization_id"]
    contact_id = portal_user["contact_id"]
    linked_camper_ids = portal_user["linked_camper_ids"]

    if not linked_camper_ids:
        return PortalFormAssignmentListResponse(items=[], total=0)

    target_camper_ids = linked_camper_ids
    if camper_id:
        if camper_id not in linked_camper_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Camper not linked to your account.",
            )
        target_camper_ids = [camper_id]

    camper_names = await _get_camper_names_map(db, target_camper_ids)

    # Get all published form templates for this organization
    tmpl_result = await db.execute(
        select(FormTemplate).where(
            and_(
                FormTemplate.organization_id == org_id,
                FormTemplate.status == "published",
                FormTemplate.deleted_at.is_(None),
            )
        ).order_by(FormTemplate.created_at.desc())
    )
    templates = tmpl_result.scalars().all()

    # Get all submissions by this contact
    sub_result = await db.execute(
        select(FormSubmission).where(
            and_(
                FormSubmission.organization_id == org_id,
                FormSubmission.submitted_by_contact_id == contact_id,
            )
        )
    )
    submissions = sub_result.scalars().all()

    # Build a lookup: (template_id, camper_id) -> submission
    sub_lookup: Dict[tuple, FormSubmission] = {}
    for sub in submissions:
        key = (sub.template_id, sub.related_entity_id)
        sub_lookup[key] = sub

    assignments: List[PortalFormAssignment] = []
    for tmpl in templates:
        for cid in target_camper_ids:
            existing_sub = sub_lookup.get((tmpl.id, cid))

            # Determine due date from template settings
            due_date = None
            if tmpl.settings and isinstance(tmpl.settings, dict):
                expires = tmpl.settings.get("expires_at")
                if expires:
                    try:
                        due_date = datetime.fromisoformat(str(expires))
                    except (ValueError, TypeError):
                        pass

            form_status = _compute_form_status(existing_sub, due_date)

            if status_filter and form_status != status_filter:
                continue

            assignment = PortalFormAssignment(
                id=existing_sub.id if existing_sub else tmpl.id,
                form_name=tmpl.name,
                description=tmpl.description,
                status=form_status,
                due_date=due_date,
                camper_name=camper_names.get(cid),
                template_id=tmpl.id,
                fields=tmpl.fields if isinstance(tmpl.fields, list) else [],
                settings=tmpl.settings if isinstance(tmpl.settings, dict) else {},
                require_signature=tmpl.require_signature,
                submitted_at=existing_sub.submitted_at if existing_sub else None,
            )
            assignments.append(assignment)

    return PortalFormAssignmentListResponse(items=assignments, total=len(assignments))


# ---------------------------------------------------------------------------
# POST /portal/forms/{template_id}/submit -- submit a completed form
# ---------------------------------------------------------------------------

@router.post("/forms/{template_id}/submit")
async def submit_portal_form(
    template_id: uuid.UUID,
    body: PortalFormSubmitRequest,
    request: Request,
    portal_user: Dict[str, Any] = Depends(get_portal_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Submit a completed form from the parent portal.
    Creates a FormSubmission record linked to the parent's contact.
    """
    org_id = portal_user["organization_id"]
    contact_id = portal_user["contact_id"]

    # Verify the template exists and is published
    tmpl_result = await db.execute(
        select(FormTemplate).where(
            and_(
                FormTemplate.id == template_id,
                FormTemplate.organization_id == org_id,
                FormTemplate.status == "published",
                FormTemplate.deleted_at.is_(None),
            )
        )
    )
    template = tmpl_result.scalar_one_or_none()

    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or not available for submission.",
        )

    # Check max submissions if configured
    if template.settings and isinstance(template.settings, dict):
        max_subs = template.settings.get("max_submissions")
        if max_subs:
            count_result = await db.execute(
                select(func.count(FormSubmission.id)).where(
                    and_(
                        FormSubmission.template_id == template_id,
                        FormSubmission.organization_id == org_id,
                    )
                )
            )
            current_count = count_result.scalar() or 0
            if current_count >= max_subs:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This form has reached its maximum number of submissions.",
                )

    # Determine camper from answers or first linked camper
    camper_id = None
    if portal_user["linked_camper_ids"]:
        camper_id = portal_user["linked_camper_ids"][0]

    # Get client IP
    client_ip = request.client.host if request.client else None

    submission = FormSubmission(
        organization_id=org_id,
        template_id=template_id,
        submitted_by_contact_id=contact_id,
        submitted_by_email=portal_user.get("email"),
        related_entity_type="camper" if camper_id else None,
        related_entity_id=camper_id,
        answers=body.answers,
        signature_data=body.signature_data,
        status="submitted",
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent", "")[:500],
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    return {
        "id": str(submission.id),
        "template_id": str(template_id),
        "status": "submitted",
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "message": "Form submitted successfully.",
    }
