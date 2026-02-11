"""
Camp Connect - Saved Lists API Endpoints
CRUD for saved lists/segments and member management.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Boolean as SABoolean, Date as SADate, DateTime as SADateTime
from sqlalchemy import Integer as SAInteger, Numeric as SANumeric
from sqlalchemy import String as SAString, and_, cast, func, inspect, or_, select
from sqlalchemy.dialects.postgresql import JSONB as SAJSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.saved_list import SavedList, SavedListMember
from app.models.contact import Contact
from app.models.camper import Camper
from app.schemas.saved_list import (
    FilterCriteria,
    PreviewRequest,
    PreviewResponse,
    PreviewResultItem,
    SavedListCreate,
    SavedListDetailResponse,
    SavedListMemberCreate,
    SavedListMemberResponse,
    SavedListResponse,
    SavedListUpdate,
)

router = APIRouter(prefix="/lists", tags=["Saved Lists"])


async def _resolve_entity(
    db: AsyncSession, entity_type: str, entity_id: uuid.UUID
) -> tuple[Optional[str], Optional[str]]:
    """Resolve entity name and email from entity_type + entity_id."""
    if entity_type == "contact":
        result = await db.execute(
            select(Contact.first_name, Contact.last_name, Contact.email)
            .where(Contact.id == entity_id)
        )
        row = result.one_or_none()
        if row:
            return f"{row[0]} {row[1]}", row[2]
    elif entity_type == "camper":
        result = await db.execute(
            select(Camper.first_name, Camper.last_name)
            .where(Camper.id == entity_id)
        )
        row = result.one_or_none()
        if row:
            return f"{row[0]} {row[1]}", None
    return None, None


# ─── Fields excluded from filtering (internal fields) ────────
EXCLUDED_FIELDS = {
    "id", "organization_id", "deleted_at", "is_deleted",
    "user_id", "portal_token", "reference_photo_url",
}


def _snake_to_title(name: str) -> str:
    """Convert snake_case to Title Case (e.g. 'first_name' -> 'First Name')."""
    return " ".join(word.capitalize() for word in name.split("_"))


def _col_type_to_field_type(col_type) -> str:
    """Map a SQLAlchemy column type to a filter field type string."""
    if isinstance(col_type, (SADate, SADateTime)):
        return "date"
    if isinstance(col_type, (SAInteger, SANumeric)):
        return "number"
    if isinstance(col_type, SABoolean):
        return "boolean"
    # JSONB, String, and everything else -> "string"
    return "string"


def _get_filterable_fields_for_model(model) -> list[dict]:
    """Introspect a SQLAlchemy model and return filterable field definitions."""
    mapper = inspect(model)
    fields = []
    for attr in mapper.column_attrs:
        col_name = attr.key
        if col_name in EXCLUDED_FIELDS:
            continue
        col = attr.columns[0]
        field_type = _col_type_to_field_type(col.type)
        fields.append({
            "value": col_name,
            "label": _snake_to_title(col_name),
            "type": field_type,
        })
    return fields


# ─── Allowed filterable fields per entity type ────────────────

CONTACT_FIELDS = {
    "first_name", "last_name", "email", "phone", "address",
    "city", "state", "zip_code", "relationship_type",
    "notification_preferences", "account_status",
    "communication_preference", "family_id", "portal_access",
    "created_at", "updated_at",
}
CAMPER_FIELDS = {
    "first_name", "last_name", "date_of_birth", "gender",
    "grade", "school", "city", "state",
    "allergies", "dietary_restrictions", "custom_fields",
    "family_id", "created_at", "updated_at",
}


def _get_model_and_fields(entity_type: str):
    """Return the SQLAlchemy model and allowed field set for an entity type."""
    if entity_type == "camper":
        return Camper, CAMPER_FIELDS
    return Contact, CONTACT_FIELDS


def _build_filter_query(
    entity_type: str,
    criteria: FilterCriteria,
    organization_id: uuid.UUID,
):
    """
    Build a SQLAlchemy SELECT query from FilterCriteria.
    Returns (query, model) so callers can execute and interpret results.
    """
    model, allowed_fields = _get_model_and_fields(entity_type)

    base_query = (
        select(model)
        .where(model.organization_id == organization_id)
        .where(model.deleted_at.is_(None))
    )

    if not criteria.groups:
        return base_query, model

    group_conditions = []
    for group in criteria.groups:
        if not group.filters:
            continue
        filter_conditions = []
        for f in group.filters:
            if f.field not in allowed_fields:
                continue
            col = getattr(model, f.field, None)
            if col is None:
                continue

            cond = _build_single_condition(col, f.operator, f.value)
            if cond is not None:
                filter_conditions.append(cond)

        if filter_conditions:
            if group.operator.upper() == "OR":
                group_conditions.append(or_(*filter_conditions))
            else:
                group_conditions.append(and_(*filter_conditions))

    if group_conditions:
        if criteria.group_operator.upper() == "AND":
            base_query = base_query.where(and_(*group_conditions))
        else:
            base_query = base_query.where(or_(*group_conditions))

    return base_query, model


def _build_single_condition(col, operator: str, value):
    """Translate a single filter operator into a SQLAlchemy condition."""
    op = operator.lower()
    if op == "equals":
        return col == value
    elif op == "not_equals":
        return col != value
    elif op == "contains":
        return cast(col, SAString).ilike(f"%{value}%")
    elif op == "not_contains":
        return ~cast(col, SAString).ilike(f"%{value}%")
    elif op == "starts_with":
        return cast(col, SAString).ilike(f"{value}%")
    elif op == "greater_than":
        return col > value
    elif op == "less_than":
        return col < value
    elif op == "after":
        return col > value
    elif op == "before":
        return col < value
    elif op == "is_empty":
        return or_(col.is_(None), cast(col, SAString) == "")
    elif op == "is_not_empty":
        return and_(col.isnot(None), cast(col, SAString) != "")
    elif op == "in_list":
        if isinstance(value, list):
            return col.in_(value)
        return col.in_([v.strip() for v in str(value).split(",")])
    return None


async def _execute_preview(
    db: AsyncSession,
    entity_type: str,
    criteria: FilterCriteria,
    organization_id: uuid.UUID,
    limit: int = 100,
) -> PreviewResponse:
    """Run the filter and return a PreviewResponse."""
    query, model = _build_filter_query(entity_type, criteria, organization_id)

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Fetch rows (limited)
    rows_result = await db.execute(query.limit(limit))
    rows = rows_result.scalars().all()

    results = []
    for row in rows:
        name = f"{row.first_name} {row.last_name}"
        email = getattr(row, "email", None)
        extra_data: Dict[str, Any] = {}
        if entity_type == "camper":
            if row.grade:
                extra_data["grade"] = row.grade
            if row.gender:
                extra_data["gender"] = row.gender
        else:
            if row.city:
                extra_data["city"] = row.city
            if row.state:
                extra_data["state"] = row.state
        results.append(
            PreviewResultItem(
                id=row.id,
                name=name,
                email=email,
                extra=extra_data if extra_data else None,
            )
        )

    return PreviewResponse(
        total_count=total,
        results=results,
        entity_type=entity_type,
    )


# ─── Filterable Fields Endpoint ──────────────────────────────


@router.get("/filterable-fields")
async def get_filterable_fields(
    entity_type: str = Query(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return available filterable fields for an entity type, introspected from the model."""
    if entity_type == "camper":
        model = Camper
    elif entity_type == "contact":
        model = Contact
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported entity type: {entity_type}",
        )

    fields = _get_filterable_fields_for_model(model)
    return fields


# ─── Preview Endpoints ───────────────────────────────────────


@router.post("/preview", response_model=PreviewResponse)
async def preview_filter(
    body: PreviewRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Preview filter results without saving a list."""
    return await _execute_preview(
        db,
        body.entity_type,
        body.filter_criteria,
        current_user["organization_id"],
    )


@router.post("/{list_id}/preview", response_model=PreviewResponse)
async def preview_saved_list(
    list_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Execute the saved filter criteria of a dynamic list and return matches."""
    result = await db.execute(
        select(SavedList)
        .where(SavedList.id == list_id)
        .where(SavedList.organization_id == current_user["organization_id"])
        .where(SavedList.deleted_at.is_(None))
    )
    saved_list = result.scalar_one_or_none()
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")

    if saved_list.list_type != "dynamic":
        raise HTTPException(
            status_code=400,
            detail="Preview is only available for dynamic lists",
        )

    if not saved_list.filter_criteria:
        return PreviewResponse(
            total_count=0, results=[], entity_type=saved_list.entity_type
        )

    criteria = FilterCriteria(**saved_list.filter_criteria)
    preview = await _execute_preview(
        db,
        saved_list.entity_type,
        criteria,
        current_user["organization_id"],
    )

    # Update the stored member_count to reflect the dynamic count
    saved_list.member_count = preview.total_count
    await db.commit()

    return preview


@router.get("", response_model=List[SavedListResponse])
async def list_saved_lists(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all saved lists for the organization."""
    query = (
        select(SavedList)
        .where(SavedList.organization_id == current_user["organization_id"])
        .where(SavedList.deleted_at.is_(None))
        .order_by(SavedList.updated_at.desc())
    )
    result = await db.execute(query)
    lists = result.scalars().all()

    return [
        SavedListResponse(
            id=sl.id,
            name=sl.name,
            description=sl.description,
            list_type=sl.list_type,
            entity_type=sl.entity_type,
            filter_criteria=sl.filter_criteria,
            member_count=sl.member_count,
            created_by=sl.created_by,
            created_at=sl.created_at,
            updated_at=sl.updated_at,
        )
        for sl in lists
    ]


@router.post("", response_model=SavedListResponse, status_code=status.HTTP_201_CREATED)
async def create_saved_list(
    body: SavedListCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new saved list."""
    saved_list = SavedList(
        id=uuid.uuid4(),
        organization_id=current_user["organization_id"],
        name=body.name,
        description=body.description,
        list_type=body.list_type,
        entity_type=body.entity_type,
        filter_criteria=body.filter_criteria,
        created_by=current_user["id"],
    )
    db.add(saved_list)
    await db.commit()
    await db.refresh(saved_list)

    return SavedListResponse(
        id=saved_list.id,
        name=saved_list.name,
        description=saved_list.description,
        list_type=saved_list.list_type,
        entity_type=saved_list.entity_type,
        filter_criteria=saved_list.filter_criteria,
        member_count=0,
        created_by=saved_list.created_by,
        created_at=saved_list.created_at,
        updated_at=saved_list.updated_at,
    )


@router.get("/{list_id}", response_model=SavedListDetailResponse)
async def get_saved_list(
    list_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a saved list with members."""
    result = await db.execute(
        select(SavedList)
        .where(SavedList.id == list_id)
        .where(SavedList.organization_id == current_user["organization_id"])
        .where(SavedList.deleted_at.is_(None))
    )
    saved_list = result.scalar_one_or_none()
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")

    # Get members
    members_result = await db.execute(
        select(SavedListMember)
        .where(SavedListMember.list_id == list_id)
        .order_by(SavedListMember.added_at.desc())
    )
    members = members_result.scalars().all()

    member_responses = []
    for m in members:
        name, email = await _resolve_entity(db, m.entity_type, m.entity_id)
        member_responses.append(
            SavedListMemberResponse(
                id=m.id,
                list_id=m.list_id,
                entity_type=m.entity_type,
                entity_id=m.entity_id,
                entity_name=name,
                entity_email=email,
                added_at=m.added_at,
            )
        )

    return SavedListDetailResponse(
        id=saved_list.id,
        name=saved_list.name,
        description=saved_list.description,
        list_type=saved_list.list_type,
        entity_type=saved_list.entity_type,
        filter_criteria=saved_list.filter_criteria,
        member_count=saved_list.member_count,
        members=member_responses,
        created_by=saved_list.created_by,
        created_at=saved_list.created_at,
        updated_at=saved_list.updated_at,
    )


@router.put("/{list_id}", response_model=SavedListResponse)
async def update_saved_list(
    list_id: uuid.UUID,
    body: SavedListUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a saved list."""
    result = await db.execute(
        select(SavedList)
        .where(SavedList.id == list_id)
        .where(SavedList.organization_id == current_user["organization_id"])
        .where(SavedList.deleted_at.is_(None))
    )
    saved_list = result.scalar_one_or_none()
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(saved_list, key, value)

    await db.commit()
    await db.refresh(saved_list)

    return SavedListResponse(
        id=saved_list.id,
        name=saved_list.name,
        description=saved_list.description,
        list_type=saved_list.list_type,
        entity_type=saved_list.entity_type,
        filter_criteria=saved_list.filter_criteria,
        member_count=saved_list.member_count,
        created_by=saved_list.created_by,
        created_at=saved_list.created_at,
        updated_at=saved_list.updated_at,
    )


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_list(
    list_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a saved list."""
    result = await db.execute(
        select(SavedList)
        .where(SavedList.id == list_id)
        .where(SavedList.organization_id == current_user["organization_id"])
        .where(SavedList.deleted_at.is_(None))
    )
    saved_list = result.scalar_one_or_none()
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")
    saved_list.deleted_at = datetime.now(timezone.utc)
    await db.commit()


@router.post(
    "/{list_id}/members",
    response_model=SavedListMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_list_member(
    list_id: uuid.UUID,
    body: SavedListMemberCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to a static list."""
    result = await db.execute(
        select(SavedList)
        .where(SavedList.id == list_id)
        .where(SavedList.organization_id == current_user["organization_id"])
        .where(SavedList.deleted_at.is_(None))
    )
    saved_list = result.scalar_one_or_none()
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")

    if saved_list.list_type != "static":
        raise HTTPException(
            status_code=400,
            detail="Cannot manually add members to a dynamic list",
        )

    # Check for duplicate
    existing = await db.execute(
        select(SavedListMember)
        .where(SavedListMember.list_id == list_id)
        .where(SavedListMember.entity_id == body.entity_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Member already in list")

    member = SavedListMember(
        id=uuid.uuid4(),
        list_id=list_id,
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        added_by=current_user["id"],
    )
    db.add(member)
    saved_list.member_count = (saved_list.member_count or 0) + 1
    await db.commit()
    await db.refresh(member)

    name, email = await _resolve_entity(db, member.entity_type, member.entity_id)

    return SavedListMemberResponse(
        id=member.id,
        list_id=member.list_id,
        entity_type=member.entity_type,
        entity_id=member.entity_id,
        entity_name=name,
        entity_email=email,
        added_at=member.added_at,
    )


@router.delete(
    "/{list_id}/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_list_member(
    list_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from a static list."""
    result = await db.execute(
        select(SavedList)
        .where(SavedList.id == list_id)
        .where(SavedList.organization_id == current_user["organization_id"])
        .where(SavedList.deleted_at.is_(None))
    )
    saved_list = result.scalar_one_or_none()
    if not saved_list:
        raise HTTPException(status_code=404, detail="List not found")

    member_result = await db.execute(
        select(SavedListMember)
        .where(SavedListMember.id == member_id)
        .where(SavedListMember.list_id == list_id)
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)
    saved_list.member_count = max((saved_list.member_count or 0) - 1, 0)
    await db.commit()
