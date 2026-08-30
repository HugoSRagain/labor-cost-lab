from pathlib import Path
import json

import numpy as np
import pandas as pd

from china_payroll_2026 import compute_china_payroll_2026, PROVINCE_DATA_2026


ROOT_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "china"
    / "china_parameters_2026.json"
)

OUTPUT_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "china"
    / "china_labour_cost_grid_2026.csv"
)


def load_parameters() -> dict:
    with PARAMETERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def round_money(value: float) -> float:
    return round(float(value) + 1e-12, 6)


def compute_row(province_code: str, smic_multiple: float, parameters: dict) -> dict:
    wage_reference = parameters["wage_reference"]["gross_monthly_rmb"]
    province = PROVINCE_DATA_2026[province_code]

    gross_monthly_rmb = wage_reference * smic_multiple

    result = compute_china_payroll_2026(gross_monthly_rmb, province_code)

    employee_contributions = result["employee_contributions_monthly_rmb"]
    employer_contributions = result["employer_contributions_monthly_rmb"]
    income_tax_monthly = result["iit_monthly_rmb"]

    net_before_income_tax = gross_monthly_rmb - employee_contributions
    net_after_income_tax = net_before_income_tax - income_tax_monthly

    employer_cost = gross_monthly_rmb + employer_contributions

    social_wedge = employer_cost - net_before_income_tax
    total_wedge_after_income_tax = employer_cost - net_after_income_tax

    si = result["social_insurance_breakdown"]

    return {
        "country": parameters["country"],
        "country_code": parameters["country_code"],
        "version": parameters["version"],
        "effective_from": parameters["effective_from"],

        "province_code": province_code,
        "province_name_fr": province["name_fr"],
        "province_name_en": province["name_en"],

        "smic_multiple": smic_multiple,
        "gross_monthly_rmb": round_money(gross_monthly_rmb),

        "pension_employer_monthly_rmb": round_money(si["pension_employer_monthly"]),
        "pension_employee_monthly_rmb": round_money(si["pension_employee_monthly"]),
        "medical_employer_monthly_rmb": round_money(si["medical_employer_monthly"]),
        "medical_employee_monthly_rmb": round_money(si["medical_employee_monthly"]),
        "unemployment_employer_monthly_rmb": round_money(si["unemployment_employer_monthly"]),
        "unemployment_employee_monthly_rmb": round_money(si["unemployment_employee_monthly"]),
        "work_injury_employer_monthly_rmb": round_money(si["work_injury_employer_monthly"]),
        "hpf_employer_monthly_rmb": round_money(si["hpf_employer_monthly"]),
        "hpf_employee_monthly_rmb": round_money(si["hpf_employee_monthly"]),

        "employee_contributions_monthly_rmb": round_money(employee_contributions),
        "employer_contributions_monthly_rmb": round_money(employer_contributions),

        "employee_contribution_rate": (
            employee_contributions / gross_monthly_rmb
            if gross_monthly_rmb > 0
            else np.nan
        ),

        "employer_contribution_rate": (
            employer_contributions / gross_monthly_rmb
            if gross_monthly_rmb > 0
            else np.nan
        ),

        "net_before_income_tax_monthly_rmb": round_money(net_before_income_tax),

        "income_tax_monthly_rmb": round_money(income_tax_monthly),

        "net_after_income_tax_monthly_rmb": round_money(net_after_income_tax),

        "employer_cost_monthly_rmb": round_money(employer_cost),

        "social_wedge_monthly_rmb": round_money(social_wedge),

        "total_wedge_after_income_tax_monthly_rmb": round_money(
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

    for province_code in PROVINCE_DATA_2026:
        for smic_multiple in wage_grid:
            rows.append(
                compute_row(
                    province_code=province_code,
                    smic_multiple=float(smic_multiple),
                    parameters=parameters
                )
            )

    dataset = pd.DataFrame(rows)

    return dataset


def add_marginal_indicators(dataset: pd.DataFrame) -> pd.DataFrame:
    dataset = dataset.sort_values(
        [
            "province_code",
            "smic_multiple"
        ]
    ).copy()

    dataset["delta_gross_monthly_rmb"] = dataset.groupby(
        "province_code"
    )["gross_monthly_rmb"].diff()

    dataset["delta_net_before_income_tax_monthly_rmb"] = dataset.groupby(
        "province_code"
    )["net_before_income_tax_monthly_rmb"].diff()

    dataset["delta_net_after_income_tax_monthly_rmb"] = dataset.groupby(
        "province_code"
    )["net_after_income_tax_monthly_rmb"].diff()

    dataset["delta_employer_cost_monthly_rmb"] = dataset.groupby(
        "province_code"
    )["employer_cost_monthly_rmb"].diff()

    dataset["delta_social_wedge_monthly_rmb"] = dataset.groupby(
        "province_code"
    )["social_wedge_monthly_rmb"].diff()

    dataset["delta_total_wedge_after_income_tax_monthly_rmb"] = dataset.groupby(
        "province_code"
    )["total_wedge_after_income_tax_monthly_rmb"].diff()

    dataset["marginal_net_before_income_tax_rate"] = (
        dataset["delta_net_before_income_tax_monthly_rmb"]
        / dataset["delta_gross_monthly_rmb"]
    )

    dataset["marginal_net_after_income_tax_rate"] = (
        dataset["delta_net_after_income_tax_monthly_rmb"]
        / dataset["delta_gross_monthly_rmb"]
    )

    dataset["marginal_employer_cost_rate"] = (
        dataset["delta_employer_cost_monthly_rmb"]
        / dataset["delta_gross_monthly_rmb"]
    )

    dataset["marginal_social_wedge_rate"] = (
        dataset["delta_social_wedge_monthly_rmb"]
        / dataset["delta_gross_monthly_rmb"]
    )

    dataset["marginal_total_wedge_after_income_tax_rate"] = (
        dataset["delta_total_wedge_after_income_tax_monthly_rmb"]
        / dataset["delta_gross_monthly_rmb"]
    )

    return dataset


def run_quality_checks(dataset: pd.DataFrame) -> dict:
    net_identity_error = (
        dataset["gross_monthly_rmb"]
        - dataset["employee_contributions_monthly_rmb"]
        - dataset["net_before_income_tax_monthly_rmb"]
    ).abs().max()

    tax_identity_error = (
        dataset["net_before_income_tax_monthly_rmb"]
        - dataset["income_tax_monthly_rmb"]
        - dataset["net_after_income_tax_monthly_rmb"]
    ).abs().max()

    employer_cost_identity_error = (
        dataset["gross_monthly_rmb"]
        + dataset["employer_contributions_monthly_rmb"]
        - dataset["employer_cost_monthly_rmb"]
    ).abs().max()

    social_wedge_identity_error = (
        dataset["employer_cost_monthly_rmb"]
        - dataset["net_before_income_tax_monthly_rmb"]
        - dataset["social_wedge_monthly_rmb"]
    ).abs().max()

    total_wedge_after_tax_identity_error = (
        dataset["employer_cost_monthly_rmb"]
        - dataset["net_after_income_tax_monthly_rmb"]
        - dataset["total_wedge_after_income_tax_monthly_rmb"]
    ).abs().max()

    employer_contrib_breakdown_error = (
        dataset["pension_employer_monthly_rmb"]
        + dataset["medical_employer_monthly_rmb"]
        + dataset["unemployment_employer_monthly_rmb"]
        + dataset["work_injury_employer_monthly_rmb"]
        + dataset["hpf_employer_monthly_rmb"]
        - dataset["employer_contributions_monthly_rmb"]
    ).abs().max()

    employee_contrib_breakdown_error = (
        dataset["pension_employee_monthly_rmb"]
        + dataset["medical_employee_monthly_rmb"]
        + dataset["unemployment_employee_monthly_rmb"]
        + dataset["hpf_employee_monthly_rmb"]
        - dataset["employee_contributions_monthly_rmb"]
    ).abs().max()

    return {
        "rows": len(dataset),
        "provinces": dataset["province_code"].nunique(),
        "max_net_identity_error": net_identity_error,
        "max_tax_identity_error": tax_identity_error,
        "max_employer_cost_identity_error": employer_cost_identity_error,
        "max_social_wedge_identity_error": social_wedge_identity_error,
        "max_total_wedge_after_tax_identity_error": total_wedge_after_tax_identity_error,
        "max_employer_contrib_breakdown_error": employer_contrib_breakdown_error,
        "max_employee_contrib_breakdown_error": employee_contrib_breakdown_error,
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

    print("China dataset created.")
    print(f"Output: {OUTPUT_PATH}")
    print()
    print("Quality checks")
    print(f"Provinces: {checks['provinces']}")
    print(f"Rows: {checks['rows']}")

    for key in [
        "max_net_identity_error",
        "max_tax_identity_error",
        "max_employer_cost_identity_error",
        "max_social_wedge_identity_error",
        "max_total_wedge_after_tax_identity_error",
        "max_employer_contrib_breakdown_error",
        "max_employee_contrib_breakdown_error",
    ]:
        print(f"{key}: {checks[key]:.10f}")

    print()
    print("Sample (Shanghai, Beijing, Guangdong)")
    print(
        dataset[
            [
                "province_code",
                "smic_multiple",
                "gross_monthly_rmb",
                "net_after_income_tax_monthly_rmb",
                "employer_cost_monthly_rmb",
                "cost_to_net_after_income_tax_ratio"
            ]
        ]
        .query("province_code in ['SH', 'BJ', 'GD'] and smic_multiple in [1.0, 3.0, 6.0]")
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()
