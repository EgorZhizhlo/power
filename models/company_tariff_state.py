from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class CompanyTariffState(BaseModel, TimeMixin):
    """Текущее состояние тарифных лимитов компании"""
    __tablename__ = "company_tariff_state"

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    title = Column(String(255), nullable=True)

    # Общий срок действия (последнее продление или бессрочно)
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=True)  # null = бессрочный

    # Текущие лимиты (null = безлимит)
    max_employees = Column(Integer, nullable=True)
    max_verifications = Column(Integer, nullable=True)
    max_orders = Column(Integer, nullable=True)

    # Текущее использование
    used_employees = Column(Integer, nullable=False, default=0)
    used_verifications = Column(Integer, nullable=False, default=0)
    used_orders = Column(Integer, nullable=False, default=0)

    # Признак, что остаток переносится при продлении
    carry_over_verifications = Column(Boolean, nullable=False, default=False)
    carry_over_orders = Column(Boolean, nullable=False, default=False)

    # Фичи, включённые по текущему тарифу (для быстрого доступа)
    auto_manufacture_year = Column(Boolean, nullable=False, default=False)
    auto_teams = Column(Boolean, nullable=False, default=False)
    auto_metrolog = Column(Boolean, nullable=False, default=False)

    # Метаданные
    base_tariff_id = Column(
        Integer,
        ForeignKey("base_tariff_plans.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    last_tariff_history_id = Column(
        Integer,
        ForeignKey("company_tariff_history.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relationships
    company = relationship(
        "CompanyModel", back_populates="tariff_state", uselist=False
    )
    last_tariff_history = relationship("CompanyTariffHistory")
