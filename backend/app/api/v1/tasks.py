"""
Camp Connect - Tasks API Router
REST endpoints for task assignments.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.tasks import (
    TaskCreate,
    TaskUpdate,
    TaskItem,
    TaskStats,
)
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])


# --- Helpers ---


def _org_id(user: Dict[str, Any]) -> str:
    return str(user["organization_id"])


def _user_id(user: Dict[str, Any]) -> str:
    return str(user["id"])


def _user_name(user: Dict[str, Any]) -> str:
    first = user.get("first_name") or ""
    last = user.get("last_name") or ""
    name = f"{first} {last}".strip()
    return name or user.get("email", "Unknown")


# --- GET /tasks/stats ---


@router.get("/stats", response_model=TaskStats)
async def task_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get task dashboard statistics."""
    return await task_service.get_stats(db, _org_id(current_user))


# --- GET /tasks ---


@router.get("", response_model=List[TaskItem])
async def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List task assignments with optional filters."""
    return await task_service.get_tasks(
        db,
        _org_id(current_user),
        status=status_filter,
        priority=priority,
        category=category,
        assigned_to=assigned_to,
        search=search,
    )


# --- POST /tasks ---


@router.post("", response_model=TaskItem, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task assignment."""
    return await task_service.create_task(
        db,
        _org_id(current_user),
        data=body.model_dump(),
        assigned_by=_user_name(current_user),
    )


# --- GET /tasks/{id} ---


@router.get("/{task_id}", response_model=TaskItem)
async def get_task(
    task_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single task assignment."""
    task = await task_service.get_task(db, _org_id(current_user), task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# --- PUT /tasks/{id} ---


@router.put("/{task_id}", response_model=TaskItem)
async def update_task(
    task_id: str,
    body: TaskUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a task assignment."""
    updated = await task_service.update_task(
        db,
        _org_id(current_user),
        task_id,
        data=body.model_dump(exclude_unset=True),
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated


# --- POST /tasks/{id}/complete ---


@router.post("/{task_id}/complete", response_model=TaskItem)
async def complete_task(
    task_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a task as completed."""
    updated = await task_service.update_task(
        db,
        _org_id(current_user),
        task_id,
        data={"status": "completed"},
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated


# --- DELETE /tasks/{id} ---


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task assignment."""
    deleted = await task_service.delete_task(db, _org_id(current_user), task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
