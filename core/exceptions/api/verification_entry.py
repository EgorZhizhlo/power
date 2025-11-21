from fastapi import status as status_codes

from core.exceptions.base import ApiHttpException


class VerificationLimitError(ApiHttpException):
    def __init__(
        self,
        detail: str = (
            "Лимит поверок на день в компании не задан или"
            " имеет недопустимое значение."
        )
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class VerificationVerifierError(ApiHttpException):
    def __init__(
        self,
        detail: str = (
            "У записи поверки не указан поверитель.\n"
            "Проверьте, что за записью закреплён поверитель."
        ),
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class VerificationEntryError(ApiHttpException):
    def __init__(
        self,
        detail: str = (
            "Запись поверки не найдена или не была создана.\n"
            "Проверьте, что за запись корректно сохранилась."
        ),
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class VerificationEquipmentError(ApiHttpException):
    def __init__(
        self,
        detail: str = (
            "За записью поверки не закреплено оборудование.\n"
            "Проверьте, что хотя бы одно средство измерения "
            "привязано к данной поверке."
        ),
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class VerificationEquipmentExpiredError(ApiHttpException):
    def __init__(self, equipments: list[str]):
        formatted_list = "\n• " + "\n• ".join(equipments)
        detail = (
            "У одного или нескольких средств измерений, "
            "закреплённых за записью поверки, истёк срок поверки.\n"
            "Необходимо провести поверку следующего оборудования:"
            f"{formatted_list}"
        )
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class CreateVerificationCitiesBlockError(ApiHttpException):
    def __init__(
        self,
        detail: str = (
            "Создание записи поверки с выбраным населенным"
            "пунктом невозможно. Вам запрещено использовать этот населенный"
            "пункт."
        )
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class CreateVerificationDateBlockError(ApiHttpException):
    def __init__(
        self,
        detail: str = "Создание записи поверки на выбранную дату невозможно.",
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class CreateVerificationFactoryNumBlockError(ApiHttpException):
    def __init__(
        self,
        detail: str = "Создание записи поверки невозможно. "
        "На выбранную дату запись с таким заводским номером уже существует."
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class CreateVerificationDefaultVerifierError(ApiHttpException):
    def __init__(
        self,
        detail: str = "Создание записи поверки невозможно. "
        "Для Вас не назначен поверитель по-умолчанию.",
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class UpdateVerificationVerNumBlockError(ApiHttpException):
    def __init__(
        self,
        detail: str = "Данная запись недоступна вам для редактирования."
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )


class DeleteVerificationEntryAccessError(ApiHttpException):
    def __init__(
        self,
        detail: str = (
            "Невозможно удалить запись поверки.\n"
            "Проверьте следующее:\n"
            "• Запись поверки, которую вы пытаетесь удалить, существует;\n"
            "• У вас есть права на выполнение этого действия;\n"
            "• Удаление не запрещено политикой блокировки по дате поверки компании;\n"
        ),
    ):
        super().__init__(
            status_code=status_codes.HTTP_409_CONFLICT,
            detail=detail
        )

