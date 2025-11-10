from sqlalchemy import Column, Integer, String, Boolean

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class BaseTariff(BaseModel, TimeMixin):
    """Базовый тариф """
    __tablename__ = "base_tariff_plans"

    title = Column(String(255), nullable=False, unique=True)
    description = Column(String(500), nullable=True)

    # Лимиты (null = безлимит)
    max_employees = Column(Integer, nullable=True)
    max_verifications_per_month = Column(Integer, nullable=True)
    max_orders_per_month = Column(Integer, nullable=True)

    # автоматизации
    auto_manufacture_year = Column(Boolean, nullable=False, default=False)
    auto_teams = Column(Boolean, nullable=False, default=False)
    auto_metrolog = Column(Boolean, nullable=False, default=False)
