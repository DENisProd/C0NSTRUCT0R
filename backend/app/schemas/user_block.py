from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class UserBlockCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    data: Dict[str, Any] = Field(default_factory=dict)
    preview_url: Optional[str] = Field(None, max_length=500)


class UserBlockResponse(BaseModel):
    id: int
    title: str
    preview_url: Optional[str] = None
    data: Dict[str, Any]
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
