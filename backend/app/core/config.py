from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://constructor:constructor@localhost:5432/constructor"
    API_BASE_URL: str = "http://localhost:8000"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8081",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
    ]
    JWT_SECRET_KEY: str = "change_me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    @field_validator("CORS_ORIGINS", mode="before")
    def _parse_cors_origins(cls, v):
        # Поддержка формата в .env: CORS_ORIGINS=http://a,http://b
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v


settings = Settings()
