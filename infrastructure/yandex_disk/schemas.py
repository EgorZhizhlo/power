from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date


class OperationMetadata(BaseModel):
    """Метаданные для операций с файлами/папками."""
    company_name: Optional[str] = None
    employee_fio: Optional[str] = None
    verification_date: Optional[date] = None
    act_series: Optional[str] = None
    act_number: Optional[str] = None

    @field_validator("act_number", mode="before")
    def validate_act_number_operation(cls, v):
        if v is None:
            return None
        if isinstance(v, int):
            v = str(v)
        return v


class DocumentMetadata(BaseModel):
    """Метаданные для структурированного хранения документов."""
    company_name: str
    employee_fio: str
    verification_date: date
    act_series: str
    act_number: str

    @field_validator("act_number", mode="before")
    def validate_act_number_document(cls, v):
        if isinstance(v, int):
            v = str(v)
        return v


class FileInfo(BaseModel):
    """Информация о загруженном файле."""
    filename: str
    original_filename: str
    remote_path: str
    public_url: Optional[str]
    size_bytes: int
    compressed: bool = False
