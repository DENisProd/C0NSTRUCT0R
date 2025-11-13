from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    data: Dict[str, Any] = Field(default_factory=dict)
    preview_url: Optional[str] = Field(None, max_length=500)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    data: Optional[Dict[str, Any]] = None
    preview_url: Optional[str] = Field(None, max_length=500)


class ProjectResponse(BaseModel):
    id: int
    title: str
    data: Dict[str, Any]
    preview_url: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectListItem(BaseModel):
    id: int
    title: str
    preview_url: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
