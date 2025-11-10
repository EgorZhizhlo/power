from xml.etree.ElementTree import Element, SubElement, ElementTree
from io import BytesIO


def generate_fund_xml(
        entries: list[dict], organization_code: str | None) -> bytes:
    """
    Генерирует XML (аналог fund_report.xml) без Jinja2.
    Полностью соответствует шаблону:
    templates/verification/reports/fund_report.xml
    """
    root = Element(
        "gost:application",
        {"xmlns:gost": "urn://fgis-arshin.gost.ru/module-verifications/import/2020-06-19"},
    )

    for entry in entries:
        result_el = SubElement(root, "gost:result")

        # --- miInfo ---
        mi_info = SubElement(result_el, "gost:miInfo")
        single_mi = SubElement(mi_info, "gost:singleMI")
        SubElement(single_mi, "gost:mitypeNumber").text = str(
            entry.get("registry_number", "") or "")
        SubElement(single_mi, "gost:manufactureNum").text = str(
            entry.get("factory_number", "") or "")
        SubElement(single_mi, "gost:manufactureYear").text = str(
            entry.get("manufacture_year", "") or "")
        SubElement(single_mi, "gost:modification").text = str(
            entry.get("modification_name", "") or "")

        # --- signCipher ---
        SubElement(result_el, "gost:signCipher").text = organization_code or ""

        # --- miOwner ---
        legal_entity = entry.get("legal_entity")
        client_full_name = entry.get("client_full_name")

        if client_full_name and legal_entity == "legal":
            SubElement(result_el, "gost:miOwner").text = client_full_name
        elif legal_entity == "legal":
            SubElement(result_el, "gost:miOwner").text = "юр. лицо"
        elif legal_entity == "individual":
            SubElement(result_el, "gost:miOwner").text = "физ. лицо"

        # --- Даты поверки ---
        SubElement(result_el, "gost:vrfDate").text = str(
            entry.get("verification_date", "") or ""
        )

        if entry.get("verification_result"):
            SubElement(result_el, "gost:validDate").text = str(
                entry.get("end_verification_date", "") or ""
            )
            SubElement(result_el, "gost:type").text = "2"
            SubElement(result_el, "gost:calibration").text = "false"
            applicable = SubElement(result_el, "gost:applicable")
            SubElement(applicable, "gost:signPass").text = "false"
            SubElement(applicable, "gost:signMi").text = "false"
        else:
            SubElement(result_el, "gost:type").text = "2"
            SubElement(result_el, "gost:calibration").text = "false"
            inapplicable = SubElement(result_el, "gost:inapplicable")
            SubElement(inapplicable, "gost:reasons").text = str(
                entry.get("reason_name", "") or ""
            )

        # --- Методика ---
        SubElement(result_el, "gost:docTitle").text = str(
            entry.get("method_name", "") or ""
        )

        # --- Средства поверки ---
        means = SubElement(result_el, "gost:means")

        if entry.get("reference"):
            mieta = SubElement(means, "gost:mieta")
            SubElement(mieta, "gost:number").text = str(entry["reference"])

        equipments = entry.get("equipments", [])
        if equipments:
            mis = SubElement(means, "gost:mis")
            for eq in equipments:
                reg_num = eq.get("registry_number")
                fact_num = eq.get("factory_number")
                if reg_num and fact_num:
                    mi = SubElement(mis, "gost:mi")
                    SubElement(mi, "gost:typeNum").text = str(reg_num)
                    SubElement(mi, "gost:manufactureNum").text = str(fact_num)

        # --- Условия поверки ---
        conditions = SubElement(result_el, "gost:conditions")
        SubElement(conditions, "gost:temperature").text = str(
            entry.get("after_air_temperature", "") or ""
        )
        SubElement(conditions, "gost:pressure").text = str(
            entry.get("after_pressure", "") or ""
        )
        SubElement(conditions, "gost:hymidity").text = str(
            entry.get("after_humdity", "") or ""
        )
        SubElement(conditions, "gost:other").text = str(
            entry.get("after_water_temperature", "") or ""
        )

    # --- Потоковая запись XML ---
    buffer = BytesIO()
    tree = ElementTree(root)
    tree.write(buffer, encoding="utf-8", xml_declaration=True)
    return buffer.getvalue()
