"""
Camp Connect - Custom Field Schemas
Pydantic models for custom field definitions and values.
"""

from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel


class CustomFieldDefinitionCreate(BaseModel):
    entity_type: str
    field_name: str
    field_key: str
    field_type: str
    description: Optional[str] = None
    is_required: bool = False
    options: Optional[List[str]] = None
    default_value: Optional[str] = None
    sort_order: int = 0
    show_in_list: bool = False
    show_in_detail: bool = True


class CustomFieldDefinitionUpdate(BaseModel):
    field_name: Optional[str] = None
    field_key: Optional[str] = None
    field_type: Optional[str] = None
    description: Optional[str] = None
    is_required: Optional[bool] = None
    options: Optional[List[str]] = None
    default_value: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    show_in_list: Optional[bool] = None
    show_in_detail: Optional[bool] = None


class ReorderItem(BaseModel):
    id: str
    sort_order: int


class ReorderRequest(BaseModel):
    items: List[ReorderItem]


class CustomFieldValueSave(BaseModel):
    field_definition_id: str
    value: Optional[str] = None


class BulkSaveRequest(BaseModel):
    values: List[CustomFieldValueSave]
