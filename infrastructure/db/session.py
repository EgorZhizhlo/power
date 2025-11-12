from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine, async_sessionmaker, AsyncSession
)

from core.config import settings
from infrastructure.db.base import BaseModel


engine = create_async_engine(
    url=settings.database_url,
    echo=True,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Инициализация подключения к базе данных и создание таблиц."""
    async with engine.begin() as conn:
        await conn.run_sync(BaseModel.metadata.create_all)


async def close_db():
    """Закрытие подключения к базе данных."""
    await engine.dispose()


async def async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Создание обычной сессии для FastAPI."""
    async with async_session_maker() as session:
        yield session


async def async_db_session_begin() -> AsyncGenerator[AsyncSession, None]:
    """Создание сессии с транзакцией для FastAPI."""
    async with async_session_maker() as session:
        async with session.begin():
            yield session
