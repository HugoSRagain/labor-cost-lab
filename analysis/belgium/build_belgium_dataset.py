from pathlib import Path
import json

import numpy as np
import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "belgium"
    / "belgium_parameters_2026.json"
)

OUTPUT_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "belgium"
    / "belgium_labour_cost_grid_2026.csv"
)


def load_parameters() -> dict:
    with PARAMETERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def compute_structural_reduction(
    gross_monthly_eur: float,
    parameters: dict
) -> dict:
    structural_reduction = parameters["social_security"]["structural_reduction"]

    reference_wage_quarterly = (
        gross_monthly_eur
        * 3
    )

    if not structural_reduction["active"]:
        return {
            "structural_reduction_monthly_eur": 0.0,
            "structural_reduction_quarterly_eur": 0.0,
            "structural_reduction_low_wage_component_quarterly_eur": 0.0,
            "structural_reduction_very_low_wage_component_quarterly_eur": 0.0,
            "structural_reduction_reference_wage_quarterly_eur": reference_wage_quarterly
        }

    low_wage_component = (
        structural_reduction["low_wage_component_rate"]
        * (
            structural_reduction["low_wage_threshold_quarterly_eur"]
            - reference_wage_quarterly
        )
    )

    very_low_wage_component = (
        structural_reduction["very_low_wage_component_rate"]
        * (
            structural_reduction["very_low_wage_threshold_quarterly_eur"]
            - reference_wage_quarterly
        )
    )

    low_wage_component = max(
        low_wage_component,
        0.0
    )

    very_low_wage_component = max(
        very_low_wage_component,
        0.0
    )

    structural_reduction_quarterly = (
        low_wage_component
        + very_low_wage_component
    )

    structural_reduction_quarterly = (
        structural_reduction_quarterly
        * structural_reduction["mu"]
        * structural_reduction["beta_s"]
    )

    structural_reduction_monthly = (
        structural_reduction_quarterly
        / 3
    )

    return {
        "structural_reduction_monthly_eur": structural_reduction_monthly,
        "structural_reduction_quarterly_eur": structural_reduction_quarterly,
        "structural_reduction_low_wage_component_quarterly_eur": low_wage_component,
        "structural_reduction_very_low_wage_component_quarterly_eur": very_low_wage_component,
        "structural_reduction_reference_wage_quarterly_eur": reference_wage_quarterly
    }

def compute_row(
    profile: dict,
    smic_multiple: float,
    parameters: dict
) -> dict:
    wage_reference = parameters["wage_reference"]["gross_monthly_eur"]

    gross_monthly_eur = wage_reference * smic_multiple

    employee_rate = profile["employee_contribution_rate"]
    employer_rate = profile["employer_contribution_rate"]

    employee_contributions = (
        gross_monthly_eur
        * employee_rate
    )

    employer_contributions_before_reduction = (
        gross_monthly_eur
        * employer_rate
    )

    structural_reduction = compute_structural_reduction(
        gross_monthly_eur=gross_monthly_eur,
        parameters=parameters
    )

    employer_contributions = max(
        employer_contributions_before_reduction
        - structural_reduction["structural_reduction_monthly_eur"],
        0.0
    )

    net_before_income_tax = (
        gross_monthly_eur
        - employee_contributions
    )

    employer_cost = (
        gross_monthly_eur
        + employer_contributions
    )

    social_wedge = (
        employer_cost
        - net_before_income_tax
    )

    return {
        "country": parameters["country"],
        "country_code": parameters["country_code"],
        "version": parameters["version"],
        "effective_from": parameters["effective_from"],
        "profile_id": profile["profile_id"],
        "profile_label_fr": profile["label_fr"],
        "profile_label_en": profile["label_en"],
        "smic_multiple": smic_multiple,
        "gross_monthly_eur": gross_monthly_eur,
        "employee_contribution_rate": employee_rate,
        "employer_contribution_rate_before_reduction": employer_rate,
        "employee_contributions_monthly_eur": employee_contributions,
        "employer_contributions_before_reduction_monthly_eur": employer_contributions_before_reduction,
        "structural_reduction_monthly_eur": structural_reduction["structural_reduction_monthly_eur"],
        "structural_reduction_quarterly_eur": structural_reduction["structural_reduction_quarterly_eur"],
        "structural_reduction_low_wage_component_quarterly_eur": structural_reduction["structural_reduction_low_wage_component_quarterly_eur"],
        "structural_reduction_very_low_wage_component_quarterly_eur": structural_reduction["structural_reduction_very_low_wage_component_quarterly_eur"],
        "structural_reduction_reference_wage_quarterly_eur": structural_reduction["structural_reduction_reference_wage_quarterly_eur"],
        "employer_contributions_monthly_eur": employer_contributions,
        "employer_contribution_rate": (
            employer_contributions
            / gross_monthly_eur
            if gross_monthly_eur > 0
            else np.nan
        ),
        "net_before_income_tax_monthly_eur": net_before_income_tax,
        "employer_cost_monthly_eur": employer_cost,
        "social_wedge_monthly_eur": social_wedge,
        "cost_to_net_ratio": (
            employer_cost
            / net_before_income_tax
            if net_before_income_tax > 0
            else np.nan
        )
    }


def build_dataset(parameters: dict) -> pd.DataFrame:
    grid_parameters = parameters["grid"]

    wage_grid = np.round(
        np.arange(
            grid_parameters["min_multiple"],
            grid_parameters["max_multiple"] + 0.001,
            grid_parameters["step"]
        ),
        2
    )

    rows = []

    for profile in parameters["profiles"]:
        for smic_multiple in wage_grid:
            rows.append(
                compute_row(
                    profile=profile,
                    smic_multiple=float(smic_multiple),
                    parameters=parameters
                )
            )

    dataset = pd.DataFrame(rows)

    return dataset


def run_quality_checks(dataset: pd.DataFrame) -> dict:
    net_identity_error = (
        dataset["gross_monthly_eur"]
        - dataset["employee_contributions_monthly_eur"]
        - dataset["net_before_income_tax_monthly_eur"]
    ).abs().max()

    employer_cost_identity_error = (
        dataset["gross_monthly_eur"]
        + dataset["employer_contributions_monthly_eur"]
        - dataset["employer_cost_monthly_eur"]
    ).abs().max()

    social_wedge_identity_error = (
        dataset["employer_cost_monthly_eur"]
        - dataset["net_before_income_tax_monthly_eur"]
        - dataset["social_wedge_monthly_eur"]
    ).abs().max()

    return {
        "rows": len(dataset),
        "profiles": dataset["profile_id"].nunique(),
        "max_net_identity_error": net_identity_error,
        "max_employer_cost_identity_error": employer_cost_identity_error,
        "max_social_wedge_identity_error": social_wedge_identity_error
    }


def main() -> None:
    parameters = load_parameters()
    dataset = build_dataset(parameters)

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    dataset.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8"
    )

    checks = run_quality_checks(dataset)

    print("Belgium dataset created.")
    print(f"Output: {OUTPUT_PATH}")
    print()
    print("Quality checks")
    print(f"Profiles: {checks['profiles']}")
    print(f"Rows: {checks['rows']}")
    print(
        "Max net identity error: "
        f"{checks['max_net_identity_error']:.10f}"
    )
    print(
        "Max employer cost identity error: "
        f"{checks['max_employer_cost_identity_error']:.10f}"
    )
    print(
        "Max social wedge identity error: "
        f"{checks['max_social_wedge_identity_error']:.10f}"
    )


if __name__ == "__main__":
    main()