"""
Italian INPS social contributions, TFR accrual and income tax (IRPEF +
addizionale regionale/comunale) engine for the 2026 tax year.

Scope
-----
Single, standard private-sector employee (operaio/impiegato), open-ended
contract, full year, at a firm with more than 50 employees (private
industria/commercio sector) subject to CIGS, fully within the
"sistema contributivo" (pension career started after 31 December 1995,
the default for essentially the whole current working-age population),
resident in Roma Capitale (Lazio), no dependents, no other income, no
church-tax equivalent (Italy has none).

Reference wage and the 13/14 "mensilita" convention
-----------------------------------------------------
Italy has no statutory minimum wage: pay floors come entirely from
sector-level collective agreements (CCNL), covering over 80% of private
employees, plus (from 1 May 2026, Decreto-Legge 62/2026, "salario
giusto") a cross-reference to the "most representative" CCNL per
sector for workers not otherwise covered -- a pointer mechanism, not a
single number. This module uses the CCNL Commercio, Terziario e
Distribuzione e Servizi (Confcommercio), Livello 3 minimo tabellare
(EUR 1,983.91/month, Testo Unico signed 3 February 2026, values
effective 1 November 2025) as its "1.0x" reference wage by convention
-- the single most-cited, broadest-coverage Italian CCNL, but
explicitly not a legal minimum wage. See sweden_parameters_2026.json for
the analogous no-statutory-minimum-wage precedent already used in this
project.

The CCNL Commercio pays 14 "mensilita" per year (12 ordinary months plus
tredicesima and quattordicesima). Consistent with how this project
already handles Spain's 14-payment SMI, the reference wage is prorated
over 12 months: 1,983.91 x 14 / 12 = EUR 2,314.5617/month. All wage
grid points in this module are therefore continuous monthly averages
(retribuzione annua lorda / 12), not the literal amount paid in an
ordinary month.

INPS contributions (2026, INPS Circolare n. 6 del 30 gennaio 2026)
--------------------------------------------------------------------
IVS (FPLD, invalidita/vecchiaia/superstiti): 33.00% total, 23.81%
employer / 9.19% employee. An additional 1% employee-only contribution
(Art. 3-ter, L. 438/1992) applies on the portion of annual pensionable
pay above the "prima fascia di retribuzione pensionabile" (EUR 56,224
in 2026). Both the base IVS split and the 1% additional contribution
are capped at the annual "massimale contributivo" (Art. 2, comma 18,
L. 335/1995), EUR 122,295 in 2026 -- applicable to workers fully in the
sistema contributivo, the default assumption here.

NASpI (unemployment, employer-only): 1.61%. CIGO (ordinary
wage-guarantee fund, employer-only, >50 employees): 2.00%. CIGS
(extraordinary wage-guarantee fund, >15 employees): 0.90% total, 0.60%
employer / 0.30% employee. Contributo maternita (employer-only): 0.46%.
Fondo di Garanzia TFR (employer-only): 0.20%. CUAF/ex-CUAF (assegni
familiari, employer-only, confirmed still due after the Assegno Unico
reform): 0.68%. INAIL (workplace injury insurance) has no single
published average rate (it ranges roughly 0.3%-11.0% by risk class);
this module uses an illustrative 0.50% rate consistent with a low-risk
commercio/ufficio profile, documented as illustrative rather than
sourced to a specific INAIL tariff position.

TFR (Trattamento di Fine Rapporto)
------------------------------------
Mandatory deferred severance accrual (Art. 2120 Codice Civile, L.
297/1982): retribuzione annua utile / 13.5, less 0.50% of the same
base, i.e. annual_gross x (1/13.5 - 0.005) = annual_gross x 6.9074%.
Consistent with standard Italian "costo azienda" accounting practice
(booked as a personnel cost, voce B9 of the conto economico), TFR is
included in employer_cost as a distinct, clearly-labelled deferred-
compensation line -- it increases the cost of employment but is NOT
part of the employee's current net take-home pay (it is paid out at
termination, or as a partial advance under specific conditions).

IRPEF (national income tax, 2026, Legge di Bilancio 2026 / L. 199/2025)
-------------------------------------------------------------------------
Brackets: 23% up to EUR 28,000, 33% from EUR 28,000 to EUR 50,000, 43%
above. Detrazione da lavoro dipendente (Art. 13 TUIR): a 3-segment
piecewise employment tax credit phasing out between EUR 15,000 and EUR
50,000 of reddito complessivo, plus a further EUR 65 for income
strictly between EUR 25,000 and EUR 35,000. "Ulteriore detrazione" (L.
207/2024, stabilised for 2026): EUR 1,000 flat for income in
(20,000, 32,000], phasing out linearly to zero at EUR 40,000.
Trattamento integrativo (ex-bonus Renzi, D.L. 3/2020): EUR 1,200/year
unconditional for income <= EUR 15,000; for income in (15,000, 28,000],
a "verifica" top-up equal to max(0, detrazione_lavoro_dipendente -
irpef_lorda), capped at EUR 1,200 -- this can make the final national
income-tax figure negative (a net payment to the employee), which this
module reproduces rather than floors at zero.

The taxable base (reddito imponibile) is annual gross pay less the
employee's own INPS contributions (mandatory social contributions are
excluded from reddito di lavoro dipendente under Art. 51 TUIR, not
merely "deducted" after the fact) -- the same base is used for the
detrazione/ulteriore-detrazione/trattamento-integrativo threshold
checks (reddito complessivo), since this module has no other income
source.

Addizionale regionale (Lazio) and addizionale comunale (Roma), 2026
-----------------------------------------------------------------------
Unlike national IRPEF, both surcharges are TIERED-FLAT, not marginal:
the applicable rate is applied to the ENTIRE taxable income once a
threshold is crossed, not just the portion above it. Lazio, 2026
(Legge Regionale n. 20/2025, overriding the ordinary D.Lgs 68/2011
schedule for this year only): 1.73% for taxable income <= EUR 28,000,
3.33% above -- with a EUR 60 smoothing credit for income in
(28,000, 30,000] to soften the notch. Roma Capitale, 2026: a single
0.90% rate, with a full exemption (not a deductible slice) for taxable
income <= EUR 14,000 (Deliberazione Assemblea Capitolina n. 186/2024).
"""

import math


PBB_UNUSED = None  # (no equivalent constant in the Italian system)

MASSIMALE_CONTRIBUTIVO_ANNUAL_2026 = 122295.0
PRIMA_FASCIA_PENSIONABILE_ANNUAL_2026 = 56224.0

INPS_RATES_2026 = {
    "ivs_employer": 0.2381,
    "ivs_employee": 0.0919,
    "aggiuntivo_1_percent_employee": 0.01,
    "naspi_employer": 0.0161,
    "cigo_employer": 0.0200,
    "cigs_employer": 0.0060,
    "cigs_employee": 0.0030,
    "maternita_employer": 0.0046,
    "fondo_garanzia_tfr_employer": 0.0020,
    "cuaf_employer": 0.0068,
    "inail_employer_illustrative": 0.0050,
}

TFR_DIVISOR = 13.5
TFR_BASE_REDUCTION_RATE = 0.005

IRPEF_BRACKETS_2026 = [
    (0.0, 28000.0, 0.23),
    (28000.0, 50000.0, 0.33),
    (50000.0, math.inf, 0.43),
]

ADDIZIONALE_REGIONALE_LAZIO_2026 = {
    "threshold_eur": 28000.0,
    "rate_below": 0.0173,
    "rate_above": 0.0333,
    "smoothing_credit_eur": 60.0,
    "smoothing_upper_bound_eur": 30000.0,
}

ADDIZIONALE_COMUNALE_ROMA_2026 = {
    "exemption_threshold_eur": 14000.0,
    "rate": 0.0090,
}


def compute_irpef_lorda_2026(taxable_annual_eur: float) -> float:
    """
    National IRPEF gross tax: standard marginal brackets.
    """
    income = max(0.0, taxable_annual_eur)
    tax = 0.0

    for lower, upper, rate in IRPEF_BRACKETS_2026:
        if income <= lower:
            break
        tax += (min(income, upper) - lower) * rate

    return tax


def compute_detrazione_lavoro_dipendente_2026(reddito_complessivo_annual_eur: float) -> float:
    """
    Art. 13 TUIR employment tax credit, standard (non-pensioner) full-year
    employee, plus the EUR 65 comma 1.1 supplement for income strictly
    between EUR 25,000 and EUR 35,000.
    """
    income = max(0.0, reddito_complessivo_annual_eur)

    if income <= 15000.0:
        detrazione = 1955.0
    elif income <= 28000.0:
        detrazione = 1910.0 + 1190.0 * ((28000.0 - income) / 13000.0)
    elif income <= 50000.0:
        detrazione = 1910.0 * ((50000.0 - income) / 22000.0)
    else:
        detrazione = 0.0

    if 25000.0 < income < 35000.0:
        detrazione += 65.0

    return max(0.0, detrazione)


def compute_ulteriore_detrazione_2026(reddito_complessivo_annual_eur: float) -> float:
    """
    "Ulteriore detrazione" introduced by L. 207/2024 (Legge di Bilancio
    2025), stabilised for 2026: EUR 1,000 flat for income in
    (20,000, 32,000], phasing out linearly to zero at EUR 40,000.
    """
    income = max(0.0, reddito_complessivo_annual_eur)

    if income <= 20000.0:
        return 0.0
    if income <= 32000.0:
        return 1000.0
    if income <= 40000.0:
        return 1000.0 * ((40000.0 - income) / 8000.0)

    return 0.0


def compute_trattamento_integrativo_2026(
    reddito_complessivo_annual_eur: float,
    irpef_lorda: float,
    detrazione_lavoro_dipendente: float
) -> float:
    """
    Trattamento integrativo (ex-bonus Renzi): EUR 1,200/year unconditional
    for income <= EUR 15,000; for income in (15,000, 28,000], a "verifica"
    top-up equal to max(0, detrazione_lavoro_dipendente - irpef_lorda),
    capped at EUR 1,200. Zero above EUR 28,000.
    """
    income = max(0.0, reddito_complessivo_annual_eur)

    if income <= 15000.0:
        return 1200.0
    if income <= 28000.0:
        return min(1200.0, max(0.0, detrazione_lavoro_dipendente - irpef_lorda))

    return 0.0


def compute_addizionale_regionale_lazio_2026(taxable_annual_eur: float) -> float:
    """
    Lazio addizionale regionale, 2026 (Legge Regionale n. 20/2025):
    tiered-flat (not marginal) rate applied to the whole taxable income,
    with a EUR 60 smoothing credit just above the EUR 28,000 notch.
    """
    params = ADDIZIONALE_REGIONALE_LAZIO_2026
    income = max(0.0, taxable_annual_eur)

    if income <= params["threshold_eur"]:
        tax = income * params["rate_below"]
    else:
        tax = income * params["rate_above"]

        if income <= params["smoothing_upper_bound_eur"]:
            tax = max(0.0, tax - params["smoothing_credit_eur"])

    return tax


def compute_addizionale_comunale_roma_2026(taxable_annual_eur: float) -> float:
    """
    Roma Capitale addizionale comunale, 2026: a single 0.90% rate applied
    to the whole taxable income once it exceeds the EUR 14,000 exemption
    threshold (a cliff, not a deductible slice).
    """
    params = ADDIZIONALE_COMUNALE_ROMA_2026
    income = max(0.0, taxable_annual_eur)

    if income <= params["exemption_threshold_eur"]:
        return 0.0

    return income * params["rate"]


def compute_tfr_accrual_2026(annual_gross_eur: float) -> float:
    """
    TFR annual accrual: retribuzione annua / 13.5, less 0.50% of the same
    base (Art. 2120 Codice Civile).
    """
    gross = max(0.0, annual_gross_eur)

    return gross / TFR_DIVISOR - gross * TFR_BASE_REDUCTION_RATE


def compute_inps_contributions_2026(annual_gross_eur: float) -> dict:
    """
    Full INPS employer/employee contribution picture for one year.
    """
    gross = max(0.0, annual_gross_eur)
    capped_base = min(gross, MASSIMALE_CONTRIBUTIVO_ANNUAL_2026)

    ivs_employer = capped_base * INPS_RATES_2026["ivs_employer"]
    ivs_employee = capped_base * INPS_RATES_2026["ivs_employee"]

    eccedente_prima_fascia = max(0.0, capped_base - PRIMA_FASCIA_PENSIONABILE_ANNUAL_2026)
    aggiuntivo_1_percent = eccedente_prima_fascia * INPS_RATES_2026["aggiuntivo_1_percent_employee"]

    naspi = gross * INPS_RATES_2026["naspi_employer"]
    cigo = gross * INPS_RATES_2026["cigo_employer"]
    cigs_employer = gross * INPS_RATES_2026["cigs_employer"]
    cigs_employee = gross * INPS_RATES_2026["cigs_employee"]
    maternita = gross * INPS_RATES_2026["maternita_employer"]
    fondo_garanzia_tfr = gross * INPS_RATES_2026["fondo_garanzia_tfr_employer"]
    cuaf = gross * INPS_RATES_2026["cuaf_employer"]
    inail = gross * INPS_RATES_2026["inail_employer_illustrative"]

    employer_total = (
        ivs_employer + naspi + cigo + cigs_employer
        + maternita + fondo_garanzia_tfr + cuaf + inail
    )
    employee_total = ivs_employee + cigs_employee + aggiuntivo_1_percent

    return {
        "ivs_employer_annual_eur": ivs_employer,
        "ivs_employee_annual_eur": ivs_employee,
        "aggiuntivo_1_percent_annual_eur": aggiuntivo_1_percent,
        "naspi_annual_eur": naspi,
        "cigo_annual_eur": cigo,
        "cigs_employer_annual_eur": cigs_employer,
        "cigs_employee_annual_eur": cigs_employee,
        "maternita_annual_eur": maternita,
        "fondo_garanzia_tfr_annual_eur": fondo_garanzia_tfr,
        "cuaf_annual_eur": cuaf,
        "inail_annual_eur": inail,
        "employer_contributions_annual_eur": employer_total,
        "employee_contributions_annual_eur": employee_total,
    }


def compute_italian_payroll_2026(gross_monthly_eur: float) -> dict:
    """
    Compute the full monthly INPS / TFR / income-tax picture for the
    standard reference employee.
    """
    annual_gross_eur = gross_monthly_eur * 12.0

    inps = compute_inps_contributions_2026(annual_gross_eur)

    taxable_income_annual = max(
        0.0,
        annual_gross_eur - inps["employee_contributions_annual_eur"]
    )

    irpef_lorda = compute_irpef_lorda_2026(taxable_income_annual)
    detrazione_lavoro = compute_detrazione_lavoro_dipendente_2026(taxable_income_annual)

    imposta_netta_ante_ulteriore = max(0.0, irpef_lorda - detrazione_lavoro)
    ulteriore_detrazione = compute_ulteriore_detrazione_2026(taxable_income_annual)
    imposta_netta = max(0.0, imposta_netta_ante_ulteriore - ulteriore_detrazione)

    trattamento_integrativo = compute_trattamento_integrativo_2026(
        taxable_income_annual,
        irpef_lorda,
        detrazione_lavoro
    )

    irpef_netta_finale = imposta_netta - trattamento_integrativo

    addizionale_regionale = compute_addizionale_regionale_lazio_2026(taxable_income_annual)
    addizionale_comunale = compute_addizionale_comunale_roma_2026(taxable_income_annual)

    total_income_tax_annual = irpef_netta_finale + addizionale_regionale + addizionale_comunale

    tfr_annual = compute_tfr_accrual_2026(annual_gross_eur)

    employer_contributions_annual = inps["employer_contributions_annual_eur"]
    employee_contributions_annual = inps["employee_contributions_annual_eur"]

    return {
        "annual_gross_eur": annual_gross_eur,
        "taxable_income_annual_eur": taxable_income_annual,
        "irpef_lorda_annual_eur": irpef_lorda,
        "detrazione_lavoro_dipendente_annual_eur": detrazione_lavoro,
        "ulteriore_detrazione_annual_eur": ulteriore_detrazione,
        "trattamento_integrativo_annual_eur": trattamento_integrativo,
        "addizionale_regionale_annual_eur": addizionale_regionale,
        "addizionale_comunale_annual_eur": addizionale_comunale,
        "total_income_tax_annual_eur": total_income_tax_annual,
        "total_income_tax_monthly_eur": total_income_tax_annual / 12.0,
        "employee_contributions_annual_eur": employee_contributions_annual,
        "employee_contributions_monthly_eur": employee_contributions_annual / 12.0,
        "employer_contributions_annual_eur": employer_contributions_annual,
        "employer_contributions_monthly_eur": employer_contributions_annual / 12.0,
        "tfr_annual_eur": tfr_annual,
        "tfr_monthly_eur": tfr_annual / 12.0,
        "inps_breakdown": inps,
    }
