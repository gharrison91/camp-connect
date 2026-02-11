"""
Camp Connect - Skill Tracking API Endpoints
CRUD for skill categories, skills, evaluations, and progress tracking.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.skill_tracking import (
    SkillCategoryCreate,
    SkillCategoryResponse,
    SkillCategoryUpdate,
    SkillCreate,
    SkillResponse,
    SkillUpdate,
    EvaluateRequest,
    CamperSkillProgressResponse,
    SkillLeaderboardEntry,
    CategoryStatsResponse,
)
from app.services import skill_tracking_service

router = APIRouter(prefix="/skill-tracking", tags=["Skill Tracking"])


# ---- Categories ----

@router.get("/categories", response_model=List[SkillCategoryResponse])
async def list_categories(
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all skill categories for the organization."""
    return await skill_tracking_service.list_categories(
        current_user["organization_id"],
    )


@router.post(
    "/categories",
    response_model=SkillCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    body: SkillCategoryCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new skill category."""
    return await skill_tracking_service.create_category(
        current_user["organization_id"],
        body.model_dump(),
    )


@router.put("/categories/{category_id}", response_model=SkillCategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    body: SkillCategoryUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update a skill category."""
    result = await skill_tracking_service.update_category(
        current_user["organization_id"],
        category_id,
        body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return result


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.delete")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a skill category and all its skills."""
    deleted = await skill_tracking_service.delete_category(
        current_user["organization_id"], category_id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")


# ---- Skills ----

@router.get("/skills", response_model=List[SkillResponse])
async def list_skills(
    category_id: Optional[uuid.UUID] = Query(default=None),
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all skills, optionally filtered by category."""
    return await skill_tracking_service.list_skills(
        current_user["organization_id"], category_id
    )


@router.post(
    "/skills",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_skill(
    body: SkillCreate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new skill within a category."""
    data = body.model_dump()
    # Convert SkillLevel models to dicts
    if "levels" in data and data["levels"]:
        data["levels"] = [
            lv if isinstance(lv, dict) else lv
            for lv in data["levels"]
        ]
    return await skill_tracking_service.create_skill(
        current_user["organization_id"], data
    )


@router.put("/skills/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: uuid.UUID,
    body: SkillUpdate,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update a skill definition."""
    result = await skill_tracking_service.update_skill(
        current_user["organization_id"],
        skill_id,
        body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return result


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.delete")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a skill."""
    deleted = await skill_tracking_service.delete_skill(
        current_user["organization_id"], skill_id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Skill not found")


# ---- Evaluations ----

@router.post("/evaluate", response_model=CamperSkillProgressResponse)
async def evaluate_camper(
    body: EvaluateRequest,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.update")),
    db: AsyncSession = Depends(get_db),
):
    """Record a skill evaluation for a camper."""
    return await skill_tracking_service.evaluate_camper(
        current_user["organization_id"], body.model_dump()
    )


# ---- Progress ----

@router.get(
    "/progress/{camper_id}",
    response_model=List[CamperSkillProgressResponse],
)
async def get_camper_progress(
    camper_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all skill progress for a specific camper."""
    return await skill_tracking_service.get_camper_progress(
        current_user["organization_id"], camper_id
    )


# ---- Leaderboard ----

@router.get("/leaderboard", response_model=List[SkillLeaderboardEntry])
async def get_leaderboard(
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get skill leaderboard across all campers."""
    return await skill_tracking_service.get_skill_leaderboard(
        current_user["organization_id"]
    )


# ---- Stats ----

@router.get("/stats", response_model=List[CategoryStatsResponse])
async def get_stats(
    current_user: Dict[str, Any] = Depends(require_permission("core.activities.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated statistics by skill category."""
    return await skill_tracking_service.get_category_stats(
        current_user["organization_id"]
    )
