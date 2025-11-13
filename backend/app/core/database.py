import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine_options = {"echo": True, "future": True}
if os.environ.get("SQLALCHEMY_NULLPOOL") == "1":
    engine_options["poolclass"] = NullPool

engine = create_async_engine(settings.DATABASE_URL, **engine_options)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
