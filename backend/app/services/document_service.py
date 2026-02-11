"""
Camp Connect - Document Service
Business logic for document management (in-memory store, no DB model needed).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional


# In-memory stores (per-org)
_documents: Dict[str, Dict[str, Any]] = {}
_folders: Dict[str, Dict[str, Any]] = {}


def _org_docs(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    """Get all documents for an org."""
    oid = str(org_id)
    return [d for d in _documents.values() if d["org_id"] == oid]


def _org_folders(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    """Get all folders for an org."""
    oid = str(org_id)
    return [f for f in _folders.values() if f["org_id"] == oid]


async def get_documents(
    org_id: uuid.UUID,
    category: Optional[str] = None,
    search: Optional[str] = None,
    folder_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List documents for an org with optional filters."""
    docs = _org_docs(org_id)

    if category:
        docs = [d for d in docs if d["category"] == category]
    if status:
        docs = [d for d in docs if d["status"] == status]
    if folder_id:
        docs = [d for d in docs if d.get("folder_id") == folder_id]
    if search:
        q = search.lower()
        docs = [d for d in docs if q in d["name"].lower() or q in (d.get("description") or "").lower()]

    docs.sort(key=lambda d: d["created_at"], reverse=True)
    return docs


async def create_document(
    org_id: uuid.UUID,
    data: Dict[str, Any],
    uploaded_by: Optional[str] = None,
    uploaded_by_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new document record."""
    doc_id = str(uuid.uuid4())
    now = datetime.utcnow()
    doc = {
        "id": doc_id,
        "org_id": str(org_id),
        "name": data["name"],
        "description": data.get("description"),
        "file_url": data.get("file_url"),
        "file_type": data.get("file_type", "other"),
        "file_size": data.get("file_size", 0),
        "category": data.get("category", "other"),
        "tags": data.get("tags") or [],
        "uploaded_by": uploaded_by,
        "uploaded_by_name": uploaded_by_name,
        "version": data.get("version", 1),
        "requires_signature": data.get("requires_signature", False),
        "signed_by": [],
        "expiry_date": data.get("expiry_date"),
        "status": "active",
        "shared_with": data.get("shared_with") or [],
        "folder_id": data.get("folder_id"),
        "created_at": now,
        "updated_at": now,
    }
    _documents[doc_id] = doc
    return doc


async def update_document(
    org_id: uuid.UUID,
    document_id: str,
    data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Update an existing document."""
    doc = _documents.get(document_id)
    if doc is None or doc["org_id"] != str(org_id):
        return None

    for key, value in data.items():
        if key in doc:
            doc[key] = value
    doc["updated_at"] = datetime.utcnow()
    return doc


async def delete_document(
    org_id: uuid.UUID,
    document_id: str,
) -> bool:
    """Delete a document."""
    doc = _documents.get(document_id)
    if doc is None or doc["org_id"] != str(org_id):
        return False
    del _documents[document_id]
    return True


async def archive_document(
    org_id: uuid.UUID,
    document_id: str,
) -> Optional[Dict[str, Any]]:
    """Archive a document."""
    doc = _documents.get(document_id)
    if doc is None or doc["org_id"] != str(org_id):
        return None
    doc["status"] = "archived"
    doc["updated_at"] = datetime.utcnow()
    return doc


async def get_folders(
    org_id: uuid.UUID,
) -> List[Dict[str, Any]]:
    """Get all folders for an org with document counts."""
    folders = _org_folders(org_id)
    docs = _org_docs(org_id)
    for folder in folders:
        folder["document_count"] = len([d for d in docs if d.get("folder_id") == folder["id"]])
    folders.sort(key=lambda f: f["name"])
    return folders


async def create_folder(
    org_id: uuid.UUID,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a new folder."""
    folder_id = str(uuid.uuid4())
    now = datetime.utcnow()
    folder = {
        "id": folder_id,
        "org_id": str(org_id),
        "name": data["name"],
        "parent_id": data.get("parent_id"),
        "document_count": 0,
        "created_at": now,
    }
    _folders[folder_id] = folder
    return folder


async def get_expiring_documents(
    org_id: uuid.UUID,
    days_ahead: int = 30,
) -> List[Dict[str, Any]]:
    """Get documents expiring within the given number of days."""
    docs = _org_docs(org_id)
    cutoff = datetime.utcnow() + timedelta(days=days_ahead)
    expiring = []
    for doc in docs:
        if doc.get("expiry_date") and doc["status"] == "active":
            try:
                exp = datetime.fromisoformat(doc["expiry_date"])
                if exp <= cutoff:
                    expiring.append(doc)
            except (ValueError, TypeError):
                pass
    expiring.sort(key=lambda d: d.get("expiry_date", ""))
    return expiring


async def get_document_stats(
    org_id: uuid.UUID,
) -> Dict[str, Any]:
    """Get document statistics for an org."""
    docs = _org_docs(org_id)
    active = [d for d in docs if d["status"] == "active"]
    total_size = sum(d.get("file_size", 0) for d in docs)
    pending_sigs = sum(
        1 for d in active
        if d.get("requires_signature") and len(d.get("signed_by", [])) == 0
    )
    expiring = await get_expiring_documents(org_id, days_ahead=30)
    return {
        "total_documents": len(docs),
        "active_documents": len(active),
        "pending_signatures": pending_sigs,
        "expiring_soon": len(expiring),
        "total_storage_bytes": total_size,
    }
