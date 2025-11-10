from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column
from core.utils.time_utils import datetime_utc_now


class TimeMixin:
    """
    Mixin для автоматического добавления UTC-aware времени
     создания и обновления.
    """

    created_at: Mapped = mapped_column(
        DateTime(timezone=True),
        default=datetime_utc_now,
        nullable=False,
    )

    updated_at: Mapped = mapped_column(
        DateTime(timezone=True),
        default=datetime_utc_now,
        onupdate=datetime_utc_now,
        nullable=False,
    )
