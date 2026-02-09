"""
Camp Connect - Health Form Service
Business logic for health form templates, form assignments, submissions, and reviews.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.camper import Camper
from app.models.event import Event
from app.models.health_form import (
    HealthForm,
    HealthFormSubmission,
    HealthFormTemplate,
)


# ─── Template Functions ────────────────────────────────────────


async def list_templates(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List health form templates with optional filters."""
    query = (
        select(HealthFormTemplate)
        .where(HealthFormTemplate.organization_id == organization_id)
        .where(HealthFormTemplate.deleted_at.is_(None))
    )

    if category:
        query = query.where(HealthFormTemplate.category == category)
    if search:
        query = query.where(
            HealthFormTemplate.name.ilike(f"%{search}%")
        )

    query = query.order_by(HealthFormTemplate.created_at.desc())
    result = await db.execute(query)
    templates = result.scalars().all()

    return [_template_to_dict(t) for t in templates]


async def get_template(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    template_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single template by ID."""
    result = await db.execute(
        select(HealthFormTemplate)
        .where(HealthFormTemplate.id == template_id)
        .where(HealthFormTemplate.organization_id == organization_id)
        .where(HealthFormTemplate.deleted_at.is_(None))
    )
    template = result.scalar_one_or_none()
    if template is None:
        return None
    return _template_to_dict(template)


async def create_template(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new health form template."""
    # Convert field definitions to dicts if they are pydantic models
    fields_data = data.get("fields", [])
    fields_serialized = [
        f.model_dump() if hasattr(f, "model_dump") else f
        for f in fields_data
    ]

    template = HealthFormTemplate(
        id=uuid.uuid4(),
        organization_id=organization_id,
        name=data["name"],
        description=data.get("description"),
        category=data.get("category", "health"),
        fields=fields_serialized,
        is_system=False,
        is_active=True,
        version=1,
        required_for_registration=data.get("required_for_registration", False),
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)

    return _template_to_dict(template)


async def update_template(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    template_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing template."""
    result = await db.execute(
        select(HealthFormTemplate)
        .where(HealthFormTemplate.id == template_id)
        .where(HealthFormTemplate.organization_id == organization_id)
        .where(HealthFormTemplate.deleted_at.is_(None))
    )
    template = result.scalar_one_or_none()
    if template is None:
        return None

    for key, value in data.items():
        if key == "fields" and value is not None:
            # Serialize pydantic models in fields
            serialized = [
                f.model_dump() if hasattr(f, "model_dump") else f
                for f in value
            ]
            setattr(template, key, serialized)
            # Increment version when fields change
            template.version += 1
        else:
            setattr(template, key, value)

    await db.commit()
    await db.refresh(template)
    return _template_to_dict(template)


async def delete_template(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    template_id: uuid.UUID,
) -> bool:
    """Soft-delete a template. System templates cannot be deleted."""
    result = await db.execute(
        select(HealthFormTemplate)
        .where(HealthFormTemplate.id == template_id)
        .where(HealthFormTemplate.organization_id == organization_id)
        .where(HealthFormTemplate.deleted_at.is_(None))
    )
    template = result.scalar_one_or_none()
    if template is None:
        return False

    if template.is_system:
        raise ValueError("System templates cannot be deleted")

    template.is_deleted = True
    template.deleted_at = datetime.utcnow()
    await db.commit()
    return True


# ─── Form Instance Functions ──────────────────────────────────


async def assign_form(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Assign a form template to a camper."""
    template_id = data["template_id"]
    camper_id = data["camper_id"]
    event_id = data.get("event_id")
    due_date = data.get("due_date")

    # Verify template exists
    template_result = await db.execute(
        select(HealthFormTemplate)
        .where(HealthFormTemplate.id == template_id)
        .where(HealthFormTemplate.organization_id == organization_id)
        .where(HealthFormTemplate.deleted_at.is_(None))
    )
    template = template_result.scalar_one_or_none()
    if template is None:
        raise ValueError("Template not found")

    # Verify camper exists
    camper_result = await db.execute(
        select(Camper)
        .where(Camper.id == camper_id)
        .where(Camper.organization_id == organization_id)
        .where(Camper.deleted_at.is_(None))
    )
    camper = camper_result.scalar_one_or_none()
    if camper is None:
        raise ValueError("Camper not found")

    # Verify event exists (if provided)
    event = None
    if event_id:
        event_result = await db.execute(
            select(Event)
            .where(Event.id == event_id)
            .where(Event.organization_id == organization_id)
            .where(Event.deleted_at.is_(None))
        )
        event = event_result.scalar_one_or_none()
        if event is None:
            raise ValueError("Event not found")

    form = HealthForm(
        id=uuid.uuid4(),
        organization_id=organization_id,
        template_id=template_id,
        camper_id=camper_id,
        event_id=event_id,
        status="pending",
        due_date=due_date,
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)

    return _form_to_dict(form, template, camper, event)


async def list_forms(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    camper_id: Optional[uuid.UUID] = None,
    event_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List health forms with optional filters."""
    query = (
        select(HealthForm)
        .options(
            selectinload(HealthForm.template),
            selectinload(HealthForm.camper),
            selectinload(HealthForm.event),
        )
        .where(HealthForm.organization_id == organization_id)
        .where(HealthForm.deleted_at.is_(None))
    )

    if camper_id:
        query = query.where(HealthForm.camper_id == camper_id)
    if event_id:
        query = query.where(HealthForm.event_id == event_id)
    if status:
        query = query.where(HealthForm.status == status)

    query = query.order_by(HealthForm.created_at.desc())
    result = await db.execute(query)
    forms = result.scalars().all()

    return [
        _form_to_dict(f, f.template, f.camper, f.event)
        for f in forms
    ]


async def get_form(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    form_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single form with its template fields."""
    result = await db.execute(
        select(HealthForm)
        .options(
            selectinload(HealthForm.template),
            selectinload(HealthForm.camper),
            selectinload(HealthForm.event),
        )
        .where(HealthForm.id == form_id)
        .where(HealthForm.organization_id == organization_id)
        .where(HealthForm.deleted_at.is_(None))
    )
    form = result.scalar_one_or_none()
    if form is None:
        return None

    form_dict = _form_to_dict(form, form.template, form.camper, form.event)
    # Include template fields for rendering
    form_dict["fields"] = form.template.fields if form.template else []
    return form_dict


async def submit_form(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    form_id: uuid.UUID,
    data: Dict[str, Any],
    submitted_by: Optional[uuid.UUID] = None,
    ip_address: Optional[str] = None,
) -> Dict[str, Any]:
    """Submit form data for a health form."""
    # Get the form
    result = await db.execute(
        select(HealthForm)
        .options(
            selectinload(HealthForm.template),
            selectinload(HealthForm.camper),
            selectinload(HealthForm.event),
        )
        .where(HealthForm.id == form_id)
        .where(HealthForm.organization_id == organization_id)
        .where(HealthForm.deleted_at.is_(None))
    )
    form = result.scalar_one_or_none()
    if form is None:
        raise ValueError("Form not found")

    if form.status not in ("pending", "rejected"):
        raise ValueError(
            f"Form cannot be submitted in '{form.status}' status. "
            f"Only 'pending' or 'rejected' forms can be submitted."
        )

    form_data = data.get("data", {})
    signature = data.get("signature")

    # Create or update submission
    existing_sub = await db.execute(
        select(HealthFormSubmission)
        .where(HealthFormSubmission.form_id == form_id)
        .where(HealthFormSubmission.organization_id == organization_id)
    )
    submission = existing_sub.scalar_one_or_none()

    now = datetime.utcnow()

    if submission:
        submission.data = form_data
        submission.signature = signature
        submission.signed_at = now if signature else None
        submission.submitted_by = submitted_by
        submission.ip_address = ip_address
    else:
        submission = HealthFormSubmission(
            id=uuid.uuid4(),
            organization_id=organization_id,
            form_id=form_id,
            submitted_by=submitted_by,
            data=form_data,
            signature=signature,
            signed_at=now if signature else None,
            ip_address=ip_address,
        )
        db.add(submission)

    # Update form status
    form.status = "submitted"
    form.submitted_at = now

    await db.commit()
    await db.refresh(submission)

    return {
        "id": submission.id,
        "form_id": submission.form_id,
        "data": submission.data,
        "signature": submission.signature,
        "signed_at": submission.signed_at,
        "created_at": submission.created_at,
    }


async def review_form(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    form_id: uuid.UUID,
    reviewer_id: uuid.UUID,
    status: str,
    notes: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Approve or reject a submitted form."""
    result = await db.execute(
        select(HealthForm)
        .options(
            selectinload(HealthForm.template),
            selectinload(HealthForm.camper),
            selectinload(HealthForm.event),
        )
        .where(HealthForm.id == form_id)
        .where(HealthForm.organization_id == organization_id)
        .where(HealthForm.deleted_at.is_(None))
    )
    form = result.scalar_one_or_none()
    if form is None:
        return None

    if form.status != "submitted":
        raise ValueError(
            f"Only submitted forms can be reviewed. Current status: '{form.status}'"
        )

    if status not in ("approved", "rejected"):
        raise ValueError("Review status must be 'approved' or 'rejected'")

    form.status = status
    form.reviewed_by = reviewer_id
    form.reviewed_at = datetime.utcnow()
    form.review_notes = notes

    await db.commit()
    await db.refresh(form)

    return _form_to_dict(form, form.template, form.camper, form.event)


async def get_submission(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    form_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get the submission data for a form."""
    result = await db.execute(
        select(HealthFormSubmission)
        .where(HealthFormSubmission.form_id == form_id)
        .where(HealthFormSubmission.organization_id == organization_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        return None

    return {
        "id": submission.id,
        "form_id": submission.form_id,
        "data": submission.data,
        "signature": submission.signature,
        "signed_at": submission.signed_at,
        "created_at": submission.created_at,
    }


# ─── Default Template Seeding ─────────────────────────────────


async def seed_default_templates(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """
    Create default health form templates for a new organization.
    Returns the created templates.
    """
    # Check if templates already exist
    existing = await db.execute(
        select(sqlfunc.count(HealthFormTemplate.id))
        .where(HealthFormTemplate.organization_id == organization_id)
        .where(HealthFormTemplate.is_system == True)
        .where(HealthFormTemplate.deleted_at.is_(None))
    )
    if existing.scalar() > 0:
        # Already seeded
        return []

    templates_data = _get_default_templates()
    created = []

    for tpl_data in templates_data:
        template = HealthFormTemplate(
            id=uuid.uuid4(),
            organization_id=organization_id,
            name=tpl_data["name"],
            description=tpl_data["description"],
            category=tpl_data["category"],
            fields=tpl_data["fields"],
            is_system=True,
            is_active=True,
            version=1,
            required_for_registration=tpl_data.get("required_for_registration", False),
        )
        db.add(template)
        created.append(template)

    await db.commit()

    for t in created:
        await db.refresh(t)

    return [_template_to_dict(t) for t in created]


# ─── Internal Helpers ──────────────────────────────────────────


def _template_to_dict(template: HealthFormTemplate) -> Dict[str, Any]:
    """Convert a template model to a response dict."""
    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "category": template.category,
        "fields": template.fields or [],
        "is_system": template.is_system,
        "is_active": template.is_active,
        "version": template.version,
        "required_for_registration": template.required_for_registration,
        "created_at": template.created_at,
    }


def _form_to_dict(
    form: HealthForm,
    template: Optional[HealthFormTemplate] = None,
    camper: Optional[Camper] = None,
    event: Optional[Event] = None,
) -> Dict[str, Any]:
    """Convert a form model to a response dict."""
    return {
        "id": form.id,
        "template_id": form.template_id,
        "template_name": template.name if template else "",
        "template_category": template.category if template else "",
        "camper_id": form.camper_id,
        "camper_name": (
            f"{camper.first_name} {camper.last_name}" if camper else ""
        ),
        "event_id": form.event_id,
        "event_name": event.name if event else None,
        "status": form.status,
        "due_date": form.due_date,
        "submitted_at": form.submitted_at,
        "reviewed_by": form.reviewed_by,
        "reviewed_at": form.reviewed_at,
        "review_notes": form.review_notes,
        "created_at": form.created_at,
    }


def _get_default_templates() -> List[Dict[str, Any]]:
    """Return the default template definitions."""
    return [
        {
            "name": "General Health Information",
            "description": "Comprehensive health and medical information form for campers including medical history, allergies, medications, and emergency authorizations.",
            "category": "health",
            "required_for_registration": True,
            "fields": [
                # ── Camper Information ──
                {
                    "id": "physician_name",
                    "type": "text",
                    "label": "Primary Physician Name",
                    "required": True,
                    "order": 1,
                    "section": "Camper Information",
                },
                {
                    "id": "physician_phone",
                    "type": "text",
                    "label": "Physician Phone",
                    "required": True,
                    "order": 2,
                    "section": "Camper Information",
                },
                {
                    "id": "insurance_provider",
                    "type": "text",
                    "label": "Insurance Provider",
                    "required": False,
                    "order": 3,
                    "section": "Camper Information",
                },
                {
                    "id": "insurance_policy_number",
                    "type": "text",
                    "label": "Insurance Policy Number",
                    "required": False,
                    "order": 4,
                    "section": "Camper Information",
                },
                # ── Medical History ──
                {
                    "id": "has_chronic_conditions",
                    "type": "radio",
                    "label": "Does the camper have any chronic conditions?",
                    "required": True,
                    "options": ["Yes", "No"],
                    "order": 5,
                    "section": "Medical History",
                },
                {
                    "id": "chronic_conditions_details",
                    "type": "textarea",
                    "label": "If yes, please describe",
                    "required": False,
                    "order": 6,
                    "section": "Medical History",
                    "conditional": {"field_id": "has_chronic_conditions", "value": "Yes"},
                },
                {
                    "id": "has_surgeries",
                    "type": "radio",
                    "label": "Has the camper had any surgeries?",
                    "required": False,
                    "options": ["Yes", "No"],
                    "order": 7,
                    "section": "Medical History",
                },
                {
                    "id": "surgeries_details",
                    "type": "textarea",
                    "label": "If yes, please describe",
                    "required": False,
                    "order": 8,
                    "section": "Medical History",
                    "conditional": {"field_id": "has_surgeries", "value": "Yes"},
                },
                {
                    "id": "last_physical_exam",
                    "type": "date",
                    "label": "Date of last physical exam",
                    "required": False,
                    "order": 9,
                    "section": "Medical History",
                },
                # ── Allergies ──
                {
                    "id": "has_allergies",
                    "type": "radio",
                    "label": "Does the camper have any allergies?",
                    "required": True,
                    "options": ["Yes", "No"],
                    "order": 10,
                    "section": "Allergies",
                },
                {
                    "id": "food_allergies",
                    "type": "multiselect",
                    "label": "Food allergies",
                    "required": False,
                    "options": [
                        "Peanuts",
                        "Tree Nuts",
                        "Dairy",
                        "Eggs",
                        "Shellfish",
                        "Gluten",
                        "Soy",
                        "Other",
                    ],
                    "order": 11,
                    "section": "Allergies",
                    "conditional": {"field_id": "has_allergies", "value": "Yes"},
                },
                {
                    "id": "environmental_allergies",
                    "type": "multiselect",
                    "label": "Environmental allergies",
                    "required": False,
                    "options": [
                        "Bee Stings",
                        "Pollen",
                        "Dust",
                        "Mold",
                        "Other",
                    ],
                    "order": 12,
                    "section": "Allergies",
                    "conditional": {"field_id": "has_allergies", "value": "Yes"},
                },
                {
                    "id": "medication_allergies",
                    "type": "textarea",
                    "label": "Medication allergies",
                    "required": False,
                    "order": 13,
                    "section": "Allergies",
                    "conditional": {"field_id": "has_allergies", "value": "Yes"},
                },
                {
                    "id": "allergy_action_plan",
                    "type": "textarea",
                    "label": "Allergy action plan details",
                    "required": False,
                    "order": 14,
                    "section": "Allergies",
                    "conditional": {"field_id": "has_allergies", "value": "Yes"},
                },
                # ── Medications ──
                {
                    "id": "takes_medications",
                    "type": "radio",
                    "label": "Does the camper take any medications?",
                    "required": True,
                    "options": ["Yes", "No"],
                    "order": 15,
                    "section": "Medications",
                },
                {
                    "id": "medication_list",
                    "type": "textarea",
                    "label": "Medication list with dosage and schedule",
                    "required": False,
                    "order": 16,
                    "section": "Medications",
                    "conditional": {"field_id": "takes_medications", "value": "Yes"},
                },
                {
                    "id": "can_self_administer",
                    "type": "radio",
                    "label": "Can the camper self-administer medications?",
                    "required": False,
                    "options": ["Yes", "No"],
                    "order": 17,
                    "section": "Medications",
                    "conditional": {"field_id": "takes_medications", "value": "Yes"},
                },
                # ── Dietary Restrictions ──
                {
                    "id": "dietary_restrictions",
                    "type": "multiselect",
                    "label": "Any dietary restrictions?",
                    "required": False,
                    "options": [
                        "Vegetarian",
                        "Vegan",
                        "Kosher",
                        "Halal",
                        "Gluten-Free",
                        "Dairy-Free",
                        "None",
                    ],
                    "order": 18,
                    "section": "Dietary Restrictions",
                },
                {
                    "id": "dietary_notes",
                    "type": "textarea",
                    "label": "Other dietary notes",
                    "required": False,
                    "order": 19,
                    "section": "Dietary Restrictions",
                },
                # ── Authorization ──
                {
                    "id": "authorize_first_aid",
                    "type": "checkbox",
                    "label": "I authorize camp staff to provide first aid",
                    "required": True,
                    "order": 20,
                    "section": "Authorization",
                },
                {
                    "id": "authorize_emergency_treatment",
                    "type": "checkbox",
                    "label": "I authorize emergency medical treatment if I cannot be reached",
                    "required": True,
                    "order": 21,
                    "section": "Authorization",
                },
                {
                    "id": "parent_signature",
                    "type": "signature",
                    "label": "Parent/Guardian Signature",
                    "required": True,
                    "order": 22,
                    "section": "Authorization",
                },
            ],
        },
        {
            "name": "Emergency Contact & Pickup Authorization",
            "description": "Emergency contact information and authorized pickup persons for camper safety.",
            "category": "emergency",
            "required_for_registration": True,
            "fields": [
                # ── Emergency Contact 1 ──
                {
                    "id": "emergency_1_name",
                    "type": "text",
                    "label": "Name",
                    "required": True,
                    "order": 1,
                    "section": "Emergency Contact 1",
                },
                {
                    "id": "emergency_1_relationship",
                    "type": "text",
                    "label": "Relationship",
                    "required": True,
                    "order": 2,
                    "section": "Emergency Contact 1",
                },
                {
                    "id": "emergency_1_phone",
                    "type": "text",
                    "label": "Phone",
                    "required": True,
                    "order": 3,
                    "section": "Emergency Contact 1",
                },
                {
                    "id": "emergency_1_email",
                    "type": "text",
                    "label": "Email",
                    "required": False,
                    "order": 4,
                    "section": "Emergency Contact 1",
                },
                # ── Emergency Contact 2 ──
                {
                    "id": "emergency_2_name",
                    "type": "text",
                    "label": "Name",
                    "required": True,
                    "order": 5,
                    "section": "Emergency Contact 2",
                },
                {
                    "id": "emergency_2_relationship",
                    "type": "text",
                    "label": "Relationship",
                    "required": True,
                    "order": 6,
                    "section": "Emergency Contact 2",
                },
                {
                    "id": "emergency_2_phone",
                    "type": "text",
                    "label": "Phone",
                    "required": True,
                    "order": 7,
                    "section": "Emergency Contact 2",
                },
                # ── Authorized Pickup ──
                {
                    "id": "authorized_pickup_list",
                    "type": "textarea",
                    "label": "List all people authorized to pick up camper",
                    "description": "Include full name and relationship for each person",
                    "required": True,
                    "order": 8,
                    "section": "Authorized Pickup",
                },
                {
                    "id": "has_unauthorized_persons",
                    "type": "radio",
                    "label": "Are there any individuals NOT authorized for pickup?",
                    "required": False,
                    "options": ["Yes", "No"],
                    "order": 9,
                    "section": "Authorized Pickup",
                },
                {
                    "id": "unauthorized_persons_details",
                    "type": "textarea",
                    "label": "If yes, provide details",
                    "required": False,
                    "order": 10,
                    "section": "Authorized Pickup",
                    "conditional": {
                        "field_id": "has_unauthorized_persons",
                        "value": "Yes",
                    },
                },
                # ── Authorization ──
                {
                    "id": "emergency_signature",
                    "type": "signature",
                    "label": "Signature",
                    "required": True,
                    "order": 11,
                    "section": "Authorization",
                },
            ],
        },
    ]
