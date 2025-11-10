from enum import StrEnum


class EquipmentType(StrEnum):
    standard = 'standard'
    measurement = 'measurement'
    auxiliary = 'auxiliary'
    other = 'other'

    @property
    def label(self) -> str:
        return {
            EquipmentType.standard: 'Средство измерений, используемое в качестве эталона',
            EquipmentType.measurement: 'Средство измерений',
            EquipmentType.auxiliary: 'Вспомогательное оборудование',
            EquipmentType.other: 'Другое',
        }[self]


map_equipment_type_to_label: dict[str, str] = {
    status.value: status.label for status in EquipmentType
}
