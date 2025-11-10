from typing import List
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db import async_session
from models.associations import employees_cities


class EmployeeCitiesRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_cities_id(
            self, employee_id: int
    ) -> List[int]:
        employee_city_ids = (
            await self._session.execute(
                select(employees_cities.c.city_id)
                .where(employees_cities.c.employee_id == employee_id)
            )
        ).scalars().all()
        return employee_city_ids


async def read_employee_cities_repository(
    session: AsyncSession = Depends(async_session),
) -> EmployeeCitiesRepository:
    return EmployeeCitiesRepository(session=session)
