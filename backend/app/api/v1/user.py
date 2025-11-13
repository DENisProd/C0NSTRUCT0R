from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

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

router = APIRouter(prefix="/api/user", tags=["User"])


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
