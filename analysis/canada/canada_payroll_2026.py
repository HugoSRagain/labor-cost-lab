"""
Canada federal + provincial/territorial income tax and payroll
contribution engine for the 2026 tax year.

Scope
-----
Single, childless private-sector employee, standard formal employment,
one province/territory selectable out of all 13 (10 provinces + 3
territories), mirroring the Swiss/US/Chinese/Japanese all-jurisdiction
architecture. A "standard, large employer" profile is assumed for the
two provincial payroll levies that are graduated by TOTAL company
payroll (Ontario's EHT, Quebec's FSS) -- see Limites.

Federal income tax (国 applies everywhere)
--------------------------------------------
5-bracket schedule (14/20.5/26/29/33%, the lowest bracket cut from 15%
to 14% effective for the 2026 tax year) applied to taxable income, less
non-refundable tax credits. Credits (the Basic Personal Amount and,
where modelled, provincial credits) are NOT deductions from taxable
income: each credit's dollar amount is multiplied by the LOWEST federal
bracket rate (14% for 2026) to get the actual tax reduction -- i.e.
federal_tax = bracket_tax(taxable_income) - BPA_federal x 14%. The
federal Basic Personal Amount itself has a two-tier structure since a
2023 reform: the full amount (CAD 16,452 for 2026) applies up to
CAD 181,440 of net income, phasing down linearly to a floor amount
(CAD 14,829) by CAD 258,482.

Quebec residents receive a federal tax abatement of 16.5% off federal
tax payable (after credits) -- Quebec collects its own full income tax
and opts out of certain federal-provincial arrangements, and this
abatement offsets that difference. Modelled explicitly for the Quebec
profile.

Provincial/territorial income tax -- the genuinely varying layer
-----------------------------------------------------------------------
Each of the 13 jurisdictions sets its own full bracket schedule and its
own Basic Personal Amount (also a non-refundable credit, calculated at
that jurisdiction's own LOWEST bracket rate). Two jurisdictions have a
non-standard BPA mechanism: Yukon's BPA exactly mirrors the federal
two-tier structure (same CAD 16,452/14,829 amounts and thresholds, at
Yukon's own lowest rate); Manitoba's BPA (CAD 15,780, frozen/not
indexed) phases out linearly to zero between CAD 200,000 and
CAD 400,000 of net income. Ontario additionally levies a provincial
surtax (20% of Ontario tax above CAD 5,818, plus a further 36% of
Ontario tax above CAD 7,446, both layers cumulative) and a separate
Ontario Health Premium -- a personal levy (not a payroll contribution),
a fixed piecewise-linear schedule of taxable income reaching a maximum
of CAD 900/year above CAD 200,000, added to the Ontario tax bill.

Canada/Quebec Pension Plan (CPP/QPP)
----------------------------------------
Every province and territory except Quebec uses CPP: a base rate of
5.95% (employee and employer each) on pensionable earnings between the
Year's Basic Exemption (CAD 3,500, flat) and the Year's Maximum
Pensionable Earnings (YMPE, CAD 74,600 for 2026), plus "CPP2" (4% each)
on earnings between the YMPE and the Year's Additional Maximum
Pensionable Earnings (YAMPE, CAD 85,000 for 2026). Quebec uses its own
QPP instead: a combined base + first-additional-plan rate of 6.3%
(employee and employer each) on the same CAD 3,500-CAD 74,600 band, plus
QPP2 (4% each, matching CPP2) on the CAD 74,600-CAD 85,000 band.

Employment Insurance (EI) and the Quebec Parental Insurance Plan (QPIP)
--------------------------------------------------------------------------
EI is a national programme: 1.63% employee / 2.282% employer (1.4x the
employee rate) on insurable earnings up to the Maximum Insurable
Earnings (MIE, CAD 68,900 for 2026), everywhere except Quebec. Quebec
has its own reduced EI rate (1.30% employee / 1.82% employer, same 1.4x
multiplier) because Quebec residents are separately covered by QPIP
(Quebec Parental Insurance Plan) for parental/maternity benefits that
EI provides elsewhere: QPIP is 0.430% employee / 0.602% employer, on
its own insurable-earnings ceiling of CAD 103,000 (higher than the
EI/QPP ceiling, and set independently).

Provincial payroll levies and workers' compensation
-----------------------------------------------------------
Ontario's Employer Health Tax (EHT, employer-only) and Quebec's Fonds
des services de sante (FSS, employer-only) are both graduated by a
company's TOTAL payroll, with an exemption/reduced rate for small
employers; this module assumes a standard large employer (above each
scheme's top graduation threshold) and applies the resulting flat top
rate: 1.95% (Ontario EHT) and 4.26% (Quebec FSS). Every province and
territory also runs its own mandatory, employer-only, industry-risk-
rated workers' compensation scheme (WSIB in Ontario, WorkSafeBC in
British Columbia, CNESST in Quebec, etc.); none publishes a single
centrally-tabulated low-risk/office rate the way some other countries
in this project do, so this module uses one uniform illustrative
national rate (1.00%, employer-only, uncapped) across all 13
jurisdictions -- the same convention already used for Italy's INAIL and
Japan's workers'-accident insurance.

Reference wage
-----------------
Canada has no single national minimum wage for most of the workforce (a
federal minimum wage exists only for a small share of federally-
regulated industries); each province/territory sets its own. This
module uses Ontario's own minimum wage (CAD 17.60/hour -- Canada's most
populous province and financial capital) converted to a monthly full-
time equivalent (17.60 x 40 hours/week x 52/12 = CAD 3,050.67/month),
applied uniformly across every jurisdiction's own tax parameters,
mirroring the Tokyo/Shanghai/federal-minimum-wage conventions already
used for Japan/China/the US.
"""

import math


FEDERAL_BRACKETS_2026 = [
    (0.0, 58523.0, 0.14),
    (58523.0, 117045.0, 0.205),
    (117045.0, 181440.0, 0.26),
    (181440.0, 258482.0, 0.29),
    (258482.0, math.inf, 0.33),
]

FEDERAL_LOWEST_RATE = 0.14
FEDERAL_BPA_UPPER = 16452.0
FEDERAL_BPA_LOWER = 14829.0
FEDERAL_BPA_PHASEOUT_START = 181440.0
FEDERAL_BPA_PHASEOUT_END = 258482.0

QUEBEC_FEDERAL_ABATEMENT_RATE = 0.165

CPP_YBE = 3500.0
CPP_YMPE_2026 = 74600.0
CPP_YAMPE_2026 = 85000.0
CPP_BASE_RATE = 0.0595
CPP2_RATE = 0.04

QPP_BASE_RATE = 0.063
QPP2_RATE = 0.04

EI_MIE_2026 = 68900.0
EI_EMPLOYEE_RATE = 0.0163
EI_EMPLOYER_MULTIPLIER = 1.4
EI_QUEBEC_EMPLOYEE_RATE = 0.0130

QPIP_MIE_2026 = 103000.0
QPIP_EMPLOYEE_RATE = 0.00430
QPIP_EMPLOYER_RATE = 0.00602

ONTARIO_EHT_RATE = 0.0195
QUEBEC_FSS_RATE = 0.0426
WORKERS_COMP_ILLUSTRATIVE_RATE = 0.0100

WAGE_REFERENCE_MONTHLY_CAD = 17.60 * 40.0 * 52.0 / 12.0

BPA_FLAT = "flat"
BPA_FEDERAL_MIRROR = "federal_mirror"
BPA_MANITOBA_PHASEOUT = "manitoba_phaseout"


def _b(*pairs):
    brackets = []
    lower = 0.0
    for upper, rate in pairs:
        upper_val = math.inf if upper is None else float(upper)
        brackets.append((lower, upper_val, rate))
        lower = upper_val
    return brackets


PROVINCE_DATA_2026 = {
    "ON": {"name_fr": "Ontario", "name_en": "Ontario", "population": 16103890, "is_quebec": False,
           "brackets": _b((53891, 0.0505), (107785, 0.0915), (150000, 0.1116), (220000, 0.1216), (None, 0.1316)),
           "bpa_type": BPA_FLAT, "bpa_amount": 12989.0, "lowest_rate": 0.0505,
           "surtax_tiers": [(5818.0, 0.20), (7446.0, 0.36)],
           "has_health_premium": True,
           "minimum_wage_hourly": 17.60,
           "note": "Salaire de reference du module."},
    "QC": {"name_fr": "Quebec", "name_en": "Quebec", "population": 9016222, "is_quebec": True,
           "brackets": _b((54345, 0.14), (108680, 0.19), (132245, 0.24), (None, 0.2575)),
           "bpa_type": BPA_FLAT, "bpa_amount": 18952.0, "lowest_rate": 0.14,
           "minimum_wage_hourly": 16.60},
    "BC": {"name_fr": "Colombie-Britannique", "name_en": "British Columbia", "population": 5646420, "is_quebec": False,
           "brackets": _b((50363, 0.056), (100728, 0.077), (115648, 0.105), (140430, 0.1229), (190405, 0.147), (265545, 0.168), (None, 0.205)),
           "bpa_type": BPA_FLAT, "bpa_amount": 13216.0, "lowest_rate": 0.056,
           "minimum_wage_hourly": 18.25},
    "AB": {"name_fr": "Alberta", "name_en": "Alberta", "population": 5057077, "is_quebec": False,
           "brackets": _b((61200, 0.08), (154259, 0.10), (185111, 0.12), (246813, 0.13), (370220, 0.14), (None, 0.15)),
           "bpa_type": BPA_FLAT, "bpa_amount": 22769.0, "lowest_rate": 0.08,
           "minimum_wage_hourly": 15.00},
    "MB": {"name_fr": "Manitoba", "name_en": "Manitoba", "population": 1503865, "is_quebec": False,
           "brackets": _b((47000, 0.108), (100000, 0.1275), (None, 0.174)),
           "bpa_type": BPA_MANITOBA_PHASEOUT, "bpa_amount": 15780.0, "lowest_rate": 0.108,
           "minimum_wage_hourly": 16.00},
    "SK": {"name_fr": "Saskatchewan", "name_en": "Saskatchewan", "population": 1266092, "is_quebec": False,
           "brackets": _b((54532, 0.105), (155805, 0.125), (None, 0.145)),
           "bpa_type": BPA_FLAT, "bpa_amount": 20381.0, "lowest_rate": 0.105,
           "minimum_wage_hourly": 15.35},
    "NS": {"name_fr": "Nouvelle-Ecosse", "name_en": "Nova Scotia", "population": 1090852, "is_quebec": False,
           "brackets": _b((29590, 0.0879), (59180, 0.1495), (93000, 0.1667), (150000, 0.175), (None, 0.21)),
           "bpa_type": BPA_FLAT, "bpa_amount": 11932.0, "lowest_rate": 0.0879,
           "minimum_wage_hourly": 16.75},
    "NB": {"name_fr": "Nouveau-Brunswick", "name_en": "New Brunswick", "population": 866497, "is_quebec": False,
           "brackets": _b((52333, 0.094), (104666, 0.14), (193861, 0.16), (None, 0.195)),
           "bpa_type": BPA_FLAT, "bpa_amount": 13664.0, "lowest_rate": 0.094,
           "minimum_wage_hourly": 15.90},
    "NL": {"name_fr": "Terre-Neuve-et-Labrador", "name_en": "Newfoundland and Labrador", "population": 547910, "is_quebec": False,
           "brackets": _b((44678, 0.087), (89354, 0.145), (159528, 0.158), (223340, 0.178), (285319, 0.198), (570638, 0.208), (None, 0.213)),
           "bpa_type": BPA_FLAT, "bpa_amount": 13094.0, "lowest_rate": 0.087,
           "minimum_wage_hourly": 16.35},
    "PE": {"name_fr": "Ile-du-Prince-Edouard", "name_en": "Prince Edward Island", "population": 181715, "is_quebec": False,
           "brackets": _b((33928, 0.095), (65820, 0.1347), (106890, 0.166), (142250, 0.1762), (200000, 0.19), (None, 0.20)),
           "bpa_type": BPA_FLAT, "bpa_amount": 15000.0, "lowest_rate": 0.095,
           "minimum_wage_hourly": 17.00},
    "YT": {"name_fr": "Yukon", "name_en": "Yukon", "population": 48493, "is_quebec": False,
           "brackets": _b((58523, 0.064), (117045, 0.09), (181440, 0.109), (500000, 0.128), (None, 0.15)),
           "bpa_type": BPA_FEDERAL_MIRROR, "bpa_amount": None, "lowest_rate": 0.064,
           "minimum_wage_hourly": 18.51},
    "NT": {"name_fr": "Territoires du Nord-Ouest", "name_en": "Northwest Territories", "population": 45808, "is_quebec": False,
           "brackets": _b((53003, 0.059), (106009, 0.086), (172346, 0.122), (None, 0.1405)),
           "bpa_type": BPA_FLAT, "bpa_amount": 18198.0, "lowest_rate": 0.059,
           "minimum_wage_hourly": 16.95},
    "NU": {"name_fr": "Nunavut", "name_en": "Nunavut", "population": 42215, "is_quebec": False,
           "brackets": _b((55801, 0.04), (111602, 0.07), (181439, 0.09), (None, 0.115)),
           "bpa_type": BPA_FLAT, "bpa_amount": 19659.0, "lowest_rate": 0.04,
           "minimum_wage_hourly": 19.75},
}


def compute_marginal_tax(taxable_income: float, brackets: list) -> float:
    income = max(0.0, taxable_income)
    tax = 0.0
    for lower, upper, rate in brackets:
        if income <= lower:
            break
        tax += (min(income, upper) - lower) * rate
    return tax


def compute_federal_bpa_2026(net_income: float) -> float:
    if net_income <= FEDERAL_BPA_PHASEOUT_START:
        return FEDERAL_BPA_UPPER
    if net_income >= FEDERAL_BPA_PHASEOUT_END:
        return FEDERAL_BPA_LOWER
    span = FEDERAL_BPA_PHASEOUT_END - FEDERAL_BPA_PHASEOUT_START
    reduction = (FEDERAL_BPA_UPPER - FEDERAL_BPA_LOWER) * (net_income - FEDERAL_BPA_PHASEOUT_START) / span
    return FEDERAL_BPA_UPPER - reduction


def compute_provincial_bpa_2026(net_income: float, province: dict) -> float:
    bpa_type = province["bpa_type"]

    if bpa_type == BPA_FEDERAL_MIRROR:
        return compute_federal_bpa_2026(net_income)

    if bpa_type == BPA_MANITOBA_PHASEOUT:
        base = province["bpa_amount"]
        if net_income <= 200000.0:
            return base
        if net_income >= 400000.0:
            return 0.0
        return base * (400000.0 - net_income) / 200000.0

    return province["bpa_amount"]


def compute_ontario_health_premium_2026(taxable_income: float) -> float:
    income = max(0.0, taxable_income)

    if income <= 20000.0:
        return 0.0
    if income <= 36000.0:
        return min(300.0, 0.06 * (income - 20000.0))
    if income <= 48000.0:
        return 300.0 + min(150.0, 0.06 * (income - 36000.0))
    if income <= 72000.0:
        return 450.0 + min(150.0, 0.25 * (income - 48000.0))
    if income <= 200000.0:
        return 600.0 + min(150.0, 0.25 * (income - 72000.0))
    return 750.0 + min(150.0, 0.25 * (income - 200000.0))


def compute_cpp_qpp_2026(annual_gross: float, is_quebec: bool) -> dict:
    base_earnings = max(0.0, min(annual_gross, CPP_YMPE_2026) - CPP_YBE)
    tier2_earnings = max(0.0, min(annual_gross, CPP_YAMPE_2026) - CPP_YMPE_2026)

    if is_quebec:
        base_rate = QPP_BASE_RATE
        tier2_rate = QPP2_RATE
    else:
        base_rate = CPP_BASE_RATE
        tier2_rate = CPP2_RATE

    employee = base_earnings * base_rate + tier2_earnings * tier2_rate
    employer = employee

    return {"employee": employee, "employer": employer}


def compute_ei_2026(annual_gross: float, is_quebec: bool) -> dict:
    insurable = max(0.0, min(annual_gross, EI_MIE_2026))
    employee_rate = EI_QUEBEC_EMPLOYEE_RATE if is_quebec else EI_EMPLOYEE_RATE

    employee = insurable * employee_rate
    employer = employee * EI_EMPLOYER_MULTIPLIER

    return {"employee": employee, "employer": employer}


def compute_qpip_2026(annual_gross: float) -> dict:
    insurable = max(0.0, min(annual_gross, QPIP_MIE_2026))
    return {
        "employee": insurable * QPIP_EMPLOYEE_RATE,
        "employer": insurable * QPIP_EMPLOYER_RATE,
    }


def compute_canada_payroll_2026(gross_monthly_cad: float, province_code: str) -> dict:
    """
    Compute the full monthly federal + provincial/territorial payroll
    picture for the standard reference employee in the given province.
    """
    province = PROVINCE_DATA_2026[province_code]
    is_quebec = province["is_quebec"]

    annual_gross = gross_monthly_cad * 12.0

    cpp_qpp = compute_cpp_qpp_2026(annual_gross, is_quebec)
    ei = compute_ei_2026(annual_gross, is_quebec)
    qpip = compute_qpip_2026(annual_gross) if is_quebec else {"employee": 0.0, "employer": 0.0}

    employee_contributions_annual = (
        cpp_qpp["employee"] + ei["employee"] + qpip["employee"]
    )

    ontario_eht_annual = annual_gross * ONTARIO_EHT_RATE if province_code == "ON" else 0.0
    quebec_fss_annual = annual_gross * QUEBEC_FSS_RATE if is_quebec else 0.0
    workers_comp_annual = annual_gross * WORKERS_COMP_ILLUSTRATIVE_RATE

    employer_contributions_annual = (
        cpp_qpp["employer"] + ei["employer"] + qpip["employer"]
        + ontario_eht_annual + quebec_fss_annual + workers_comp_annual
    )

    taxable_income = max(0.0, annual_gross - employee_contributions_annual)

    federal_bracket_tax = compute_marginal_tax(taxable_income, FEDERAL_BRACKETS_2026)
    federal_bpa = compute_federal_bpa_2026(taxable_income)
    federal_tax_before_abatement = max(0.0, federal_bracket_tax - federal_bpa * FEDERAL_LOWEST_RATE)

    if is_quebec:
        federal_tax = federal_tax_before_abatement * (1.0 - QUEBEC_FEDERAL_ABATEMENT_RATE)
    else:
        federal_tax = federal_tax_before_abatement

    provincial_bracket_tax = compute_marginal_tax(taxable_income, province["brackets"])
    provincial_bpa = compute_provincial_bpa_2026(taxable_income, province)
    provincial_tax = max(0.0, provincial_bracket_tax - provincial_bpa * province["lowest_rate"])

    if "surtax_tiers" in province:
        for threshold, rate in province["surtax_tiers"]:
            provincial_tax += max(0.0, provincial_tax - threshold) * rate

    if province.get("has_health_premium"):
        provincial_tax += compute_ontario_health_premium_2026(taxable_income)

    total_income_tax_annual = federal_tax + provincial_tax

    return {
        "annual_gross_cad": annual_gross,
        "taxable_income_annual_cad": taxable_income,
        "federal_tax_annual_cad": federal_tax,
        "provincial_tax_annual_cad": provincial_tax,
        "total_income_tax_annual_cad": total_income_tax_annual,
        "income_tax_monthly_cad": total_income_tax_annual / 12.0,
        "cpp_qpp_employee_monthly_cad": cpp_qpp["employee"] / 12.0,
        "cpp_qpp_employer_monthly_cad": cpp_qpp["employer"] / 12.0,
        "ei_employee_monthly_cad": ei["employee"] / 12.0,
        "ei_employer_monthly_cad": ei["employer"] / 12.0,
        "qpip_employee_monthly_cad": qpip["employee"] / 12.0,
        "qpip_employer_monthly_cad": qpip["employer"] / 12.0,
        "ontario_eht_monthly_cad": ontario_eht_annual / 12.0,
        "quebec_fss_monthly_cad": quebec_fss_annual / 12.0,
        "workers_comp_monthly_cad": workers_comp_annual / 12.0,
        "employee_contributions_monthly_cad": employee_contributions_annual / 12.0,
        "employer_contributions_monthly_cad": employer_contributions_annual / 12.0,
    }
