from apps.company_app.features.act_numbers import (
    act_numbers_api_router,
    act_numbers_frontend_router
)
from apps.company_app.features.act_series import (
    act_series_api_router,
    act_series_frontend_router
)
from apps.company_app.features.calendar_reports import (
    calendar_reports_api_router,
    calendar_reports_frontend_router
)
from apps.company_app.features.cities import (
    cities_api_router,
    cities_frontend_router
)
from apps.company_app.features.companies_menu import (
    companies_menu_api_router,
    companies_menu_frontend_router
)
from apps.company_app.features.employees import (
    employees_api_router,
    employees_frontend_router
)
from apps.company_app.features.equipment_informations import (
    equipment_informations_api_router,
    equipment_informations_frontend_router
)
from apps.company_app.features.equipments import (
    equipments_api_router,
    equipments_frontend_router,
    form2_api_router,
    activities_router,
    si_types_router,
    equipment_report_api_router
)
from apps.company_app.features.files_control import (
    files_control_api_router
)
from apps.company_app.features.locations import (
    locations_api_router,
    locations_frontend_router
)
from apps.company_app.features.methods import (
    methods_api_router,
    methods_frontend_router
)
from apps.company_app.features.reasons import (
    reasons_api_router,
    reasons_frontend_router
)
from apps.company_app.features.registry_numbers import (
    registry_numbers_api_router,
    registry_numbers_frontend_router
)
from apps.company_app.features.routes import (
    routes_api_router,
    routes_frontend_router
)
from apps.company_app.features.si_modifications import (
    si_modifications_api_router,
    si_modifications_frontend_router
)
from apps.company_app.features.teams import (
    teams_api_router,
    teams_frontend_router
)
from apps.company_app.features.verification_reports import (
    verification_reports_api_router,
    verification_reports_frontend_router
)
from apps.company_app.features.verifiers import (
    verifiers_api_router,
    verifiers_frontend_router
)


__all__ = [
    # act_numbers
    "act_numbers_api_router",
    "act_numbers_frontend_router",
    # act_series
    "act_series_api_router",
    "act_series_frontend_router",
    # calendar_reports
    "calendar_reports_api_router",
    "calendar_reports_frontend_router",
    # cities
    "cities_api_router",
    "cities_frontend_router",
    # companies_menu
    "companies_menu_api_router",
    "companies_menu_frontend_router",
    # employees
    "employees_api_router",
    "employees_frontend_router",
    # equipment_informations
    "equipment_informations_api_router",
    "equipment_informations_frontend_router",
    # equipments
    "equipments_api_router",
    "equipments_frontend_router",
    "form2_api_router",
    "activities_router",
    "si_types_router",
    "equipment_report_api_router",
    # files_control
    "files_control_api_router",
    # locations
    "locations_api_router",
    "locations_frontend_router",
    # methods
    "methods_api_router",
    "methods_frontend_router",
    # reasons
    "reasons_api_router",
    "reasons_frontend_router",
    # registry_numbers
    "registry_numbers_api_router",
    "registry_numbers_frontend_router",
    # routes
    "routes_api_router",
    "routes_frontend_router",
    # si_modifications
    "si_modifications_api_router",
    "si_modifications_frontend_router",
    # teams
    "teams_api_router",
    "teams_frontend_router",
    # verification_reports
    "verification_reports_api_router",
    "verification_reports_frontend_router",
    # verifiers
    "verifiers_api_router",
    "verifiers_frontend_router",
]
