"""
Camp Connect - Workflow Automation API Endpoints
CRUD for workflows and execution monitoring.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.database import get_db
from app.models.workflow import (
    ContactAssociation,
    Workflow,
    WorkflowExecution,
    WorkflowExecutionLog,
)
from app.models.contact import Contact
from app.schemas.workflow import (
    ContactAssociationCreate,
    ContactAssociationResponse,
    WorkflowCreate,
    WorkflowExecutionLogResponse,
    WorkflowExecutionResponse,
    WorkflowListItem,
    WorkflowResponse,
    WorkflowTemplateResponse,
    WorkflowUpdate,
)

router = APIRouter(prefix="/workflows", tags=["Workflows"])


# ─── Pre-Built Workflow Templates ────────────────────────────

WORKFLOW_TEMPLATES = [
    {
        "key": "welcome_email",
        "name": "Welcome New Registration",
        "description": "Automatically send a welcome email with event details when a new registration is received.",
        "category": "onboarding",
        "trigger": {"type": "event", "event_type": "registration.created"},
        "steps": [
            {
                "id": "step_1",
                "type": "send_email",
                "config": {
                    "subject": "Welcome to Camp!",
                    "template": "welcome_registration",
                    "include_event_details": True,
                },
            }
        ],
    },
    {
        "key": "payment_reminder",
        "name": "Late Payment Reminder",
        "description": "Send payment reminders for overdue invoices: first reminder after 7 days, final notice after 14 days.",
        "category": "payments",
        "trigger": {"type": "event", "event_type": "invoice.overdue"},
        "steps": [
            {
                "id": "step_1",
                "type": "send_email",
                "config": {
                    "subject": "Payment Reminder",
                    "template": "payment_reminder",
                },
            },
            {
                "id": "step_2",
                "type": "delay",
                "config": {"duration": "7d"},
            },
            {
                "id": "step_3",
                "type": "send_email",
                "config": {
                    "subject": "Final Payment Notice",
                    "template": "payment_final_notice",
                },
            },
        ],
    },
    {
        "key": "health_form_reminder",
        "name": "Health Form Follow-up",
        "description": "After registration is confirmed, wait 3 days then check if the health form has been submitted. If not, send a reminder.",
        "category": "compliance",
        "trigger": {"type": "event", "event_type": "registration.confirmed"},
        "steps": [
            {
                "id": "step_1",
                "type": "delay",
                "config": {"duration": "3d"},
            },
            {
                "id": "step_2",
                "type": "if_else",
                "config": {
                    "condition": "health_form_submitted",
                    "operator": "equals",
                    "value": False,
                },
            },
            {
                "id": "step_3",
                "type": "send_email",
                "config": {
                    "subject": "Health Form Reminder",
                    "template": "health_form_reminder",
                },
            },
        ],
    },
    {
        "key": "event_reminder",
        "name": "Pre-Event Reminder",
        "description": "Send a preparation checklist 7 days before the event, then arrival details 1 day before.",
        "category": "events",
        "trigger": {"type": "schedule", "schedule": "7d_before_event"},
        "steps": [
            {
                "id": "step_1",
                "type": "send_email",
                "config": {
                    "subject": "Prepare for Camp!",
                    "template": "pre_event_checklist",
                },
            },
            {
                "id": "step_2",
                "type": "delay",
                "config": {"duration": "6d"},
            },
            {
                "id": "step_3",
                "type": "send_email",
                "config": {
                    "subject": "Arrival Details - Tomorrow!",
                    "template": "arrival_details",
                },
            },
        ],
    },
    {
        "key": "post_event_survey",
        "name": "Post-Event Feedback",
        "description": "Wait 1 day after the event ends, then send a thank you email with a survey link to collect feedback.",
        "category": "engagement",
        "trigger": {"type": "event", "event_type": "event.ended"},
        "steps": [
            {
                "id": "step_1",
                "type": "delay",
                "config": {"duration": "1d"},
            },
            {
                "id": "step_2",
                "type": "send_email",
                "config": {
                    "subject": "Thank You! Share Your Feedback",
                    "template": "post_event_survey",
                    "include_survey_link": True,
                },
            },
        ],
    },
]


@router.get("/templates", response_model=List[WorkflowTemplateResponse])
async def list_workflow_templates(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Return pre-built workflow templates."""
    return [
        WorkflowTemplateResponse(
            key=t["key"],
            name=t["name"],
            description=t["description"],
            category=t["category"],
            trigger=t["trigger"],
            steps=t["steps"],
            step_count=len(t["steps"]),
        )
        for t in WORKFLOW_TEMPLATES
    ]


@router.post(
    "/from-template/{template_key}",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_workflow_from_template(
    template_key: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new workflow from a pre-built template."""
    template = next((t for t in WORKFLOW_TEMPLATES if t["key"] == template_key), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    workflow = Workflow(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        name=template["name"],
        description=template["description"],
        status="draft",
        trigger=template["trigger"],
        steps=template["steps"],
        enrollment_type="automatic",
        re_enrollment=False,
        created_by=current_user["id"],
    )
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return workflow


# ─── Workflows CRUD ──────────────────────────────────────────


@router.get("", response_model=List[WorkflowListItem])
async def list_workflows(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all workflows for the organization."""
    query = (
        select(Workflow)
        .where(Workflow.organization_id == current_user["organization_id"])
        .where(Workflow.deleted_at.is_(None))
    )
    if status_filter:
        query = query.where(Workflow.status == status_filter)
    query = query.order_by(Workflow.updated_at.desc())

    result = await db.execute(query)
    workflows = result.scalars().all()

    return [
        WorkflowListItem(
            id=w.id,
            name=w.name,
            description=w.description,
            status=w.status,
            trigger_type=w.trigger.get("type") if isinstance(w.trigger, dict) else None,
            step_count=len(w.steps) if isinstance(w.steps, list) else 0,
            total_enrolled=w.total_enrolled,
            total_completed=w.total_completed,
            created_at=w.created_at,
        )
        for w in workflows
    ]


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single workflow with full definition."""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id)
        .where(Workflow.organization_id == current_user["organization_id"])
        .where(Workflow.deleted_at.is_(None))
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    body: WorkflowCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new workflow."""
    workflow = Workflow(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        name=body.name,
        description=body.description,
        status=body.status,
        trigger=body.trigger,
        steps=body.steps,
        enrollment_type=body.enrollment_type,
        re_enrollment=body.re_enrollment,
        created_by=current_user["id"],
    )
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: uuid.UUID,
    body: WorkflowUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a workflow."""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id)
        .where(Workflow.organization_id == current_user["organization_id"])
        .where(Workflow.deleted_at.is_(None))
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(workflow, key, value)

    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a workflow."""
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id)
        .where(Workflow.organization_id == current_user["organization_id"])
        .where(Workflow.deleted_at.is_(None))
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow.deleted_at = datetime.now(timezone.utc)
    await db.commit()


# ─── Workflow Executions ─────────────────────────────────────


@router.get("/{workflow_id}/executions", response_model=List[WorkflowExecutionResponse])
async def list_workflow_executions(
    workflow_id: uuid.UUID,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List executions for a workflow."""
    query = (
        select(WorkflowExecution)
        .where(WorkflowExecution.workflow_id == workflow_id)
        .where(WorkflowExecution.organization_id == current_user["organization_id"])
    )
    if status_filter:
        query = query.where(WorkflowExecution.status == status_filter)
    query = query.order_by(WorkflowExecution.started_at.desc()).limit(100)

    result = await db.execute(query)
    executions = result.scalars().all()

    return [
        WorkflowExecutionResponse(
            id=e.id,
            workflow_id=e.workflow_id,
            entity_type=e.entity_type,
            entity_id=e.entity_id,
            status=e.status,
            current_step_id=e.current_step_id,
            started_at=e.started_at,
            next_step_at=e.next_step_at,
            completed_at=e.completed_at,
            error_message=e.error_message,
        )
        for e in executions
    ]


@router.get(
    "/{workflow_id}/executions/{execution_id}/logs",
    response_model=List[WorkflowExecutionLogResponse],
)
async def list_execution_logs(
    workflow_id: uuid.UUID,
    execution_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get step-by-step execution logs."""
    result = await db.execute(
        select(WorkflowExecutionLog)
        .where(WorkflowExecutionLog.execution_id == execution_id)
        .order_by(WorkflowExecutionLog.executed_at.asc())
    )
    return result.scalars().all()


# ─── Contact Associations ───────────────────────────────────

assoc_router = APIRouter(prefix="/contacts", tags=["Contacts"])


@assoc_router.get(
    "/{contact_id}/associations",
    response_model=List[ContactAssociationResponse],
)
async def list_contact_associations(
    contact_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all associations for a contact."""
    result = await db.execute(
        select(ContactAssociation)
        .where(ContactAssociation.organization_id == current_user["organization_id"])
        .where(
            (ContactAssociation.contact_id == contact_id)
            | (ContactAssociation.related_contact_id == contact_id)
        )
        .order_by(ContactAssociation.created_at.desc())
    )
    associations = result.scalars().all()

    items = []
    for a in associations:
        # Determine which is the "other" contact
        other_id = a.related_contact_id if a.contact_id == contact_id else a.contact_id
        rel_type = a.relationship_type

        # Fetch the related contact's name
        contact_result = await db.execute(
            select(Contact).where(Contact.id == other_id)
        )
        other = contact_result.scalar_one_or_none()

        items.append(
            ContactAssociationResponse(
                id=a.id,
                contact_id=a.contact_id,
                related_contact_id=a.related_contact_id,
                relationship_type=rel_type,
                related_contact_name=(
                    f"{other.first_name} {other.last_name}" if other else None
                ),
                related_contact_email=other.email if other else None,
                notes=a.notes,
                created_at=a.created_at,
            )
        )
    return items


@assoc_router.post(
    "/{contact_id}/associations",
    response_model=ContactAssociationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_contact_association(
    contact_id: uuid.UUID,
    body: ContactAssociationCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create an association between two contacts."""
    org_id = current_user["organization_id"]

    association = ContactAssociation(
        id=uuid.uuid4(),
        organization_id=org_id,
        contact_id=contact_id,
        related_contact_id=body.related_contact_id,
        relationship_type=body.relationship_type,
        notes=body.notes,
    )
    db.add(association)
    await db.commit()
    await db.refresh(association)

    # Fetch related contact name
    contact_result = await db.execute(
        select(Contact).where(Contact.id == body.related_contact_id)
    )
    other = contact_result.scalar_one_or_none()

    return ContactAssociationResponse(
        id=association.id,
        contact_id=association.contact_id,
        related_contact_id=association.related_contact_id,
        relationship_type=association.relationship_type,
        related_contact_name=(
            f"{other.first_name} {other.last_name}" if other else None
        ),
        related_contact_email=other.email if other else None,
        notes=association.notes,
        created_at=association.created_at,
    )


@assoc_router.delete(
    "/{contact_id}/associations/{association_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_contact_association(
    contact_id: uuid.UUID,
    association_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a contact association."""
    result = await db.execute(
        select(ContactAssociation)
        .where(ContactAssociation.id == association_id)
        .where(ContactAssociation.organization_id == current_user["organization_id"])
    )
    assoc = result.scalar_one_or_none()
    if not assoc:
        raise HTTPException(status_code=404, detail="Association not found")
    await db.delete(assoc)
    await db.commit()
