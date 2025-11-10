from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean
)

from infrastructure.db.base import BaseModel

from models.associations import employees_cities
from models.mixins import TimeMixin


class CityModel(BaseModel, TimeMixin):
    __tablename__ = 'cities'

    name = Column(String(100), nullable=False)

    is_deleted = Column(Boolean, default=False)

    company_id = Column(
        Integer,
        ForeignKey('companies.id', ondelete="CASCADE"),
        nullable=False
    )

    # --- relationships ---
    company = relationship(
        'CompanyModel',
        back_populates='cities',
        passive_deletes=True
    )
    act_numbers = relationship(
        'ActNumberModel',
        back_populates='city',
        passive_deletes=True
    )
    employee = relationship(
        'EmployeeModel',
        back_populates='default_city',
        passive_deletes=True
    )
    verifications = relationship(
        'VerificationEntryModel',
        back_populates='city',
        passive_deletes=True
    )
    order = relationship(
        'OrderModel',
        back_populates='city',
        passive_deletes=True
    )
    employees = relationship(
        'EmployeeModel',
        secondary=employees_cities,
        back_populates='cities',
        lazy='selectin',
        passive_deletes=True
    )
