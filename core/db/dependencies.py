from typing import Optional
from fastapi import Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.cache.company_timezone_cache import company_tz_cache
from core.config import settings


async def get_company_timezone(
    company_id: int = Query(..., ge=1, le=settings.max_int)
) -> str:
    """
    Dependency для получения timezone компании из кеша/БД.
    """
    return await company_tz_cache.get_timezone(company_id)


async def get_company_timezone_optional(
    company_id: Optional[int] = Query(None, ge=1, le=settings.max_int)
) -> str:
    """
    Dependency для получения timezone компании (опциональный company_id).
    """
    if company_id:
        return await company_tz_cache.get_timezone(company_id)

    return "Europe/Moscow"


async def get_company_timezone_from_session(
    company_id: int,
    session: AsyncSession
) -> str:
    """
    Вспомогательная функция для получения timezone с передачей сессии.
    """
    return await company_tz_cache.get_timezone(company_id, session)
