"""
United States federal + state payroll tax engine for the 2026 tax year.

Scope
-----
Single, childless private-sector employee, standard federal filing
status, one state selectable out of all 50 states + the District of
Columbia (mirroring the Swiss module's all-26-canton architecture).
Federal income tax, FICA (Social Security + Medicare, including the
Additional Medicare Tax), FUTA (employer-only, net rate) and each
state's own income tax (where one exists) plus its Unemployment
Insurance (SUI/SUTA) contribution and any other state-mandated payroll
deduction (State Disability Insurance, Paid Family and Medical Leave,
etc.) are modelled.

Wage reference
--------------
Unlike Sweden or Italy, the United States DOES have a federal minimum
wage (USD 7.25/hour, unchanged since 24 July 2009). This module uses
that federal floor, converted to a monthly full-time-equivalent
(7.25 x 40 hours/week x 52/12 = USD 1,256.6667/month), as its uniform
"1.0x" reference wage across every state -- the same convention used by
every other country module in this project. Many states and cities set
substantially higher minimum wages of their own (from USD 7.25 up to
over USD 17/hour); see each state's `state_minimum_wage_hourly` value
and the module's Limites section.

Federal layer (2026)
---------------------
Income tax: 7 brackets (10/12/22/24/32/35/37%), standard deduction
USD 16,100 (single filer), both inflation-adjusted annually by the IRS
(Rev. Proc. 2025-32). Social Security (OASDI): 6.2% employee / 6.2%
employer, wage base USD 184,500. Medicare: 1.45% employee / 1.45%
employer, uncapped, plus an Additional Medicare Tax of 0.9%
(employee-only, not employer-matched) on wages above USD 200,000 (a
statutory threshold, not inflation-indexed since 2013). FUTA: nominal
6.0% on the first USD 7,000 of wages, reduced by the standard 5.4%
credit for timely state UI payment to a net employer-only 0.6% in the
default case used here (California and the US Virgin Islands are
flagged by the Department of Labor as at risk of a FUTA credit
reduction for 2026, not finalised until after 10 November 2026 -- not
modelled, see Limites).

State layer (2026)
-------------------
Nine states (Alaska, Florida, Nevada, New Hampshire, South Dakota,
Tennessee, Texas, Washington, Wyoming) levy no state income tax on
wages. The remaining 41 states + DC each have their own bracket table
or flat rate and their own combined standard-deduction/personal-
exemption figure (the two concepts are combined into a single
`deduction` figure per state for tractability; Wisconsin's genuinely
income-dependent sliding-scale standard deduction is modelled exactly,
as the one state where this simplification would be materially wrong).
Every state's SUI/SUTA figure is that state's own published
new-employer rate (not an experience-rated range) and taxable wage
base. Three states also charge employees their own UI contribution
(Alaska, New Jersey, Pennsylvania) alongside the employer's. Where a
state mandates another payroll deduction beyond ordinary income tax and
SUI -- California (SDI), Colorado (FAMLI), Connecticut (CTPL), Delaware
(Paid Leave, new for 2026), the District of Columbia (PFL),
Massachusetts (PFML), Maine (PFML), Minnesota (Paid Leave, new for
2026), New Jersey (DI + FLI, on top of its employee UI share), New York
(SDI + PFL), Oregon (Paid Leave Oregon), Rhode Island (TDI), Washington
(PFML + WA Cares Fund) -- it is modelled as an `extra_items` entry with
its own employee/employer split and wage base.

Sources and per-item confidence are documented in
docs/data/usa/us_sources_2026.json. County/city-level income taxes
(pervasive in Indiana, Kentucky, Maryland, Ohio, Pennsylvania and
elsewhere) are out of scope, see the module's Limites section.
"""

import math


FEDERAL_2026 = {
    "brackets": [
        (0.0, 12400.0, 0.10),
        (12400.0, 50400.0, 0.12),
        (50400.0, 105700.0, 0.22),
        (105700.0, 201775.0, 0.24),
        (201775.0, 256225.0, 0.32),
        (256225.0, 640600.0, 0.35),
        (640600.0, math.inf, 0.37),
    ],
    "standard_deduction": 16100.0,
    "social_security_rate": 0.062,
    "social_security_wage_base": 184500.0,
    "medicare_rate": 0.0145,
    "additional_medicare_rate": 0.009,
    "additional_medicare_threshold": 200000.0,
    "futa_net_rate": 0.006,
    "futa_wage_base": 7000.0,
    "federal_minimum_wage_hourly": 7.25,
}

WI_SLIDING_DEDUCTION = "WI_SLIDING_DEDUCTION"


def _b(*pairs):
    """Build a bracket list from (upper_bound, rate) pairs, lower bound 0."""
    brackets = []
    lower = 0.0
    for upper, rate in pairs:
        upper_val = math.inf if upper is None else float(upper)
        brackets.append((lower, upper_val, rate))
        lower = upper_val
    return brackets


STATE_DATA_2026 = {
    "AL": {"name_fr": "Alabama", "name_en": "Alabama", "population": 5157699,
           "has_income_tax": True, "brackets": _b((500, 0.02), (3000, 0.04), (None, 0.05)),
           "deduction": 4000.0, "sui_employer_rate": 0.027, "sui_wage_base": 8000.0,
           "state_minimum_wage_hourly": 7.25},
    "AK": {"name_fr": "Alaska", "name_en": "Alaska", "population": 740133,
           "has_income_tax": False, "brackets": [], "deduction": 0.0,
           "sui_employer_rate": 0.01, "sui_wage_base": 54200.0, "employee_ui_rate": 0.005,
           "state_minimum_wage_hourly": 14.00},
    "AZ": {"name_fr": "Arizona", "name_en": "Arizona", "population": 7582384,
           "has_income_tax": True, "brackets": _b((None, 0.025)),
           "deduction": 16100.0, "sui_employer_rate": 0.02, "sui_wage_base": 8000.0,
           "state_minimum_wage_hourly": 15.15},
    "AR": {"name_fr": "Arkansas", "name_en": "Arkansas", "population": 3088354,
           "has_income_tax": True,
           "brackets": _b((5599, 0.0), (11199, 0.02), (15999, 0.03), (26399, 0.034), (None, 0.037)),
           "deduction": 2470.0, "sui_employer_rate": 0.022, "sui_wage_base": 7000.0,
           "state_minimum_wage_hourly": 11.00},
    "CA": {"name_fr": "Californie", "name_en": "California", "population": 39431263,
           "has_income_tax": True,
           "brackets": _b((11079, 0.01), (26264, 0.02), (41452, 0.04), (57542, 0.06), (72724, 0.08),
                          (371479, 0.093), (445771, 0.103), (742953, 0.113), (1000000, 0.123), (None, 0.133)),
           "deduction": 5706.0, "sui_employer_rate": 0.034, "sui_wage_base": 7000.0,
           "extra_items": [
               {"id": "sdi_pfl", "employee_rate": 0.013, "employer_rate": 0.0, "wage_base": None},
               {"id": "ett", "employee_rate": 0.0, "employer_rate": 0.001, "wage_base": 7000.0},
           ],
           "state_minimum_wage_hourly": 16.90,
           "note": "The 1% Mental Health Services Tax surtax above USD 1,000,000 is folded into the bracket table as its 10th (top) bracket."},
    "CO": {"name_fr": "Colorado", "name_en": "Colorado", "population": 5957493,
           "has_income_tax": True, "brackets": _b((None, 0.044)),
           "deduction": 16100.0, "sui_employer_rate": 0.017, "sui_wage_base": 30600.0,
           "extra_items": [{"id": "famli", "employee_rate": 0.0044, "employer_rate": 0.0044, "wage_base": 184500.0}],
           "state_minimum_wage_hourly": 15.16,
           "confidence_note": "SUI new-employer rate is illustrative: Colorado assigns an industry-specific introductory rate with no single published flat figure."},
    "CT": {"name_fr": "Connecticut", "name_en": "Connecticut", "population": 3675069,
           "has_income_tax": True,
           "brackets": _b((10000, 0.02), (50000, 0.045), (100000, 0.055), (200000, 0.06),
                          (250000, 0.065), (500000, 0.069), (None, 0.0699)),
           "deduction": 12000.0, "sui_employer_rate": 0.019, "sui_wage_base": 27000.0,
           "extra_items": [{"id": "ctpl", "employee_rate": 0.005, "employer_rate": 0.0, "wage_base": 184500.0}],
           "state_minimum_wage_hourly": 16.94,
           "note": "Connecticut's CTD 12,000 USD personal exemption phases out above USD 24,000-35,000 of income (Withholding Code A); this module applies the full exemption uniformly, see Limites."},
    "DE": {"name_fr": "Delaware", "name_en": "Delaware", "population": 1051917,
           "has_income_tax": True,
           "brackets": _b((2000, 0.0), (5000, 0.022), (10000, 0.039), (20000, 0.048),
                          (25000, 0.052), (60000, 0.0555), (None, 0.066)),
           "deduction": 3250.0, "sui_employer_rate": 0.02, "sui_wage_base": 14500.0,
           "extra_items": [{"id": "paid_leave", "employee_rate": 0.004, "employer_rate": 0.004, "wage_base": 184500.0}],
           "state_minimum_wage_hourly": 15.00,
           "note": "Delaware Paid Leave contributions begin 1 January 2026 (10+ employee firms); wage base approximated at the federal Social Security wage base."},
    "DC": {"name_fr": "District de Columbia", "name_en": "District of Columbia", "population": 702250,
           "has_income_tax": True,
           "brackets": _b((10000, 0.04), (40000, 0.06), (60000, 0.065), (250000, 0.085),
                          (500000, 0.0925), (1000000, 0.0975), (None, 0.1075)),
           "deduction": 16100.0, "sui_employer_rate": 0.029, "sui_wage_base": 9000.0,
           "extra_items": [{"id": "pfl", "employee_rate": 0.0, "employer_rate": 0.0075, "wage_base": None}],
           "state_minimum_wage_hourly": 18.40},
    "FL": {"name_fr": "Floride", "name_en": "Florida", "population": 23372215,
           "has_income_tax": False, "brackets": [], "deduction": 0.0,
           "sui_employer_rate": 0.027, "sui_wage_base": 7000.0,
           "state_minimum_wage_hourly": 15.00},
    "GA": {"name_fr": "Géorgie", "name_en": "Georgia", "population": 11180878,
           "has_income_tax": True, "brackets": _b((None, 0.0499)),
           "deduction": 15000.0, "sui_employer_rate": 0.027, "sui_wage_base": 9500.0,
           "state_minimum_wage_hourly": 7.25},
    "HI": {"name_fr": "Hawaï", "name_en": "Hawaii", "population": 1446146,
           "has_income_tax": True,
           "brackets": _b((9600, 0.014), (14400, 0.032), (19200, 0.055), (24000, 0.064),
                          (36000, 0.068), (48000, 0.072), (125000, 0.076), (175000, 0.079),
                          (225000, 0.0825), (275000, 0.09), (325000, 0.10), (None, 0.11)),
           "deduction": 4400.0, "sui_employer_rate": 0.024, "sui_wage_base": 64500.0,
           "extra_items": [{"id": "tdi", "employee_rate": 0.005, "employer_rate": 0.0, "wage_base": None}],
           "state_minimum_wage_hourly": 16.00,
           "confidence_note": "Full 12-tier bracket table is medium confidence: two independent secondary sources gave materially different thresholds and the primary Department of Taxation instructions booklet could not be machine-read this session; TDI is modelled as an illustrative flat employee rate (actual law caps the employee share at USD 7.50/week)."},
    "ID": {"name_fr": "Idaho", "name_en": "Idaho", "population": 2001619,
           "has_income_tax": True, "brackets": _b((None, 0.053)),
           "deduction": 16100.0, "sui_employer_rate": 0.01, "sui_wage_base": 58300.0,
           "state_minimum_wage_hourly": 7.25},
    "IL": {"name_fr": "Illinois", "name_en": "Illinois", "population": 12710158,
           "has_income_tax": True, "brackets": _b((None, 0.0495)),
           "deduction": 2925.0, "sui_employer_rate": 0.03525, "sui_wage_base": 14250.0,
           "state_minimum_wage_hourly": 15.00,
           "confidence_note": "SUI new-employer rate and wage base are medium confidence: sources gave conflicting figures and the official IDES 2026 rate PDF could not be machine-read this session."},
    "IN": {"name_fr": "Indiana", "name_en": "Indiana", "population": 6924275,
           "has_income_tax": True, "brackets": _b((None, 0.0295)),
           "deduction": 1000.0, "sui_employer_rate": 0.025, "sui_wage_base": 9500.0,
           "state_minimum_wage_hourly": 7.25,
           "note": "All 92 Indiana counties levy an additional local income tax (roughly 0.5%-3.3%+), not modelled."},
    "IA": {"name_fr": "Iowa", "name_en": "Iowa", "population": 3241488,
           "has_income_tax": True, "brackets": _b((None, 0.038)),
           "deduction": 16100.0, "sui_employer_rate": 0.01, "sui_wage_base": 20400.0,
           "state_minimum_wage_hourly": 7.25,
           "confidence_note": "Deduction assumes full federal conformity (not independently confirmed this session)."},
    "KS": {"name_fr": "Kansas", "name_en": "Kansas", "population": 2970606,
           "has_income_tax": True, "brackets": _b((23000, 0.052), (None, 0.0558)),
           "deduction": 3805.0, "sui_employer_rate": 0.027, "sui_wage_base": 14000.0,
           "state_minimum_wage_hourly": 7.25,
           "confidence_note": "SUI taxable wage base is medium confidence: sources gave both USD 14,000 and USD 15,100."},
    "KY": {"name_fr": "Kentucky", "name_en": "Kentucky", "population": 4588372,
           "has_income_tax": True, "brackets": _b((None, 0.035)),
           "deduction": 3360.0, "sui_employer_rate": 0.027, "sui_wage_base": 12000.0,
           "state_minimum_wage_hourly": 7.25,
           "note": "87 of 120 Kentucky counties (plus many cities/school districts) levy a local occupational license tax of 0.5%-2.5% of wages, not modelled."},
    "LA": {"name_fr": "Louisiane", "name_en": "Louisiana", "population": 4597740,
           "has_income_tax": True, "brackets": _b((None, 0.03)),
           "deduction": 12500.0, "sui_employer_rate": 0.012, "sui_wage_base": 7000.0,
           "state_minimum_wage_hourly": 7.25,
           "confidence_note": "SUI new-employer rate is illustrative: Louisiana assigns rates by employer average industry rate (floor 1.0%, cap 6.2%), no single flat figure."},
    "ME": {"name_fr": "Maine", "name_en": "Maine", "population": 1405012,
           "has_income_tax": True, "brackets": _b((27400, 0.058), (64850, 0.0675), (None, 0.0715)),
           "deduction": 20600.0, "sui_employer_rate": 0.0254, "sui_wage_base": 12000.0,
           "extra_items": [{"id": "pfml", "employee_rate": 0.005, "employer_rate": 0.005, "wage_base": 184500.0}],
           "state_minimum_wage_hourly": 15.10,
           "note": "Maine's PFML rate applies in full (0.5%/0.5%) to employers with 15+ employees; smaller employers pay a 0.5% employee-only rate, not separately modelled."},
    "MD": {"name_fr": "Maryland", "name_en": "Maryland", "population": 6263220,
           "has_income_tax": True,
           "brackets": _b((1000, 0.02), (2000, 0.03), (3000, 0.04), (100000, 0.0475), (125000, 0.05),
                          (150000, 0.0525), (250000, 0.055), (500000, 0.0575), (1000000, 0.0625), (None, 0.065)),
           "deduction": 3400.0, "sui_employer_rate": 0.026, "sui_wage_base": 8500.0,
           "state_minimum_wage_hourly": 15.00,
           "note": "Every Maryland county and Baltimore City levies an additional local 'piggyback' income tax (2.25%-3.20%), not modelled -- see Limites."},
    "MA": {"name_fr": "Massachusetts", "name_en": "Massachusetts", "population": 7136171,
           "has_income_tax": True, "brackets": _b((1107750, 0.05), (None, 0.09)),
           "deduction": 4400.0, "sui_employer_rate": 0.0242, "sui_wage_base": 15000.0,
           "extra_items": [{"id": "pfml", "employee_rate": 0.0046, "employer_rate": 0.0042, "wage_base": 184500.0}],
           "state_minimum_wage_hourly": 15.00,
           "note": "The 4% 'Fair Share' surtax above USD 1,107,750 is folded into the bracket table as a second (9% marginal) tier."},
    "MI": {"name_fr": "Michigan", "name_en": "Michigan", "population": 10140459,
           "has_income_tax": True, "brackets": _b((None, 0.0425)),
           "deduction": 5900.0, "sui_employer_rate": 0.027, "sui_wage_base": 9000.0,
           "state_minimum_wage_hourly": 13.73},
    "MN": {"name_fr": "Minnesota", "name_en": "Minnesota", "population": 5793151,
           "has_income_tax": True,
           "brackets": _b((33310, 0.0535), (109430, 0.068), (203150, 0.0785), (None, 0.0985)),
           "deduction": 15300.0, "sui_employer_rate": 0.024, "sui_wage_base": 44000.0,
           "extra_items": [{"id": "paid_leave", "employee_rate": 0.0044, "employer_rate": 0.0044, "wage_base": 185000.0}],
           "state_minimum_wage_hourly": 11.41,
           "confidence_note": "SUI new-employer rate is illustrative (Minnesota assigns 51 industry-specific rates plus a 0.4% base tax); Minnesota Paid Leave took effect 1 January 2026."},
    "MS": {"name_fr": "Mississippi", "name_en": "Mississippi", "population": 2943045,
           "has_income_tax": True, "brackets": _b((10000, 0.0), (None, 0.04)),
           "deduction": 0.0, "sui_employer_rate": 0.01, "sui_wage_base": 14000.0,
           "state_minimum_wage_hourly": 7.25},
    "MO": {"name_fr": "Missouri", "name_en": "Missouri", "population": 6245466,
           "has_income_tax": True,
           "brackets": _b((1348, 0.0), (2696, 0.02), (4044, 0.025), (5392, 0.03), (6740, 0.035),
                          (8088, 0.04), (9436, 0.045), (None, 0.047)),
           "deduction": 16100.0, "sui_employer_rate": 0.02376, "sui_wage_base": 9000.0,
           "state_minimum_wage_hourly": 15.00},
    "MT": {"name_fr": "Montana", "name_en": "Montana", "population": 1137233,
           "has_income_tax": True, "brackets": _b((47500, 0.047), (None, 0.0565)),
           "deduction": 16100.0, "sui_employer_rate": 0.0138, "sui_wage_base": 47300.0,
           "state_minimum_wage_hourly": 10.85},
    "NE": {"name_fr": "Nebraska", "name_en": "Nebraska", "population": 2005465,
           "has_income_tax": True, "brackets": _b((4130, 0.0246), (24760, 0.0351), (None, 0.0455)),
           "deduction": 8850.0, "sui_employer_rate": 0.0125, "sui_wage_base": 9000.0,
           "state_minimum_wage_hourly": 15.00},
    "NV": {"name_fr": "Nevada", "name_en": "Nevada", "population": 3267467,
           "has_income_tax": False, "brackets": [], "deduction": 0.0,
           "sui_employer_rate": 0.03, "sui_wage_base": 43700.0,
           "state_minimum_wage_hourly": 12.00},
    "NH": {"name_fr": "New Hampshire", "name_en": "New Hampshire", "population": 1409032,
           "has_income_tax": False, "brackets": [], "deduction": 0.0,
           "sui_employer_rate": 0.017, "sui_wage_base": 14500.0,
           "state_minimum_wage_hourly": 7.25},
    "NJ": {"name_fr": "New Jersey", "name_en": "New Jersey", "population": 9500851,
           "has_income_tax": True,
           "brackets": _b((20000, 0.014), (35000, 0.0175), (40000, 0.035), (75000, 0.05525),
                          (500000, 0.0637), (1000000, 0.0897), (None, 0.1075)),
           "deduction": 1000.0, "sui_employer_rate": 0.033, "sui_wage_base": 44800.0,
           "employee_ui_rate": 0.006150,
           "extra_items": [{"id": "fli", "employee_rate": 0.0023, "employer_rate": 0.0, "wage_base": 171100.0}],
           "state_minimum_wage_hourly": 15.49,
           "note": "New Jersey's employee UI rate bundles UI (0.3825%), Disability Insurance (0.19%) and Workforce/Supplemental Workforce Fund (0.0425%); the employer rate bundles the same three programmes (2.6825% + 0.5% + 0.1175%)."},
    "NM": {"name_fr": "Nouveau-Mexique", "name_en": "New Mexico", "population": 2130256,
           "has_income_tax": True,
           "brackets": _b((5500, 0.015), (16500, 0.032), (33500, 0.043), (66500, 0.047), (210000, 0.049), (None, 0.059)),
           "deduction": 16100.0, "sui_employer_rate": 0.01, "sui_wage_base": 34800.0,
           "state_minimum_wage_hourly": 12.00,
           "confidence_note": "Deduction assumes full federal conformity (not independently confirmed this session)."},
    "NY": {"name_fr": "New York", "name_en": "New York", "population": 19867248,
           "has_income_tax": True,
           "brackets": _b((8500, 0.04), (11700, 0.045), (13900, 0.0525), (80650, 0.055), (215400, 0.06),
                          (1077550, 0.0685), (5000000, 0.0965), (25000000, 0.103), (None, 0.109)),
           "deduction": 8000.0, "sui_employer_rate": 0.041, "sui_wage_base": 17600.0,
           "extra_items": [
               {"id": "sdi", "employee_rate": 0.0, "employer_rate": 0.0, "wage_base": None, "flat_monthly_eur": 2.60},
               {"id": "pfl", "employee_rate": 0.00432, "employer_rate": 0.0, "wage_base": None, "annual_cap": 411.91},
           ],
           "state_minimum_wage_hourly": 15.50,
           "note": "NY State Disability Benefits Law caps the employee contribution at a flat USD 0.60/week (~USD 2.60/month); Paid Family Leave is 0.432% of wages capped at USD 411.91/year."},
    "NC": {"name_fr": "Caroline du Nord", "name_en": "North Carolina", "population": 11046024,
           "has_income_tax": True, "brackets": _b((None, 0.0399)),
           "deduction": 12750.0, "sui_employer_rate": 0.01, "sui_wage_base": 34200.0,
           "state_minimum_wage_hourly": 7.25},
    "ND": {"name_fr": "Dakota du Nord", "name_en": "North Dakota", "population": 796568,
           "has_income_tax": True, "brackets": _b((48475, 0.0), (244825, 0.0195), (None, 0.025)),
           "deduction": 0.0, "sui_employer_rate": 0.01, "sui_wage_base": 46600.0,
           "state_minimum_wage_hourly": 7.25,
           "confidence_note": "The top-bracket threshold (USD 244,825) could not be independently verified against a machine-readable primary source this session."},
    "OH": {"name_fr": "Ohio", "name_en": "Ohio", "population": 11883304,
           "has_income_tax": True, "brackets": _b((26050, 0.0), (None, 0.0275)),
           "deduction": 2400.0, "sui_employer_rate": 0.03, "sui_wage_base": 9500.0,
           "state_minimum_wage_hourly": 11.00},
    "OK": {"name_fr": "Oklahoma", "name_en": "Oklahoma", "population": 4095393,
           "has_income_tax": True, "brackets": _b((3750, 0.0), (4900, 0.025), (7200, 0.035), (None, 0.045)),
           "deduction": 7350.0, "sui_employer_rate": 0.015, "sui_wage_base": 25000.0,
           "state_minimum_wage_hourly": 7.25},
    "OR": {"name_fr": "Oregon", "name_en": "Oregon", "population": 4272371,
           "has_income_tax": True, "brackets": _b((4550, 0.0475), (11400, 0.0675), (125000, 0.0875), (None, 0.099)),
           "deduction": 2910.0, "sui_employer_rate": 0.024, "sui_wage_base": 56700.0,
           "extra_items": [{"id": "paid_leave_oregon", "employee_rate": 0.006, "employer_rate": 0.004, "wage_base": 184500.0}],
           "state_minimum_wage_hourly": 15.55},
    "PA": {"name_fr": "Pennsylvanie", "name_en": "Pennsylvania", "population": 13078751,
           "has_income_tax": True, "brackets": _b((None, 0.0307)),
           "deduction": 0.0, "sui_employer_rate": 0.03822, "sui_wage_base": 10000.0,
           "employee_ui_rate": 0.0007,
           "state_minimum_wage_hourly": 7.25,
           "note": "Pennsylvania's local Earned Income Tax (0%-~3.75% depending on municipality, e.g. Philadelphia) is not modelled."},
    "RI": {"name_fr": "Rhode Island", "name_en": "Rhode Island", "population": 1112308,
           "has_income_tax": True, "brackets": _b((82050, 0.0375), (186450, 0.0475), (None, 0.0599)),
           "deduction": 10550.0, "sui_employer_rate": 0.0121, "sui_wage_base": 30800.0,
           "extra_items": [{"id": "tdi", "employee_rate": 0.011, "employer_rate": 0.0, "wage_base": 100000.0}],
           "state_minimum_wage_hourly": 16.00,
           "confidence_note": "State minimum wage figure not independently re-verified this session."},
    "SC": {"name_fr": "Caroline du Sud", "name_en": "South Carolina", "population": 5478831,
           "has_income_tax": True, "brackets": _b((30000, 0.0199), (None, 0.0521)),
           "deduction": 15000.0, "sui_employer_rate": 0.0075, "sui_wage_base": 14000.0,
           "state_minimum_wage_hourly": 7.25,
           "note": "South Carolina restructured its bracket table mid-year via Act 110 (signed 30 March 2026), effective for the whole of tax year 2026."},
    "SD": {"name_fr": "Dakota du Sud", "name_en": "South Dakota", "population": 924669,
           "has_income_tax": False, "brackets": [], "deduction": 0.0,
           "sui_employer_rate": 0.0175, "sui_wage_base": 15000.0,
           "state_minimum_wage_hourly": 11.85},
    "TN": {"name_fr": "Tennessee", "name_en": "Tennessee", "population": 7227750,
           "has_income_tax": False, "brackets": [], "deduction": 0.0,
           "sui_employer_rate": 0.027, "sui_wage_base": 7000.0,
           "state_minimum_wage_hourly": 7.25},
    "TX": {"name_fr": "Texas", "name_en": "Texas", "population": 31290831,
           "has_income_tax": False, "brackets": [], "deduction": 0.0,
           "sui_employer_rate": 0.027, "sui_wage_base": 9000.0,
           "state_minimum_wage_hourly": 7.25},
    "UT": {"name_fr": "Utah", "name_en": "Utah", "population": 3503613,
           "has_income_tax": True, "brackets": _b((None, 0.0445)),
           "deduction": 16100.0, "sui_employer_rate": 0.011, "sui_wage_base": 50700.0,
           "state_minimum_wage_hourly": 7.25,
           "note": "Utah replaces a standard deduction with a nonrefundable, income-phased-out 'Taxpayer Tax Credit'; this module approximates the net effect using the federal standard deduction as the taxable-income base, not the credit itself."},
    "VT": {"name_fr": "Vermont", "name_en": "Vermont", "population": 648493,
           "has_income_tax": True, "brackets": _b((49400, 0.0335), (119700, 0.066), (229050, 0.076), (None, 0.0875)),
           "deduction": 11500.0, "sui_employer_rate": 0.01, "sui_wage_base": 15400.0,
           "state_minimum_wage_hourly": 14.42,
           "confidence_note": "Top-bracket threshold cross-checked at USD 229,050 after an initial source gave USD 249,700; recommend a final direct check against the official Vermont tax tables."},
    "VA": {"name_fr": "Virginie", "name_en": "Virginia", "population": 8811195,
           "has_income_tax": True, "brackets": _b((3000, 0.02), (5000, 0.03), (17000, 0.05), (None, 0.0575)),
           "deduction": 8750.0, "sui_employer_rate": 0.025, "sui_wage_base": 8000.0,
           "state_minimum_wage_hourly": 12.77,
           "note": "Virginia enacted a Paid Family and Medical Leave programme in 2026, but contributions do not begin until 1 April 2028 -- not modelled for 2026."},
    "WA": {"name_fr": "État de Washington", "name_en": "Washington", "population": 7958180,
           "has_income_tax": False, "brackets": [], "deduction": 0.0,
           "sui_employer_rate": 0.01, "sui_wage_base": 78200.0,
           "extra_items": [
               {"id": "pfml", "employee_rate": 0.008071, "employer_rate": 0.003229, "wage_base": 184500.0},
               {"id": "wa_cares", "employee_rate": 0.0058, "employer_rate": 0.0, "wage_base": None},
           ],
           "state_minimum_wage_hourly": 17.13},
    "WV": {"name_fr": "Virginie-Occidentale", "name_en": "West Virginia", "population": 1769979,
           "has_income_tax": True,
           "brackets": _b((10000, 0.0211), (25000, 0.0281), (40000, 0.0316), (60000, 0.0422), (None, 0.0458)),
           "deduction": 2000.0, "sui_employer_rate": 0.027, "sui_wage_base": 9500.0,
           "state_minimum_wage_hourly": 8.75},
    "WI": {"name_fr": "Wisconsin", "name_en": "Wisconsin", "population": 5960975,
           "has_income_tax": True,
           "brackets": _b((15110, 0.035), (51950, 0.044), (332720, 0.053), (None, 0.0765)),
           "deduction": WI_SLIDING_DEDUCTION, "sui_employer_rate": 0.0305, "sui_wage_base": 14000.0,
           "state_minimum_wage_hourly": 7.25,
           "note": "Wisconsin's standard deduction is a genuine sliding scale (USD 6,702 max below USD 17,780 of income, phasing down by USD 0.12 per USD 1 above that, to zero around USD 73,630), modelled exactly rather than approximated."},
    "WY": {"name_fr": "Wyoming", "name_en": "Wyoming", "population": 587618,
           "has_income_tax": False, "brackets": [], "deduction": 0.0,
           "sui_employer_rate": 0.0228, "sui_wage_base": 33800.0,
           "state_minimum_wage_hourly": 7.25,
           "confidence_note": "SUI new-employer rate is illustrative (Wyoming assigns industry-specific rates from 2.28% to 9.78%, no single flat figure)."},
}


def round_cent(value: float) -> float:
    return round(float(value) + 1e-9, 2)


def compute_marginal_tax(taxable_income: float, brackets: list) -> float:
    income = max(0.0, taxable_income)
    tax = 0.0
    for lower, upper, rate in brackets:
        if income <= lower:
            break
        tax += (min(income, upper) - lower) * rate
    return tax


def compute_wisconsin_deduction(annual_gross: float) -> float:
    if annual_gross <= 17780.0:
        return 6702.0
    return max(0.0, 6702.0 - 0.12 * (annual_gross - 17780.0))


def compute_federal_tax_2026(annual_gross_eur: float) -> dict:
    taxable = max(0.0, annual_gross_eur - FEDERAL_2026["standard_deduction"])
    income_tax = compute_marginal_tax(taxable, FEDERAL_2026["brackets"])

    ss_base = min(annual_gross_eur, FEDERAL_2026["social_security_wage_base"])
    social_security_employee = ss_base * FEDERAL_2026["social_security_rate"]
    social_security_employer = ss_base * FEDERAL_2026["social_security_rate"]

    medicare_employee = annual_gross_eur * FEDERAL_2026["medicare_rate"]
    medicare_employer = annual_gross_eur * FEDERAL_2026["medicare_rate"]

    additional_medicare = max(
        0.0,
        annual_gross_eur - FEDERAL_2026["additional_medicare_threshold"]
    ) * FEDERAL_2026["additional_medicare_rate"]

    futa = min(annual_gross_eur, FEDERAL_2026["futa_wage_base"]) * FEDERAL_2026["futa_net_rate"]

    return {
        "federal_income_tax_annual": income_tax,
        "social_security_employee_annual": social_security_employee,
        "social_security_employer_annual": social_security_employer,
        "medicare_employee_annual": medicare_employee,
        "medicare_employer_annual": medicare_employer,
        "additional_medicare_employee_annual": additional_medicare,
        "futa_employer_annual": futa,
        "employee_contributions_annual": (
            social_security_employee + medicare_employee + additional_medicare
        ),
        "employer_contributions_annual": (
            social_security_employer + medicare_employer + futa
        ),
    }


def compute_state_tax_2026(annual_gross_eur: float, state_code: str) -> dict:
    state = STATE_DATA_2026[state_code]

    if state["has_income_tax"]:
        deduction = state["deduction"]
        if deduction == WI_SLIDING_DEDUCTION:
            deduction = compute_wisconsin_deduction(annual_gross_eur)
        taxable = max(0.0, annual_gross_eur - deduction)
        state_income_tax = compute_marginal_tax(taxable, state["brackets"])
    else:
        state_income_tax = 0.0

    sui = min(annual_gross_eur, state["sui_wage_base"]) * state["sui_employer_rate"]
    employee_ui = annual_gross_eur * state.get("employee_ui_rate", 0.0)

    extra_employee_total = 0.0
    extra_employer_total = 0.0
    extra_breakdown = []

    for item in state.get("extra_items", []):
        if "flat_monthly_eur" in item:
            employee_amount = item["flat_monthly_eur"] * 12.0
            employer_amount = 0.0
        else:
            wage_base = item.get("wage_base")
            base = annual_gross_eur if wage_base is None else min(annual_gross_eur, wage_base)
            employee_amount = base * item["employee_rate"]
            employer_amount = base * item["employer_rate"]
            annual_cap = item.get("annual_cap")
            if annual_cap is not None:
                employee_amount = min(employee_amount, annual_cap)

        extra_employee_total += employee_amount
        extra_employer_total += employer_amount
        extra_breakdown.append({
            "id": item["id"],
            "employee_annual": employee_amount,
            "employer_annual": employer_amount,
        })

    return {
        "state_income_tax_annual": state_income_tax,
        "sui_employer_annual": sui,
        "employee_ui_annual": employee_ui,
        "extra_employee_annual": extra_employee_total,
        "extra_employer_annual": extra_employer_total,
        "extra_breakdown": extra_breakdown,
        "employee_contributions_annual": employee_ui + extra_employee_total,
        "employer_contributions_annual": sui + extra_employer_total,
    }


def compute_us_payroll_2026(gross_monthly_eur: float, state_code: str) -> dict:
    """
    Compute the full monthly federal + state payroll picture for the
    standard reference employee in the given state.
    """
    annual_gross = round_cent(gross_monthly_eur * 12.0)

    federal = compute_federal_tax_2026(annual_gross)
    state = compute_state_tax_2026(annual_gross, state_code)

    employee_contributions_annual = (
        federal["employee_contributions_annual"] + state["employee_contributions_annual"]
    )
    employer_contributions_annual = (
        federal["employer_contributions_annual"] + state["employer_contributions_annual"]
    )
    income_tax_annual = federal["federal_income_tax_annual"] + state["state_income_tax_annual"]

    return {
        "annual_gross_usd": annual_gross,
        "federal": federal,
        "state": state,
        "income_tax_annual_usd": income_tax_annual,
        "income_tax_monthly_usd": income_tax_annual / 12.0,
        "employee_contributions_annual_usd": employee_contributions_annual,
        "employee_contributions_monthly_usd": employee_contributions_annual / 12.0,
        "employer_contributions_annual_usd": employer_contributions_annual,
        "employer_contributions_monthly_usd": employer_contributions_annual / 12.0,
    }
