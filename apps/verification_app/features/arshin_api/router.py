import httpx
import asyncio
from datetime import date as date_
from typing import Optional, Dict, List, Tuple, Any
from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import select, func, or_

from access_control import (
    JwtData,
    auditor_verifier_exception
)
from infrastructure.db import async_session_maker
from models import VerificationEntryModel, CompanyModel
from core.exceptions import CustomHTTPException

arshin_router = APIRouter(prefix="/api/arshin")

ARSHIN_BASE_URL = "https://fgis.gost.ru/fundmetrology/eapi"
ARSHIN_ROWS_LIMIT = 100
HTTP_TIMEOUT = 60.0


def _normalize_factory_number(s: str) -> str:
    if not s:
        return ""
    return (
        str(s)
        .replace("№", "")
        .replace("#", "")
        .replace(" ", "")
        .strip()
        .upper()
    )


async def _fetch_arshin_page(
    client: httpx.AsyncClient,
    org_title_lower: str,
    vdate_ddmmyyyy: str,
    start: int,
    rows: int = ARSHIN_ROWS_LIMIT,
) -> Dict[str, Any]:
    params = {
        "org_title": org_title_lower,
        "verification_date": vdate_ddmmyyyy,
        "rows": rows,
        "start": start,
    }
    r = await client.get("/vri", params=params)
    r.raise_for_status()
    return r.json()


async def _background_fill_vri_ids(company_id: int, date_from: date_, date_to: date_) -> None:
    # --- READ (без транзакции): компания + список интересующих записей ---
    maker = async_session_maker()
    async with maker() as db_read:
        res_company = await db_read.execute(
            select(CompanyModel.name).where(CompanyModel.id == company_id)
        )
        company_name = res_company.scalar_one()

        res_entries = await db_read.execute(
            select(
                VerificationEntryModel.id,
                VerificationEntryModel.factory_number,
                VerificationEntryModel.verification_date,
            ).where(
                VerificationEntryModel.company_id == company_id,
                VerificationEntryModel.verification_date >= date_from,
                VerificationEntryModel.verification_date <= date_to,
                or_(
                    VerificationEntryModel.verification_number.is_(None),
                    func.length(
                        func.trim(
                            VerificationEntryModel.verification_number
                        )
                    ) == 0,
                ),
            )
        )
        rows: List[Tuple[int, str, date_]] = res_entries.all()

    # группируем по дате и сортируем
    by_date: Dict[date_, List[Tuple[int, str]]] = {}
    for ver_id, fac_no, ver_date in rows:
        by_date.setdefault(ver_date, []).append((ver_id, fac_no))
    dates_sorted = sorted(by_date.keys())

    # HTTP-клиент
    limits = httpx.Limits(max_connections=20, max_keepalive_connections=10)
    async with httpx.AsyncClient(
        base_url=ARSHIN_BASE_URL,
        timeout=httpx.Timeout(HTTP_TIMEOUT),
        limits=limits,
        http2=True,
        headers={"Accept": "application/json"},
    ) as client:

        org_title_lower = (company_name or "").lower()

        for cur_date in dates_sorted:
            target_entries = by_date[cur_date]

            # карта: нормализованный номер -> список id наших записей
            needed_map: Dict[str, List[int]] = {}
            for entry_id, fac_no in target_entries:
                mi_norm = _normalize_factory_number(fac_no)
                if mi_norm:
                    needed_map.setdefault(mi_norm, []).append(entry_id)

            if not needed_map:
                continue

            date_label = cur_date.strftime("%d.%m.%Y")
            start = 0
            total = None
            remaining = set(needed_map.keys())

            while True:
                payload = await _fetch_arshin_page(
                    client,
                    org_title_lower=org_title_lower,
                    vdate_ddmmyyyy=date_label,
                    start=start,
                    rows=ARSHIN_ROWS_LIMIT,
                )
                result = payload.get("result") or {}
                items = result.get("items") or []
                total = result.get("count") if total is None else total

                if not items:
                    break

                # сопоставление и подготовка обновлений
                # (verification_entry.id, vri_id)
                updates: List[Tuple[int, str]] = []
                for rec in items:
                    mi_number_raw = rec.get("mi_number") or ""
                    mi_norm = _normalize_factory_number(mi_number_raw)
                    if mi_norm in remaining:
                        vri_id = rec.get("vri_id")
                        for ver_entry_id in needed_map.get(mi_norm, []):
                            updates.append(
                                (ver_entry_id, str(vri_id) if vri_id is not None else None))
                        remaining.discard(mi_norm)

                # --- WRITE (транзакция): применяем пачку обновлений атомарно ---
                if updates:
                    maker = async_session_maker()
                    async with maker() as db_write:  # type: AsyncSession
                        async with db_write.begin():  # BEGIN (auto-COMMIT/ROLLBACK)
                            ids = [u[0] for u in updates]
                            res_models = await db_write.execute(
                                select(VerificationEntryModel).where(
                                    VerificationEntryModel.id.in_(ids))
                            )
                            models = res_models.scalars().all()
                            id2vri = {u[0]: u[1] for u in updates}
                            for m in models:
                                m.verification_number = id2vri.get(m.id)
                                db_write.add(m)
                        # <- COMMIT здесь (или ROLLBACK при исключении)

                if not remaining:
                    break

                start += ARSHIN_ROWS_LIMIT
                if total is not None and start >= int(total):
                    break

                await asyncio.sleep(0.05)


@arshin_router.get(
        "/get-vri-ids", status_code=204)
async def get_vri_ids(
    background_tasks: BackgroundTasks,
    company_id: int = Query(..., ge=1, le=2147483647),
    date_from: Optional[date_] = Query(None),
    date_to: Optional[date_] = Query(None),
    user_data: JwtData = Depends(
        auditor_verifier_exception
    ),
):
    if not (date_from and date_to):
        raise CustomHTTPException(
            status_code=404,
            company_id=company_id,
            detail='Поля "Дата с" и "Дата по" не должны быть пустыми.'
        )

    if date_from > date_to:
        raise CustomHTTPException(
            status_code=404,
            company_id=company_id,
            detail='"Дата с" должна быть меньше или равна "Дата по".'
        )
    background_tasks.add_task(_background_fill_vri_ids,
                              company_id, date_from, date_to)
