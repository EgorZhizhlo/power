from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin
from models.associations import registry_numbers_modifications


class SiModificationModel(BaseModel, TimeMixin):
    __tablename__ = "si_modifications"

    modification_name = Column(String(255), nullable=False)

    is_deleted = Column(Boolean, default=False)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- relationships ---
    registry_numbers = relationship(
        "RegistryNumberModel",
        secondary=registry_numbers_modifications,
        back_populates="modifications",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    verifications = relationship(
        "VerificationEntryModel",
        back_populates="modification",
        passive_deletes=True
    )
    company = relationship("CompanyModel", back_populates="modifications")
