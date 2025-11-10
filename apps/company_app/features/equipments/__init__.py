from .api.router import equipments_api_router
from .api.equipment_report_router import equipment_report_api_router
from .api.form2_router import form2_api_router
from .api.activity_router import activities_router
from .api.si_type_router import si_types_router
from .frontend.router import equipments_frontend_router


__all__ = [
    'form2_api_router', 'activities_router', 'si_types_router',
    'equipments_api_router', 'equipments_frontend_router',
    'equipment_report_api_router'
]
