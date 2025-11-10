from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class CompanySiTypeModel(BaseModel, TimeMixin):
    __tablename__ = "company_si_types"

    name = Column(String(150), nullable=False)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )

    # --- relationships ---
    company = relationship(
        "CompanyModel",
        back_populates="si_types",
        passive_deletes=True
    )
    equipments = relationship(
        "EquipmentModel",
        back_populates="si_type",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
