from typing import List
from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import load_only, noload

from core.config import settings
from infrastructure.db import async_db_session_begin, async_session
from models import LocationModel


class LocationRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def get_locations_for_company(self) -> List[LocationModel]:
        stmt = (
            select(LocationModel)
            .where(
                LocationModel.company_id == self._company_id,
                LocationModel.is_deleted.isnot(True),
            )
            .options(
                load_only(
                    LocationModel.id,
                    LocationModel.name,
                ),
                noload('*')
            )
            .order_by(LocationModel.count.desc().nullslast())
        )

        res = await self._session.execute(stmt)
        return res.scalars().all()

    async def increment_count(self, location_id: int) -> None:
        await self._session.execute(
            update(LocationModel)
            .where(
                LocationModel.id == location_id,
                LocationModel.company_id == self._company_id,
            )
            .values(
                count=func.coalesce(LocationModel.count, 0) + 1
            )
        )

    async def decrement_count(self, location_id: int) -> None:
        await self._session.execute(
            update(LocationModel)
            .where(
                LocationModel.id == location_id,
                LocationModel.company_id == self._company_id,
                LocationModel.count > 0,
            )
            .values(
                count=func.greatest(
                    func.coalesce(LocationModel.count, 0) - 1, 0
                )
            )
        )


async def read_location_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_session),
) -> LocationRepository:
    return LocationRepository(session=session, company_id=company_id)


async def action_location_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> LocationRepository:
    return LocationRepository(session=session, company_id=company_id)
