from pathlib import Path
import json

import numpy as np
import pandas as pd

from canada_payroll_2026 import compute_canada_payroll_2026, PROVINCE_DATA_2026


ROOT_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "canada"
    / "canada_parameters_2026.json"
)

OUTPUT_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "canada"
    / "canada_labour_cost_grid_2026.csv"
)


def load_parameters() -> dict:
    with PARAMETERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def round_money(value: float) -> float:
    return round(float(value) + 1e-12, 6)


def compute_row(province_code: str, smic_multiple: float, parameters: dict) -> dict:
    wage_reference = parameters["wage_reference"]["gross_monthly_cad"]
    province = PROVINCE_DATA_2026[province_code]

    gross_monthly_cad = wage_reference * smic_multiple

    result = compute_canada_payroll_2026(gross_monthly_cad, province_code)

    employee_contributions = result["employee_contributions_monthly_cad"]
    employer_contributions = result["employer_contributions_monthly_cad"]
    income_tax_monthly = result["income_tax_monthly_cad"]

    net_before_income_tax = gross_monthly_cad - employee_contributions
    net_after_income_tax = net_before_income_tax - income_tax_monthly

    employer_cost = gross_monthly_cad + employer_contributions

    social_wedge = employer_cost - net_before_income_tax
    total_wedge_after_income_tax = employer_cost - net_after_income_tax

    return {
        "country": parameters["country"],
        "country_code": parameters["country_code"],
        "version": parameters["version"],
        "effective_from": parameters["effective_from"],

        "province_code": province_code,
        "province_name_fr": province["name_fr"],
        "province_name_en": province["name_en"],
        "is_quebec": province["is_quebec"],

        "smic_multiple": smic_multiple,
        "gross_monthly_cad": round_money(gross_monthly_cad),

        "cpp_qpp_employer_monthly_cad": round_money(result["cpp_qpp_employer_monthly_cad"]),
        "cpp_qpp_employee_monthly_cad": round_money(result["cpp_qpp_employee_monthly_cad"]),
        "ei_employer_monthly_cad": round_money(result["ei_employer_monthly_cad"]),
        "ei_employee_monthly_cad": round_money(result["ei_employee_monthly_cad"]),
        "qpip_employer_monthly_cad": round_money(result["qpip_employer_monthly_cad"]),
        "qpip_employee_monthly_cad": round_money(result["qpip_employee_monthly_cad"]),
        "ontario_eht_monthly_cad": round_money(result["ontario_eht_monthly_cad"]),
        "quebec_fss_monthly_cad": round_money(result["quebec_fss_monthly_cad"]),
        "workers_comp_monthly_cad": round_money(result["workers_comp_monthly_cad"]),

        "federal_tax_annual_cad": round_money(result["federal_tax_annual_cad"]),
        "provincial_tax_annual_cad": round_money(result["provincial_tax_annual_cad"]),

        "employee_contributions_monthly_cad": round_money(employee_contributions),
        "employer_contributions_monthly_cad": round_money(employer_contributions),

        "employee_contribution_rate": (
            employee_contributions / gross_monthly_cad
            if gross_monthly_cad > 0
            else np.nan
        ),

        "employer_contribution_rate": (
            employer_contributions / gross_monthly_cad
            if gross_monthly_cad > 0
            else np.nan
        ),

        "net_before_income_tax_monthly_cad": round_money(net_before_income_tax),

        "income_tax_monthly_cad": round_money(income_tax_monthly),

        "net_after_income_tax_monthly_cad": round_money(net_after_income_tax),

        "employer_cost_monthly_cad": round_money(employer_cost),

        "social_wedge_monthly_cad": round_money(social_wedge),

        "total_wedge_after_income_tax_monthly_cad": round_money(
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

    dataset["delta_gross_monthly_cad"] = dataset.groupby(
        "province_code"
    )["gross_monthly_cad"].diff()

    dataset["delta_net_before_income_tax_monthly_cad"] = dataset.groupby(
        "province_code"
    )["net_before_income_tax_monthly_cad"].diff()

    dataset["delta_net_after_income_tax_monthly_cad"] = dataset.groupby(
        "province_code"
    )["net_after_income_tax_monthly_cad"].diff()

    dataset["delta_employer_cost_monthly_cad"] = dataset.groupby(
        "province_code"
    )["employer_cost_monthly_cad"].diff()

    dataset["delta_social_wedge_monthly_cad"] = dataset.groupby(
        "province_code"
    )["social_wedge_monthly_cad"].diff()

    dataset["delta_total_wedge_after_income_tax_monthly_cad"] = dataset.groupby(
        "province_code"
    )["total_wedge_after_income_tax_monthly_cad"].diff()

    dataset["marginal_net_before_income_tax_rate"] = (
        dataset["delta_net_before_income_tax_monthly_cad"]
        / dataset["delta_gross_monthly_cad"]
    )

    dataset["marginal_net_after_income_tax_rate"] = (
        dataset["delta_net_after_income_tax_monthly_cad"]
        / dataset["delta_gross_monthly_cad"]
    )

    dataset["marginal_employer_cost_rate"] = (
        dataset["delta_employer_cost_monthly_cad"]
        / dataset["delta_gross_monthly_cad"]
    )

    dataset["marginal_social_wedge_rate"] = (
        dataset["delta_social_wedge_monthly_cad"]
        / dataset["delta_gross_monthly_cad"]
    )

    dataset["marginal_total_wedge_after_income_tax_rate"] = (
        dataset["delta_total_wedge_after_income_tax_monthly_cad"]
        / dataset["delta_gross_monthly_cad"]
    )

    return dataset


def run_quality_checks(dataset: pd.DataFrame) -> dict:
    net_identity_error = (
        dataset["gross_monthly_cad"]
        - dataset["employee_contributions_monthly_cad"]
        - dataset["net_before_income_tax_monthly_cad"]
    ).abs().max()

    tax_identity_error = (
        dataset["net_before_income_tax_monthly_cad"]
        - dataset["income_tax_monthly_cad"]
        - dataset["net_after_income_tax_monthly_cad"]
    ).abs().max()

    employer_cost_identity_error = (
        dataset["gross_monthly_cad"]
        + dataset["employer_contributions_monthly_cad"]
        - dataset["employer_cost_monthly_cad"]
    ).abs().max()

    social_wedge_identity_error = (
        dataset["employer_cost_monthly_cad"]
        - dataset["net_before_income_tax_monthly_cad"]
        - dataset["social_wedge_monthly_cad"]
    ).abs().max()

    total_wedge_after_tax_identity_error = (
        dataset["employer_cost_monthly_cad"]
        - dataset["net_after_income_tax_monthly_cad"]
        - dataset["total_wedge_after_income_tax_monthly_cad"]
    ).abs().max()

    employer_contrib_breakdown_error = (
        dataset["cpp_qpp_employer_monthly_cad"]
        + dataset["ei_employer_monthly_cad"]
        + dataset["qpip_employer_monthly_cad"]
        + dataset["ontario_eht_monthly_cad"]
        + dataset["quebec_fss_monthly_cad"]
        + dataset["workers_comp_monthly_cad"]
        - dataset["employer_contributions_monthly_cad"]
    ).abs().max()

    employee_contrib_breakdown_error = (
        dataset["cpp_qpp_employee_monthly_cad"]
        + dataset["ei_employee_monthly_cad"]
        + dataset["qpip_employee_monthly_cad"]
        - dataset["employee_contributions_monthly_cad"]
    ).abs().max()

    income_tax_breakdown_error = (
        dataset["federal_tax_annual_cad"] / 12.0
        + dataset["provincial_tax_annual_cad"] / 12.0
        - dataset["income_tax_monthly_cad"]
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

    print("Canada dataset created.")
    print(f"Output: {OUTPUT_PATH}")
    print()
    print("Quality checks")
    print(f"Provinces/territories: {checks['provinces']}")
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
    print("Sample (Ontario, Quebec, Alberta)")
    print(
        dataset[
            [
                "province_code",
                "smic_multiple",
                "gross_monthly_cad",
                "net_after_income_tax_monthly_cad",
                "employer_cost_monthly_cad",
                "cost_to_net_after_income_tax_ratio"
            ]
        ]
        .query("province_code in ['ON', 'QC', 'AB'] and smic_multiple in [1.0, 3.0, 6.0]")
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()
