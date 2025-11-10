from fastapi import (
    APIRouter, Response, status as status_code,
    Depends, Query, Body
)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import check_is_none
from core.config import settings

from infrastructure.db import async_db_session_begin
from models import EquipmentModel, EquipmentInfoModel
from models.enums.equipment_info import EquipmentInfoType

from access_control import (
    JwtData,
    check_include_in_active_company
)
from apps.company_app.features.equipment_informations.schemas import (
    EquipmentInfoCreate
)


equipment_informations_api_router = APIRouter(
    prefix="/api/equipment-informations"
)


@equipment_informations_api_router.post("/create")
async def api_create_equipment_information(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    equipment_id: int = Query(..., ge=1, le=settings.max_int),
    type_verif: EquipmentInfoType = Query(...),
    equipment_info_data: EquipmentInfoCreate = Body(...),
    user_data: JwtData = Depends(check_include_in_active_company),
    session: AsyncSession = Depends(async_db_session_begin),
):
    new_equipment = EquipmentInfoModel(
        type=type_verif,
        verif_date=equipment_info_data.verif_date,
        verif_limit_date=equipment_info_data.verif_limit_date,
        info=equipment_info_data.info,
        equipment_id=equipment_id,
    )
    session.add(new_equipment)

    return Response(status_code=status_code.HTTP_204_NO_CONTENT)


@equipment_informations_api_router.put("/update")
async def api_update_equipment_information(
    company_id: int = Query(..., ge=1, le=settings.max_int),
    equipment_id: int = Query(..., ge=1, le=settings.max_int),
    equipment_info_id: int = Query(..., ge=1, le=settings.max_int),
    equipment_info_data: EquipmentInfoCreate = Body(...),
    user_data: JwtData = Depends(check_include_in_active_company),
    session: AsyncSession = Depends(async_db_session_begin),
):

    equipment_info = (
        await session.execute(
            select(EquipmentInfoModel)
            .join(EquipmentInfoModel.equipment)
            .where(EquipmentInfoModel.id == equipment_info_id,
                   EquipmentModel.id == equipment_id,
                   EquipmentModel.company_id == company_id)
        )
    ).scalar_one_or_none()

    await check_is_none(
        equipment_info, type="ТО и Поверка оборудования",
        id=equipment_info_id, company_id=company_id)

    for key, value in equipment_info_data.model_dump().items():
        setattr(equipment_info, key, value)

    session.add(equipment_info)

    return Response(status_code=status_code.HTTP_204_NO_CONTENT)
