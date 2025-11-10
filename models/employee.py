import base64
from sqlalchemy.orm import relationship
from sqlalchemy import (
    LargeBinary, Boolean, String, Column, Integer, DateTime, ForeignKey,
    Enum
)
from .associations import (
    employees_routes, employees_companies, employees_cities
)
from infrastructure.db.base import BaseModel
from core.utils.time_utils import datetime_utc_now
from models.enums import EmployeeStatus


class EmployeeModel(BaseModel):
    __tablename__ = 'employees'

    created_at = Column(
        DateTime(timezone=True), default=datetime_utc_now,
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), default=datetime_utc_now,
        onupdate=datetime_utc_now, nullable=False
    )
    last_login = Column(
        DateTime(timezone=True), default=datetime_utc_now
    )

    image = Column(LargeBinary, nullable=True)
    username = Column(String(150), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(200), nullable=False)
    last_name = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    patronymic = Column(String(100), nullable=False)
    status = Column(
        Enum(EmployeeStatus, name="employee_status_enum"),
        nullable=False
    )
    position = Column(String(150))
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    trust_verifier = Column(Boolean, default=False)
    trust_equipment = Column(Boolean, default=False)

    default_verifier_id = Column(
        Integer,
        ForeignKey('verifiers.id', ondelete="SET NULL"),
        nullable=True
    )
    default_city_id = Column(
        Integer,
        ForeignKey('cities.id', ondelete="SET NULL"),
        nullable=True
    )
    series_id = Column(
        Integer,
        ForeignKey('series.id', ondelete="SET NULL"),
        nullable=True
    )

    # --- relationships ---
    default_city = relationship(
        'CityModel',
        back_populates='employee',
        passive_deletes=True
    )
    default_verifier = relationship(
        'VerifierModel',
        back_populates='employees',
        passive_deletes=True
    )
    series = relationship(
        'ActSeriesModel',
        back_populates='employee',
        passive_deletes=True
    )
    assignments = relationship(
        'RouteEmployeeAssignmentModel',
        back_populates='employee',
        cascade='all, delete-orphan',
        passive_deletes=True,
        lazy='selectin'
    )
    verifications = relationship(
        'VerificationEntryModel',
        back_populates='employee',
        passive_deletes=True
    )
    companies = relationship(
        'CompanyModel',
        secondary=employees_companies,
        back_populates='employees',
        lazy='selectin',
        passive_deletes=True
    )
    order = relationship(
        'OrderModel',
        back_populates='dispatcher',
        passive_deletes=True
    )
    appeal = relationship(
        'AppealModel',
        back_populates='dispatcher',
        passive_deletes=True
    )
    cities = relationship(
        'CityModel',
        secondary=employees_cities,
        back_populates='employees',
        lazy='selectin',
        passive_deletes=True
    )
    routes = relationship(
        'RouteModel',
        secondary=employees_routes,
        back_populates='employees',
        lazy='selectin',
        passive_deletes=True
    )

    def get_image(self):
        return (
            base64.b64encode(self.image).decode('utf-8')
            if self.image else None)
