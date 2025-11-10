from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean, Enum
)
from infrastructure.db.base import BaseModel

from models.enums import ReasonType
from models.mixins import TimeMixin


class ReasonModel(BaseModel, TimeMixin):
    __tablename__ = "reasons"

    type = Column(
        Enum(ReasonType, name="reason_type_enum"),
        nullable=False
    )

    name = Column(String(120), nullable=False)
    full_name = Column(String(255), nullable=False)
    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_deleted = Column(Boolean, default=False)

    # --- relationships ---
    verifications = relationship(
        "VerificationEntryModel",
        back_populates="reason",
        passive_deletes=True,
    )
    company = relationship("CompanyModel", back_populates="reasons")
