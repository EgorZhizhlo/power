from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, Date, ForeignKey,
    UniqueConstraint, CheckConstraint
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class RouteStatisticModel(BaseModel, TimeMixin):
    __tablename__ = "route_statistic"

    __table_args__ = (
        UniqueConstraint(
            "route_id", "date",
            name="uq_route_statistic_route_date"
        ),
        CheckConstraint(
            "day_limit_free >= 0",
            name="ck_route_statistic_day_limit_free_non_negative"
        ),
    )

    date = Column(Date, nullable=False)
    day_limit_free = Column(Integer, nullable=False)

    route_id = Column(
        Integer,
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- relationships ---
    route = relationship(
        "RouteModel",
        back_populates="route_statistic",
        passive_deletes=True
    )
