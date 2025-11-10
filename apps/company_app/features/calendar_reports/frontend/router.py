from fastapi import APIRouter, Request, Depends, Query

from sqlalchemy.ext.asyncio import AsyncSession

from access_control import (
    JwtData,
    check_include_in_not_active_company,
    check_include_in_active_company
)

from core.config import settings
from core.templates.template_manager import templates

from infrastructure.db import async_db_session

from apps.company_app.common import make_context


calendar_reports_frontend_router = APIRouter(
    prefix="/calendar-reports"
)


@calendar_reports_frontend_router.get("/")
async def view_calendar_reports(
    request: Request,
    company_id: int = Query(..., ge=1, le=settings.max_int),
    user_data: JwtData = Depends(
        check_include_in_not_active_company),
    session: AsyncSession = Depends(async_db_session),
):
    context = {
        "request": request,
        "per_page": settings.entries_per_page
    }
    context.update(await make_context(session, user_data, company_id))

    return templates.company.TemplateResponse(
        "calendar_reports/view.html", context=context
    )


@calendar_reports_frontend_router.get("/create")
async def view_create_calendar_report(
    request: Request,
    company_id: int = Query(..., ge=1, le=settings.max_int),
    user_data: JwtData = Depends(check_include_in_active_company),
    session: AsyncSession = Depends(async_db_session),
):
    context = {"request": request, "view_type": "create"}
    context.update(await make_context(session, user_data, company_id))

    return templates.company.TemplateResponse(
        "calendar_reports/update_or_create.html",
        context=context,
    )


@calendar_reports_frontend_router.get("/update")
async def view_update_calendar_report(
    request: Request,
    company_id: int = Query(..., ge=1, le=settings.max_int),
    calendar_report_id: int = Query(..., ge=1, le=settings.max_int),
    user_data: JwtData = Depends(check_include_in_active_company),
    session: AsyncSession = Depends(async_db_session),
):
    context = {
        "request": request,
        "view_type": "update",
        "calendar_report_id": calendar_report_id
    }
    context.update(await make_context(session, user_data, company_id))

    return templates.company.TemplateResponse(
        "calendar_reports/update_or_create.html",
        context=context,
    )
