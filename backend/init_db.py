#!/usr/bin/env python3
"""
Скрипт для инициализации базы данных
Запуск: python init_db.py
"""
import asyncio

from app.core.database import Base, async_session_maker, engine
from app.core.init_db import init_preset_palettes, init_system_blocks


async def main() -> None:
    print("Создание таблиц...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as session:
        print("Инициализация системных блоков...")
        await init_system_blocks(session)

        print("Инициализация предустановленных палитр...")
        await init_preset_palettes(session)

    print("✅ Инициализация базы данных завершена!")


if __name__ == "__main__":
    asyncio.run(main())
