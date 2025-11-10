from pydantic import BaseModel, Field, model_validator
from datetime import datetime, date
from typing import Optional


class BaseTariffDates(BaseModel):
    @model_validator(mode='after')
    def validate_dates(self):
        """Валидация дат: valid_to > valid_from и кратность 30 дням"""
        valid_from = getattr(self, 'valid_from', None)
        valid_to = getattr(self, 'valid_to', None)

        if valid_to and valid_from:
            if valid_to <= valid_from:
                raise ValueError(
                    'Дата окончания должна быть позже даты начала'
                )

            days_diff = (valid_to - valid_from).days
            if days_diff % 30 != 0:
                raise ValueError(
                    f'Разница между датами должна быть кратна 30 дням. '
                    f'Сейчас: {days_diff} дней'
                )

        return self


class BaseTariffLimits(BaseModel):
    """Базовая схема с общими полями лимитов и автоматизаций"""
    max_employees: Optional[int] = Field(None, ge=0)
    monthly_verifications: Optional[int] = Field(None, ge=0)
    monthly_orders: Optional[int] = Field(None, ge=0)

    auto_manufacture_year: bool = Field(default=False)
    auto_teams: bool = Field(default=False)
    auto_metrolog: bool = Field(default=False)

    reason: Optional[str] = Field(None, max_length=255)


class CompanyTariffAssign(BaseTariffDates, BaseTariffLimits):
    """Схема назначения тарифа компании"""
    base_tariff_id: int = Field(..., ge=1)

    valid_from: date
    valid_to: Optional[date] = None

    carry_over_verifications: bool = Field(default=False)
    carry_over_orders: bool = Field(default=False)


class CompanyTariffUpdate(BaseTariffDates):
    """Схема изменения/продления тарифа компании"""
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None

    max_employees: Optional[int] = Field(None, ge=0)
    monthly_verifications: Optional[int] = Field(None, ge=0)
    monthly_orders: Optional[int] = Field(None, ge=0)

    is_extension: bool = Field(default=False)

    auto_manufacture_year: Optional[bool] = None
    auto_teams: Optional[bool] = None
    auto_metrolog: Optional[bool] = None

    reason: Optional[str] = Field(None, max_length=255)


class CompanyTariffStateResponse(BaseModel):
    """Схема текущего состояния тарифа компании"""
    company_id: int

    # Срок действия
    valid_from: date
    valid_to: Optional[date]

    # Лимиты
    max_employees: Optional[int]
    max_verifications: Optional[int]
    max_orders: Optional[int]

    # Использование
    used_employees: int
    used_verifications: int
    used_orders: int

    # Переносы
    carry_over_verifications: bool
    carry_over_orders: bool

    # Автоматизации
    auto_manufacture_year: bool
    auto_teams: bool
    auto_metrolog: bool

    # Метаданные
    base_tariff_id: Optional[int]
    title: Optional[str]
    last_tariff_history_id: Optional[int]
    updated_at: datetime

    class Config:
        from_attributes = True


class CompanyTariffHistoryResponse(BaseModel):
    """Схема записи истории тарифа"""
    id: int
    company_id: int

    # Базовый тариф
    base_tariff_id: Optional[int]
    title: Optional[str]

    # Период действия
    valid_from: date
    valid_to: Optional[date]

    # Месячные лимиты на момент назначения
    max_employees: Optional[int]
    monthly_verifications: Optional[int]
    monthly_orders: Optional[int]

    # Автоматизации
    auto_manufacture_year: bool
    auto_teams: bool
    auto_metrolog: bool

    # Метаданные
    reason: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyTariffHistoryListResponse(BaseModel):
    """Схема списка истории тарифов с пагинацией"""
    items: list[CompanyTariffHistoryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CompanyTariffFullResponse(BaseModel):
    """Полная информация о тарифе компании"""
    state: Optional[CompanyTariffStateResponse]
    active_history: Optional[CompanyTariffHistoryResponse]
    has_active_tariff: bool
