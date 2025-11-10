from pathlib import Path
from typing import ClassVar, Final
from datetime import datetime as Datetime, timezone, timedelta
from pydantic_settings import BaseSettings, SettingsConfigDict
from models.enums import EmployeeStatus


_ROOT = Path(__file__).parent.parent


def to_moscow(value: Datetime):
    if isinstance(value, Datetime):
        msk_tz = timezone(timedelta(hours=3))
        return value.astimezone(msk_tz)
    return value


def format_date(value, format: str = "%d.%m.%Y"):
    value = to_moscow(value)
    return value.strftime(format) if isinstance(value, Datetime) else value


def format_datetime(
        value, format: str = "%d.%m.%Y %H:%M:%S"):
    value = to_moscow(value)
    return value.strftime(format) if isinstance(value, Datetime) else value


class Settings(BaseSettings):
    BASE_DIR: Path = _ROOT
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / '.env',
        env_file_encoding='utf-8',
    )

    database_url: str

    # === Redis ===
    redis_url: str

    # === Секреты и креды ===
    secret_key: str
    salt: str

    # === base admin info ===
    admin_username: str
    admin_password: str

    # === Таймаут токена (секунды) ===
    jwt_token_expiration: Final[int] = 60 * 60 * 24 * 30  # 30 дней

    # === Кеширование тарифов (секунды) ===
    tariff_cache_ttl: Final[int] = 60 * 60 * 24 * 30  # 30 дней

    entries_per_page: Final[int] = 20

    # === Лимит фото в поверке ===
    verification_photo_limit: Final[int] = 5

    # === URL ===
    logout_url: str = "/logout"
    login_url: str = "/"

    company_url: str = "/companies"
    verification_url: str = "/verification"
    calendar_url: str = "/calendar"

    # === Группы ролей ===

    EMPLOYEE_STATUSES: set[EmployeeStatus] = set(EmployeeStatus)

    ACCESS_COMPANY: set[EmployeeStatus] = {
        EmployeeStatus.admin,
        EmployeeStatus.director,
    }
    ACCESS_COMPANY_NO_ADMIN: set[EmployeeStatus] = {
        EmployeeStatus.director,
    }
    NO_ACCESS_COMPANY: set[EmployeeStatus] = (
        set(EmployeeStatus) - ACCESS_COMPANY
    )

    ACCESS_VERIFICATION: set[EmployeeStatus] = {
        EmployeeStatus.admin,
        EmployeeStatus.director,
        EmployeeStatus.auditor,
        EmployeeStatus.verifier,
    }
    ACCESS_VERIFICATION_NO_ADMIN: set[EmployeeStatus] = {
        EmployeeStatus.director,
        EmployeeStatus.auditor,
        EmployeeStatus.verifier,
    }
    NO_ACCESS_VERIFICATION: set[EmployeeStatus] = (
        set(EmployeeStatus) - ACCESS_VERIFICATION
    )

    ACCESS_CALENDAR: set[EmployeeStatus] = {
        EmployeeStatus.admin,
        EmployeeStatus.director,
        EmployeeStatus.auditor,
        EmployeeStatus.dispatcher1,
        EmployeeStatus.dispatcher2,
    }
    ACCESS_CALENDAR_NO_ADMIN: set[EmployeeStatus] = {
        EmployeeStatus.director,
        EmployeeStatus.auditor,
        EmployeeStatus.dispatcher1,
        EmployeeStatus.dispatcher2,
    }
    NO_ACCESS_CALENDAR: set[EmployeeStatus] = (
        set(EmployeeStatus) - ACCESS_CALENDAR
    )

    DISPATCHER2: set[EmployeeStatus] = {
        EmployeeStatus.dispatcher2
    }
    DISPATCHERS: set[EmployeeStatus] = {
        EmployeeStatus.dispatcher1,
        EmployeeStatus.dispatcher2
    }

    ADMIN_DIRECTOR: set[EmployeeStatus] = {
        EmployeeStatus.admin,
        EmployeeStatus.director
    }

    AUDITOR_VERIFIER: set[EmployeeStatus] = {
        EmployeeStatus.auditor,
        EmployeeStatus.verifier
    }
    VERIFIER: set[EmployeeStatus] = {
        EmployeeStatus.verifier
    }

    ADMIN_DIRECTOR_AUDITOR: set[EmployeeStatus] = {
        EmployeeStatus.admin,
        EmployeeStatus.director,
        EmployeeStatus.auditor,
    }

    DIRECTOR_AUDITOR: set[EmployeeStatus] = {
        EmployeeStatus.director,
        EmployeeStatus.auditor,
    }

    # === Доступ к управлению тарифами ===
    ACCESS_TARIFF: set[EmployeeStatus] = {
        EmployeeStatus.admin,
    }

    DIRECTOR_AUDITOR_VERIFIER: set[EmployeeStatus] = {
        EmployeeStatus.director,
        EmployeeStatus.auditor,
        EmployeeStatus.verifier,
    }

    DIRECTOR_AUDITOR_DISPATCHERS: set[EmployeeStatus] = {
        EmployeeStatus.director,
        EmployeeStatus.auditor,
        EmployeeStatus.dispatcher1,
        EmployeeStatus.dispatcher2
    }
    AUDITOR_DISPATCHERS: set[EmployeeStatus] = {
        EmployeeStatus.auditor,
        EmployeeStatus.dispatcher1,
        EmployeeStatus.dispatcher2
    }

    max_int: int = 2147483647

    ALLOWED_VERIFICATION_PHOTO_EXT: set[str] = {
        "jpeg", "jpg", "png", "heic", "heif", "webp"
    }

    url_path_map: ClassVar[dict[EmployeeStatus, str]] = {
        EmployeeStatus.admin: "/companies",
        EmployeeStatus.director: "/companies",
        EmployeeStatus.auditor: "/verification",
        EmployeeStatus.dispatcher1: "/calendar",
        EmployeeStatus.dispatcher2: "/calendar",
        EmployeeStatus.verifier: "/verification",
    }


settings = Settings()
