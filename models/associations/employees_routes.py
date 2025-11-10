from sqlalchemy import Column, Integer, ForeignKey, Table
from infrastructure.db.base import BaseModel


employees_routes = Table(
    'employees_routes',
    BaseModel.metadata,
    Column(
        'employee_id',
        Integer,
        ForeignKey('employees.id', ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        'route_id',
        Integer,
        ForeignKey('routes.id', ondelete="CASCADE"),
        primary_key=True
    ),
)
