from fastapi.templating import Jinja2Templates

from core.templates.jinja_filters import register_jinja_filters


class TemplateManager:
    """Менеджер шаблонов с автоматической регистрацией фильтров"""

    def __init__(self):
        # Создаем экземпляры Jinja2Templates для каждого модуля
        self._auth = Jinja2Templates(directory="templates/auth")
        self._company = Jinja2Templates(directory="templates/company")
        self._calendar = Jinja2Templates(directory="templates/calendar")
        self._verification = Jinja2Templates(
            directory="templates/verification")
        self._tariff = Jinja2Templates(directory="templates/tariff")

        # Регистрируем timezone-aware фильтры для всех модулей
        register_jinja_filters(self._auth)
        register_jinja_filters(self._company)
        register_jinja_filters(self._calendar)
        register_jinja_filters(self._verification)
        register_jinja_filters(self._tariff)

    @property
    def auth(self) -> Jinja2Templates:
        """Шаблоны для auth модуля"""
        return self._auth

    @property
    def company(self) -> Jinja2Templates:
        """Шаблоны для company модуля"""
        return self._company

    @property
    def calendar(self) -> Jinja2Templates:
        """Шаблоны для calendar модуля"""
        return self._calendar

    @property
    def verification(self) -> Jinja2Templates:
        """Шаблоны для verification модуля"""
        return self._verification

    @property
    def tariff(self) -> Jinja2Templates:
        """Шаблоны для tariff модуля"""
        return self._tariff


templates = TemplateManager()
