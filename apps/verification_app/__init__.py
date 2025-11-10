from fastapi import APIRouter

from apps.verification_app.features import (
    arshin_router,
    registry_number_router,
    act_number_router,
    verification_protocols_router,
    orders_control_api_router,
    orders_control_frontend_router,
    verifications_control_api_router,
    verifications_control_frontend_router,
    metrologs_control_api_router,
    metrologs_control_frontend_router,
    reports_api_router,
    reports_frontend_router,
)


verification_router = APIRouter(prefix="/verification")

# API
verification_router.include_router(
    arshin_router
)  # /api/arshin
verification_router.include_router(
    registry_number_router
)  # /api/registry-numbers
verification_router.include_router(
    act_number_router
)  # /api/act-numbers
verification_router.include_router(
    verification_protocols_router
)  # /api/verification-protocols
verification_router.include_router(
    orders_control_api_router
)  # /api/orders-control
verification_router.include_router(
    verifications_control_api_router
)  # /api/verifications-control
verification_router.include_router(
    metrologs_control_api_router
)  # /api/metrologs-control
verification_router.include_router(
    reports_api_router
)  # /api/reports


# FRONTEND
verification_router.include_router(
    orders_control_frontend_router
)  # /orders-control
verification_router.include_router(
    verifications_control_frontend_router
)  # /
verification_router.include_router(
    metrologs_control_frontend_router
)  # /metrologs-control
verification_router.include_router(
    reports_frontend_router
)  # /reports
