from pathlib import Path
import json

import numpy as np
import pandas as pd

from japan_payroll_2026 import compute_japan_payroll_2026, PREFECTURE_DATA_2026


ROOT_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "japan"
    / "japan_parameters_2026.json"
)

OUTPUT_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "japan"
    / "japan_labour_cost_grid_2026.csv"
)


def load_parameters() -> dict:
    with PARAMETERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def round_money(value: float) -> float:
    return round(float(value) + 1e-12, 6)


def compute_row(prefecture_code: str, smic_multiple: float, parameters: dict) -> dict:
    wage_reference = parameters["wage_reference"]["gross_monthly_jpy"]
    prefecture = PREFECTURE_DATA_2026[prefecture_code]

    gross_monthly_jpy = wage_reference * smic_multiple

    result = compute_japan_payroll_2026(gross_monthly_jpy, prefecture_code)

    employee_contributions = result["employee_contributions_monthly_jpy"]
    employer_contributions = result["employer_contributions_monthly_jpy"]
    income_tax_monthly = result["income_tax_monthly_jpy"]

    net_before_income_tax = gross_monthly_jpy - employee_contributions
    net_after_income_tax = net_before_income_tax - income_tax_monthly

    employer_cost = gross_monthly_jpy + employer_contributions

    social_wedge = employer_cost - net_before_income_tax
    total_wedge_after_income_tax = employer_cost - net_after_income_tax

    si = result["social_insurance_breakdown"]

    return {
        "country": parameters["country"],
        "country_code": parameters["country_code"],
        "version": parameters["version"],
        "effective_from": parameters["effective_from"],

        "prefecture_code": prefecture_code,
        "prefecture_name_fr": prefecture["name_fr"],
        "prefecture_name_en": prefecture["name_en"],

        "smic_multiple": smic_multiple,
        "gross_monthly_jpy": round_money(gross_monthly_jpy),

        "health_employer_monthly_jpy": round_money(si["health_employer_monthly"]),
        "health_employee_monthly_jpy": round_money(si["health_employee_monthly"]),
        "child_support_money_employer_monthly_jpy": round_money(si["child_support_money_employer_monthly"]),
        "child_support_money_employee_monthly_jpy": round_money(si["child_support_money_employee_monthly"]),
        "pension_employer_monthly_jpy": round_money(si["pension_employer_monthly"]),
        "pension_employee_monthly_jpy": round_money(si["pension_employee_monthly"]),
        "child_childcare_contribution_monthly_jpy": round_money(si["child_childcare_contribution_monthly"]),
        "employment_insurance_employer_monthly_jpy": round_money(si["employment_insurance_employer_monthly"]),
        "employment_insurance_employee_monthly_jpy": round_money(si["employment_insurance_employee_monthly"]),
        "workers_accident_insurance_monthly_jpy": round_money(si["workers_accident_insurance_monthly"]),

        "iit_annual_jpy": round_money(result["iit_annual_jpy"]),
        "resident_tax_annual_jpy": round_money(result["resident_tax_annual_jpy"]),

        "employee_contributions_monthly_jpy": round_money(employee_contributions),
        "employer_contributions_monthly_jpy": round_money(employer_contributions),

        "employee_contribution_rate": (
            employee_contributions / gross_monthly_jpy
            if gross_monthly_jpy > 0
            else np.nan
        ),

        "employer_contribution_rate": (
            employer_contributions / gross_monthly_jpy
            if gross_monthly_jpy > 0
            else np.nan
        ),

        "net_before_income_tax_monthly_jpy": round_money(net_before_income_tax),

        "income_tax_monthly_jpy": round_money(income_tax_monthly),

        "net_after_income_tax_monthly_jpy": round_money(net_after_income_tax),

        "employer_cost_monthly_jpy": round_money(employer_cost),

        "social_wedge_monthly_jpy": round_money(social_wedge),

        "total_wedge_after_income_tax_monthly_jpy": round_money(
            total_wedge_after_income_tax
        ),

        "cost_to_net_ratio": (
            employer_cost / net_before_income_tax
            if net_before_income_tax > 0
            else np.nan
        ),

        "cost_to_net_after_income_tax_ratio": (
            employer_cost / net_after_income_tax
            if net_after_income_tax > 0
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

    for prefecture_code in PREFECTURE_DATA_2026:
        for smic_multiple in wage_grid:
            rows.append(
                compute_row(
                    prefecture_code=prefecture_code,
                    smic_multiple=float(smic_multiple),
                    parameters=parameters
                )
            )

    dataset = pd.DataFrame(rows)

    return dataset


def add_marginal_indicators(dataset: pd.DataFrame) -> pd.DataFrame:
    dataset = dataset.sort_values(
        [
            "prefecture_code",
            "smic_multiple"
        ]
    ).copy()

    dataset["delta_gross_monthly_jpy"] = dataset.groupby(
        "prefecture_code"
    )["gross_monthly_jpy"].diff()

    dataset["delta_net_before_income_tax_monthly_jpy"] = dataset.groupby(
        "prefecture_code"
    )["net_before_income_tax_monthly_jpy"].diff()

    dataset["delta_net_after_income_tax_monthly_jpy"] = dataset.groupby(
        "prefecture_code"
    )["net_after_income_tax_monthly_jpy"].diff()

    dataset["delta_employer_cost_monthly_jpy"] = dataset.groupby(
        "prefecture_code"
    )["employer_cost_monthly_jpy"].diff()

    dataset["delta_social_wedge_monthly_jpy"] = dataset.groupby(
        "prefecture_code"
    )["social_wedge_monthly_jpy"].diff()

    dataset["delta_total_wedge_after_income_tax_monthly_jpy"] = dataset.groupby(
        "prefecture_code"
    )["total_wedge_after_income_tax_monthly_jpy"].diff()

    dataset["marginal_net_before_income_tax_rate"] = (
        dataset["delta_net_before_income_tax_monthly_jpy"]
        / dataset["delta_gross_monthly_jpy"]
    )

    dataset["marginal_net_after_income_tax_rate"] = (
        dataset["delta_net_after_income_tax_monthly_jpy"]
        / dataset["delta_gross_monthly_jpy"]
    )

    dataset["marginal_employer_cost_rate"] = (
        dataset["delta_employer_cost_monthly_jpy"]
        / dataset["delta_gross_monthly_jpy"]
    )

    dataset["marginal_social_wedge_rate"] = (
        dataset["delta_social_wedge_monthly_jpy"]
        / dataset["delta_gross_monthly_jpy"]
    )

    dataset["marginal_total_wedge_after_income_tax_rate"] = (
        dataset["delta_total_wedge_after_income_tax_monthly_jpy"]
        / dataset["delta_gross_monthly_jpy"]
    )

    return dataset


def run_quality_checks(dataset: pd.DataFrame) -> dict:
    net_identity_error = (
        dataset["gross_monthly_jpy"]
        - dataset["employee_contributions_monthly_jpy"]
        - dataset["net_before_income_tax_monthly_jpy"]
    ).abs().max()

    tax_identity_error = (
        dataset["net_before_income_tax_monthly_jpy"]
        - dataset["income_tax_monthly_jpy"]
        - dataset["net_after_income_tax_monthly_jpy"]
    ).abs().max()

    employer_cost_identity_error = (
        dataset["gross_monthly_jpy"]
        + dataset["employer_contributions_monthly_jpy"]
        - dataset["employer_cost_monthly_jpy"]
    ).abs().max()

    social_wedge_identity_error = (
        dataset["employer_cost_monthly_jpy"]
        - dataset["net_before_income_tax_monthly_jpy"]
        - dataset["social_wedge_monthly_jpy"]
    ).abs().max()

    total_wedge_after_tax_identity_error = (
        dataset["employer_cost_monthly_jpy"]
        - dataset["net_after_income_tax_monthly_jpy"]
        - dataset["total_wedge_after_income_tax_monthly_jpy"]
    ).abs().max()

    employer_contrib_breakdown_error = (
        dataset["health_employer_monthly_jpy"]
        + dataset["child_support_money_employer_monthly_jpy"]
        + dataset["pension_employer_monthly_jpy"]
        + dataset["child_childcare_contribution_monthly_jpy"]
        + dataset["employment_insurance_employer_monthly_jpy"]
        + dataset["workers_accident_insurance_monthly_jpy"]
        - dataset["employer_contributions_monthly_jpy"]
    ).abs().max()

    employee_contrib_breakdown_error = (
        dataset["health_employee_monthly_jpy"]
        + dataset["child_support_money_employee_monthly_jpy"]
        + dataset["pension_employee_monthly_jpy"]
        + dataset["employment_insurance_employee_monthly_jpy"]
        - dataset["employee_contributions_monthly_jpy"]
    ).abs().max()

    income_tax_breakdown_error = (
        dataset["iit_annual_jpy"] / 12.0
        + dataset["resident_tax_annual_jpy"] / 12.0
        - dataset["income_tax_monthly_jpy"]
    ).abs().max()

    return {
        "rows": len(dataset),
        "prefectures": dataset["prefecture_code"].nunique(),
        "max_net_identity_error": net_identity_error,
        "max_tax_identity_error": tax_identity_error,
        "max_employer_cost_identity_error": employer_cost_identity_error,
        "max_social_wedge_identity_error": social_wedge_identity_error,
        "max_total_wedge_after_tax_identity_error": total_wedge_after_tax_identity_error,
        "max_employer_contrib_breakdown_error": employer_contrib_breakdown_error,
        "max_employee_contrib_breakdown_error": employee_contrib_breakdown_error,
        "max_income_tax_breakdown_error": income_tax_breakdown_error,
    }


def main() -> None:
    parameters = load_parameters()

    dataset = build_dataset(parameters)
    dataset = add_marginal_indicators(dataset)

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

    print("Japan dataset created.")
    print(f"Output: {OUTPUT_PATH}")
    print()
    print("Quality checks")
    print(f"Prefectures: {checks['prefectures']}")
    print(f"Rows: {checks['rows']}")

    for key in [
        "max_net_identity_error",
        "max_tax_identity_error",
        "max_employer_cost_identity_error",
        "max_social_wedge_identity_error",
        "max_total_wedge_after_tax_identity_error",
        "max_employer_contrib_breakdown_error",
        "max_employee_contrib_breakdown_error",
        "max_income_tax_breakdown_error",
    ]:
        print(f"{key}: {checks[key]:.10f}")

    print()
    print("Sample (Tokyo, Osaka, Okinawa)")
    print(
        dataset[
            [
                "prefecture_code",
                "smic_multiple",
                "gross_monthly_jpy",
                "net_after_income_tax_monthly_jpy",
                "employer_cost_monthly_jpy",
                "cost_to_net_after_income_tax_ratio"
            ]
        ]
        .query("prefecture_code in ['tokyo', 'osaka', 'okinawa'] and smic_multiple in [1.0, 3.0, 6.0]")
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()
