from datetime import datetime, timezone


def datetime_utc_now():
    return datetime.now(tz=timezone.utc)


def date_utc_now():
    return datetime_utc_now().date()
