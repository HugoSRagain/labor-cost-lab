"""
Swiss Labour Cost Lab
Dataset builder for 2026.

This script generates a canton-level Swiss labour cost grid.

Version 1:
- 26 cantons
- gross monthly wages from 3,000 to 20,000 CHF
- national social contributions
- standardized LPP/BVG
- standardized accident insurance
- official 2026 withholding-tax tariff A0
- canton-level net after withholding tax

The canton dimension is included so that the module can compare the same
gross wage across cantons after social contributions and withholding tax.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any, Dict, List

from swiss_social_contributions_2026 import (
    SwissSocialParameters,
    compute_swiss_social_contributions,
)

from swiss_withholding_tax_2026 import (
    compute_withholding_tax_monthly,
    get_withholding_tax_rate_percent,
    load_withholding_tax_brackets,
)


ROOT_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "switzerland"
    / "switzerland_parameters_2026.json"
)

OUTPUT_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "switzerland"
    / "switzerland_labour_cost_grid_2026.csv"
)


def load_parameters() -> Dict[str, Any]:
    """Load Switzerland module parameters."""
    with PARAMETERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def build_social_parameters(parameters: Dict[str, Any]) -> SwissSocialParameters:
    """Build SwissSocialParameters from the JSON parameter file."""
    social = parameters["social_contributions"]
    lpp = parameters["occupational_pension_lpp"]
    accident = parameters["accident_insurance"]

    default_age_band = lpp["default_age_band"]
    age_band = lpp["age_bands"][default_age_band]

    return SwissSocialParameters(
        ahv_iv_eo_employee_rate=social["ahv_iv_eo"]["employee_rate"],
        ahv_iv_eo_employer_rate=social["ahv_iv_eo"]["employer_rate"],

        unemployment_employee_rate=social["unemployment_insurance"]["employee_rate"],
        unemployment_employer_rate=social["unemployment_insurance"]["employer_rate"],
        unemployment_annual_ceiling_chf=social["unemployment_insurance"]["annual_salary_ceiling_chf"],

        lpp_entry_threshold_annual_chf=lpp["entry_threshold_annual_chf"],
        lpp_coordination_deduction_annual_chf=lpp["coordination_deduction_annual_chf"],
        lpp_maximum_insured_salary_annual_chf=lpp["maximum_insured_salary_annual_chf"],
        lpp_minimum_coordinated_salary_annual_chf=lpp["minimum_coordinated_salary_annual_chf"],

        lpp_total_savings_rate=age_band["total_savings_rate"],
        lpp_employee_share=age_band["employee_share"],
        lpp_employer_share=age_band["employer_share"],

        employee_non_occupational_accident_rate=accident["employee_non_occupational_accident_rate"],
        employer_occupational_accident_rate=accident["employer_occupational_accident_rate"],
        accident_annual_ceiling_chf=accident["annual_salary_ceiling_chf"],
    )


def generate_gross_wage_grid(parameters: Dict[str, Any]) -> List[float]:
    """Generate monthly gross wage grid."""
    wage_grid = parameters["wage_grid"]

    start = int(wage_grid["gross_monthly_min_chf"])
    stop = int(wage_grid["gross_monthly_max_chf"])
    step = int(wage_grid["gross_monthly_step_chf"])

    return [float(value) for value in range(start, stop + step, step)]


def build_dataset() -> List[Dict[str, Any]]:
    """Build the Swiss canton-level labour cost dataset."""
    parameters = load_parameters()
    social_params = build_social_parameters(parameters)
    withholding_tax_brackets = load_withholding_tax_brackets()

    cantons = parameters["cantons"]
    gross_wages = generate_gross_wage_grid(parameters)

    rows: List[Dict[str, Any]] = []

    for canton in cantons:
        for gross_monthly_chf in gross_wages:
            social = compute_swiss_social_contributions(
                gross_monthly_chf,
                social_params,
            )

            withholding_tax_monthly_chf = compute_withholding_tax_monthly(
                gross_monthly_chf,
                canton["code"],
                withholding_tax_brackets,
            )

            withholding_tax_rate_percent = get_withholding_tax_rate_percent(
                gross_monthly_chf,
                canton["code"],
                withholding_tax_brackets,
            )

            net_after_tax_monthly_chf = (
                social["net_before_tax_monthly_chf"]
                - withholding_tax_monthly_chf
            )

            total_wedge_after_tax_monthly_chf = (
                social["employer_cost_monthly_chf"]
                - net_after_tax_monthly_chf
            )

            cost_to_net_after_tax_ratio = (
                social["employer_cost_monthly_chf"]
                / net_after_tax_monthly_chf
                if net_after_tax_monthly_chf > 0
                else 0.0
            )

            row = {
                "country": parameters["country"],
                "country_code": parameters["country_code"],
                "module_version": parameters["version"],
                "currency": parameters["currency"],

                "canton_code": canton["code"],
                "canton_name_fr": canton["name_fr"],
                "canton_name_en": canton["name_en"],
                "reference_municipality": canton["reference_municipality"],

                "gross_monthly_chf": social["gross_monthly_chf"],
                "gross_annual_chf": social["gross_annual_chf"],

                "employee_ahv_iv_eo_monthly_chf": social["employee_ahv_iv_eo_monthly_chf"],
                "employee_unemployment_monthly_chf": social["employee_unemployment_monthly_chf"],
                "employee_lpp_monthly_chf": social["employee_lpp_monthly_chf"],
                "employee_accident_monthly_chf": social["employee_accident_monthly_chf"],
                "employee_total_contrib_monthly_chf": social["employee_total_contrib_monthly_chf"],

                "employer_ahv_iv_eo_monthly_chf": social["employer_ahv_iv_eo_monthly_chf"],
                "employer_unemployment_monthly_chf": social["employer_unemployment_monthly_chf"],
                "employer_lpp_monthly_chf": social["employer_lpp_monthly_chf"],
                "employer_accident_monthly_chf": social["employer_accident_monthly_chf"],
                "employer_total_contrib_monthly_chf": social["employer_total_contrib_monthly_chf"],

                "net_before_tax_monthly_chf": social["net_before_tax_monthly_chf"],
                "withholding_tax_monthly_chf": round(withholding_tax_monthly_chf, 2),
                "withholding_tax_rate_percent": round(
                    withholding_tax_rate_percent,
                    4,
                ),
                "net_after_tax_monthly_chf": round(net_after_tax_monthly_chf, 2),

                "employer_cost_monthly_chf": social["employer_cost_monthly_chf"],
                "social_wedge_monthly_chf": social["social_wedge_monthly_chf"],
                "total_wedge_after_tax_monthly_chf": round(
                    total_wedge_after_tax_monthly_chf,
                    2,
                ),

                "employee_contribution_rate": social["employee_contribution_rate"],
                "employer_contribution_rate": social["employer_contribution_rate"],
                "social_wedge_rate_employer_cost": social["social_wedge_rate_employer_cost"],
                "cost_to_net_before_tax_ratio": social["cost_to_net_before_tax_ratio"],
                "cost_to_net_after_tax_ratio": round(
                    cost_to_net_after_tax_ratio,
                    8,
                ),

                "withholding_tax_status": "official_2026_tariff_A0",
                "profile_id": (
                    "switzerland__"
                    + canton["code"].lower()
                    + "__single_no_child_standard_lpp"
                ),
            }

            rows.append(row)

    return rows


def write_csv(rows: List[Dict[str, Any]]) -> None:
    """Write rows to CSV."""
    if not rows:
        raise ValueError("No rows to write.")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = list(rows[0].keys())

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def run_quality_checks(rows: List[Dict[str, Any]]) -> None:
    """Run accounting identity checks."""
    max_net_identity_error = 0.0
    max_employer_cost_identity_error = 0.0
    max_social_wedge_identity_error = 0.0
    max_total_wedge_after_tax_identity_error = 0.0

    for row in rows:
        gross = float(row["gross_monthly_chf"])

        employee_total = float(row["employee_total_contrib_monthly_chf"])
        employer_total = float(row["employer_total_contrib_monthly_chf"])

        net_before_tax = float(row["net_before_tax_monthly_chf"])
        net_after_tax = float(row["net_after_tax_monthly_chf"])
        employer_cost = float(row["employer_cost_monthly_chf"])

        social_wedge = float(row["social_wedge_monthly_chf"])
        total_wedge_after_tax = float(
            row["total_wedge_after_tax_monthly_chf"]
        )

        max_net_identity_error = max(
            max_net_identity_error,
            abs(net_before_tax - (gross - employee_total)),
        )

        max_employer_cost_identity_error = max(
            max_employer_cost_identity_error,
            abs(employer_cost - (gross + employer_total)),
        )

        max_social_wedge_identity_error = max(
            max_social_wedge_identity_error,
            abs(social_wedge - (employer_cost - net_before_tax)),
        )

        max_total_wedge_after_tax_identity_error = max(
            max_total_wedge_after_tax_identity_error,
            abs(total_wedge_after_tax - (employer_cost - net_after_tax)),
        )

    cantons = sorted({row["canton_code"] for row in rows})
    gross_wages = sorted({row["gross_monthly_chf"] for row in rows})

    expected_rows = len(cantons) * len(gross_wages)

    print()
    print("Swiss dataset created.")
    print(f"Output: {OUTPUT_PATH}")
    print()
    print("Quality checks")
    print(f"Cantons: {len(cantons)}")
    print(f"Gross wage points: {len(gross_wages)}")
    print(f"Rows: {len(rows)}")
    print(f"Expected rows: {expected_rows}")
    print(f"Max net identity error: {max_net_identity_error:.10f}")
    print(f"Max employer cost identity error: {max_employer_cost_identity_error:.10f}")
    print(f"Max social wedge identity error: {max_social_wedge_identity_error:.10f}")
    print(
        "Max total wedge after tax identity error: "
        f"{max_total_wedge_after_tax_identity_error:.10f}"
    )

    print()
    print("Sample")
    print(
        "canton gross net_before_tax withholding_tax "
        "withholding_rate net_after_tax employer_cost cost_to_net_after_tax"
    )

    for target_canton in ["ZH", "GE", "VD"]:
        sample_rows = [
            row for row in rows
            if row["canton_code"] == target_canton
            and row["gross_monthly_chf"] in [3000.0, 5000.0, 8000.0, 12000.0]
        ]

        for row in sample_rows:
            print(
                row["canton_code"],
                row["gross_monthly_chf"],
                row["net_before_tax_monthly_chf"],
                row["withholding_tax_monthly_chf"],
                row["withholding_tax_rate_percent"],
                row["net_after_tax_monthly_chf"],
                row["employer_cost_monthly_chf"],
                row["cost_to_net_after_tax_ratio"],
            )


if __name__ == "__main__":
    dataset = build_dataset()
    write_csv(dataset)
    run_quality_checks(dataset)