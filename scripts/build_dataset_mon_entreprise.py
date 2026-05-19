from pathlib import Path
import time
import requests
import pandas as pd
import yaml


BASE_DIR = Path(__file__).resolve().parents[1]
CONFIG_PATH = BASE_DIR / "config" / "scenarios.yml"
PROFILES_PATH = BASE_DIR / "config" / "profiles.yml"
DATA_DIR = BASE_DIR / "data"
OUTPUT_PATH = DATA_DIR / "labour_cost_grid_mon_entreprise.csv"

API_URL = "https://mon-entreprise.urssaf.fr/api/v1/evaluate"


BASE_EXPRESSIONS = [
    "salarié . contrat . salaire brut",
    "salarié . rémunération . net",
    "salarié . coût total employeur",
    "salarié . cotisations",
    "salarié . cotisations . employeur",
    "salarié . cotisations . salarié",
]


RGDU_CANDIDATE_EXPRESSIONS = [
    "salarié . cotisations . exonérations . RGDU",
    "salarié . cotisations . exonérations . réduction générale",
    "salarié . cotisations . exonérations . réduction générale dégressive unique",
    "salarié . cotisations . exonérations . réduction générale unique",
]


def load_yaml(path: Path):
    with open(path, "r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def load_config():
    return load_yaml(CONFIG_PATH)


def load_profiles():
    if not PROFILES_PATH.exists():
        raise FileNotFoundError(
            f"Missing profile configuration file: {PROFILES_PATH}"
        )

    profiles_config = load_yaml(PROFILES_PATH)

    if "profiles" not in profiles_config:
        raise ValueError("profiles.yml must contain a top-level 'profiles' key.")

    return profiles_config["profiles"]


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


def make_situation(gross_monthly, profile_situation=None):
    situation = {
        "salarié . contrat . salaire brut": {
            "valeur": gross_monthly,
            "unité": "€/mois"
        }
    }

    if profile_situation:
        situation.update(profile_situation)

    return situation


def make_payload(gross_monthly, expressions, profile_situation=None):
    return {
        "situation": make_situation(gross_monthly, profile_situation),
        "expressions": expressions
    }


def post_payload(payload, timeout=30):
    response = requests.post(API_URL, json=payload, timeout=timeout)

    if response.status_code != 200:
        raise RuntimeError(f"HTTP {response.status_code}: {response.text[:800]}")

    return response.json()


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


def select_rgdu_expression(test_gross_monthly, profile_situation=None):
    """
    Mon-entreprise rule names may evolve. We test several plausible names
    and keep the first expression returning a numerical value.
    """

    print("Detecting RGDU 2026 expression...")

    for candidate in RGDU_CANDIDATE_EXPRESSIONS:
        expressions = BASE_EXPRESSIONS + [candidate]
        payload = make_payload(
            test_gross_monthly,
            expressions,
            profile_situation=profile_situation
        )

        try:
            result = post_payload(payload)
            value = extract_value(result, 6)

            if value is not None:
                print(f"RGDU expression selected: {candidate}")
                print(f"Test value at 1 SMIC: {value:.2f} € / month")
                return candidate

        except Exception as exc:
            print(f"RGDU candidate failed: {candidate}")
            print(f"  {exc}")

    print("No RGDU expression found. RGDU columns will be set to 0.")
    return None


def evaluate_salary(
    gross_monthly,
    profile_situation=None,
    rgdu_expression=None,
    max_retries=3,
    pause_seconds=0.5
):
    expressions = BASE_EXPRESSIONS.copy()

    if rgdu_expression:
        expressions.append(rgdu_expression)

    payload = make_payload(
        gross_monthly,
        expressions,
        profile_situation=profile_situation
    )

    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            return post_payload(payload)

        except Exception as exc:
            last_error = str(exc)
            time.sleep(pause_seconds)

    raise RuntimeError(f"API call failed after {max_retries} attempts: {last_error}")


def compute_indicators(result, gross_monthly, rgdu_expression=None):
    gross_api = extract_value(result, 0)
    net_monthly = extract_value(result, 1)
    employer_cost = extract_value(result, 2)
    total_contributions_api = extract_value(result, 3)
    employer_contributions_api = extract_value(result, 4)
    employee_contributions_api = extract_value(result, 5)

    if rgdu_expression:
        rgdu_monthly = extract_value(result, 6)
    else:
        rgdu_monthly = 0.0

    if rgdu_monthly is None:
        rgdu_monthly = 0.0

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

    rgdu_rate_gross = None
    if rgdu_monthly is not None and gross_used:
        rgdu_rate_gross = rgdu_monthly / gross_used

    rgdu_rate_employer_cost = None
    if rgdu_monthly is not None and employer_cost:
        rgdu_rate_employer_cost = rgdu_monthly / employer_cost

    return {
        "gross_used": gross_used,
        "net_monthly": net_monthly,
        "employer_cost": employer_cost,
        "total_contributions_api": total_contributions_api,
        "employer_contributions_api": employer_contributions_api,
        "employee_contributions_api": employee_contributions_api,
        "employee_contributions": employee_contributions,
        "employer_contributions": employer_contributions,
        "social_wedge": social_wedge,
        "employee_rate": employee_rate,
        "employer_rate": employer_rate,
        "social_wedge_rate": social_wedge_rate,
        "cost_to_net_ratio": cost_to_net_ratio,
        "rgdu_monthly": rgdu_monthly,
        "rgdu_rate_gross": rgdu_rate_gross,
        "rgdu_rate_employer_cost": rgdu_rate_employer_cost,
    }


def safe_round(value, digits=2):
    if value is None:
        return None
    return round(float(value), digits)


def make_success_row(
    profile_id,
    profile,
    multiple,
    result,
    gross_monthly,
    rgdu_expression
):
    indicators = compute_indicators(
        result,
        gross_monthly,
        rgdu_expression=rgdu_expression
    )

    return {
        "source": "mon-entreprise",
        "engine": "api/v1/evaluate",
        "profile_id": profile_id,
        "profile_label_fr": profile.get("label_fr", profile_id),
        "profile_label_en": profile.get("label_en", profile_id),
        "rgdu_expression_used": rgdu_expression or "",
        "smic_multiple": multiple,

        "gross_monthly_eur": safe_round(indicators["gross_used"], 2),
        "net_monthly_eur": safe_round(indicators["net_monthly"], 2),
        "employer_cost_monthly_eur": safe_round(indicators["employer_cost"], 2),

        "employee_contributions_monthly_eur": safe_round(indicators["employee_contributions"], 2),
        "employer_contributions_monthly_eur": safe_round(indicators["employer_contributions"], 2),
        "social_wedge_monthly_eur": safe_round(indicators["social_wedge"], 2),

        "employee_contribution_rate": safe_round(indicators["employee_rate"], 4),
        "employer_contribution_rate": safe_round(indicators["employer_rate"], 4),
        "social_wedge_rate": safe_round(indicators["social_wedge_rate"], 4),
        "cost_to_net_ratio": safe_round(indicators["cost_to_net_ratio"], 4),

        "rgdu_monthly_eur": safe_round(indicators["rgdu_monthly"], 2),
        "rgdu_rate_gross": safe_round(indicators["rgdu_rate_gross"], 4),
        "rgdu_rate_employer_cost": safe_round(indicators["rgdu_rate_employer_cost"], 4),

        "api_total_contributions_monthly_eur": safe_round(indicators["total_contributions_api"], 2),
        "api_employer_contributions_monthly_eur": safe_round(indicators["employer_contributions_api"], 2),
        "api_employee_contributions_monthly_eur": safe_round(indicators["employee_contributions_api"], 2),

        "missing_variables_gross": count_missing_variables(result, 0),
        "missing_variables_net": count_missing_variables(result, 1),
        "missing_variables_employer_cost": count_missing_variables(result, 2),

        "status": "ok",
        "error": ""
    }


def make_error_row(
    profile_id,
    profile,
    multiple,
    gross_monthly,
    rgdu_expression,
    error
):
    return {
        "source": "mon-entreprise",
        "engine": "api/v1/evaluate",
        "profile_id": profile_id,
        "profile_label_fr": profile.get("label_fr", profile_id),
        "profile_label_en": profile.get("label_en", profile_id),
        "rgdu_expression_used": rgdu_expression or "",
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

        "rgdu_monthly_eur": None,
        "rgdu_rate_gross": None,
        "rgdu_rate_employer_cost": None,

        "api_total_contributions_monthly_eur": None,
        "api_employer_contributions_monthly_eur": None,
        "api_employee_contributions_monthly_eur": None,

        "missing_variables_gross": None,
        "missing_variables_net": None,
        "missing_variables_employer_cost": None,

        "status": "error",
        "error": str(error)
    }


def build_dataset():
    monthly_smic_gross, smic_multiples = build_smic_grid()
    profiles = load_profiles()

    if not profiles:
        raise ValueError("No profiles found in config/profiles.yml")

    first_profile = next(iter(profiles.values()))
    first_profile_situation = first_profile.get("situation", {})

    rgdu_expression = select_rgdu_expression(
        monthly_smic_gross,
        profile_situation=first_profile_situation
    )

    rows = []

    total_iterations = len(profiles) * len(smic_multiples)
    iteration = 0

    for profile_id, profile in profiles.items():
        profile_situation = profile.get("situation", {})
        profile_label = profile.get("label_fr", profile_id)

        print()
        print("=" * 90)
        print(f"Profile: {profile_id} — {profile_label}")
        print("=" * 90)

        for multiple in smic_multiples:
            iteration += 1
            gross_monthly = round(monthly_smic_gross * multiple, 2)

            print(
                f"[{iteration}/{total_iterations}] "
                f"{profile_id} | {multiple:.2f} SMIC = {gross_monthly:.2f} € gross/month"
            )

            try:
                result = evaluate_salary(
                    gross_monthly,
                    profile_situation=profile_situation,
                    rgdu_expression=rgdu_expression
                )

                rows.append(
                    make_success_row(
                        profile_id=profile_id,
                        profile=profile,
                        multiple=multiple,
                        result=result,
                        gross_monthly=gross_monthly,
                        rgdu_expression=rgdu_expression
                    )
                )

            except Exception as exc:
                rows.append(
                    make_error_row(
                        profile_id=profile_id,
                        profile=profile,
                        multiple=multiple,
                        gross_monthly=gross_monthly,
                        rgdu_expression=rgdu_expression,
                        error=exc
                    )
                )

            time.sleep(0.08)

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

    print()
    print("Status by profile:")
    print(df.groupby(["profile_id", "status"]).size())

    if "rgdu_monthly_eur" in df.columns:
        print()
        print("RGDU summary by profile:")
        print(df.groupby("profile_id")["rgdu_monthly_eur"].describe())


if __name__ == "__main__":
    build_dataset()