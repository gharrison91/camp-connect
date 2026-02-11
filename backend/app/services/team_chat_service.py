"""
Camp Connect - Team Chat Service
Business logic for channels and messages.
Uses in-memory storage (no dedicated DB table) for MVP.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional


# In-memory stores keyed by org_id
_channels_store: Dict[str, List[Dict[str, Any]]] = {}
_messages_store: Dict[str, List[Dict[str, Any]]] = {}  # keyed by channel_id
_read_cursors: Dict[str, Dict[str, str]] = {}  # {user_id: {channel_id: last_read_at}}


def _org_key(org_id: uuid.UUID) -> str:
    return str(org_id)


def _ch_key(channel_id: str) -> str:
    return channel_id


# ---------------------------------------------------------------------------
# Channels
# ---------------------------------------------------------------------------


async def list_channels(org_id: uuid.UUID) -> List[Dict[str, Any]]:
    """List all non-archived channels for an org."""
    key = _org_key(org_id)
    channels = _channels_store.get(key, [])
    return [c for c in channels if not c.get("is_archived", False)]


async def get_channel(org_id: uuid.UUID, channel_id: str) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for ch in _channels_store.get(key, []):
        if ch["id"] == channel_id:
            return ch
    return None


async def create_channel(
    org_id: uuid.UUID, data: Dict[str, Any], created_by: str,
) -> Dict[str, Any]:
    key = _org_key(org_id)
    channel = {
        "id": str(uuid.uuid4()),
        "org_id": str(org_id),
        "created_by": created_by,
        "is_archived": False,
        "created_at": datetime.utcnow().isoformat(),
        "last_message_at": None,
        "last_message_preview": None,
        **data,
    }
    # Ensure the creator is in members
    if created_by not in channel.get("members", []):
        channel.setdefault("members", []).append(created_by)
    _channels_store.setdefault(key, []).append(channel)
    return channel


async def update_channel(
    org_id: uuid.UUID, channel_id: str, data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    key = _org_key(org_id)
    for ch in _channels_store.get(key, []):
        if ch["id"] == channel_id:
            for k, v in data.items():
                if v is not None:
                    ch[k] = v
            return ch
    return None


async def delete_channel(org_id: uuid.UUID, channel_id: str) -> bool:
    key = _org_key(org_id)
    channels = _channels_store.get(key, [])
    before = len(channels)
    _channels_store[key] = [c for c in channels if c["id"] != channel_id]
    # Also remove messages
    _messages_store.pop(_ch_key(channel_id), None)
    return len(_channels_store[key]) < before


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------


async def get_messages(
    channel_id: str,
    before: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Get messages for a channel, newest last, with pagination."""
    ch_key = _ch_key(channel_id)
    msgs = _messages_store.get(ch_key, [])
    if before:
        msgs = [m for m in msgs if m["created_at"] < before]
    # Return last N messages, sorted oldest first
    msgs = sorted(msgs, key=lambda m: m["created_at"])
    return msgs[-limit:]


async def send_message(
    channel_id: str,
    org_id: uuid.UUID,
    sender_id: str,
    sender_name: str,
    sender_avatar: Optional[str],
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """Send a message to a channel."""
    now = datetime.utcnow().isoformat()
    msg = {
        "id": str(uuid.uuid4()),
        "channel_id": channel_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "sender_avatar": sender_avatar,
        "content": data.get("content", ""),
        "message_type": data.get("message_type", "text"),
        "attachments": data.get("attachments", []),
        "reactions": [],
        "is_pinned": False,
        "created_at": now,
        "updated_at": None,
    }
    ch_key = _ch_key(channel_id)
    _messages_store.setdefault(ch_key, []).append(msg)

    # Update channel last_message info
    org_key = _org_key(org_id)
    for ch in _channels_store.get(org_key, []):
        if ch["id"] == channel_id:
            ch["last_message_at"] = now
            preview = data.get("content", "")
            ch["last_message_preview"] = preview[:80] if preview else ""
            break

    return msg


async def pin_message(channel_id: str, message_id: str, pinned: bool = True) -> Optional[Dict[str, Any]]:
    """Pin or unpin a message."""
    ch_key = _ch_key(channel_id)
    for msg in _messages_store.get(ch_key, []):
        if msg["id"] == message_id:
            msg["is_pinned"] = pinned
            msg["updated_at"] = datetime.utcnow().isoformat()
            return msg
    return None


async def add_reaction(
    channel_id: str, message_id: str, emoji: str, user_id: str,
) -> Optional[Dict[str, Any]]:
    """Toggle a reaction on a message."""
    ch_key = _ch_key(channel_id)
    for msg in _messages_store.get(ch_key, []):
        if msg["id"] == message_id:
            # Find existing reaction for this emoji
            for reaction in msg["reactions"]:
                if reaction["emoji"] == emoji:
                    if user_id in reaction["user_ids"]:
                        reaction["user_ids"].remove(user_id)
                        if not reaction["user_ids"]:
                            msg["reactions"].remove(reaction)
                    else:
                        reaction["user_ids"].append(user_id)
                    return msg
            # New reaction
            msg["reactions"].append({"emoji": emoji, "user_ids": [user_id]})
            return msg
    return None


async def get_pinned_messages(channel_id: str) -> List[Dict[str, Any]]:
    """Get all pinned messages for a channel."""
    ch_key = _ch_key(channel_id)
    return [m for m in _messages_store.get(ch_key, []) if m.get("is_pinned")]


# ---------------------------------------------------------------------------
# Unread tracking
# ---------------------------------------------------------------------------


async def get_unread_counts(user_id: str, org_id: uuid.UUID) -> List[Dict[str, Any]]:
    """Get unread message counts per channel for a user."""
    org_key = _org_key(org_id)
    channels = _channels_store.get(org_key, [])
    cursors = _read_cursors.get(user_id, {})
    result = []
    for ch in channels:
        if ch.get("is_archived"):
            continue
        ch_id = ch["id"]
        last_read = cursors.get(ch_id, "")
        ch_key = _ch_key(ch_id)
        msgs = _messages_store.get(ch_key, [])
        count = sum(1 for m in msgs if m["created_at"] > last_read) if last_read else len(msgs)
        result.append({"channel_id": ch_id, "count": count})
    return result


async def mark_as_read(user_id: str, channel_id: str) -> None:
    """Mark a channel as read for a user."""
    _read_cursors.setdefault(user_id, {})[channel_id] = datetime.utcnow().isoformat()


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


async def search_messages(
    org_id: uuid.UUID, query: str, limit: int = 20,
) -> List[Dict[str, Any]]:
    """Search messages across all channels in an org."""
    org_key = _org_key(org_id)
    channels = _channels_store.get(org_key, [])
    q = query.lower()
    results: List[Dict[str, Any]] = []
    for ch in channels:
        ch_key = _ch_key(ch["id"])
        for msg in _messages_store.get(ch_key, []):
            if q in msg.get("content", "").lower():
                results.append(msg)
    results.sort(key=lambda m: m["created_at"], reverse=True)
    return results[:limit]
