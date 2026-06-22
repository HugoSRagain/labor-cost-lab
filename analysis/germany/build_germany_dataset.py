from pathlib import Path
import pandas as pd
import numpy as np


BASE_DIR = Path(__file__).resolve().parents[2]
OUTPUT_DIR = BASE_DIR / "docs" / "data" / "germany"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


PARAMETERS = {
    "version": "2026-01",
    "effective_from": "2026-01-01",
    "country": "Germany",
    "minimum_wage_hourly_eur": 13.90,
    "monthly_hours": 173.33,

    # Contribution ceilings, monthly euros, 2026.
    "health_care_ceiling_monthly_eur": 5812.50,
    "pension_unemployment_ceiling_monthly_eur": 8450.00,

    # Statutory / reference rates.
    "pension_total_rate": 0.186,
    "pension_employee_rate": 0.093,
    "pension_employer_rate": 0.093,

    "unemployment_total_rate": 0.026,
    "unemployment_employee_rate": 0.013,
    "unemployment_employer_rate": 0.013,

    "health_general_total_rate": 0.146,
    "health_general_employee_rate": 0.073,
    "health_general_employer_rate": 0.073,

    # Reference Zusatzbeitrag assumption.
    # V1 convention: average additional contribution, split equally.
    "health_additional_total_rate": 0.029,
    "health_additional_employee_rate": 0.0145,
    "health_additional_employer_rate": 0.0145,

    # Long-term care insurance.
    # V1 convention: employee without children, outside Saxony.
    "care_employee_rate": 0.024,
    "care_employer_rate": 0.018,
}


def cap_base(gross_monthly_eur: float, ceiling_monthly_eur: float) -> float:
    return min(gross_monthly_eur, ceiling_monthly_eur)


def compute_row(smic_multiple: float) -> dict:
    monthly_minimum_wage = (
        PARAMETERS["minimum_wage_hourly_eur"]
        * PARAMETERS["monthly_hours"]
    )

    gross = monthly_minimum_wage * smic_multiple

    health_base = cap_base(
        gross,
        PARAMETERS["health_care_ceiling_monthly_eur"]
    )

    pension_base = cap_base(
        gross,
        PARAMETERS["pension_unemployment_ceiling_monthly_eur"]
    )

    employee_pension = pension_base * PARAMETERS["pension_employee_rate"]
    employer_pension = pension_base * PARAMETERS["pension_employer_rate"]

    employee_unemployment = pension_base * PARAMETERS["unemployment_employee_rate"]
    employer_unemployment = pension_base * PARAMETERS["unemployment_employer_rate"]

    employee_health = health_base * (
        PARAMETERS["health_general_employee_rate"]
        + PARAMETERS["health_additional_employee_rate"]
    )

    employer_health = health_base * (
        PARAMETERS["health_general_employer_rate"]
        + PARAMETERS["health_additional_employer_rate"]
    )

    employee_care = health_base * PARAMETERS["care_employee_rate"]
    employer_care = health_base * PARAMETERS["care_employer_rate"]

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
        "country": "Germany",
        "profile_id": "germany__standard__public_health__no_children__outside_saxony",
        "parameter_version": PARAMETERS["version"],
        "effective_from": PARAMETERS["effective_from"],

        "minimum_wage_hourly_eur": PARAMETERS["minimum_wage_hourly_eur"],
        "monthly_hours": PARAMETERS["monthly_hours"],
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


def build_dataset() -> pd.DataFrame:
    wage_grid = np.round(np.arange(0.80, 6.00 + 0.001, 0.01), 2)
    rows = [compute_row(smic_multiple) for smic_multiple in wage_grid]
    return pd.DataFrame(rows)


def main() -> None:
    dataset = build_dataset()

    output_path = OUTPUT_DIR / "germany_labour_cost_grid_2026.csv"
    dataset.to_csv(output_path, index=False, encoding="utf-8")

    print("Germany dataset created.")
    print(f"Rows: {len(dataset)}")
    print(f"Output: {output_path}")

    sample = dataset[
        dataset["smic_multiple"].isin([1.00, 2.00, 3.00, 6.00])
    ][
        [
            "smic_multiple",
            "gross_monthly_eur",
            "net_before_income_tax_monthly_eur",
            "employer_cost_monthly_eur",
            "employee_contribution_rate",
            "employer_contribution_rate",
            "cost_to_net_ratio",
        ]
    ]

    print(sample.to_string(index=False))


if __name__ == "__main__":
    main()