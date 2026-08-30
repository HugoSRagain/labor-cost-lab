"""
Japan national income tax, resident tax, and social insurance engine
for the 2026 tax year (reiwa 8-nendo / R8).

Scope
-----
Single, childless private-sector employee, standard formal employment,
under age 40 (so the age-40-64 long-term care insurance surcharge does
not apply -- see Limites), workers' accident insurance industry class
94 (sono-ta no kakushu jigyou, "other businesses", the standard
fallback classification for a generic office/professional-services
employer), one prefecture selectable out of all 47 (mirroring the
Swiss/US/Chinese all-jurisdiction architecture).

National income tax (所得税) -- entirely NATIONAL
------------------------------------------------------
The annual 7-bracket comprehensive-income schedule (5/10/20/23/33/40/
45%), the employment income deduction (給与所得控除, converting gross
salary into employment income) and the basic deduction (基礎控除) are
all set by national law and apply identically in every prefecture.
Japan enacted a tax reform (令和8年度税制改正, in force for the full
2026 tax year via the December 年末調整 year-end adjustment) that
raised both the basic deduction (from 580,000 to up to 1,040,000 yen,
tiered by income) and the minimum employment income deduction (from
650,000 to 740,000 yen, this floor now extending up to 2,200,000 yen of
gross salary). A 2.1% "reconstruction" surtax (復興特別所得税) applies
on top of the base income tax for the 2026 tax year.

Employers withhold income tax monthly via NTA withholding tables, with
a December 年末調整 (year-end adjustment) reconciling to the true
annual liability for a standard single-employer, no-dependents
taxpayer -- no separate return is needed. Consistent with how every
other module in this project handles an analogous monthly-withholding-
vs-annual-settlement gap (e.g. China's cumulative withholding method),
this module applies the annual formulas directly to annualised gross
salary and divides by 12, rather than reproducing the month-by-month
withholding-table lookup.

Resident tax (住民税) -- structurally uniform, but genuinely different
deduction schedule than income tax
--------------------------------------------------------------------------
A combined prefectural + municipal rate of 10% (4% + 6%), set as the
national "standard rate" used by virtually every municipality, plus a
flat annual per-capita levy (均等割) of 5,000 yen (1,000 prefectural +
3,000 municipal + 1,000 national Forest Environment Tax, collected
together). Uses the SAME employment income figure as national income
tax, but its own, much smaller, flat basic deduction of 430,000 yen
(not raised by the 2026 reform) -- a real, growing divergence from the
national income-tax basic deduction (up to 1,040,000 yen), modelled as
two separate deduction schedules. In reality resident tax for a given
year is assessed on the PRIOR year's income; this module uses same-year
income for a steady-state reference profile, consistent with every
other country module.

Social insurance -- NATIONALLY UNIFORM RATES, except Kyokai Kenpo
health insurance
-----------------------------------------------------------------------
Employee pension insurance (厚生年金保険): 18.3% total (9.15% employee /
9.15% employer), unchanged nationally since 2017, applied to a banded
"standard monthly remuneration" (標準報酬月額, 32 grades from 88,000 to
650,000 yen) rather than actual salary directly. An employer-only
child/childcare contribution (子ども・子育て拠出金, 0.36%) rides on the
same pension base. Employment insurance (雇用保険): a national rate,
13.5 per mille total (5 per mille employee / 8.5 per mille employer for
a standard business), applied to actual salary (not banded).
Workers' accident insurance (労災保険): employer-only, industry-risk-
rated (0.15%-11.0% range); this module uses 0.30% (class 94, the
standard "other businesses" fallback), applied to actual salary.

Health insurance via Kyokai Kenpo (全国健康保険協会, "Zenkyoren"/協会けんぽ)
is THE prefecture-specific rate: each of the 47 prefectures has its own
premium rate (9.21%-10.55% for 2026), applied to a wider banded
"standard monthly remuneration" (50 grades, 58,000 to 1,390,000 yen,
shared with the new child-support-money contribution) -- split 50/50
employer/employee. A new national child/childcare support money (子ども・
子育て支援金, 0.23%, split 50/50) rides on the same health-insurance
base from April 2026; this module applies it for the full 2026 tax
year as a simplification. The age-40-64 long-term care insurance
surcharge (介護保険料率, 1.62% national) is NOT modelled, since the
reference profile is assumed under 40 (see Limites).

Reference wage
-----------------
Japan has no national minimum wage; each of the 47 prefectures sets its
own hourly minimum wage (revised annually, typically each October).
Consistent with how this project already handles Sweden's, Italy's and
China's lack of a national minimum wage, and the US's/China's
uniform-single-reference-wage-across-jurisdictions convention, this
module uses Tokyo's own minimum wage (1,226 yen/hour, in effect since 3
October 2025 -- the nation's highest, mirroring the Shanghai-for-China
convention) converted to a monthly full-time equivalent
(1,226 x 40 hours/week x 52/12 = 212,506.67 yen/month), applied
uniformly across every prefecture's own contribution-rate parameters.
"""

import math


IIT_BASIC_DEDUCTION_TIERS = [
    (3360000.0, 1040000.0),
    (6550000.0, 670000.0),
    (23500000.0, 620000.0),
    (math.inf, 0.0),
]

RESIDENT_TAX_BASIC_DEDUCTION = 430000.0
RESIDENT_TAX_RATE = 0.10
RESIDENT_TAX_PER_CAPITA_LEVY_ANNUAL = 5000.0

IIT_BRACKETS_ANNUAL_2026 = [
    (0.0, 1950000.0, 0.05),
    (1950000.0, 3300000.0, 0.10),
    (3300000.0, 6950000.0, 0.20),
    (6950000.0, 9000000.0, 0.23),
    (9000000.0, 18000000.0, 0.33),
    (18000000.0, 40000000.0, 0.40),
    (40000000.0, math.inf, 0.45),
]

RECONSTRUCTION_SURTAX_RATE = 0.021

PENSION_RATE_TOTAL = 0.183
CHILD_CHILDCARE_CONTRIBUTION_RATE = 0.0036
EMPLOYMENT_INSURANCE_EMPLOYEE_RATE = 0.005
EMPLOYMENT_INSURANCE_EMPLOYER_RATE = 0.0085
WORKERS_ACCIDENT_INSURANCE_RATE = 0.003
CHILD_SUPPORT_MONEY_RATE_TOTAL = 0.0023

WAGE_REFERENCE_MONTHLY_JPY = 1226.0 * 40.0 * 52.0 / 12.0


def _bands(*pairs):
    """Build a standard-remuneration band table from (upper_exclusive, amount) pairs."""
    return list(pairs)


HEALTH_INSURANCE_BANDS_2026 = _bands(
    (63000, 58000), (73000, 68000), (83000, 78000), (93000, 88000), (101000, 98000),
    (107000, 104000), (114000, 110000), (122000, 118000), (130000, 126000), (138000, 134000),
    (146000, 142000), (155000, 150000), (165000, 160000), (175000, 170000), (185000, 180000),
    (195000, 190000), (210000, 200000), (230000, 220000), (250000, 240000), (270000, 260000),
    (290000, 280000), (310000, 300000), (330000, 320000), (350000, 340000), (370000, 360000),
    (395000, 380000), (425000, 410000), (455000, 440000), (485000, 470000), (515000, 500000),
    (545000, 530000), (575000, 560000), (605000, 590000), (635000, 620000), (665000, 650000),
    (695000, 680000), (730000, 710000), (770000, 750000), (810000, 790000), (855000, 830000),
    (905000, 880000), (955000, 930000), (1005000, 980000), (1055000, 1030000), (1115000, 1090000),
    (1175000, 1150000), (1235000, 1210000), (1295000, 1270000), (1355000, 1330000), (math.inf, 1390000),
)

PENSION_BANDS_2026 = _bands(
    (93000, 88000), (101000, 98000), (107000, 104000), (114000, 110000), (122000, 118000),
    (130000, 126000), (138000, 134000), (146000, 142000), (155000, 150000), (165000, 160000),
    (175000, 170000), (185000, 180000), (195000, 190000), (210000, 200000), (230000, 220000),
    (250000, 240000), (270000, 260000), (290000, 280000), (310000, 300000), (330000, 320000),
    (350000, 340000), (370000, 360000), (395000, 380000), (425000, 410000), (455000, 440000),
    (485000, 470000), (515000, 500000), (545000, 530000), (575000, 560000), (605000, 590000),
    (635000, 620000), (math.inf, 650000),
)


PREFECTURE_DATA_2026 = {
    "hokkaido": {"name_fr": "Hokkaido", "name_en": "Hokkaido", "population": 4985419, "kyokai_kenpo_rate": 0.1028, "minimum_wage_hourly": 1075},
    "aomori": {"name_fr": "Aomori", "name_en": "Aomori", "population": 1140395, "kyokai_kenpo_rate": 0.0985, "minimum_wage_hourly": 1029},
    "iwate": {"name_fr": "Iwate", "name_en": "Iwate", "population": 1125502, "kyokai_kenpo_rate": 0.0951, "minimum_wage_hourly": 1031},
    "miyagi": {"name_fr": "Miyagi", "name_en": "Miyagi", "population": 2227240, "kyokai_kenpo_rate": 0.1010, "minimum_wage_hourly": 1038},
    "akita": {"name_fr": "Akita", "name_en": "Akita", "population": 882100, "kyokai_kenpo_rate": 0.1001, "minimum_wage_hourly": 1031},
    "yamagata": {"name_fr": "Yamagata", "name_en": "Yamagata", "population": 993127, "kyokai_kenpo_rate": 0.0975, "minimum_wage_hourly": 1032},
    "fukushima": {"name_fr": "Fukushima", "name_en": "Fukushima", "population": 1711937, "kyokai_kenpo_rate": 0.0950, "minimum_wage_hourly": 1033},
    "ibaraki": {"name_fr": "Ibaraki", "name_en": "Ibaraki", "population": 2791207, "kyokai_kenpo_rate": 0.0952, "minimum_wage_hourly": 1074},
    "tochigi": {"name_fr": "Tochigi", "name_en": "Tochigi", "population": 1864833, "kyokai_kenpo_rate": 0.0982, "minimum_wage_hourly": 1068},
    "gunma": {"name_fr": "Gunma", "name_en": "Gunma", "population": 1867582, "kyokai_kenpo_rate": 0.0968, "minimum_wage_hourly": 1063},
    "saitama": {"name_fr": "Saitama", "name_en": "Saitama", "population": 7287169, "kyokai_kenpo_rate": 0.0967, "minimum_wage_hourly": 1141},
    "chiba": {"name_fr": "Chiba", "name_en": "Chiba", "population": 6258512, "kyokai_kenpo_rate": 0.0973, "minimum_wage_hourly": 1140},
    "tokyo": {"name_fr": "Tokyo", "name_en": "Tokyo", "population": 14246219, "kyokai_kenpo_rate": 0.0985, "minimum_wage_hourly": 1226,
              "note": "Salaire de reference du module."},
    "kanagawa": {"name_fr": "Kanagawa", "name_en": "Kanagawa", "population": 9193657, "kyokai_kenpo_rate": 0.0992, "minimum_wage_hourly": 1225},
    "niigata": {"name_fr": "Niigata", "name_en": "Niigata", "population": 2068476, "kyokai_kenpo_rate": 0.0921, "minimum_wage_hourly": 1050},
    "toyama": {"name_fr": "Toyama", "name_en": "Toyama", "population": 985675, "kyokai_kenpo_rate": 0.0959, "minimum_wage_hourly": 1062},
    "ishikawa": {"name_fr": "Ishikawa", "name_en": "Ishikawa", "population": 1088221, "kyokai_kenpo_rate": 0.0970, "minimum_wage_hourly": 1054},
    "fukui": {"name_fr": "Fukui", "name_en": "Fukui", "population": 729386, "kyokai_kenpo_rate": 0.0971, "minimum_wage_hourly": 1053},
    "yamanashi": {"name_fr": "Yamanashi", "name_en": "Yamanashi", "population": 779912, "kyokai_kenpo_rate": 0.0955, "minimum_wage_hourly": 1052},
    "nagano": {"name_fr": "Nagano", "name_en": "Nagano", "population": 1954950, "kyokai_kenpo_rate": 0.0963, "minimum_wage_hourly": 1061},
    "gifu": {"name_fr": "Gifu", "name_en": "Gifu", "population": 1891489, "kyokai_kenpo_rate": 0.0980, "minimum_wage_hourly": 1065},
    "shizuoka": {"name_fr": "Shizuoka", "name_en": "Shizuoka", "population": 3468845, "kyokai_kenpo_rate": 0.0961, "minimum_wage_hourly": 1097},
    "aichi": {"name_fr": "Aichi", "name_en": "Aichi", "population": 7449403, "kyokai_kenpo_rate": 0.0993, "minimum_wage_hourly": 1140},
    "mie": {"name_fr": "Mie", "name_en": "Mie", "population": 1694896, "kyokai_kenpo_rate": 0.0977, "minimum_wage_hourly": 1087},
    "shiga": {"name_fr": "Shiga", "name_en": "Shiga", "population": 1392439, "kyokai_kenpo_rate": 0.0988, "minimum_wage_hourly": 1080},
    "kyoto": {"name_fr": "Kyoto", "name_en": "Kyoto", "population": 2502747, "kyokai_kenpo_rate": 0.0989, "minimum_wage_hourly": 1122},
    "osaka": {"name_fr": "Osaka", "name_en": "Osaka", "population": 8764578, "kyokai_kenpo_rate": 0.1013, "minimum_wage_hourly": 1177},
    "hyogo": {"name_fr": "Hyogo", "name_en": "Hyogo", "population": 5323825, "kyokai_kenpo_rate": 0.1012, "minimum_wage_hourly": 1116},
    "nara": {"name_fr": "Nara", "name_en": "Nara", "population": 1269180, "kyokai_kenpo_rate": 0.0991, "minimum_wage_hourly": 1051},
    "wakayama": {"name_fr": "Wakayama", "name_en": "Wakayama", "population": 864262, "kyokai_kenpo_rate": 0.1006, "minimum_wage_hourly": 1045},
    "tottori": {"name_fr": "Tottori", "name_en": "Tottori", "population": 523732, "kyokai_kenpo_rate": 0.0986, "minimum_wage_hourly": 1030},
    "shimane": {"name_fr": "Shimane", "name_en": "Shimane", "population": 629460, "kyokai_kenpo_rate": 0.0994, "minimum_wage_hourly": 1033},
    "okayama": {"name_fr": "Okayama", "name_en": "Okayama", "population": 1808664, "kyokai_kenpo_rate": 0.1005, "minimum_wage_hourly": 1047},
    "hiroshima": {"name_fr": "Hiroshima", "name_en": "Hiroshima", "population": 2683399, "kyokai_kenpo_rate": 0.0978, "minimum_wage_hourly": 1085},
    "yamaguchi": {"name_fr": "Yamaguchi", "name_en": "Yamaguchi", "population": 1264006, "kyokai_kenpo_rate": 0.1015, "minimum_wage_hourly": 1043},
    "tokushima": {"name_fr": "Tokushima", "name_en": "Tokushima", "population": 675489, "kyokai_kenpo_rate": 0.1024, "minimum_wage_hourly": 1046},
    "kagawa": {"name_fr": "Kagawa", "name_en": "Kagawa", "population": 907725, "kyokai_kenpo_rate": 0.1002, "minimum_wage_hourly": 1036},
    "ehime": {"name_fr": "Ehime", "name_en": "Ehime", "population": 1260088, "kyokai_kenpo_rate": 0.0998, "minimum_wage_hourly": 1033},
    "kochi": {"name_fr": "Kochi", "name_en": "Kochi", "population": 643437, "kyokai_kenpo_rate": 0.1005, "minimum_wage_hourly": 1023},
    "fukuoka": {"name_fr": "Fukuoka", "name_en": "Fukuoka", "population": 5081879, "kyokai_kenpo_rate": 0.1011, "minimum_wage_hourly": 1057},
    "saga": {"name_fr": "Saga", "name_en": "Saga", "population": 781214, "kyokai_kenpo_rate": 0.1055, "minimum_wage_hourly": 1030},
    "nagasaki": {"name_fr": "Nagasaki", "name_en": "Nagasaki", "population": 1232190, "kyokai_kenpo_rate": 0.1006, "minimum_wage_hourly": 1031},
    "kumamoto": {"name_fr": "Kumamoto", "name_en": "Kumamoto", "population": 1678090, "kyokai_kenpo_rate": 0.1008, "minimum_wage_hourly": 1034},
    "oita": {"name_fr": "Oita", "name_en": "Oita", "population": 1076875, "kyokai_kenpo_rate": 0.1008, "minimum_wage_hourly": 1035},
    "miyazaki": {"name_fr": "Miyazaki", "name_en": "Miyazaki", "population": 1018904, "kyokai_kenpo_rate": 0.0977, "minimum_wage_hourly": 1023},
    "kagoshima": {"name_fr": "Kagoshima", "name_en": "Kagoshima", "population": 1512969, "kyokai_kenpo_rate": 0.1013, "minimum_wage_hourly": 1026},
    "okinawa": {"name_fr": "Okinawa", "name_en": "Okinawa", "population": 1468220, "kyokai_kenpo_rate": 0.0944, "minimum_wage_hourly": 1023},
}


def lookup_band_amount(monthly_salary: float, bands: list) -> float:
    salary = max(0.0, monthly_salary)
    for upper, amount in bands:
        if salary < upper:
            return float(amount)
    return float(bands[-1][1])


def compute_employment_income_deduction_2026(gross_annual_jpy: float) -> float:
    gross = max(0.0, gross_annual_jpy)

    if gross <= 651000.0:
        return 0.0
    if gross <= 2200000.0:
        return max(0.0, gross - 740000.0)

    a = math.floor((gross / 4.0) / 1000.0) * 1000.0

    if gross <= 3600000.0:
        return a * 2.8 - 80000.0
    if gross <= 6600000.0:
        return a * 3.2 - 440000.0
    if gross <= 8500000.0:
        return gross * 0.9 - 1100000.0

    return gross - 1950000.0


def compute_iit_basic_deduction_2026(total_income_jpy: float) -> float:
    for upper, amount in IIT_BASIC_DEDUCTION_TIERS:
        if total_income_jpy <= upper:
            return amount
    return 0.0


def compute_iit_annual_2026(taxable_income_jpy: float) -> float:
    income = max(0.0, taxable_income_jpy)
    tax = 0.0
    for lower, upper, rate in IIT_BRACKETS_ANNUAL_2026:
        if income <= lower:
            break
        tax += (min(income, upper) - lower) * rate
    return tax * (1.0 + RECONSTRUCTION_SURTAX_RATE)


def compute_social_insurance_2026(gross_monthly_jpy: float, prefecture_code: str) -> dict:
    prefecture = PREFECTURE_DATA_2026[prefecture_code]

    health_base = lookup_band_amount(gross_monthly_jpy, HEALTH_INSURANCE_BANDS_2026)
    pension_base = lookup_band_amount(gross_monthly_jpy, PENSION_BANDS_2026)

    health_rate_half = prefecture["kyokai_kenpo_rate"] / 2.0
    health_employer = health_base * health_rate_half
    health_employee = health_base * health_rate_half

    child_support_half = CHILD_SUPPORT_MONEY_RATE_TOTAL / 2.0
    child_support_employer = health_base * child_support_half
    child_support_employee = health_base * child_support_half

    pension_rate_half = PENSION_RATE_TOTAL / 2.0
    pension_employer = pension_base * pension_rate_half
    pension_employee = pension_base * pension_rate_half

    child_childcare_contribution = pension_base * CHILD_CHILDCARE_CONTRIBUTION_RATE

    employment_insurance_employee = gross_monthly_jpy * EMPLOYMENT_INSURANCE_EMPLOYEE_RATE
    employment_insurance_employer = gross_monthly_jpy * EMPLOYMENT_INSURANCE_EMPLOYER_RATE

    workers_accident_insurance = gross_monthly_jpy * WORKERS_ACCIDENT_INSURANCE_RATE

    employee_total = (
        health_employee + child_support_employee + pension_employee
        + employment_insurance_employee
    )
    employer_total = (
        health_employer + child_support_employer + pension_employer
        + child_childcare_contribution + employment_insurance_employer
        + workers_accident_insurance
    )

    return {
        "health_employer_monthly": health_employer,
        "health_employee_monthly": health_employee,
        "child_support_money_employer_monthly": child_support_employer,
        "child_support_money_employee_monthly": child_support_employee,
        "pension_employer_monthly": pension_employer,
        "pension_employee_monthly": pension_employee,
        "child_childcare_contribution_monthly": child_childcare_contribution,
        "employment_insurance_employer_monthly": employment_insurance_employer,
        "employment_insurance_employee_monthly": employment_insurance_employee,
        "workers_accident_insurance_monthly": workers_accident_insurance,
        "employee_contributions_monthly": employee_total,
        "employer_contributions_monthly": employer_total,
    }


def compute_japan_payroll_2026(gross_monthly_jpy: float, prefecture_code: str) -> dict:
    """
    Compute the full monthly national-income-tax / resident-tax / social-
    insurance picture for the standard reference employee in the given
    prefecture.
    """
    annual_gross = gross_monthly_jpy * 12.0

    si = compute_social_insurance_2026(gross_monthly_jpy, prefecture_code)
    annual_employee_contributions = si["employee_contributions_monthly"] * 12.0

    employment_income = compute_employment_income_deduction_2026(annual_gross)

    iit_taxable = max(
        0.0,
        employment_income
        - compute_iit_basic_deduction_2026(employment_income)
        - annual_employee_contributions
    )
    iit_annual = compute_iit_annual_2026(iit_taxable)

    resident_taxable = max(
        0.0,
        employment_income - RESIDENT_TAX_BASIC_DEDUCTION - annual_employee_contributions
    )
    resident_tax_annual = resident_taxable * RESIDENT_TAX_RATE + RESIDENT_TAX_PER_CAPITA_LEVY_ANNUAL

    income_tax_annual = iit_annual + resident_tax_annual

    return {
        "annual_gross_jpy": annual_gross,
        "employment_income_annual_jpy": employment_income,
        "iit_taxable_annual_jpy": iit_taxable,
        "iit_annual_jpy": iit_annual,
        "resident_taxable_annual_jpy": resident_taxable,
        "resident_tax_annual_jpy": resident_tax_annual,
        "income_tax_annual_jpy": income_tax_annual,
        "income_tax_monthly_jpy": income_tax_annual / 12.0,
        "employee_contributions_monthly_jpy": si["employee_contributions_monthly"],
        "employer_contributions_monthly_jpy": si["employer_contributions_monthly"],
        "social_insurance_breakdown": si,
    }
