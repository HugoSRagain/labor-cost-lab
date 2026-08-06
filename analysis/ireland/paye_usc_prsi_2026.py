"""
Irish PAYE income tax, Universal Social Charge (USC) and PRSI (Class A)
engine for the 2026 tax year.

Scope
-----
This module implements the central research scenario for the Ireland
Labour Cost Lab module:

- single, childless PAYE employee, standard rate band and credits only
  (Personal Tax Credit + Employee/PAYE Tax Credit, EUR 2,000 each);
- PRSI Class A (the standard class for most private-sector employees),
  using the January-September 2026 rates (the rates in effect from
  1 January 2026; a further increase to both the employee and employer
  rates and thresholds is scheduled from 1 October 2026 as part of a
  multi-year phased increase, not modelled here -- see
  docs/data/ireland/ireland_sources_2026.json);
- no pension contributions, no other credits or reliefs, no USC exemption
  other than the standard total-income threshold.

Figures used (2026 tax year):
- Income tax: 20% up to the EUR 44,000 standard rate cut-off point (single
  person), 40% above; a EUR 4,000 total non-refundable credit (Personal
  Tax Credit + Employee Tax Credit, EUR 2,000 each) is deducted from the
  gross tax liability, floored at zero.
- USC: full exemption if total annual income is EUR 13,000 or less;
  otherwise 0.5% up to EUR 12,012, 2% up to EUR 28,700, 3% up to
  EUR 70,044, 8% above -- charged from the first euro once the EUR 13,000
  exemption threshold is exceeded.
- PRSI Class A (employee): no PRSI if weekly earnings are EUR 352 or
  below; a tapering PRSI credit (up to EUR 12/week, phased out linearly
  over EUR 352.01-EUR 424/week) smooths the transition; above the taper
  zone, 4.2% of full weekly earnings (not just the amount above the
  threshold -- Irish PRSI is a "class" contribution charged on total
  reckonable pay once liable, unlike a marginal-bracket tax).
- PRSI Class A (employer): 9.0% of full weekly earnings if EUR 496 or
  below, 11.25% of full weekly earnings if above EUR 496 (also a "class"
  step, not a marginal bracket).
"""


def round_cent(value: float) -> float:
    """
    Round to the nearest cent.
    """
    return round(float(value) + 1e-12, 2)


def compute_income_tax_2026(annual_gross_eur: float) -> float:
    """
    2026 PAYE income tax for a single person: 20% up to the EUR 44,000
    standard rate cut-off point, 40% above, less the EUR 4,000 combined
    Personal and Employee (PAYE) tax credits, floored at zero.
    """
    x = max(0.0, annual_gross_eur)

    standard_rate_cutoff = 44000.00
    standard_rate = 0.20
    higher_rate = 0.40
    combined_credits = 2000.00 + 2000.00

    if x <= standard_rate_cutoff:
        gross_tax = standard_rate * x
    else:
        gross_tax = (
            standard_rate * standard_rate_cutoff
            + higher_rate * (x - standard_rate_cutoff)
        )

    return round_cent(max(0.0, gross_tax - combined_credits))


def compute_usc_2026(annual_gross_eur: float) -> float:
    """
    2026 Universal Social Charge: full exemption at or below EUR 13,000
    of total annual income; otherwise a 4-band marginal schedule applied
    from the first euro.
    """
    x = max(0.0, annual_gross_eur)

    exemption_threshold = 13000.00

    if x <= exemption_threshold:
        return 0.0

    band_1 = 12012.00
    band_2 = 28700.00
    band_3 = 70044.00

    if x <= band_1:
        usc = 0.005 * x
    elif x <= band_2:
        usc = (
            0.005 * band_1
            + 0.02 * (x - band_1)
        )
    elif x <= band_3:
        usc = (
            0.005 * band_1
            + 0.02 * (band_2 - band_1)
            + 0.03 * (x - band_2)
        )
    else:
        usc = (
            0.005 * band_1
            + 0.02 * (band_2 - band_1)
            + 0.03 * (band_3 - band_2)
            + 0.08 * (x - band_3)
        )

    return round_cent(usc)


def compute_employee_prsi_2026(weekly_gross_eur: float) -> float:
    """
    2026 (Jan-Sep) PRSI Class A, employee side: exempt at or below
    EUR 352/week; a tapering PRSI credit (max EUR 12/week, phased out
    linearly between EUR 352.01 and EUR 424/week) is subtracted from
    4.2% of full weekly earnings; above EUR 424/week, the credit is fully
    phased out and 4.2% applies to the full weekly amount.
    """
    x = max(0.0, weekly_gross_eur)

    exempt_threshold = 352.00
    taper_upper = 424.00
    rate = 0.042
    max_credit = 12.00

    if x <= exempt_threshold:
        return 0.0

    gross_prsi = rate * x

    credit = max(
        0.0,
        max_credit - (x - exempt_threshold) * (max_credit / (taper_upper - exempt_threshold))
    )

    return round_cent(max(0.0, gross_prsi - credit))


def compute_employer_prsi_2026(weekly_gross_eur: float) -> float:
    """
    2026 (Jan-Sep) PRSI Class A, employer side: 9.0% of full weekly
    earnings at or below EUR 496/week, 11.25% of full weekly earnings
    above EUR 496/week.
    """
    x = max(0.0, weekly_gross_eur)

    reduced_rate_threshold = 496.00
    reduced_rate = 0.09
    standard_rate = 0.1125

    rate = reduced_rate if x <= reduced_rate_threshold else standard_rate

    return round_cent(rate * x)


def compute_ireland_paye_usc_prsi_2026(gross_monthly_eur: float) -> dict:
    """
    Compute the full monthly PAYE / USC / PRSI picture for the standard
    reference employee.

    Returns
    -------
    dict
        Detailed calculation fields (all monthly amounts in EUR unless
        noted otherwise).
    """
    gross_monthly_eur = round_cent(gross_monthly_eur)
    annual_gross_eur = round_cent(gross_monthly_eur * 12.0)
    weekly_gross_eur = round_cent(annual_gross_eur / 52.0)

    annual_income_tax = compute_income_tax_2026(annual_gross_eur)
    annual_usc = compute_usc_2026(annual_gross_eur)

    weekly_employee_prsi = compute_employee_prsi_2026(weekly_gross_eur)
    weekly_employer_prsi = compute_employer_prsi_2026(weekly_gross_eur)

    annual_employee_prsi = round_cent(weekly_employee_prsi * 52.0)
    annual_employer_prsi = round_cent(weekly_employer_prsi * 52.0)

    income_tax_monthly = round_cent(annual_income_tax / 12.0)
    usc_monthly = round_cent(annual_usc / 12.0)
    employee_prsi_monthly = round_cent(annual_employee_prsi / 12.0)
    employer_prsi_monthly = round_cent(annual_employer_prsi / 12.0)

    return {
        "annual_gross_eur": annual_gross_eur,
        "weekly_gross_eur": weekly_gross_eur,
        "annual_income_tax_eur": annual_income_tax,
        "annual_usc_eur": annual_usc,
        "annual_employee_prsi_eur": annual_employee_prsi,
        "annual_employer_prsi_eur": annual_employer_prsi,
        "income_tax_monthly_eur": income_tax_monthly,
        "usc_monthly_eur": usc_monthly,
        "employee_prsi_monthly_eur": employee_prsi_monthly,
        "employer_prsi_monthly_eur": employer_prsi_monthly,
    }
