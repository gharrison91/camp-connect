"""
Camp Connect - Emergency API Router
REST endpoints for emergency action plans & drills.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.schemas.emergency import (
    EmergencyPlanCreate,
    EmergencyPlanUpdate,
    EmergencyPlanResponse,
    DrillRecordCreate,
    DrillRecordUpdate,
    DrillRecordResponse,
    EmergencyStats,
)
from app.services import emergency_service

router = APIRouter(prefix="/emergency", tags=["Emergency"])


def _org_id(user: Dict[str, Any]) -> str:
    return str(user["organization_id"])


# ---- Stats ----

@router.get("/stats", response_model=EmergencyStats)
async def emergency_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get emergency dashboard statistics."""
    return await emergency_service.get_plan_stats(_org_id(current_user))


# ---- Plans ----

@router.get("/plans", response_model=List[EmergencyPlanResponse])
async def list_plans(
    status_filter: Optional[str] = Query(None, alias="status"),
    plan_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List emergency action plans."""
    return await emergency_service.list_plans(
        _org_id(current_user),
        status=status_filter,
        plan_type=plan_type,
        search=search,
    )


@router.get("/plans/overdue-reviews", response_model=List[EmergencyPlanResponse])
async def overdue_reviews(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get plans with overdue reviews."""
    return await emergency_service.get_overdue_reviews(_org_id(current_user))


@router.get("/plans/{plan_id}", response_model=EmergencyPlanResponse)
async def get_plan(
    plan_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single emergency plan."""
    plan = await emergency_service.get_plan(_org_id(current_user), plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.post("/plans", response_model=EmergencyPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    body: EmergencyPlanCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new emergency action plan."""
    return await emergency_service.create_plan(
        _org_id(current_user),
        data=body.model_dump(),
    )


@router.put("/plans/{plan_id}", response_model=EmergencyPlanResponse)
async def update_plan(
    plan_id: str,
    body: EmergencyPlanUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an emergency action plan."""
    updated = await emergency_service.update_plan(
        _org_id(current_user),
        plan_id,
        data=body.model_dump(exclude_unset=True),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Plan not found")
    return updated


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an emergency action plan."""
    deleted = await emergency_service.delete_plan(_org_id(current_user), plan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Plan not found")


# ---- Drills ----

@router.get("/drills", response_model=List[DrillRecordResponse])
async def list_drills(
    status_filter: Optional[str] = Query(None, alias="status"),
    plan_id: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List drill records."""
    return await emergency_service.list_drills(
        _org_id(current_user),
        status=status_filter,
        plan_id=plan_id,
    )


@router.get("/drills/upcoming", response_model=List[DrillRecordResponse])
async def upcoming_drills(
    limit: int = Query(10, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get upcoming scheduled drills."""
    return await emergency_service.get_upcoming_drills(_org_id(current_user), limit)


@router.get("/drills/history", response_model=List[DrillRecordResponse])
async def drill_history(
    limit: int = Query(50, ge=1, le=200),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get completed drill history."""
    return await emergency_service.get_drill_history(_org_id(current_user), limit)


@router.get("/drills/{drill_id}", response_model=DrillRecordResponse)
async def get_drill(
    drill_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single drill record."""
    drill = await emergency_service.get_drill(_org_id(current_user), drill_id)
    if not drill:
        raise HTTPException(status_code=404, detail="Drill not found")
    return drill


@router.post("/drills", response_model=DrillRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_drill(
    body: DrillRecordCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new drill record."""
    return await emergency_service.create_drill(
        _org_id(current_user),
        data=body.model_dump(),
    )


@router.put("/drills/{drill_id}", response_model=DrillRecordResponse)
async def update_drill(
    drill_id: str,
    body: DrillRecordUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a drill record."""
    updated = await emergency_service.update_drill(
        _org_id(current_user),
        drill_id,
        data=body.model_dump(exclude_unset=True),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Drill not found")
    return updated


@router.delete("/drills/{drill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_drill(
    drill_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a drill record."""
    deleted = await emergency_service.delete_drill(_org_id(current_user), drill_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Drill not found")
