from typing import List, Dict, Any, Optional
from fastapi import Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload, load_only
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db import async_db_session, async_db_session_begin
from models import (
    VerificationEntryModel,
    ActNumberModel,
    CityModel,
    EmployeeModel,
    VerifierModel,
    RegistryNumberModel,
    SiModificationModel,
    LocationModel,
    ActSeriesModel,
    MethodModel,
    ReasonModel,
    CompanyModel,
    VerificationReportModel,
    MetrologInfoModel,
    EquipmentModel,
)
from core.config import settings
from apps.verification_app.common.filter_functions import entry_filter


class ReportRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def get_company_additional_fields(self) -> Dict[str, Any]:
        """
        Получает дополнительные поля компании (checkbox и input).
        Использует load_only для оптимизации.
        """
        stmt = (
            select(CompanyModel)
            .where(CompanyModel.id == self._company_id)
            .options(
                load_only(
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
                )
            )
        )
        result = await self._session.execute(stmt)
        company = result.scalar_one_or_none()

        if not company:
            return {}

        return {
            'additional_checkbox_1': company.additional_checkbox_1,
            'additional_checkbox_2': company.additional_checkbox_2,
            'additional_checkbox_3': company.additional_checkbox_3,
            'additional_checkbox_4': company.additional_checkbox_4,
            'additional_checkbox_5': company.additional_checkbox_5,
            'additional_input_1': company.additional_input_1,
            'additional_input_2': company.additional_input_2,
            'additional_input_3': company.additional_input_3,
            'additional_input_4': company.additional_input_4,
            'additional_input_5': company.additional_input_5,
        }

    async def get_full_report_entries(
        self,
        filter_data: Any
    ) -> List[VerificationEntryModel]:
        """
        Получает записи поверок для полного отчета с оптимизированной загрузкой.
        Использует selectinload для связей many-to-one и joinedload для one-to-one.
        """
        stmt = (
            select(VerificationEntryModel)
            .where(VerificationEntryModel.company_id == self._company_id)
            .options(
                # Сотрудник - many-to-one, selectinload
                selectinload(VerificationEntryModel.employee).load_only(
                    EmployeeModel.last_name,
                    EmployeeModel.name,
                    EmployeeModel.patronymic,
                ),
                # Поверитель - many-to-one, selectinload
                selectinload(VerificationEntryModel.verifier).load_only(
                    VerifierModel.last_name,
                    VerifierModel.name,
                    VerifierModel.patronymic,
                ),
                # Город напрямую - many-to-one, selectinload
                selectinload(VerificationEntryModel.city).load_only(
                    CityModel.name,
                ),
                # Act number с городом - joinedload
                joinedload(VerificationEntryModel.act_number).load_only(
                    ActNumberModel.address,
                    ActNumberModel.client_full_name,
                    ActNumberModel.act_number,
                    ActNumberModel.client_phone,
                    ActNumberModel.legal_entity,
                ).joinedload(ActNumberModel.city).load_only(
                    CityModel.name,
                ),
                # Номер реестра - many-to-one, selectinload
                selectinload(VerificationEntryModel.registry_number).load_only(
                    RegistryNumberModel.registry_number,
                    RegistryNumberModel.si_type,
                ),
                # Модификация - many-to-one, selectinload
                selectinload(VerificationEntryModel.modification).load_only(
                    SiModificationModel.modification_name,
                ),
                # Местоположение - many-to-one, selectinload
                selectinload(VerificationEntryModel.location).load_only(
                    LocationModel.name,
                ),
                # Серия акта - many-to-one, selectinload
                selectinload(VerificationEntryModel.series).load_only(
                    ActSeriesModel.name,
                ),
                # Методика - many-to-one, selectinload
                selectinload(VerificationEntryModel.method).load_only(
                    MethodModel.name,
                ),
                # Причина - many-to-one, selectinload
                selectinload(VerificationEntryModel.reason).load_only(
                    ReasonModel.full_name,
                ),
                # Загружаем только необходимые поля самой записи
                load_only(
                    VerificationEntryModel.verification_date,
                    VerificationEntryModel.end_verification_date,
                    VerificationEntryModel.factory_number,
                    VerificationEntryModel.meter_info,
                    VerificationEntryModel.verification_result,
                    VerificationEntryModel.water_type,
                    VerificationEntryModel.seal,
                    VerificationEntryModel.manufacture_year,
                    VerificationEntryModel.verification_number,
                    VerificationEntryModel.ra_status,
                    VerificationEntryModel.interval,
                    VerificationEntryModel.city_id,  # Нужен для relationship
                    VerificationEntryModel.employee_id,  # Нужен для relationship
                    VerificationEntryModel.act_number_id,  # Нужен для relationship
                    VerificationEntryModel.registry_number_id,  # Нужен для relationship
                    VerificationEntryModel.modification_id,  # Нужен для relationship
                    VerificationEntryModel.location_id,  # Нужен для relationship
                    VerificationEntryModel.series_id,  # Нужен для relationship
                    VerificationEntryModel.method_id,  # Нужен для relationship
                    VerificationEntryModel.reason_id,  # Нужен для relationship
                    VerificationEntryModel.verifier_id,  # Нужен для relationship
                    VerificationEntryModel.additional_checkbox_1,
                    VerificationEntryModel.additional_checkbox_2,
                    VerificationEntryModel.additional_checkbox_3,
                    VerificationEntryModel.additional_checkbox_4,
                    VerificationEntryModel.additional_checkbox_5,
                    VerificationEntryModel.additional_input_1,
                    VerificationEntryModel.additional_input_2,
                    VerificationEntryModel.additional_input_3,
                    VerificationEntryModel.additional_input_4,
                    VerificationEntryModel.additional_input_5,
                ),
            )
            .order_by(
                VerificationEntryModel.verification_date.desc(),
                VerificationEntryModel.act_number_id.asc(),
                VerificationEntryModel.water_type.asc()
            )
        )

        # Применяем фильтры
        stmt = await entry_filter(stmt, filter_data)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_dynamic_report_config(
        self,
        report_id: int
    ) -> Optional[VerificationReportModel]:
        stmt = (
            select(VerificationReportModel)
            .where(
                VerificationReportModel.company_id == self._company_id,
                VerificationReportModel.id == report_id
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_dynamic_report_entries(
        self,
        report_config: VerificationReportModel,
        filter_data: Any,
        employee_filter_id: Optional[int] = None
    ) -> List[VerificationEntryModel]:
        stmt = (
            select(VerificationEntryModel)
            .where(VerificationEntryModel.company_id == self._company_id)
            .options(
                selectinload(VerificationEntryModel.employee).load_only(
                    EmployeeModel.last_name,
                    EmployeeModel.name,
                    EmployeeModel.patronymic,
                ),
                selectinload(VerificationEntryModel.verifier).load_only(
                    VerifierModel.last_name,
                    VerifierModel.name,
                    VerifierModel.patronymic,
                ),
                joinedload(VerificationEntryModel.act_number).load_only(
                    ActNumberModel.address,
                    ActNumberModel.client_full_name,
                    ActNumberModel.act_number,
                    ActNumberModel.client_phone,
                ).joinedload(ActNumberModel.city).load_only(
                    CityModel.name
                ),
                selectinload(VerificationEntryModel.registry_number).load_only(
                    RegistryNumberModel.registry_number,
                    RegistryNumberModel.si_type
                ),
                selectinload(VerificationEntryModel.modification).load_only(
                    SiModificationModel.modification_name
                ),
                selectinload(VerificationEntryModel.location).load_only(
                    LocationModel.name
                ),
                selectinload(VerificationEntryModel.series).load_only(
                    ActSeriesModel.name
                ),
                selectinload(VerificationEntryModel.method).load_only(
                    MethodModel.name
                ),
                selectinload(VerificationEntryModel.reason).load_only(
                    ReasonModel.full_name
                ),
                joinedload(VerificationEntryModel.metrolog).load_only(
                    MetrologInfoModel.qh
                ),
                selectinload(VerificationEntryModel.equipments).load_only(
                    EquipmentModel.type,
                    EquipmentModel.list_number
                ),
            )
        )

        if employee_filter_id:
            stmt = stmt.where(
                VerificationEntryModel.employee_id == employee_filter_id
            )

        for n in range(1, 6):
            cb_key = f"additional_checkbox_{n}"
            if getattr(report_config, cb_key, None) is True:
                column_attr = getattr(VerificationEntryModel, cb_key, None)
                if column_attr is not None:
                    stmt = stmt.where(column_attr.is_(True))

        stmt = await entry_filter(stmt, filter_data)

        stmt = stmt.order_by(
            VerificationEntryModel.verification_date.desc(),
            VerificationEntryModel.act_number_id.asc(),
            VerificationEntryModel.water_type.asc()
        )

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_equipment_statistics_entries(
        self,
        filter_data: Any
    ) -> List[VerificationEntryModel]:
        stmt = (
            select(VerificationEntryModel)
            .where(VerificationEntryModel.company_id == self._company_id)
            .options(
                selectinload(VerificationEntryModel.verifier).load_only(
                    VerifierModel.last_name,
                ),
                selectinload(VerificationEntryModel.equipments).load_only(
                    EquipmentModel.type,
                    EquipmentModel.factory_number,
                ),
                load_only(
                    VerificationEntryModel.verification_date,
                ),
            )
        )

        stmt = await entry_filter(stmt, filter_data)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_fund_report_entries(
        self,
        filter_data: Any
    ) -> List[VerificationEntryModel]:
        stmt = (
            select(VerificationEntryModel)
            .where(VerificationEntryModel.company_id == self._company_id)
            .options(
                selectinload(VerificationEntryModel.verifier),
                selectinload(VerificationEntryModel.equipments).load_only(
                    EquipmentModel.type,
                    EquipmentModel.list_number,
                    EquipmentModel.register_number,
                    EquipmentModel.factory_number,
                ),
                selectinload(VerificationEntryModel.registry_number).load_only(
                    RegistryNumberModel.registry_number,
                ),
                selectinload(VerificationEntryModel.method).load_only(
                    MethodModel.name,
                ),
                selectinload(VerificationEntryModel.modification).load_only(
                    SiModificationModel.modification_name,
                ),
                selectinload(VerificationEntryModel.reason).load_only(
                    ReasonModel.full_name,
                ),
                joinedload(VerificationEntryModel.act_number).load_only(
                    ActNumberModel.legal_entity,
                    ActNumberModel.client_full_name,
                ),
                joinedload(VerificationEntryModel.metrolog).load_only(
                    MetrologInfoModel.after_air_temperature,
                    MetrologInfoModel.after_pressure,
                    MetrologInfoModel.after_humdity,
                    MetrologInfoModel.after_water_temperature,
                ),
                load_only(
                    VerificationEntryModel.factory_number,
                    VerificationEntryModel.manufacture_year,
                    VerificationEntryModel.verification_date,
                    VerificationEntryModel.end_verification_date,
                    VerificationEntryModel.verification_result,
                    VerificationEntryModel.legal_entity,
                ),
            )
        )

        stmt = await entry_filter(stmt, filter_data)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_ra_report_entries(
        self,
        filter_data: Any
    ) -> List[VerificationEntryModel]:
        stmt = (
            select(VerificationEntryModel)
            .where(
                VerificationEntryModel.verification_number.isnot(None),
                VerificationEntryModel.company_id == self._company_id
            )
            .options(
                selectinload(VerificationEntryModel.verifier).load_only(
                    VerifierModel.last_name,
                    VerifierModel.name,
                    VerifierModel.patronymic,
                    VerifierModel.snils,
                ),
                selectinload(VerificationEntryModel.registry_number).load_only(
                    RegistryNumberModel.si_type,
                ),
                selectinload(VerificationEntryModel.modification).load_only(
                    SiModificationModel.modification_name,
                ),
                load_only(
                    VerificationEntryModel.verification_number,
                    VerificationEntryModel.verification_date,
                    VerificationEntryModel.end_verification_date,
                    VerificationEntryModel.verification_result,
                ),
            )
        )

        stmt = await entry_filter(stmt, filter_data)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_organization_code(self) -> Optional[str]:
        stmt = (
            select(CompanyModel.organization_code)
            .where(CompanyModel.id == self._company_id)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_ra_status(
        self,
        entry_ids: List[int],
        status_text: str
    ) -> None:
        stmt = (
            select(VerificationEntryModel)
            .where(VerificationEntryModel.id.in_(entry_ids))
            .options(load_only(VerificationEntryModel.id))
        )
        result = await self._session.execute(stmt)
        entries = result.scalars().all()

        for entry in entries:
            entry.ra_status = status_text

        await self._session.flush()


async def read_report_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session),
) -> ReportRepository:
    return ReportRepository(session=session, company_id=company_id)


async def action_report_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> ReportRepository:
    return ReportRepository(session=session, company_id=company_id)
