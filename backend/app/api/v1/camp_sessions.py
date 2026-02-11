"""
Camp Connect - Camp Sessions API
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ..deps import get_current_user
from ...services import camp_session_service as svc

router = APIRouter(prefix="/camp-sessions", tags=["camp-sessions"])


@router.get("")
async def list_sessions(
    status: str = Query(None),
    search: str = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await svc.get_sessions(db, str(current_user.organization_id), status, search)


@router.post("")
async def create_session(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await svc.create_session(db, str(current_user.organization_id), data)


@router.put("/{session_id}")
async def update_session(
    session_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await svc.update_session(db, str(current_user.organization_id), session_id, data)
    return {"ok": True}


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await svc.delete_session(db, str(current_user.organization_id), session_id)
    return {"ok": True}


@router.get("/stats")
async def session_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await svc.get_stats(db, str(current_user.organization_id))


@router.get("/{session_id}/enrollments")
async def list_enrollments(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await svc.get_enrollments(db, str(current_user.organization_id), session_id)


@router.post("/{session_id}/enroll")
async def enroll_camper(
    session_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await svc.enroll_camper(
        db, str(current_user.organization_id), session_id, data["camper_id"]
    )


@router.delete("/enrollments/{enrollment_id}")
async def unenroll(
    enrollment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await svc.unenroll(db, str(current_user.organization_id), enrollment_id)
    return {"ok": True}
