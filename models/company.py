from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, Boolean, LargeBinary,
    Float, Date, CheckConstraint
)
import base64

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin
from models.associations import employees_companies


class CompanyModel(BaseModel, TimeMixin):
    __tablename__ = 'companies'
    __table_args__ = (
        # долгота: от -180 до 180
        CheckConstraint('longitude >= -180 AND longitude <= 180',
                        name='ck_company_longitude_range'),
        # широта: от -90 до 90
        CheckConstraint('latitude >= -90 AND latitude <= 90',
                        name='ck_company_latitude_range'),
        # давление на поверхности земли в кПа (примерно 80–110)
        CheckConstraint('default_pressure >= 80 AND default_pressure <= 110',
                        name='ck_company_default_pressure_range'),
    )

    image = Column(LargeBinary, nullable=True)
    name = Column(String(200), nullable=False, unique=True)
    email = Column(String(120), nullable=False, unique=True)
    inn = Column(String(12), nullable=False, unique=True)
    address = Column(String(150))
    workplace = Column(String(120))
    accreditation_certificat = Column(String(30))
    organization_code = Column(String(30))
    contact_responsible_person = Column(String(200), nullable=False)
    additional = Column(String, default="")
    auto_teams = Column(Boolean, default=False)
    daily_verifier_verif_limit = Column(Integer, default=0, nullable=False)
    auto_metrolog = Column(Boolean, default=False)
    longitude = Column(Float, default=0, nullable=False)
    latitude = Column(Float, default=0, nullable=False)
    default_pressure = Column(Integer, default=0, nullable=False)
    auto_manufacture_year = Column(Boolean, default=False)
    is_active = Column(Boolean, default=False)
    verification_date_block = Column(Date)
    timezone = Column(String(50), default='Europe/Moscow', nullable=False)

    additional_checkbox_1 = Column(String(100))
    additional_checkbox_2 = Column(String(100))
    additional_checkbox_3 = Column(String(100))
    additional_checkbox_4 = Column(String(100))
    additional_checkbox_5 = Column(String(100))
    additional_input_1 = Column(String(100))
    additional_input_2 = Column(String(100))
    additional_input_3 = Column(String(100))
    additional_input_4 = Column(String(100))
    additional_input_5 = Column(String(100))

    yandex_disk_token = Column(String, default="", nullable=True)

    # --- relationships ---
    teams = relationship(
        'TeamModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    cities = relationship(
        'CityModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    equipments = relationship(
        'EquipmentModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    verifiers = relationship(
        'VerifierModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    methods = relationship(
        'MethodModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    modifications = relationship(
        'SiModificationModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    registry_numbers = relationship(
        'RegistryNumberModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    series = relationship(
        'ActSeriesModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    locations = relationship(
        'LocationModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    reasons = relationship(
        'ReasonModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    verifications = relationship(
        'VerificationEntryModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    act_number = relationship(
        'ActNumberModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    company_reports = relationship(
        'VerificationReportModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    routes = relationship(
        'RouteModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    orders = relationship(
        'OrderModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    appeals = relationship(
        'AppealModel',
        back_populates='company',
        cascade="all, delete-orphan"
    )
    calendar_params = relationship(
        'CompanyCalendarParameterModel',
        back_populates='company',
        uselist=False,
        cascade="all, delete-orphan"
    )
    employees = relationship(
        'EmployeeModel',
        secondary=employees_companies,
        back_populates='companies',
        passive_deletes=True
    )
    activities = relationship(
        "CompanyActivityModel",
        back_populates="company",
        cascade="all, delete-orphan"
    )
    si_types = relationship(
        "CompanySiTypeModel",
        back_populates="company",
        cascade="all, delete-orphan"
    )
    calendar_reports = relationship(
        "CalendarReportModel",
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    calendar_day_info = relationship(
        "CompanyCalendarDayInfoModel",
        back_populates="company",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    metrologs = relationship(
        "MetrologInfoModel",
        back_populates="company",
        cascade="all, delete-orphan"
    )
    tariff_history = relationship(
        "CompanyTariffHistory",
        back_populates="company",
        cascade="all, delete-orphan"
    )
    tariff_state = relationship(
        "CompanyTariffState",
        back_populates="company",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def get_image(self):
        if self.image:
            return base64.b64encode(self.image).decode('utf-8')
        return None
