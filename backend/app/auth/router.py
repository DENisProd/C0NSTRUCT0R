from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, get_token_expires_in_seconds
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import (
    MessageResponse,
    PasswordChangeRequest,
    TOTPCodePayload,
    TOTPSetupResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.services.totp_service import TOTPService

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)

def get_totp_service(db: AsyncSession = Depends(get_db)) -> TOTPService:
    return TOTPService(db)

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(
    payload: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    user = await auth_service.register_user(payload)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    user = await auth_service.authenticate(payload.email, payload.password, payload.totp_code)
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        expires_in=get_token_expires_in_seconds(),
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await auth_service.change_password(current_user, payload)
    return MessageResponse(detail="Пароль обновлен")


@router.post("/totp/setup", response_model=TOTPSetupResponse)
async def totp_setup(
    current_user: User = Depends(get_current_user),
    totp_service: TOTPService = Depends(get_totp_service),
) -> TOTPSetupResponse:
    if not settings.ENABLE_TOTP:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TOTP disabled")
    return await totp_service.initiate(current_user)


@router.post("/totp/verify", response_model=MessageResponse)
async def totp_verify(
    payload: TOTPCodePayload,
    current_user: User = Depends(get_current_user),
    totp_service: TOTPService = Depends(get_totp_service),
) -> MessageResponse:
    await totp_service.verify(current_user, payload.code)
    return MessageResponse(detail="TOTP enabled")


@router.post("/totp/disable", response_model=MessageResponse)
async def totp_disable(
    payload: TOTPCodePayload,
    current_user: User = Depends(get_current_user),
    totp_service: TOTPService = Depends(get_totp_service),
) -> MessageResponse:
    await totp_service.disable(current_user, payload.code)
    return MessageResponse(detail="TOTP disabled")
