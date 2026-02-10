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
    WorkflowUpdate,
)

router = APIRouter(prefix="/workflows", tags=["Workflows"])


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
