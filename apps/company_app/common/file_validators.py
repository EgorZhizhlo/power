import filetype

from core.exceptions import CustomHTTPException


def validate_image(company_id: int, image: bytes):
    """Проверка формата изображения (JPEG/PNG)"""
    if len(image) > 10 * 1024 * 1024:  # 10MB
        raise CustomHTTPException(
            company_id=company_id, status_code=400,
            detail="Размер изображения не более 10МБ"
        )
    kind = filetype.guess(image)
    if not kind or kind.extension not in {"jpeg", "jpg", "png"} or kind.mime not in {"image/jpeg", "image/png"}:
        raise CustomHTTPException(
            company_id=company_id, status_code=400,
            detail="Изображение должно быть в формате 'jpeg', 'jpg' или 'png'"
        )


def validate_pdf(company_id: int, document: bytes):
    """Проверка PDF-файла"""
    if len(document) > 10 * 1024 * 1024:
        raise CustomHTTPException(
            company_id=company_id, status_code=400,
            detail="Размер PDF не более 10МБ"
        )
    if not document.startswith(b"%PDF"):
        raise CustomHTTPException(
            company_id=company_id, status_code=400,
            detail="Файл должен быть PDF"
        )
