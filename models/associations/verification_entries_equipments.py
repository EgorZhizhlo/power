from sqlalchemy import Table, Column, Integer, ForeignKey
from infrastructure.db.base import BaseModel


verification_entries_equipments = Table(
    "verification_entries_equipments",
    BaseModel.metadata,
    Column(
        "verification_entry_id",
        Integer,
        ForeignKey("verification_entries.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "equipment_id",
        Integer,
        ForeignKey("equipments.id", ondelete="CASCADE"),
        primary_key=True
    ),
)
