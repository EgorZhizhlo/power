from fastapi import APIRouter

from apps.tariff_app.features import (
    base_tariffs_api_router,
    base_tariffs_frontend_router,
    company_tariffs_api_router,
    company_tariffs_frontend_router,
)


tariff_router = APIRouter(prefix="/tariff")

# FRONTEND
tariff_router.include_router(base_tariffs_frontend_router)
tariff_router.include_router(company_tariffs_frontend_router)

# API
tariff_router.include_router(base_tariffs_api_router)
tariff_router.include_router(company_tariffs_api_router)
