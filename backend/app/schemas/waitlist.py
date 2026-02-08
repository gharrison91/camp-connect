"""
Camp Connect - Waitlist Schemas
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class WaitlistResponse(BaseModel):
    """Waitlist entry details."""
    id: uuid.UUID
    event_id: uuid.UUID
    camper_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    camper_name: Optional[str] = None
    contact_name: Optional[str] = None
    position: int
    status: str
    notified_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
