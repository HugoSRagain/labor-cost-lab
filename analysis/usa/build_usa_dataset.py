from pathlib import Path
import json

import numpy as np
import pandas as pd

from us_payroll_2026 import compute_us_payroll_2026, STATE_DATA_2026, FEDERAL_2026


ROOT_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "usa"
    / "usa_parameters_2026.json"
)

OUTPUT_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "usa"
    / "usa_labour_cost_grid_2026.csv"
)


def load_parameters() -> dict:
    with PARAMETERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def round_money(value: float) -> float:
    return round(float(value) + 1e-12, 6)


def compute_row(state_code: str, smic_multiple: float, parameters: dict) -> dict:
    wage_reference = parameters["wage_reference"]["gross_monthly_usd"]
    state = STATE_DATA_2026[state_code]

    gross_monthly_usd = wage_reference * smic_multiple

    result = compute_us_payroll_2026(gross_monthly_usd, state_code)

    employee_contributions = result["employee_contributions_monthly_usd"]
    employer_contributions = result["employer_contributions_monthly_usd"]
    income_tax_monthly = result["income_tax_monthly_usd"]

    net_before_income_tax = gross_monthly_usd - employee_contributions
    net_after_income_tax = net_before_income_tax - income_tax_monthly

    employer_cost = gross_monthly_usd + employer_contributions

    social_wedge = employer_cost - net_before_income_tax
    total_wedge_after_income_tax = employer_cost - net_after_income_tax

    federal = result["federal"]
    state_result = result["state"]

    return {
        "country": parameters["country"],
        "country_code": parameters["country_code"],
        "version": parameters["version"],
        "effective_from": parameters["effective_from"],

        "state_code": state_code,
        "state_name_fr": state["name_fr"],
        "state_name_en": state["name_en"],
        "has_state_income_tax": state["has_income_tax"],

        "smic_multiple": smic_multiple,
        "gross_monthly_usd": round_money(gross_monthly_usd),

        "federal_income_tax_monthly_usd": round_money(federal["federal_income_tax_annual"] / 12.0),
        "state_income_tax_monthly_usd": round_money(state_result["state_income_tax_annual"] / 12.0),
        "social_security_employee_monthly_usd": round_money(federal["social_security_employee_annual"] / 12.0),
        "social_security_employer_monthly_usd": round_money(federal["social_security_employer_annual"] / 12.0),
        "medicare_employee_monthly_usd": round_money(federal["medicare_employee_annual"] / 12.0),
        "medicare_employer_monthly_usd": round_money(federal["medicare_employer_annual"] / 12.0),
        "additional_medicare_employee_monthly_usd": round_money(federal["additional_medicare_employee_annual"] / 12.0),
        "futa_employer_monthly_usd": round_money(federal["futa_employer_annual"] / 12.0),
        "sui_employer_monthly_usd": round_money(state_result["sui_employer_annual"] / 12.0),
        "employee_ui_monthly_usd": round_money(state_result["employee_ui_annual"] / 12.0),
        "state_extra_employee_monthly_usd": round_money(state_result["extra_employee_annual"] / 12.0),
        "state_extra_employer_monthly_usd": round_money(state_result["extra_employer_annual"] / 12.0),

        "employee_contributions_monthly_usd": round_money(employee_contributions),
        "employer_contributions_monthly_usd": round_money(employer_contributions),

        "employee_contribution_rate": (
            employee_contributions / gross_monthly_usd
            if gross_monthly_usd > 0
            else np.nan
        ),

        "employer_contribution_rate": (
            employer_contributions / gross_monthly_usd
            if gross_monthly_usd > 0
            else np.nan
        ),

        "net_before_income_tax_monthly_usd": round_money(net_before_income_tax),

        "income_tax_monthly_usd": round_money(income_tax_monthly),

        "net_after_income_tax_monthly_usd": round_money(net_after_income_tax),

        "employer_cost_monthly_usd": round_money(employer_cost),

        "social_wedge_monthly_usd": round_money(social_wedge),

        "total_wedge_after_income_tax_monthly_usd": round_money(
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

    for state_code in STATE_DATA_2026:
        for smic_multiple in wage_grid:
            rows.append(
                compute_row(
                    state_code=state_code,
                    smic_multiple=float(smic_multiple),
                    parameters=parameters
                )
            )

    dataset = pd.DataFrame(rows)

    return dataset


def add_marginal_indicators(dataset: pd.DataFrame) -> pd.DataFrame:
    dataset = dataset.sort_values(
        [
            "state_code",
            "smic_multiple"
        ]
    ).copy()

    dataset["delta_gross_monthly_usd"] = dataset.groupby(
        "state_code"
    )["gross_monthly_usd"].diff()

    dataset["delta_net_before_income_tax_monthly_usd"] = dataset.groupby(
        "state_code"
    )["net_before_income_tax_monthly_usd"].diff()

    dataset["delta_net_after_income_tax_monthly_usd"] = dataset.groupby(
        "state_code"
    )["net_after_income_tax_monthly_usd"].diff()

    dataset["delta_employer_cost_monthly_usd"] = dataset.groupby(
        "state_code"
    )["employer_cost_monthly_usd"].diff()

    dataset["delta_social_wedge_monthly_usd"] = dataset.groupby(
        "state_code"
    )["social_wedge_monthly_usd"].diff()

    dataset["delta_total_wedge_after_income_tax_monthly_usd"] = dataset.groupby(
        "state_code"
    )["total_wedge_after_income_tax_monthly_usd"].diff()

    dataset["marginal_net_before_income_tax_rate"] = (
        dataset["delta_net_before_income_tax_monthly_usd"]
        / dataset["delta_gross_monthly_usd"]
    )

    dataset["marginal_net_after_income_tax_rate"] = (
        dataset["delta_net_after_income_tax_monthly_usd"]
        / dataset["delta_gross_monthly_usd"]
    )

    dataset["marginal_employer_cost_rate"] = (
        dataset["delta_employer_cost_monthly_usd"]
        / dataset["delta_gross_monthly_usd"]
    )

    dataset["marginal_social_wedge_rate"] = (
        dataset["delta_social_wedge_monthly_usd"]
        / dataset["delta_gross_monthly_usd"]
    )

    dataset["marginal_total_wedge_after_income_tax_rate"] = (
        dataset["delta_total_wedge_after_income_tax_monthly_usd"]
        / dataset["delta_gross_monthly_usd"]
    )

    return dataset


def run_quality_checks(dataset: pd.DataFrame) -> dict:
    net_identity_error = (
        dataset["gross_monthly_usd"]
        - dataset["employee_contributions_monthly_usd"]
        - dataset["net_before_income_tax_monthly_usd"]
    ).abs().max()

    tax_identity_error = (
        dataset["net_before_income_tax_monthly_usd"]
        - dataset["income_tax_monthly_usd"]
        - dataset["net_after_income_tax_monthly_usd"]
    ).abs().max()

    employer_cost_identity_error = (
        dataset["gross_monthly_usd"]
        + dataset["employer_contributions_monthly_usd"]
        - dataset["employer_cost_monthly_usd"]
    ).abs().max()

    social_wedge_identity_error = (
        dataset["employer_cost_monthly_usd"]
        - dataset["net_before_income_tax_monthly_usd"]
        - dataset["social_wedge_monthly_usd"]
    ).abs().max()

    total_wedge_after_tax_identity_error = (
        dataset["employer_cost_monthly_usd"]
        - dataset["net_after_income_tax_monthly_usd"]
        - dataset["total_wedge_after_income_tax_monthly_usd"]
    ).abs().max()

    employer_contrib_breakdown_error = (
        dataset["social_security_employer_monthly_usd"]
        + dataset["medicare_employer_monthly_usd"]
        + dataset["futa_employer_monthly_usd"]
        + dataset["sui_employer_monthly_usd"]
        + dataset["state_extra_employer_monthly_usd"]
        - dataset["employer_contributions_monthly_usd"]
    ).abs().max()

    employee_contrib_breakdown_error = (
        dataset["social_security_employee_monthly_usd"]
        + dataset["medicare_employee_monthly_usd"]
        + dataset["additional_medicare_employee_monthly_usd"]
        + dataset["employee_ui_monthly_usd"]
        + dataset["state_extra_employee_monthly_usd"]
        - dataset["employee_contributions_monthly_usd"]
    ).abs().max()

    income_tax_breakdown_error = (
        dataset["federal_income_tax_monthly_usd"]
        + dataset["state_income_tax_monthly_usd"]
        - dataset["income_tax_monthly_usd"]
    ).abs().max()

    return {
        "rows": len(dataset),
        "states": dataset["state_code"].nunique(),
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

    print("USA dataset created.")
    print(f"Output: {OUTPUT_PATH}")
    print()
    print("Quality checks")
    print(f"States: {checks['states']}")
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
    print("Sample (Texas, California, New York)")
    print(
        dataset[
            [
                "state_code",
                "smic_multiple",
                "gross_monthly_usd",
                "net_after_income_tax_monthly_usd",
                "employer_cost_monthly_usd",
                "cost_to_net_after_income_tax_ratio"
            ]
        ]
        .query("state_code in ['TX', 'CA', 'NY'] and smic_multiple in [1.0, 3.0, 6.0]")
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()
