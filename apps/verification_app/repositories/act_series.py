from typing import List
from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import load_only, noload

from infrastructure.db import async_db_session_begin, async_db_session
from models import ActSeriesModel
from core.config import settings


class ActSeriesRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def get_act_series_for_company(self) -> List[ActSeriesModel]:
        stmt = (
            select(ActSeriesModel)
            .where(
                ActSeriesModel.company_id == self._company_id,
                ActSeriesModel.is_deleted.isnot(True),
            )
            .options(
                load_only(
                    ActSeriesModel.id,
                    ActSeriesModel.name,
                ),
                noload('*')
            )
            .order_by(ActSeriesModel.name)
        )

        res = await self._session.execute(stmt)
        return res.scalars().all()

    async def get_series_for_report(
        self, series_id: int = None
    ) -> List[ActSeriesModel]:
        stmt = (
            select(ActSeriesModel)
            .where(ActSeriesModel.company_id == self._company_id)
            .options(
                load_only(
                    ActSeriesModel.id,
                    ActSeriesModel.name,
                ),
                noload('*')
            )
            .order_by(ActSeriesModel.name)
        )

        if series_id:
            stmt = stmt.where(ActSeriesModel.id == series_id)

        result = await self._session.execute(stmt)
        return result.scalars().all()


async def read_act_series_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session),
) -> ActSeriesRepository:
    return ActSeriesRepository(session=session, company_id=company_id)


async def action_act_series_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> ActSeriesRepository:
    return ActSeriesRepository(session=session, company_id=company_id)
