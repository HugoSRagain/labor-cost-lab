"""
Swiss Labour Cost Lab
Ordinary tax assessment engine for 2026 ("taxation ordinaire" / "imposition
ordinaire" / "ordentliche Veranlagung") -- the annual tax-return regime that
applies to Swiss citizens and C-permit holders, as opposed to the
withholding tax at source ("impot a la source") computed in
swiss_withholding_tax_2026.py for foreign workers without a C permit.

Scope
-----
Single, childless taxpayer, no church affiliation, resident in the canton's
reference municipality (the cantonal capital in nearly every case, matching
the convention already used for withholding tax -- see
switzerland_parameters_2026.json "cantons"). Combines three layers:

1. Federal income tax (impot federal direct, IFD) -- a single national
   scale, identical in every canton.
2. Cantonal income tax -- each canton legislates its own base scale
   ("bareme cantonal de base" / "einfache Steuer"), and its own mechanism
   for turning that base tax into the actual cantonal tax due. Four
   mechanisms are found across the 26 cantons:
   - "marginal": standard marginal brackets, then the base tax is
     multiplied by an annual cantonal coefficient ("Steuerfuss" /
     "coefficient annuel" / "multiple annuel"). This is the majority case.
   - "marginal_direct": standard marginal brackets, with NO further
     cantonal-level multiplier (the bracket result IS the cantonal tax).
     Ticino (TI) and Basel-Stadt (BS, which additionally has no separate
     communal layer -- see below).
   - "flat": a single flat rate on the whole income, then multiplied by
     the cantonal coefficient. Uri (UR) and Obwalden (OW).
   - "cliff": standard marginal brackets up to a threshold, above which a
     single flat rate applies to the WHOLE income (not just the excess) --
     a genuine step discontinuity, then multiplied by the cantonal
     coefficient. Appenzell Innerrhoden (AI), Appenzell Ausserrhoden (AR),
     Glarus (GL).
   - "interpolated": the canton's own legislative text states that a
     single average rate applies to the WHOLE income, and that this rate
     interpolates continuously between the rate at the bottom and the
     rate at the top of each income class (not a marginal bracket system
     at all). Fribourg (FR) and Valais (VS, confirmed with no further
     cantonal-level multiplier). This module approximates the continuous
     interpolation with the discrete class boundaries actually sourced
     (the official schedules interpolate at CHF 100 increments; this is a
     documented simplification -- see limits).
   - "formula": a continuous logarithmic marginal-rate formula,
     tax = b*x + c*x*(ln(x)-1) + d over each income range. Basel-Landschaft
     (BL) only. The formula parameters sourced are the base (2005)
     legislative parameters, re-indexed annually by a mechanism not fully
     reproduced here -- documented as a lower-confidence entry.
   - "geneva": a bespoke multi-stage mechanism specific to Geneva (GE):
     cantonal tax = base tax x (1 + 48.5% centimes additionnels cantonaux)
     x (1 - 12% statutory reduction, Art. 1 LDIRPP); the 12% reduction does
     NOT apply to the communal centimes additionnels (see communal layer).
3. Communal income tax -- each canton's reference municipality (cantonal
   capital) applies its own multiplier on the SAME cantonal base tax
   (mechanism "marginal"/"flat"/"cliff"/"interpolated"/"formula" as above,
   before the cantonal coefficient is applied), except:
   - Basel-Stadt (BS): no separate communal tax at the cantonal capital
     (Basel-Stadt itself levies no commune-level surtax; only the two
     small communes of Riehen and Bettingen do).
   - Ticino (TI) and Valais (VS): communal tax uses its own multiplier on
     the cantonal base tax, same as most cantons, even though the
     cantonal layer itself has no multiplier.
   - Geneva (GE): communal centimes additionnels apply to the base tax
     directly, NOT reduced by the 12% statutory cut (Art. 1 LDIRPP,
     "a l'exception des centimes additionnels communaux").

Sources
-------
- Federal (IFD) bracket table: Form 58c 2026, ESTV.
- Cantonal base scales and mechanisms: ESTV "Kantonsblatt" / "Feuille
  cantonale" / "Foglio cantonale" per canton (estv2.admin.ch/stp/kb/).
- Cantonal and communal multipliers for cantonal capitals: ESTV/SSK,
  "Taux et coefficients d'impots" / "Steuersatz und Steuerfuss", section
  3.4.1, "Etat de la legislation au 1er janvier 2026".
See docs/data/switzerland/switzerland_sources_2026.json for exact URLs,
legal article citations and per-canton confidence notes.

Not modeled (see switzerland module "Limites"): family quotient / income
splitting for married or single-parent households (irrelevant for this
module's single/childless reference profile in every canton except as a
structural feature of the canton's law); aggregate income+wealth tax caps
("bouclier fiscal" / "Höchstbelastung" / "freno all'imposta") in effect in
several cantons (BE, LU, BS, AG, VD, VS, TI, GE and others), since this
module does not compute wealth tax; church tax (consistent with the
existing withholding-tax module's "no church tax when available"
convention); capital pension payments and liquidation gains, which nearly
every canton taxes separately at reduced rates.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Optional, Tuple


def round_chf(value: float) -> float:
    """Round a monetary value to the nearest centime."""
    return round(float(value) + 1e-9, 2)


def floor_to_100(value: float) -> float:
    """Floor to the nearest CHF 100 (federal IFD rule: fractions below 100 dropped)."""
    return math.floor(float(value) / 100.0) * 100.0


def floor_to_nickel(value: float) -> float:
    """Floor to the nearest 5 centimes (federal IFD rounding rule)."""
    return math.floor(float(value) / 0.05 + 1e-9) * 0.05


# ---------------------------------------------------------------------------
# Generic bracket helpers
# ---------------------------------------------------------------------------

def apply_marginal_brackets(income: float, brackets: List[Tuple[Optional[float], float]]) -> float:
    """
    Standard marginal-bracket progressive tax, starting from income 0.

    `brackets` is a list of (upper_bound, rate) tuples in ascending order,
    upper_bound is None for the top (unbounded) bracket.
    """
    x = max(0.0, income)
    tax = 0.0
    lower = 0.0

    for upper_bound, rate in brackets:
        if upper_bound is None or x <= upper_bound:
            tax += rate * (x - lower)
            return tax

        tax += rate * (upper_bound - lower)
        lower = upper_bound

    return tax


def apply_marginal_with_cliff(
    income: float,
    brackets: List[Tuple[Optional[float], float]],
    cliff_threshold: float,
    cliff_rate: float,
) -> float:
    """Marginal brackets below the cliff; a single flat rate on the WHOLE
    income (not just the excess) once the cliff threshold is reached."""
    if income >= cliff_threshold:
        return income * cliff_rate

    return apply_marginal_brackets(income, brackets)


def apply_flat_rate(income: float, rate: float) -> float:
    return max(0.0, income) * rate


def apply_interpolated_whole_income_rate(
    income: float,
    classes: List[Tuple[float, float, float]],
) -> float:
    """
    Whole-income average-rate system (Fribourg, Valais): `classes` is a
    list of (upper_bound, rate) tuples, in ascending order, approximating
    the officially continuously-interpolated schedule with the sourced
    class boundaries. Income within a class is taxed, in full, at that
    class's own rate (no interpolation within the class -- see module
    docstring, documented simplification).
    """
    x = max(0.0, income)

    for upper_bound, rate in classes:
        if upper_bound is None or x <= upper_bound:
            return x * rate

    return x * classes[-1][1]


@dataclass(frozen=True)
class LogFormulaSegment:
    upper_bound: Optional[float]
    b: float
    c: float
    d: float


def apply_log_formula(income: float, segments: List[LogFormulaSegment]) -> float:
    """Basel-Landschaft's continuous logarithmic formula:
    tax = b*x + c*x*(ln(x) - 1) + d, selected by income segment."""
    x = max(0.0, income)

    if x <= 0:
        return 0.0

    for segment in segments:
        if segment.upper_bound is None or x <= segment.upper_bound:
            return segment.b * x + segment.c * x * (math.log(x) - 1.0) + segment.d

    last = segments[-1]
    return last.b * x + last.c * x * (math.log(x) - 1.0) + last.d


# ---------------------------------------------------------------------------
# Federal tax (impot federal direct, IFD) -- single national scale
# ---------------------------------------------------------------------------

FEDERAL_BRACKETS_SINGLE_2026: List[Tuple[float, Optional[float], float]] = [
    (18500.0, 33200.0, 0.0077),
    (33200.0, 43500.0, 0.0088),
    (43500.0, 58000.0, 0.0264),
    (58000.0, 76200.0, 0.0297),
    (76200.0, 82100.0, 0.0594),
    (82100.0, 108900.0, 0.0660),
    (108900.0, 141500.0, 0.0880),
    (141500.0, 185100.0, 0.1100),
    (185100.0, None, 0.1320),
]

FEDERAL_BASE_TAX_AT_18500_CHF = 25.41
FEDERAL_EXEMPTION_THRESHOLD_CHF = 18500.0
FEDERAL_MAXIMUM_AVERAGE_RATE = 0.115


def compute_federal_tax_2026(annual_income_chf: float) -> float:
    """Federal direct tax (IFD), single taxpayer, 2026 (Form 58c)."""
    income = floor_to_100(annual_income_chf)

    if income < FEDERAL_EXEMPTION_THRESHOLD_CHF:
        return 0.0

    tax = FEDERAL_BASE_TAX_AT_18500_CHF
    lower = FEDERAL_EXEMPTION_THRESHOLD_CHF

    for bracket_lower, bracket_upper, rate in FEDERAL_BRACKETS_SINGLE_2026:
        if income <= bracket_lower:
            break

        segment_upper = income if (bracket_upper is None or income <= bracket_upper) else bracket_upper
        tax += (segment_upper - bracket_lower) * rate

        if bracket_upper is None or income <= bracket_upper:
            break

        lower = bracket_upper

    tax = min(tax, income * FEDERAL_MAXIMUM_AVERAGE_RATE)

    return floor_to_nickel(tax)


# ---------------------------------------------------------------------------
# Cantonal base scales, mechanisms and multipliers
# ---------------------------------------------------------------------------
# "mechanism" one of: marginal, marginal_direct, flat, cliff, interpolated,
# formula, geneva.
# "cantonal_multiplier" / "communal_multiplier": the annual coefficient
# applied to the base tax (1.0 = no multiplier / direct / already-final).

CANTON_ORDINARY_TAX_2026 = {
    "ZH": {
        "mechanism": "marginal",
        "brackets": [
            (7000.0, 0.0), (12000.0, 0.02), (16800.0, 0.03), (24800.0, 0.04),
            (34500.0, 0.05), (45700.0, 0.06), (58800.0, 0.07), (76400.0, 0.08),
            (110400.0, 0.09), (144100.0, 0.10), (197400.0, 0.11), (266700.0, 0.12),
            (None, 0.13),
        ],
        "cantonal_multiplier": 0.95,
        "communal_multiplier": 1.19,
    },
    "BE": {
        "mechanism": "marginal",
        "brackets": [
            (3300.0, 0.0195), (6600.0, 0.0290), (16400.0, 0.0360), (32500.0, 0.0415),
            (59400.0, 0.0445), (86300.0, 0.0500), (113200.0, 0.0560), (140100.0, 0.0575),
            (167000.0, 0.0590), (193900.0, 0.0605), (231600.0, 0.0615), (318500.0, 0.0630),
            (470600.0, 0.0640), (None, 0.0650),
        ],
        "cantonal_multiplier": 2.975,
        "communal_multiplier": 1.54,
    },
    "LU": {
        "mechanism": "marginal",
        "brackets": [
            (9900.0, 0.0), (12300.0, 0.0050), (15500.0, 0.0100), (16700.0, 0.0200),
            (17900.0, 0.0300), (20800.0, 0.0400), (25100.0, 0.0450), (110100.0, 0.0500),
            (163900.0, 0.0525), (190100.0, 0.0550), (2096800.0, 0.0580), (None, 0.0570),
        ],
        "cantonal_multiplier": 1.45,
        "communal_multiplier": 1.45,
    },
    "UR": {
        "mechanism": "flat",
        "flat_rate": 0.071,
        "cantonal_multiplier": 1.00,
        "communal_multiplier": 0.95,
    },
    "SZ": {
        "mechanism": "marginal",
        "brackets": [
            (1500.0, 0.0025), (2800.0, 0.0050), (3900.0, 0.0075), (4900.0, 0.0100),
            (5900.0, 0.0125), (7000.0, 0.0150), (8300.0, 0.0175), (10100.0, 0.0200),
            (12500.0, 0.0225), (16100.0, 0.0250), (22000.0, 0.0275), (30200.0, 0.0300),
            (40700.0, 0.0325), (52300.0, 0.0350), (61600.0, 0.0365), (258800.0, 0.0390),
            (433500.0, 0.0700), (None, 0.0500),
        ],
        "cantonal_multiplier": 1.10,
        "communal_multiplier": 1.75,
    },
    "OW": {
        "mechanism": "flat",
        "flat_rate": 0.018,
        "cantonal_multiplier": 3.15,
        "communal_multiplier": 3.86,
    },
    "NW": {
        "mechanism": "marginal",
        "brackets": [
            (11600.0, 0.0), (14000.0, 0.0050), (15200.0, 0.0100), (16400.0, 0.0120),
            (17600.0, 0.0140), (18800.0, 0.0160), (20000.0, 0.0180), (21200.0, 0.0200),
            (22400.0, 0.0220), (23600.0, 0.0240), (24800.0, 0.0260), (32800.0, 0.0280),
            (50100.0, 0.0290), (81300.0, 0.0300), (116000.0, 0.0310), (148800.0, 0.0320),
            (166000.0, 0.0330), (None, 0.0275),
        ],
        "cantonal_multiplier": 2.66,
        "communal_multiplier": 2.35,
    },
    "GL": {
        "mechanism": "cliff",
        "brackets": [
            (10300.0, 0.08), (20600.0, 0.11), (30900.0, 0.13), (51600.0, 0.15),
            (103200.0, 0.16), (154700.0, 0.175), (257900.0, 0.19), (412600.0, 0.21),
            (464200.0, 0.21),
        ],
        "cliff_threshold": 464200.0,
        "cliff_rate": 0.17,
        "cantonal_multiplier": 0.597,
        "communal_multiplier": 0.61,
    },
    "ZG": {
        "mechanism": "marginal",
        "brackets": [
            (1100.0, 0.0050), (3300.0, 0.0100), (6100.0, 0.0200), (10100.0, 0.0300),
            (15300.0, 0.0325), (21100.0, 0.0350), (26700.0, 0.0400), (34700.0, 0.0450),
            (45800.0, 0.0550), (58700.0, 0.0550), (73200.0, 0.0650), (92700.0, 0.0800),
            (117200.0, 0.1000), (146100.0, 0.0900), (None, 0.0800),
        ],
        "cantonal_multiplier": 0.82,
        "communal_multiplier": 0.5211,
    },
    "FR": {
        "mechanism": "interpolated",
        "classes": [
            (17499.0, 0.041598), (31399.0, 0.062031), (48299.0, 0.080283),
            (63799.0, 0.090978), (77599.0, 0.099810), (102099.0, 0.108630),
            (128699.0, 0.117142), (155999.0, 0.125332), (180999.0, 0.131082),
            (207099.0, 0.134997), (None, 0.13500),
        ],
        "cantonal_multiplier": 0.96,
        "communal_multiplier": 0.80,
    },
    "SO": {
        "mechanism": "marginal",
        "brackets": [
            (12400.0, 0.0), (16500.0, 0.0450), (20600.0, 0.0500), (23700.0, 0.0650),
            (25800.0, 0.0800), (28900.0, 0.0900), (40200.0, 0.0950), (55700.0, 0.1000),
            (101100.0, 0.1050), (319900.0, 0.1150), (None, 0.1050),
        ],
        "cantonal_multiplier": 1.04,
        "communal_multiplier": 1.07,
    },
    "BS": {
        "mechanism": "marginal_direct",
        "brackets": [
            (212500.0, 0.21), (316300.0, 0.2725), (None, 0.2825),
        ],
        "cantonal_multiplier": 1.00,
        "communal_multiplier": 0.0,
        "no_separate_communal": True,
    },
    "BL": {
        "mechanism": "formula",
        "segments": [
            LogFormulaSegment(40000.0, -0.81773, 0.08972, 744.3),
            LogFormulaSegment(100000.0, -0.323806, 0.043109, -1120.1564),
            LogFormulaSegment(1150000.0, 0.052296, 0.010441, -4386.9376),
            LogFormulaSegment(None, 0.1862, 0.0, 0.0),
        ],
        "formula_floor_income_chf": 15000.0,
        "cantonal_multiplier": 1.00,
        "communal_multiplier": 0.65,
        "confidence": "medium",
    },
    "SH": {
        "mechanism": "marginal",
        "brackets": [
            (6300.0, 0.0), (6600.0, 0.01), (8300.0, 0.02), (10400.0, 0.03),
            (12700.0, 0.04), (20600.0, 0.05), (28500.0, 0.06), (36400.0, 0.07),
            (44300.0, 0.08), (56900.0, 0.09), (69500.0, 0.10), (141000.0, 0.11),
            (210100.0, 0.12), (None, 0.099),
        ],
        "cantonal_multiplier": 0.76,
        "communal_multiplier": 0.83,
    },
    "AR": {
        "mechanism": "cliff",
        "brackets": [
            (8300.0, 0.0), (9900.0, 0.006), (11500.0, 0.01), (15700.0, 0.015),
            (27200.0, 0.018), (41800.0, 0.022), (54300.0, 0.024), (73900.0, 0.026),
            (88500.0, 0.027), (125000.0, 0.028), (260800.0, 0.029),
        ],
        "cliff_threshold": 260800.0,
        "cliff_rate": 0.026,
        "cantonal_multiplier": 3.30,
        "communal_multiplier": 4.10,
    },
    "AI": {
        "mechanism": "cliff",
        "brackets": [
            (3000.0, 0.0), (6000.0, 0.01), (9000.0, 0.02), (12000.0, 0.03),
            (15000.0, 0.04), (18000.0, 0.05), (22000.0, 0.06), (26000.0, 0.07),
            (30000.0, 0.075), (40000.0, 0.08), (74000.0, 0.085), (140000.0, 0.09),
            (200000.0, 0.085),
        ],
        "cliff_threshold": 200000.0,
        "cliff_rate": 0.08,
        "cantonal_multiplier": 0.96,
        "communal_multiplier": 0.56,
    },
    "SG": {
        "mechanism": "cliff",
        "brackets": [
            (11600.0, 0.0), (15800.0, 0.04), (33800.0, 0.06), (60300.0, 0.08),
            (98400.0, 0.092), (264500.0, 0.094),
        ],
        "cliff_threshold": 264500.0,
        "cliff_rate": 0.085,
        "cantonal_multiplier": 1.05,
        "communal_multiplier": 1.38,
    },
    "GR": {
        "mechanism": "marginal",
        "brackets": [
            (16895.0, 0.0), (17985.0, 0.025), (19075.0, 0.04), (20165.0, 0.05),
            (21255.0, 0.06), (22345.0, 0.065), (24525.0, 0.07), (31065.0, 0.08),
            (35425.0, 0.085), (39785.0, 0.09), (44145.0, 0.095), (65945.0, 0.103),
            (87745.0, 0.106), (109545.0, 0.107), (218545.0, 0.112), (327545.0, 0.113),
            (671440.0, 0.114), (780440.0, 0.116), (None, 0.110),
        ],
        "cantonal_multiplier": 0.92,
        "communal_multiplier": 0.88,
    },
    "AG": {
        "mechanism": "marginal",
        "brackets": [
            (4300.0, 0.0), (8100.0, 0.01), (12000.0, 0.02), (16200.0, 0.03),
            (20500.0, 0.04), (25700.0, 0.05), (33100.0, 0.06), (41700.0, 0.07),
            (51300.0, 0.08), (63100.0, 0.085), (74800.0, 0.09), (110100.0, 0.095),
            (176400.0, 0.10), (352700.0, 0.105), (None, 0.11),
        ],
        "cantonal_multiplier": 1.03,
        "communal_multiplier": 0.96,
    },
    "TG": {
        "mechanism": "marginal",
        "brackets": [
            (12200.0, 0.0), (14600.0, 0.02), (16800.0, 0.03), (18900.0, 0.04),
            (21000.0, 0.05), (36800.0, 0.06), (84400.0, 0.07), (158400.0, 0.075),
            (None, 0.08),
        ],
        "cantonal_multiplier": 1.09,
        "communal_multiplier": 1.42,
    },
    "TI": {
        "mechanism": "marginal_direct",
        "brackets": [
            (12500.0, 0.0016), (17400.0, 0.05232), (20800.0, 0.05949), (26000.0, 0.03923),
            (30100.0, 0.07499), (39900.0, 0.09461), (52700.0, 0.10377), (58100.0, 0.10988),
            (73000.0, 0.11800), (91400.0, 0.11597), (113900.0, 0.12470), (227800.0, 0.13080),
            (380600.0, 0.14040), (None, 0.1400),
        ],
        "cantonal_multiplier": 1.00,
        "communal_multiplier": 0.93,
    },
    "VD": {
        "mechanism": "marginal",
        "brackets": [
            (1600.0, 0.01), (3400.0, 0.02), (5100.0, 0.03), (8300.0, 0.04),
            (11900.0, 0.05), (15100.0, 0.06), (23600.0, 0.07), (40500.0, 0.08),
            (57200.0, 0.09), (74400.0, 0.10), (91200.0, 0.11), (108100.0, 0.12),
            (135000.0, 0.125), (162000.0, 0.13), (192500.0, 0.135), (223000.0, 0.14),
            (256000.0, 0.145), (291700.0, 0.15), (None, 0.155),
        ],
        "base_tax_rebate": 0.05,
        "cantonal_multiplier": 1.55,
        "communal_multiplier": 0.785,
    },
    "VS": {
        "mechanism": "interpolated",
        "classes": [
            (6300.0, 0.020), (12700.0, 0.027992), (19000.0, 0.036915), (25400.0, 0.045982),
            (38100.0, 0.062978), (50800.0, 0.076975), (63500.0, 0.089974), (76200.0, 0.104963),
            (88900.0, 0.117962), (101600.0, 0.129960), (114300.0, 0.132989), (127000.0, 0.134992),
            (139700.0, 0.135498), (152400.0, 0.135998), (165100.0, 0.136497), (177800.0, 0.136997),
            (190500.0, 0.137497), (203200.0, 0.137997), (215900.0, 0.138497), (228700.0, 0.13900),
            (241400.0, 0.13950), (254100.0, 0.1400), (None, 0.1400),
        ],
        "cantonal_multiplier": 1.00,
        "communal_multiplier": 1.10,
    },
    "NE": {
        "mechanism": "marginal",
        "brackets": [
            (7700.0, 0.0), (10300.0, 0.0198), (15500.0, 0.0396), (20600.0, 0.0792),
            (30900.0, 0.11484), (41200.0, 0.11781), (51500.0, 0.12177), (61800.0, 0.12672),
            (72100.0, 0.13167), (82400.0, 0.13662), (92700.0, 0.14058), (103000.0, 0.14355),
            (113300.0, 0.14652), (123600.0, 0.14949), (133900.0, 0.15246), (144200.0, 0.15345),
            (154500.0, 0.15444), (164800.0, 0.15543), (175100.0, 0.15741), (185400.0, 0.15939),
            (195700.0, 0.16038), (206000.0, 0.16038), (309000.0, 0.13665), (412000.0, 0.136125),
            (None, 0.1386),
        ],
        "cantonal_multiplier": 1.24,
        "communal_multiplier": 0.65,
    },
    "GE": {
        "mechanism": "geneva",
        "brackets": [
            (18700.0, 0.0), (22530.0, 0.073), (24784.0, 0.082), (27036.0, 0.091),
            (29290.0, 0.100), (34922.0, 0.109), (39428.0, 0.113), (43935.0, 0.123),
            (48441.0, 0.128), (77730.0, 0.132), (127297.0, 0.142), (171231.0, 0.150),
            (193762.0, 0.156), (277125.0, 0.158), (295150.0, 0.160), (415688.0, 0.168),
            (651131.0, 0.176), (None, 0.180),
        ],
        "cantonal_centimes_rate": 0.485,
        "cantonal_statutory_reduction": 0.12,
        "communal_multiplier": 0.4549,
    },
    "JU": {
        "mechanism": "marginal",
        "brackets": [
            (6900.0, 0.0), (14700.0, 0.01667), (28700.0, 0.03149), (50500.0, 0.04029),
            (92700.0, 0.04909), (205200.0, 0.05558), (None, 0.05789),
        ],
        "cantonal_multiplier": 2.85,
        "communal_multiplier": 1.90,
    },
}


def compute_cantonal_base_tax(canton_code: str, annual_income_chf: float) -> float:
    """Compute the cantonal 'base tax' (einfache Steuer / impot de base /
    impot simple), before any cantonal or communal multiplier."""
    canton = CANTON_ORDINARY_TAX_2026[canton_code]
    mechanism = canton["mechanism"]
    income = max(0.0, annual_income_chf)

    if mechanism in ("marginal", "marginal_direct"):
        base_tax = apply_marginal_brackets(income, canton["brackets"])

        if canton_code == "VD":
            base_tax *= (1.0 - canton["base_tax_rebate"])

        return base_tax

    if mechanism == "flat":
        return apply_flat_rate(income, canton["flat_rate"])

    if mechanism == "cliff":
        return apply_marginal_with_cliff(
            income,
            canton["brackets"],
            canton["cliff_threshold"],
            canton["cliff_rate"],
        )

    if mechanism == "interpolated":
        return apply_interpolated_whole_income_rate(income, canton["classes"])

    if mechanism == "formula":
        if income < canton["formula_floor_income_chf"]:
            return 0.0
        return apply_log_formula(income, canton["segments"])

    if mechanism == "geneva":
        return apply_marginal_brackets(income, canton["brackets"])

    raise ValueError(f"Unknown mechanism for canton {canton_code}: {mechanism}")


def compute_cantonal_tax(canton_code: str, annual_income_chf: float) -> float:
    """Compute the cantonal income tax due (base tax x cantonal multiplier,
    or the Geneva-specific multi-stage mechanism)."""
    canton = CANTON_ORDINARY_TAX_2026[canton_code]
    base_tax = compute_cantonal_base_tax(canton_code, annual_income_chf)

    if canton["mechanism"] == "geneva":
        return base_tax * (1.0 + canton["cantonal_centimes_rate"]) * (1.0 - canton["cantonal_statutory_reduction"])

    return base_tax * canton["cantonal_multiplier"]


def compute_communal_tax(canton_code: str, annual_income_chf: float) -> float:
    """Compute the communal income tax due at the reference municipality
    (cantonal capital), on the same base tax as the cantonal layer."""
    canton = CANTON_ORDINARY_TAX_2026[canton_code]

    if canton.get("no_separate_communal"):
        return 0.0

    base_tax = compute_cantonal_base_tax(canton_code, annual_income_chf)

    return base_tax * canton["communal_multiplier"]


def compute_ordinary_tax_2026(annual_income_chf: float, canton_code: str) -> dict:
    """
    Compute the full ordinary-assessment annual income tax (federal +
    cantonal + communal) for a single, childless taxpayer resident in the
    given canton's reference municipality.
    """
    canton_code = canton_code.upper()

    federal_tax = compute_federal_tax_2026(annual_income_chf)
    cantonal_tax = round_chf(compute_cantonal_tax(canton_code, annual_income_chf))
    communal_tax = round_chf(compute_communal_tax(canton_code, annual_income_chf))

    total_tax = round_chf(federal_tax + cantonal_tax + communal_tax)

    return {
        "annual_income_chf": round_chf(annual_income_chf),
        "federal_tax_annual_chf": federal_tax,
        "cantonal_tax_annual_chf": cantonal_tax,
        "communal_tax_annual_chf": communal_tax,
        "total_ordinary_tax_annual_chf": total_tax,
        "total_ordinary_tax_monthly_chf": round_chf(total_tax / 12.0),
    }
