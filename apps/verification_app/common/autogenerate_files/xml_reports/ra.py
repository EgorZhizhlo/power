from xml.etree.ElementTree import Element, SubElement, ElementTree
from io import BytesIO


def generate_ra_xml(entries: list[dict]) -> bytes:
    """
    Генерирует XML для РА (ra_report.xml) без Jinja2.
    """
    root = Element("Message", {
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
    })

    data = SubElement(root, "VerificationMeasuringInstrumentData")

    for entry in entries:
        vmi = SubElement(data, "VerificationMeasuringInstrument")

        SubElement(vmi, "NumberVerification").text = str(
            entry.get("verification_number", "") or "")
        SubElement(vmi, "DateVerification").text = str(
            entry.get("verification_date", "") or "")
        SubElement(vmi, "DateEndVerification").text = str(
            entry.get("end_verification_date", "") or "")
        SubElement(vmi, "TypeMeasuringInstrument").text = (
            f"{entry.get('si_type', '') or ''} {entry.get('modification_name', '') or ''}".strip()
        )

        approved = SubElement(vmi, "ApprovedEmployee")
        name = SubElement(approved, "Name")
        verifier = entry.get("verifier", {}) or {}
        SubElement(name, "Last").text = verifier.get("last_name", "") or ""
        SubElement(name, "First").text = verifier.get("name", "") or ""
        SubElement(name, "Middle").text = verifier.get("patronymic", "") or ""
        SubElement(approved, "SNILS").text = verifier.get("snils", "") or ""

        SubElement(vmi, "ResultVerification").text = (
            "1" if entry.get("verification_result") else "2"
        )

    SubElement(root, "SaveMethod").text = "2"

    buffer = BytesIO()
    tree = ElementTree(root)
    tree.write(buffer, encoding="utf-8", xml_declaration=True)
    return buffer.getvalue()
