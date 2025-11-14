from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    totp_code: str | None = Field(default=None, min_length=6, max_length=8)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class PasswordChangePayload(PasswordChangeRequest):
    confirm_new_password: str = Field(..., min_length=8, max_length=128)


class UserResponse(UserBase):
    id: int
    has_avatar: bool
    totp_enabled: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class MessageResponse(BaseModel):
    detail: str


class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: Optional[datetime] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    projects_count: int
    blocks_count: int
    totp_enabled: bool


class TOTPSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
    issuer: str
    label: str


class TOTPCodePayload(BaseModel):
    code: str = Field(..., min_length=6, max_length=8)
