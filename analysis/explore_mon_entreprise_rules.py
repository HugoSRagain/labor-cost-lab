import json
import re
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "analysis" / "mon_entreprise_rules"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

URLS = [
    "https://mon-entreprise.urssaf.fr/api/v1/rules",
    "https://mon-entreprise.urssaf.fr/api/v1/rules.json",
    "https://mon-entreprise.urssaf.fr/api/v1/documentation",
    "https://mon-entreprise.urssaf.fr/api/v1/documentation.json",
]

KEYWORDS = [
    "salarié",
    "cotisations",
    "employeur",
    "salarié",
    "retraite",
    "maladie",
    "famille",
    "chômage",
    "atmp",
    "accident",
    "fnal",
    "formation",
    "mobilité",
    "solidarité",
    "csg",
    "crds",
    "agirc",
    "arrco",
    "vieillesse",
    "exonération",
    "rgdu",
]

def flatten_keys(obj):
    if isinstance(obj, dict):
        for key, value in obj.items():
            yield str(key)
            yield from flatten_keys(value)
    elif isinstance(obj, list):
        for item in obj:
            yield from flatten_keys(item)

for url in URLS:
    print(f"Testing {url}")

    try:
        response = requests.get(url, timeout=30)
        print("Status:", response.status_code)
        print("Content-Type:", response.headers.get("content-type"))

        if response.status_code != 200:
            continue

        text = response.text
        filename = re.sub(r"[^a-zA-Z0-9]+", "_", url).strip("_")
        raw_path = OUTPUT_DIR / f"{filename}.txt"
        raw_path.write_text(text, encoding="utf-8")

        try:
            data = response.json()
        except Exception:
            print("Not JSON")
            continue

        json_path = OUTPUT_DIR / f"{filename}.json"
        json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

        keys = sorted(set(flatten_keys(data)))
        matches = [
            key for key in keys
            if any(keyword.lower() in key.lower() for keyword in KEYWORDS)
        ]

        out_path = OUTPUT_DIR / f"{filename}_matches.txt"
        out_path.write_text("\n".join(matches), encoding="utf-8")

        print(f"JSON saved: {json_path}")
        print(f"Matches saved: {out_path}")
        print(f"Matches: {len(matches)}")

    except Exception as e:
        print("ERROR:", e)

    print()