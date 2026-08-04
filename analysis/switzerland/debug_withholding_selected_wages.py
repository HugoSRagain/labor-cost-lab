"""
Swiss Labour Cost Lab
Debug helper: test candidate parsing hypotheses for the ESTV fiscal payload.

For a few sample wages, this script compares two candidate interpretations
of the 16-character fiscal payload field (positions 43:59): a "base amount
+ marginal rate" decomposition vs. a flat rate on the full wage.

Conclusion (validated against real ZH/AR/VD/GE data): the leading 10 digits
of the payload stay constant across brackets and do not behave as a
monetary base amount, while the trailing 4 digits vary smoothly and match
a plausible withholding-tax rate. This confirms the flat-rate interpretation
implemented in swiss_withholding_tax_2026.py. Kept for documentation of the
reverse-engineering process.
"""

from pathlib import Path
from zipfile import ZipFile


ROOT_DIR = Path(__file__).resolve().parents[2]
ZIP_PATH = (
    ROOT_DIR
    / "analysis"
    / "switzerland"
    / "sources"
    / "withholding_tax_2026"
    / "switzerland_2026_txt.zip"
)


def decode(raw):
    return raw.decode("latin-1", errors="replace")


def parse_candidate(line):
    canton = line[4:6]
    tariff = line[6:8]
    church = line[8:9]
    effective_date = line[16:24]

    # Correction importante :
    # la borne de salaire est en CHF, pas en centimes.
    lower_bound_chf = int(line[24:31])

    # La largeur de tranche est en centimes.
    interval_width_chf = int(line[31:42]) / 100.0

    raw_final = line[43:59]

    # Hypothèse à tester :
    # 10 chiffres = montant de base
    # 6 chiffres = taux marginal
    base_amount_raw = raw_final[0:10]
    marginal_rate_raw = raw_final[10:16]

    base_amount_candidate_1 = int(base_amount_raw) / 10.0
    base_amount_candidate_2 = int(base_amount_raw) / 100.0
    marginal_rate_percent = int(marginal_rate_raw) / 1000.0

    return {
        "line": line,
        "canton": canton,
        "tariff": tariff,
        "church": church,
        "effective_date": effective_date,
        "lower_bound_chf": lower_bound_chf,
        "upper_bound_chf": lower_bound_chf + interval_width_chf,
        "interval_width_chf": interval_width_chf,
        "raw_final": raw_final,
        "base_amount_raw": base_amount_raw,
        "marginal_rate_raw": marginal_rate_raw,
        "base_amount_candidate_1": base_amount_candidate_1,
        "base_amount_candidate_2": base_amount_candidate_2,
        "marginal_rate_percent": marginal_rate_percent,
    }


def find_line_for_wage(canton_file, prefix, wage):
    with ZipFile(ZIP_PATH, "r") as archive:
        text = decode(archive.read(canton_file))

    candidates = []

    for line in text.splitlines():
        if not line.startswith(prefix):
            continue

        item = parse_candidate(line)

        if (
            wage >= item["lower_bound_chf"]
            and wage < item["upper_bound_chf"]
        ):
            candidates.append(item)

    if candidates:
        return candidates[0]

    return None


def show(canton_file, prefix, wages):
    print()
    print("=" * 90)
    print(canton_file, prefix)
    print("=" * 90)

    for wage in wages:
        item = find_line_for_wage(canton_file, prefix, wage)

        print()
        print("Wage:", wage)

        if item is None:
            print("No matching line")
            continue

        for key, value in item.items():
            if key == "line":
                print("line:", repr(value))
            else:
                print(key + ":", value)

        base_1 = item["base_amount_candidate_1"]
        base_2 = item["base_amount_candidate_2"]
        rate = item["marginal_rate_percent"]
        lower = item["lower_bound_chf"]

        tax_candidate_1 = base_1 + ((wage - lower) * rate / 100.0)
        tax_candidate_2 = base_2 + ((wage - lower) * rate / 100.0)

        print("tax_candidate_1:", round(tax_candidate_1, 2))
        print("effective_rate_candidate_1:", round(tax_candidate_1 / wage * 100, 3))

        print("tax_candidate_2:", round(tax_candidate_2, 2))
        print("effective_rate_candidate_2:", round(tax_candidate_2 / wage * 100, 3))


if __name__ == "__main__":
    wages = [3000, 5000, 8000, 12000, 20000]

    show("tar26vd.txt", "0601VDA0N", wages)
    show("tar26ge.txt", "0601GEA0N", wages)
    show("tar26zh.txt", "0601ZHA0N", wages)