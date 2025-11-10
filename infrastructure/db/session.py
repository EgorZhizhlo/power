from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine, async_sessionmaker, AsyncSession
)

from core.config import settings


engine = create_async_engine(
    url=settings.DATABASE_URL,
    echo=True,  # можно включить True для отладки
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Зависимость для FastAPI — обычная сессия
async def async_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


# Зависимость для FastAPI — сессия с транзакцией
async def async_db_session_begin() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        async with session.begin():
            yield session
