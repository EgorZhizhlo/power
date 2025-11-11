
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from models import (
    CompanyTariffState, EmployeeModel, CompanyModel,
    VerificationEntryModel, OrderModel
)
from core.exceptions import CustomHTTPException


async def check_employee_limit_available(
    session: AsyncSession,
    company_id: int,
    required_slots: int = 1
) -> None:
    """
    Проверить доступность мест для создания сотрудников.

    Использует атомарную проверку с блокировкой FOR UPDATE для защиты
    от race conditions при конкурентных запросах.
    """
    stmt = (
        select(CompanyTariffState)
        .where(CompanyTariffState.company_id == company_id)
        .with_for_update()
    )
    result = await session.execute(stmt)
    state = result.scalar_one_or_none()

    if not state:
        raise CustomHTTPException(
            company_id=company_id,
            status_code=403,
            detail=(
                "У компании нет активного тарифа. "
                "Создание сотрудников запрещено."
            )
        )

    # Безлимит - пропускаем проверку
    if state.max_employees is None:
        return

    # Запрещено создание
    if state.max_employees == 0:
        raise CustomHTTPException(
            company_id=company_id,
            status_code=403,
            detail="Тариф компании запрещает создание сотрудников (лимит: 0)."
        )

    # Проверяем актуальные данные из БД
    current_used = state.used_employees or 0
    if current_used + required_slots > state.max_employees:
        raise CustomHTTPException(
            company_id=company_id,
            status_code=403,
            detail=(
                f"Достигнут лимит сотрудников по тарифу. "
                f"Использовано: {current_used}, "
                f"Максимум: {state.max_employees}, "
                f"Требуется: {required_slots}."
            )
        )


async def increment_employee_count(
    session: AsyncSession,
    company_id: int,
    delta: int = 1
) -> None:
    """
    Увеличить счётчик использованных сотрудников.
    """
    stmt = (
        update(CompanyTariffState)
        .where(CompanyTariffState.company_id == company_id)
        .values(
            used_employees=func.coalesce(
                CompanyTariffState.used_employees, 0
            ) + delta
        )
    )
    result = await session.execute(stmt)

    if result.rowcount == 0:
        return

    from apps.tariff_app.services import tariff_cache
    await tariff_cache.invalidate_cache(company_id)


async def decrement_employee_count(
    session: AsyncSession,
    company_id: int,
    delta: int = 1
) -> None:
    """
    Уменьшить счётчик использованных сотрудников.
    """
    stmt = (
        update(CompanyTariffState)
        .where(CompanyTariffState.company_id == company_id)
        .values(
            used_employees=func.greatest(
                0,
                func.coalesce(CompanyTariffState.used_employees, 0) - delta
            )
        )
    )
    result = await session.execute(stmt)

    if result.rowcount == 0:
        return

    from apps.tariff_app.services import tariff_cache
    await tariff_cache.invalidate_cache(company_id)


async def recalculate_employee_count(
    session: AsyncSession,
    company_id: int
) -> int:
    """
    Пересчитать фактическое количество сотрудников в компании.
    """
    stmt = (
        select(CompanyTariffState)
        .where(CompanyTariffState.company_id == company_id)
        .with_for_update()
    )
    result = await session.execute(stmt)
    state = result.scalar_one_or_none()

    if not state:
        return 0

    count_stmt = (
        select(func.count(EmployeeModel.id))
        .where(
            EmployeeModel.companies.any(CompanyModel.id == company_id),
            EmployeeModel.is_deleted.isnot(True)
        )
    )
    result = await session.execute(count_stmt)
    actual_count = result.scalar_one()

    state.used_employees = actual_count
    await session.flush()

    from apps.tariff_app.services import tariff_cache
    await tariff_cache.invalidate_cache(company_id)

    return actual_count


async def calculate_actual_usage(
    session: AsyncSession,
    company_id: int
) -> tuple[int, int, int]:
    """
    Подсчитать фактическое использование лимитов компании.
    """
    employees_stmt = (
        select(func.count(EmployeeModel.id))
        .where(
            EmployeeModel.companies.any(CompanyModel.id == company_id),
            EmployeeModel.is_deleted.isnot(True)
        )
    )
    employees_result = await session.execute(employees_stmt)
    employees_count = employees_result.scalar_one()

    verifications_stmt = (
        select(func.count(VerificationEntryModel.id))
        .where(VerificationEntryModel.company_id == company_id)
    )
    verifications_result = await session.execute(verifications_stmt)
    verifications_count = verifications_result.scalar_one()

    orders_stmt = (
        select(func.count(OrderModel.id))
        .where(
            OrderModel.company_id == company_id,
            OrderModel.is_active.is_(True)
        )
    )
    orders_result = await session.execute(orders_stmt)
    orders_count = orders_result.scalar_one()

    return employees_count, verifications_count, orders_count


async def validate_and_sync_limits(
    session: AsyncSession,
    company_id: int,
    max_employees: int | None,
    max_verifications: int | None,
    max_orders: int | None
) -> None:
    """
    Валидировать лимиты против фактического использования.
    """
    actual_employees, actual_verifications, actual_orders = (
        await calculate_actual_usage(session, company_id)
    )

    errors = []

    if max_employees is not None and actual_employees > max_employees:
        errors.append(
            f"Сотрудников: {actual_employees} > лимит {max_employees}"
        )

    if (max_verifications is not None and
            actual_verifications > max_verifications):
        errors.append(
            f"Поверок: {actual_verifications} > лимит {max_verifications}"
        )

    if max_orders is not None and actual_orders > max_orders:
        errors.append(
            f"Заявок: {actual_orders} > лимит {max_orders}"
        )

    if errors:
        raise CustomHTTPException(
            company_id=company_id,
            status_code=400,
            detail=(
                "Невозможно назначить тариф: "
                "фактическое использование превышает лимиты. "
                + "; ".join(errors)
            )
        )
