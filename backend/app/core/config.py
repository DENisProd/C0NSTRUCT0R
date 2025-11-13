from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from typing import List, Optional, Union


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://constructor:constructor@localhost:5432/constructor"
    API_BASE_URL: str = "http://localhost:8000"
    
    # Frontend configuration
    FRONTEND_PORT: int = 5173
    FRONTEND_URL: Optional[str] = None  # Если указан, используется вместо порта

    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    CORS_ORIGINS: Union[List[str], str] = []
    JWT_SECRET_KEY: str = "change_me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    @field_validator("CORS_ORIGINS", mode="before")
    def _parse_cors_origins(cls, v):
        if isinstance(v, str):
            parsed = [s.strip() for s in v.split(",") if s.strip()]
            if parsed:
                return parsed
            return []
        if isinstance(v, list):
            return v
        return []
    
    @model_validator(mode="after")
    def _set_default_cors_origins(self):
        # Если CORS_ORIGINS не указан, генерируем из FRONTEND_URL или FRONTEND_PORT
        if not self.CORS_ORIGINS:
            if self.FRONTEND_URL:
                self.CORS_ORIGINS = [self.FRONTEND_URL]
            else:
                self.CORS_ORIGINS = [
                    f"http://localhost:{self.FRONTEND_PORT}",
                    f"http://127.0.0.1:{self.FRONTEND_PORT}",
                ]
        return self


settings = Settings()
