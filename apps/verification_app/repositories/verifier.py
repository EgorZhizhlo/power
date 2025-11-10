from fastapi import Depends, Query
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from infrastructure.db import async_db_session_begin, async_session
from models import (
    EquipmentModel, VerifierModel, EmployeeModel, TeamModel)
from core.config import settings


class VerifierRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def default_verifier_for_create(
            self, employee_id: int
    ) -> Optional[VerifierModel]:
        stmt = (
            select(VerifierModel)
            .outerjoin(EmployeeModel)
            .where(
                EmployeeModel.id == employee_id,
                VerifierModel.company_id == self._company_id,
                VerifierModel.is_deleted.isnot(True),
            )
            .options(
                selectinload(VerifierModel.equipments).joinedload(
                    EquipmentModel.equipment_info
                )
            )
        )

        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_verifier_by_id(
            self, verifier_id: int) -> VerifierModel | None:
        if verifier_id is None:
            return None
        stmt = (
            select(VerifierModel)
            .where(
                VerifierModel.company_id == self._company_id,
                VerifierModel.is_deleted.isnot(True),
                VerifierModel.id == verifier_id,
            )
            .options(
                selectinload(VerifierModel.equipments).joinedload(
                    EquipmentModel.equipment_info
                )
            )
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def get_verifiers_by_team(
        self, team_id: int, exclude_verifier_id: Optional[int] = None
    ) -> List[VerifierModel]:
        """
        Получить всех поверителей команды (опционально исключая одного).
        Используется для выбора альтернативного поверителя из той же команды.
        """
        stmt = (
            select(VerifierModel)
            .where(
                VerifierModel.team_id == team_id,
                VerifierModel.company_id == self._company_id,
                VerifierModel.is_deleted.isnot(True),
            )
            .options(
                selectinload(VerifierModel.equipments).joinedload(
                    EquipmentModel.equipment_info
                )
            )
            .order_by(
                VerifierModel.last_name,
                VerifierModel.name,
                VerifierModel.patronymic
            )
        )

        if exclude_verifier_id:
            stmt = stmt.where(VerifierModel.id != exclude_verifier_id)

        result = await self._session.scalars(stmt)
        return list(result.all())

    async def get_verifiers_without_team(
        self, exclude_verifier_id: Optional[int] = None
    ) -> List[VerifierModel]:
        """
        Получить поверителей без команды.
        Используется для выбора поверителя из пула не привязанных к командам.
        """
        stmt = (
            select(VerifierModel)
            .where(
                VerifierModel.company_id == self._company_id,
                VerifierModel.team_id.is_(None),
                VerifierModel.is_deleted.isnot(True),
            )
            .options(
                selectinload(VerifierModel.equipments).joinedload(
                    EquipmentModel.equipment_info
                )
            )
            .order_by(
                VerifierModel.last_name,
                VerifierModel.name,
                VerifierModel.patronymic
            )
        )

        if exclude_verifier_id:
            stmt = stmt.where(VerifierModel.id != exclude_verifier_id)

        result = await self._session.scalars(stmt)
        return list(result.all())

    async def get_teams_with_verifiers(
        self, exclude_team_id: Optional[int] = None
    ) -> List[TeamModel]:
        """
        Получить все команды с поверителями.
        Используется для поиска поверителя из других команд.
        """
        stmt = (
            select(TeamModel)
            .where(
                TeamModel.company_id == self._company_id,
                TeamModel.is_deleted.isnot(True),
            )
            .options(
                selectinload(TeamModel.verifiers).selectinload(
                    VerifierModel.equipments
                ).joinedload(EquipmentModel.equipment_info)
            )
            .order_by(
                VerifierModel.last_name,
                VerifierModel.name,
                VerifierModel.patronymic
            )
        )

        if exclude_team_id:
            stmt = stmt.where(TeamModel.id != exclude_team_id)

        result = await self._session.scalars(stmt)
        return list(result.all())

    async def get_verifier_equipments(
        self, verifier_id: int
    ) -> List[EquipmentModel]:
        """
        Получить оборудование поверителя для назначения.
        Используется при смене поверителя в записях поверки.
        """
        stmt = (
            select(EquipmentModel)
            .where(
                EquipmentModel.verifiers.any(
                    VerifierModel.id == verifier_id
                )
            )
        )
        result = await self._session.scalars(stmt)
        return list(result.all())


async def read_verifier_repository(
        company_id: int = Query(..., ge=1, le=settings.max_int),
        session: AsyncSession = Depends(async_session),
) -> VerifierRepository:
    return VerifierRepository(session=session, company_id=company_id)


async def action_verifier_repository(
        company_id: int = Query(..., ge=1, le=settings.max_int),
        session: AsyncSession = Depends(async_db_session_begin),
) -> VerifierRepository:
    return VerifierRepository(session=session, company_id=company_id)
