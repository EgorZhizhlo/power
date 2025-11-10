from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, Float, ForeignKey, Boolean

from infrastructure.db.base import BaseModel

from models.mixins import TimeMixin


class MetrologInfoModel(BaseModel, TimeMixin):
    __tablename__ = "metrologs_info"

    qh = Column(Float)
    before_water_temperature = Column(Float)
    before_air_temperature = Column(Float)
    before_humdity = Column(Float)
    before_pressure = Column(Integer)
    after_water_temperature = Column(Float)
    after_air_temperature = Column(Float)
    after_humdity = Column(Float)
    after_pressure = Column(Integer)

    first_meter_water_according_qmin = Column(Float)
    second_meter_water_according_qmin = Column(Float)
    third_meter_water_according_qmin = Column(Float)

    first_meter_water_according_qp = Column(Float)
    second_meter_water_according_qp = Column(Float)
    third_meter_water_according_qp = Column(Float)

    first_meter_water_according_qmax = Column(Float)
    second_meter_water_according_qmax = Column(Float)
    third_meter_water_according_qmax = Column(Float)

    first_reference_water_according_qmin = Column(Float)
    second_reference_water_according_qmin = Column(Float)
    third_reference_water_according_qmin = Column(Float)

    first_reference_water_according_qp = Column(Float)
    second_reference_water_according_qp = Column(Float)
    third_reference_water_according_qp = Column(Float)

    first_reference_water_according_qmax = Column(Float)
    second_reference_water_according_qmax = Column(Float)
    third_reference_water_according_qmax = Column(Float)

    first_water_count_qmin = Column(Float)
    second_water_count_qmin = Column(Float)
    third_water_count_qmin = Column(Float)

    first_water_count_qp = Column(Float)
    second_water_count_qp = Column(Float)
    third_water_count_qp = Column(Float)

    first_water_count_qmax = Column(Float)
    second_water_count_qmax = Column(Float)
    third_water_count_qmax = Column(Float)

    use_opt = Column(Boolean, default=False)

    verification_id = Column(
        Integer,
        ForeignKey("verification_entries.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )

    # --- relationships ---
    verification = relationship(
        "VerificationEntryModel",
        back_populates="metrolog",
        passive_deletes=True
    )
    company = relationship(
        "CompanyModel",
        back_populates="metrologs"
    )
