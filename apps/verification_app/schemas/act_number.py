from datetime import date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from models.enums import VerificationLegalEntity


class ActNumberPhotoResponse(BaseModel):
    file_name: str
    url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ActNumberResponse(BaseModel):
    act_number: int
    client_full_name: Optional[str] = None
    client_phone: Optional[str] = None
    address: Optional[str] = None
    verification_date: Optional[date] = None
    legal_entity: VerificationLegalEntity
    city_id: Optional[int] = None

    photos: List[ActNumberPhotoResponse] = []

    model_config = ConfigDict(from_attributes=True)
