from typing import Optional, List
from fastapi import Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import load_only, noload
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db import async_db_session_begin, async_db_session
from models import CompanyModel, EmployeeModel
from core.config import settings

from access_control import director_auditor_verifier


class CompanyRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def get_yandex_disk_token(self) -> Optional[CompanyModel]:
        stmt = (
            select(CompanyModel)
            .where(
                CompanyModel.id == self._company_id
            )
            .options(
                load_only(
                    CompanyModel.id,
                    CompanyModel.name,
                    CompanyModel.yandex_disk_token
                ),
                noload('*')
            )
        )

        res = await self._session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_company_params(self) -> Optional[CompanyModel]:
        stmt = (
            select(CompanyModel)
            .where(
                CompanyModel.id == self._company_id
            )
            .options(
                load_only(
                    CompanyModel.id,
                    CompanyModel.verification_date_block,
                    CompanyModel.auto_metrolog,
                    CompanyModel.latitude,
                    CompanyModel.longitude,
                    CompanyModel.default_pressure,
                    CompanyModel.auto_teams,
                    CompanyModel.daily_verifier_verif_limit,
                    CompanyModel.name,
                    CompanyModel.yandex_disk_token,
                ),
                noload('*')
            )
        )

        res = await self._session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_company_additional_and_auto_year(
        self
    ) -> Optional[CompanyModel]:
        stmt = (
            select(
                CompanyModel.id,
                CompanyModel.additional_checkbox_1,
                CompanyModel.additional_checkbox_2,
                CompanyModel.additional_checkbox_3,
                CompanyModel.additional_checkbox_4,
                CompanyModel.additional_checkbox_5,
                CompanyModel.additional_input_1,
                CompanyModel.additional_input_2,
                CompanyModel.additional_input_3,
                CompanyModel.additional_input_4,
                CompanyModel.additional_input_5,
                CompanyModel.auto_manufacture_year,
            )
            .where(CompanyModel.id == self._company_id)
        )

        res = await self._session.execute(stmt)
        return res.mappings().one_or_none()

    async def get_company_additional_checkboxes(
        self
    ) -> Optional[CompanyModel]:
        stmt = (
            select(CompanyModel)
            .where(CompanyModel.id == self._company_id)
            .options(
                load_only(
                    CompanyModel.id,
                    CompanyModel.additional_checkbox_1,
                    CompanyModel.additional_checkbox_2,
                    CompanyModel.additional_checkbox_3,
                    CompanyModel.additional_checkbox_4,
                    CompanyModel.additional_checkbox_5,
                ),
                noload('*')
            )
        )

        res = await self._session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_companies_for_user(
        self, employee_id: int, status: str
    ) -> List[CompanyModel]:
        stmt = (
            select(
                CompanyModel.id,
                CompanyModel.name
            )
            .order_by(CompanyModel.name)
        )

        if status in director_auditor_verifier:
            stmt = (
                stmt.join(CompanyModel.employees)
                .where(EmployeeModel.id == employee_id)
            )

        res = await self._session.execute(stmt)
        return res.mappings().all()


async def read_company_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session),
) -> CompanyRepository:
    return CompanyRepository(session=session, company_id=company_id)


async def action_company_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> CompanyRepository:
    return CompanyRepository(session=session, company_id=company_id)
