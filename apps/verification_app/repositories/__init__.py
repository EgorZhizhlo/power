from apps.verification_app.repositories.act_number import (
    ActNumberRepository,
    read_act_number_repository,
    action_act_number_repository,
)
from apps.verification_app.repositories.metrolog_info import (
    MetrologInfoRepository,
    read_metrolog_info_repository,
    action_metrolog_info_repository,
)
from apps.verification_app.repositories.order import (
    OrderRepository,
    action_order_repository,
    read_order_repository,
)
from apps.verification_app.repositories.reason import (
    ReasonRepository,
    read_reason_repository,
    action_reason_repository,
)
from apps.verification_app.repositories.registry_number import (
    RegistryNumberRepository,
    read_registry_number_repository,
    action_registry_number_repository,
)
from apps.verification_app.repositories.verification_entry import (
    VerificationEntryRepository,
    read_verification_entry_repository,
    action_verification_entry_repository,
)
from apps.verification_app.repositories.employee_cities import (
    EmployeeCitiesRepository,
    read_employee_cities_repository,
)
from apps.verification_app.repositories.company import (
    CompanyRepository,
    read_company_repository,
    action_company_repository,
)
from apps.verification_app.repositories.verifier import (
    VerifierRepository,
    read_verifier_repository,
    action_verifier_repository,
)
from apps.verification_app.repositories.equipment import (
    EquipmentRepository,
    read_equipment_repository,
    action_equipment_repository,
)
from apps.verification_app.repositories.location import (
    LocationRepository,
    read_location_repository,
    action_location_repository,
)
from apps.verification_app.repositories.verification_log import (
    VerificationLogRepository,
    action_verification_log_repository,
)
from apps.verification_app.repositories.city import (
    CityRepository,
    read_city_repository,
    action_city_repository,
)
from apps.verification_app.repositories.act_series import (
    ActSeriesRepository,
    read_act_series_repository,
    action_act_series_repository,
)
from apps.verification_app.repositories.employee import (
    EmployeeRepository,
    read_employee_repository,
    action_employee_repository,
)
from apps.verification_app.repositories.report import (
    ReportRepository,
    read_report_repository,
    action_report_repository,
)


__all__ = [
    # act_number
    "ActNumberRepository",
    "read_act_number_repository",
    "action_act_number_repository",

    # metrolog_info
    "MetrologInfoRepository",
    "read_metrolog_info_repository",
    "action_metrolog_info_repository",

    # order
    "OrderRepository",
    "read_order_repository",
    "action_order_repository",

    # reason
    "ReasonRepository",
    "read_reason_repository",
    "action_reason_repository",

    # registry_number
    "RegistryNumberRepository",
    "read_registry_number_repository",
    "action_registry_number_repository",

    # verification_entry
    "VerificationEntryRepository",
    "read_verification_entry_repository",
    "action_verification_entry_repository",

    # employee_cities
    "EmployeeCitiesRepository",
    "read_employee_cities_repository",

    # company
    "CompanyRepository",
    "read_company_repository",
    "action_company_repository",

    # verifier
    "VerifierRepository",
    "read_verifier_repository",
    "action_verifier_repository",

    # equipment
    "EquipmentRepository",
    "read_equipment_repository",
    "action_equipment_repository",

    # location
    "LocationRepository",
    "read_location_repository",
    "action_location_repository",

    # verification_log
    "VerificationLogRepository",
    "action_verification_log_repository",

    # city
    "CityRepository",
    "read_city_repository",
    "action_city_repository",

    # act_series
    "ActSeriesRepository",
    "read_act_series_repository",
    "action_act_series_repository",

    # employee
    "EmployeeRepository",
    "read_employee_repository",
    "action_employee_repository",

    # report
    "ReportRepository",
    "read_report_repository",
    "action_report_repository",
]
