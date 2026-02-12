"""
Camp Connect - Program Evaluation API Endpoints
Full CRUD for program evaluations and aggregate stats.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.program_eval import (
    ProgramEval,
    ProgramEvalCreate,
    ProgramEvalStats,
    ProgramEvalUpdate,
)
from app.services import program_eval_service

router = APIRouter(prefix="/program-eval", tags=["Program Evaluation"])


# ---------------------------------------------------------------------------
# Stats (must be before /{eval_id} to avoid route conflict)
# ---------------------------------------------------------------------------


@router.get(
    "/stats",
    response_model=ProgramEvalStats,
)
async def get_program_eval_stats(
    current_user: Dict[str, Any] = Depends(
        require_permission("core.program_eval.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregate program evaluation statistics for the organization."""
    return await program_eval_service.get_stats(
        db,
        org_id=current_user["organization_id"],
    )


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=List[ProgramEval],
)
async def list_program_evals(
    search: Optional[str] = Query(default=None, description="Search by program name, evaluator, or notes"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    min_rating: Optional[int] = Query(default=None, ge=1, le=5, description="Minimum rating filter"),
    current_user: Dict[str, Any] = Depends(
        require_permission("core.program_eval.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """List all program evaluations for the current organization."""
    return await program_eval_service.list_evals(
        db,
        org_id=current_user["organization_id"],
        category=category,
        min_rating=min_rating,
        search=search,
    )


@router.get(
    "/{eval_id}",
    response_model=ProgramEval,
)
async def get_program_eval(
    eval_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.program_eval.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Get a single program evaluation by ID."""
    result = await program_eval_service.get_eval(
        db,
        org_id=current_user["organization_id"],
        eval_id=eval_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program evaluation not found",
        )
    return result


@router.post(
    "",
    response_model=ProgramEval,
    status_code=status.HTTP_201_CREATED,
)
async def create_program_eval(
    body: ProgramEvalCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.program_eval.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create a new program evaluation."""
    return await program_eval_service.create_eval(
        db,
        org_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{eval_id}",
    response_model=ProgramEval,
)
async def update_program_eval(
    eval_id: uuid.UUID,
    body: ProgramEvalUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.program_eval.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Update a program evaluation."""
    result = await program_eval_service.update_eval(
        db,
        org_id=current_user["organization_id"],
        eval_id=eval_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program evaluation not found",
        )
    return result


@router.delete(
    "/{eval_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_program_eval(
    eval_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("core.program_eval.delete")
    ),
    db: AsyncSession = Depends(get_db),
):
    """Delete a program evaluation."""
    deleted = await program_eval_service.delete_eval(
        db,
        org_id=current_user["organization_id"],
        eval_id=eval_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program evaluation not found",
        )
