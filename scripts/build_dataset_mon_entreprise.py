from pathlib import Path
import argparse
import time
import requests
import pandas as pd
import yaml


BASE_DIR = Path(__file__).resolve().parents[1]
CONFIG_PATH = BASE_DIR / "config" / "scenarios.yml"
PROFILES_PATH = BASE_DIR / "config" / "profiles.yml"
DATA_DIR = BASE_DIR / "data"
PARTS_DIR = DATA_DIR / "parts"
OUTPUT_PATH = DATA_DIR / "labour_cost_grid_mon_entreprise.csv"

API_URL = "https://mon-entreprise.urssaf.fr/api/v1/evaluate"


BASE_EXPRESSIONS = [
    "salarié . contrat . salaire brut",
    "salarié . rémunération . net",
    "salarié . coût total employeur",

    "salarié . cotisations",
    "salarié . cotisations . employeur",
    "salarié . cotisations . salarié",

    # Salarié
    "salarié . cotisations . CSG-CRDS",
    "salarié . cotisations . vieillesse . salarié",
    "salarié . cotisations . retraite complémentaire-CEG-CET . salarié",

    # Employeur
    "salarié . cotisations . vieillesse . employeur",
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
    "salarié . cotisations . contribution au dialogue social",
]


RGDU_CANDIDATE_EXPRESSIONS = [
    "salarié . cotisations . exonérations",
    "salarié . cotisations . exonérations . employeur",
    "salarié . cotisations . exonérations . RGDU",
    "salarié . cotisations . exonérations . RGDU . montant",
    "salarié . cotisations . exonérations . RGDU . réduction",
    "salarié . cotisations . exonérations . réduction générale",
    "salarié . cotisations . exonérations . réduction générale dégressive",
    "salarié . cotisations . exonérations . réduction générale dégressive unique",
    
]

FIXED_RGDU_EXPRESSION = "salarié . cotisations . exonérations"

def load_yaml(path: Path):
    with open(path, "r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def load_config():
    return load_yaml(CONFIG_PATH)

def parse_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--status", required=True)
    parser.add_argument("--territory", required=True)
    parser.add_argument("--working-time", required=True)

    return parser.parse_args()

def merge_situations(*situations):
    merged = {}

    for situation in situations:
        if situation:
            merged.update(situation)

    return merged


def load_profiles():
    if not PROFILES_PATH.exists():
        raise FileNotFoundError(
            f"Missing profile configuration file: {PROFILES_PATH}"
        )

    profiles_config = load_yaml(PROFILES_PATH)

    # Ancienne structure : profiles:
    # On la garde compatible au cas où.
    if "profiles" in profiles_config:
        return profiles_config["profiles"]

    # Nouvelle structure combinatoire : dimensions:
    if "dimensions" not in profiles_config:
        raise ValueError(
            "profiles.yml must contain either a top-level 'profiles' key "
            "or a top-level 'dimensions' key."
        )

    dimensions = profiles_config["dimensions"]

    required_dimensions = ["status", "territory", "firm_size", "atmp", "working_time"]

    for dimension in required_dimensions:
        if dimension not in dimensions:
            raise ValueError(f"Missing dimension in profiles.yml: {dimension}")

    generated_profiles = {}

    for status_id, status in dimensions["status"].items():
        for territory_id, territory in dimensions["territory"].items():
            for firm_size_id, firm_size in dimensions["firm_size"].items():
                for atmp_id, atmp in dimensions["atmp"].items():
                    for working_time_id, working_time in dimensions["working_time"].items():

                        profile_id = (
                            f"{status_id}__{territory_id}__{firm_size_id}__"
                            f"{atmp_id}__{working_time_id}"
                        )

                        label_fr = (
                            f"{status.get('label_fr', status_id)} · "
                            f"{territory.get('label_fr', territory_id)} · "
                            f"{firm_size.get('label_fr', firm_size_id)} · "
                            f"{atmp.get('label_fr', atmp_id)} · "
                            f"{working_time.get('label_fr', working_time_id)}"
                        )

                        label_en = (
                            f"{status.get('label_en', status_id)} · "
                            f"{territory.get('label_en', territory_id)} · "
                            f"{firm_size.get('label_en', firm_size_id)} · "
                            f"{atmp.get('label_en', atmp_id)} · "
                            f"{working_time.get('label_en', working_time_id)}"
                        )

                        situation = merge_situations(
                            status.get("situation", {}),
                            territory.get("situation", {}),
                            firm_size.get("situation", {}),
                            atmp.get("situation", {}),
                            working_time.get("situation", {})
                        )

                        generated_profiles[profile_id] = {
                            "label_fr": label_fr,
                            "label_en": label_en,
                            "dimension_status": status_id,
                            "dimension_territory": territory_id,
                            "dimension_firm_size": firm_size_id,
                            "dimension_atmp": atmp_id,
                            "dimension_working_time": working_time_id,
                            "working_time_rate": float(
                                working_time.get("working_time_rate", 1.0)
                            ),
                            "situation": situation
                        }

    return generated_profiles

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
    RGDU expression fixed after API diagnostic.
    Avoids repeated detection calls and reduces rate-limit risk.
    """

    print("RGDU expression fixed:")
    print(f"RGDU expression selected: {FIXED_RGDU_EXPRESSION}")

    return FIXED_RGDU_EXPRESSION

def evaluate_salary(
    gross_monthly,
    profile_situation=None,
    rgdu_expression=None,
    max_retries=10,
    pause_seconds=2.0
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

            if "HTTP 429" in last_error:
                wait_seconds = min(90, pause_seconds * attempt * 6)
                print(
                    f"Rate limit hit on attempt {attempt}/{max_retries}. "
                    f"Waiting {wait_seconds:.1f}s before retry..."
                )
            else:
                wait_seconds = pause_seconds * attempt
                print(
                    f"API error on attempt {attempt}/{max_retries}. "
                    f"Waiting {wait_seconds:.1f}s before retry..."
                )

            time.sleep(wait_seconds)

    raise RuntimeError(f"API call failed after {max_retries} attempts: {last_error}")


def compute_indicators(result, gross_monthly, rgdu_expression=None):
    gross_api = extract_value(result, 0)
    net_monthly = extract_value(result, 1)
    employer_cost = extract_value(result, 2)
    total_contributions_api = extract_value(result, 3)
    employer_contributions_api = extract_value(result, 4)
    employee_contributions_api = extract_value(result, 5)

    # Detailed contribution expressions added after the 6 base expressions
    employee_csg_crds = extract_value(result, 6)
    employee_old_age = extract_value(result, 7)
    employee_retirement_complementary_ceg_cet = extract_value(result, 8)

    employer_old_age = extract_value(result, 9)
    employer_retirement_complementary_ceg_cet = extract_value(result, 10)
    employer_health = extract_value(result, 11)
    employer_family = extract_value(result, 12)
    employer_unemployment = extract_value(result, 13)
    employer_ags = extract_value(result, 14)
    employer_atmp = extract_value(result, 15)
    employer_fnal = extract_value(result, 16)
    employer_csa = extract_value(result, 17)
    employer_training = extract_value(result, 18)
    employer_apprenticeship_tax = extract_value(result, 19)
    employer_social_dialogue = extract_value(result, 20)

    if rgdu_expression:
        rgdu_monthly = extract_value(result, 21)
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

    def safe(value):
        return 0.0 if value is None else value

    employee_identified = (
        safe(employee_csg_crds)
        + safe(employee_old_age)
        + safe(employee_retirement_complementary_ceg_cet)
    )

    employee_other = None
    if employee_contributions is not None:
        employee_other = employee_contributions - employee_identified

    employer_identified = (
        safe(employer_old_age)
        + safe(employer_retirement_complementary_ceg_cet)
        + safe(employer_health)
        + safe(employer_family)
        + safe(employer_unemployment)
        + safe(employer_ags)
        + safe(employer_atmp)
        + safe(employer_fnal)
        + safe(employer_csa)
        + safe(employer_training)
        + safe(employer_apprenticeship_tax)
        + safe(employer_social_dialogue)
    )

    employer_contributions_before_relief = None
    if employer_contributions is not None:
        employer_contributions_before_relief = employer_contributions + rgdu_monthly

    employer_other = None
    if employer_contributions_before_relief is not None:
        employer_other = employer_contributions_before_relief - employer_identified

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

        # Detailed decomposition
        "employee_csg_crds": employee_csg_crds,
        "employee_old_age": employee_old_age,
        "employee_retirement_complementary_ceg_cet": employee_retirement_complementary_ceg_cet,
        "employee_other": employee_other,

        "employer_old_age": employer_old_age,
        "employer_retirement_complementary_ceg_cet": employer_retirement_complementary_ceg_cet,
        "employer_health": employer_health,
        "employer_family": employer_family,
        "employer_unemployment": employer_unemployment,
        "employer_ags": employer_ags,
        "employer_atmp": employer_atmp,
        "employer_fnal": employer_fnal,
        "employer_csa": employer_csa,
        "employer_training": employer_training,
        "employer_apprenticeship_tax": employer_apprenticeship_tax,
        "employer_social_dialogue": employer_social_dialogue,
        "employer_other": employer_other,
        "employer_contributions_before_relief": employer_contributions_before_relief,
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

    working_time_rate = float(profile.get("working_time_rate", 1.0))
    gross_monthly_etp = gross_monthly / working_time_rate if working_time_rate else gross_monthly
    smic_multiple_etp = multiple

    return {
        "source": "mon-entreprise",
        "engine": "api/v1/evaluate",
        "profile_id": profile_id,
        "profile_label_fr": profile.get("label_fr", profile_id),
        "profile_label_en": profile.get("label_en", profile_id),
        "dimension_status": profile.get("dimension_status", ""),
        "dimension_territory": profile.get("dimension_territory", ""),
        "dimension_firm_size": profile.get("dimension_firm_size", ""),
        "dimension_atmp": profile.get("dimension_atmp", ""),
        "dimension_working_time": profile.get("dimension_working_time", ""),
        "working_time_rate": safe_round(working_time_rate, 2),
        "rgdu_expression_used": rgdu_expression or "",

        "smic_multiple": smic_multiple_etp,
        "smic_multiple_etp": smic_multiple_etp,

        "gross_monthly_eur": gross_monthly,
        "gross_monthly_real_eur": gross_monthly,
        "gross_monthly_etp_eur": safe_round(gross_monthly_etp, 2),
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

        "employee_csg_crds_monthly_eur": safe_round(indicators["employee_csg_crds"], 2),
        "employee_old_age_monthly_eur": safe_round(indicators["employee_old_age"], 2),
        "employee_retirement_complementary_ceg_cet_monthly_eur": safe_round(indicators["employee_retirement_complementary_ceg_cet"], 2),
        "employee_other_monthly_eur": safe_round(indicators["employee_other"], 2),

        "employer_old_age_monthly_eur": safe_round(indicators["employer_old_age"], 2),
        "employer_retirement_complementary_ceg_cet_monthly_eur": safe_round(indicators["employer_retirement_complementary_ceg_cet"], 2),
        "employer_health_monthly_eur": safe_round(indicators["employer_health"], 2),
        "employer_family_monthly_eur": safe_round(indicators["employer_family"], 2),
        "employer_unemployment_monthly_eur": safe_round(indicators["employer_unemployment"], 2),
        "employer_ags_monthly_eur": safe_round(indicators["employer_ags"], 2),
        "employer_atmp_monthly_eur": safe_round(indicators["employer_atmp"], 2),
        "employer_fnal_monthly_eur": safe_round(indicators["employer_fnal"], 2),
        "employer_csa_monthly_eur": safe_round(indicators["employer_csa"], 2),
        "employer_training_monthly_eur": safe_round(indicators["employer_training"], 2),
        "employer_apprenticeship_tax_monthly_eur": safe_round(indicators["employer_apprenticeship_tax"], 2),
        "employer_social_dialogue_monthly_eur": safe_round(indicators["employer_social_dialogue"], 2),
        "employer_other_monthly_eur": safe_round(indicators["employer_other"], 2),
        "employer_contributions_before_relief_monthly_eur": safe_round(indicators["employer_contributions_before_relief"], 2),

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
        "employee_csg_crds_monthly_eur": None,
        "employee_old_age_monthly_eur": None,
        "employee_retirement_complementary_ceg_cet_monthly_eur": None,
        "employee_other_monthly_eur": None,

        "employer_old_age_monthly_eur": None,
        "employer_retirement_complementary_ceg_cet_monthly_eur": None,
        "employer_health_monthly_eur": None,
        "employer_family_monthly_eur": None,
        "employer_unemployment_monthly_eur": None,
        "employer_ags_monthly_eur": None,
        "employer_atmp_monthly_eur": None,
        "employer_fnal_monthly_eur": None,
        "employer_csa_monthly_eur": None,
        "employer_training_monthly_eur": None,
        "employer_apprenticeship_tax_monthly_eur": None,
        "employer_social_dialogue_monthly_eur": None,
        "employer_other_monthly_eur": None,
        "employer_contributions_before_relief_monthly_eur": None,
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
    args = parse_args()

    monthly_smic_gross, smic_multiples = build_smic_grid()
    profiles = load_profiles()

    profiles = {
        profile_id: profile
        for profile_id, profile in profiles.items()
        if profile.get("dimension_status") == args.status
        and profile.get("dimension_territory") == args.territory
        and profile.get("dimension_working_time") == args.working_time
    }

    if not profiles:
        raise ValueError(
            "No profiles found for filters: "
            f"status={args.status}, "
            f"territory={args.territory}, "
            f"working_time={args.working_time}"
        )

    PARTS_DIR.mkdir(parents=True, exist_ok=True)

    output_path = PARTS_DIR / (
        f"labour_cost_grid__{args.status}__"
        f"{args.territory}__{args.working_time}.csv"
    )

    
    first_profile = next(iter(profiles.values()))
    first_profile_situation = first_profile.get("situation", {})

    rgdu_expression = select_rgdu_expression(
        monthly_smic_gross,
        profile_situation=first_profile_situation
    )

    rows = []
    existing_keys = set()

    if output_path.exists():
        existing_df = pd.read_csv(output_path)
        rows = existing_df.to_dict("records")

        if "smic_multiple_etp" in existing_df.columns:
            existing_multiple_col = "smic_multiple_etp"
        else:
            existing_multiple_col = "smic_multiple"

        existing_keys = set(
            zip(
                existing_df["profile_id"].astype(str),
                existing_df[existing_multiple_col].round(2)
            )
        )

        print()
        print(f"Resume mode: found {len(existing_keys)} existing rows in {output_path}")
        print()

    checkpoint_every = 500

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

            row_key = (profile_id, round(float(multiple), 2))

            if row_key in existing_keys:
                if iteration % 500 == 0:
                    print(
                        f"[{iteration}/{total_iterations}] "
                        f"Skipping existing row: {profile_id} | {multiple:.2f} SMIC ETP"
                    )
                continue

            working_time_rate = float(profile.get("working_time_rate", 1.0))

            # The grid axis remains expressed in full-time equivalent SMIC.
            gross_monthly_etp = round(monthly_smic_gross * multiple, 2)

            # The amount sent to Mon-entreprise is the actual monthly gross wage paid.
            # For part-time workers, RGDU must be computed using a prorated SMIC reference
            # through the working-time situation passed to the engine.
            gross_monthly = round(gross_monthly_etp * working_time_rate, 2)

            print(
                f"[{iteration}/{total_iterations}] "
                f"{profile_id} | {multiple:.2f} SMIC ETP = "
                f"{gross_monthly:.2f} € gross/month actual"
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
                if "HTTP 429" in str(exc):
                    print("HTTP 429 after retries. Saving checkpoint and stopping cleanly.")
                    checkpoint_df = pd.DataFrame(rows)
                    DATA_DIR.mkdir(parents=True, exist_ok=True)
                    checkpoint_df.to_csv(
                        output_path,
                        index=False,
                        encoding="utf-8-sig"
                    )
                    raise

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


            if iteration % checkpoint_every == 0:
                checkpoint_df = pd.DataFrame(rows)
                DATA_DIR.mkdir(parents=True, exist_ok=True)
                checkpoint_df.to_csv(
                    output_path,
                    index=False,
                    encoding="utf-8-sig"
                )
                print(f"Checkpoint saved at iteration {iteration}/{total_iterations}")

            time.sleep(0.80)

    df = pd.DataFrame(rows)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False, encoding="utf-8-sig")

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