from sqlalchemy import Column, Integer, ForeignKey, Table
from infrastructure.db.base import BaseModel


employees_companies = Table(
    'employees_companies',
    BaseModel.metadata,
    Column(
        'employee_id',
        Integer,
        ForeignKey('employees.id', ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        'company_id',
        Integer,
        ForeignKey('companies.id', ondelete="CASCADE"),
        primary_key=True
    )
)
