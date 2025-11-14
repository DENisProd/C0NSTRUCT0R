import os
<<<<<<< Updated upstream
from fastapi import FastAPI
=======
import logging
from fastapi import Depends, FastAPI
>>>>>>> Stashed changes
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.auth.router import router as auth_router
from app.auth.dependencies import get_current_user
from app.core.config import settings
from app.core.database import Base, engine, async_session_maker
from app.core.init_db import init_preset_palettes, init_system_blocks
<<<<<<< Updated upstream
from app.api.v1 import ai, library, palette
=======
from app.api.v1 import ai, library, palette, projects, project_media, user, user_blocks
>>>>>>> Stashed changes
from app.ws.rooms import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: создаем таблицы и инициализируем данные при необходимости
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        if os.environ.get("SKIP_DATA_INIT") != "1":
            async with async_session_maker() as session:
                await init_system_blocks(session)
                await init_preset_palettes(session)
    except Exception as e:
        print(f"Предупреждение: не удалось инициализировать системные данные: {e}")
    
    yield
    # Shutdown: очистка ресурсов (если нужно)


app = FastAPI(
    title="Constructor Landing API",
    description="API для конструктора лендингов с LLM интеграцией",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
auth_dependency = [Depends(get_current_user)]
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(library.router, prefix="/api/library", tags=["Library"])
app.include_router(palette.router, prefix="/api/palette", tags=["Palette"])
<<<<<<< Updated upstream
=======
app.include_router(user.router, tags=["User"], dependencies=auth_dependency)
app.include_router(projects.router, tags=["Projects"], dependencies=auth_dependency)
app.include_router(project_media.router, tags=["Projects Media"], dependencies=auth_dependency)
app.include_router(user_blocks.router, tags=["User Blocks"])
>>>>>>> Stashed changes
app.include_router(ws_router, tags=["WebSocket"])


@app.get("/")
async def root():
    return {"message": "Constructor Landing API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
