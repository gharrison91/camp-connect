""""
Camp Connect - Quote API Endpoints
Manage quotes: create, update, send, convert to invoice.
""""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_permission
from app.database import get_db
from app.schemas.quote import (
    QuoteCreate,
    QuoteResponse,
    QuoteUpdate,
)
from app.services import quote_service

router = APIRouter(prefix="/quotes", tags=["Quotes"])


@router.get(
    "",
    response_model=List[QuoteResponse],
)
async def list_quotes(
    status_filter: Optional[str] = Query(
        default=None, alias="status", description="Filter by quote status"
    ),
    contact_id: Optional[uuid.UUID] = Query(
        default=None, description="Filter by contact"
    ),
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """"List quotes with optional filters.""""
    return await quote_service.list_quotes(
        db,
        organization_id=current_user["organization_id"],
        status=status_filter,
        contact_id=contact_id,
    )


@router.get(
    "/{quote_id}",
    response_model=QuoteResponse,
)
async def get_quote(
    quote_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.read")
    ),
    db: AsyncSession = Depends(get_db),
):
    """"Get a single quote by ID.""""
    result = await quote_service.get_quote(
        db,
        organization_id=current_user["organization_id"],
        quote_id=quote_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found",
        )
    return result


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=QuoteResponse,
)
async def create_quote(
    body: QuoteCreate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """"Create a new quote.""""
    return await quote_service.create_quote(
        db,
        organization_id=current_user["organization_id"],
        data=body.model_dump(),
    )


@router.put(
    "/{quote_id}",
    response_model=QuoteResponse,
)
async def update_quote(
    quote_id: uuid.UUID,
    body: QuoteUpdate,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """"Update an existing quote.""""
    result = await quote_service.update_quote(
        db,
        organization_id=current_user["organization_id"],
        quote_id=quote_id,
        data=body.model_dump(exclude_unset=True),
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found",
        )
    return result


@router.delete(
    "/{quote_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_quote(
    quote_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """"Soft delete a quote.""""
    deleted = await quote_service.delete_quote(
        db,
        organization_id=current_user["organization_id"],
        quote_id=quote_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found",
        )


@router.post(
    "/{quote_id}/send",
    response_model=QuoteResponse,
)
async def send_quote(
    quote_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.update")
    ),
    db: AsyncSession = Depends(get_db),
):
    """"Mark a quote as sent (would send email in future).""""
    result = await quote_service.send_quote(
        db,
        organization_id=current_user["organization_id"],
        quote_id=quote_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found",
        )
    return result


@router.post(
    "/{quote_id}/convert-to-invoice",
    response_model=QuoteResponse,
)
async def convert_to_invoice(
    quote_id: uuid.UUID,
    current_user: Dict[str, Any] = Depends(
        require_permission("payments.invoices.create")
    ),
    db: AsyncSession = Depends(get_db),
):
    """"Convert a quote to an invoice. Creates a new invoice and links them.""""
    try:
        return await quote_service.convert_quote_to_invoice(
            db,
            organization_id=current_user["organization_id"],
            quote_id=quote_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
