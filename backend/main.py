import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.auth.router import router as auth_router
from app.core.config import settings
from app.core.database import Base, engine, async_session_maker
from app.core.init_db import init_preset_palettes, init_system_blocks
from app.api.v1 import ai, library, palette, user, projects, user_blocks
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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
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
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(library.router, prefix="/api/library", tags=["Library"])
app.include_router(palette.router, prefix="/api/palette", tags=["Palette"])
app.include_router(user.router, tags=["User"])  # router already has prefix "/api/user"
app.include_router(projects.router, tags=["Projects"])  # router already has prefix "/api/projects"
app.include_router(user_blocks.router, tags=["User Blocks"])  # router already has prefix "/api/user-blocks"
app.include_router(ws_router, tags=["WebSocket"])


@app.get("/")
async def root():
    return {"message": "Constructor Landing API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
