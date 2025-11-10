from fastapi import APIRouter

from apps.auth_app.features import (
    auth_api_router,
    auth_frontend_router
)


auth_router = APIRouter(prefix="")
auth_router.include_router(auth_api_router)
auth_router.include_router(auth_frontend_router)
