from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional


class BaseTariffCreate(BaseModel):
    """Схема создания базового тарифа"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=255)

    # Лимиты (null = безлимит)
    max_employees: Optional[int] = Field(None, ge=1)
    max_verifications_per_month: Optional[int] = Field(None, ge=0)
    max_orders_per_month: Optional[int] = Field(None, ge=0)

    # Автоматизации
    auto_manufacture_year: bool = Field(default=False)
    auto_teams: bool = Field(default=False)
    auto_metrolog: bool = Field(default=False)

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Валидация названия тарифа"""
        v = v.strip()
        if not v:
            raise ValueError("Название тарифа не может быть пустым")
        return v


class BaseTariffUpdate(BaseModel):
    """Схема обновления базового тарифа"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)

    # Лимиты (null = безлимит)
    max_employees: Optional[int] = Field(None, ge=1)
    max_verifications_per_month: Optional[int] = Field(None, ge=0)
    max_orders_per_month: Optional[int] = Field(None, ge=0)

    # Автоматизации
    auto_manufacture_year: Optional[bool] = Field(None)
    auto_teams: Optional[bool] = Field(None)
    auto_metrolog: Optional[bool] = Field(None)

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Валидация названия тарифа"""
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Название тарифа не может быть пустым")
        return v


class BaseTariffResponse(BaseModel):
    """Схема ответа базового тарифа"""
    id: int
    title: str
    description: Optional[str]

    # Лимиты
    max_employees: Optional[int]
    max_verifications_per_month: Optional[int]
    max_orders_per_month: Optional[int]

    # Автоматизации
    auto_manufacture_year: bool
    auto_teams: bool
    auto_metrolog: bool

    # Метаданные
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BaseTariffListResponse(BaseModel):
    """Схема списка базовых тарифов"""
    tariffs: list[BaseTariffResponse]
    total: int
