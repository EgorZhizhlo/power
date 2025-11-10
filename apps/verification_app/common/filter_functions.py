from models import (
    VerificationEntryModel, ActNumberModel)

from sqlalchemy import and_
from sqlalchemy.orm import with_loader_criteria


def _apply_common_date_filters(model, filter_obj):
    dt_from = getattr(filter_obj, "date_from", None)
    dt_to = getattr(filter_obj, "date_to", None)
    criteria = []
    if dt_from:
        criteria.append(model.verification_date >= dt_from)
    if dt_to:
        criteria.append(model.verification_date <= dt_to)
    return criteria


async def entry_filter(query, filter_obj):
    f = filter_obj.__dict__
    criteria = _apply_common_date_filters(VerificationEntryModel, filter_obj)

    for cond in criteria:
        query = query.filter(cond)

    simple_fields = {
        "factory_number": VerificationEntryModel.factory_number,
        "series_id": VerificationEntryModel.series_id,
        "employee_id": VerificationEntryModel.employee_id,
        "city_id": VerificationEntryModel.city_id,
        "water_type": VerificationEntryModel.water_type,
    }
    for key, col in simple_fields.items():
        val = f.get(key)
        if val not in (None, "", []):
            query = query.filter(col == val)

    addr = f.get("client_address")
    phone = f.get("client_phone")
    act_num = f.get("act_number")

    if any(v not in (None, "", []) for v in (addr, phone, act_num)):
        query = query.join(VerificationEntryModel.act_number)
        if addr:
            query = query.filter(ActNumberModel.address.ilike(f"%{addr}%"))
        if phone:
            query = query.filter(
                ActNumberModel.client_phone.ilike(f"%{phone}%"))
        if act_num:
            # act_number — числовое поле, но если в URL строка, преобразуем безопасно
            try:
                act_num_int = int(act_num)
                query = query.filter(ActNumberModel.act_number == act_num_int)
            except ValueError:
                pass

    return query


async def data_filter(query, filter):
    criteria = _apply_common_date_filters(VerificationEntryModel, filter)

    if criteria:
        query = query.options(
            with_loader_criteria(
                VerificationEntryModel,
                and_(*criteria),
                include_aliases=True
            )
        )

    return query
