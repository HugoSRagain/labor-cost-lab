"""
Belgian withholding tax engine for 2026.

Scope
-----
This module implements the SPF Finances 2026 "formule-clé" for the central
research scenario used in the Belgian Labour Cost Lab:

- employee remuneration paid monthly;
- resident of Belgium ("habitant du Royaume");
- single person / isolated taxpayer;
- no children or other dependants;
- no group insurance deduction;
- no overtime reduction;
- no additional low-wage withholding-tax reduction;
- no exceptional payments.

The calculation follows the 2026 SPF Finances key formula:
A. annual gross income
B. annual taxable net income
C. annual tax
D. monthly withholding tax
E. additional reductions

Amounts are rounded to the nearest euro cent at each step.
"""


def round_cent(value: float) -> float:
    """
    Round to the nearest euro cent.

    Python's built-in round is sufficient here for monetary grid simulations.
    """
    return round(float(value) + 1e-12, 2)


def compute_professional_expenses_2026(annual_gross_tax_base_eur: float) -> float:
    """
    Compute forfaitary professional expenses for employees.

    2026 rule:
    - 30% up to EUR 20,233.33 annual gross tax base;
    - maximum EUR 6,070 above that level.
    """
    annual_gross_tax_base_eur = round_cent(annual_gross_tax_base_eur)

    if annual_gross_tax_base_eur <= 20233.33:
        expenses = 0.30 * annual_gross_tax_base_eur
    else:
        expenses = 6070.00

    return round_cent(expenses)


def compute_basic_tax_2026(annual_taxable_net_income_eur: float) -> float:
    """
    Compute Belgian 2026 base tax using the SPF Finances base schedule.
    """
    x = round_cent(max(0.0, annual_taxable_net_income_eur))

    if x <= 0.0:
        tax = 0.0
    elif x <= 16710.00:
        tax = 0.2675 * x
    elif x <= 29500.00:
        tax = 4469.93 + 0.4280 * (x - 16710.00)
    elif x <= 51050.00:
        tax = 9944.05 + 0.4815 * (x - 29500.00)
    else:
        tax = 20320.38 + 0.5350 * (x - 51050.00)

    return round_cent(tax)


def compute_belgian_withholding_tax_2026(
    gross_monthly_eur: float,
    employee_social_contributions_monthly_eur: float,
) -> dict:
    """
    Compute monthly Belgian withholding tax for the standard employee scenario.

    Parameters
    ----------
    gross_monthly_eur:
        Monthly gross wage.

    employee_social_contributions_monthly_eur:
        Mandatory employee social contributions deducted from gross wage.

    Returns
    -------
    dict
        Detailed calculation fields.
    """
    gross_monthly_eur = round_cent(gross_monthly_eur)
    employee_social_contributions_monthly_eur = round_cent(
        employee_social_contributions_monthly_eur
    )

    monthly_tax_base_before_annualisation = round_cent(
        gross_monthly_eur - employee_social_contributions_monthly_eur
    )

    annual_gross_tax_base_eur = round_cent(
        monthly_tax_base_before_annualisation * 12.0
    )

    professional_expenses_eur = compute_professional_expenses_2026(
        annual_gross_tax_base_eur
    )

    annual_taxable_net_income_eur = round_cent(
        annual_gross_tax_base_eur - professional_expenses_eur
    )

    annual_basic_tax_before_allowance_eur = compute_basic_tax_2026(
        annual_taxable_net_income_eur
    )

    # Isolated taxpayer / spouse has own professional income:
    # base tax is reduced by EUR 2,987.98.
    annual_tax_after_basic_allowance_eur = round_cent(
        max(0.0, annual_basic_tax_before_allowance_eur - 2987.98)
    )

    # No family reductions and no additional reductions in the standard scenario.
    annual_withholding_tax_eur = annual_tax_after_basic_allowance_eur

    monthly_withholding_tax_eur = round_cent(
        max(0.0, annual_withholding_tax_eur / 12.0)
    )

    return {
        "monthly_tax_base_before_annualisation_eur": monthly_tax_base_before_annualisation,
        "annual_gross_tax_base_eur": annual_gross_tax_base_eur,
        "professional_expenses_eur": professional_expenses_eur,
        "annual_taxable_net_income_eur": annual_taxable_net_income_eur,
        "annual_basic_tax_before_allowance_eur": annual_basic_tax_before_allowance_eur,
        "annual_tax_after_basic_allowance_eur": annual_tax_after_basic_allowance_eur,
        "annual_withholding_tax_eur": annual_withholding_tax_eur,
        "withholding_tax_monthly_eur": monthly_withholding_tax_eur,
    }