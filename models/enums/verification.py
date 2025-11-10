from enum import StrEnum


class VerificationWaterType(StrEnum):
    cold = "cold"
    hot = "hot"

    @property
    def label(self) -> str:
        return {
            VerificationWaterType.cold: "Холодная",
            VerificationWaterType.hot: "Горячая",
        }[self]


class VerificationSeal(StrEnum):
    present = "present"
    damaged = "damaged"
    missing = "missing"

    @property
    def label(self) -> str:
        return {
            VerificationSeal.present: "Есть",
            VerificationSeal.damaged: "Повреждена",
            VerificationSeal.missing: "Отсутствует",
        }[self]


class VerificationLegalEntity(StrEnum):
    individual = "individual"
    legal = "legal"

    @property
    def label(self) -> str:
        return {
            VerificationLegalEntity.individual: "Физ. лицо",
            VerificationLegalEntity.legal: "Юр. лицо",
        }[self]


map_verification_water_type_to_label: dict[str, str] = {
    w.value: w.label for w in VerificationWaterType
}

map_verification_seal_to_label: dict[str, str] = {
    s.value: s.label for s in VerificationSeal
}

map_verification_legal_entity_to_label: dict[str, str] = {
    e.value: e.label for e in VerificationLegalEntity
}
