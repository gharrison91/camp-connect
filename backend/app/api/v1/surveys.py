"""
Camp Connect - Survey API Endpoints
Full CRUD for surveys, questions, responses, and stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.survey import (
    SurveyCreate,
    SurveyDetail,
    SurveyListItem,
    SurveyQuestionCreate,
    SurveyQuestionResponse,
    SurveyResponseCreate,
    SurveyResponseDetail,
    SurveyStats,
    SurveyUpdate,
)
from app.services import survey_service

router = APIRouter(prefix="/surveys", tags=["Surveys"])


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=SurveyStats,
)
async def get_survey_stats(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate survey statistics for the organization."""
    return await survey_service.get_stats(
        db,
        organization_id=current_user["organization_id"],
    )


# ---------------------------------------------------------------------------
# Survey CRUD
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=List[SurveyListItem],
)
async def list_surveys(
    search: Optional[str] = Query(default=None, description="Search by title"),
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by status (draft, active, closed)"
    ),
    target_audience: Optional[str] = Query(
        default=None, description="Filter by audience (parents, staff, campers, all)"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all surveys for the current organization."""
    return await survey_service.list_surveys(
        db,
        organization_id=current_user["organization_id"],
        status=status_filter,
        target_audience=target_audience,
        search=search,
    )


@router.get(
    "/{survey_id}",
    response_model=SurveyDetail,
)
async def get_survey(
    survey_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single survey by ID with its questions."""
    survey = await survey_service.get_survey(
        db,
        organization_id=current_user["organization_id"],
        survey_id=survey_id,
    )
    if survey is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )
    return survey


@router.post(
    "",
    response_model=SurveyListItem,
    status_code=status.HTTP_201_CREATED,
)
async def create_survey(
    body: SurveyCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new survey with optional inline questions."""
    try:
        return await survey_service.create_survey(
            db,
            organization_id=current_user["organization_id"],
            data=body.model_dump(),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/{survey_id}",
    response_model=SurveyListItem,
)
async def update_survey(
    survey_id: uuid.UUID,
    body: SurveyUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a survey."""
    result = await survey_service.update_survey(
        db,
        organization_id=current_user["organization_id"],
        survey_id=survey_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )
    return result


@router.delete(
    "/{survey_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_survey(
    survey_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft-delete) a survey."""
    deleted = await survey_service.delete_survey(
        db,
        organization_id=current_user["organization_id"],
        survey_id=survey_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )


# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------

@router.get(
    "/{survey_id}/questions",
    response_model=List[SurveyQuestionResponse],
)
async def list_questions(
    survey_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all questions for a survey."""
    return await survey_service.list_questions(db, survey_id=survey_id)


@router.post(
    "/{survey_id}/questions",
    response_model=SurveyQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_question(
    survey_id: uuid.UUID,
    body: SurveyQuestionCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Add a question to a survey."""
    return await survey_service.add_question(
        db,
        survey_id=survey_id,
        data=body.model_dump(),
    )


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

@router.get(
    "/{survey_id}/responses",
    response_model=List[SurveyResponseDetail],
)
async def list_responses(
    survey_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all responses submitted for a survey."""
    return await survey_service.list_responses(db, survey_id=survey_id)


@router.post(
    "/{survey_id}/responses",
    response_model=SurveyResponseDetail,
    status_code=status.HTTP_201_CREATED,
)
async def submit_response(
    survey_id: uuid.UUID,
    body: SurveyResponseCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.surveys.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Submit a response to a survey."""
    return await survey_service.submit_response(
        db,
        survey_id=survey_id,
        data=body.model_dump(),
    )
