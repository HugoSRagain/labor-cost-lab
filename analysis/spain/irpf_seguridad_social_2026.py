"""
Spanish IRPF income tax and Seguridad Social (Regimen General) engine for
the 2026 tax year (2025 IRPF scales, the latest confirmed and currently
effective figures, filed in the 2026 campaign).

Scope
-----
This module implements the central research scenario for the Spain Labour
Cost Lab module:

- single, childless employee, standard minimo personal only (no family
  minimums, no other income, no deductions beyond the statutory flat
  work-income expense allowance);
- 15 comunidades autonomas plus the Ceuta/Melilla special scale, each
  selectable as a "region_code" -- Navarra and Pais Vasco are NOT modelled:
  both operate a separate "foral" tax system (Concierto Economico / Convenio
  Economico) with their own tax administration, not just a different rate
  scale, and are out of scope for this module (see
  docs/data/spain/spain_sources_2026.json);
- Regimen General, contrato indefinido (permanent contract) Seguridad
  Social contribution rates (national, identical across all regions);
- a standard, low-risk AT/EP (accidentes de trabajo y enfermedades
  profesionales) employer-only premium, modelled at a flat rate since the
  official tariff varies by CNAE activity code (medium confidence -- see
  sources file).

Figures used (2025/2026):
- IRPF state scale (escala general estatal): 9.5% to EUR 12,450; 12% to
  EUR 20,200; 15% to EUR 35,200; 18.5% to EUR 60,000; 22.5% to
  EUR 300,000; 24.5% above. State "minimo del contribuyente" (single,
  childless): EUR 5,550/year.
- IRPF regional ("autonomica") scales: one per region, see
  REGIONAL_SCALES_2026 below. Each region also sets its OWN "minimo del
  contribuyente" for the regional portion of the tax only -- this can
  differ from the EUR 5,550 state figure (e.g. Madrid: EUR 5,956.65).
  The state portion of the tax always uses the EUR 5,550 state minimo,
  regardless of region.
- Minimo personal mechanism: for each of the state and regional scales
  separately, tax = scale(taxable base) - scale(minimo applied), i.e. the
  minimo is a "taxed at zero" slice, not a deduction from the taxable base
  itself.
- Flat work-income expense allowance ("otros gastos", Art. 19.2.f LIRPF):
  EUR 2,000/year, subtracted from gross salary (after Seguridad Social
  contributions) to obtain rendimiento neto del trabajo. National, does
  not vary by region.
- Reduccion por obtencion de rendimientos del trabajo (Art. 20 LIRPF): a
  further reduction of the taxable work income, critical to reproduce
  Spain's policy of near-zero income tax at the minimum-wage level --
  EUR 7,302 if rendimiento neto del trabajo <= EUR 14,852; tapering
  linearly to EUR 2,364.34 at EUR 17,673.52, then to EUR 0 at
  EUR 19,747.50 and above. National, does not vary by region.
- Seguridad Social, Regimen General, contrato indefinido: employee 6.50%
  (contingencias comunes 4.70%, desempleo 1.55%, MEI 0.15%, formacion
  profesional 0.10%); employer 31.65% (contingencias comunes 23.60%,
  desempleo 5.50%, MEI 0.75%, formacion profesional 0.60%, FOGASA 0.20%,
  AT/EP 1.00% assumed standard low-risk rate). Contribution base is the
  gross monthly wage, floored at the base minima (EUR 1,424.40/month) and
  capped at the base maxima (EUR 5,101.20/month). National, does not vary
  by region.
"""


def round_cent(value: float) -> float:
    """
    Round to the nearest cent.
    """
    return round(float(value) + 1e-12, 2)


def apply_progressive_scale(base: float, brackets: list) -> float:
    """
    Apply a progressive marginal-bracket scale to `base`.

    `brackets` is a list of (upper_bound, rate) tuples, in ascending
    order, where upper_bound is None for the top (unbounded) bracket.
    """
    x = max(0.0, base)
    tax = 0.0
    lower = 0.0

    for upper_bound, rate in brackets:
        if upper_bound is None or x <= upper_bound:
            tax += rate * (x - lower)
            return tax

        tax += rate * (upper_bound - lower)
        lower = upper_bound

    return tax


STATE_BRACKETS_2026 = [
    (12450.00, 0.095),
    (20200.00, 0.12),
    (35200.00, 0.15),
    (60000.00, 0.185),
    (300000.00, 0.225),
    (None, 0.245),
]

STATE_PERSONAL_MINIMUM_2026 = 5550.00
WORK_INCOME_FLAT_EXPENSE_2026 = 2000.00

# Regional ("autonomica") IRPF scales, 2025 figures (current through the
# 2026 filing campaign; no region has yet legislated a distinct scale for
# 2026 income). Source: AEAT, Manual Practico de Renta 2025, per-region
# "gravamen autonomico" pages -- see spain_sources_2026.json for the exact
# URLs. Navarra and Pais Vasco are excluded (foral systems, out of scope).
REGIONAL_SCALES_2026 = {
    "madrid": {
        "brackets": [
            (13362.22, 0.085),
            (19004.63, 0.107),
            (35425.68, 0.128),
            (57320.40, 0.174),
            (None, 0.205),
        ],
        "personal_minimum_eur": 5956.65,
    },
    "andalucia": {
        "brackets": [
            (13000.00, 0.095),
            (21100.00, 0.12),
            (35200.00, 0.15),
            (60000.00, 0.185),
            (None, 0.225),
        ],
        "personal_minimum_eur": 5790.00,
    },
    "aragon": {
        "brackets": [
            (13072.50, 0.095),
            (21210.00, 0.12),
            (36960.00, 0.15),
            (52500.00, 0.185),
            (60000.00, 0.205),
            (80000.00, 0.23),
            (90000.00, 0.24),
            (130000.00, 0.25),
            (None, 0.255),
        ],
        "personal_minimum_eur": 5550.00,
    },
    "asturias": {
        "brackets": [
            (12450.00, 0.09),
            (17707.20, 0.12),
            (33007.20, 0.14),
            (53407.20, 0.192),
            (70000.00, 0.215),
            (90000.00, 0.225),
            (175000.00, 0.25),
            (None, 0.26),
        ],
        "personal_minimum_eur": 6105.00,
    },
    "baleares": {
        "brackets": [
            (10000.00, 0.09),
            (18000.00, 0.1125),
            (30000.00, 0.1425),
            (48000.00, 0.175),
            (70000.00, 0.19),
            (90000.00, 0.2175),
            (120000.00, 0.2275),
            (175000.00, 0.2375),
            (None, 0.2475),
        ],
        "personal_minimum_eur": 6105.00,
    },
    "canarias": {
        "brackets": [
            (13748.00, 0.09),
            (19422.00, 0.115),
            (35924.00, 0.14),
            (57566.00, 0.185),
            (93268.00, 0.235),
            (123745.00, 0.25),
            (None, 0.26),
        ],
        "personal_minimum_eur": 5606.00,
    },
    "cantabria": {
        "brackets": [
            (13000.00, 0.085),
            (21000.00, 0.11),
            (35200.00, 0.145),
            (60000.00, 0.18),
            (90000.00, 0.225),
            (None, 0.245),
        ],
        "personal_minimum_eur": 5550.00,
    },
    "castilla_la_mancha": {
        "brackets": [
            (12450.00, 0.095),
            (20200.00, 0.12),
            (35200.00, 0.15),
            (60000.00, 0.185),
            (None, 0.225),
        ],
        "personal_minimum_eur": 5550.00,
    },
    "castilla_y_leon": {
        "brackets": [
            (12450.00, 0.09),
            (20200.00, 0.12),
            (35200.00, 0.14),
            (53407.20, 0.185),
            (None, 0.215),
        ],
        "personal_minimum_eur": 5550.00,
    },
    "cataluna": {
        "brackets": [
            (12500.00, 0.095),
            (22000.00, 0.125),
            (33000.00, 0.16),
            (53000.00, 0.19),
            (90000.00, 0.215),
            (120000.00, 0.235),
            (175000.00, 0.245),
            (None, 0.255),
        ],
        "personal_minimum_eur": 5550.00,
    },
    "extremadura": {
        "brackets": [
            (12450.00, 0.08),
            (20200.00, 0.10),
            (24200.00, 0.16),
            (35200.00, 0.175),
            (60000.00, 0.21),
            (80200.00, 0.235),
            (99200.00, 0.24),
            (120200.00, 0.245),
            (None, 0.25),
        ],
        "personal_minimum_eur": 5550.00,
    },
    "galicia": {
        "brackets": [
            (12985.35, 0.09),
            (21068.60, 0.1165),
            (35200.00, 0.149),
            (60000.00, 0.184),
            (None, 0.225),
        ],
        "personal_minimum_eur": 5789.00,
    },
    "murcia": {
        "brackets": [
            (12450.00, 0.095),
            (20200.00, 0.112),
            (34000.00, 0.133),
            (60000.00, 0.179),
            (None, 0.225),
        ],
        "personal_minimum_eur": 5550.00,
    },
    "la_rioja": {
        "brackets": [
            (12450.00, 0.08),
            (20200.00, 0.106),
            (35200.00, 0.136),
            (40000.00, 0.178),
            (50000.00, 0.183),
            (60000.00, 0.19),
            (120000.00, 0.245),
            (None, 0.27),
        ],
        "personal_minimum_eur": 5550.00,
    },
    "comunidad_valenciana": {
        "brackets": [
            (12000.00, 0.09),
            (22000.00, 0.12),
            (32000.00, 0.15),
            (42000.00, 0.175),
            (52000.00, 0.20),
            (62000.00, 0.225),
            (72000.00, 0.25),
            (100000.00, 0.265),
            (150000.00, 0.275),
            (200000.00, 0.285),
            (None, 0.295),
        ],
        "personal_minimum_eur": 6105.00,
    },
    "ceuta_melilla": {
        "brackets": [
            (12450.00, 0.095),
            (20200.00, 0.12),
            (35200.00, 0.15),
            (60000.00, 0.185),
            (None, 0.225),
        ],
        "personal_minimum_eur": 5550.00,
    },
}


def compute_work_income_reduction_2026(rendimiento_neto_trabajo: float) -> float:
    """
    2026 "reduccion por obtencion de rendimientos del trabajo" (Art. 20
    LIRPF), for a taxpayer whose non-work income does not exceed
    EUR 6,500/year (assumed true for this module's single-income
    reference profile). National, does not vary by region.
    """
    x = max(0.0, rendimiento_neto_trabajo)

    if x <= 14852.00:
        return 7302.00

    if x <= 17673.52:
        return round_cent(7302.00 - 1.75 * (x - 14852.00))

    if x <= 19747.50:
        return round_cent(2364.34 - 1.14 * (x - 17673.52))

    return 0.0


def compute_irpf_2026(
    annual_gross_eur: float,
    annual_employee_ss_eur: float,
    region_code: str = "madrid",
) -> float:
    """
    2026 IRPF for a single, childless employee, combining the state scale
    and the selected region's autonomous scale, the flat work-income
    expense allowance, the Art. 20 work-income reduction, and the
    personal minimum (taxed-at-zero) mechanism -- applied separately for
    the state portion (EUR 5,550 minimo) and the regional portion (the
    selected region's own minimo, which can differ from the state figure).
    """
    regional_scale = REGIONAL_SCALES_2026[region_code]

    rendimiento_neto_trabajo = max(
        0.0,
        annual_gross_eur - annual_employee_ss_eur - WORK_INCOME_FLAT_EXPENSE_2026,
    )

    reduction = compute_work_income_reduction_2026(rendimiento_neto_trabajo)

    base_liquidable_general = max(0.0, rendimiento_neto_trabajo - reduction)

    state_minimo_applied = min(STATE_PERSONAL_MINIMUM_2026, base_liquidable_general)
    regional_minimo_applied = min(
        regional_scale["personal_minimum_eur"], base_liquidable_general
    )

    state_tax = (
        apply_progressive_scale(base_liquidable_general, STATE_BRACKETS_2026)
        - apply_progressive_scale(state_minimo_applied, STATE_BRACKETS_2026)
    )

    regional_tax = (
        apply_progressive_scale(base_liquidable_general, regional_scale["brackets"])
        - apply_progressive_scale(regional_minimo_applied, regional_scale["brackets"])
    )

    return round_cent(max(0.0, state_tax + regional_tax))


SEGURIDAD_SOCIAL_RATES_2026 = {
    "employee": {
        "contingencias_comunes": 0.047,
        "desempleo": 0.0155,
        "mei": 0.0015,
        "formacion_profesional": 0.0010,
    },
    "employer": {
        "contingencias_comunes": 0.236,
        "desempleo": 0.055,
        "mei": 0.0075,
        "formacion_profesional": 0.006,
        "fogasa": 0.002,
        "at_ep": 0.010,
    },
}

BASE_MINIMA_MONTHLY_2026 = 1424.40
BASE_MAXIMA_MONTHLY_2026 = 5101.20


def compute_contribution_base_2026(gross_monthly_eur: float) -> float:
    return min(
        BASE_MAXIMA_MONTHLY_2026,
        max(BASE_MINIMA_MONTHLY_2026, gross_monthly_eur),
    )


def compute_spain_irpf_seguridad_social_2026(
    gross_monthly_eur: float,
    region_code: str = "madrid",
) -> dict:
    """
    Compute the full monthly IRPF / Seguridad Social picture for the
    standard reference employee in the given region.

    Returns
    -------
    dict
        Detailed calculation fields (all monthly amounts in EUR unless
        noted otherwise).
    """
    gross_monthly_eur = round_cent(gross_monthly_eur)
    annual_gross_eur = round_cent(gross_monthly_eur * 12.0)

    contribution_base_monthly = compute_contribution_base_2026(gross_monthly_eur)

    employee_rates = SEGURIDAD_SOCIAL_RATES_2026["employee"]
    employer_rates = SEGURIDAD_SOCIAL_RATES_2026["employer"]

    employee_ss_monthly = round_cent(
        contribution_base_monthly * sum(employee_rates.values())
    )

    employer_ss_monthly = round_cent(
        contribution_base_monthly * sum(employer_rates.values())
    )

    annual_employee_ss = round_cent(employee_ss_monthly * 12.0)
    annual_employer_ss = round_cent(employer_ss_monthly * 12.0)

    annual_irpf = compute_irpf_2026(annual_gross_eur, annual_employee_ss, region_code)
    irpf_monthly = round_cent(annual_irpf / 12.0)

    return {
        "annual_gross_eur": annual_gross_eur,
        "contribution_base_monthly_eur": contribution_base_monthly,
        "annual_employee_ss_eur": annual_employee_ss,
        "annual_employer_ss_eur": annual_employer_ss,
        "annual_irpf_eur": annual_irpf,
        "employee_ss_monthly_eur": employee_ss_monthly,
        "employer_ss_monthly_eur": employer_ss_monthly,
        "irpf_monthly_eur": irpf_monthly,
    }
