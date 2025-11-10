from typing import List, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import BaseRepository
from models import CompanyModel, EmployeeModel


class CompanyRepository(BaseRepository[CompanyModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(CompanyModel, session)

    async def get_companies_info_for_token(
        self, employee_id: int
    ) -> Tuple[List[int], List[int]]:
        stmt = (
            select(self.model.id, self.model.is_active)
            .where(self.model.employees.any(EmployeeModel.id == employee_id))
            .order_by(self.model.id)
        )
        result = await self.session.execute(stmt)
        rows = result.all()

        all_ids = [company_id for company_id, _ in rows]
        active_ids = [
            company_id for company_id, is_active in rows if is_active
        ]

        return all_ids, active_ids
