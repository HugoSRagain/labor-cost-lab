import json
import requests


API_URL = "https://mon-entreprise.urssaf.fr/api/v1/evaluate"


def evaluate_salary(gross_monthly: float):
    """
    Test minimal de l'API Mon-entreprise.

    Objectif :
    - fixer un salaire brut mensuel ;
    - demander quelques variables utiles ;
    - afficher la réponse brute pour identifier les noms de règles fiables.
    """

    payload = {
        "situation": {
            "salarié . contrat . salaire brut": {
                "valeur": gross_monthly,
                "unité": "€/mois"
            }
        },
        "expressions": [
            "salarié . contrat . salaire brut",
            "salarié . rémunération . net",
            "salarié . coût total employeur",
            "salarié . cotisations",
            "salarié . cotisations . employeur",
            "salarié . cotisations . salarié"
        ]
    }

    response = requests.post(API_URL, json=payload, timeout=30)

    print("Status code:", response.status_code)
    print()

    try:
        data = response.json()
    except Exception:
        print("Réponse non JSON :")
        print(response.text)
        return

    print(json.dumps(data, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    evaluate_salary(1801.80)