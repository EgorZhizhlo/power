from typing import List
from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from infrastructure.db import async_db_session_begin, async_session
from models import EquipmentModel, VerifierModel


class EquipmentRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def get_valid_equipments(
            self, verifier_id: int
    ) -> List[EquipmentModel]:
        stmt = (
            select(EquipmentModel)
            .join(VerifierModel.equipments)
            .where(
                VerifierModel.id == verifier_id,
                VerifierModel.company_id == self._company_id,
                VerifierModel.is_deleted.isnot(True),
            )
        )

        result = await self._session.execute(stmt)
        return result.scalars().all()


async def read_equipment_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_session),
) -> EquipmentRepository:
    return EquipmentRepository(session=session, company_id=company_id)


async def action_equipment_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> EquipmentRepository:
    return EquipmentRepository(session=session, company_id=company_id)
