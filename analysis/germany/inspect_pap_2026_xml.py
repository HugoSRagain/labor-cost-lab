from pathlib import Path
import xml.etree.ElementTree as ET


PROJECT_ROOT = Path(__file__).resolve().parents[2]
PAP_XML_PATH = PROJECT_ROOT / "analysis" / "germany" / "sources" / "pap_2026.xml"


def read_xml_text(path: Path) -> str:
    text = path.read_text(encoding="utf-8").strip()

    if text.startswith("This XML file does not appear"):
        raise ValueError(
            "Le fichier semble être la vue navigateur du XML, pas le XML brut. "
            "Il faut sauvegarder le fichier source XML directement."
        )

    if not text.startswith("<PAP"):
        raise ValueError(
            "Le fichier doit commencer directement par <PAP ...>. "
            "Supprime tout texte ou backticks avant la balise <PAP>."
        )

    return text


def main() -> None:
    xml_text = read_xml_text(PAP_XML_PATH)

    root = ET.fromstring(xml_text)

    inputs = root.findall(".//INPUT")
    standard_outputs = root.findall(".//OUTPUTS[@type='STANDARD']/OUTPUT")
    methods = root.findall(".//METHOD")

    input_names = {item.attrib["name"] for item in inputs}
    output_names = {item.attrib["name"] for item in standard_outputs}
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

    print("PAP XML inspection")
    print("------------------")
    print(f"Root: {root.tag}")
    print(f"Name: {root.attrib.get('name')}")
    print(f"Version: {root.attrib.get('version')}")
    print(f"Inputs: {len(inputs)}")
    print(f"Standard outputs: {len(standard_outputs)}")
    print(f"Methods: {len(methods)}")
    print()

    if missing_inputs or missing_outputs or missing_methods:
        print("Missing required elements")
        print("-------------------------")
        print(f"Inputs: {missing_inputs}")
        print(f"Outputs: {missing_outputs}")
        print(f"Methods: {missing_methods}")
        raise SystemExit(1)

    print("Required PAP elements: OK")


if __name__ == "__main__":
    main()