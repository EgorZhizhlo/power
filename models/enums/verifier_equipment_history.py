from enum import StrEnum


class VerifierEquipmentAction(StrEnum):
    accepted = "accepted"
    declined = "declined"

    @property
    def label(self) -> str:
        return {
            VerifierEquipmentAction.accepted: "Принято",
            VerifierEquipmentAction.declined: "Отказано",
        }[self]


map_verifier_equipment_action_to_label: dict[str, str] = {
    status.value: status.label for status in VerifierEquipmentAction
}
