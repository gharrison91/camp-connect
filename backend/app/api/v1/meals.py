"""
Camp Connect - Meal Planning API Endpoints
Full CRUD for meals, meal plans, and dietary restrictions.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import require_permission
from app.schemas.meal import (
    DietaryRestrictionCreate,
    DietaryRestrictionResponse,
    MealCreate,
    MealPlanCreate,
    MealPlanResponse,
    MealResponse,
    MealUpdate,
)
from app.services import meal_service

router = APIRouter(prefix="/meals", tags=["Meals"])


# ---- Meal Endpoints ----


@router.get(
    "",
    response_model=List[MealResponse],
)
async def list_meals(
    date_from: Optional[date] = Query(default=None, description="Start date filter"),
    date_to: Optional[date] = Query(default=None, description="End date filter"),
    meal_type: Optional[str] = Query(
        default=None, description="Filter by meal type (breakfast, lunch, dinner, snack)"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """List all meals for the current organization with optional filters."""
    return await meal_service.get_meals(
        org_id=current_user["organization_id"],
        date_from=date_from,
        date_to=date_to,
        meal_type=meal_type,
    )


@router.post(
    "",
    response_model=MealResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_meal(
    body: MealCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """Create a new meal."""
    return await meal_service.create_meal(
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{meal_id}",
    response_model=MealResponse,
)
async def update_meal(
    meal_id: uuid.UUID,
    body: MealUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """Update an existing meal."""
    updated = await meal_service.update_meal(
        org_id=current_user["organization_id"],
        meal_id=meal_id,
        data=body.model_dump(exclude_unset=True),
    )
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found",
        )
    return updated


@router.delete(
    "/{meal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_meal(
    meal_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """Delete a meal."""
    deleted = await meal_service.delete_meal(
        org_id=current_user["organization_id"],
        meal_id=meal_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found",
        )


# ---- Meal Plan Endpoints ----


@router.get(
    "/plans",
    response_model=List[MealPlanResponse],
)
async def list_meal_plans(
    week_start: Optional[date] = Query(default=None, description="Filter by week start date"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """Get meal plans for the current organization."""
    return await meal_service.get_meal_plan(
        org_id=current_user["organization_id"],
        week_start=week_start,
    )


@router.post(
    "/plans",
    response_model=MealPlanResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_meal_plan(
    body: MealPlanCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """Create a new meal plan."""
    return await meal_service.create_meal_plan(
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


# ---- Dietary Restriction Endpoints ----


@router.get(
    "/dietary-restrictions",
    response_model=List[DietaryRestrictionResponse],
)
async def list_dietary_restrictions(
    camper_id: Optional[uuid.UUID] = Query(default=None, description="Filter by camper"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """List all dietary restrictions for the organization."""
    return await meal_service.get_dietary_restrictions(
        org_id=current_user["organization_id"],
        camper_id=camper_id,
    )


@router.post(
    "/dietary-restrictions",
    response_model=DietaryRestrictionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_dietary_restriction(
    body: DietaryRestrictionCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """Add a dietary restriction for a camper."""
    return await meal_service.create_dietary_restriction(
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


# ---- Allergen Check Endpoint ----


@router.get(
    "/allergen-check/{meal_id}",
)
async def check_allergen_conflicts(
    meal_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """Check for allergen conflicts between a meal and camper restrictions."""
    return await meal_service.check_allergen_conflicts(
        org_id=current_user["organization_id"],
        meal_id=meal_id,
    )


# ---- Stats Endpoint ----


@router.get(
    "/stats",
)
async def get_meal_stats(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.settings.manage")
    ),
):
    """Get meal planning statistics."""
    return await meal_service.get_meal_stats(
        org_id=current_user["organization_id"],
    )
