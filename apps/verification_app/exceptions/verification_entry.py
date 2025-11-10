from fastapi import HTTPException
from core.exceptions import CustomHTTPException


class VerificationEntryException(HTTPException):
    def __init__(
        self,
        detail: str = (
            "Запись поверки не найдена или не была создана.\n"
            "Проверьте, что за запись корректно сохранилась."
        ),
    ):
        super().__init__(status_code=400, detail=detail)


class VerificationVerifierException(HTTPException):
    def __init__(
        self,
        detail: str = (
            "У записи поверки не указан поверитель.\n"
            "Проверьте, что за записью закреплён поверитель."
        ),
    ):
        super().__init__(status_code=400, detail=detail)


class VerificationEquipmentException(HTTPException):
    def __init__(
        self,
        detail: str = (
            "За записью поверки не закреплено оборудование.\n"
            "Проверьте, что хотя бы одно средство измерения "
            "привязано к данной поверке."
        ),
    ):
        super().__init__(status_code=400, detail=detail)


class VerificationEquipmentExpiredException(HTTPException):
    def __init__(self, equipments: list[str]):
        formatted_list = "\n• " + "\n• ".join(equipments)
        detail = (
            "У одного или нескольких средств измерений, "
            "закреплённых за записью поверки, истёк срок поверки.\n"
            "Необходимо провести поверку следующего оборудования:"
            f"{formatted_list}"
        )
        super().__init__(status_code=400, detail=detail)


class CustomVerificationVerifierException(CustomHTTPException):
    def __init__(
        self,
        company_id: int = None,
        detail: str = (
            "У записи поверки не указан поверитель.\n"
            "Проверьте, что за записью закреплён поверитель."
        ),
    ):
        super().__init__(status_code=400, detail=detail, company_id=company_id)


class CustomVerificationEquipmentException(CustomHTTPException):
    def __init__(
        self,
        company_id: int = None,
        detail: str = (
            "За записью поверки не закреплено оборудование.\n"
            "Проверьте, что хотя бы одно средство измерения "
            "привязано к данной поверке."
        ),
    ):
        super().__init__(status_code=400, detail=detail, company_id=company_id)


class CustomVerificationEquipmentExpiredException(CustomHTTPException):
    def __init__(
            self,
            equipments: list[str],
            company_id: int = None,
    ):
        formatted_list = "\n• " + "\n• ".join(equipments)
        detail = (
            "У одного или нескольких средств измерений, "
            "закреплённых за записью поверки, истёк срок поверки.\n"
            "Необходимо провести поверку следующего оборудования:"
            f"{formatted_list}"
        )
        super().__init__(status_code=400, detail=detail, company_id=company_id)


class VerificationProtocolAccessException(HTTPException):
    def __init__(
        self,
        detail: str = (
            "Невозможно сформировать протокол поверки.\n"
            "Проверьте:\n"
            " • Cуществует ли запись поверки, для которой "
            "вы хотите получить протокол;\n"
            " • Cуществуют ли метрологические характеристики, "
            "связанные с этой поверкой;\n"
            " • Eсть ли у вас права доступа для просмотра этого протокола;\n"
            " • Не была ли запись удалена;\n"
        ),
    ):
        super().__init__(status_code=400, detail=detail)


class CreateVerificationCitiesBlockException(HTTPException):
    def __init__(
        self,
        detail: str = "Создание записи поверки с выбраным населенным"
        "пунктом невозможно. Вам запрещено использовать этот населенный"
        "пункт.",
    ):
        super().__init__(status_code=400, detail=detail)


class CreateVerificationDateBlockException(HTTPException):
    def __init__(
        self,
        detail: str = "Создание записи поверки на выбранную дату невозможно.",
    ):
        super().__init__(status_code=400, detail=detail)


class CreateVerificationFactoryNumBlockException(HTTPException):
    def __init__(
        self,
        detail: str = "Создание записи поверки невозможно. "
        "На выбранную дату запись с таким заводским номером уже существует."
    ):
        super().__init__(status_code=400, detail=detail)


class CreateVerificationDefaultVerifierException(HTTPException):
    def __init__(
        self,
        detail: str = "Создание записи поверки невозможно. "
        "Для Вас не назначен поверитель по-умолчанию.",
    ):
        super().__init__(status_code=400, detail=detail)


class DeleteVerificationEntryAccessException(HTTPException):
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
        super().__init__(status_code=400, detail=detail)


class UpdateVerificationVerNumBlockException(HTTPException):
    def __init__(
        self,
        detail: str = "Данная запись недоступна вам для редактирования."
    ):
        super().__init__(status_code=400, detail=detail)
