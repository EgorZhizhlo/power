from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, Date, ForeignKey, String,
    UniqueConstraint
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class RouteAdditionalModel(BaseModel, TimeMixin):
    __tablename__ = "route_additions"
    __table_args__ = (
        UniqueConstraint(
            "route_id", "date", name="uq_route_additions_route_date"
        ),
    )

    date = Column(Date, nullable=False)
    additional_info = Column(String)

    route_id = Column(
        Integer,
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- relationships ---
    route = relationship(
        "RouteModel",
        back_populates="route_addition",
        passive_deletes=True,
    )
