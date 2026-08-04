"""
Swiss Labour Cost Lab
Debug helper: inspect the raw fixed-width layout of ESTV withholding-tax lines.

This script prints one selected tariff line per canton, sliced into
candidate byte-offset fields, in order to locate field boundaries
(canton code, tariff code, effective date, bracket bounds, fiscal payload).

Kept for documentation of the byte-offset reverse-engineering process
that led to the field layout implemented in swiss_withholding_tax_2026.py.
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


def show_line_parts(canton_file, target_prefix="0601VDA0N"):
    with ZipFile(ZIP_PATH, "r") as archive:
        raw = archive.read(canton_file)
        text = raw.decode("latin-1", errors="replace")

    lines = [
        line for line in text.splitlines()
        if line.startswith(target_prefix)
    ]

    print()
    print("=" * 90)
    print(canton_file, target_prefix)
    print("Lines:", len(lines))
    print("=" * 90)

    for line in lines[:20]:
        print()
        print(repr(line))
        print("len:", len(line))
        print("00-04", repr(line[0:4]))
        print("04-06", repr(line[4:6]))
        print("06-08", repr(line[6:8]))
        print("08-09", repr(line[8:9]))
        print("09-16", repr(line[9:16]))
        print("16-24", repr(line[16:24]))
        print("24-31", repr(line[24:31]))
        print("31-42", repr(line[31:42]))
        print("42-43", repr(line[42:43]))
        print("43-51", repr(line[43:51]))
        print("51-59", repr(line[51:59]))
        print("59-end", repr(line[59:]))


if __name__ == "__main__":
    show_line_parts("tar26vd.txt", "0601VDA0N")
    show_line_parts("tar26ge.txt", "0601GEA0N")
    show_line_parts("tar26zh.txt", "0601ZHA0N")