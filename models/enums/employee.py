from enum import StrEnum


class EmployeeStatus(StrEnum):
    admin = "admin"
    director = "director"
    auditor = "auditor"
    dispatcher1 = "dispatcher1"
    dispatcher2 = "dispatcher2"
    verifier = "verifier"

    @property
    def label(self) -> str:
        return {
            EmployeeStatus.admin: "Администратор",
            EmployeeStatus.director: "Руководитель компании",
            EmployeeStatus.auditor: "Ревизор",
            EmployeeStatus.dispatcher1: "Диспетчер 1",
            EmployeeStatus.dispatcher2: "Диспетчер 2",
            EmployeeStatus.verifier: "Поверитель",
        }[self]


map_employee_status_to_label: dict[str, str] = {
    status.value: status.label for status in EmployeeStatus
}
