"""
Swiss Labour Cost Lab
Social contribution engine for 2026.

This module computes a standardized Swiss employee / employer social
contribution profile. It is not an individual Swiss payslip calculator.

Scope:
- AHV / IV / EO
- Unemployment insurance
- Standardized occupational pension contribution
- Standardized accident insurance contribution
- Net before income tax
- Employer cost
- Social wedge

Fiscal withholding tax by canton is intentionally handled separately.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict


@dataclass(frozen=True)
class SwissSocialParameters:
    """Core Swiss social contribution parameters."""

    ahv_iv_eo_employee_rate: float = 0.053
    ahv_iv_eo_employer_rate: float = 0.053

    unemployment_employee_rate: float = 0.011
    unemployment_employer_rate: float = 0.011
    unemployment_annual_ceiling_chf: float = 148_200.0

    lpp_entry_threshold_annual_chf: float = 22_680.0
    lpp_coordination_deduction_annual_chf: float = 26_460.0
    lpp_maximum_insured_salary_annual_chf: float = 90_720.0
    lpp_minimum_coordinated_salary_annual_chf: float = 3_780.0

    lpp_total_savings_rate: float = 0.10
    lpp_employee_share: float = 0.50
    lpp_employer_share: float = 0.50

    employee_non_occupational_accident_rate: float = 0.012
    employer_occupational_accident_rate: float = 0.005
    accident_annual_ceiling_chf: float = 148_200.0


def round_chf(value: float) -> float:
    """Round monetary values to cents."""
    return round(float(value), 2)


def capped_annual_salary(
    gross_annual_chf: float,
    annual_ceiling_chf: float,
) -> float:
    """Return annual salary capped at the applicable insured ceiling."""
    return min(
        max(float(gross_annual_chf), 0.0),
        float(annual_ceiling_chf),
    )


def compute_lpp_coordinated_salary(
    gross_annual_chf: float,
    params: SwissSocialParameters,
) -> float:
    """
    Compute the standardized annual coordinated salary for LPP/BVG.

    If the annual wage is below the LPP entry threshold, no occupational
    pension contribution is computed.

    Above the entry threshold, the coordinated salary is:
        min(gross annual wage, maximum insured salary)
        - coordination deduction

    with a minimum coordinated salary applied when the result is positive.
    """

    gross_annual = max(float(gross_annual_chf), 0.0)

    if gross_annual < params.lpp_entry_threshold_annual_chf:
        return 0.0

    insured_salary = min(
        gross_annual,
        params.lpp_maximum_insured_salary_annual_chf,
    )

    coordinated_salary = (
        insured_salary
        - params.lpp_coordination_deduction_annual_chf
    )

    if coordinated_salary <= 0:
        return 0.0

    return max(
        coordinated_salary,
        params.lpp_minimum_coordinated_salary_annual_chf,
    )


def compute_swiss_social_contributions(
    gross_monthly_chf: float,
    params: SwissSocialParameters | None = None,
) -> Dict[str, float]:
    """
    Compute standardized Swiss social contributions for a monthly gross wage.

    Parameters
    ----------
    gross_monthly_chf:
        Monthly gross wage in CHF.
    params:
        SwissSocialParameters instance. If None, default 2026 parameters
        are used.

    Returns
    -------
    dict
        Dictionary with monthly and annual values.
    """

    if params is None:
        params = SwissSocialParameters()

    gross_monthly = round_chf(max(float(gross_monthly_chf), 0.0))
    gross_annual = round_chf(gross_monthly * 12.0)

    unemployment_base_annual = capped_annual_salary(
        gross_annual,
        params.unemployment_annual_ceiling_chf,
    )

    accident_base_annual = capped_annual_salary(
        gross_annual,
        params.accident_annual_ceiling_chf,
    )

    lpp_coordinated_salary_annual = compute_lpp_coordinated_salary(
        gross_annual,
        params,
    )

    employee_ahv_iv_eo_annual = (
        gross_annual
        * params.ahv_iv_eo_employee_rate
    )

    employer_ahv_iv_eo_annual = (
        gross_annual
        * params.ahv_iv_eo_employer_rate
    )

    employee_unemployment_annual = (
        unemployment_base_annual
        * params.unemployment_employee_rate
    )

    employer_unemployment_annual = (
        unemployment_base_annual
        * params.unemployment_employer_rate
    )

    employee_lpp_annual = (
        lpp_coordinated_salary_annual
        * params.lpp_total_savings_rate
        * params.lpp_employee_share
    )

    employer_lpp_annual = (
        lpp_coordinated_salary_annual
        * params.lpp_total_savings_rate
        * params.lpp_employer_share
    )

    employee_accident_annual = (
        accident_base_annual
        * params.employee_non_occupational_accident_rate
    )

    employer_accident_annual = (
        accident_base_annual
        * params.employer_occupational_accident_rate
    )

    employee_total_contrib_annual = (
        employee_ahv_iv_eo_annual
        + employee_unemployment_annual
        + employee_lpp_annual
        + employee_accident_annual
    )

    employer_total_contrib_annual = (
        employer_ahv_iv_eo_annual
        + employer_unemployment_annual
        + employer_lpp_annual
        + employer_accident_annual
    )

    net_before_tax_annual = (
        gross_annual
        - employee_total_contrib_annual
    )

    employer_cost_annual = (
        gross_annual
        + employer_total_contrib_annual
    )

    social_wedge_annual = (
        employer_cost_annual
        - net_before_tax_annual
    )

    employee_total_contrib_monthly = employee_total_contrib_annual / 12.0
    employer_total_contrib_monthly = employer_total_contrib_annual / 12.0
    net_before_tax_monthly = net_before_tax_annual / 12.0
    employer_cost_monthly = employer_cost_annual / 12.0
    social_wedge_monthly = social_wedge_annual / 12.0

    employee_contribution_rate = (
        employee_total_contrib_monthly / gross_monthly
        if gross_monthly > 0
        else 0.0
    )

    employer_contribution_rate = (
        employer_total_contrib_monthly / gross_monthly
        if gross_monthly > 0
        else 0.0
    )

    social_wedge_rate_employer_cost = (
        social_wedge_monthly / employer_cost_monthly
        if employer_cost_monthly > 0
        else 0.0
    )

    cost_to_net_before_tax_ratio = (
        employer_cost_monthly / net_before_tax_monthly
        if net_before_tax_monthly > 0
        else 0.0
    )

    return {
        "gross_monthly_chf": round_chf(gross_monthly),
        "gross_annual_chf": round_chf(gross_annual),

        "unemployment_base_annual_chf": round_chf(unemployment_base_annual),
        "accident_base_annual_chf": round_chf(accident_base_annual),
        "lpp_coordinated_salary_annual_chf": round_chf(
            lpp_coordinated_salary_annual
        ),

        "employee_ahv_iv_eo_monthly_chf": round_chf(
            employee_ahv_iv_eo_annual / 12.0
        ),
        "employee_unemployment_monthly_chf": round_chf(
            employee_unemployment_annual / 12.0
        ),
        "employee_lpp_monthly_chf": round_chf(
            employee_lpp_annual / 12.0
        ),
        "employee_accident_monthly_chf": round_chf(
            employee_accident_annual / 12.0
        ),
        "employee_total_contrib_monthly_chf": round_chf(
            employee_total_contrib_monthly
        ),

        "employer_ahv_iv_eo_monthly_chf": round_chf(
            employer_ahv_iv_eo_annual / 12.0
        ),
        "employer_unemployment_monthly_chf": round_chf(
            employer_unemployment_annual / 12.0
        ),
        "employer_lpp_monthly_chf": round_chf(
            employer_lpp_annual / 12.0
        ),
        "employer_accident_monthly_chf": round_chf(
            employer_accident_annual / 12.0
        ),
        "employer_total_contrib_monthly_chf": round_chf(
            employer_total_contrib_monthly
        ),

        "net_before_tax_monthly_chf": round_chf(net_before_tax_monthly),
        "employer_cost_monthly_chf": round_chf(employer_cost_monthly),
        "social_wedge_monthly_chf": round_chf(social_wedge_monthly),

        "employee_contribution_rate": round(
            employee_contribution_rate,
            8,
        ),
        "employer_contribution_rate": round(
            employer_contribution_rate,
            8,
        ),
        "social_wedge_rate_employer_cost": round(
            social_wedge_rate_employer_cost,
            8,
        ),
        "cost_to_net_before_tax_ratio": round(
            cost_to_net_before_tax_ratio,
            8,
        ),

        "params": asdict(params),
    }


if __name__ == "__main__":
    for wage in [3000, 5000, 8000, 12000, 20000]:
        result = compute_swiss_social_contributions(wage)

        print()
        print(f"Gross monthly wage: {wage:,.0f} CHF")
        print(f"Net before tax: {result['net_before_tax_monthly_chf']:,.2f} CHF")
        print(f"Employer cost: {result['employer_cost_monthly_chf']:,.2f} CHF")
        print(
            "Cost / net before tax:",
            result["cost_to_net_before_tax_ratio"],
        )