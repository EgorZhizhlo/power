from fastapi import status as status_codes

from core.exceptions.base import (
    ApiHttpException,
)


class CreateMetrologInfoAccessError(ApiHttpException):
    def __init__(
        self,
        detail: str = (
            "Невозможно создать запись метрологических характеристик.\n"
            "Проверьте следующее:\n"
            "• Запись метрологических характеристик ещё не создана для этой поверки;\n"
            "• Запись поверки, к которой вы добавляете характеристики, существует;\n"
            "• У вас есть права на выполнение этого действия;\n"
            "• Удаление не запрещено политикой блокировки по дате поверки компании;\n"
        ),
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class UpdateMetrologInfoAccessError(ApiHttpException):
    def __init__(
        self,
        detail: str = (
            "Невозможно изменить запись метрологических характеристик.\n"
            "Проверьте следующее:\n"
            "• Запись метрологических характеристик, которую вы пытаетесь изменить, существует;\n"
            "• Существует запись поверки, связанная с этой метрологической записью;\n"
            "• У вас есть права на выполнение этого действия;\n"
            "• Удаление не запрещено политикой блокировки по дате поверки компании;\n"
        ),
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class DeleteMetrologInfoAccessError(ApiHttpException):
    def __init__(
        self,
        detail: str = (
            "Невозможно удалить запись метрологических характеристик.\n"
            "Проверьте следующее:\n"
            "• Запись метрологических характеристик, которую вы пытаетесь удалить, существует;\n"
            "• Существует запись поверки, связанная с этой метрологической записью;\n"
            "• У вас есть права на выполнение этого действия;\n"
            "• Удаление не запрещено политикой блокировки по дате поверки компании;\n"
        ),
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


