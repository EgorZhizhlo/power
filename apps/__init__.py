from apps.auth_app import auth_router
from apps.calendar_app import calendar_router
from apps.company_app import company_router
from apps.verification_app import verification_router
from apps.tariff_app import tariff_router


__all__ = [
    "auth_router",
    "calendar_router",
    "company_router",
    "verification_router",
    "tariff_router",
]
