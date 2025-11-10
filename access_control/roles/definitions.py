from models.enums import EmployeeStatus


employee_status: set[EmployeeStatus] = set(EmployeeStatus)

# === Компании ===
access_company: set[EmployeeStatus] = {
    EmployeeStatus.admin,
    EmployeeStatus.director,
}
access_company_no_admin: set[EmployeeStatus] = {
    EmployeeStatus.director,
}

no_access_company: set[EmployeeStatus] = (
    set(EmployeeStatus) - access_company
)

# === Поверка ===
access_verification: set[EmployeeStatus] = {
    EmployeeStatus.admin,
    EmployeeStatus.director,
    EmployeeStatus.auditor,
    EmployeeStatus.verifier,
}
access_verification_no_admin: set[EmployeeStatus] = {
    EmployeeStatus.director,
    EmployeeStatus.auditor,
    EmployeeStatus.verifier,
}
no_access_verification: set[EmployeeStatus] = (
    set(EmployeeStatus) - access_verification
)

# === Календарь ===
access_calendar: set[EmployeeStatus] = {
    EmployeeStatus.admin,
    EmployeeStatus.director,
    EmployeeStatus.auditor,
    EmployeeStatus.dispatcher1,
    EmployeeStatus.dispatcher2,
}
access_calendar_no_admin: set[EmployeeStatus] = {
    EmployeeStatus.director,
    EmployeeStatus.auditor,
    EmployeeStatus.dispatcher1,
    EmployeeStatus.dispatcher2,
}
no_access_calendar: set[EmployeeStatus] = (
    set(EmployeeStatus) - access_calendar
)

# === Тарифы ===
access_tarif: set[EmployeeStatus] = {
    EmployeeStatus.admin,
}

#  === Группы ролей для упрощённых проверок ===
admin_director: set[EmployeeStatus] = {
    EmployeeStatus.admin,
    EmployeeStatus.director
}
admin_director_auditor: set[EmployeeStatus] = {
    EmployeeStatus.admin,
    EmployeeStatus.director,
    EmployeeStatus.auditor,
}

director_auditor: set[EmployeeStatus] = {
    EmployeeStatus.director,
    EmployeeStatus.auditor,
}
director_auditor_verifier: set[EmployeeStatus] = {
    EmployeeStatus.director,
    EmployeeStatus.auditor,
    EmployeeStatus.verifier,
}
director_auditor_dispatchers: set[EmployeeStatus] = {
    EmployeeStatus.director,
    EmployeeStatus.auditor,
    EmployeeStatus.dispatcher1,
    EmployeeStatus.dispatcher2
}

auditor_verifier: set[EmployeeStatus] = {
    EmployeeStatus.auditor,
    EmployeeStatus.verifier
}
auditor_dispatchers: set[EmployeeStatus] = {
    EmployeeStatus.auditor,
    EmployeeStatus.dispatcher1,
    EmployeeStatus.dispatcher2
}

dispatchers: set[EmployeeStatus] = {
    EmployeeStatus.dispatcher1,
    EmployeeStatus.dispatcher2
}
dispatcher1: EmployeeStatus = EmployeeStatus.dispatcher1
dispatcher2: EmployeeStatus = EmployeeStatus.dispatcher2

verifier: EmployeeStatus = EmployeeStatus.verifier
