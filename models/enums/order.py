from enum import StrEnum


class OrderWaterType(StrEnum):
    cold = "cold"           # Х
    hot = "hot"             # Г
    cold_hot = "cold_hot"  # Х+Г
    unnamed = "unnamed"     # Н

    @property
    def label(self) -> str:
        return {
            OrderWaterType.cold: "Х",
            OrderWaterType.hot: "Г",
            OrderWaterType.cold_hot: "Х+Г",
            OrderWaterType.unnamed: "Н",
        }[self]


class OrderStatus(StrEnum):
    pending = "pending"      # принято
    approved = "approved"    # согласовано ожидание

    @property
    def label(self) -> str:
        return {
            OrderStatus.pending: "Принято",
            OrderStatus.approved: "Согласовано ожидание",
        }[self]


map_order_status_to_label: dict[str, str] = {
    status.value: status.label for status in OrderStatus
}

map_order_water_type_to_label: dict[str, str] = {
    w.value: w.label
    for w in OrderWaterType
}
