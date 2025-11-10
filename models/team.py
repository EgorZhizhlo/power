from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean
)
from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class TeamModel(BaseModel, TimeMixin):
    __tablename__ = "teams"

    name = Column(String(100), nullable=False)
    company_id = Column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False)
    is_deleted = Column(Boolean, default=False)

    verifiers = relationship(
        "VerifierModel",
        back_populates="team",
        passive_deletes=True
    )
    company = relationship("CompanyModel", back_populates="teams")
