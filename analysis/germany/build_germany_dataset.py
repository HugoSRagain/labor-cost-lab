from pathlib import Path
import json

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    BASE_DIR
    / "docs"
    / "data"
    / "germany"
    / "germany_parameters_2026_01.json"
)

OUTPUT_PATH = (
    BASE_DIR
    / "docs"
    / "data"
    / "germany"
    / "germany_labour_cost_grid_2026.csv"
)

VALIDATION_OUTPUT_DIR = (
    BASE_DIR
    / "outputs"
    / "germany"
)

VALIDATION_SUMMARY_PATH = (
    VALIDATION_OUTPUT_DIR
    / "germany_validation_summary.txt"
)

VALIDATION_POINTS_PATH = (
    VALIDATION_OUTPUT_DIR
    / "germany_validation_points.csv"
)

def load_parameters() -> dict:
    with PARAMETERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def cap_base(gross_monthly_eur: float, ceiling_monthly_eur: float) -> float:
    return min(gross_monthly_eur, ceiling_monthly_eur)


def compute_row(
    smic_multiple: float,
    profile: dict,
    parameters: dict
) -> dict:
    minimum_wage_hourly = parameters["minimum_wage"]["hourly_eur"]
    monthly_hours = parameters["working_time_convention"]["monthly_hours"]

    monthly_minimum_wage = minimum_wage_hourly * monthly_hours
    gross = monthly_minimum_wage * smic_multiple

    ceilings = parameters["contribution_ceilings"]
    rates = parameters["rates"]

    health_care_base = cap_base(
        gross,
        ceilings["health_and_care_monthly_eur"]
    )

    pension_unemployment_base = cap_base(
        gross,
        ceilings["pension_and_unemployment_monthly_eur"]
    )

    employee_pension = (
        pension_unemployment_base
        * rates["pension_employee"]
    )

    employer_pension = (
        pension_unemployment_base
        * rates["pension_employer"]
    )

    employee_unemployment = (
        pension_unemployment_base
        * rates["unemployment_employee"]
    )

    employer_unemployment = (
        pension_unemployment_base
        * rates["unemployment_employer"]
    )

    employee_health = health_care_base * (
        rates["health_general_employee"]
        + rates["health_additional_employee_reference"]
    )

    employer_health = health_care_base * (
        rates["health_general_employer"]
        + rates["health_additional_employer_reference"]
    )

    employee_care = (
        health_care_base
        * profile["care_employee_rate"]
    )

    employer_care = (
        health_care_base
        * profile["care_employer_rate"]
    )

    employee_contributions = (
        employee_pension
        + employee_unemployment
        + employee_health
        + employee_care
    )

    employer_contributions = (
        employer_pension
        + employer_unemployment
        + employer_health
        + employer_care
    )

    net_before_income_tax = gross - employee_contributions
    employer_cost = gross + employer_contributions
    social_wedge = employer_cost - net_before_income_tax

    return {
        "country": parameters["country"],
        "profile_id": profile["profile_id"],
        "profile_label_fr": profile["label_fr"],
        "profile_label_en": profile["label_en"],
        "dimension_region": profile["region"],
        "dimension_family_status": profile["family_status"],
        "dimension_health_insurance": profile["health_insurance"],
        "parameter_version": parameters["version"],
        "effective_from": parameters["effective_from"],

        "minimum_wage_hourly_eur": minimum_wage_hourly,
        "monthly_reference_hours": monthly_hours,
        "monthly_minimum_wage_eur": monthly_minimum_wage,

        "smic_multiple": round(smic_multiple, 2),
        "gross_monthly_eur": gross,
        "net_before_income_tax_monthly_eur": net_before_income_tax,
        "employer_cost_monthly_eur": employer_cost,

        "employee_contributions_monthly_eur": employee_contributions,
        "employer_contributions_monthly_eur": employer_contributions,

        "employee_pension_monthly_eur": employee_pension,
        "employee_unemployment_monthly_eur": employee_unemployment,
        "employee_health_monthly_eur": employee_health,
        "employee_care_monthly_eur": employee_care,

        "employer_pension_monthly_eur": employer_pension,
        "employer_unemployment_monthly_eur": employer_unemployment,
        "employer_health_monthly_eur": employer_health,
        "employer_care_monthly_eur": employer_care,

        "health_care_base_monthly_eur": health_care_base,
        "pension_unemployment_base_monthly_eur": pension_unemployment_base,

        "social_wedge_monthly_eur": social_wedge,

        "employee_contribution_rate": (
            employee_contributions / gross
            if gross > 0
            else 0
        ),
        "employer_contribution_rate": (
            employer_contributions / gross
            if gross > 0
            else 0
        ),
        "social_wedge_rate": (
            social_wedge / employer_cost
            if employer_cost > 0
            else 0
        ),
        "cost_to_net_ratio": (
            employer_cost / net_before_income_tax
            if net_before_income_tax > 0
            else np.nan
        ),
    }


def build_dataset(parameters: dict) -> pd.DataFrame:
    wage_grid = np.round(
        np.arange(0.80, 6.00 + 0.001, 0.01),
        2
    )

    rows = []

    for profile in parameters["profiles"]:
        for smic_multiple in wage_grid:
            rows.append(
                compute_row(
                    smic_multiple=smic_multiple,
                    profile=profile,
                    parameters=parameters
                )
            )

    return pd.DataFrame(rows)


def print_quality_checks(dataset: pd.DataFrame) -> None:
    print()
    print("Quality checks")

    expected_rows = 521 * dataset["profile_id"].nunique()
    actual_rows = len(dataset)

    print(f"Profiles: {dataset['profile_id'].nunique()}")
    print(f"Rows: {actual_rows}")
    print(f"Expected rows: {expected_rows}")

    if actual_rows != expected_rows:
        raise ValueError(
            f"Unexpected number of rows: {actual_rows}, expected {expected_rows}"
        )

    check_net = (
        dataset["gross_monthly_eur"]
        - dataset["employee_contributions_monthly_eur"]
        - dataset["net_before_income_tax_monthly_eur"]
    ).abs().max()

    check_cost = (
        dataset["gross_monthly_eur"]
        + dataset["employer_contributions_monthly_eur"]
        - dataset["employer_cost_monthly_eur"]
    ).abs().max()

    check_wedge = (
        dataset["employer_cost_monthly_eur"]
        - dataset["net_before_income_tax_monthly_eur"]
        - dataset["social_wedge_monthly_eur"]
    ).abs().max()

    print(f"Max net identity error: {check_net:.10f}")
    print(f"Max employer cost identity error: {check_cost:.10f}")
    print(f"Max social wedge identity error: {check_wedge:.10f}")

    if check_net > 1e-8:
        raise ValueError("Net wage identity check failed.")

    if check_cost > 1e-8:
        raise ValueError("Employer cost identity check failed.")

    if check_wedge > 1e-8:
        raise ValueError("Social wedge identity check failed.")


def print_sample(dataset: pd.DataFrame) -> None:
    sample = dataset[
        dataset["smic_multiple"].isin([1.00, 2.00, 3.00, 6.00])
    ][
        [
            "profile_id",
            "smic_multiple",
            "gross_monthly_eur",
            "net_before_income_tax_monthly_eur",
            "employer_cost_monthly_eur",
            "employee_contribution_rate",
            "employer_contribution_rate",
            "cost_to_net_ratio",
        ]
    ]

    print()
    print("Sample rows")
    print(sample.to_string(index=False))

def export_validation_report(dataset: pd.DataFrame) -> None:
    VALIDATION_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    control_points = dataset[
        dataset["smic_multiple"].isin([1.00, 2.00, 3.00, 6.00])
    ].copy()

    control_points = control_points[
        [
            "profile_id",
            "profile_label_fr",
            "dimension_region",
            "dimension_family_status",
            "smic_multiple",
            "gross_monthly_eur",
            "net_before_income_tax_monthly_eur",
            "employee_contributions_monthly_eur",
            "employer_contributions_monthly_eur",
            "employer_cost_monthly_eur",
            "social_wedge_monthly_eur",
            "employee_contribution_rate",
            "employer_contribution_rate",
            "social_wedge_rate",
            "cost_to_net_ratio",
            "health_care_base_monthly_eur",
            "pension_unemployment_base_monthly_eur",
        ]
    ]

    control_points.to_csv(
        VALIDATION_POINTS_PATH,
        index=False,
        encoding="utf-8"
    )

    profiles = dataset["profile_id"].nunique()
    rows = len(dataset)
    expected_rows = 521 * profiles

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

    health_ceiling = dataset["health_care_base_monthly_eur"].max()
    pension_ceiling = dataset["pension_unemployment_base_monthly_eur"].max()
    
    reference_row = dataset[
        dataset["smic_multiple"] == 1.00
    ].iloc[0]

    monthly_minimum_wage = reference_row["monthly_minimum_wage_eur"]

    health_ceiling_multiple = (
        health_ceiling
        / monthly_minimum_wage
    )

    pension_ceiling_multiple = (
        pension_ceiling
        / monthly_minimum_wage
    )

    first_health_ceiling_row = dataset[
        dataset["health_care_base_monthly_eur"] >= health_ceiling
    ].sort_values("smic_multiple").iloc[0]

    first_pension_ceiling_row = dataset[
        dataset["pension_unemployment_base_monthly_eur"] >= pension_ceiling
    ].sort_values("smic_multiple").iloc[0]

    summary = f"""German Labour Cost Lab validation summary

Dataset
-------
Profiles: {profiles}
Rows: {rows}
Expected rows: {expected_rows}

Accounting identities
---------------------
Max net identity error: {net_identity_error:.10f}
Max employer cost identity error: {employer_cost_identity_error:.10f}
Max social wedge identity error: {social_wedge_identity_error:.10f}

Contribution ceilings reached in dataset
----------------------------------------
Maximum health/care contribution base: {health_ceiling:.2f} EUR
Maximum pension/unemployment contribution base: {pension_ceiling:.2f} EUR

Ceiling thresholds
------------------
Monthly minimum wage reference: {monthly_minimum_wage:.2f} EUR

Health/care ceiling:
- ceiling amount: {health_ceiling:.2f} EUR
- analytical threshold: {health_ceiling_multiple:.4f} minimum wages
- first grid point reaching ceiling: {first_health_ceiling_row["smic_multiple"]:.2f} minimum wages

Pension/unemployment ceiling:
- ceiling amount: {pension_ceiling:.2f} EUR
- analytical threshold: {pension_ceiling_multiple:.4f} minimum wages
- first grid point reaching ceiling: {first_pension_ceiling_row["smic_multiple"]:.2f} minimum wages

Control points
--------------
Control points exported to:
{VALIDATION_POINTS_PATH}

Interpretation
--------------
The German module is a rule-based simulation built from documented social security parameters.
The net wage is computed before personal income tax.
Income tax, mini-jobs, midi-jobs, private health insurance, accident insurance,
Kirchensteuer and Solidaritätszuschlag are excluded from this prototype.
"""

    VALIDATION_SUMMARY_PATH.write_text(
        summary,
        encoding="utf-8"
    )

    print()
    print("Validation report exported.")
    print(f"Summary: {VALIDATION_SUMMARY_PATH}")
    print(f"Control points: {VALIDATION_POINTS_PATH}")

def main() -> None:
    parameters = load_parameters()
    dataset = build_dataset(parameters)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8"
    )

    print("Germany dataset created.")
    print(f"Output: {OUTPUT_PATH}")

    print_quality_checks(dataset)
    print_sample(dataset)
    export_validation_report(dataset)


if __name__ == "__main__":
    main()