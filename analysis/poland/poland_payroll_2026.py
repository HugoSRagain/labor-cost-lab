"""
Polish PIT income tax and ZUS/NFZ social contribution engine for the
2026 tax year.

Scope
-----
Single, childless employee on a standard employment contract (umowa o
prace), standard tax scale (skala podatkowa), no special reliefs
(no "ulga dla mlodych" under-26 exemption, no joint filing, no
child/family reliefs, no private pension), single employer, standard
personal income tax deduction (koszty uzyskania przychodu) and the
flat, non-phased-out tax-reducing amount introduced by the 2022
"Polski Lad" reform.

Employee social contributions (ZUS), 2026 rates
---------------------------------------------------
- Retirement (ubezpieczenie emerytalne): 9.76% of gross, capped (see
  below).
- Disability (ubezpieczenie rentowe): 1.50% of gross, capped (see
  below).
- Sickness (ubezpieczenie chorobowe): 2.45% of gross, uncapped.
Combined employee ZUS rate below the annual cap: 13.71%.

Employer social contributions (ZUS), 2026 rates
---------------------------------------------------
- Retirement (ubezpieczenie emerytalne): 9.76% of gross, capped (see
  below) -- same base and cap as the employee side.
- Disability (ubezpieczenie rentowe): 6.50% of gross, capped (see
  below) -- same base and cap as the employee side.
- Accident insurance (ubezpieczenie wypadkowe): 1.67% of gross,
  uncapped -- the reference/default rate used for employers reporting
  fewer than 10 insured persons (or not required to report accident
  statistics); the true rate is risk-class-rated per employer and
  ranges from 0.67% to 3.33%, so this is an illustrative convention
  identical in spirit to Italy's INAIL 0.50% or Japan's workers'-
  accident-insurance 0.30% used elsewhere in this project.
- Labour Fund (Fundusz Pracy, FP): 2.45% of gross, uncapped.
- Guaranteed Employee Benefits Fund (Fundusz Gwarantowanych Swiadczen
  Pracowniczych, FGSP): 0.10% of gross, uncapped.
FP and FGSP are NOT due when the employee's gross pay is below the
statutory minimum wage (a real ZUS rule, not a project simplification)
-- directly relevant at this module's sub-1.0x wage-grid points.

Annual contribution-base cap ("trzydziestokrotnosc")
---------------------------------------------------------
The retirement and disability contribution base (both employee and
employer sides) is capped, for the whole calendar year, at thirty
times the forecast average monthly wage in the national economy: PLN
282,600 for 2026 (based on a forecast average wage of PLN 9,420/month
x 30). This module applies the cap as a flat monthly-equivalent
ceiling (PLN 282,600 / 12 = PLN 23,550/month) on the retirement +
disability contribution base only -- sickness, accident insurance,
FP and FGSP remain uncapped. This is a simplification of the true
cumulative-within-the-calendar-year mechanism (in reality the cap is
reached mid-year for a constant monthly wage above the threshold, and
contributions stop entirely for the rest of the year), consistent with
how equivalent annual caps are modelled elsewhere in this project
(e.g. the US Social Security wage base, Canada's CPP/QPP YMPE).

Health insurance (skladka zdrowotna, NFZ), 2026
----------------------------------------------------
9.00% of the contribution base (gross pay less the employee's
retirement + disability + sickness ZUS contributions, i.e. gross less
13.71% on the ZUS-capped base). Since the 2022 "Polski Lad" reform,
this contribution is NOT deductible from the personal income tax due
for employees taxed on the general scale (skala podatkowa) -- unlike
the pre-2022 rules, where up to 7.75 points of the (then 9%) rate were
deductible.

Personal income tax (PIT), skala podatkowa, 2026
-------------------------------------------------------
- Taxable base = gross pay, less the employee's ZUS contributions
  (13.71% on the ZUS-capped base), less the standard monthly cost-of-
  income deduction (koszty uzyskania przychodu), PLN 250/month for a
  single, local employer.
- Two brackets on ANNUAL taxable income: 12% up to PLN 120,000; PLN
  10,800 + 32% of the excess above PLN 120,000.
- A flat, non-phased-out tax-reducing amount (kwota zmniejszajaca
  podatek) of PLN 3,600/year (12% of the PLN 30,000 tax-free amount,
  kwota wolna od podatku) is subtracted from the bracket tax, floored
  at zero. Unlike the pre-2022 system, this amount does NOT taper off
  at higher incomes.
- This module annualizes the monthly taxable base (multiplies by 12),
  applies the brackets, subtracts the tax-reducing amount, and divides
  by 12 to get the monthly income-tax figure -- the same "constant
  monthly wage annualized" convention used for every other country's
  progressive income tax in this project.

Reference wage
-----------------
Poland's national statutory minimum wage, PLN 4,806/month gross (PLN
31.40/hour), in effect for the whole 2026 calendar year (the minimum
wage was set once for the year, unlike some recent years with a
mid-year July increase).
"""


WAGE_REFERENCE_MONTHLY_PLN = 4806.0

RETIREMENT_RATE_EMPLOYEE = 0.0976
RETIREMENT_RATE_EMPLOYER = 0.0976
DISABILITY_RATE_EMPLOYEE = 0.0150
DISABILITY_RATE_EMPLOYER = 0.0650
SICKNESS_RATE_EMPLOYEE = 0.0245
ACCIDENT_RATE_EMPLOYER = 0.0167
LABOUR_FUND_RATE_EMPLOYER = 0.0245
GUARANTEED_BENEFITS_FUND_RATE_EMPLOYER = 0.0010

ANNUAL_RETIREMENT_DISABILITY_CAP_PLN = 282600.0
MONTHLY_RETIREMENT_DISABILITY_CAP_PLN = ANNUAL_RETIREMENT_DISABILITY_CAP_PLN / 12.0

HEALTH_INSURANCE_RATE = 0.0900

MONTHLY_COST_OF_INCOME_DEDUCTION_PLN = 250.0

PIT_BRACKET_THRESHOLD_ANNUAL_PLN = 120000.0
PIT_RATE_LOW = 0.12
PIT_RATE_HIGH = 0.32
PIT_BRACKET_1_TAX_PLN = 10800.0
TAX_REDUCING_AMOUNT_ANNUAL_PLN = 3600.0


def compute_pit_annual_2026(annual_taxable_base_pln: float) -> float:
    base = max(0.0, annual_taxable_base_pln)

    if base <= PIT_BRACKET_THRESHOLD_ANNUAL_PLN:
        bracket_tax = base * PIT_RATE_LOW
    else:
        bracket_tax = (
            PIT_BRACKET_1_TAX_PLN
            + (base - PIT_BRACKET_THRESHOLD_ANNUAL_PLN) * PIT_RATE_HIGH
        )

    return max(0.0, bracket_tax - TAX_REDUCING_AMOUNT_ANNUAL_PLN)


def compute_poland_payroll_2026(gross_monthly_pln: float) -> dict:
    """
    Compute the full monthly ZUS / NFZ / PIT picture for the standard
    reference employee.
    """
    gross = max(0.0, gross_monthly_pln)

    retirement_disability_base = min(gross, MONTHLY_RETIREMENT_DISABILITY_CAP_PLN)

    retirement_employee = retirement_disability_base * RETIREMENT_RATE_EMPLOYEE
    retirement_employer = retirement_disability_base * RETIREMENT_RATE_EMPLOYER
    disability_employee = retirement_disability_base * DISABILITY_RATE_EMPLOYEE
    disability_employer = retirement_disability_base * DISABILITY_RATE_EMPLOYER
    sickness_employee = gross * SICKNESS_RATE_EMPLOYEE
    accident_employer = gross * ACCIDENT_RATE_EMPLOYER

    below_minimum_wage = gross < WAGE_REFERENCE_MONTHLY_PLN
    labour_fund_employer = 0.0 if below_minimum_wage else gross * LABOUR_FUND_RATE_EMPLOYER
    guaranteed_benefits_fund_employer = (
        0.0 if below_minimum_wage else gross * GUARANTEED_BENEFITS_FUND_RATE_EMPLOYER
    )

    employee_zus_total = retirement_employee + disability_employee + sickness_employee
    employer_zus_total = (
        retirement_employer
        + disability_employer
        + accident_employer
        + labour_fund_employer
        + guaranteed_benefits_fund_employer
    )

    health_insurance_base = max(0.0, gross - employee_zus_total)
    health_insurance = health_insurance_base * HEALTH_INSURANCE_RATE

    pit_taxable_base_monthly = max(
        0.0,
        gross - employee_zus_total - MONTHLY_COST_OF_INCOME_DEDUCTION_PLN
    )
    annual_pit_taxable_base = pit_taxable_base_monthly * 12.0
    annual_pit = compute_pit_annual_2026(annual_pit_taxable_base)
    pit_monthly = annual_pit / 12.0

    employee_contributions_monthly = employee_zus_total + health_insurance
    employer_contributions_monthly = employer_zus_total

    return {
        "retirement_employee_monthly_pln": retirement_employee,
        "retirement_employer_monthly_pln": retirement_employer,
        "disability_employee_monthly_pln": disability_employee,
        "disability_employer_monthly_pln": disability_employer,
        "sickness_employee_monthly_pln": sickness_employee,
        "accident_employer_monthly_pln": accident_employer,
        "labour_fund_employer_monthly_pln": labour_fund_employer,
        "guaranteed_benefits_fund_employer_monthly_pln": guaranteed_benefits_fund_employer,
        "health_insurance_monthly_pln": health_insurance,
        "pit_monthly_pln": pit_monthly,
        "employee_contributions_monthly_pln": employee_contributions_monthly,
        "employer_contributions_monthly_pln": employer_contributions_monthly,
        "below_minimum_wage": below_minimum_wage,
    }
