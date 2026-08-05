"""
UK PAYE income tax, Class 1 National Insurance and automatic-enrolment
workplace pension engine for the 2026/27 tax year.

Scope
-----
This module implements the central research scenario for the UK Labour
Cost Lab module:

- employee resident in England, Wales or Northern Ireland (rUK income-tax
  bands; Scotland has its own devolved bands and is not modelled here);
- standard tax code (full personal allowance, no marriage allowance, no
  student loan deductions, no benefits in kind);
- single job, standard cumulative PAYE tax code;
- auto-enrolled in a qualifying workplace pension at the statutory
  minimum contribution rates, on a "net pay arrangement" basis (pension
  contribution deducted from pay before income tax is calculated, but
  after -- i.e. with no effect on -- National Insurance, matching how
  standard non-salary-sacrifice pension contributions are treated);
- no overtime, bonuses or other exceptional payments.

Figures used (2026/27 tax year, effective from 6 April 2026):
- Personal Allowance: GBP 12,570/year, tapered by GBP 1 for every GBP 2 of
  income above GBP 100,000, reaching GBP 0 at GBP 125,140.
- Income tax bands (rUK): 0% up to the Personal Allowance; 20% (basic
  rate) up to GBP 50,270; 40% (higher rate) up to GBP 125,140; 45%
  (additional rate) above.
- Class 1 National Insurance: employee 8% between the Primary Threshold
  (GBP 12,570/year) and the Upper Earnings Limit (GBP 50,270/year), 2%
  above; employer 15% above the Secondary Threshold (GBP 5,000/year), no
  upper limit.
- Automatic-enrolment workplace pension: minimum total contribution 8% of
  qualifying earnings (band GBP 6,240 to GBP 50,270/year), of which at
  least 3% is the employer's share; the reference profile uses the
  statutory minimum split (employer 3%, employee 5%).
"""


def round_pence(value: float) -> float:
    """
    Round to the nearest penny.
    """
    return round(float(value) + 1e-12, 2)


def compute_qualifying_earnings(
    annual_gross_gbp: float,
    lower_gbp: float,
    upper_gbp: float,
) -> float:
    """
    Band of earnings used for automatic-enrolment pension contributions:
    only the slice of annual gross pay between the lower and upper
    qualifying-earnings limits counts.
    """
    if annual_gross_gbp <= lower_gbp:
        return 0.0

    banded = min(annual_gross_gbp, upper_gbp) - lower_gbp

    return max(0.0, banded)


def compute_personal_allowance_2026(annual_net_income_gbp: float) -> float:
    """
    Personal Allowance for 2026/27, tapered by GBP 1 for every GBP 2 of
    net income above GBP 100,000, floored at 0 (reached at GBP 125,140).
    """
    standard_allowance = 12570.00
    taper_threshold = 100000.00

    if annual_net_income_gbp <= taper_threshold:
        return standard_allowance

    reduction = (annual_net_income_gbp - taper_threshold) / 2.0

    return max(0.0, standard_allowance - reduction)


def compute_income_tax_2026(taxable_income_after_allowance_gbp: float) -> float:
    """
    2026/27 rUK income tax, marginal brackets, applied to income already
    net of the (tapered) Personal Allowance.
    """
    x = max(0.0, taxable_income_after_allowance_gbp)

    basic_rate_band = 37700.00
    higher_rate_band_upper = 125140.00 - 12570.00

    if x <= basic_rate_band:
        tax = 0.20 * x
    elif x <= higher_rate_band_upper:
        tax = 0.20 * basic_rate_band + 0.40 * (x - basic_rate_band)
    else:
        tax = (
            0.20 * basic_rate_band
            + 0.40 * (higher_rate_band_upper - basic_rate_band)
            + 0.45 * (x - higher_rate_band_upper)
        )

    return round_pence(tax)


def compute_employee_ni_2026(annual_gross_gbp: float) -> float:
    """
    2026/27 employee (primary) Class 1 National Insurance: 8% between the
    Primary Threshold and the Upper Earnings Limit, 2% above.
    """
    primary_threshold = 12570.00
    upper_earnings_limit = 50270.00

    x = max(0.0, annual_gross_gbp)

    if x <= primary_threshold:
        ni = 0.0
    elif x <= upper_earnings_limit:
        ni = 0.08 * (x - primary_threshold)
    else:
        ni = (
            0.08 * (upper_earnings_limit - primary_threshold)
            + 0.02 * (x - upper_earnings_limit)
        )

    return round_pence(ni)


def compute_employer_ni_2026(annual_gross_gbp: float) -> float:
    """
    2026/27 employer (secondary) Class 1 National Insurance: 15% above the
    Secondary Threshold, no upper limit.
    """
    secondary_threshold = 5000.00

    x = max(0.0, annual_gross_gbp)

    if x <= secondary_threshold:
        return 0.0

    return round_pence(0.15 * (x - secondary_threshold))


def compute_uk_paye_ni_pension_2026(gross_monthly_gbp: float) -> dict:
    """
    Compute the full monthly PAYE / NI / auto-enrolment pension picture for
    the standard reference employee.

    Returns
    -------
    dict
        Detailed calculation fields (all monthly amounts in GBP unless
        noted otherwise).
    """
    gross_monthly_gbp = round_pence(gross_monthly_gbp)
    annual_gross_gbp = round_pence(gross_monthly_gbp * 12.0)

    qualifying_earnings_band = {
        "lower_gbp": 6240.00,
        "upper_gbp": 50270.00,
    }

    annual_qualifying_earnings = compute_qualifying_earnings(
        annual_gross_gbp,
        qualifying_earnings_band["lower_gbp"],
        qualifying_earnings_band["upper_gbp"],
    )

    annual_employee_pension = round_pence(0.05 * annual_qualifying_earnings)
    annual_employer_pension = round_pence(0.03 * annual_qualifying_earnings)

    # Net pay arrangement: the employee pension contribution reduces
    # taxable pay, but not NI-able pay.
    annual_taxable_gross = round_pence(
        max(0.0, annual_gross_gbp - annual_employee_pension)
    )

    personal_allowance = compute_personal_allowance_2026(annual_taxable_gross)
    annual_taxable_income = round_pence(
        max(0.0, annual_taxable_gross - personal_allowance)
    )

    annual_income_tax = compute_income_tax_2026(annual_taxable_income)
    annual_employee_ni = compute_employee_ni_2026(annual_gross_gbp)
    annual_employer_ni = compute_employer_ni_2026(annual_gross_gbp)

    income_tax_monthly = round_pence(annual_income_tax / 12.0)
    employee_ni_monthly = round_pence(annual_employee_ni / 12.0)
    employer_ni_monthly = round_pence(annual_employer_ni / 12.0)
    employee_pension_monthly = round_pence(annual_employee_pension / 12.0)
    employer_pension_monthly = round_pence(annual_employer_pension / 12.0)

    return {
        "annual_gross_gbp": annual_gross_gbp,
        "personal_allowance_gbp": personal_allowance,
        "annual_taxable_income_gbp": annual_taxable_income,
        "annual_income_tax_gbp": annual_income_tax,
        "annual_employee_ni_gbp": annual_employee_ni,
        "annual_employer_ni_gbp": annual_employer_ni,
        "annual_employee_pension_gbp": annual_employee_pension,
        "annual_employer_pension_gbp": annual_employer_pension,
        "income_tax_monthly_gbp": income_tax_monthly,
        "employee_ni_monthly_gbp": employee_ni_monthly,
        "employer_ni_monthly_gbp": employer_ni_monthly,
        "employee_pension_monthly_gbp": employee_pension_monthly,
        "employer_pension_monthly_gbp": employer_pension_monthly,
    }
