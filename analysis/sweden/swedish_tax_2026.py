"""
Swedish employer contributions (arbetsgivaravgifter) and income tax
(kommunalskatt, statlig inkomstskatt, grundavdrag, jobbskatteavdrag)
engine for the 2026 tax year.

Scope
-----
Single, childless employee under 66 at the start of the income year
(Kolumn 1 of Skatteverket's preliminary tax tables), Stockholm kommun as
the reference municipality, no church-fee-equivalent (avgift till
registrerat trossamfund) membership, no other income or deductions.

Reference year constants (2026)
--------------------------------
- prisbasbelopp (PBB): 59,200 SEK
- inkomstbasbelopp (IBB): 83,400 SEK
- skiktgrans (state-tax threshold, on income after grundavdrag): 643,000 SEK
- Stockholm kommun+region combined rate (kommunalskatt): 30.55%
  (18.22% kommun + 12.33% region), of which 1.16 percentage points is
  Skatteverket's standardised begravningsavgift + trossamfund component,
  excluded from the base used to compute jobbskatteavdrag (see below).

Arbetsgivaravgifter (employer social contributions)
----------------------------------------------------
Flat 31.42% of gross pay, no ceiling: socialavgifter 18.80%
(alderspensionsavgift 10.21%, efterlevandepensionsavgift 0.30%,
sjukforsakringsavgift 3.55%, foraldraforsakringsavgift 2.00%,
arbetsmarknadsavgift 2.64%, arbetsskadeavgift 0.10%, Socialavgiftslag
2000:980 par 26 as amended by Lag 2025:1362) plus allman loneavgift
12.62% (Lag 1994:1920 par 3 as amended by Lag 2025:1360).

Allman pensionsavgift (employee pension contribution) -- modelled as
net zero
---------------------------------------------------------------------
Employees nominally pay a 7% allman pensionsavgift on pensionsgrundande
income up to 8.07 x IBB (673,038 SEK, avgift capped at 47,100 SEK), but
Skatteverket grants an equal skattereduktion (100% of the avgift,
capped at the sum of statlig + kommunal tax due before that credit) --
see Teknisk beskrivning SKV 433, section 7.5.1. Across this module's
entire wage grid (0.8x-6x the reference wage, i.e. annual income from
roughly 330,000 SEK upward), the combined statlig+kommunal tax before
credits always exceeds the capped avgift, so the credit is always fully
usable and the net effect on take-home pay is exactly zero. Consistent
with how this project models the Netherlands' analogous no-net-effect
mechanisms, the pension avgift and its offsetting credit are not
modelled as separate line items -- employee_contributions is 0 by
construction for this module's wage range.

Grundavdrag (basic allowance) and jobbskatteavdrag (in-work tax
credit), formulas and thresholds
-----------------------------------------------------------------
Transcribed and verified against Skatteverket's official "Teknisk
beskrivning" (SKV 433, edition 36, dated 2025-12-10), section 6.1 and
7.5.2, for a person who has not turned 66 by the start of the income
year (kolumn 1).
"""

PBB_2026 = 59200.0
IBB_2026 = 83400.0
SKIKTGRANS_2026 = 643000.0

ARBETSGIVARAVGIFTER_RATE_2026 = 0.3142

STOCKHOLM_KOMMUNALSKATT_RATE_2026 = 0.3055
BEGRAVNING_TROSSAMFUND_STANDARD_RATE = 0.0116


def round_oere(value: float) -> float:
    """
    Round to the nearest hundredth (SEK has ore as its minor unit).
    """
    return round(float(value) + 1e-9, 2)


def compute_arbetsgivaravgifter_2026(gross_monthly_sek: float) -> float:
    """
    Employer-only social contributions: flat 31.42% of gross pay, no
    ceiling (Socialavgiftslag 2000:980 par 26 + Lag 1994:1920 par 3, both
    as amended for 2026).
    """
    return round_oere(max(0.0, gross_monthly_sek) * ARBETSGIVARAVGIFTER_RATE_2026)


def compute_grundavdrag_2026(annual_income_sek: float) -> float:
    """
    Grundavdrag (basic allowance) for a person under 66 at the start of
    the income year, SKV 433 section 6.1. Rounded up to the nearest 100
    SEK, capped at the income itself.
    """
    ffi = max(0.0, annual_income_sek)

    lower_1 = 0.99 * PBB_2026
    upper_2 = 2.72 * PBB_2026
    upper_3 = 3.11 * PBB_2026
    upper_4 = 7.88 * PBB_2026

    if ffi <= lower_1:
        ga = 0.423 * PBB_2026
    elif ffi <= upper_2:
        ga = 0.423 * PBB_2026 + 0.20 * (ffi - lower_1)
    elif ffi <= upper_3:
        ga = 0.77 * PBB_2026
    elif ffi <= upper_4:
        ga = 0.77 * PBB_2026 - 0.10 * (ffi - upper_3)
    else:
        ga = 0.293 * PBB_2026

    import math
    ga = math.ceil((ga - 1e-9) / 100.0) * 100.0

    return min(ga, ffi)


def compute_jobbskatteavdrag_2026(
    annual_income_sek: float,
    grundavdrag_sek: float,
    kommunal_rate_excl_begravning: float
) -> float:
    """
    Skattereduktion for arbetsinkomst (jobbskatteavdrag) for a person
    under 66 at the start of the income year, SKV 433 section 7.5.2.
    Credited only against kommunal inkomstskatt.

    The arbetsinkomst (here, the same annual gross income used for
    grundavdrag) is floored to the nearest 100 SEK before being applied
    to the piecewise formula; the resulting reduction is floored to the
    nearest whole krona and floored at zero.
    """
    import math

    ai = math.floor(max(0.0, annual_income_sek) / 100.0) * 100.0
    ga = grundavdrag_sek
    ki = kommunal_rate_excl_begravning

    threshold_1 = 0.91 * PBB_2026
    threshold_2 = 3.24 * PBB_2026
    threshold_3 = 8.08 * PBB_2026

    if ai <= threshold_1:
        sr = (ai - ga) * ki
    elif ai <= threshold_2:
        sr = ((0.91 * PBB_2026 + 0.3874 * (ai - threshold_1)) - ga) * ki
    elif ai <= threshold_3:
        sr = ((1.813 * PBB_2026 + 0.251 * (ai - threshold_2)) - ga) * ki
    else:
        sr = (3.027 * PBB_2026 - ga) * ki

    return math.floor(max(0.0, sr) + 1e-9)


def compute_statlig_inkomstskatt_2026(taxable_income_sek: float) -> float:
    """
    Statlig inkomstskatt: 20% of beskattningsbar forvarvsinkomst (income
    after grundavdrag) above the skiktgrans of 643,000 SEK, applied only
    once the excess reaches 200 SEK (SKV 433 section 7.2).
    """
    excess = max(0.0, taxable_income_sek - SKIKTGRANS_2026)

    if excess < 200.0:
        return 0.0

    return round_oere(0.20 * excess)


def compute_kommunalskatt_2026(
    taxable_income_sek: float,
    kommunal_rate: float = STOCKHOLM_KOMMUNALSKATT_RATE_2026
) -> float:
    """
    Kommunal inkomstskatt, begravningsavgift and avgift till registrerat
    trossamfund combined (SKV 433 section 7.3), applied to the same
    taxable base as statlig inkomstskatt (income after grundavdrag).
    Uses Stockholm kommun's 2026 combined rate (18.22% kommun + 12.33%
    region = 30.55%) as the module's reference municipality.
    """
    return round_oere(max(0.0, taxable_income_sek) * kommunal_rate)


def compute_swedish_tax_2026(
    gross_monthly_sek: float,
    kommunal_rate: float = STOCKHOLM_KOMMUNALSKATT_RATE_2026
) -> dict:
    """
    Compute the full monthly arbetsgivaravgifter / income-tax picture
    for the standard reference employee.

    Returns
    -------
    dict
        Detailed calculation fields (all monthly amounts in SEK unless
        noted otherwise).
    """
    gross_monthly_sek = round_oere(gross_monthly_sek)
    annual_gross_sek = round_oere(gross_monthly_sek * 12.0)

    employer_avgifter_monthly = compute_arbetsgivaravgifter_2026(gross_monthly_sek)

    grundavdrag_annual = compute_grundavdrag_2026(annual_gross_sek)
    taxable_income_annual = max(0.0, annual_gross_sek - grundavdrag_annual)

    ki_credit = kommunal_rate - BEGRAVNING_TROSSAMFUND_STANDARD_RATE

    jobbskatteavdrag_annual = compute_jobbskatteavdrag_2026(
        annual_gross_sek,
        grundavdrag_annual,
        ki_credit
    )

    kommunalskatt_annual = compute_kommunalskatt_2026(taxable_income_annual, kommunal_rate)
    statlig_skatt_annual = compute_statlig_inkomstskatt_2026(taxable_income_annual)

    total_tax_annual = max(
        0.0,
        kommunalskatt_annual + statlig_skatt_annual - jobbskatteavdrag_annual
    )

    return {
        "annual_gross_sek": annual_gross_sek,
        "employer_avgifter_monthly_sek": employer_avgifter_monthly,
        "grundavdrag_annual_sek": grundavdrag_annual,
        "taxable_income_annual_sek": taxable_income_annual,
        "kommunalskatt_annual_sek": kommunalskatt_annual,
        "statlig_skatt_annual_sek": statlig_skatt_annual,
        "jobbskatteavdrag_annual_sek": jobbskatteavdrag_annual,
        "total_income_tax_annual_sek": round_oere(total_tax_annual),
        "total_income_tax_monthly_sek": round_oere(total_tax_annual / 12.0),
        "employer_avgifter_annual_sek": round_oere(employer_avgifter_monthly * 12.0),
    }
