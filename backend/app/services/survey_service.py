"""
Camp Connect - Survey Service
Business logic for survey management, questions, responses, and analytics.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.survey import Survey, SurveyQuestion, SurveyResponse


# ---------------------------------------------------------------------------
# Survey CRUD
# ---------------------------------------------------------------------------

async def list_surveys(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    status: Optional[str] = None,
    target_audience: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List surveys for an organization with optional filters."""
    query = (
        select(Survey)
        .where(Survey.organization_id == organization_id)
        .where(Survey.deleted_at.is_(None))
    )

    if status:
        query = query.where(Survey.status == status)

    if target_audience:
        query = query.where(Survey.target_audience == target_audience)

    if search:
        query = query.where(Survey.title.ilike(f"%{search}%"))

    query = query.order_by(Survey.created_at.desc())
    result = await db.execute(query)
    surveys = result.scalars().all()

    # Gather counts for each survey
    items = []
    for s in surveys:
        q_count = await db.scalar(
            select(func.count(SurveyQuestion.id)).where(
                SurveyQuestion.survey_id == s.id
            )
        )
        r_count = await db.scalar(
            select(func.count(SurveyResponse.id)).where(
                SurveyResponse.survey_id == s.id
            )
        )
        items.append(_survey_to_dict(s, question_count=q_count or 0, response_count=r_count or 0))

    return items


async def get_survey(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    survey_id: uuid.UUID,
) -> Optional[Dict[str, Any]]:
    """Get a single survey by ID with questions."""
    result = await db.execute(
        select(Survey)
        .options(selectinload(Survey.questions))
        .where(Survey.id == survey_id)
        .where(Survey.organization_id == organization_id)
        .where(Survey.deleted_at.is_(None))
    )
    survey = result.scalar_one_or_none()
    if survey is None:
        return None

    r_count = await db.scalar(
        select(func.count(SurveyResponse.id)).where(
            SurveyResponse.survey_id == survey.id
        )
    )

    d = _survey_to_dict(survey, question_count=len(survey.questions), response_count=r_count or 0)
    d["questions"] = [_question_to_dict(q) for q in survey.questions]
    return d


async def create_survey(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new survey, optionally with inline questions."""
    questions_data = data.pop("questions", None) or []

    survey = Survey(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(survey)
    await db.flush()

    # Create inline questions
    for idx, q_data in enumerate(questions_data):
        question = SurveyQuestion(
            id=uuid.uuid4(),
            survey_id=survey.id,
            question_text=q_data["question_text"],
            question_type=q_data.get("question_type", "text"),
            options=q_data.get("options"),
            required=q_data.get("required", True),
            order=q_data.get("order", idx),
        )
        db.add(question)

    await db.commit()
    await db.refresh(survey)

    return _survey_to_dict(survey, question_count=len(questions_data), response_count=0)


async def update_survey(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    survey_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing survey."""
    result = await db.execute(
        select(Survey)
        .where(Survey.id == survey_id)
        .where(Survey.organization_id == organization_id)
        .where(Survey.deleted_at.is_(None))
    )
    survey = result.scalar_one_or_none()
    if survey is None:
        return None

    for key, value in data.items():
        setattr(survey, key, value)

    await db.commit()
    await db.refresh(survey)

    q_count = await db.scalar(
        select(func.count(SurveyQuestion.id)).where(SurveyQuestion.survey_id == survey.id)
    )
    r_count = await db.scalar(
        select(func.count(SurveyResponse.id)).where(SurveyResponse.survey_id == survey.id)
    )

    return _survey_to_dict(survey, question_count=q_count or 0, response_count=r_count or 0)


async def delete_survey(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    survey_id: uuid.UUID,
) -> bool:
    """Soft-delete a survey."""
    result = await db.execute(
        select(Survey)
        .where(Survey.id == survey_id)
        .where(Survey.organization_id == organization_id)
        .where(Survey.deleted_at.is_(None))
    )
    survey = result.scalar_one_or_none()
    if survey is None:
        return False

    survey.is_deleted = True
    survey.deleted_at = datetime.utcnow()
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------

async def list_questions(
    db: AsyncSession,
    *,
    survey_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List all questions for a survey."""
    result = await db.execute(
        select(SurveyQuestion)
        .where(SurveyQuestion.survey_id == survey_id)
        .order_by(SurveyQuestion.order)
    )
    return [_question_to_dict(q) for q in result.scalars().all()]


async def add_question(
    db: AsyncSession,
    *,
    survey_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Add a question to a survey."""
    question = SurveyQuestion(
        id=uuid.uuid4(),
        survey_id=survey_id,
        **data,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return _question_to_dict(question)


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

async def list_responses(
    db: AsyncSession,
    *,
    survey_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """List all responses for a survey."""
    result = await db.execute(
        select(SurveyResponse)
        .where(SurveyResponse.survey_id == survey_id)
        .order_by(SurveyResponse.submitted_at.desc())
    )
    return [_response_to_dict(r) for r in result.scalars().all()]


async def submit_response(
    db: AsyncSession,
    *,
    survey_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Submit a response to a survey."""
    # Convert answer items to plain dicts for JSONB storage
    answers_raw = data.get("answers", [])
    answers_dicts = []
    for a in answers_raw:
        if isinstance(a, dict):
            answers_dicts.append(a)
        else:
            answers_dicts.append({"question_id": a.question_id, "answer": a.answer})

    response = SurveyResponse(
        id=uuid.uuid4(),
        survey_id=survey_id,
        respondent_name=data.get("respondent_name"),
        respondent_email=data.get("respondent_email"),
        answers=answers_dicts,
        submitted_at=datetime.utcnow(),
    )
    db.add(response)
    await db.commit()
    await db.refresh(response)
    return _response_to_dict(response)


# ---------------------------------------------------------------------------
# Stats & Analytics
# ---------------------------------------------------------------------------

async def get_stats(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
) -> Dict[str, Any]:
    """Aggregate statistics for the surveys dashboard."""
    base = select(Survey).where(
        Survey.organization_id == organization_id,
        Survey.deleted_at.is_(None),
    )

    total_surveys = await db.scalar(
        select(func.count()).select_from(base.subquery())
    ) or 0

    active_count = await db.scalar(
        select(func.count()).select_from(
            base.where(Survey.status == "active").subquery()
        )
    ) or 0

    # Total responses across all org surveys
    survey_ids_q = select(Survey.id).where(
        Survey.organization_id == organization_id,
        Survey.deleted_at.is_(None),
    )
    total_responses = await db.scalar(
        select(func.count(SurveyResponse.id)).where(
            SurveyResponse.survey_id.in_(survey_ids_q)
        )
    ) or 0

    # Avg completion rate: responses / (active surveys) as a rough metric
    avg_completion_rate = 0.0
    if active_count > 0:
        avg_completion_rate = round(total_responses / active_count, 1)

    return {
        "total_surveys": total_surveys,
        "active_count": active_count,
        "total_responses": total_responses,
        "avg_completion_rate": avg_completion_rate,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _survey_to_dict(
    survey: Survey,
    *,
    question_count: int = 0,
    response_count: int = 0,
) -> Dict[str, Any]:
    """Convert a Survey model to a response dict."""
    return {
        "id": survey.id,
        "organization_id": survey.organization_id,
        "title": survey.title,
        "description": survey.description,
        "target_audience": survey.target_audience,
        "status": survey.status,
        "start_date": survey.start_date,
        "end_date": survey.end_date,
        "question_count": question_count,
        "response_count": response_count,
        "created_at": survey.created_at,
    }


def _question_to_dict(question: SurveyQuestion) -> Dict[str, Any]:
    """Convert a SurveyQuestion model to a response dict."""
    return {
        "id": question.id,
        "survey_id": question.survey_id,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "options": question.options,
        "required": question.required,
        "order": question.order,
        "created_at": question.created_at,
    }


def _response_to_dict(response: SurveyResponse) -> Dict[str, Any]:
    """Convert a SurveyResponse model to a response dict."""
    return {
        "id": response.id,
        "survey_id": response.survey_id,
        "respondent_name": response.respondent_name,
        "respondent_email": response.respondent_email,
        "answers": response.answers,
        "submitted_at": response.submitted_at,
        "created_at": response.created_at,
    }
