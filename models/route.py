from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Boolean
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin
from models.associations import employees_routes


class RouteModel(BaseModel, TimeMixin):
    __tablename__ = "routes"

    name = Column(String(255), nullable=False)
    day_limit = Column(Integer, nullable=False)
    color = Column(String(20))

    is_deleted = Column(Boolean, default=False)

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
    )

    # --- relationships ---
    company = relationship(
        "CompanyModel", back_populates="routes"
    )
    route_statistic = relationship(
        "RouteStatisticModel",
        back_populates="route",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    route_addition = relationship(
        "RouteAdditionalModel",
        back_populates="route",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    assignments = relationship(
        "RouteEmployeeAssignmentModel",
        back_populates="route",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    employees = relationship(
        "EmployeeModel",
        secondary=employees_routes,
        back_populates="routes",
        lazy="selectin",
        passive_deletes=True,
    )
    orders = relationship(
        "OrderModel",
        back_populates="route",
        passive_deletes=True,
    )
