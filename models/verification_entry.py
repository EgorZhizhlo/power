from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, Date, ForeignKey, Boolean, String, Enum
)
from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin
from models.enums import (
    VerificationWaterType, VerificationSeal, VerificationLegalEntity
)


class VerificationEntryModel(BaseModel, TimeMixin):
    __tablename__ = 'verification_entries'

    end_verification_date = Column(Date, nullable=False)
    verification_date = Column(Date, nullable=False)

    number_verification_license = Column(String(100))
    interval = Column(Integer, nullable=False)
    manufacture_year = Column(Integer, nullable=False)

    water_type = Column(
        Enum(VerificationWaterType, name="verification_water_type_enum"),
        nullable=False)

    meter_info = Column(Integer, nullable=False)

    seal = Column(
        Enum(VerificationSeal, name="verification_seal_enum"),
        nullable=False)

    verification_result = Column(Boolean, default=True)
    factory_number = Column(String(60))
    verification_number = Column(String(100))

    legal_entity = Column(
        Enum(VerificationLegalEntity, name="verification_legal_entity_enum"),
        nullable=False)

    ra_status = Column(String(100))

    change_verifier_by_admin_or_director = Column(Boolean, default=False)

    additional_checkbox_1 = Column(Boolean)
    additional_checkbox_2 = Column(Boolean)
    additional_checkbox_3 = Column(Boolean)
    additional_checkbox_4 = Column(Boolean)
    additional_checkbox_5 = Column(Boolean)

    additional_input_1 = Column(String(100))
    additional_input_2 = Column(String(100))
    additional_input_3 = Column(String(100))
    additional_input_4 = Column(String(100))
    additional_input_5 = Column(String(100))

    act_number_id = Column(Integer, ForeignKey(
        'act_numbers.id', ondelete="SET NULL"), nullable=True)
    reason_id = Column(Integer, ForeignKey(
        'reasons.id', ondelete="SET NULL"), nullable=True)
    city_id = Column(Integer, ForeignKey(
        'cities.id', ondelete="SET NULL"), nullable=True)
    method_id = Column(Integer, ForeignKey(
        'methods.id', ondelete="SET NULL"), nullable=True)
    modification_id = Column(Integer, ForeignKey(
        'si_modifications.id', ondelete="SET NULL"), nullable=True)
    location_id = Column(Integer, ForeignKey(
        'locations.id', ondelete="SET NULL"), nullable=True)
    series_id = Column(Integer, ForeignKey(
        'series.id', ondelete="SET NULL"), nullable=True)
    registry_number_id = Column(Integer, ForeignKey(
        'registry_numbers.id', ondelete="SET NULL"), nullable=True)
    employee_id = Column(Integer, ForeignKey(
        'employees.id', ondelete="SET NULL"), nullable=True)
    company_id = Column(Integer, ForeignKey(
        'companies.id', ondelete="CASCADE"), nullable=True)
    verifier_id = Column(Integer, ForeignKey(
        'verifiers.id', ondelete="SET NULL"), nullable=True)

    # --- relationships ---
    act_number = relationship('ActNumberModel', back_populates='verification')
    verifier = relationship('VerifierModel', back_populates='verification')
    reason = relationship('ReasonModel', back_populates='verifications')
    location = relationship('LocationModel', back_populates='verifications')
    city = relationship('CityModel', back_populates='verifications')
    modification = relationship(
        'SiModificationModel', back_populates='verifications')
    method = relationship('MethodModel', back_populates='verifications')
    registry_number = relationship(
        'RegistryNumberModel', back_populates='verifications')
    employee = relationship('EmployeeModel', back_populates='verifications')
    company = relationship('CompanyModel', back_populates='verifications')
    series = relationship('ActSeriesModel', back_populates='verifications')

    metrolog = relationship(
        "MetrologInfoModel",
        back_populates="verification",
        uselist=False,
        cascade="all, delete-orphan",
        single_parent=True)
    verification_entry_photo = relationship(
        'VerificationEntryPhotoModel',
        back_populates='verification_entry',
        cascade="all, delete-orphan",
        passive_deletes=True)
    equipments = relationship(
        "EquipmentModel",
        secondary="verification_entries_equipments",
        back_populates="verifications",
        passive_deletes=True)
