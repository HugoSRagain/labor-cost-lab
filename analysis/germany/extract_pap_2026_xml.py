from pathlib import Path
import re
import xml.etree.ElementTree as ET


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DOWNLOADED_XML_VIEWER_PATH = (
    PROJECT_ROOT
    / "analysis"
    / "germany"
    / "sources"
    / "pap_2026_downloaded.xml"
)

CLEAN_XML_PATH = (
    PROJECT_ROOT
    / "analysis"
    / "germany"
    / "sources"
    / "pap_2026.xml"
)


def extract_pap_xml(text: str) -> str:
    viewer_match = re.search(
        r'<div[^>]*id=["\']webkit-xml-viewer-source-xml["\'][^>]*>',
        text,
        flags=re.IGNORECASE
    )

    if viewer_match:
        start = viewer_match.end()
        end = text.find("</div>", start)

        if end == -1:
            raise ValueError(
                "Bloc webkit-xml-viewer-source-xml trouvé, mais impossible "
                "de trouver la fermeture </div>."
            )

        xml_text = text[start:end].strip()
    else:
        lower_text = text.lower()

        start = lower_text.find("<pap")
        end = lower_text.rfind("</pap>")

        if start == -1 or end == -1:
            raise ValueError(
                "Impossible de trouver le bloc PAP. Le fichier doit contenir "
                "soit <pap ...>...</pap>, soit le visualiseur Chrome avec "
                "webkit-xml-viewer-source-xml."
            )

        xml_text = text[start:end + len("</pap>")].strip()

    if not xml_text.lower().startswith("<pap"):
        raise ValueError(
            "Le XML extrait ne commence pas par <pap ...>."
        )

    return xml_text


def normalize_pap_tags(xml_text: str) -> str:
    replacements = [
        (r"<pap\b", "<PAP"),
        (r"</pap>", "</PAP>"),
        (r"<variables>", "<VARIABLES>"),
        (r"</variables>", "</VARIABLES>"),
        (r"<inputs>", "<INPUTS>"),
        (r"</inputs>", "</INPUTS>"),
        (r"<outputs\b", "<OUTPUTS"),
        (r"</outputs>", "</OUTPUTS>"),
        (r"<internals>", "<INTERNALS>"),
        (r"</internals>", "</INTERNALS>"),
        (r"<constants>", "<CONSTANTS>"),
        (r"</constants>", "</CONSTANTS>"),
        (r"<methods>", "<METHODS>"),
        (r"</methods>", "</METHODS>"),
        (r"<main>", "<MAIN>"),
        (r"</main>", "</MAIN>"),
        (r"<input\b", "<INPUT"),
        (r"</input>", "</INPUT>"),
        (r"<output\b", "<OUTPUT"),
        (r"</output>", "</OUTPUT>"),
        (r"<internal\b", "<INTERNAL"),
        (r"</internal>", "</INTERNAL>"),
        (r"<constant\b", "<CONSTANT"),
        (r"</constant>", "</CONSTANT>"),
        (r"<method\b", "<METHOD"),
        (r"</method>", "</METHOD>"),
        (r"<execute\b", "<EXECUTE"),
        (r"</execute>", "</EXECUTE>"),
        (r"<eval\b", "<EVAL"),
        (r"</eval>", "</EVAL>"),
        (r"<if\b", "<IF"),
        (r"</if>", "</IF>"),
        (r"<then>", "<THEN>"),
        (r"</then>", "</THEN>"),
        (r"<else>", "<ELSE>"),
        (r"</else>", "</ELSE>"),
    ]

    for pattern, replacement in replacements:
        xml_text = re.sub(
            pattern,
            replacement,
            xml_text,
            flags=re.IGNORECASE
        )

    return xml_text


def escape_attribute_values(xml_text: str) -> str:
    attribute_pattern = re.compile(
        r'\s(?P<name>expr|exec|value|default)=["\'](?P<value>.*?)["\']',
        flags=re.DOTALL
    )

    def replace_attribute(match: re.Match) -> str:
        name = match.group("name")
        value = match.group("value")

        value = (
            value
            .replace("&", "&amp;")
            .replace("&amp;lt;", "&lt;")
            .replace("&amp;gt;", "&gt;")
            .replace("&amp;amp;", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

        return f' {name}="{value}"'

    return attribute_pattern.sub(replace_attribute, xml_text)


def validate_clean_xml(xml_text: str) -> None:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as error:
        print("Erreur XML pendant la validation.")
        print(error)

        lines = xml_text.splitlines()
        line_number = getattr(error, "position", [None, None])[0]

        if line_number:
            start = max(line_number - 4, 0)
            end = min(line_number + 3, len(lines))

            print()
            print("Contexte autour de la ligne problématique :")
            print("------------------------------------------")

            for index in range(start, end):
                marker = ">>" if index + 1 == line_number else "  "
                print(f"{marker} {index + 1}: {lines[index]}")

        raise

    if root.tag != "PAP":
        raise ValueError(
            f"Balise racine inattendue : {root.tag}. Attendu : PAP."
        )

    inputs = root.findall(".//INPUT")
    outputs = root.findall(".//OUTPUTS[@type='STANDARD']/OUTPUT")
    methods = root.findall(".//METHOD")

    input_names = {item.attrib["name"] for item in inputs}
    output_names = {item.attrib["name"] for item in outputs}
    method_names = {item.attrib["name"] for item in methods}

    required_inputs = {
        "RE4",
        "LZZ",
        "STKL",
        "KVZ",
        "PKV",
        "PVS",
        "PVZ",
        "PVA",
        "R",
        "ZKF",
        "KRV",
        "ALV",
    }

    required_outputs = {
        "LSTLZZ",
        "SOLZLZZ",
        "BK",
    }

    required_methods = {
        "MPARA",
        "MRE4JL",
        "MRE4",
        "MRE4ABZ",
        "MBERECH",
        "UPTAB26",
        "MSOLZ",
    }

    missing_inputs = sorted(required_inputs - input_names)
    missing_outputs = sorted(required_outputs - output_names)
    missing_methods = sorted(required_methods - method_names)

    if missing_inputs or missing_outputs or missing_methods:
        raise ValueError(
            "Le XML extrait ne contient pas tous les éléments attendus.\n"
            f"Inputs manquants : {missing_inputs}\n"
            f"Outputs manquants : {missing_outputs}\n"
            f"Methods manquants : {missing_methods}"
        )

    print("PAP 2026 XML validé.")
    print(f"Inputs: {len(inputs)}")
    print(f"Standard outputs: {len(outputs)}")
    print(f"Methods: {len(methods)}")


def main() -> None:
    source_text = DOWNLOADED_XML_VIEWER_PATH.read_text(
        encoding="utf-8"
    )

    xml_text = extract_pap_xml(source_text)
    xml_text = normalize_pap_tags(xml_text)
    xml_text = escape_attribute_values(xml_text)

    validate_clean_xml(xml_text)

    CLEAN_XML_PATH.write_text(
        xml_text + "\n",
        encoding="utf-8"
    )

    print()
    print("XML propre exporté vers :")
    print(CLEAN_XML_PATH)


if __name__ == "__main__":
    main()