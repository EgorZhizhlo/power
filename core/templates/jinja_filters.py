from datetime import datetime, date
from typing import Optional, Union
from zoneinfo import ZoneInfo

from core.timezones import get_timezone_name


def to_company_tz(
    dt: Optional[datetime],
    company_tz: str
) -> Optional[datetime]:
    """
    Конвертирует UTC datetime в timezone компании.
    """
    if dt is None:
        return None

    # Если naive - считаем UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))

    # Конвертируем в timezone компании
    tz = ZoneInfo(company_tz)
    return dt.astimezone(tz)


def format_datetime_tz(
    dt: Optional[datetime],
    company_tz: str,
    fmt: str = "%d.%m.%Y %H:%M:"
) -> str:
    """
    Форматирует UTC datetime в строку в timezone компании.

    Используется как Jinja2 фильтр:
    {{ created_at | strftime_full(company_tz) }}
    """
    if dt is None:
        return ""

    local_dt = to_company_tz(dt, company_tz)
    if local_dt is None:
        return ""

    return local_dt.strftime(fmt)


def format_date_tz(
    dt: Optional[datetime],
    company_tz: str,
    fmt: str = "%d.%m.%Y"
) -> str:
    """
    Форматирует только дату в timezone компании.

    Используется как Jinja2 фильтр:
    {{ created_at | strftime_date(company_tz) }}
    """
    return format_datetime_tz(dt, company_tz, fmt)


def parse_iso_date(date_str: Optional[Union[str, date]]) -> Optional[date]:
    """
    Парсит ISO строку даты (YYYY-MM-DD) в объект date.
    """
    if date_str is None:
        return None

    if isinstance(date_str, date):
        return date_str

    if isinstance(date_str, str):
        try:
            return datetime.fromisoformat(date_str).date()
        except (ValueError, AttributeError):
            return None

    return None


def register_jinja_filters(templates):
    """
    Регистрирует все фильтры для работы с timezone в Jinja2Templates.
    """
    templates.env.filters["strftime_full"] = format_datetime_tz
    templates.env.filters["strftime_date"] = format_date_tz
    templates.env.filters["to_company_tz"] = to_company_tz
    templates.env.filters["tz_name"] = get_timezone_name
    templates.env.filters["as_date"] = parse_iso_date
