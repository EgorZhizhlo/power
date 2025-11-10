from enum import StrEnum


class AppealStatus(StrEnum):
    accepted = "accepted"
    in_progress = "in_progress"
    done = "done"

    @property
    def label(self) -> str:
        return {
            AppealStatus.accepted: "Принято",
            AppealStatus.in_progress: "В работе",
            AppealStatus.done: "Выполнено",
        }[self]


map_appeal_status_to_label: dict[str, str] = {
    status.value: status.label for status in AppealStatus
}
