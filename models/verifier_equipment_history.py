from sqlalchemy import Column, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship

from infrastructure.db.base import BaseModel

from models.enums import VerifierEquipmentAction
from models.mixins import TimeMixin


class VerifierEquipmentHistoryModel(BaseModel, TimeMixin):
    __tablename__ = "verifier_equipment_history"

    action = Column(
        Enum(VerifierEquipmentAction, name="verifier_equipment_action_enum"),
        nullable=False,
    )

    verifier_id = Column(
        Integer,
        ForeignKey("verifiers.id", ondelete="CASCADE"),
        nullable=False,
    )
    equipment_id = Column(
        Integer,
        ForeignKey("equipments.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- relationships ---
    verifier = relationship(
        "VerifierModel", back_populates="equipment_history"
    )
    equipment = relationship(
        "EquipmentModel", back_populates="verifier_history"
    )
