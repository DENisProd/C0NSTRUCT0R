from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from minio.error import S3Error
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.background import BackgroundTask
from urllib.parse import quote

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.models.project import Project
from app.models.user import User
from app.models.user_block import UserBlock
from app.schemas.user import (
    MessageResponse,
    PasswordChangePayload,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.services.minio_service import minio_service

router = APIRouter(prefix="/api/user", tags=["User"])


def _close_minio_response(response) -> None:
    response.close()
    release_conn = getattr(response, "release_conn", None)
    if callable(release_conn):
        release_conn()


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    projects_count = await db.scalar(
        select(func.count())
        .select_from(Project)
        .where(Project.user_id == current_user.id, Project.deleted_at.is_(None))
    )
    blocks_count = await db.scalar(
        select(func.count()).select_from(UserBlock).where(UserBlock.user_id == current_user.id)
    )

    return UserProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        nickname=current_user.nickname,
        avatar_url=current_user.avatar_url,
        projects_count=projects_count or 0,
        blocks_count=blocks_count or 0,
    )


@router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    if payload.nickname is not None:
        current_user.nickname = payload.nickname
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
        current_user.has_avatar = bool(payload.avatar_url)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return await get_profile(current_user=current_user, db=db)


@router.post("/change-password", response_model=MessageResponse)
async def change_password_stub(
    _: PasswordChangePayload,
    __: User = Depends(get_current_user),
) -> MessageResponse:
    # Заглушка под будущую интеграцию авторизации/Keycloak.
    return MessageResponse(detail="Password change request accepted (stub).")


@router.post("/avatar", response_model=UserProfileResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image uploads are allowed")

    try:
        upload_meta = await minio_service.upload_user_avatar(current_user.id, file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    current_user.avatar_url = upload_meta["file_url"]
    current_user.has_avatar = True
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return await get_profile(current_user=current_user, db=db)


@router.delete("/avatar", response_model=MessageResponse)
async def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    object_name = minio_service.avatar_object_name(current_user.id)
    minio_service.delete_object(None, object_name)

    current_user.avatar_url = None
    current_user.has_avatar = False
    db.add(current_user)
    await db.commit()
    return MessageResponse(detail="Avatar removed")


@router.get("/{user_id}/avatar")
async def get_user_avatar(
    user_id: int,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not getattr(user, "has_avatar", False):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")

    object_name = minio_service.avatar_object_name(user_id)
    try:
        obj = minio_service.get_object_stream(None, object_name)
    except S3Error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")

    filename = object_name.split("/")[-1]
    encoded_name = quote(filename)
    headers = {"Content-Disposition": f"inline; filename*=UTF-8''{encoded_name}"}
    content_length = getattr(obj, "headers", {}).get("Content-Length")
    if content_length:
        headers["Content-Length"] = content_length
    if getattr(obj, "headers", {}).get("ETag"):
        headers["ETag"] = obj.headers["ETag"]

    media_type = getattr(obj, "headers", {}).get("Content-Type", "image/png")
    return StreamingResponse(
        obj.stream(32 * 1024),
        media_type=media_type,
        headers=headers,
        background=BackgroundTask(_close_minio_response, obj),
    )
