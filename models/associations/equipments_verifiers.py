from sqlalchemy import Column, Integer, ForeignKey, Table
from infrastructure.db.base import BaseModel


equipments_verifiers = Table(
    "equipments_verifiers",
    BaseModel.metadata,
    Column(
        "equipment_id",
        Integer,
        ForeignKey("equipments.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "verifier_id",
        Integer,
        ForeignKey("verifiers.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
