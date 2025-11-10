from fastapi import Depends
from typing import List, Dict
from datetime import date as date_
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db import async_db_session_begin
from models import VerificationLogModel


class VerificationLogRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_for_update(
            self, verifier_id: int, verification_date
    ) -> VerificationLogModel | None:
        q = (
            select(VerificationLogModel)
            .where(
                VerificationLogModel.verifier_id == verifier_id,
                VerificationLogModel.verification_date == verification_date,
            )
            .with_for_update()
        )
        res = await self._session.execute(q)
        return res.scalar_one_or_none()

    async def get_or_create_logs_batch(
        self,
        verifier_ids: List[int],
        dates: List[date_],
        verification_limit: int,
    ) -> Dict[tuple[int, date_], VerificationLogModel]:
        """
        Получить или создать логи для нескольких поверителей и дат.
        Возвращает словарь {(verifier_id, date): log}.
        Используется для batch операций при выборе поверителя.
        """
        if not verifier_ids or not dates:
            return {}

        # Получаем существующие логи одним запросом
        stmt = (
            select(VerificationLogModel)
            .where(
                VerificationLogModel.verifier_id.in_(verifier_ids),
                VerificationLogModel.verification_date.in_(dates),
            )
            .with_for_update()
        )
        existing_logs = (await self._session.scalars(stmt)).all()

        # Индексируем существующие логи
        logs_dict: Dict[tuple[int, date_], VerificationLogModel] = {
            (log.verifier_id, log.verification_date): log
            for log in existing_logs
        }

        # Создаем недостающие логи
        new_logs = []
        for verifier_id in verifier_ids:
            for date in dates:
                key = (verifier_id, date)
                if key not in logs_dict:
                    log = VerificationLogModel(
                        verification_limit=verification_limit,
                        verification_date=date,
                        verifier_id=verifier_id,
                    )
                    new_logs.append(log)
                    logs_dict[key] = log

        if new_logs:
            self._session.add_all(new_logs)
            await self._session.flush()

        return logs_dict

    async def get_logs_for_verifier(
        self,
        verifier_id: int,
        dates: List[date_],
        verification_limit: int,
    ) -> List[VerificationLogModel]:
        """
        Получить или создать логи для одного поверителя на несколько дат.
        Используется в логике выбора поверителя.
        """
        if not dates:
            return []

        stmt = (
            select(VerificationLogModel)
            .where(
                VerificationLogModel.verifier_id == verifier_id,
                VerificationLogModel.verification_date.in_(dates),
            )
            .with_for_update()
        )
        existing_logs = (await self._session.scalars(stmt)).all()
        existing_by_date = {
            log.verification_date: log for log in existing_logs
        }

        result: List[VerificationLogModel] = []

        for v_date in dates:
            log = existing_by_date.get(v_date)
            if not log:
                log = VerificationLogModel(
                    verification_limit=verification_limit,
                    verification_date=v_date,
                    verifier_id=verifier_id,
                )
                self._session.add(log)
                await self._session.flush()

            existing_by_date[v_date] = log
            result.append(log)

        return result


async def action_verification_log_repository(
    session: AsyncSession = Depends(async_db_session_begin),
) -> VerificationLogRepository:
    return VerificationLogRepository(session=session)
