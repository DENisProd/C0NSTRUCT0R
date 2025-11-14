from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProjectMediaResponse(BaseModel):
    id: int
    project_id: int
    bucket: str
    object_name: str
    etag: str | None = None
    version_id: str | None = None
    content_type: str | None = None
    file_url: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
