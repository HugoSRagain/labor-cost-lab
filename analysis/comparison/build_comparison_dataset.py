"""
Labor Cost Lab
Cross-country comparison dataset builder (Phase 1: France, Germany, Belgium, Switzerland).

Methodology
-----------
This script does NOT interpolate the countries' existing per-wage-grid
datasets. For each harmonized wage point (expressed in international
dollars, private-consumption PPP basis), it converts that point into each
country's own local currency using that country's own PPP factor, and then
calls each country's existing per-wage compute function directly on that
local-currency wage:

    France:      scripts/build_dataset_mon_entreprise.py  (Mon-entreprise / Publicodes engine)
    Germany:     analysis/germany/build_germany_dataset.py (compute_row)
    Belgium:     analysis/belgium/build_belgium_dataset.py (compute_row)
    Switzerland: analysis/switzerland/swiss_social_contributions_2026.py +
                 analysis/switzerland/swiss_withholding_tax_2026.py,
                 computed for all 26 cantons and aggregated with a
                 population-weighted average (Switzerland has no single
                 national wage-tax schedule; withholding tax is cantonal).

See docs/data/comparison/comparison_parameters_2026.json for the harmonized
wage grid, the PPP factors (source, year, indicator code), the reference
profile chosen for each country, and the Swiss canton population weights
(source, year).

Important limitation (see comparison_parameters_2026.json "notes"):
France's net wage is net of social contributions only. Personal income tax
(prelevement a la source) is not modeled because its rate depends on the
household's personal tax situation, unlike Germany's Lohnsteuer, Belgium's
precompte professionnel and Switzerland's impot a la source, which are all
mandatory wage withholdings computed directly from the wage. Comparisons of
"net after income tax" therefore exclude France; comparisons of "net before
income tax" (net of social contributions only) are valid across all 4
countries.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

import yaml


ROOT_DIR = Path(__file__).resolve().parents[2]

PARAMETERS_PATH = (
    ROOT_DIR / "docs" / "data" / "comparison" / "comparison_parameters_2026.json"
)

FRANCE_SCENARIOS_PATH = ROOT_DIR / "config" / "scenarios.yml"

OUTPUT_PATH = (
    ROOT_DIR / "docs" / "data" / "comparison" / "labour_cost_comparison_2026.csv"
)

# Make each country's compute modules importable without turning them into
# a shared package (they are plain scripts with plain top-level imports).
sys.path.insert(0, str(ROOT_DIR / "scripts"))
sys.path.insert(0, str(ROOT_DIR / "analysis" / "germany"))
sys.path.insert(0, str(ROOT_DIR / "analysis" / "belgium"))
sys.path.insert(0, str(ROOT_DIR / "analysis" / "switzerland"))

import pandas as pd  # noqa: E402

from build_dataset_mon_entreprise import (  # noqa: E402
    evaluate_salary as fr_evaluate_salary,
    compute_indicators as fr_compute_indicators,
    load_profiles as fr_load_profiles,
    select_rgdu_expression as fr_select_rgdu_expression,
)

from build_germany_dataset import (  # noqa: E402
    compute_row as de_compute_row,
    load_parameters as de_load_parameters,
)

from build_belgium_dataset import (  # noqa: E402
    compute_row as be_compute_row,
    load_parameters as be_load_parameters,
)

from swiss_social_contributions_2026 import (  # noqa: E402
    compute_swiss_social_contributions,
)

from build_switzerland_dataset import (  # noqa: E402
    build_social_parameters as ch_build_social_parameters,
    load_parameters as ch_load_parameters,
)

from swiss_withholding_tax_2026 import (  # noqa: E402
    compute_withholding_tax_monthly,
    load_withholding_tax_brackets,
)


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def round_money(value: float, digits: int = 2) -> float:
    return round(float(value), digits)


def build_wage_grid(parameters: Dict[str, Any]) -> List[float]:
    grid = parameters["harmonized_wage_grid"]
    start = float(grid["min_intl_usd"])
    stop = float(grid["max_intl_usd"])
    step = float(grid["step_intl_usd"])

    points = []
    current = start
    while current <= stop + 1e-9:
        points.append(round(current, 2))
        current += step

    return points


def base_row(
    country: str,
    country_code: str,
    currency_code: str,
    reference_profile_id: str,
    reference_profile_description: str,
    harmonized_wage_point_intl_usd: float,
    ppp_factor: float,
) -> Dict[str, Any]:
    return {
        "country": country,
        "country_code": country_code,
        "currency_code": currency_code,
        "reference_profile_id": reference_profile_id,
        "reference_profile_description": reference_profile_description,
        "harmonized_wage_point_intl_usd": harmonized_wage_point_intl_usd,
        "ppp_factor_lcu_per_intl_usd": ppp_factor,
    }


# ---------------------------------------------------------------------------
# France
# ---------------------------------------------------------------------------

def compute_france_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    profile_id: str,
    profile_situation: Dict[str, Any],
    rgdu_expression: str,
    minimum_wage_monthly_eur: float,
) -> Dict[str, Any]:
    gross_local = round_money(wage_point_intl_usd * ppp_factor)

    result = fr_evaluate_salary(
        gross_local,
        profile_situation=profile_situation,
        rgdu_expression=rgdu_expression,
    )

    indicators = fr_compute_indicators(
        result,
        gross_local,
        rgdu_expression=rgdu_expression,
    )

    gross_used = indicators["gross_used"] if indicators["gross_used"] is not None else gross_local
    net_before_income_tax = indicators["net_monthly"]
    employer_cost = indicators["employer_cost"]
    employee_contributions = indicators["employee_contributions"]
    employer_contributions = indicators["employer_contributions"]

    social_wedge_before_income_tax_rate = None
    if employer_cost and net_before_income_tax is not None:
        social_wedge_before_income_tax_rate = (
            (employer_cost - net_before_income_tax) / employer_cost
        )

    cost_to_net_before_income_tax_ratio = None
    if net_before_income_tax:
        cost_to_net_before_income_tax_ratio = employer_cost / net_before_income_tax

    row = base_row(
        country="France",
        country_code="FR",
        currency_code="EUR",
        reference_profile_id=profile_id,
        reference_profile_description=(
            "Non-executive employee, outside Alsace-Moselle, firm with "
            "fewer than 50 employees, standard AT/MP rate, full-time."
        ),
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    row.update(
        {
            "gross_monthly_local": round_money(gross_used),
            "gross_monthly_intl_usd": round_money(gross_used / ppp_factor),
            "employee_contributions_monthly_local": round_money(employee_contributions),
            "employee_contributions_monthly_intl_usd": round_money(employee_contributions / ppp_factor),
            "employer_contributions_monthly_local": round_money(employer_contributions),
            "employer_contributions_monthly_intl_usd": round_money(employer_contributions / ppp_factor),
            "net_before_income_tax_monthly_local": round_money(net_before_income_tax),
            "net_before_income_tax_monthly_intl_usd": round_money(net_before_income_tax / ppp_factor),
            "income_tax_or_withholding_tax_monthly_local": None,
            "income_tax_or_withholding_tax_monthly_intl_usd": None,
            "net_after_income_tax_monthly_local": None,
            "net_after_income_tax_monthly_intl_usd": None,
            "employer_cost_monthly_local": round_money(employer_cost),
            "employer_cost_monthly_intl_usd": round_money(employer_cost / ppp_factor),
            "social_wedge_before_income_tax_rate": (
                round(social_wedge_before_income_tax_rate, 6)
                if social_wedge_before_income_tax_rate is not None
                else None
            ),
            "total_wedge_after_income_tax_rate": None,
            "cost_to_net_before_income_tax_ratio": (
                round(cost_to_net_before_income_tax_ratio, 6)
                if cost_to_net_before_income_tax_ratio is not None
                else None
            ),
            "cost_to_net_after_income_tax_ratio": None,
            "income_tax_modeled": False,
            "aggregation_method": "single_reference_profile",
            "below_minimum_wage": bool(gross_used < minimum_wage_monthly_eur),
            "national_minimum_wage_monthly_local": round_money(minimum_wage_monthly_eur),
            "note": (
                "Personal income tax (prelevement a la source) is not modeled: "
                "its rate depends on the household's personal tax situation and "
                "cannot be derived from a generic wage-only simulation."
            ),
        }
    )

    return row


# ---------------------------------------------------------------------------
# Germany
# ---------------------------------------------------------------------------

def compute_germany_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    profile: Dict[str, Any],
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    gross_local = wage_point_intl_usd * ppp_factor

    minimum_wage_hourly = parameters["minimum_wage"]["hourly_eur"]
    monthly_hours = parameters["working_time_convention"]["monthly_hours"]
    monthly_minimum_wage = minimum_wage_hourly * monthly_hours

    smic_multiple = gross_local / monthly_minimum_wage

    result = de_compute_row(smic_multiple, profile, parameters)

    employer_cost = result["employer_cost_monthly_eur"]
    net_before_income_tax = result["net_before_income_tax_monthly_eur"]
    net_after_income_tax = result["net_after_income_tax_monthly_eur"]
    income_tax = result["tax_wedge_monthly_eur"]

    row = base_row(
        country="Germany",
        country_code="DE",
        currency_code="EUR",
        reference_profile_id=profile["profile_id"],
        reference_profile_description="Public health insurance, childless, outside Saxony.",
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    row.update(
        {
            "gross_monthly_local": round_money(result["gross_monthly_eur"]),
            "gross_monthly_intl_usd": round_money(result["gross_monthly_eur"] / ppp_factor),
            "employee_contributions_monthly_local": round_money(result["employee_contributions_monthly_eur"]),
            "employee_contributions_monthly_intl_usd": round_money(result["employee_contributions_monthly_eur"] / ppp_factor),
            "employer_contributions_monthly_local": round_money(result["employer_contributions_monthly_eur"]),
            "employer_contributions_monthly_intl_usd": round_money(result["employer_contributions_monthly_eur"] / ppp_factor),
            "net_before_income_tax_monthly_local": round_money(net_before_income_tax),
            "net_before_income_tax_monthly_intl_usd": round_money(net_before_income_tax / ppp_factor),
            "income_tax_or_withholding_tax_monthly_local": round_money(income_tax),
            "income_tax_or_withholding_tax_monthly_intl_usd": round_money(income_tax / ppp_factor),
            "net_after_income_tax_monthly_local": round_money(net_after_income_tax),
            "net_after_income_tax_monthly_intl_usd": round_money(net_after_income_tax / ppp_factor),
            "employer_cost_monthly_local": round_money(employer_cost),
            "employer_cost_monthly_intl_usd": round_money(employer_cost / ppp_factor),
            "social_wedge_before_income_tax_rate": round(result["social_wedge_rate"], 6),
            "total_wedge_after_income_tax_rate": round(
                (employer_cost - net_after_income_tax) / employer_cost, 6
            ) if employer_cost else None,
            "cost_to_net_before_income_tax_ratio": round(result["cost_to_net_ratio"], 6)
            if result["cost_to_net_ratio"] == result["cost_to_net_ratio"] else None,
            "cost_to_net_after_income_tax_ratio": round(result["cost_to_net_after_tax_ratio"], 6)
            if result["cost_to_net_after_tax_ratio"] == result["cost_to_net_after_tax_ratio"] else None,
            "income_tax_modeled": True,
            "aggregation_method": "single_reference_profile",
            "below_minimum_wage": bool(gross_local < monthly_minimum_wage),
            "national_minimum_wage_monthly_local": round_money(monthly_minimum_wage),
            "note": "",
        }
    )

    return row


# ---------------------------------------------------------------------------
# Belgium
# ---------------------------------------------------------------------------

def compute_belgium_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    profile: Dict[str, Any],
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    gross_local = wage_point_intl_usd * ppp_factor
    wage_reference = parameters["wage_reference"]["gross_monthly_eur"]
    smic_multiple = gross_local / wage_reference

    result = be_compute_row(profile, smic_multiple, parameters)

    employer_cost = result["employer_cost_monthly_eur"]
    net_before_income_tax = result["net_before_income_tax_monthly_eur"]
    net_after_income_tax = result["net_after_withholding_tax_monthly_eur"]
    income_tax = result["withholding_tax_monthly_eur"]

    row = base_row(
        country="Belgium",
        country_code="BE",
        currency_code="EUR",
        reference_profile_id=profile["profile_id"],
        reference_profile_description="Standard private-sector employee (only profile currently modeled for Belgium).",
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    cost_to_net_ratio = result["cost_to_net_ratio"]
    cost_to_net_after_ratio = result["cost_to_net_after_withholding_tax_ratio"]

    row.update(
        {
            "gross_monthly_local": round_money(result["gross_monthly_eur"]),
            "gross_monthly_intl_usd": round_money(result["gross_monthly_eur"] / ppp_factor),
            "employee_contributions_monthly_local": round_money(result["employee_contributions_monthly_eur"]),
            "employee_contributions_monthly_intl_usd": round_money(result["employee_contributions_monthly_eur"] / ppp_factor),
            "employer_contributions_monthly_local": round_money(result["employer_contributions_monthly_eur"]),
            "employer_contributions_monthly_intl_usd": round_money(result["employer_contributions_monthly_eur"] / ppp_factor),
            "net_before_income_tax_monthly_local": round_money(net_before_income_tax),
            "net_before_income_tax_monthly_intl_usd": round_money(net_before_income_tax / ppp_factor),
            "income_tax_or_withholding_tax_monthly_local": round_money(income_tax),
            "income_tax_or_withholding_tax_monthly_intl_usd": round_money(income_tax / ppp_factor),
            "net_after_income_tax_monthly_local": round_money(net_after_income_tax),
            "net_after_income_tax_monthly_intl_usd": round_money(net_after_income_tax / ppp_factor),
            "employer_cost_monthly_local": round_money(employer_cost),
            "employer_cost_monthly_intl_usd": round_money(employer_cost / ppp_factor),
            "social_wedge_before_income_tax_rate": round(
                (employer_cost - net_before_income_tax) / employer_cost, 6
            ) if employer_cost else None,
            "total_wedge_after_income_tax_rate": round(
                (employer_cost - net_after_income_tax) / employer_cost, 6
            ) if employer_cost else None,
            "cost_to_net_before_income_tax_ratio": round(cost_to_net_ratio, 6)
            if cost_to_net_ratio == cost_to_net_ratio else None,
            "cost_to_net_after_income_tax_ratio": round(cost_to_net_after_ratio, 6)
            if cost_to_net_after_ratio == cost_to_net_after_ratio else None,
            "income_tax_modeled": True,
            "aggregation_method": "single_reference_profile",
            "below_minimum_wage": bool(gross_local < wage_reference),
            "national_minimum_wage_monthly_local": round_money(wage_reference),
            "note": "",
        }
    )

    return row


# ---------------------------------------------------------------------------
# Switzerland (population-weighted average across 26 cantons)
# ---------------------------------------------------------------------------

def compute_switzerland_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    social_params,
    withholding_tax_brackets,
    canton_weights: Dict[str, float],
    minimum_wage_monthly_chf: float,
) -> Dict[str, Any]:
    gross_local_chf = wage_point_intl_usd * ppp_factor

    weighted_sums = {
        "employee_total_contrib": 0.0,
        "employer_total_contrib": 0.0,
        "net_before_tax": 0.0,
        "withholding_tax": 0.0,
        "net_after_tax": 0.0,
        "employer_cost": 0.0,
    }

    for canton_code, weight in canton_weights.items():
        social = compute_swiss_social_contributions(gross_local_chf, social_params)

        withholding_tax_monthly = compute_withholding_tax_monthly(
            gross_local_chf,
            canton_code,
            withholding_tax_brackets,
        )

        net_before_tax = social["net_before_tax_monthly_chf"]
        net_after_tax = net_before_tax - withholding_tax_monthly
        employer_cost = social["employer_cost_monthly_chf"]

        weighted_sums["employee_total_contrib"] += weight * social["employee_total_contrib_monthly_chf"]
        weighted_sums["employer_total_contrib"] += weight * social["employer_total_contrib_monthly_chf"]
        weighted_sums["net_before_tax"] += weight * net_before_tax
        weighted_sums["withholding_tax"] += weight * withholding_tax_monthly
        weighted_sums["net_after_tax"] += weight * net_after_tax
        weighted_sums["employer_cost"] += weight * employer_cost

    employer_cost = weighted_sums["employer_cost"]
    net_before_income_tax = weighted_sums["net_before_tax"]
    net_after_income_tax = weighted_sums["net_after_tax"]
    income_tax = weighted_sums["withholding_tax"]

    row = base_row(
        country="Switzerland",
        country_code="CH",
        currency_code="CHF",
        reference_profile_id="switzerland__population_weighted_average_26_cantons__single_no_child_standard_lpp",
        reference_profile_description=(
            "Population-weighted average across all 26 cantons, tariff A0N "
            "(single, no child, no church tax where available), standardized "
            "LPP/BVG and accident insurance assumptions."
        ),
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    row.update(
        {
            "gross_monthly_local": round_money(gross_local_chf),
            "gross_monthly_intl_usd": round_money(gross_local_chf / ppp_factor),
            "employee_contributions_monthly_local": round_money(weighted_sums["employee_total_contrib"]),
            "employee_contributions_monthly_intl_usd": round_money(weighted_sums["employee_total_contrib"] / ppp_factor),
            "employer_contributions_monthly_local": round_money(weighted_sums["employer_total_contrib"]),
            "employer_contributions_monthly_intl_usd": round_money(weighted_sums["employer_total_contrib"] / ppp_factor),
            "net_before_income_tax_monthly_local": round_money(net_before_income_tax),
            "net_before_income_tax_monthly_intl_usd": round_money(net_before_income_tax / ppp_factor),
            "income_tax_or_withholding_tax_monthly_local": round_money(income_tax),
            "income_tax_or_withholding_tax_monthly_intl_usd": round_money(income_tax / ppp_factor),
            "net_after_income_tax_monthly_local": round_money(net_after_income_tax),
            "net_after_income_tax_monthly_intl_usd": round_money(net_after_income_tax / ppp_factor),
            "employer_cost_monthly_local": round_money(employer_cost),
            "employer_cost_monthly_intl_usd": round_money(employer_cost / ppp_factor),
            "social_wedge_before_income_tax_rate": round(
                (employer_cost - net_before_income_tax) / employer_cost, 6
            ) if employer_cost else None,
            "total_wedge_after_income_tax_rate": round(
                (employer_cost - net_after_income_tax) / employer_cost, 6
            ) if employer_cost else None,
            "cost_to_net_before_income_tax_ratio": round(employer_cost / net_before_income_tax, 6)
            if net_before_income_tax else None,
            "cost_to_net_after_income_tax_ratio": round(employer_cost / net_after_income_tax, 6)
            if net_after_income_tax else None,
            "income_tax_modeled": True,
            "aggregation_method": "population_weighted_average_26_cantons",
            "below_minimum_wage": bool(gross_local_chf < minimum_wage_monthly_chf),
            "national_minimum_wage_monthly_local": round_money(minimum_wage_monthly_chf),
            "note": (
                "Withholding tax and net figures are a population-weighted "
                "average across all 26 cantons (BFS 2024 permanent resident "
                "population), not a single reference canton."
            ),
        }
    )

    return row


def build_dataset() -> pd.DataFrame:
    parameters = load_json(PARAMETERS_PATH)
    ppp_values = parameters["ppp_conversion_factors"]["values"]
    wage_grid = build_wage_grid(parameters)

    # --- France setup ---
    with FRANCE_SCENARIOS_PATH.open("r", encoding="utf-8") as file:
        fr_scenarios = yaml.safe_load(file)
    fr_minimum_wage_eur = fr_scenarios["baseline"]["monthly_smic_gross"]

    fr_profile_id = parameters["reference_profiles"]["FR"]["profile_id"]
    fr_profiles = fr_load_profiles()

    if fr_profile_id not in fr_profiles:
        raise ValueError(f"Unknown France reference profile: {fr_profile_id}")

    fr_profile_situation = fr_profiles[fr_profile_id].get("situation", {})
    fr_rgdu_expression = fr_select_rgdu_expression(
        wage_grid[0] * ppp_values["FR"],
        profile_situation=fr_profile_situation,
    )

    # --- Germany setup ---
    de_parameters = de_load_parameters()
    de_profile_id = parameters["reference_profiles"]["DE"]["profile_id"]
    de_profile = next(
        profile for profile in de_parameters["profiles"]
        if profile["profile_id"] == de_profile_id
    )

    # --- Belgium setup ---
    be_parameters = be_load_parameters()
    be_profile_id = parameters["reference_profiles"]["BE"]["profile_id"]
    be_profiles = be_parameters["profiles"] if "profiles" in be_parameters else be_parameters
    be_profile = next(
        profile for profile in be_profiles
        if profile["profile_id"] == be_profile_id
    )

    # --- Switzerland setup ---
    ch_parameters = ch_load_parameters()
    ch_social_params = ch_build_social_parameters(ch_parameters)
    ch_withholding_tax_brackets = load_withholding_tax_brackets()
    ch_minimum_wage_chf = ch_parameters["wage_grid"]["gross_monthly_min_chf"]

    canton_population = {
        canton["code"]: canton["population"]
        for canton in parameters["switzerland_canton_population_weights"]["cantons"]
    }
    total_population = sum(canton_population.values())
    canton_weights = {
        code: population / total_population
        for code, population in canton_population.items()
    }

    rows: List[Dict[str, Any]] = []

    for wage_point in wage_grid:
        print(f"Harmonized wage point: {wage_point:,.0f} intl $/month")

        rows.append(
            compute_france_row(
                wage_point,
                ppp_values["FR"],
                fr_profile_id,
                fr_profile_situation,
                fr_rgdu_expression,
                fr_minimum_wage_eur,
            )
        )

        rows.append(
            compute_germany_row(
                wage_point,
                ppp_values["DE"],
                de_profile,
                de_parameters,
            )
        )

        rows.append(
            compute_belgium_row(
                wage_point,
                ppp_values["BE"],
                be_profile,
                be_parameters,
            )
        )

        rows.append(
            compute_switzerland_row(
                wage_point,
                ppp_values["CH"],
                ch_social_params,
                ch_withholding_tax_brackets,
                canton_weights,
                ch_minimum_wage_chf,
            )
        )

    return pd.DataFrame(rows)


def main() -> None:
    dataset = build_dataset()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

    print()
    print(f"Comparison dataset created: {OUTPUT_PATH}")
    print(f"Rows: {len(dataset)}")
    print()
    print(
        dataset[
            [
                "country_code",
                "harmonized_wage_point_intl_usd",
                "gross_monthly_local",
                "net_before_income_tax_monthly_intl_usd",
                "net_after_income_tax_monthly_intl_usd",
                "employer_cost_monthly_intl_usd",
                "cost_to_net_before_income_tax_ratio",
            ]
        ].to_string(index=False)
    )


if __name__ == "__main__":
    main()
