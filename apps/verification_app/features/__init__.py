from apps.verification_app.features.arshin_api import arshin_router
from apps.verification_app.features.common_api import (
    registry_number_router,
    act_number_router
)
from apps.verification_app.features.orders_control import (
    orders_control_api_router,
    orders_control_frontend_router
)
from apps.verification_app.features.verifications_control import (
    verifications_control_api_router,
    verifications_control_frontend_router
)
from apps.verification_app.features.reports import (
    reports_api_router,
    reports_frontend_router
)
from apps.verification_app.features.metrologs_control import (
    metrologs_control_api_router,
    metrologs_control_frontend_router
)
from apps.verification_app.features.verification_protocols_control import (
    verification_protocols_router
)


__all__ = [
    "arshin_router",
    "registry_number_router",
    "act_number_router",
    "orders_control_api_router",
    "orders_control_frontend_router",
    "verifications_control_api_router",
    "verifications_control_frontend_router",
    "reports_api_router",
    "reports_frontend_router",
    "metrologs_control_api_router",
    "metrologs_control_frontend_router",
    "verification_protocols_router",
]
