from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Enum
)

from infrastructure.db.base import BaseModel

from core.utils.time_utils import datetime_utc_now

from models.enums import AppealStatus


class AppealModel(BaseModel):
    __tablename__ = 'appeals'

    updated_at = Column(
        DateTime(timezone=True),
        default=datetime_utc_now,
        onupdate=datetime_utc_now,
        nullable=False
    )

    date_of_get = Column(
        DateTime(timezone=True),
        default=datetime_utc_now,
        nullable=False
    )

    client_full_name = Column(String(255))
    address = Column(String(255))
    phone_number = Column(String(18))
    additional_info = Column(String(255))

    status = Column(
        Enum(AppealStatus, name="appeal_status_enum"),
        nullable=False,
        default=AppealStatus.accepted
    )

    dispatcher_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True
    )
    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )

    # --- relationships ---
    dispatcher = relationship(
        "EmployeeModel",
        back_populates="appeal",
        passive_deletes=True
    )
    company = relationship(
        "CompanyModel",
        back_populates="appeals",
        passive_deletes=True
    )
