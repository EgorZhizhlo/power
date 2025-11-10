from apps.company_app.features import (
    act_numbers_api_router,
    act_numbers_frontend_router,
    act_series_api_router,
    act_series_frontend_router,
    calendar_reports_api_router,
    calendar_reports_frontend_router,
    cities_api_router,
    cities_frontend_router,
    companies_menu_api_router,
    companies_menu_frontend_router,
    employees_api_router,
    employees_frontend_router,
    equipment_informations_api_router,
    equipment_informations_frontend_router,
    equipments_api_router,
    equipments_frontend_router,
    form2_api_router,
    activities_router,
    si_types_router,
    equipment_report_api_router,
    files_control_api_router,
    locations_api_router,
    locations_frontend_router,
    methods_api_router,
    methods_frontend_router,
    reasons_api_router,
    reasons_frontend_router,
    registry_numbers_api_router,
    registry_numbers_frontend_router,
    routes_api_router,
    routes_frontend_router,
    si_modifications_api_router,
    si_modifications_frontend_router,
    teams_api_router,
    teams_frontend_router,
    verification_reports_api_router,
    verification_reports_frontend_router,
    verifiers_api_router,
    verifiers_frontend_router,
)

from fastapi import APIRouter


company_router = APIRouter(prefix="/companies")

# API
company_router.include_router(act_numbers_api_router)
company_router.include_router(act_series_api_router)
company_router.include_router(calendar_reports_api_router)
company_router.include_router(cities_api_router)
company_router.include_router(companies_menu_api_router)
company_router.include_router(employees_api_router)
company_router.include_router(equipment_informations_api_router)
company_router.include_router(equipments_api_router)
company_router.include_router(equipment_report_api_router)
company_router.include_router(form2_api_router)
company_router.include_router(activities_router)
company_router.include_router(si_types_router)
company_router.include_router(files_control_api_router)
company_router.include_router(locations_api_router)
company_router.include_router(methods_api_router)
company_router.include_router(reasons_api_router)
company_router.include_router(registry_numbers_api_router)
company_router.include_router(routes_api_router)
company_router.include_router(si_modifications_api_router)
company_router.include_router(teams_api_router)
company_router.include_router(verification_reports_api_router)
company_router.include_router(verifiers_api_router)

# FRONTEND
company_router.include_router(act_numbers_frontend_router)
company_router.include_router(act_series_frontend_router)
company_router.include_router(calendar_reports_frontend_router)
company_router.include_router(cities_frontend_router)
company_router.include_router(companies_menu_frontend_router)
company_router.include_router(employees_frontend_router)
company_router.include_router(equipment_informations_frontend_router)
company_router.include_router(equipments_frontend_router)
company_router.include_router(locations_frontend_router)
company_router.include_router(methods_frontend_router)
company_router.include_router(reasons_frontend_router)
company_router.include_router(registry_numbers_frontend_router)
company_router.include_router(routes_frontend_router)
company_router.include_router(si_modifications_frontend_router)
company_router.include_router(teams_frontend_router)
company_router.include_router(verification_reports_frontend_router)
company_router.include_router(verifiers_frontend_router)
