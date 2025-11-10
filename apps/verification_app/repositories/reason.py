from typing import List
from fastapi import Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import load_only, noload
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db import async_db_session_begin, async_session
from models import ReasonModel
from models.enums import ReasonType
from core.config import settings


class ReasonRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def get_reason_id_by_type(
        self,
        reason_type: ReasonType,
    ) -> int | None:
        stmt = (
            select(ReasonModel.id)
            .where(
                ReasonModel.company_id == self._company_id,
                ReasonModel.type == reason_type,
                ReasonModel.is_deleted.isnot(True),
            )
            .limit(1)
        )
        return await self._session.scalar(stmt)

    async def get_reasons_for_company(self) -> List[ReasonModel]:
        stmt = (
            select(ReasonModel)
            .where(
                ReasonModel.company_id == self._company_id,
                ReasonModel.is_deleted.isnot(True),
            )
            .options(
                load_only(
                    ReasonModel.id,
                    ReasonModel.name,
                ),
                noload('*')
            )
            .order_by(ReasonModel.name)
        )
        res = await self._session.execute(stmt)
        return res.scalars().all()


async def read_reason_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_session),
) -> ReasonRepository:
    return ReasonRepository(session=session, company_id=company_id)


async def action_reason_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> ReasonRepository:
    return ReasonRepository(session=session, company_id=company_id)
