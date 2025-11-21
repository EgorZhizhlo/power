from pydantic import BaseModel, model_validator
from datetime import date


class VriRequestSchema(BaseModel):
    date_from: date
    date_to: date

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.date_to < self.date_from:
            raise ValueError('"date_to" должно быть больше или равно "date_from"')
        return self
