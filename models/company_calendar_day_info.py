from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, Date, ForeignKey
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class CompanyCalendarDayInfoModel(BaseModel, TimeMixin):
    __tablename__ = 'company_calendar_day_info'

    date = Column(Date, nullable=False)
    day_info = Column(String(100))

    company_id = Column(
        Integer,
        ForeignKey('companies.id', ondelete="CASCADE"),
        nullable=False
    )

    # --- relationships ---
    company = relationship(
        "CompanyModel",
        back_populates="calendar_day_info",
        passive_deletes=True
    )
