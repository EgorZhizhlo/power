from typing import List, Optional, Dict, Any
from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from sqlalchemy.orm import load_only, noload

from infrastructure.db import async_db_session_begin, async_session
from models import CityModel, VerificationEntryModel
from core.config import settings


class CityRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def get_cities_for_company(
        self, employee_city_ids: Optional[List[int]] = None
    ) -> List[CityModel]:
        stmt = (
            select(CityModel)
            .where(
                CityModel.company_id == self._company_id,
                CityModel.is_deleted.isnot(True),
            )
            .options(
                load_only(
                    CityModel.id,
                    CityModel.name,
                ),
                noload('*')
            )
            .order_by(CityModel.name)
        )

        if employee_city_ids:
            stmt = stmt.where(CityModel.id.in_(employee_city_ids))

        res = await self._session.execute(stmt)
        return res.scalars().all()

    async def get_cities_statistics(
        self,
        date_from: Optional[Any] = None,
        date_to: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        stmt = (
            select(
                CityModel.id,
                CityModel.name,
                # Подсчёт прошедших проверку
                func.count(
                    case(
                        (
                            VerificationEntryModel
                            .verification_result.is_(True),
                            1
                        )
                    )
                ).label('passed'),
                # Подсчёт не прошедших проверку
                func.count(
                    case(
                        (
                            VerificationEntryModel
                            .verification_result.is_(False),
                            1
                        )
                    )
                ).label('failed'),
                # Подсчёт холодной воды
                func.count(
                    case((VerificationEntryModel.water_type == 'cold', 1))
                ).label('cold_water'),
                # Подсчёт горячей воды
                func.count(
                    case((VerificationEntryModel.water_type == 'hot', 1))
                ).label('hot_water'),
                # Подсчёт чекбоксов
                func.count(
                    case(
                        (
                            VerificationEntryModel
                            .additional_checkbox_1.is_(True),
                            1
                        )
                    )
                ).label('checkbox_1'),
                func.count(
                    case(
                        (
                            VerificationEntryModel
                            .additional_checkbox_2.is_(True),
                            1
                        )
                    )
                ).label('checkbox_2'),
                func.count(
                    case(
                        (
                            VerificationEntryModel
                            .additional_checkbox_3.is_(True),
                            1
                        )
                    )
                ).label('checkbox_3'),
                func.count(
                    case(
                        (
                            VerificationEntryModel
                            .additional_checkbox_4.is_(True),
                            1
                        )
                    )
                ).label('checkbox_4'),
                func.count(
                    case(
                        (
                            VerificationEntryModel
                            .additional_checkbox_5.is_(True),
                            1
                        )
                    )
                ).label('checkbox_5'),
            )
            .join(
                VerificationEntryModel,
                CityModel.verifications
            )
            .where(
                CityModel.company_id == self._company_id,
                CityModel.is_deleted.isnot(True)
            )
        )

        # Применяем фильтрацию по датам если указаны
        if date_from:
            stmt = stmt.where(
                VerificationEntryModel.verification_date >= date_from
            )
        if date_to:
            stmt = stmt.where(
                VerificationEntryModel.verification_date <= date_to
            )

        stmt = (
            stmt
            .group_by(
                CityModel.id,
                CityModel.name
            )
            .order_by(
                func.count(
                    case(
                        (
                            VerificationEntryModel
                            .verification_result.is_(True),
                            1
                        )
                    )
                ).desc()
            )
        )

        result = await self._session.execute(stmt)
        rows = result.all()

        # Преобразуем в список словарей
        statistics = []
        for idx, row in enumerate(rows, start=1):
            statistics.append({
                'number': idx,
                'name': row.name,
                'passed': row.passed,
                'failed': row.failed,
                'cold_water': row.cold_water,
                'hot_water': row.hot_water,
                'checkbox_1': row.checkbox_1,
                'checkbox_2': row.checkbox_2,
                'checkbox_3': row.checkbox_3,
                'checkbox_4': row.checkbox_4,
                'checkbox_5': row.checkbox_5,
            })

        return statistics


async def read_city_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_session),
) -> CityRepository:
    return CityRepository(session=session, company_id=company_id)


async def action_city_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> CityRepository:
    return CityRepository(session=session, company_id=company_id)
