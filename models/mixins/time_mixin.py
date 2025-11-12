from sqlalchemy import DateTime, Column
from core.utils.time_utils import datetime_utc_now


class TimeMixin:
    """
    Mixin для автоматического добавления UTC-aware времени
     создания и обновления.
    """

    created_at = Column(
        DateTime(timezone=True),
        default=datetime_utc_now,
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=datetime_utc_now,
        onupdate=datetime_utc_now,
        nullable=False,
    )
