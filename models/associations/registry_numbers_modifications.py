from sqlalchemy import Column, Integer, ForeignKey, Table
from infrastructure.db.base import BaseModel


registry_numbers_modifications = Table(
    'registry_numbers_modifications',
    BaseModel.metadata,
    Column(
        'modification_id',
        Integer,
        ForeignKey('si_modifications.id', ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        'registry_id',
        Integer,
        ForeignKey('registry_numbers.id', ondelete="CASCADE"),
        primary_key=True
    )
)
