from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean
)
from models.associations import registry_numbers_modifications

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class RegistryNumberModel(BaseModel, TimeMixin):
    __tablename__ = "registry_numbers"

    registry_number = Column(String(255), nullable=False)
    si_type = Column(String(255), nullable=False)
    mpi_hot = Column(Integer, nullable=True)
    mpi_cold = Column(Integer, nullable=True)
    is_deleted = Column(Boolean, default=False)

    method_id = Column(
        Integer,
        ForeignKey("methods.id", ondelete="SET NULL"),
        nullable=True,
    )
    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- relationships ---
    method = relationship(
        "MethodModel",
        back_populates="registry_numbers"
    )
    company = relationship(
        "CompanyModel",
        back_populates="registry_numbers"
    )
    modifications = relationship(
        "SiModificationModel",
        secondary=registry_numbers_modifications,
        back_populates="registry_numbers",
        cascade="save-update, merge",
        passive_deletes=True,
    )
    verifications = relationship(
        "VerificationEntryModel",
        back_populates="registry_number",
        passive_deletes=True,
    )
