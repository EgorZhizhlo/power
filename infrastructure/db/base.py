from sqlalchemy import Integer
from sqlalchemy.orm import DeclarativeBase, Column
from sqlalchemy.ext.asyncio import AsyncAttrs


class BaseModel(AsyncAttrs, DeclarativeBase):
    """Базовый класс для всех моделей"""
    __abstract__ = True

    id = Column(
        Integer, primary_key=True, index=True, autoincrement=True
    )
