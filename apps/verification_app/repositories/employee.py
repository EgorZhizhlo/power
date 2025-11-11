from typing import Optional, Tuple, List, Dict, Any
from fastapi import Depends, Query
from sqlalchemy import select, func, case
from sqlalchemy.orm import load_only, noload
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db import async_db_session_begin, async_db_session
from models import (
    EmployeeModel, CompanyModel, VerificationEntryModel
)
from core.config import settings


class EmployeeRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def get_default_fields(
        self, employee_id: int
    ) -> Optional[Tuple[Optional[int], Optional[int]]]:
        stmt = (
            select(EmployeeModel)
            .where(
                EmployeeModel.id == employee_id,
                EmployeeModel.is_active.is_(True),
            )
            .options(
                load_only(
                    EmployeeModel.default_city_id,
                    EmployeeModel.series_id,
                ),
                noload('*')
            )
        )

        result = await self._session.execute(stmt)
        employee = result.scalar_one_or_none()

        if not employee:
            return None

        return employee.default_city_id, employee.series_id

    async def get_employees_statistics(
        self,
        date_from: Optional[Any] = None,
        date_to: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Получает статистику по сотрудникам с агрегацией на уровне SQL.
        Возвращает список словарей с подсчитанными данными.
        
        Args:
            date_from: Начальная дата фильтрации (опционально)
            date_to: Конечная дата фильтрации (опционально)
        """
        stmt = (
            select(
                EmployeeModel.id,
                EmployeeModel.last_name,
                EmployeeModel.name,
                EmployeeModel.patronymic,
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
                EmployeeModel.verifications
            )
            .where(
                EmployeeModel.companies.any(
                    CompanyModel.id == self._company_id
                ),
                EmployeeModel.default_verifier_id.isnot(None),
                EmployeeModel.status.in_(settings.ACCESS_VERIFICATION),
                VerificationEntryModel.company_id == self._company_id
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
                EmployeeModel.id,
                EmployeeModel.last_name,
                EmployeeModel.name,
                EmployeeModel.patronymic
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
                'name': f"{row.last_name} {row.name} {row.patronymic}",
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


async def read_employee_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session),
) -> EmployeeRepository:
    return EmployeeRepository(session=session, company_id=company_id)


async def action_employee_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> EmployeeRepository:
    return EmployeeRepository(session=session, company_id=company_id)
