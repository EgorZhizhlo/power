from datetime import date as date_
from typing import Optional
from pydantic import BaseModel


class ReportProtocolsForm(BaseModel):
    date_from: Optional[date_] = None
    date_to: Optional[date_] = None
    series_id: Optional[int] = None
    employee_id: Optional[int] = None
    use_opt_status: bool = False
