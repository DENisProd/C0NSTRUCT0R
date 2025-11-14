from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from fastapi.responses import StreamingResponse
from minio.error import S3Error
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.background import BackgroundTask
from urllib.parse import quote

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.project import Project
from app.models.project_media import ProjectMedia
from app.models.user import User
from app.schemas.project_media import ProjectMediaResponse
from app.services.minio_service import minio_service

router = APIRouter(prefix="/api/projects", tags=["Projects Media"])


def _close_minio_response(response) -> None:
    response.close()
    release_conn = getattr(response, "release_conn", None)
    if callable(release_conn):
        release_conn()


async def _get_project(project_id: int, user: User, db: AsyncSession) -> Project:
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user.id,
            Project.deleted_at.is_(None),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("/{project_id}/media", response_model=ProjectMediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_project_media(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectMediaResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image uploads are allowed")

    await _get_project(project_id, current_user, db)

    try:
        upload_meta = await minio_service.upload_project_media(project_id, file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    record = ProjectMedia(
        project_id=project_id,
        bucket=upload_meta["bucket"],
        object_name=upload_meta["object_name"],
        etag=upload_meta.get("etag"),
        version_id=upload_meta.get("version_id"),
        content_type=upload_meta.get("content_type"),
        file_url=upload_meta.get("file_url"),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/{project_id}/media", response_model=list[ProjectMediaResponse])
async def list_project_media(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectMediaResponse]:
    await _get_project(project_id, current_user, db)
    result = await db.execute(
        select(ProjectMedia)
        .where(ProjectMedia.project_id == project_id)
        .order_by(ProjectMedia.created_at.desc())
    )
    return result.scalars().all()


@router.get("/media/by-etag/{etag}")
async def stream_project_media_by_etag(
    etag: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    result = await db.execute(
        select(ProjectMedia)
        .join(Project, ProjectMedia.project_id == Project.id)
        .where(
            ProjectMedia.etag == etag,
            Project.user_id == current_user.id,
            Project.deleted_at.is_(None),
        )
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    try:
        obj = minio_service.get_object_stream(media.bucket, media.object_name)
    except S3Error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source file missing")

    media_type = media.content_type or "application/octet-stream"
    filename = media.object_name.split("/")[-1]
    encoded_filename = quote(filename)
    headers = {
        "Content-Disposition": f"inline; filename*=UTF-8''{encoded_filename}",
    }
    content_length = getattr(obj, "headers", {}).get("Content-Length")
    if content_length:
        headers["Content-Length"] = content_length
    if media.etag:
        headers["ETag"] = media.etag

    return StreamingResponse(
        obj.stream(32 * 1024),
        media_type=media_type,
        headers=headers,
        background=BackgroundTask(_close_minio_response, obj),
    )


@router.delete("/{project_id}/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_media(
    project_id: int,
    media_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await _get_project(project_id, current_user, db)
    result = await db.execute(
        select(ProjectMedia).where(
            ProjectMedia.id == media_id,
            ProjectMedia.project_id == project_id,
        )
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    minio_service.delete_object(media.bucket, media.object_name)
    await db.delete(media)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
