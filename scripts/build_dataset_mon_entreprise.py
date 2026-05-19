from pathlib import Path
import time
import requests
import pandas as pd
import yaml


BASE_DIR = Path(__file__).resolve().parents[1]
CONFIG_PATH = BASE_DIR / "config" / "scenarios.yml"
DATA_DIR = BASE_DIR / "data"
OUTPUT_PATH = DATA_DIR / "labour_cost_grid_mon_entreprise.csv"

API_URL = "https://mon-entreprise.urssaf.fr/api/v1/evaluate"


EXPRESSIONS = [
    "salarié . contrat . salaire brut",
    "salarié . rémunération . net",
    "salarié . coût total employeur",
    "salarié . cotisations",
    "salarié . cotisations . employeur",
    "salarié . cotisations . salarié",
]


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def build_smic_grid():
    config = load_config()
    baseline = config["baseline"]

    monthly_smic_gross = float(baseline["monthly_smic_gross"])
    min_multiple = float(baseline["min_smic_multiple"])
    max_multiple = float(baseline["max_smic_multiple"])
    step = float(baseline["step_smic_multiple"])

    multiples = []
    current = min_multiple

    while current <= max_multiple + 1e-9:
        multiples.append(round(current, 2))
        current += step

    return monthly_smic_gross, multiples


def extract_value(result, index):
    try:
        value = result["evaluate"][index].get("nodeValue")
        if value is None:
            return None
        return float(value)
    except Exception:
        return None


def count_missing_variables(result, index):
    try:
        missing = result["evaluate"][index].get("missingVariables", {})
        return len(missing)
    except Exception:
        return None


def evaluate_salary(gross_monthly, max_retries=3, pause_seconds=0.5):
    """
    Appelle l'API Mon-entreprise pour un salaire brut mensuel donné.

    La situation est volontairement minimale au départ, car le test API montre
    que les variables principales sont déjà calculables. Les hypothèses fines
    seront fixées progressivement dans une V2 du moteur officiel.
    """

    payload = {
        "situation": {
            "salarié . contrat . salaire brut": {
                "valeur": gross_monthly,
                "unité": "€/mois"
            }
        },
        "expressions": EXPRESSIONS
    }

    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(API_URL, json=payload, timeout=30)

            if response.status_code != 200:
                last_error = f"HTTP {response.status_code}: {response.text[:500]}"
                time.sleep(pause_seconds)
                continue

            return response.json()

        except Exception as exc:
            last_error = str(exc)
            time.sleep(pause_seconds)

    raise RuntimeError(f"API call failed after {max_retries} attempts: {last_error}")


def build_dataset():
    monthly_smic_gross, smic_multiples = build_smic_grid()

    rows = []

    for i, multiple in enumerate(smic_multiples, start=1):
        gross_monthly = round(monthly_smic_gross * multiple, 2)

        print(f"[{i}/{len(smic_multiples)}] Evaluating {multiple:.2f} SMIC = {gross_monthly:.2f} € gross/month")

        try:
            result = evaluate_salary(gross_monthly)

            gross_api = extract_value(result, 0)
            net_monthly = extract_value(result, 1)
            employer_cost = extract_value(result, 2)
            total_contributions_api = extract_value(result, 3)
            employer_contributions_api = extract_value(result, 4)
            employee_contributions_api = extract_value(result, 5)

            # Mesures économiques dérivées.
            # On privilégie les identités comptables simples pour les indicateurs principaux.
            gross_used = gross_api if gross_api is not None else gross_monthly

            employee_contributions = None
            if gross_used is not None and net_monthly is not None:
                employee_contributions = gross_used - net_monthly

            employer_contributions = None
            if employer_cost is not None and gross_used is not None:
                employer_contributions = employer_cost - gross_used

            social_wedge = None
            if employer_cost is not None and net_monthly is not None:
                social_wedge = employer_cost - net_monthly

            employee_rate = None
            if employee_contributions is not None and gross_used:
                employee_rate = employee_contributions / gross_used

            employer_rate = None
            if employer_contributions is not None and gross_used:
                employer_rate = employer_contributions / gross_used

            social_wedge_rate = None
            if social_wedge is not None and employer_cost:
                social_wedge_rate = social_wedge / employer_cost

            cost_to_net_ratio = None
            if employer_cost is not None and net_monthly:
                cost_to_net_ratio = employer_cost / net_monthly

            rows.append({
                "source": "mon-entreprise",
                "engine": "api/v1/evaluate",
                "smic_multiple": multiple,
                "gross_monthly_eur": round(gross_used, 2) if gross_used is not None else None,
                "net_monthly_eur": round(net_monthly, 2) if net_monthly is not None else None,
                "employer_cost_monthly_eur": round(employer_cost, 2) if employer_cost is not None else None,

                "employee_contributions_monthly_eur": round(employee_contributions, 2) if employee_contributions is not None else None,
                "employer_contributions_monthly_eur": round(employer_contributions, 2) if employer_contributions is not None else None,
                "social_wedge_monthly_eur": round(social_wedge, 2) if social_wedge is not None else None,

                "employee_contribution_rate": round(employee_rate, 4) if employee_rate is not None else None,
                "employer_contribution_rate": round(employer_rate, 4) if employer_rate is not None else None,
                "social_wedge_rate": round(social_wedge_rate, 4) if social_wedge_rate is not None else None,
                "cost_to_net_ratio": round(cost_to_net_ratio, 4) if cost_to_net_ratio is not None else None,

                # Valeurs brutes renvoyées directement par l'API, conservées pour audit.
                "api_total_contributions_monthly_eur": round(total_contributions_api, 2) if total_contributions_api is not None else None,
                "api_employer_contributions_monthly_eur": round(employer_contributions_api, 2) if employer_contributions_api is not None else None,
                "api_employee_contributions_monthly_eur": round(employee_contributions_api, 2) if employee_contributions_api is not None else None,

                # Information utile pour documenter le degré d'hypothèses implicites.
                "missing_variables_gross": count_missing_variables(result, 0),
                "missing_variables_net": count_missing_variables(result, 1),
                "missing_variables_employer_cost": count_missing_variables(result, 2),
                "status": "ok",
                "error": ""
            })

        except Exception as exc:
            rows.append({
                "source": "mon-entreprise",
                "engine": "api/v1/evaluate",
                "smic_multiple": multiple,
                "gross_monthly_eur": gross_monthly,
                "net_monthly_eur": None,
                "employer_cost_monthly_eur": None,
                "employee_contributions_monthly_eur": None,
                "employer_contributions_monthly_eur": None,
                "social_wedge_monthly_eur": None,
                "employee_contribution_rate": None,
                "employer_contribution_rate": None,
                "social_wedge_rate": None,
                "cost_to_net_ratio": None,
                "api_total_contributions_monthly_eur": None,
                "api_employer_contributions_monthly_eur": None,
                "api_employee_contributions_monthly_eur": None,
                "missing_variables_gross": None,
                "missing_variables_net": None,
                "missing_variables_employer_cost": None,
                "status": "error",
                "error": str(exc)
            })

        time.sleep(0.15)

    df = pd.DataFrame(rows)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

    print()
    print(f"Dataset created: {OUTPUT_PATH}")
    print()
    print(df.head())
    print()
    print("Status counts:")
    print(df["status"].value_counts(dropna=False))


if __name__ == "__main__":
    build_dataset()