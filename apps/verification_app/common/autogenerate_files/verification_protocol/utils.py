from fastapi import HTTPException


def raise_exception(
        detail
):
    raise HTTPException(
        status_code=400,
        detail=detail
    )
