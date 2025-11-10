from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean, CheckConstraint
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class LocationModel(BaseModel, TimeMixin):
    __tablename__ = 'locations'

    __table_args__ = (
        CheckConstraint('count >= 0', name='ck_count_non_negative'),
    )

    name = Column(String(60), nullable=False)
    count = Column(Integer, default=0, nullable=False)

    is_deleted = Column(Boolean, default=False)

    company_id = Column(
        Integer,
        ForeignKey('companies.id', ondelete='CASCADE'),
        nullable=False
    )

    # --- relationships ---
    verifications = relationship(
        'VerificationEntryModel',
        back_populates='location',
        passive_deletes=True
    )
    company = relationship(
        'CompanyModel',
        back_populates='locations'
    )
