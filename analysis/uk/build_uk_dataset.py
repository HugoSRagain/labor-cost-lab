from pathlib import Path
import json

import numpy as np
import pandas as pd

from paye_ni_2026 import compute_uk_paye_ni_pension_2026


ROOT_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "uk"
    / "uk_parameters_2026.json"
)

OUTPUT_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "uk"
    / "uk_labour_cost_grid_2026.csv"
)


def load_parameters() -> dict:
    with PARAMETERS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def round_money(value: float) -> float:
    return round(float(value) + 1e-12, 6)


def compute_row(
    profile: dict,
    smic_multiple: float,
    parameters: dict
) -> dict:
    wage_reference = parameters["wage_reference"]["gross_monthly_gbp"]

    gross_monthly_gbp = (
        wage_reference
        * smic_multiple
    )

    result = compute_uk_paye_ni_pension_2026(
        gross_monthly_gbp,
        region=profile.get("region", "ruk")
    )

    employee_ni = result["employee_ni_monthly_gbp"]
    employer_ni = result["employer_ni_monthly_gbp"]
    employee_pension = result["employee_pension_monthly_gbp"]
    employer_pension = result["employer_pension_monthly_gbp"]
    income_tax_monthly = result["income_tax_monthly_gbp"]

    employee_contributions = employee_ni + employee_pension
    employer_contributions = employer_ni + employer_pension

    net_before_income_tax = gross_monthly_gbp - employee_contributions
    net_after_income_tax = net_before_income_tax - income_tax_monthly

    employer_cost = gross_monthly_gbp + employer_contributions

    social_wedge = employer_cost - net_before_income_tax
    total_wedge_after_income_tax = employer_cost - net_after_income_tax

    return {
        "country": parameters["country"],
        "country_code": parameters["country_code"],
        "version": parameters["version"],
        "effective_from": parameters["effective_from"],

        "profile_id": profile["profile_id"],
        "profile_label_fr": profile["label_fr"],
        "profile_label_en": profile["label_en"],

        "smic_multiple": smic_multiple,
        "gross_monthly_gbp": round_money(gross_monthly_gbp),

        "employee_ni_monthly_gbp": round_money(employee_ni),
        "employer_ni_monthly_gbp": round_money(employer_ni),
        "employee_pension_monthly_gbp": round_money(employee_pension),
        "employer_pension_monthly_gbp": round_money(employer_pension),

        "employee_contributions_monthly_gbp": round_money(employee_contributions),
        "employer_contributions_monthly_gbp": round_money(employer_contributions),

        "employee_contribution_rate": (
            employee_contributions / gross_monthly_gbp
            if gross_monthly_gbp > 0
            else np.nan
        ),

        "employer_contribution_rate": (
            employer_contributions / gross_monthly_gbp
            if gross_monthly_gbp > 0
            else np.nan
        ),

        "net_before_income_tax_monthly_gbp": round_money(net_before_income_tax),

        "personal_allowance_annual_gbp": result["personal_allowance_gbp"],
        "annual_taxable_income_gbp": result["annual_taxable_income_gbp"],

        "income_tax_monthly_gbp": round_money(income_tax_monthly),

        "net_after_income_tax_monthly_gbp": round_money(net_after_income_tax),

        "employer_cost_monthly_gbp": round_money(employer_cost),

        "social_wedge_monthly_gbp": round_money(social_wedge),

        "total_wedge_after_income_tax_monthly_gbp": round_money(
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


def add_marginal_indicators(dataset: pd.DataFrame) -> pd.DataFrame:
    dataset = dataset.sort_values(
        [
            "profile_id",
            "smic_multiple"
        ]
    ).copy()

    dataset["delta_gross_monthly_gbp"] = dataset.groupby(
        "profile_id"
    )["gross_monthly_gbp"].diff()

    dataset["delta_net_before_income_tax_monthly_gbp"] = dataset.groupby(
        "profile_id"
    )["net_before_income_tax_monthly_gbp"].diff()

    dataset["delta_net_after_income_tax_monthly_gbp"] = dataset.groupby(
        "profile_id"
    )["net_after_income_tax_monthly_gbp"].diff()

    dataset["delta_employer_cost_monthly_gbp"] = dataset.groupby(
        "profile_id"
    )["employer_cost_monthly_gbp"].diff()

    dataset["delta_social_wedge_monthly_gbp"] = dataset.groupby(
        "profile_id"
    )["social_wedge_monthly_gbp"].diff()

    dataset["delta_total_wedge_after_income_tax_monthly_gbp"] = dataset.groupby(
        "profile_id"
    )["total_wedge_after_income_tax_monthly_gbp"].diff()

    dataset["marginal_net_before_income_tax_rate"] = (
        dataset["delta_net_before_income_tax_monthly_gbp"]
        / dataset["delta_gross_monthly_gbp"]
    )

    dataset["marginal_net_after_income_tax_rate"] = (
        dataset["delta_net_after_income_tax_monthly_gbp"]
        / dataset["delta_gross_monthly_gbp"]
    )

    dataset["marginal_employer_cost_rate"] = (
        dataset["delta_employer_cost_monthly_gbp"]
        / dataset["delta_gross_monthly_gbp"]
    )

    dataset["marginal_social_wedge_rate"] = (
        dataset["delta_social_wedge_monthly_gbp"]
        / dataset["delta_gross_monthly_gbp"]
    )

    dataset["marginal_total_wedge_after_income_tax_rate"] = (
        dataset["delta_total_wedge_after_income_tax_monthly_gbp"]
        / dataset["delta_gross_monthly_gbp"]
    )

    return dataset


def run_quality_checks(dataset: pd.DataFrame) -> dict:
    net_identity_error = (
        dataset["gross_monthly_gbp"]
        - dataset["employee_contributions_monthly_gbp"]
        - dataset["net_before_income_tax_monthly_gbp"]
    ).abs().max()

    tax_identity_error = (
        dataset["net_before_income_tax_monthly_gbp"]
        - dataset["income_tax_monthly_gbp"]
        - dataset["net_after_income_tax_monthly_gbp"]
    ).abs().max()

    employer_cost_identity_error = (
        dataset["gross_monthly_gbp"]
        + dataset["employer_contributions_monthly_gbp"]
        - dataset["employer_cost_monthly_gbp"]
    ).abs().max()

    social_wedge_identity_error = (
        dataset["employer_cost_monthly_gbp"]
        - dataset["net_before_income_tax_monthly_gbp"]
        - dataset["social_wedge_monthly_gbp"]
    ).abs().max()

    total_wedge_after_tax_identity_error = (
        dataset["employer_cost_monthly_gbp"]
        - dataset["net_after_income_tax_monthly_gbp"]
        - dataset["total_wedge_after_income_tax_monthly_gbp"]
    ).abs().max()

    return {
        "rows": len(dataset),
        "profiles": dataset["profile_id"].nunique(),
        "max_net_identity_error": net_identity_error,
        "max_tax_identity_error": tax_identity_error,
        "max_employer_cost_identity_error": employer_cost_identity_error,
        "max_social_wedge_identity_error": social_wedge_identity_error,
        "max_total_wedge_after_tax_identity_error": total_wedge_after_tax_identity_error
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

    print("United Kingdom dataset created.")
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
        "Max tax identity error: "
        f"{checks['max_tax_identity_error']:.10f}"
    )

    print(
        "Max employer cost identity error: "
        f"{checks['max_employer_cost_identity_error']:.10f}"
    )

    print(
        "Max social wedge identity error: "
        f"{checks['max_social_wedge_identity_error']:.10f}"
    )

    print(
        "Max total wedge after tax identity error: "
        f"{checks['max_total_wedge_after_tax_identity_error']:.10f}"
    )

    print()
    print("Sample")
    print(
        dataset[
            [
                "smic_multiple",
                "gross_monthly_gbp",
                "net_before_income_tax_monthly_gbp",
                "income_tax_monthly_gbp",
                "net_after_income_tax_monthly_gbp",
                "employer_cost_monthly_gbp",
                "cost_to_net_after_income_tax_ratio"
            ]
        ]
        .query("smic_multiple in [1.0, 1.5, 2.0, 3.0, 6.0]")
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()
