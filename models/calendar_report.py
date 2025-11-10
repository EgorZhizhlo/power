from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class CalendarReportModel(BaseModel, TimeMixin):
    __tablename__ = "calendar_reports"

    name = Column(String(100), nullable=False)

    dispatcher = Column(Boolean, default=False)
    route = Column(Boolean, default=False)
    no_date = Column(Boolean, default=False)
    date = Column(Boolean, default=False)
    address = Column(Boolean, default=False)
    phone_number = Column(Boolean, default=False)
    sec_phone_number = Column(Boolean, default=False)
    client_full_name = Column(Boolean, default=False)
    legal_entity = Column(Boolean, default=False)
    counter_number = Column(Boolean, default=False)
    water_type = Column(Boolean, default=False)
    price = Column(Boolean, default=False)
    status = Column(Boolean, default=False)
    additional_info = Column(Boolean, default=False)

    for_auditor = Column(Boolean, default=False)
    for_dispatcher1 = Column(Boolean, default=False)
    for_dispatcher2 = Column(Boolean, default=False)

    date_of_get = Column(Boolean, default=False)
    deleted_at = Column(Boolean, default=False)

    fields_order = Column(String)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )

    company = relationship("CompanyModel", back_populates="calendar_reports")
