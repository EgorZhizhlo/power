from fastapi import Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import load_only, noload
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db import async_db_session_begin, async_db_session
from models import OrderModel, CompanyModel
from core.config import settings
from core.exceptions import CustomVerificationDateBlockException


class OrderRepository:
    def __init__(self, session: AsyncSession, company_id: int):
        self._session = session
        self._company_id = company_id

    async def get_order_city_id(
        self, order_id: int
    ) -> int | None:
        """Получает city_id заказа по его ID."""
        stmt = (
            select(OrderModel.city_id)
            .where(
                OrderModel.company_id == self._company_id,
                OrderModel.id == order_id
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_order_by_id(
        self, order_id: int
    ) -> OrderModel | None:
        """Получает заказ по ID с ограниченным набором полей."""
        stmt = (
            select(OrderModel)
            .where(
                OrderModel.company_id == self._company_id,
                OrderModel.id == order_id
            )
            .options(
                load_only(
                    OrderModel.id,
                    OrderModel.company_id,
                    OrderModel.date,
                    OrderModel.city_id,
                    OrderModel.address,
                    OrderModel.client_full_name,
                    OrderModel.phone_number,
                    OrderModel.legal_entity,
                    OrderModel.additional_info,
                ),
                noload('*')
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def check_verification_date_block(self, order_id: int) -> None:
        stmt = (
            select(CompanyModel.id)
            .where(
                CompanyModel.id == self._company_id,
                CompanyModel.verification_date_block >= (
                    select(OrderModel.date)
                    .where(
                        OrderModel.company_id == self._company_id,
                        OrderModel.id == order_id,
                    )
                    .scalar_subquery()
                ),
            )
        )
        result = await self._session.execute(stmt)
        if not result.scalar_one_or_none():
            raise CustomVerificationDateBlockException(
                company_id=self._company_id
            )


async def read_order_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session),
) -> OrderRepository:
    return OrderRepository(session=session, company_id=company_id)


async def action_order_repository(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    session: AsyncSession = Depends(async_db_session_begin),
) -> OrderRepository:
    return OrderRepository(session=session, company_id=company_id)
