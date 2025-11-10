from typing import List, Tuple

COMMON_TIMEZONES: List[Tuple[str, str]] = [
    ("Europe/Kaliningrad", "Калининград (UTC+2)"),
    ("Europe/Moscow", "Москва (UTC+3)"),
    ("Europe/Samara", "Самара (UTC+4)"),
    ("Asia/Yekaterinburg", "Екатеринбург (UTC+5)"),
    ("Asia/Omsk", "Омск (UTC+6)"),
    ("Asia/Novosibirsk", "Новосибирск (UTC+7)"),
    ("Asia/Krasnoyarsk", "Красноярск (UTC+7)"),
    ("Asia/Irkutsk", "Иркутск (UTC+8)"),
    ("Asia/Yakutsk", "Якутск (UTC+9)"),
    ("Asia/Vladivostok", "Владивосток (UTC+10)"),
    ("Asia/Magadan", "Магадан (UTC+11)"),
    ("Asia/Kamchatka", "Камчатка (UTC+12)"),
]

# Все поддерживаемые временные зоны
ALL_TIMEZONES: List[Tuple[str, str]] = COMMON_TIMEZONES


def get_timezone_name(timezone: str) -> str:
    for tz_id, tz_name in ALL_TIMEZONES:
        if tz_id == timezone:
            return tz_name
    return timezone


def validate_timezone(timezone: str) -> bool:
    try:
        from zoneinfo import ZoneInfo
        ZoneInfo(timezone)
        return True
    except Exception:
        return False
