from pydantic import BaseModel, ConfigDict
from datetime import date as date_
from typing import Optional, List
from models.enums import VerificationWaterType


class StatisticsForm(BaseModel):
    date_from: Optional[date_] = None
    date_to: Optional[date_] = None


class StatisticsItem(BaseModel):
    """Схема для одной записи статистики."""
    number: int
    name: str
    passed: int
    failed: int
    cold_water: int
    hot_water: int
    checkbox_1: int
    checkbox_2: int
    checkbox_3: int
    checkbox_4: int
    checkbox_5: int

    model_config = ConfigDict(from_attributes=True)


class StatisticsResponse(BaseModel):
    """Ответ API для статистики по городам."""
    data: List[StatisticsItem]


class FullReportForm(BaseModel):
    date_from:      Optional[date_] = None
    date_to:        Optional[date_] = None
    client_address: Optional[str] = None
    factory_number: Optional[str] = None
    series_id:      Optional[int] = None
    client_phone:   Optional[str] = None
    city_id:        Optional[int] = None
    employee_id:    Optional[int] = None
    water_type:     Optional[VerificationWaterType] = None
    act_number:     Optional[int] = None

    model_config = ConfigDict(populate_by_name=True)


class ReportProtocolsForm(BaseModel):
    date_from: Optional[date_] = None
    date_to: Optional[date_] = None
    series_id: Optional[int] = None
    employee_id: Optional[int] = None


class ReportActNumberForm(BaseModel):
    series_id: Optional[int] = None
    act_number_to: Optional[int] = None
    act_number_from: Optional[int] = None
