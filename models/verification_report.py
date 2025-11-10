from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class VerificationReportModel(BaseModel, TimeMixin):
    __tablename__ = 'verification_reports'

    name = Column(String(100), nullable=False)

    employee_name = Column(Boolean)
    verification_date = Column(Boolean)
    city = Column(Boolean)
    address = Column(Boolean)
    client_name = Column(Boolean)
    si_type = Column(Boolean)
    registry_number = Column(Boolean)
    factory_number = Column(Boolean)
    location_name = Column(Boolean)
    meter_info = Column(Boolean)
    end_verification_date = Column(Boolean)
    series_name = Column(Boolean)
    act_number = Column(Boolean)
    verification_result = Column(Boolean)
    verification_number = Column(Boolean)
    qh = Column(Boolean)
    modification_name = Column(Boolean)
    water_type = Column(Boolean)
    method_name = Column(Boolean)
    reference = Column(Boolean)
    seal = Column(Boolean)
    phone_number = Column(Boolean)
    verifier_name = Column(Boolean)
    manufacture_year = Column(Boolean)
    reason_name = Column(Boolean)
    interval = Column(Boolean)

    additional_checkbox_1 = Column(Boolean)
    additional_checkbox_2 = Column(Boolean)
    additional_checkbox_3 = Column(Boolean)
    additional_checkbox_4 = Column(Boolean)
    additional_checkbox_5 = Column(Boolean)
    additional_input_1 = Column(Boolean)
    additional_input_2 = Column(Boolean)
    additional_input_3 = Column(Boolean)
    additional_input_4 = Column(Boolean)
    additional_input_5 = Column(Boolean)

    for_verifier = Column(Boolean)
    for_auditor = Column(Boolean)

    fields_order = Column(String)

    company_id = Column(
        Integer,
        ForeignKey('companies.id', ondelete="CASCADE"),
        nullable=False
    )

    company = relationship(
        'CompanyModel',
        back_populates='company_reports',
        passive_deletes=True
    )
