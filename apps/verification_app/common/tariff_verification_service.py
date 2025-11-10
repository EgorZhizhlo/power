from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import CustomHTTPException
from models import CompanyTariffState
from apps.tariff_app.services.tariff_cache_service import tariff_cache


async def check_verification_limit_available(
    session: AsyncSession,
    company_id: int,
    required_slots: int = 1
) -> None:
    """
    Проверить доступность лимита верификаций перед созданием

    Двухшаговая проверка:
    1. Быстрая проверка по кешу для очевидных случаев
    2. Финальная проверка с FOR UPDATE для атомарности

    Args:
        session: Активная транзакция БД
        company_id: ID компании
        required_slots: Количество требуемых слотов (по умолчанию 1)

    Raises:
        CustomHTTPException: Если лимит превышен или нет тарифа
    """
    # Шаг 1: Быстрая проверка по кешу
    cached_limits = await tariff_cache.get_cached_limits(company_id)

    if cached_limits and cached_limits.get('has_tariff'):
        limits = cached_limits.get('limits', {})
        max_verif = limits.get('max_verifications')
        used_verif = limits.get('used_verifications', 0)

        # Если безлимит (None) - сразу пропускаем
        if max_verif is None:
            return

        # Если лимит 0 - сразу отказываем
        if max_verif == 0:
            raise CustomHTTPException(
                status_code=403,
                company_id=company_id,
                detail=(
                    "Тарифный план не позволяет создавать верификации. "
                    "Обновите тариф для доступа к функционалу."
                )
            )

        # Если очевидно превышен лимит - отказываем без обращения к БД
        if used_verif + required_slots > max_verif:
            raise CustomHTTPException(
                status_code=403,
                company_id=company_id,
                detail=(
                    f"Превышен лимит верификаций ({used_verif}/{max_verif}). "
                    f"Требуется {required_slots}, доступно {max_verif - used_verif}. "
                    "Обновите тариф для увеличения лимита."
                )
            )

    # Шаг 2: Финальная проверка с блокировкой для атомарности
    stmt = (
        select(CompanyTariffState)
        .where(CompanyTariffState.company_id == company_id)
        .with_for_update()
    )

    result = await session.execute(stmt)
    state = result.scalar_one_or_none()

    if not state:
        raise CustomHTTPException(
            status_code=403,
            company_id=company_id,
            detail=(
                "У компании нет активного тарифа. "
                "Обратитесь к администратору для назначения тарифа."
            )
        )

    # Проверяем актуальные данные из БД
    max_verif = state.max_verifications
    used_verif = state.used_verifications or 0

    # Безлимит - пропускаем
    if max_verif is None:
        return

    # Лимит 0 - отказываем
    if max_verif == 0:
        raise CustomHTTPException(
            status_code=403,
            company_id=company_id,
            detail=(
                "Тарифный план не позволяет создавать верификации. "
                "Обновите тариф для доступа к функционалу."
            )
        )

    # Проверяем превышение лимита
    if used_verif + required_slots > max_verif:
        available = max_verif - used_verif
        raise CustomHTTPException(
            status_code=403,
            company_id=company_id,
            detail=(
                f"Превышен лимит верификаций ({used_verif}/{max_verif}). "
                f"Требуется {required_slots}, доступно {available}. "
                "Обновите тариф для увеличения лимита."
            )
        )

    # Всё ок - пропускаем


async def increment_verification_count(
    session: AsyncSession,
    company_id: int,
    delta: int = 1
) -> None:
    """
    Увеличить счётчик использованных верификаций

    Атомарная операция в рамках транзакции.
    После commit автоматически обновляет кеш.

    Args:
        session: Активная транзакция БД
        company_id: ID компании
        delta: Количество верификаций для добавления (по умолчанию 1)
    """
    from apps.tariff_app.repositories.company_tariff_state_repository import (
        CompanyTariffStateRepository
    )

    repo = CompanyTariffStateRepository(session)
    await repo.increment_usage(company_id, verifications=delta)

    # Инвалидируем кеш - он обновится при следующем запросе
    await tariff_cache.invalidate_cache(company_id)


async def decrement_verification_count(
    session: AsyncSession,
    company_id: int,
    delta: int = 1
) -> None:
    """
    Уменьшить счётчик использованных верификаций

    Атомарная операция в рамках транзакции.
    Значение не может стать меньше 0.
    После commit автоматически обновляет кеш.

    Args:
        session: Активная транзакция БД
        company_id: ID компании
        delta: Количество верификаций для удаления (по умолчанию 1)
    """
    # Блокируем state для обновления
    stmt = (
        select(CompanyTariffState)
        .where(CompanyTariffState.company_id == company_id)
        .with_for_update()
    )

    result = await session.execute(stmt)
    state = result.scalar_one_or_none()

    if not state:
        # Нет state - ничего не делаем (молча игнорируем)
        return

    # Уменьшаем счётчик, но не ниже 0
    new_value = max(0, (state.used_verifications or 0) - delta)
    state.used_verifications = new_value

    await session.flush()

    # Инвалидируем кеш - он обновится при следующем запросе
    await tariff_cache.invalidate_cache(company_id)
