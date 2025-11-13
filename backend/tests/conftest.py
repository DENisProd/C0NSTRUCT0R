import os
import sys

import pytest
from asgi_lifespan import LifespanManager
from httpx import AsyncClient, ASGITransport

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault("SKIP_DATA_INIT", "1")
os.environ.setdefault("SQLALCHEMY_NULLPOOL", "1")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://constructor:constructor@localhost:5432/constructor",
)

from main import app  # noqa: E402
from app.core.database import Base, engine  # noqa: E402


async def _reset_database() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


@pytest.fixture
async def client():
    await _reset_database()
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
            yield ac
