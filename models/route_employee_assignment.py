from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, Date, ForeignKey, PrimaryKeyConstraint
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class RouteEmployeeAssignmentModel(BaseModel, TimeMixin):
    __tablename__ = "route_employee_assignment"
    __table_args__ = (
        PrimaryKeyConstraint(
            "route_id", "employee_id", "date", name="pk_route_date"),
    )

    id = None

    route_id = Column(
        Integer,
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False,
    )
    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )
    date = Column(Date, nullable=False)

    # --- relationships ---
    route = relationship(
        "RouteModel",
        back_populates="assignments",
        passive_deletes=True,
    )
    employee = relationship(
        "EmployeeModel",
        back_populates="assignments",
        passive_deletes=True,
    )
