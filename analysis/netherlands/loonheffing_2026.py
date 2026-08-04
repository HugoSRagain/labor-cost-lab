"""
Dutch wage-tax withholding engine ("loonheffing") for 2026.

Scope
-----
This module implements the 2026 Box 1 wage-tax calculation for the central
research scenario used in the Netherlands Labour Cost Lab:

- employee remuneration paid monthly, stable across the year;
- resident of the Netherlands, below AOW (state pension) age;
- single taxpayer, no partner, no children;
- entitled to the standard "loonheffingskorting" (algemene heffingskorting +
  arbeidskorting), i.e. this is the employee's main/only job;
- no pension contributions, no other deductions from the tax base.

Unlike France, Germany, Belgium and Switzerland, the Netherlands has no
separate visible "employee social security contribution" line: the AOW
(old-age), Anw (survivors) and Wlz (long-term care) national-insurance
premiums are already bundled into the Box 1 bracket-1 rate below. The
"loonheffing" computed here therefore already represents the full payroll
deduction (income tax + national insurance combined) -- there is nothing
else to subtract from gross pay to reach net pay.

The calculation follows the official 2026 Belastingdienst tables:
A. annual Box 1 tax (progressive, marginal brackets)
B. annual algemene heffingskorting (general tax credit)
C. annual arbeidskorting (employment tax credit)
D. annual loonheffing = A - B - C, floored at 0
E. monthly loonheffing = D / 12

Amounts are rounded to the nearest euro cent at each step.
"""


def round_cent(value: float) -> float:
    """
    Round to the nearest euro cent.
    """
    return round(float(value) + 1e-12, 2)


def compute_box1_tax_2026(annual_income_eur: float) -> float:
    """
    Compute the 2026 Box 1 wage tax (below AOW age), progressive marginal
    brackets. The bracket-1 rate already includes the AOW/Anw/Wlz national
    insurance premium component.
    """
    x = round_cent(max(0.0, annual_income_eur))

    bracket_1_upper = 38883.00
    bracket_2_upper = 78426.00

    if x <= bracket_1_upper:
        tax = 0.3575 * x
    elif x <= bracket_2_upper:
        tax = 0.3575 * bracket_1_upper + 0.3756 * (x - bracket_1_upper)
    else:
        tax = (
            0.3575 * bracket_1_upper
            + 0.3756 * (bracket_2_upper - bracket_1_upper)
            + 0.4950 * (x - bracket_2_upper)
        )

    return round_cent(tax)


def compute_algemene_heffingskorting_2026(annual_income_eur: float) -> float:
    """
    Compute the 2026 algemene heffingskorting (general tax credit), below
    AOW age.
    """
    x = round_cent(max(0.0, annual_income_eur))

    threshold = 29736.00
    phase_out_end = 78426.00
    maximum = 3115.00
    phase_out_rate = 0.06398

    if x <= threshold:
        credit = maximum
    elif x <= phase_out_end:
        credit = maximum - phase_out_rate * (x - threshold)
    else:
        credit = 0.0

    return round_cent(max(0.0, credit))


def compute_arbeidskorting_2026(annual_income_eur: float) -> float:
    """
    Compute the 2026 arbeidskorting (employment tax credit), below AOW age.
    """
    x = round_cent(max(0.0, annual_income_eur))

    band_1_upper = 11965.00
    band_2_upper = 25845.00
    band_3_upper = 45592.00
    band_4_upper = 132920.00

    if x <= band_1_upper:
        credit = 0.08324 * x
    elif x <= band_2_upper:
        credit = 996.00 + 0.31009 * (x - band_1_upper)
    elif x <= band_3_upper:
        credit = 5300.00 + 0.01950 * (x - band_2_upper)
    elif x <= band_4_upper:
        credit = 5685.00 - 0.06510 * (x - band_3_upper)
    else:
        credit = 0.0

    return round_cent(max(0.0, credit))


def compute_loonheffing_2026(gross_monthly_eur: float) -> dict:
    """
    Compute monthly Dutch loonheffing (wage tax + bundled national
    insurance) for the standard single/childless employee scenario.

    Parameters
    ----------
    gross_monthly_eur:
        Monthly gross wage.

    Returns
    -------
    dict
        Detailed calculation fields.
    """
    gross_monthly_eur = round_cent(gross_monthly_eur)

    annual_income_eur = round_cent(gross_monthly_eur * 12.0)

    annual_box1_tax_eur = compute_box1_tax_2026(annual_income_eur)
    annual_algemene_heffingskorting_eur = compute_algemene_heffingskorting_2026(
        annual_income_eur
    )
    annual_arbeidskorting_eur = compute_arbeidskorting_2026(annual_income_eur)

    annual_loonheffing_eur = round_cent(
        max(
            0.0,
            annual_box1_tax_eur
            - annual_algemene_heffingskorting_eur
            - annual_arbeidskorting_eur,
        )
    )

    loonheffing_monthly_eur = round_cent(annual_loonheffing_eur / 12.0)

    return {
        "annual_income_eur": annual_income_eur,
        "annual_box1_tax_eur": annual_box1_tax_eur,
        "annual_algemene_heffingskorting_eur": annual_algemene_heffingskorting_eur,
        "annual_arbeidskorting_eur": annual_arbeidskorting_eur,
        "annual_loonheffing_eur": annual_loonheffing_eur,
        "loonheffing_monthly_eur": loonheffing_monthly_eur,
    }
