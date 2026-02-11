"""
Camp Connect - Custom Fields Service
Business logic for custom field definitions and values.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.custom_field import CustomFieldDefinition, CustomFieldValue


async def list_definitions(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entity_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List custom field definitions for an organization."""
    query = (
        select(CustomFieldDefinition)
        .where(CustomFieldDefinition.organization_id == organization_id)
    )

    if entity_type:
        query = query.where(CustomFieldDefinition.entity_type == entity_type)

    query = query.order_by(CustomFieldDefinition.sort_order, CustomFieldDefinition.created_at)
    result = await db.execute(query)
    definitions = result.scalars().all()

    return [_definition_to_dict(d) for d in definitions]


async def create_definition(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new custom field definition."""
    definition = CustomFieldDefinition(
        id=uuid.uuid4(),
        organization_id=organization_id,
        **data,
    )
    db.add(definition)
    await db.commit()
    await db.refresh(definition)
    return _definition_to_dict(definition)


async def update_definition(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    definition_id: uuid.UUID,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing custom field definition."""
    result = await db.execute(
        select(CustomFieldDefinition)
        .where(CustomFieldDefinition.id == definition_id)
        .where(CustomFieldDefinition.organization_id == organization_id)
    )
    definition = result.scalar_one_or_none()
    if definition is None:
        return None

    for key, value in data.items():
        setattr(definition, key, value)

    await db.commit()
    await db.refresh(definition)
    return _definition_to_dict(definition)


async def delete_definition(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    definition_id: uuid.UUID,
) -> bool:
    """Delete a custom field definition and its values."""
    result = await db.execute(
        select(CustomFieldDefinition)
        .where(CustomFieldDefinition.id == definition_id)
        .where(CustomFieldDefinition.organization_id == organization_id)
    )
    definition = result.scalar_one_or_none()
    if definition is None:
        return False

    # Delete associated values first
    await db.execute(
        delete(CustomFieldValue).where(
            CustomFieldValue.field_definition_id == definition_id
        )
    )

    await db.delete(definition)
    await db.commit()
    return True


async def reorder_definitions(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Reorder custom field definitions."""
    ids = [uuid.UUID(item["id"]) for item in items]
    result = await db.execute(
        select(CustomFieldDefinition)
        .where(CustomFieldDefinition.organization_id == organization_id)
        .where(CustomFieldDefinition.id.in_(ids))
    )
    definitions = {str(d.id): d for d in result.scalars().all()}

    for item in items:
        defn = definitions.get(item["id"])
        if defn:
            defn.sort_order = item["sort_order"]

    await db.commit()

    # Return updated list
    return await list_definitions(db, organization_id=organization_id)


async def get_values(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Get all custom field values for a specific entity."""
    # Get definitions for this entity type
    def_result = await db.execute(
        select(CustomFieldDefinition)
        .where(CustomFieldDefinition.organization_id == organization_id)
        .where(CustomFieldDefinition.entity_type == entity_type)
        .where(CustomFieldDefinition.is_active == True)
        .order_by(CustomFieldDefinition.sort_order)
    )
    definitions = def_result.scalars().all()
    def_map = {d.id: d for d in definitions}

    # Get values for this entity
    val_result = await db.execute(
        select(CustomFieldValue)
        .where(CustomFieldValue.organization_id == organization_id)
        .where(CustomFieldValue.entity_type == entity_type)
        .where(CustomFieldValue.entity_id == entity_id)
    )
    values = val_result.scalars().all()
    val_map = {v.field_definition_id: v for v in values}

    # Build response with definition metadata included
    result = []
    for defn in definitions:
        val = val_map.get(defn.id)
        result.append({
            "id": str(val.id) if val else None,
            "field_definition_id": str(defn.id),
            "field_name": defn.field_name,
            "field_key": defn.field_key,
            "field_type": defn.field_type,
            "description": defn.description,
            "is_required": defn.is_required,
            "options": defn.options,
            "default_value": defn.default_value,
            "show_in_list": defn.show_in_list,
            "show_in_detail": defn.show_in_detail,
            "entity_id": str(entity_id),
            "entity_type": entity_type,
            "value": val.value if val else defn.default_value,
        })

    return result


async def save_values(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
    values: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Bulk save/update custom field values for an entity."""
    for item in values:
        field_def_id = uuid.UUID(item["field_definition_id"])

        # Check if value already exists
        result = await db.execute(
            select(CustomFieldValue).where(
                and_(
                    CustomFieldValue.organization_id == organization_id,
                    CustomFieldValue.field_definition_id == field_def_id,
                    CustomFieldValue.entity_id == entity_id,
                    CustomFieldValue.entity_type == entity_type,
                )
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.value = item.get("value")
            existing.updated_at = datetime.utcnow()
        else:
            new_value = CustomFieldValue(
                id=uuid.uuid4(),
                organization_id=organization_id,
                field_definition_id=field_def_id,
                entity_id=entity_id,
                entity_type=entity_type,
                value=item.get("value"),
            )
            db.add(new_value)

    await db.commit()

    # Return updated values
    return await get_values(
        db,
        organization_id=organization_id,
        entity_type=entity_type,
        entity_id=entity_id,
    )


async def delete_value(
    db: AsyncSession,
    *,
    organization_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
    field_id: uuid.UUID,
) -> bool:
    """Delete a specific custom field value."""
    result = await db.execute(
        select(CustomFieldValue).where(
            and_(
                CustomFieldValue.organization_id == organization_id,
                CustomFieldValue.entity_type == entity_type,
                CustomFieldValue.entity_id == entity_id,
                CustomFieldValue.field_definition_id == field_id,
            )
        )
    )
    value = result.scalar_one_or_none()
    if value is None:
        return False

    await db.delete(value)
    await db.commit()
    return True


def _definition_to_dict(definition: CustomFieldDefinition) -> Dict[str, Any]:
    """Convert a CustomFieldDefinition model to a response dict."""
    return {
        "id": str(definition.id),
        "organization_id": str(definition.organization_id),
        "entity_type": definition.entity_type,
        "field_name": definition.field_name,
        "field_key": definition.field_key,
        "field_type": definition.field_type,
        "description": definition.description,
        "is_required": definition.is_required,
        "options": definition.options,
        "default_value": definition.default_value,
        "sort_order": definition.sort_order or 0,
        "is_active": definition.is_active if definition.is_active is not None else True,
        "show_in_list": definition.show_in_list if definition.show_in_list is not None else False,
        "show_in_detail": definition.show_in_detail if definition.show_in_detail is not None else True,
        "created_at": definition.created_at.isoformat() if definition.created_at else None,
        "updated_at": definition.updated_at.isoformat() if definition.updated_at else None,
    }
