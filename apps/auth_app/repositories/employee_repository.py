from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import BaseRepository
from models import EmployeeModel
from core.utils.time_utils import datetime_utc_now


class EmployeeRepository(BaseRepository[EmployeeModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(EmployeeModel, session)

    async def get_active_by_username(
        self, username: str
    ) -> Optional[EmployeeModel]:
        stmt = select(self.model).where(
            self.model.username == username,
            self.model.is_active.is_(True),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_login_date(
        self, employee_id: int
    ):
        stmt = (
            update(self.model)
            .where(self.model.id == employee_id)
            .values(last_login=datetime_utc_now())
        )
        await self.session.execute(stmt)
        await self.session.flush()
