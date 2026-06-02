import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_dataset_mon_entreprise as b

PROFILE_ID = "non_cadre__standard__standard"
GROSS_MONTHLY = 2 * 1867.02

CANDIDATE_EXPRESSIONS = [
    # Agrégats
    "salarié . cotisations",
    "salarié . cotisations . employeur",
    "salarié . cotisations . salarié",

    # Salarié
    "salarié . cotisations . CSG-CRDS",
    "salarié . cotisations . CSG-CRDS . CSG",
    "salarié . cotisations . CSG-CRDS . CRDS",
    "salarié . cotisations . vieillesse . salarié",
    "salarié . cotisations . vieillesse . plafonnée . salarié",
    "salarié . cotisations . vieillesse . déplafonnée . salarié",
    "salarié . cotisations . retraite complémentaire . salarié",
    "salarié . cotisations . retraite complémentaire-CEG-CET . salarié",
    "salarié . cotisations . chômage",

    # Employeur
    "salarié . cotisations . vieillesse . employeur",
    "salarié . cotisations . vieillesse . plafonnée . employeur",
    "salarié . cotisations . vieillesse . déplafonnée . employeur",
    "salarié . cotisations . retraite complémentaire . employeur",
    "salarié . cotisations . retraite complémentaire-CEG-CET . employeur",
    "salarié . cotisations . maladie . employeur",
    "salarié . cotisations . allocations familiales",
    "salarié . cotisations . assurance chômage",
    "salarié . cotisations . AGS",
    "salarié . cotisations . ATMP",
    "salarié . cotisations . FNAL",
    "salarié . cotisations . CSA",
    "salarié . cotisations . formation professionnelle",
    "salarié . cotisations . taxe d'apprentissage",
    "salarié . cotisations . versement mobilité",
    "salarié . cotisations . contribution au dialogue social",
    "salarié . cotisations . autres employeur",

    # Exonérations
    "salarié . cotisations . exonérations . RGDU",
]

profiles = b.load_profiles()
profile = profiles[PROFILE_ID]
profile_situation = profile.get("situation", {})

payload = b.make_payload(
    gross_monthly=GROSS_MONTHLY,
    expressions=CANDIDATE_EXPRESSIONS,
    profile_situation=profile_situation
)

result = b.post_payload(payload)

print(f"Profile: {PROFILE_ID}")
print(f"Gross monthly: {GROSS_MONTHLY:.2f} €")
print()

for expression, item in zip(CANDIDATE_EXPRESSIONS, result["evaluate"]):
    value = item.get("nodeValue")
    missing = item.get("missingVariables", {})

    if value is None:
        print(f"NON DISPONIBLE | {expression}")
    else:
        print(f"{value:10.2f} € | {expression}")

    if missing:
        print(f"             missing: {len(missing)}")