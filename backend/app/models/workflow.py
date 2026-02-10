"""
Camp Connect - Workflow Automation Models
HubSpot-style workflow automation engine.

Workflow: The workflow definition (trigger, steps, conditions)
WorkflowExecution: A running instance of a workflow
WorkflowExecutionLog: Detailed log of each step in an execution
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Workflow(Base):
    """
    A workflow automation definition.

    `trigger` JSONB stores what kicks off the workflow:
    {
      "type": "event",           # event, schedule, manual, form_submitted
      "event_type": "registration_confirmed",
      "conditions": {            # optional filter conditions
        "event_id": "...",
        "camper_age_min": 8
      }
    }

    Trigger types:
    - event: Fires on a system event (registration, payment, form submission, etc.)
    - schedule: Fires on a cron schedule (daily, weekly, specific date)
    - manual: Manually triggered by admin
    - form_submitted: Fires when a specific form is submitted

    `steps` JSONB stores the workflow actions as an array:
    [
      {
        "id": "step_001",
        "type": "send_email",      # Action types below
        "config": {
          "template_id": "...",
          "to": "{{contact.email}}",
          "subject": "Welcome to camp!"
        },
        "delay": null,              # Optional delay before execution
        "conditions": null          # Optional if/else branching
      },
      {
        "id": "step_002",
        "type": "delay",
        "config": { "duration": "3d" }    # 3 days
      },
      {
        "id": "step_003",
        "type": "if_else",
        "config": {
          "condition": "{{registration.payment_status}} == 'unpaid'",
          "if_steps": ["step_004"],
          "else_steps": ["step_005"]
        }
      },
      ...
    ]

    Action types:
    - send_email: Send email via template or custom
    - send_sms: Send SMS message
    - delay: Wait for specified duration (minutes, hours, days)
    - if_else: Conditional branching
    - update_record: Update a field on a record
    - create_task: Create a todo/task for staff
    - send_form: Send a form (from form builder) to a contact
    - add_tag: Add a tag to a contact/camper
    - webhook: Call an external URL
    - enroll_in_workflow: Trigger another workflow
    """

    __tablename__ = "workflows"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="draft"
    )  # draft, active, paused, archived
    trigger: Mapped[dict] = mapped_column(JSONB, default=dict)
    steps: Mapped[dict] = mapped_column(JSONB, default=list)
    # Enrollment settings
    enrollment_type: Mapped[str] = mapped_column(
        String(20), default="automatic"
    )  # automatic, manual
    re_enrollment: Mapped[bool] = mapped_column(Boolean, default=False)
    # Stats
    total_enrolled: Mapped[int] = mapped_column(Integer, default=0)
    total_completed: Mapped[int] = mapped_column(Integer, default=0)
    # Metadata
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    executions = relationship("WorkflowExecution", back_populates="workflow")


class WorkflowExecution(Base):
    """
    A running instance of a workflow for a specific entity.
    Tracks current step, status, and execution context.
    """

    __tablename__ = "workflow_executions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id"),
        index=True,
    )
    # The entity this execution is for
    entity_type: Mapped[str] = mapped_column(String(50))  # contact, camper, registration
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    # Execution state
    status: Mapped[str] = mapped_column(
        String(20), default="running"
    )  # running, completed, failed, cancelled, paused
    current_step_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    context: Mapped[dict] = mapped_column(
        JSONB, default=dict
    )  # Runtime variables available to steps
    # Timing
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    next_step_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )  # For delayed steps
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
    logs = relationship("WorkflowExecutionLog", back_populates="execution")


class WorkflowExecutionLog(Base):
    """
    Detailed log of each step executed in a workflow run.
    """

    __tablename__ = "workflow_execution_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    execution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_executions.id"),
        index=True,
    )
    step_id: Mapped[str] = mapped_column(String(100))
    step_type: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(
        String(20), default="success"
    )  # success, failed, skipped
    input_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    output_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    execution = relationship("WorkflowExecution", back_populates="logs")


class ContactAssociation(Base):
    """
    Tracks relationships between contacts (parent/child, siblings, spouse, etc.)
    """

    __tablename__ = "contact_associations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
    )
    contact_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id"),
        index=True,
    )
    related_contact_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id"),
        index=True,
    )
    relationship_type: Mapped[str] = mapped_column(
        String(50)
    )  # parent, child, sibling, spouse, guardian, grandparent, other
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
