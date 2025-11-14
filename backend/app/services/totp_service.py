from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import pyotp

from app.core.config import settings
from app.models.user import User


class TOTPService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _ensure_feature_enabled(self) -> None:
        if not settings.ENABLE_TOTP:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP disabled")

    @staticmethod
    def _generate_secret() -> str:
        return pyotp.random_base32()

    @staticmethod
    def _get_totp(secret: str) -> pyotp.TOTP:
        return pyotp.TOTP(secret)

    async def initiate(self, user: User) -> dict:
        self._ensure_feature_enabled()
        secret = self._generate_secret()
        user.totp_secret = secret
        user.totp_enabled = False
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        totp = self._get_totp(secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name=settings.TOTP_ISSUER)
        return {
            "secret": secret,
            "provisioning_uri": uri,
            "issuer": settings.TOTP_ISSUER,
            "label": user.email,
        }

    async def verify(self, user: User, code: str) -> None:
        self._ensure_feature_enabled()
        if not user.totp_secret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP not initialized")
        if not self._get_totp(user.totp_secret).verify(code, valid_window=1):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP code")
        user.totp_enabled = True
        self.db.add(user)
        await self.db.commit()

    async def disable(self, user: User, code: str) -> None:
        self._ensure_feature_enabled()
        if not user.totp_secret or not user.totp_enabled:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP not enabled")
        if not self._get_totp(user.totp_secret).verify(code, valid_window=1):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP code")
        user.totp_secret = None
        user.totp_enabled = False
        self.db.add(user)
        await self.db.commit()

    @staticmethod
    def require_login_code(user: User, code: str | None) -> None:
        if not settings.ENABLE_TOTP or not user.totp_enabled:
            return
        if not user.totp_secret:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP misconfigured")
        if not code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP code required")
        if not TOTPService._get_totp(user.totp_secret).verify(code, valid_window=1):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP code")
