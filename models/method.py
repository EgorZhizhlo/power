from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class MethodModel(BaseModel, TimeMixin):
    __tablename__ = "methods"

    name = Column(String(255), nullable=False)

    is_deleted = Column(Boolean, default=False)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )

    # --- relationships ---
    company = relationship(
        "CompanyModel",
        back_populates="methods"
    )
    registry_numbers = relationship(
        "RegistryNumberModel",
        back_populates="method",
        passive_deletes=True
    )
    verifications = relationship(
        "VerificationEntryModel",
        back_populates="method",
        passive_deletes=True
    )
