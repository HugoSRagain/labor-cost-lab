from pathlib import Path
import json

import numpy as np
import pandas as pd

from italian_payroll_2026 import compute_italian_payroll_2026


ROOT_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "italy"
    / "italy_parameters_2026.json"
)

OUTPUT_PATH = (
    ROOT_DIR
    / "docs"
    / "data"
    / "italy"
    / "italy_labour_cost_grid_2026.csv"
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
    wage_reference = parameters["wage_reference"]["gross_monthly_eur"]

    gross_monthly_eur = (
        wage_reference
        * smic_multiple
    )

    result = compute_italian_payroll_2026(gross_monthly_eur)

    employee_contributions = result["employee_contributions_monthly_eur"]
    employer_contributions = result["employer_contributions_monthly_eur"]
    tfr_monthly = result["tfr_monthly_eur"]
    income_tax_monthly = result["total_income_tax_monthly_eur"]

    net_before_income_tax = gross_monthly_eur - employee_contributions
    net_after_income_tax = net_before_income_tax - income_tax_monthly

    employer_cost = gross_monthly_eur + employer_contributions + tfr_monthly

    social_wedge = employer_cost - net_before_income_tax
    total_wedge_after_income_tax = employer_cost - net_after_income_tax

    inps = result["inps_breakdown"]

    return {
        "country": parameters["country"],
        "country_code": parameters["country_code"],
        "version": parameters["version"],
        "effective_from": parameters["effective_from"],

        "profile_id": profile["profile_id"],
        "profile_label_fr": profile["label_fr"],
        "profile_label_en": profile["label_en"],

        "smic_multiple": smic_multiple,
        "gross_monthly_eur": round_money(gross_monthly_eur),

        "ivs_employer_monthly_eur": round_money(inps["ivs_employer_annual_eur"] / 12.0),
        "ivs_employee_monthly_eur": round_money(inps["ivs_employee_annual_eur"] / 12.0),
        "aggiuntivo_1_percent_monthly_eur": round_money(inps["aggiuntivo_1_percent_annual_eur"] / 12.0),
        "naspi_monthly_eur": round_money(inps["naspi_annual_eur"] / 12.0),
        "cigo_monthly_eur": round_money(inps["cigo_annual_eur"] / 12.0),
        "cigs_employer_monthly_eur": round_money(inps["cigs_employer_annual_eur"] / 12.0),
        "cigs_employee_monthly_eur": round_money(inps["cigs_employee_annual_eur"] / 12.0),
        "maternita_monthly_eur": round_money(inps["maternita_annual_eur"] / 12.0),
        "fondo_garanzia_tfr_monthly_eur": round_money(inps["fondo_garanzia_tfr_annual_eur"] / 12.0),
        "cuaf_monthly_eur": round_money(inps["cuaf_annual_eur"] / 12.0),
        "inail_monthly_eur": round_money(inps["inail_annual_eur"] / 12.0),
        "tfr_accrual_monthly_eur": round_money(tfr_monthly),

        "irpef_lorda_annual_eur": round_money(result["irpef_lorda_annual_eur"]),
        "detrazione_lavoro_dipendente_annual_eur": round_money(result["detrazione_lavoro_dipendente_annual_eur"]),
        "ulteriore_detrazione_annual_eur": round_money(result["ulteriore_detrazione_annual_eur"]),
        "trattamento_integrativo_annual_eur": round_money(result["trattamento_integrativo_annual_eur"]),
        "addizionale_regionale_annual_eur": round_money(result["addizionale_regionale_annual_eur"]),
        "addizionale_comunale_annual_eur": round_money(result["addizionale_comunale_annual_eur"]),

        "employee_contributions_monthly_eur": round_money(employee_contributions),
        "employer_contributions_monthly_eur": round_money(employer_contributions),

        "employee_contribution_rate": (
            employee_contributions / gross_monthly_eur
            if gross_monthly_eur > 0
            else np.nan
        ),

        "employer_contribution_rate": (
            employer_contributions / gross_monthly_eur
            if gross_monthly_eur > 0
            else np.nan
        ),

        "net_before_income_tax_monthly_eur": round_money(net_before_income_tax),

        "income_tax_monthly_eur": round_money(income_tax_monthly),

        "net_after_income_tax_monthly_eur": round_money(net_after_income_tax),

        "employer_cost_monthly_eur": round_money(employer_cost),

        "social_wedge_monthly_eur": round_money(social_wedge),

        "total_wedge_after_income_tax_monthly_eur": round_money(
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

    dataset["delta_gross_monthly_eur"] = dataset.groupby(
        "profile_id"
    )["gross_monthly_eur"].diff()

    dataset["delta_net_before_income_tax_monthly_eur"] = dataset.groupby(
        "profile_id"
    )["net_before_income_tax_monthly_eur"].diff()

    dataset["delta_net_after_income_tax_monthly_eur"] = dataset.groupby(
        "profile_id"
    )["net_after_income_tax_monthly_eur"].diff()

    dataset["delta_employer_cost_monthly_eur"] = dataset.groupby(
        "profile_id"
    )["employer_cost_monthly_eur"].diff()

    dataset["delta_social_wedge_monthly_eur"] = dataset.groupby(
        "profile_id"
    )["social_wedge_monthly_eur"].diff()

    dataset["delta_total_wedge_after_income_tax_monthly_eur"] = dataset.groupby(
        "profile_id"
    )["total_wedge_after_income_tax_monthly_eur"].diff()

    dataset["marginal_net_before_income_tax_rate"] = (
        dataset["delta_net_before_income_tax_monthly_eur"]
        / dataset["delta_gross_monthly_eur"]
    )

    dataset["marginal_net_after_income_tax_rate"] = (
        dataset["delta_net_after_income_tax_monthly_eur"]
        / dataset["delta_gross_monthly_eur"]
    )

    dataset["marginal_employer_cost_rate"] = (
        dataset["delta_employer_cost_monthly_eur"]
        / dataset["delta_gross_monthly_eur"]
    )

    dataset["marginal_social_wedge_rate"] = (
        dataset["delta_social_wedge_monthly_eur"]
        / dataset["delta_gross_monthly_eur"]
    )

    dataset["marginal_total_wedge_after_income_tax_rate"] = (
        dataset["delta_total_wedge_after_income_tax_monthly_eur"]
        / dataset["delta_gross_monthly_eur"]
    )

    return dataset


def run_quality_checks(dataset: pd.DataFrame) -> dict:
    net_identity_error = (
        dataset["gross_monthly_eur"]
        - dataset["employee_contributions_monthly_eur"]
        - dataset["net_before_income_tax_monthly_eur"]
    ).abs().max()

    tax_identity_error = (
        dataset["net_before_income_tax_monthly_eur"]
        - dataset["income_tax_monthly_eur"]
        - dataset["net_after_income_tax_monthly_eur"]
    ).abs().max()

    employer_cost_identity_error = (
        dataset["gross_monthly_eur"]
        + dataset["employer_contributions_monthly_eur"]
        + dataset["tfr_accrual_monthly_eur"]
        - dataset["employer_cost_monthly_eur"]
    ).abs().max()

    social_wedge_identity_error = (
        dataset["employer_cost_monthly_eur"]
        - dataset["net_before_income_tax_monthly_eur"]
        - dataset["social_wedge_monthly_eur"]
    ).abs().max()

    total_wedge_after_tax_identity_error = (
        dataset["employer_cost_monthly_eur"]
        - dataset["net_after_income_tax_monthly_eur"]
        - dataset["total_wedge_after_income_tax_monthly_eur"]
    ).abs().max()

    employer_contrib_breakdown_error = (
        dataset["ivs_employer_monthly_eur"]
        + dataset["naspi_monthly_eur"]
        + dataset["cigo_monthly_eur"]
        + dataset["cigs_employer_monthly_eur"]
        + dataset["maternita_monthly_eur"]
        + dataset["fondo_garanzia_tfr_monthly_eur"]
        + dataset["cuaf_monthly_eur"]
        + dataset["inail_monthly_eur"]
        - dataset["employer_contributions_monthly_eur"]
    ).abs().max()

    employee_contrib_breakdown_error = (
        dataset["ivs_employee_monthly_eur"]
        + dataset["cigs_employee_monthly_eur"]
        + dataset["aggiuntivo_1_percent_monthly_eur"]
        - dataset["employee_contributions_monthly_eur"]
    ).abs().max()

    return {
        "rows": len(dataset),
        "profiles": dataset["profile_id"].nunique(),
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

    print("Italy dataset created.")
    print(f"Output: {OUTPUT_PATH}")
    print()
    print("Quality checks")
    print(f"Profiles: {checks['profiles']}")
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
    print("Sample")
    print(
        dataset[
            [
                "smic_multiple",
                "gross_monthly_eur",
                "net_before_income_tax_monthly_eur",
                "income_tax_monthly_eur",
                "net_after_income_tax_monthly_eur",
                "tfr_accrual_monthly_eur",
                "employer_cost_monthly_eur",
                "cost_to_net_after_income_tax_ratio"
            ]
        ]
        .query("smic_multiple in [1.0, 1.5, 2.0, 3.0, 6.0]")
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()
