from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, Date, ForeignKey, CheckConstraint
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class VerificationLogModel(BaseModel, TimeMixin):
    __tablename__ = 'verification_logs'
    __table_args__ = (
        CheckConstraint(
            'verification_limit >= -3',
            name='ck_verification_limit_non_negative'),
    )

    verification_date = Column(Date, nullable=False)
    verification_limit = Column(Integer, default=0, nullable=False)

    verifier_id = Column(
        Integer,
        ForeignKey('verifiers.id', ondelete="CASCADE"),
        nullable=False
    )

    # --- relationships ---
    verifier = relationship(
        'VerifierModel', back_populates='verification_logs')
