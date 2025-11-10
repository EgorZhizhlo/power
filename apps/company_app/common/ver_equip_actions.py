from sqlalchemy.ext.asyncio import AsyncSession
from models import VerifierEquipmentHistoryModel
from models.enums import VerifierEquipmentAction


async def log_verifier_equipment_action(
    session: AsyncSession,
    verifier_id: int,
    equipment_ids: list[int],
    action: VerifierEquipmentAction,
):
    """Добавляет записи истории принятия/отказа оборудования."""
    if not equipment_ids:
        return

    entries = [
        VerifierEquipmentHistoryModel(
            verifier_id=verifier_id,
            equipment_id=eq_id,
            action=action,
        )
        for eq_id in equipment_ids
    ]
    session.add_all(entries)
    await session.flush()
