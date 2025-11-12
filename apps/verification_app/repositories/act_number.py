from typing import List, Optional
from fastapi import Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import load_only, selectinload, noload
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db import async_db_session_begin, async_db_session
from models import (
    ActNumberModel, ActSeriesModel, VerificationEntryModel
)
from core.config import settings


class ActNumberRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def find_by_number(
        self, series_id: int, act_number: int
    ) -> ActNumberModel | None:
        q = (
            select(ActNumberModel)
            .where(
                ActNumberModel.company_id == self._company_id,
                ActNumberModel.act_number == act_number,
                ActNumberModel.series_id == series_id,
                ActNumberModel.is_deleted.isnot(True),
            )
            .options(
                load_only(
                    ActNumberModel.id,
                    ActNumberModel.act_number,
                    ActNumberModel.client_full_name,
                    ActNumberModel.client_phone,
                    ActNumberModel.address,
                    ActNumberModel.verification_date,
                    ActNumberModel.legal_entity,
                    ActNumberModel.city_id,
                ),
                noload('*')
            )
        )

        res = await self._session.execute(q)
        return res.scalar_one_or_none()

    async def get_act_numbers_in_range(
        self,
        series_id: Optional[int],
        act_number_from: Optional[int],
        act_number_to: Optional[int]
    ) -> List[ActNumberModel]:
        """
        Получает номера актов в указанном диапазоне.
        Загружает связанную серию актов для формирования отчета.
        """
        stmt = (
            select(ActNumberModel)
            .where(ActNumberModel.company_id == self._company_id)
            .options(
                selectinload(ActNumberModel.series).load_only(
                    ActSeriesModel.id,
                    ActSeriesModel.name,
                )
            )
            .order_by(ActNumberModel.act_number)
        )

        if series_id:
            stmt = stmt.where(ActNumberModel.series_id == series_id)

        if act_number_from:
            stmt = stmt.where(
                ActNumberModel.act_number >= act_number_from
            )

        if act_number_to:
            stmt = stmt.where(
                ActNumberModel.act_number <= act_number_to
            )

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_or_create_with_verifications(
        self,
        act_number: int,
        series_id: int,
        update_fields: dict,
    ) -> ActNumberModel:
        """
        Получить или создать ActNumber с предзагруженными записями поверок.
        Возвращает объект с relationship verification и equipments.
        Используется при создании записи поверки для проверки лимитов.
        """
        stmt = (
            select(ActNumberModel)
            .where(
                ActNumberModel.company_id == self._company_id,
                ActNumberModel.act_number == act_number,
                ActNumberModel.series_id == series_id,
            )
            .options(
                selectinload(ActNumberModel.verification).selectinload(
                    VerificationEntryModel.equipments
                )
            )
            .with_for_update()
        )

        act_number_obj = await self._session.scalar(stmt)

        if not act_number_obj:
            act_number_obj = ActNumberModel(
                act_number=act_number,
                series_id=series_id,
                company_id=self._company_id,
            )
            # Применяем дополнительные поля через setattr
            for field, value in update_fields.items():
                setattr(act_number_obj, field, value)

            self._session.add(act_number_obj)
            await self._session.flush()
            # Refresh для загрузки пустого relationship
            await self._session.refresh(
                act_number_obj,
                attribute_names=["verification"]
            )
        elif update_fields:
            for field, value in update_fields.items():
                setattr(act_number_obj, field, value)
            await self._session.flush()

        return act_number_obj


async def read_act_number_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session),
) -> ActNumberRepository:
    return ActNumberRepository(session=session, company_id=company_id)


async def action_act_number_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> ActNumberRepository:
    return ActNumberRepository(session=session, company_id=company_id)
