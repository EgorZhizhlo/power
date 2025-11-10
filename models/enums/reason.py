from enum import StrEnum


class ReasonType(StrEnum):
    p_2_7_1 = "p_2_7_1"
    p_2_7_2 = "p_2_7_2"
    p_2_7_3 = "p_2_7_3"

    @property
    def label(self) -> str:
        return {
            ReasonType.p_2_7_1: "П 2.7.1",
            ReasonType.p_2_7_2: "П 2.7.2",
            ReasonType.p_2_7_3: "П 2.7.3",
        }[self]


map_reason_type_to_label: dict[str, str] = {
    status.value: status.label for status in ReasonType
}
