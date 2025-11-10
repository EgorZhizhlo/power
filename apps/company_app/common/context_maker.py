import base64
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import CompanyModel

from core.exceptions import CustomHTTPException


async def make_context(
    session: AsyncSession,
    user_data: dict,
    company_id: int,
):
    # Выполняем запрос
    result = await session.execute(
        select(
            CompanyModel.id,
            CompanyModel.name,
            CompanyModel.image,
            CompanyModel.auto_teams,
            CompanyModel.is_active
        ).where(CompanyModel.id == company_id)
    )
    row = result.mappings().first()

    # Если такой компании нет — бросаем 404
    if row is None:
        raise CustomHTTPException(
            status_code=404,
            company_id=company_id,
            detail=f"Компания {company_id} не найдена")

    # Преобразуем RowMapping в словарь
    company: dict = dict(row)

    company_image = company.get("image")
    if company_image:
        company["image"] = base64.b64encode(company_image).decode('utf-8')

    context = {
        **user_data.__dict__,
        **{"company_" + key: value for key, value in company.items()}
    }
    return context
