from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean

from infrastructure.db.base import BaseModel

from models.associations import equipments_verifiers
from models.mixins import TimeMixin


class VerifierModel(BaseModel, TimeMixin):
    __tablename__ = "verifiers"

    last_name = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    patronymic = Column(String(100))
    snils = Column(String(11), nullable=False, unique=True)

    is_deleted = Column(Boolean, default=False)

    team_id = Column(
        Integer,
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True)
    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False)

    # --- relationships ---
    team = relationship(
        "TeamModel", back_populates="verifiers"
    )
    company = relationship(
        "CompanyModel", back_populates="verifiers"
    )
    equipments = relationship(
        'EquipmentModel', secondary=equipments_verifiers,
        back_populates='verifiers'
    )
    equipment_history = relationship(
        "VerifierEquipmentHistoryModel",
        back_populates="verifier",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    verification = relationship(
        "VerificationEntryModel",
        back_populates="verifier",
        passive_deletes=True
    )
    verification_logs = relationship(
        "VerificationLogModel",
        back_populates="verifier",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    employees = relationship(
        "EmployeeModel",
        back_populates="default_verifier",
        passive_deletes=True
    )
