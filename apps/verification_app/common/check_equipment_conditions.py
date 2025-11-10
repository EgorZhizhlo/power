from core.time_utils import date_utc_now
from apps.verification_app.exceptions import (
    VerificationEquipmentException, VerificationEquipmentExpiredException,
    CustomVerificationEquipmentException,
    CustomVerificationEquipmentExpiredException
)
from models.enums import EquipmentInfoType


def check_equip_conditions(equipments, company_id: int = None, for_view: bool = False) -> None:
    if not equipments:
        if for_view:
            raise CustomVerificationEquipmentException
        raise VerificationEquipmentException

    today = date_utc_now()
    expired_equipment = []

    for equipment in equipments:
        if not equipment.equipment_info:
            continue

        verif_infos = [
            info
            for info in equipment.equipment_info
            if info.type == EquipmentInfoType.verification
        ]

        if not verif_infos:
            continue

        latest_info = max(
            verif_infos,
            key=lambda x: x.verif_limit_date
        )

        if (
            latest_info.verif_limit_date is None
            or latest_info.verif_limit_date < today
        ):
            expired_equipment.append(
                f"{equipment.name} (Зав. № {equipment.factory_number})"
            )

    if expired_equipment:
        if for_view:
            raise CustomVerificationEquipmentExpiredException(
                equipments=expired_equipment
            )
        raise VerificationEquipmentExpiredException(
            equipments=expired_equipment
        )
