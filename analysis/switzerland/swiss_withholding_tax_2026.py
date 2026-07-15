"""
Swiss Labour Cost Lab
Withholding-tax parser for 2026.

This module reads the official Swiss canton-level withholding-tax TXT files
distributed by the Swiss Federal Tax Administration.

Scope for version 1:
- monthly wage income
- tariff A0
- no church tax when available
- gross monthly wage
- canton-level withholding tax

The official files are fixed-width text files distributed in a ZIP archive.

Important format notes:
- the salary lower bound is encoded in CHF;
- the interval width is encoded in cents;
- the tax rate is encoded in hundredths of percent.

Example:
    0601VDA0N       20260101000495100000005000 0000000000000817

means:
    canton VD
    tariff A0
    no church tax
    effective date 2026-01-01
    salary bracket starting at 4,951 CHF
    bracket width 50 CHF
    tax rate 8.17%
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List
from zipfile import ZipFile


ROOT_DIR = Path(__file__).resolve().parents[2]

SOURCE_DIR = (
    ROOT_DIR
    / "analysis"
    / "switzerland"
    / "sources"
    / "withholding_tax_2026"
)

DEFAULT_ZIP_PATH = SOURCE_DIR / "switzerland_2026_txt.zip"


@dataclass(frozen=True)
class SwissWithholdingTaxBracket:
    """One withholding-tax bracket from the official TXT files."""

    canton_code: str
    tariff_code: str
    church_tax_code: str
    effective_date: str
    lower_bound_chf: float
    interval_width_chf: float
    tax_rate_percent: float


def round_chf(value: float) -> float:
    """Round a monetary value to cents."""
    return round(float(value), 2)


def decode_bytes(raw: bytes) -> str:
    """Decode tariff files with common encodings."""
    for encoding in ["utf-8-sig", "latin-1", "cp1252"]:
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue

    return raw.decode("latin-1", errors="replace")


def parse_tariff_line(line: str) -> SwissWithholdingTaxBracket | None:
    """
    Parse one fixed-width withholding-tax line.

    Example line:
        0601VDA0N       20260101000495100000005000 0000000000000817

    Fields used here:
        4:6   canton code
        6:8   tariff code
        8:9   church tax flag
        16:24 effective date
        24:31 lower bound, in CHF
        31:42 interval width, in cents
        43:59 tax rate, in hundredths of percent

    The tax rate is encoded so that:
        0000000000000817 = 8.17%
    """

    if not line.startswith("0601"):
        return None

    if len(line) < 59:
        return None

    canton_code = line[4:6].upper()
    tariff_code = line[6:8].upper()
    church_tax_code = line[8:9].upper()
    effective_date = line[16:24]

    lower_bound_raw = line[24:31]
    interval_width_raw = line[31:42]
    tax_rate_raw = line[43:59]

    if not (
        lower_bound_raw.strip().isdigit()
        and interval_width_raw.strip().isdigit()
        and tax_rate_raw.strip().isdigit()
    ):
        return None

    lower_bound_chf = int(lower_bound_raw)
    interval_width_chf = int(interval_width_raw) / 100.0
    tax_rate_percent = int(tax_rate_raw) / 100.0

    return SwissWithholdingTaxBracket(
        canton_code=canton_code,
        tariff_code=tariff_code,
        church_tax_code=church_tax_code,
        effective_date=effective_date,
        lower_bound_chf=round_chf(lower_bound_chf),
        interval_width_chf=round_chf(interval_width_chf),
        tax_rate_percent=round(tax_rate_percent, 4),
    )


def iter_tariff_lines_from_zip(zip_path: Path) -> Iterable[str]:
    """Yield text lines from all canton tariff files in the ZIP archive."""
    with ZipFile(zip_path, "r") as archive:
        for name in sorted(archive.namelist()):
            if not name.lower().endswith(".txt"):
                continue

            with archive.open(name) as file:
                raw = file.read()

            text = decode_bytes(raw)

            for line in text.splitlines():
                yield line


def load_withholding_tax_brackets(
    zip_path: Path = DEFAULT_ZIP_PATH,
    tariff_code: str = "A0",
    preferred_church_tax_code: str = "N",
) -> Dict[str, List[SwissWithholdingTaxBracket]]:
    """
    Load canton-level withholding-tax brackets.

    The preferred profile is A0N:
    - A0: single, no child
    - N: no church tax when available

    Some cantons may only expose A0Y in the official file. In that case,
    the function falls back to the available A0 bracket so that all 26
    cantons remain covered.

    Returns
    -------
    dict
        Mapping canton code -> sorted list of brackets.
    """

    if not zip_path.exists():
        raise FileNotFoundError(
            "Missing withholding-tax ZIP file: "
            + str(zip_path)
        )

    all_brackets_by_canton: Dict[str, List[SwissWithholdingTaxBracket]] = {}

    for line in iter_tariff_lines_from_zip(zip_path):
        bracket = parse_tariff_line(line)

        if bracket is None:
            continue

        if bracket.tariff_code != tariff_code:
            continue

        all_brackets_by_canton.setdefault(
            bracket.canton_code,
            [],
        ).append(bracket)

    selected_brackets_by_canton: Dict[str, List[SwissWithholdingTaxBracket]] = {}

    for canton_code, brackets in all_brackets_by_canton.items():
        preferred = [
            bracket for bracket in brackets
            if bracket.church_tax_code == preferred_church_tax_code
        ]

        if preferred:
            selected = preferred
        else:
            selected = brackets

        selected.sort(key=lambda item: item.lower_bound_chf)
        selected_brackets_by_canton[canton_code] = selected

    return selected_brackets_by_canton


def find_tax_rate_percent(
    gross_monthly_chf: float,
    brackets: List[SwissWithholdingTaxBracket],
) -> float:
    """Find the applicable withholding-tax rate for a gross monthly wage."""
    gross = float(gross_monthly_chf)

    if gross <= 0 or not brackets:
        return 0.0

    selected_rate = brackets[0].tax_rate_percent

    for bracket in brackets:
        upper_bound = (
            bracket.lower_bound_chf
            + bracket.interval_width_chf
        )

        if (
            gross >= bracket.lower_bound_chf
            and gross < upper_bound
        ):
            return bracket.tax_rate_percent

        if gross >= bracket.lower_bound_chf:
            selected_rate = bracket.tax_rate_percent

    return selected_rate


def compute_withholding_tax_monthly(
    gross_monthly_chf: float,
    canton_code: str,
    brackets_by_canton: Dict[str, List[SwissWithholdingTaxBracket]],
) -> float:
    """Compute monthly withholding tax for a canton and gross monthly wage."""
    canton = canton_code.upper()
    brackets = brackets_by_canton.get(canton, [])

    rate_percent = find_tax_rate_percent(
        gross_monthly_chf,
        brackets,
    )

    withholding_tax = (
        float(gross_monthly_chf)
        * rate_percent
        / 100.0
    )

    return round_chf(withholding_tax)


def get_withholding_tax_rate_percent(
    gross_monthly_chf: float,
    canton_code: str,
    brackets_by_canton: Dict[str, List[SwissWithholdingTaxBracket]],
) -> float:
    """Return the applied withholding-tax rate in percent."""
    canton = canton_code.upper()
    brackets = brackets_by_canton.get(canton, [])

    return find_tax_rate_percent(
        gross_monthly_chf,
        brackets,
    )


def run_self_test() -> None:
    """Print sample rates and amounts for selected cantons."""
    brackets_by_canton = load_withholding_tax_brackets()

    print()
    print("Swiss withholding-tax brackets loaded")
    print("Cantons:", len(brackets_by_canton))
    print("Canton codes:", ", ".join(sorted(brackets_by_canton.keys())))

    for canton_code in ["ZH", "GE", "VD"]:
        brackets = brackets_by_canton.get(canton_code, [])

        print()
        print(canton_code)
        print("Brackets:", len(brackets))

        for wage in [3000, 5000, 8000, 12000, 20000]:
            rate = get_withholding_tax_rate_percent(
                wage,
                canton_code,
                brackets_by_canton,
            )
            tax = compute_withholding_tax_monthly(
                wage,
                canton_code,
                brackets_by_canton,
            )

            print(
                f"{wage:>7,.0f} CHF"
                + " | rate "
                + f"{rate:>5.2f}%"
                + " | tax "
                + f"{tax:>8,.2f} CHF"
            )


if __name__ == "__main__":
    run_self_test()