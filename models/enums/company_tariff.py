from enum import StrEnum


class CompanyTariffStatus(StrEnum):
    active = "active"
    limit_exceeded = "limit_exceeded"
    expired = "expired"
    paused = "paused"
    future = "future"
