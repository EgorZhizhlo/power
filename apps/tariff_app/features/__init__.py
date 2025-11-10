from apps.tariff_app.features.base_tariffs import (
    base_tariffs_api_router,
    base_tariffs_frontend_router
)
from apps.tariff_app.features.company_tariffs import (
    company_tariffs_api_router,
    company_tariffs_frontend_router
)


__all__ = [
    "base_tariffs_api_router",
    "base_tariffs_frontend_router",
    "company_tariffs_api_router",
    "company_tariffs_frontend_router",
]
