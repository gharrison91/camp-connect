"""
Camp Connect - Common Pydantic Schemas
Shared response models for pagination, errors, etc.
"""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response."""
    items: list
    total: int
    page: int
    page_size: int


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    code: str = ""


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str
