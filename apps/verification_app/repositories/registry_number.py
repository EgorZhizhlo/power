from typing import List
from fastapi import Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload, load_only, noload
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from infrastructure.db import async_db_session_begin, async_db_session
from models import (
    RegistryNumberModel, MethodModel, SiModificationModel
)


class RegistryNumberRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def find_by_id(
            self, registry_number_id: int
    ) -> RegistryNumberModel | None:
        q = (
            select(RegistryNumberModel)
            .options(
                load_only(
                    RegistryNumberModel.id,
                    RegistryNumberModel.registry_number,
                    RegistryNumberModel.si_type,
                    RegistryNumberModel.mpi_cold,
                    RegistryNumberModel.mpi_hot
                ),
                selectinload(RegistryNumberModel.method).load_only(
                    MethodModel.id,
                    MethodModel.name
                ),
                selectinload(RegistryNumberModel.modifications).load_only(
                    SiModificationModel.id,
                    SiModificationModel.modification_name
                ),
            )
            .where(
                RegistryNumberModel.company_id == self._company_id,
                RegistryNumberModel.id == registry_number_id,
                RegistryNumberModel.is_deleted.isnot(True),
            )
        )
        res = await self._session.execute(q)
        return res.scalar_one_or_none()

    async def get_registry_number_for_company(
            self
    ) -> List[RegistryNumberModel]:
        stmt = (
            select(RegistryNumberModel)
            .where(
                RegistryNumberModel.company_id == self._company_id,
                RegistryNumberModel.is_deleted.isnot(True)
            )
            .options(
                load_only(
                    RegistryNumberModel.id,
                    RegistryNumberModel.registry_number
                ),
                noload('*')
            )
            .order_by(RegistryNumberModel.registry_number)
        )
        locations = await self._session.execute(stmt)
        return locations.scalars().all()


async def read_registry_number_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session),
) -> RegistryNumberRepository:
    return RegistryNumberRepository(session=session, company_id=company_id)


async def action_registry_number_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> RegistryNumberRepository:
    return RegistryNumberRepository(session=session, company_id=company_id)
