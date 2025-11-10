from sqlalchemy import Column, Integer, ForeignKey, Table
from infrastructure.db.base import BaseModel


employees_cities = Table(
    'employees_cities',
    BaseModel.metadata,
    Column(
        'employee_id',
        Integer,
        ForeignKey('employees.id', ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        'city_id',
        Integer,
        ForeignKey('cities.id', ondelete="CASCADE"),
        primary_key=True
    ),
)
