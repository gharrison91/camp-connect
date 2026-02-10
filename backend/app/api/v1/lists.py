"""
Camp Connect - Saved Lists API Endpoints
CRUD for saved lists/segments and member management.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.saved_list import SavedList, SavedListMember
from app.models.contact import Contact
from app.models.camper import Camper
from app.schemas.saved_list import (
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
