from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class ActSeriesModel(BaseModel, TimeMixin):
    __tablename__ = 'series'

    name = Column(String(60))
    is_deleted = Column(Boolean, default=False)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )

    # --- relationships ---
    act_number = relationship(
        "ActNumberModel",
        back_populates="series",
        passive_deletes=True
    )
    verifications = relationship(
        "VerificationEntryModel",
        back_populates="series",
        passive_deletes=True
    )
    employee = relationship(
        "EmployeeModel",
        back_populates="series",
        passive_deletes=True
    )
    company = relationship(
        "CompanyModel",
        back_populates="series",
        passive_deletes=True
    )
