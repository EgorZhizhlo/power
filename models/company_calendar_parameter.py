from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, Boolean, ForeignKey, UniqueConstraint
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class CompanyCalendarParameterModel(BaseModel, TimeMixin):
    __tablename__ = 'company_params'
    __table_args__ = (
        UniqueConstraint('company_id', name='uq_company_params_company_id'),
    )

    customer_field = Column(Boolean, default=False)
    customer_field_required = Column(Boolean, default=False)
    legal_entity = Column(Boolean, default=False)
    price_field = Column(Boolean, default=False)
    price_field_required = Column(Boolean, default=False)
    water_field = Column(Boolean, default=False)
    water_field_required = Column(Boolean, default=False)
    company_id = Column(
        Integer, ForeignKey('companies.id', ondelete="CASCADE"),
        nullable=False)

    # --- relationships ---
    company = relationship('CompanyModel', back_populates='calendar_params')
