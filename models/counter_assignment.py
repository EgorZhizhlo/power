from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, CheckConstraint, ForeignKey
)

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class CounterAssignmentModel(BaseModel, TimeMixin):
    __tablename__ = 'counter_assignments'
    __table_args__ = (
        CheckConstraint(
            'counter_limit >= 0', name='ck_counter_limit_non_negative'
        ),
        CheckConstraint(
            'counter_limit <= 10', name='ck_counter_limit_max_10'
        ),
    )

    counter_limit = Column(Integer, nullable=True)

    order_id = Column(
        Integer,
        ForeignKey('orders.id', ondelete="CASCADE"),
        nullable=False,
        unique=True
    )
    employee_id = Column(
        Integer,
        ForeignKey('employees.id', ondelete="CASCADE"),
        nullable=False
    )

    # --- relationships ---
    order = relationship(
        'OrderModel',
        passive_deletes=True
    )
    employee = relationship(
        'EmployeeModel',
        passive_deletes=True
    )
