import json
import requests


API_URL = "https://mon-entreprise.urssaf.fr/api/v1/evaluate"


EXPRESSIONS = [
    "salarié . contrat . salaire brut",
    "salarié . rémunération . net",
    "salarié . coût total employeur",
    "salarié . cotisations . employeur",
    "salarié . cotisations . salarié",
    "salarié . cotisations . exonérations . RGDU",
]


PROFILES = {
    "non_cadre_standard": {
        "label": "Non-cadre standard",
        "situation": {
            "salarié . contrat . statut cadre": "non",
            "salarié . régimes spécifiques . alsace moselle": "non"
        }
    },
    "cadre_standard": {
        "label": "Cadre standard",
        "situation": {
            "salarié . contrat . statut cadre": "oui",
            "salarié . régimes spécifiques . alsace moselle": "non"
        }
    },
    "non_cadre_alsace_moselle": {
        "label": "Non-cadre Alsace-Moselle",
        "situation": {
            "salarié . contrat . statut cadre": "non",
            "salarié . régimes spécifiques . alsace moselle": "oui"
        }
    },
    "cadre_alsace_moselle": {
        "label": "Cadre Alsace-Moselle",
        "situation": {
            "salarié . contrat . statut cadre": "oui",
            "salarié . régimes spécifiques . alsace moselle": "oui"
        }
    }
}


def make_situation(gross_monthly, profile_situation):
    situation = {
        "salarié . contrat . salaire brut": {
            "valeur": gross_monthly,
            "unité": "€/mois"
        }
    }

    situation.update(profile_situation)

    return situation


def evaluate_profile(profile_id, profile, gross_monthly):
    payload = {
        "situation": make_situation(gross_monthly, profile["situation"]),
        "expressions": EXPRESSIONS
    }

    response = requests.post(API_URL, json=payload, timeout=30)

    print("=" * 90)
    print(f"Profile: {profile_id} — {profile['label']}")
    print(f"Status code: {response.status_code}")
    print()

    try:
        data = response.json()
    except Exception:
        print(response.text)
        return

    if response.status_code != 200:
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return

    evaluate = data.get("evaluate", [])

    for expression, result in zip(EXPRESSIONS, evaluate):
        value = result.get("nodeValue")
        unit = result.get("unit", {})
        missing = result.get("missingVariables", {})

        print(f"{expression}")
        print(f"  value: {value}")
        print(f"  unit: {unit}")
        print(f"  missing variables: {len(missing)}")
        print()

    warnings = data.get("warnings", [])
    if warnings:
        print("Warnings:")
        for warning in warnings[:3]:
            print(warning.get("message", "").strip())
            print()

    print()


def main():
    # Test à 2 SMIC pour que les différences cadre / non-cadre soient plus visibles.
    gross_monthly = 3603.60

    for profile_id, profile in PROFILES.items():
        evaluate_profile(profile_id, profile, gross_monthly)


if __name__ == "__main__":
    main()