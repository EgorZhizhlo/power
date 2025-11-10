from fastapi import APIRouter, Request, Cookie
from fastapi.responses import HTMLResponse, RedirectResponse

from access_control.tokens import verify_token, verify_untimed_token

from core.config import settings
from core.templates.template_manager import templates


auth_frontend_router = APIRouter(prefix="")


@auth_frontend_router.get("/", response_class=HTMLResponse)
async def authorization_home(
    request: Request,
    auth_token: str = Cookie(None),
    company_info_token: str = Cookie(None),
):
    if auth_token and company_info_token:
        try:
            # Разбираем токены
            user_data = verify_token(auth_token)
            comp_data = verify_untimed_token(company_info_token)

            # Проверяем, что user_id совпадают
            if user_data["id"] != comp_data["id"]:
                # Несовпадение — чистим куки и показываем форму логина
                resp = settings.authorization_templates.TemplateResponse(
                    "login.html",
                    {
                        "request": request,
                        "error": "Некорректные токены, "
                        "пожалуйста, войдите заново."
                    }
                )
                resp.delete_cookie("auth_token", path="/")
                resp.delete_cookie("company_info_token", path="/")
                return resp

            status = user_data["status"]

            # Если у пользователя роль DIRECTOR–style — сразу редиректим
            if status in settings.ACCESS_COMPANY:
                return RedirectResponse(
                    url=settings.url_path_map[status], status_code=303)

            # Иначе смотрим список компаний
            all_company_ids = comp_data.get("all_company_ids", [])
            if not all_company_ids:
                resp = settings.authorization_templates.TemplateResponse(
                    "login.html",
                    {"request": request, "error": "Вам не назначена компания!"}
                )
                resp.delete_cookie("company_info_token", path="/")
                return resp

            # Успешно: редирект на минимальную компанию
            redirect_url = f"{settings.url_path_map[status]}?company_id={min(all_company_ids)}"
            return RedirectResponse(redirect_url, status_code=303)

        except Exception:
            # В случае любой ошибки верификации — показываем форму логина
            pass

    # Если токенов нет или они невалидны — страница логина
    return templates.auth.TemplateResponse(
        "login.html",
        {"request": request}
    )
