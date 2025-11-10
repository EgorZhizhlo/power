from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class CompanyTariffHistory(BaseModel, TimeMixin):
    """История назначения и изменения тарифов компании"""
    __tablename__ = "company_tariff_history"

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Базовый тариф (для аудита)
    base_tariff_id = Column(
        Integer,
        ForeignKey("base_tariff_plans.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    title = Column(String(255), nullable=True)

    # Период действия
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=True)  # null = бессрочный

    # Лимиты на момент назначения (null = безлимит)
    max_employees = Column(Integer, nullable=True)
    monthly_verifications = Column(Integer, nullable=True)
    monthly_orders = Column(Integer, nullable=True)

    # Дополнительный функционал
    auto_manufacture_year = Column(Boolean, nullable=False, default=False)
    auto_teams = Column(Boolean, nullable=False, default=False)
    auto_metrolog = Column(Boolean, nullable=False, default=False)

    # Комментарий
    reason = Column(String(255), nullable=True)

    # Активный/неактивный тариф
    is_active = Column(Boolean, nullable=False, default=True, index=True)

    # Relationships
    company = relationship("CompanyModel", back_populates="tariff_history")
