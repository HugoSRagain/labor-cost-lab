"""
Labor Cost Lab
Cross-country comparison dataset builder (France, Germany, Belgium, Switzerland, Netherlands, United Kingdom, Ireland, Spain, Sweden, Italy, United States).

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
    Netherlands: analysis/netherlands/build_netherlands_dataset.py (compute_row)
    United Kingdom: analysis/uk/build_uk_dataset.py (compute_row), computed for
                 both rUK and Scotland and aggregated with a population-weighted
                 average (income tax is devolved; National Insurance and the
                 workplace pension are not).
    Ireland:     analysis/ireland/build_ireland_dataset.py (compute_row)
    Spain:       analysis/spain/build_spain_dataset.py (compute_row), computed for
                 16 comunidades autonomas and aggregated with a population-weighted
                 average (IRPF has a regional component; Seguridad Social is
                 national). Navarra and Pais Vasco are excluded (foral systems).
    Sweden:      analysis/sweden/build_sweden_dataset.py (compute_row), single
                 reference profile (Stockholm kommun).
    Italy:       analysis/italy/build_italy_dataset.py (compute_row), single
                 reference profile (Roma/Lazio), employer_cost includes the
                 TFR deferred severance accrual.
    United States: analysis/usa/us_payroll_2026.py (compute_us_payroll_2026),
                 computed for all 50 states + DC and aggregated with a
                 population-weighted average (2024 Census Bureau estimates),
                 mirroring the Swiss canton / UK region / Spanish region
                 approach. Federal income tax, FICA and FUTA are identical
                 nationwide; state income tax (9 states have none), SUI and
                 any state-mandated payroll deduction vary by state.

Important note on the United Kingdom: income tax is a population-weighted
average of the rUK (England/Wales/Northern Ireland) and Scotland devolved
bands, weighted by ONS/NRS mid-2024 population estimates (see
comparison_parameters_2026.json "uk_region_population_weights") -- this
mirrors how Switzerland's cantons are aggregated. National Insurance and the
statutory-minimum automatic-enrolment workplace pension are not devolved and
are identical in both regions. "employee_contributions" and
"employer_contributions" include both Class 1 National Insurance and the
workplace pension (employee 5%, employer 3% of qualifying earnings), since
both are mandatory deductions distinct from income tax.

Important note on Ireland: "income_tax_or_withholding_tax" bundles PAYE
income tax and the Universal Social Charge (USC), since USC is a separate
tax on income rather than a social contribution; "employee_contributions"
and "employer_contributions" are PRSI Class A only (January-September 2026
rates -- a further rate increase scheduled for 1 October 2026 is not
modelled).

Important note on Spain: income tax (IRPF) is a population-weighted average
across 16 comunidades autonomas (INE 1 January 2025 population), mirroring
how Switzerland's cantons are aggregated -- each region's own regional
("autonomica") IRPF scale and personal minimum are combined with the
national state scale. Navarra and Pais Vasco are excluded: separate "foral"
tax systems, out of scope. "employee_contributions" and
"employer_contributions" are Seguridad Social Regimen General
contributions only, national and identical across all regions.

Important note on the Netherlands (see comparison_parameters_2026.json
"notes"):
Unlike the other four countries, the Netherlands has no separate visible
employee social-security contribution: the AOW/Anw/Wlz national-insurance
premiums are bundled into the Box 1 wage-tax rate itself. This module
therefore reports "employee_contributions_monthly_local" as 0 for the
Netherlands, and the entire payroll deduction (income tax + national
insurance combined, "loonheffing") appears under
"income_tax_or_withholding_tax_monthly_local".

See docs/data/comparison/comparison_parameters_2026.json for the harmonized
wage grid, the PPP factors (source, year, indicator code), the reference
profile chosen for each country, and the Swiss canton population weights
(source, year).

Important note on France's income tax (see comparison_parameters_2026.json
"notes"):
France's "net after income tax" figure is the actual tax due by a single,
childless reference taxpayer (1 part de quotient familial), computed via
the true progressive income-tax bareme (marginal brackets) applied to the
Mon-entreprise engine's "salarie . remuneration . net . imposable" tax base,
annualized and reduced by the standard 10% deduction for professional
expenses (see scripts/build_dataset_mon_entreprise.py:
compute_progressive_income_tax). This is directly analogous to Germany's
Lohnsteuer, Belgium's precompte professionnel and Switzerland's impot a la
source: the actual mandatory tax liability for a single/childless reference
profile, not an administrative withholding default. Note that most French
employees are withheld at a personalized "prelevement a la source" rate
set by the DGFiP from their full household's tax situation (which can
differ from a single/childless taxpayer's liability), but the amount
withheld is only an advance on the tax computed here, which is the amount
definitively due.

FLCL-E (labour cost efficiency index)
--------------------------------------
The output column "flcl_e_before_income_tax" is a derived indicator, not a
country-specific compute-function output: flcl_e_before_income_tax = 100 *
net_before_income_tax_monthly_intl_usd / employer_cost_monthly_intl_usd, for
every country and every harmonized wage point. It mirrors the FLCL-E
indicator already used in each national module's own "FLCL Index" tab (see
docs/assets/app.js for France, and each country's own *_app.js). As in the
national modules, this uses "net before income tax" (net of social
contributions only), so it isolates the social-contribution wedge from
personal income tax. The Netherlands' flcl_e_before_income_tax is
structurally inflated for the same reason documented above: loonheffing
bundles national insurance into the income-tax line, so its "net before
income tax" is close to its gross wage.
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
sys.path.insert(0, str(ROOT_DIR / "analysis" / "netherlands"))
sys.path.insert(0, str(ROOT_DIR / "analysis" / "uk"))
sys.path.insert(0, str(ROOT_DIR / "analysis" / "ireland"))
sys.path.insert(0, str(ROOT_DIR / "analysis" / "spain"))
sys.path.insert(0, str(ROOT_DIR / "analysis" / "sweden"))
sys.path.insert(0, str(ROOT_DIR / "analysis" / "italy"))
sys.path.insert(0, str(ROOT_DIR / "analysis" / "usa"))

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

from build_netherlands_dataset import (  # noqa: E402
    compute_row as nl_compute_row,
    load_parameters as nl_load_parameters,
)

from build_uk_dataset import (  # noqa: E402
    compute_row as uk_compute_row,
    load_parameters as uk_load_parameters,
)

from build_ireland_dataset import (  # noqa: E402
    compute_row as ie_compute_row,
    load_parameters as ie_load_parameters,
)

from build_spain_dataset import (  # noqa: E402
    compute_row as es_compute_row,
    load_parameters as es_load_parameters,
)

from build_sweden_dataset import (  # noqa: E402
    compute_row as se_compute_row,
    load_parameters as se_load_parameters,
)

from build_italy_dataset import (  # noqa: E402
    compute_row as it_compute_row,
    load_parameters as it_load_parameters,
)

from us_payroll_2026 import (  # noqa: E402
    compute_us_payroll_2026,
    STATE_DATA_2026 as US_STATE_DATA_2026,
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
    income_tax = indicators["income_tax_monthly"]
    net_after_income_tax = indicators["net_after_income_tax_monthly"]

    social_wedge_before_income_tax_rate = None
    if employer_cost and net_before_income_tax is not None:
        social_wedge_before_income_tax_rate = (
            (employer_cost - net_before_income_tax) / employer_cost
        )

    total_wedge_after_income_tax_rate = None
    if employer_cost and net_after_income_tax is not None:
        total_wedge_after_income_tax_rate = (
            (employer_cost - net_after_income_tax) / employer_cost
        )

    cost_to_net_before_income_tax_ratio = None
    if net_before_income_tax:
        cost_to_net_before_income_tax_ratio = employer_cost / net_before_income_tax

    cost_to_net_after_income_tax_ratio = None
    if net_after_income_tax:
        cost_to_net_after_income_tax_ratio = employer_cost / net_after_income_tax

    row = base_row(
        country="France",
        country_code="FR",
        currency_code="EUR",
        reference_profile_id=profile_id,
        reference_profile_description=(
            "Non-executive employee, outside Alsace-Moselle, firm with "
            "fewer than 50 employees, standard AT/MP rate, full-time. "
            "Income tax: single, childless taxpayer (1 part), progressive "
            "bareme."
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
            "income_tax_or_withholding_tax_monthly_local": round_money(income_tax),
            "income_tax_or_withholding_tax_monthly_intl_usd": round_money(income_tax / ppp_factor),
            "net_after_income_tax_monthly_local": round_money(net_after_income_tax),
            "net_after_income_tax_monthly_intl_usd": round_money(net_after_income_tax / ppp_factor),
            "employer_cost_monthly_local": round_money(employer_cost),
            "employer_cost_monthly_intl_usd": round_money(employer_cost / ppp_factor),
            "social_wedge_before_income_tax_rate": (
                round(social_wedge_before_income_tax_rate, 6)
                if social_wedge_before_income_tax_rate is not None
                else None
            ),
            "total_wedge_after_income_tax_rate": (
                round(total_wedge_after_income_tax_rate, 6)
                if total_wedge_after_income_tax_rate is not None
                else None
            ),
            "cost_to_net_before_income_tax_ratio": (
                round(cost_to_net_before_income_tax_ratio, 6)
                if cost_to_net_before_income_tax_ratio is not None
                else None
            ),
            "cost_to_net_after_income_tax_ratio": (
                round(cost_to_net_after_income_tax_ratio, 6)
                if cost_to_net_after_income_tax_ratio is not None
                else None
            ),
            "income_tax_modeled": True,
            "aggregation_method": "single_reference_profile",
            "below_minimum_wage": bool(gross_used < minimum_wage_monthly_eur),
            "national_minimum_wage_monthly_local": round_money(minimum_wage_monthly_eur),
            "note": (
                "Income tax shown is the actual tax due by a single, "
                "childless reference taxpayer (1 part de quotient "
                "familial), computed via the true progressive income-tax "
                "bareme (marginal brackets) on the annualized net-taxable "
                "salary after the standard 10% deduction; see methodology "
                "notes."
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


# ---------------------------------------------------------------------------
# Netherlands
# ---------------------------------------------------------------------------

def compute_netherlands_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    profile: Dict[str, Any],
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    gross_local = wage_point_intl_usd * ppp_factor
    wage_reference = parameters["wage_reference"]["gross_monthly_eur"]
    smic_multiple = gross_local / wage_reference

    result = nl_compute_row(profile, smic_multiple, parameters)

    employer_cost = result["employer_cost_monthly_eur"]
    net_before_income_tax = result["net_before_income_tax_monthly_eur"]
    net_after_income_tax = result["net_after_loonheffing_monthly_eur"]
    income_tax = result["loonheffing_monthly_eur"]

    row = base_row(
        country="Netherlands",
        country_code="NL",
        currency_code="EUR",
        reference_profile_id=profile["profile_id"],
        reference_profile_description=(
            "Permanent contract (WW low rate), large employer (Aof high "
            "rate), single, childless, below AOW age, standard "
            "loonheffingskorting (main/only job)."
        ),
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    cost_to_net_ratio = result["cost_to_net_ratio"]
    cost_to_net_after_ratio = result["cost_to_net_after_loonheffing_ratio"]

    row.update(
        {
            "gross_monthly_local": round_money(result["gross_monthly_eur"]),
            "gross_monthly_intl_usd": round_money(result["gross_monthly_eur"] / ppp_factor),
            "employee_contributions_monthly_local": 0.0,
            "employee_contributions_monthly_intl_usd": 0.0,
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
            "note": (
                "The Netherlands has no separate employee social-security "
                "contribution: AOW/Anw/Wlz national-insurance premiums are "
                "bundled into the Box 1 wage-tax rate. The figure shown as "
                "income tax is the full 'loonheffing' (income tax + "
                "national insurance combined); employee_contributions is "
                "0 by construction, not because no social insurance is "
                "paid."
            ),
        }
    )

    return row


# ---------------------------------------------------------------------------
# United Kingdom (population-weighted average across rUK and Scotland)
# ---------------------------------------------------------------------------

def compute_uk_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    uk_profiles_by_region: Dict[str, Dict[str, Any]],
    region_weights: Dict[str, float],
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    gross_local = wage_point_intl_usd * ppp_factor
    wage_reference = parameters["wage_reference"]["gross_monthly_gbp"]
    smic_multiple = gross_local / wage_reference

    weighted_sums = {
        "employee_contrib": 0.0,
        "employer_contrib": 0.0,
        "net_before_tax": 0.0,
        "income_tax": 0.0,
        "net_after_tax": 0.0,
        "employer_cost": 0.0,
    }

    for region, weight in region_weights.items():
        result = uk_compute_row(uk_profiles_by_region[region], smic_multiple, parameters)

        weighted_sums["employee_contrib"] += weight * result["employee_contributions_monthly_gbp"]
        weighted_sums["employer_contrib"] += weight * result["employer_contributions_monthly_gbp"]
        weighted_sums["net_before_tax"] += weight * result["net_before_income_tax_monthly_gbp"]
        weighted_sums["income_tax"] += weight * result["income_tax_monthly_gbp"]
        weighted_sums["net_after_tax"] += weight * result["net_after_income_tax_monthly_gbp"]
        weighted_sums["employer_cost"] += weight * result["employer_cost_monthly_gbp"]

    employer_cost = weighted_sums["employer_cost"]
    net_before_income_tax = weighted_sums["net_before_tax"]
    net_after_income_tax = weighted_sums["net_after_tax"]
    income_tax = weighted_sums["income_tax"]

    row = base_row(
        country="United Kingdom",
        country_code="UK",
        currency_code="GBP",
        reference_profile_id="uk__population_weighted_average_ruk_scotland",
        reference_profile_description=(
            "Population-weighted average of rUK (England, Wales, Northern "
            "Ireland) and Scotland income-tax regimes, standard employee, "
            "full-time, standard tax code, auto-enrolled in a workplace "
            "pension at the statutory minimum rates."
        ),
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    row.update(
        {
            "gross_monthly_local": round_money(gross_local),
            "gross_monthly_intl_usd": round_money(gross_local / ppp_factor),
            "employee_contributions_monthly_local": round_money(weighted_sums["employee_contrib"]),
            "employee_contributions_monthly_intl_usd": round_money(weighted_sums["employee_contrib"] / ppp_factor),
            "employer_contributions_monthly_local": round_money(weighted_sums["employer_contrib"]),
            "employer_contributions_monthly_intl_usd": round_money(weighted_sums["employer_contrib"] / ppp_factor),
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
            "aggregation_method": "population_weighted_average_ruk_scotland",
            "below_minimum_wage": bool(gross_local < wage_reference),
            "national_minimum_wage_monthly_local": round_money(wage_reference),
            "note": (
                "Employee/employer contributions include Class 1 National "
                "Insurance and the statutory-minimum automatic-enrolment "
                "workplace pension (employee 5%, employer 3% of qualifying "
                "earnings), not income tax alone. Income tax is a "
                "population-weighted average of rUK and Scottish devolved "
                "bands (ONS/NRS mid-2024 population estimates)."
            ),
        }
    )

    return row


def compute_ireland_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    profile: Dict[str, Any],
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    gross_local = wage_point_intl_usd * ppp_factor
    wage_reference = parameters["wage_reference"]["gross_monthly_eur"]
    smic_multiple = gross_local / wage_reference

    result = ie_compute_row(profile, smic_multiple, parameters)

    employer_cost = result["employer_cost_monthly_eur"]
    net_before_income_tax = result["net_before_income_tax_monthly_eur"]
    net_after_income_tax = result["net_after_income_tax_monthly_eur"]
    income_tax_and_usc = (
        result["income_tax_monthly_eur"]
        + result["usc_monthly_eur"]
    )

    row = base_row(
        country="Ireland",
        country_code="IE",
        currency_code="EUR",
        reference_profile_id=profile["profile_id"],
        reference_profile_description=(
            "Standard, single, childless employee, full-time, PRSI Class A, "
            "January-September 2026 rates."
        ),
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    cost_to_net_ratio = result["cost_to_net_ratio"]
    cost_to_net_after_ratio = result["cost_to_net_after_income_tax_ratio"]

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
            "income_tax_or_withholding_tax_monthly_local": round_money(income_tax_and_usc),
            "income_tax_or_withholding_tax_monthly_intl_usd": round_money(income_tax_and_usc / ppp_factor),
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
            "note": (
                "The income-tax figure shown bundles PAYE income tax and the "
                "Universal Social Charge (USC), since USC is a separate tax "
                "on income rather than a social contribution; "
                "employee/employer contributions are PRSI Class A only "
                "(January-September 2026 rates)."
            ),
        }
    )

    return row


def compute_sweden_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    profile: Dict[str, Any],
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    gross_local = wage_point_intl_usd * ppp_factor
    wage_reference = parameters["wage_reference"]["gross_monthly_sek"]
    smic_multiple = gross_local / wage_reference

    result = se_compute_row(profile, smic_multiple, parameters)

    employer_cost = result["employer_cost_monthly_sek"]
    net_before_income_tax = result["net_before_income_tax_monthly_sek"]
    net_after_income_tax = result["net_after_income_tax_monthly_sek"]
    income_tax = result["income_tax_monthly_sek"]

    row = base_row(
        country="Sweden",
        country_code="SE",
        currency_code="SEK",
        reference_profile_id=profile["profile_id"],
        reference_profile_description=(
            "Standard, single, childless employee, Stockholm kommun as the "
            "reference municipality (kommunalskatt 30.55%)."
        ),
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    cost_to_net_ratio = result["cost_to_net_ratio"]
    cost_to_net_after_ratio = result["cost_to_net_after_income_tax_ratio"]

    row.update(
        {
            "gross_monthly_local": round_money(result["gross_monthly_sek"]),
            "gross_monthly_intl_usd": round_money(result["gross_monthly_sek"] / ppp_factor),
            "employee_contributions_monthly_local": round_money(result["employee_contributions_monthly_sek"]),
            "employee_contributions_monthly_intl_usd": round_money(result["employee_contributions_monthly_sek"] / ppp_factor),
            "employer_contributions_monthly_local": round_money(result["employer_contributions_monthly_sek"]),
            "employer_contributions_monthly_intl_usd": round_money(result["employer_contributions_monthly_sek"] / ppp_factor),
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
            "note": (
                "Sweden has no statutory minimum wage; the reference wage is "
                "the Migrationsverket work-permit wage floor (90% of the SCB "
                "median salary), not a legal minimum or a negotiated "
                "collective-bargaining floor. The 7% allman pensionsavgift "
                "employee pension contribution is fully offset by an equal "
                "skattereduktion across this module's wage range, so "
                "employee_contributions is 0 by construction and the full "
                "payroll tax liability appears under "
                "income_tax_or_withholding_tax. Only Stockholm kommun "
                "(30.55% combined kommunalskatt) is modeled."
            ),
        }
    )

    return row


def compute_italy_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    profile: Dict[str, Any],
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    gross_local = wage_point_intl_usd * ppp_factor
    wage_reference = parameters["wage_reference"]["gross_monthly_eur"]
    smic_multiple = gross_local / wage_reference

    result = it_compute_row(profile, smic_multiple, parameters)

    employer_cost = result["employer_cost_monthly_eur"]
    net_before_income_tax = result["net_before_income_tax_monthly_eur"]
    net_after_income_tax = result["net_after_income_tax_monthly_eur"]
    income_tax = result["income_tax_monthly_eur"]

    row = base_row(
        country="Italy",
        country_code="IT",
        currency_code="EUR",
        reference_profile_id=profile["profile_id"],
        reference_profile_description=(
            "Standard, single, childless private-sector employee, open-ended "
            "contract, firm with more than 50 employees, Roma/Lazio as the "
            "reference region and municipality."
        ),
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    cost_to_net_ratio = result["cost_to_net_ratio"]
    cost_to_net_after_ratio = result["cost_to_net_after_income_tax_ratio"]

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
            "note": (
                "Italy has no statutory minimum wage; the reference wage is "
                "the CCNL Commercio Livello 3 minimo tabellare, a "
                "methodological choice, not a legal minimum. employer_cost "
                "includes the TFR (trattamento di fine rapporto) deferred "
                "severance accrual (~6.91% of gross annual pay), following "
                "standard Italian payroll cost accounting; TFR is a "
                "personnel cost but is not available to the employee as "
                "current net pay. Income tax bundles national IRPEF plus "
                "the Lazio addizionale regionale and Roma addizionale "
                "comunale (both tiered-flat surcharges on the whole taxable "
                "income, not marginal brackets)."
            ),
        }
    )

    return row


def compute_usa_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    state_weights: Dict[str, float],
    wage_reference_monthly_usd: float,
) -> Dict[str, Any]:
    gross_local_usd = wage_point_intl_usd * ppp_factor

    weighted_sums = {
        "employee_contrib": 0.0,
        "employer_contrib": 0.0,
        "net_before_tax": 0.0,
        "income_tax": 0.0,
        "net_after_tax": 0.0,
        "employer_cost": 0.0,
    }

    for state_code, weight in state_weights.items():
        result = compute_us_payroll_2026(gross_local_usd, state_code)

        employee_contrib = result["employee_contributions_monthly_usd"]
        employer_contrib = result["employer_contributions_monthly_usd"]
        income_tax = result["income_tax_monthly_usd"]
        net_before_tax = gross_local_usd - employee_contrib
        net_after_tax = net_before_tax - income_tax
        employer_cost = gross_local_usd + employer_contrib

        weighted_sums["employee_contrib"] += weight * employee_contrib
        weighted_sums["employer_contrib"] += weight * employer_contrib
        weighted_sums["net_before_tax"] += weight * net_before_tax
        weighted_sums["income_tax"] += weight * income_tax
        weighted_sums["net_after_tax"] += weight * net_after_tax
        weighted_sums["employer_cost"] += weight * employer_cost

    employer_cost = weighted_sums["employer_cost"]
    net_before_income_tax = weighted_sums["net_before_tax"]
    net_after_income_tax = weighted_sums["net_after_tax"]
    income_tax = weighted_sums["income_tax"]

    row = base_row(
        country="United States",
        country_code="US",
        currency_code="USD",
        reference_profile_id="usa__population_weighted_average_50_states_dc__single_no_child",
        reference_profile_description=(
            "Population-weighted average across all 50 states and the "
            "District of Columbia (2024 Census Bureau estimates), single, "
            "childless employee, federal filing status only."
        ),
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    row.update(
        {
            "gross_monthly_local": round_money(gross_local_usd),
            "gross_monthly_intl_usd": round_money(gross_local_usd / ppp_factor),
            "employee_contributions_monthly_local": round_money(weighted_sums["employee_contrib"]),
            "employee_contributions_monthly_intl_usd": round_money(weighted_sums["employee_contrib"] / ppp_factor),
            "employer_contributions_monthly_local": round_money(weighted_sums["employer_contrib"]),
            "employer_contributions_monthly_intl_usd": round_money(weighted_sums["employer_contrib"] / ppp_factor),
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
            "aggregation_method": "population_weighted_average_50_states_dc",
            "below_minimum_wage": bool(gross_local_usd < wage_reference_monthly_usd),
            "national_minimum_wage_monthly_local": round_money(wage_reference_monthly_usd),
            "note": (
                "Federal income tax, FICA (Social Security + Medicare, "
                "including the Additional Medicare Tax) and FUTA are "
                "identical nationwide; employee_contributions, "
                "employer_contributions and income_tax_or_withholding_tax "
                "are a population-weighted average of the federal figures "
                "plus each of the 50 states' and DC's own income tax, SUI, "
                "and any state-mandated payroll deduction (SDI/PFML/TDI/"
                "etc. in California, Colorado, Connecticut, Delaware, DC, "
                "Massachusetts, Maine, Minnesota, New Jersey, New York, "
                "Oregon, Rhode Island and Washington). The reference wage "
                "is the federal minimum wage (USD 7.25/hour); many states "
                "and cities set substantially higher minimum wages."
            ),
        }
    )

    return row


def compute_spain_row(
    wage_point_intl_usd: float,
    ppp_factor: float,
    es_profiles_by_region: Dict[str, Dict[str, Any]],
    region_weights: Dict[str, float],
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    gross_local = wage_point_intl_usd * ppp_factor
    wage_reference = parameters["wage_reference"]["gross_monthly_eur"]
    smic_multiple = gross_local / wage_reference

    weighted_sums = {
        "employee_contrib": 0.0,
        "employer_contrib": 0.0,
        "net_before_tax": 0.0,
        "irpf": 0.0,
        "net_after_tax": 0.0,
        "employer_cost": 0.0,
    }

    for region, weight in region_weights.items():
        result = es_compute_row(es_profiles_by_region[region], smic_multiple, parameters)

        weighted_sums["employee_contrib"] += weight * result["employee_contributions_monthly_eur"]
        weighted_sums["employer_contrib"] += weight * result["employer_contributions_monthly_eur"]
        weighted_sums["net_before_tax"] += weight * result["net_before_income_tax_monthly_eur"]
        weighted_sums["irpf"] += weight * result["irpf_monthly_eur"]
        weighted_sums["net_after_tax"] += weight * result["net_after_income_tax_monthly_eur"]
        weighted_sums["employer_cost"] += weight * result["employer_cost_monthly_eur"]

    employer_cost = weighted_sums["employer_cost"]
    net_before_income_tax = weighted_sums["net_before_tax"]
    net_after_income_tax = weighted_sums["net_after_tax"]
    income_tax = weighted_sums["irpf"]

    row = base_row(
        country="Spain",
        country_code="ES",
        currency_code="EUR",
        reference_profile_id="spain__population_weighted_average_16_regions",
        reference_profile_description=(
            "Population-weighted average across 16 comunidades autonomas "
            "(Madrid, Andalucia, Aragon, Asturias, Baleares, Canarias, "
            "Cantabria, Castilla-La Mancha, Castilla y Leon, Cataluna, "
            "Extremadura, Galicia, Murcia, La Rioja, Comunidad Valenciana, "
            "Ceuta/Melilla), standard single childless employee, Seguridad "
            "Social Regimen General."
        ),
        harmonized_wage_point_intl_usd=wage_point_intl_usd,
        ppp_factor=ppp_factor,
    )

    row.update(
        {
            "gross_monthly_local": round_money(gross_local),
            "gross_monthly_intl_usd": round_money(gross_local / ppp_factor),
            "employee_contributions_monthly_local": round_money(weighted_sums["employee_contrib"]),
            "employee_contributions_monthly_intl_usd": round_money(weighted_sums["employee_contrib"] / ppp_factor),
            "employer_contributions_monthly_local": round_money(weighted_sums["employer_contrib"]),
            "employer_contributions_monthly_intl_usd": round_money(weighted_sums["employer_contrib"] / ppp_factor),
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
            "aggregation_method": "population_weighted_average_16_regions",
            "below_minimum_wage": bool(gross_local < wage_reference),
            "national_minimum_wage_monthly_local": round_money(wage_reference),
            "note": (
                "Income tax (IRPF) is a population-weighted average across "
                "16 comunidades autonomas (INE 1 January 2025 population), "
                "mirroring how Switzerland's cantons are aggregated. Navarra "
                "and Pais Vasco are excluded: separate 'foral' tax systems, "
                "out of scope. Employee/employer contributions are "
                "Seguridad Social Regimen General only, national and "
                "identical across all regions."
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

    # --- Netherlands setup ---
    nl_parameters = nl_load_parameters()
    nl_profile_id = parameters["reference_profiles"]["NL"]["profile_id"]
    nl_profile = next(
        profile for profile in nl_parameters["profiles"]
        if profile["profile_id"] == nl_profile_id
    )

    # --- United Kingdom setup ---
    uk_parameters = uk_load_parameters()
    uk_profiles_by_region = {
        profile["region"]: profile
        for profile in uk_parameters["profiles"]
    }

    uk_region_population = {
        region["code"]: region["population"]
        for region in parameters["uk_region_population_weights"]["regions"]
    }
    uk_total_population = sum(uk_region_population.values())
    uk_region_weights = {
        code: population / uk_total_population
        for code, population in uk_region_population.items()
    }

    # --- Ireland setup ---
    ie_parameters = ie_load_parameters()
    ie_profile_id = parameters["reference_profiles"]["IE"]["profile_id"]
    ie_profile = next(
        profile for profile in ie_parameters["profiles"]
        if profile["profile_id"] == ie_profile_id
    )

    # --- Spain setup ---
    es_parameters = es_load_parameters()
    es_profiles_by_region = {
        profile["region_code"]: profile
        for profile in es_parameters["profiles"]
    }

    es_region_population = {
        region["region_code"]: region["population"]
        for region in es_parameters["regions"]["list"]
    }
    es_total_population = sum(es_region_population.values())
    es_region_weights = {
        code: population / es_total_population
        for code, population in es_region_population.items()
    }

    # --- Sweden setup ---
    se_parameters = se_load_parameters()
    se_profile_id = parameters["reference_profiles"]["SE"]["profile_id"]
    se_profile = next(
        profile for profile in se_parameters["profiles"]
        if profile["profile_id"] == se_profile_id
    )

    # --- Italy setup ---
    it_parameters = it_load_parameters()
    it_profile_id = parameters["reference_profiles"]["IT"]["profile_id"]
    it_profile = next(
        profile for profile in it_parameters["profiles"]
        if profile["profile_id"] == it_profile_id
    )

    # --- USA setup ---
    us_total_population = sum(state["population"] for state in US_STATE_DATA_2026.values())
    us_state_weights = {
        code: state["population"] / us_total_population
        for code, state in US_STATE_DATA_2026.items()
    }
    us_wage_reference_monthly_usd = 7.25 * 40.0 * 52.0 / 12.0

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

        rows.append(
            compute_netherlands_row(
                wage_point,
                ppp_values["NL"],
                nl_profile,
                nl_parameters,
            )
        )

        rows.append(
            compute_uk_row(
                wage_point,
                ppp_values["UK"],
                uk_profiles_by_region,
                uk_region_weights,
                uk_parameters,
            )
        )

        rows.append(
            compute_ireland_row(
                wage_point,
                ppp_values["IE"],
                ie_profile,
                ie_parameters,
            )
        )

        rows.append(
            compute_spain_row(
                wage_point,
                ppp_values["ES"],
                es_profiles_by_region,
                es_region_weights,
                es_parameters,
            )
        )

        rows.append(
            compute_sweden_row(
                wage_point,
                ppp_values["SE"],
                se_profile,
                se_parameters,
            )
        )

        rows.append(
            compute_italy_row(
                wage_point,
                ppp_values["IT"],
                it_profile,
                it_parameters,
            )
        )

        rows.append(
            compute_usa_row(
                wage_point,
                ppp_values["US"],
                us_state_weights,
                us_wage_reference_monthly_usd,
            )
        )

    dataset = pd.DataFrame(rows)

    dataset["flcl_e_before_income_tax"] = (
        100
        * dataset["net_before_income_tax_monthly_intl_usd"]
        / dataset["employer_cost_monthly_intl_usd"]
    )

    return dataset


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
