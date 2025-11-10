import base64
from fastapi import APIRouter, Request, Depends, Query


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.templates.template_manager import templates

from infrastructure.db import async_db_session
from models import CompanyModel

from access_control import (
    JwtData,
    check_include_in_not_active_company,
    check_include_in_active_company
)


verification_reports_frontend_router = APIRouter(
    prefix="/verification-reports"
)


async def _get_company_with_additional(session: AsyncSession, company_id: int):
    row = (await session.execute(
        select(
            CompanyModel.id,
            CompanyModel.name,
            CompanyModel.image,
            CompanyModel.auto_teams,
            CompanyModel.is_active,
            CompanyModel.additional_checkbox_1,
            CompanyModel.additional_checkbox_2,
            CompanyModel.additional_checkbox_3,
            CompanyModel.additional_checkbox_4,
            CompanyModel.additional_checkbox_5,
            CompanyModel.additional_input_1,
            CompanyModel.additional_input_2,
            CompanyModel.additional_input_3,
            CompanyModel.additional_input_4,
            CompanyModel.additional_input_5,
        )
        .where(CompanyModel.id == company_id)
    )).mappings().first()

    company_data = dict(row)

    if company_data.get("image"):
        company_data["image"] = base64.b64encode(
            company_data["image"]).decode("utf-8")

    raw_ch = [
        (i, company_data.pop(f"additional_checkbox_{i}", None))
        for i in range(1, 6)
    ]
    additional_fields_checkbox = [(i, lbl) for i, lbl in raw_ch if lbl]

    raw_in = [
        (i, company_data.pop(f"additional_input_{i}", None))
        for i in range(1, 6)
    ]
    additional_fields_input = [(i, lbl) for i, lbl in raw_in if lbl]

    return company_data, additional_fields_checkbox, additional_fields_input


@verification_reports_frontend_router.get("/")
async def view_verification_reports(
    request: Request,
    company_id: int = Query(..., ge=1, le=settings.max_int),
    user_data: JwtData = Depends(
        check_include_in_not_active_company),
    session: AsyncSession = Depends(async_db_session),
):
    (company_data, additional_fields_checkbox,
     additional_fields_input) = await _get_company_with_additional(
        session, company_id)

    additional_checkbox_labels = [lbl for _, lbl in additional_fields_checkbox]
    additional_input_labels = [lbl for _, lbl in additional_fields_input]

    while len(additional_checkbox_labels) < 5:
        additional_checkbox_labels.append(None)
    while len(additional_input_labels) < 5:
        additional_input_labels.append(None)

    company_data['additional_checkbox_1'] = additional_checkbox_labels[0]
    company_data['additional_checkbox_2'] = additional_checkbox_labels[1]
    company_data['additional_checkbox_3'] = additional_checkbox_labels[2]
    company_data['additional_checkbox_4'] = additional_checkbox_labels[3]
    company_data['additional_checkbox_5'] = additional_checkbox_labels[4]
    company_data['additional_input_1'] = additional_input_labels[0]
    company_data['additional_input_2'] = additional_input_labels[1]
    company_data['additional_input_3'] = additional_input_labels[2]
    company_data['additional_input_4'] = additional_input_labels[3]
    company_data['additional_input_5'] = additional_input_labels[4]

    context = {
        "request": request,
        "company": company_data,
        "per_page": settings.entries_per_page,
        **user_data.__dict__,
    }

    return templates.company.TemplateResponse(
        "verification_reports/view.html",
        context=context
    )


@verification_reports_frontend_router.get("/create")
async def view_create_verification_report(
    request: Request,
    company_id: int = Query(..., ge=1, le=settings.max_int),
    user_data: JwtData = Depends(check_include_in_active_company),
    session: AsyncSession = Depends(async_db_session),
):
    (company_data, additional_fields_checkbox,
     additional_fields_input) = await _get_company_with_additional(
        session, company_id)

    context = {
        "request": request,
        "view_type": "create",
        "additional_fields_checkbox": additional_fields_checkbox,
        "additional_fields_input": additional_fields_input,
        **user_data.__dict__,
        "company": company_data,
    }

    return templates.company.TemplateResponse(
        "verification_reports/update_or_create.html",
        context
    )


@verification_reports_frontend_router.get("/update")
async def view_update_verification_report(
    request: Request,
    company_id: int = Query(..., ge=1, le=settings.max_int),
    verification_report_id: int = Query(..., ge=1, le=settings.max_int),
    user_data: JwtData = Depends(check_include_in_active_company),
    session: AsyncSession = Depends(async_db_session),
):
    (company_data, additional_fields_checkbox,
     additional_fields_input) = await _get_company_with_additional(
        session, company_id)

    context = {
        "request": request,
        "view_type": "update",
        "verification_report_id": verification_report_id,
        "additional_fields_checkbox": additional_fields_checkbox,
        "additional_fields_input": additional_fields_input,
        **user_data.__dict__,
        "company": company_data,
    }

    return templates.company.TemplateResponse(
        "verification_reports/update_or_create.html",
        context=context
    )
