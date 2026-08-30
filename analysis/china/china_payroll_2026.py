"""
China individual income tax (IIT) and social insurance / housing fund
engine for the 2026 tax year.

Scope
-----
Single, childless private-sector employee, standard formal (office/
professional-services, work-injury Tier 1) employment, no special
additional deductions (no children, no mortgage/rent claim modelled, no
elderly dependants, no serious-illness expense), one province/
municipality/autonomous region selectable out of all 31 mainland
divisions (mirroring the Swiss all-26-canton and US all-50-state
architecture). Hong Kong, Macau and Taiwan are out of scope (different
tax jurisdictions).

Individual Income Tax (IIT, 个人所得税) -- entirely NATIONAL
--------------------------------------------------------------
Unlike every province-specific parameter below, the IIT bracket table,
the basic deduction and the six special additional deductions are set
by national law and apply identically in every province -- the annual
7-bracket comprehensive-income schedule (3/10/20/25/30/35/45%,
thresholds unchanged since 2019) and the RMB 60,000/year (5,000/month)
basic deduction (基本减除费用).

In practice, employers withhold IIT monthly using the "cumulative
withholding method" (累计预扣法, STA Announcements 2018 No. 56/61):
each month's withholding is computed on year-to-date cumulative income
and cumulative deductions, so nominal monthly withholding starts low
and rises through the year even at a constant salary, converging to
the true annual liability by December (any small remaining gap is
settled at 年度汇算清缴, the annual reconciliation held March-June the
following year). For a standard single-employer, constant-salary,
no-special-deduction reference profile -- exactly this module's scope
-- the cumulative method's year-end result is, to a very close
approximation, identical to simply applying the annual bracket table to
annual taxable income and dividing by 12. This module uses that
simplified, settled-annual-equivalent monthly figure rather than
reproducing the month-by-month ramp, consistent with how every other
country module in this project reports a steady-state monthly value.

Social insurance ("五险", five insurances) and the Housing Provident
Fund ("一金", 住房公积金) -- NATIONALLY FRAMED, PROVINCIALLY PARAMETERISED
-----------------------------------------------------------------------------
Pension (养老保险), medical insurance (医疗保险, with maternity/生育保险
now merged into medical fund administration in every province
researched), unemployment insurance (失业保险) and work-injury insurance
(工伤保险, employer-only) are collected in every province, but each
province separately sets: the contribution BASE floor and cap (缴费
基数下限/上限, typically 60%-300% of the province's own prior-year
average wage, reset annually -- usually each July), and, in a
meaningful number of provinces, the contribution RATES themselves
(e.g. Guangdong's unemployment-insurance split is 0.8% employer /
0.2% employee rather than the more common 0.5%/0.5%; Hunan, Hainan and
Chongqing each set their own work-injury Tier-1 base rate rather than
the 0.2% national default; Inner Mongolia's pension employer rate is
reported at 19% rather than 16%). A handful of provinces (Hebei, Inner
Mongolia, Liaoning, Fujian, Shaanxi, Gansu, Guizhou) additionally use a
separate contribution base for medical insurance than for pension/
unemployment/work-injury -- modelled explicitly where confirmed.

The Housing Provident Fund's contribution RATE is, nationally, an
employer's own discretionary choice within a 5%-12% band (employer and
employee must contribute the same rate) -- not a province-specific
mandated figure. This module uses a single illustrative rate of 7%
uniformly (the rate most frequently cited as the typical private-
employer choice in the provinces researched), consistent with how this
project already uses one uniform illustrative rate for a similarly
discretionary item (Italy's INAIL workplace-injury-insurance rate). The
Fund's contribution BASE floor and cap, unlike its rate, ARE province-
specific published figures and are modelled per province.

Reference wage
-----------------
China has no national minimum wage; each province/municipality sets
its own (both a monthly and an hourly rate). Consistent with how this
project already handles Sweden's and Italy's lack of a statutory
minimum wage, and how the United States applies one uniform reference
wage (its federal minimum wage) across every state regardless of each
state's own higher minimum, this module uses Shanghai's monthly minimum
wage (RMB 2,740/month, effective 1 July 2025 -- the most commonly used
financial-hub reference in cross-country payroll comparisons) as its
single "1.0x" reference wage, applied uniformly across every province's
own contribution-base/rate parameters. This is a methodological choice,
not a claim that Shanghai's minimum wage is a national standard; every
province's own minimum wage is documented for comparison.
"""

import math


IIT_BASIC_DEDUCTION_ANNUAL = 60000.0

IIT_BRACKETS_ANNUAL_2026 = [
    (0.0, 36000.0, 0.03),
    (36000.0, 144000.0, 0.10),
    (144000.0, 300000.0, 0.20),
    (300000.0, 420000.0, 0.25),
    (420000.0, 660000.0, 0.30),
    (660000.0, 960000.0, 0.35),
    (960000.0, math.inf, 0.45),
]

HOUSING_FUND_RATE_ILLUSTRATIVE = 0.07

WAGE_REFERENCE_MONTHLY_RMB = 2740.0


def _u(floor, cap):
    return {"floor": floor, "cap": cap}


PROVINCE_DATA_2026 = {
    "BJ": {"name_fr": "Pekin", "name_en": "Beijing", "population": 21830000,
           "si_base": _u(7162.0, 35811.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.098, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2540.0, 35811.0),
           "minimum_wage_monthly": 2540.0},
    "TJ": {"name_fr": "Tianjin", "name_en": "Tianjin", "population": 13640000,
           "si_base": _u(5124.0, 25620.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.10, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2320.0, 27861.0),
           "minimum_wage_monthly": 2510.0},
    "HE": {"name_fr": "Hebei", "name_en": "Hebei", "population": 73780000,
           "si_base": _u(4007.0, 20034.0),
           "medical_base": _u(5955.25, 20034.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.065, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.002,
           "hpf_base": _u(5284.0, 26420.0),
           "minimum_wage_monthly": 2380.0,
           "note": "Reference city: Shijiazhuang."},
    "SX": {"name_fr": "Shanxi", "name_en": "Shanxi", "population": 34460000,
           "si_base": _u(4198.0, 20991.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.08, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2150.0, 28251.0),
           "minimum_wage_monthly": 2150.0,
           "note": "Reference city: Taiyuan."},
    "NM": {"name_fr": "Mongolie-Interieure", "name_en": "Inner Mongolia", "population": 23880000,
           "si_base": _u(4907.0, 24537.0),
           "medical_base": _u(6543.0, 24537.0),
           "pension": {"employer": 0.19, "employee": 0.08},
           "medical": {"employer": 0.06, "employee": 0.02},
           "unemployment": {"employer": 0.01, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2270.0, 29721.0),
           "minimum_wage_monthly": 2380.0,
           "note": "Reference city: Hohhot. Pension employer rate (19%) is a genuine deviation from the 16% national baseline, medium confidence (single-source cross-check).",
           "confidence_note": "Pension employer rate not independently cross-verified against a second source."},
    "LN": {"name_fr": "Liaoning", "name_en": "Liaoning", "population": 41550000,
           "si_base": _u(4359.0, 21792.0),
           "medical_base": _u(8076.0, 8076.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.092, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2100.0, 29523.0),
           "minimum_wage_monthly": 2230.0,
           "note": "Reference city: Shenyang. Shenyang's medical/maternity base is a fixed city-wide amount (RMB 8,076/month) rather than a floor-to-cap band tied to individual wages -- modelled as floor=cap."},
    "JL": {"name_fr": "Jilin", "name_en": "Jilin", "population": 23170000,
           "si_base": _u(4393.2, 21966.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.08, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2120.0, 27553.0),
           "minimum_wage_monthly": 2230.0,
           "note": "Reference city: Changchun."},
    "HL": {"name_fr": "Heilongjiang", "name_en": "Heilongjiang", "population": 30290000,
           "si_base": _u(4542.0, 22710.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.075, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2270.0, 26462.0),
           "minimum_wage_monthly": 2270.0,
           "note": "Reference city: Harbin. Medical insurance's own contribution base was not separately confirmed; the pension/unemployment/work-injury base is used as an approximation."},
    "SH": {"name_fr": "Shanghai", "name_en": "Shanghai", "population": 24800000,
           "si_base": _u(7460.0, 37302.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.095, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2740.0, 37302.0),
           "minimum_wage_monthly": 2740.0,
           "note": "This module's reference wage anchor (see module docstring)."},
    "JS": {"name_fr": "Jiangsu", "name_en": "Jiangsu", "population": 85260000,
           "si_base": _u(4952.0, 24762.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.078, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2490.0, 41400.0),
           "minimum_wage_monthly": 2660.0,
           "note": "Reference city: Nanjing."},
    "ZJ": {"name_fr": "Zhejiang", "name_en": "Zhejiang", "population": 66700000,
           "si_base": _u(4986.0, 25299.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.095, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2490.0, 40694.0),
           "minimum_wage_monthly": 2660.0,
           "note": "Reference city: Hangzhou."},
    "AH": {"name_fr": "Anhui", "name_en": "Anhui", "population": 61230000,
           "si_base": _u(4311.0, 21556.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.064, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2320.0, 30540.0),
           "minimum_wage_monthly": 2320.0,
           "note": "Reference city: Hefei."},
    "FJ": {"name_fr": "Fujian", "name_en": "Fujian", "population": 41930000,
           "si_base": _u(4043.0, 22607.0),
           "medical_base": _u(4579.0, 22893.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.087, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2195.0, 32430.0),
           "minimum_wage_monthly": 2195.0,
           "note": "Reference city: Fuzhou (a lower minimum-wage tier than Xiamen, which is Fujian's Tier-1 city)."},
    "JX": {"name_fr": "Jiangxi", "name_en": "Jiangxi", "population": 45020000,
           "si_base": _u(3915.0, 19575.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.073, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2600.0, 29589.0),
           "minimum_wage_monthly": 2240.0,
           "note": "Reference city: Nanchang."},
    "SD": {"name_fr": "Shandong", "name_en": "Shandong", "population": 100800000,
           "si_base": _u(4504.0, 22518.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.085, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2400.0, 32586.0),
           "minimum_wage_monthly": 2400.0,
           "note": "Reference city: Jinan."},
    "HA": {"name_fr": "Henan", "name_en": "Henan", "population": 97850000,
           "si_base": _u(3831.0, 19155.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.07, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2100.0, 27520.0),
           "minimum_wage_monthly": 2350.0,
           "note": "Reference city: Zhengzhou."},
    "HB": {"name_fr": "Hubei", "name_en": "Hubei", "population": 58340000,
           "si_base": _u(4498.0, 22488.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.08, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2210.0, 34560.25),
           "minimum_wage_monthly": 2400.0,
           "note": "Reference city: Wuhan."},
    "HN": {"name_fr": "Hunan", "name_en": "Hunan", "population": 65390000,
           "si_base": _u(4072.0, 20361.0),
           "medical_base": _u(6787.0, 20361.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.08, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.006,
           "hpf_base": _u(2100.0, 31291.0),
           "minimum_wage_monthly": 2200.0,
           "note": "Reference city: Changsha. Work-injury Tier 1 (0.6%) is a genuine provincial deviation from the 0.2% national default."},
    "GD": {"name_fr": "Guangdong", "name_en": "Guangdong", "population": 127800000,
           "si_base": _u(5510.0, 27549.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.045, "employee": 0.02},
           "unemployment": {"employer": 0.008, "employee": 0.002},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2500.0, 39828.0),
           "minimum_wage_monthly": 2500.0,
           "note": "Reference city: Guangzhou (provincial capital). Guangzhou's employer medical rate (4.5%) is a temporary stage-based relief rate, not independently confirmed to persist through all of 2026 -- flagged as a limitation. Shenzhen, in the same province, differs meaningfully: a hukou-dependent pension employer rate (16% or 17%), its own separate medical contribution base (RMB 6,733-33,666/month) and its own minimum wage (RMB 2,520/month) -- not modelled as a separate entry to keep this module at exactly 31 provincial divisions.",
           "confidence_note": "Employer medical rate (4.5%) is an explicitly temporary relief measure; verify before relying on it long-term."},
    "GX": {"name_fr": "Guangxi", "name_en": "Guangxi", "population": 50130000,
           "si_base": _u(4143.0, 20715.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.065, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.001,
           "hpf_base": _u(2200.0, 28020.0),
           "minimum_wage_monthly": 2200.0,
           "note": "Reference city: Nanning. Unemployment (0.5/0.5) and work-injury (0.1%, a 50% reduction) rates are phased/temporary policies stated to run through 2025-12-31; continuation into 2026 assumed by precedent (annually renewed since 2015) but not independently confirmed."},
    "HI_CN": {"name_fr": "Hainan", "name_en": "Hainan", "population": 10480000,
              "si_base": _u(4912.8, 24564.0),
              "pension": {"employer": 0.16, "employee": 0.08},
              "medical": {"employer": 0.065, "employee": 0.02},
              "unemployment": {"employer": 0.005, "employee": 0.005},
              "work_injury_employer": 0.0015,
              "hpf_base": _u(2250.0, 30452.67),
              "minimum_wage_monthly": 2250.0,
              "note": "Reference city: Haikou. Medical rate (6.5%) is a temporary relief rate stated to run through 2026-12-31 (confirmed). Work-injury Tier 1 (0.15%) is a genuine provincial deviation, renewed effective 2026-01-01 (confirmed)."},
    "CQ": {"name_fr": "Chongqing", "name_en": "Chongqing", "population": 31900000,
           "si_base": _u(4404.0, 22017.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.095, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.003,
           "hpf_base": _u(2330.0, 30318.0),
           "minimum_wage_monthly": 2330.0,
           "note": "Work-injury Tier 1 (0.3%) is a genuine municipal deviation from the 0.2% national default."},
    "SC": {"name_fr": "Sichuan", "name_en": "Sichuan", "population": 83640000,
           "si_base": _u(4588.0, 22938.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.083, "employee": 0.02},
           "unemployment": {"employer": 0.006, "employee": 0.004},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2330.0, 31378.0),
           "minimum_wage_monthly": 2330.0,
           "note": "Reference city: Chengdu."},
    "GZ": {"name_fr": "Guizhou", "name_en": "Guizhou", "population": 38600000,
           "si_base": _u(4394.70, 21973.50),
           "medical_base": _u(5901.40, 22130.25),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.085, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2130.0, 25980.0),
           "minimum_wage_monthly": 2130.0,
           "note": "Reference city: Guiyang."},
    "YN": {"name_fr": "Yunnan", "name_en": "Yunnan", "population": 46550000,
           "si_base": _u(4357.0, 21789.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.08, "employee": 0.02},
           "unemployment": {"employer": 0.01, "employee": 0.005},
           "work_injury_employer": 0.0075,
           "hpf_base": _u(2170.0, 32470.0),
           "minimum_wage_monthly": 2070.0,
           "note": "Reference city: Kunming.",
           "confidence_note": "Pension employer rate (16%) and medical rate (8%, assumed at the common national pattern) could not be independently confirmed for Yunnan specifically; work-injury Tier 1 (0.75%) is also unconfirmed against an official rate table."},
    "XZ": {"name_fr": "Tibet", "name_en": "Tibet", "population": 3700000,
           "si_base": _u(7066.20, 35331.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.075, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.001,
           "hpf_base": _u(2360.0, 42214.0),
           "minimum_wage_monthly": 2360.0,
           "note": "Reference city: Lhasa. Work-injury Tier 1 (0.1%) is a genuine deviation from the 0.2% national default."},
    "SN": {"name_fr": "Shaanxi", "name_en": "Shaanxi", "population": 39530000,
           "si_base": _u(4729.0, 23643.0),
           "medical_base": _u(4990.0, 24948.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.08, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2376.0, 32726.0),
           "minimum_wage_monthly": 2376.0,
           "note": "Reference city: Xi'an."},
    "GS": {"name_fr": "Gansu", "name_en": "Gansu", "population": 24580000,
           "si_base": _u(4403.0, 22014.0),
           "medical_base": _u(4317.0, 21582.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.085, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2200.0, 30090.75),
           "minimum_wage_monthly": 2200.0,
           "note": "Reference city: Lanzhou."},
    "QH": {"name_fr": "Qinghai", "name_en": "Qinghai", "population": 5930000,
           "si_base": _u(5289.60, 26448.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.065, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2080.0, 31995.0),
           "minimum_wage_monthly": 2080.0,
           "note": "Reference city: Xining. The weakest-documented province in this module: contribution rates (pension/medical/unemployment/work-injury) could not be officially confirmed and are assumed at the common national pattern.",
           "confidence_note": "All contribution rates assumed at the national-pattern default; only the contribution base and minimum wage are directly confirmed."},
    "NX": {"name_fr": "Ningxia", "name_en": "Ningxia", "population": 7290000,
           "si_base": _u(4955.0, 24774.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.08, "employee": 0.02},
           "unemployment": {"employer": 0.007, "employee": 0.003},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2235.0, 32484.0),
           "minimum_wage_monthly": 2235.0,
           "note": "Reference city: Yinchuan.",
           "confidence_note": "Medical employee rate and work-injury Tier 1 rate assumed at the common national pattern, not independently confirmed for Ningxia."},
    "XJ": {"name_fr": "Xinjiang", "name_en": "Xinjiang", "population": 26230000,
           "si_base": _u(5069.0, 25344.0),
           "pension": {"employer": 0.16, "employee": 0.08},
           "medical": {"employer": 0.08, "employee": 0.02},
           "unemployment": {"employer": 0.005, "employee": 0.005},
           "work_injury_employer": 0.002,
           "hpf_base": _u(2070.0, 35071.0),
           "minimum_wage_monthly": 2070.0,
           "note": "Reference city: Urumqi.",
           "confidence_note": "Work-injury Tier 1 rate assumed at the common national pattern, not independently confirmed for Xinjiang."},
}


def compute_iit_annual_2026(annual_taxable_income_rmb: float) -> float:
    income = max(0.0, annual_taxable_income_rmb)
    tax = 0.0
    for lower, upper, rate in IIT_BRACKETS_ANNUAL_2026:
        if income <= lower:
            break
        tax += (min(income, upper) - lower) * rate
    return tax


def compute_social_insurance_2026(annual_gross_rmb: float, province_code: str) -> dict:
    province = PROVINCE_DATA_2026[province_code]

    si_base = province["si_base"]
    medical_base = province.get("medical_base", si_base)
    hpf_base = province["hpf_base"]

    monthly_gross = annual_gross_rmb / 12.0

    si_capped_base = min(max(monthly_gross, si_base["floor"]), si_base["cap"])
    medical_capped_base = min(max(monthly_gross, medical_base["floor"]), medical_base["cap"])
    hpf_capped_base = min(max(monthly_gross, hpf_base["floor"]), hpf_base["cap"])

    pension_employer = si_capped_base * province["pension"]["employer"]
    pension_employee = si_capped_base * province["pension"]["employee"]

    medical_employer = medical_capped_base * province["medical"]["employer"]
    medical_employee = medical_capped_base * province["medical"]["employee"]

    unemployment_employer = si_capped_base * province["unemployment"]["employer"]
    unemployment_employee = si_capped_base * province["unemployment"]["employee"]

    work_injury_employer = si_capped_base * province["work_injury_employer"]

    hpf_employer = hpf_capped_base * HOUSING_FUND_RATE_ILLUSTRATIVE
    hpf_employee = hpf_capped_base * HOUSING_FUND_RATE_ILLUSTRATIVE

    employer_total_monthly = (
        pension_employer + medical_employer + unemployment_employer
        + work_injury_employer + hpf_employer
    )
    employee_total_monthly = (
        pension_employee + medical_employee + unemployment_employee
        + hpf_employee
    )

    return {
        "pension_employer_monthly": pension_employer,
        "pension_employee_monthly": pension_employee,
        "medical_employer_monthly": medical_employer,
        "medical_employee_monthly": medical_employee,
        "unemployment_employer_monthly": unemployment_employer,
        "unemployment_employee_monthly": unemployment_employee,
        "work_injury_employer_monthly": work_injury_employer,
        "hpf_employer_monthly": hpf_employer,
        "hpf_employee_monthly": hpf_employee,
        "employer_total_monthly": employer_total_monthly,
        "employee_total_monthly": employee_total_monthly,
    }


def compute_china_payroll_2026(gross_monthly_rmb: float, province_code: str) -> dict:
    """
    Compute the full monthly IIT / social insurance / housing fund
    picture for the standard reference employee in the given province.
    """
    annual_gross = gross_monthly_rmb * 12.0

    si = compute_social_insurance_2026(annual_gross, province_code)

    annual_employee_contributions = si["employee_total_monthly"] * 12.0

    annual_taxable_income = max(
        0.0,
        annual_gross - annual_employee_contributions - IIT_BASIC_DEDUCTION_ANNUAL
    )

    annual_iit = compute_iit_annual_2026(annual_taxable_income)

    return {
        "annual_gross_rmb": annual_gross,
        "annual_taxable_income_rmb": annual_taxable_income,
        "annual_iit_rmb": annual_iit,
        "iit_monthly_rmb": annual_iit / 12.0,
        "employee_contributions_monthly_rmb": si["employee_total_monthly"],
        "employer_contributions_monthly_rmb": si["employer_total_monthly"],
        "social_insurance_breakdown": si,
    }
