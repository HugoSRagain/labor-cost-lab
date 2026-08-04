"""
Inspect Swiss withholding-tax tariff ZIP files.

This script lists the files contained in the official ZIP archive
and prints the first lines of each text-like file.
"""

from __future__ import annotations

from pathlib import Path
from zipfile import ZipFile


ROOT_DIR = Path(__file__).resolve().parents[2]

SOURCE_DIR = (
    ROOT_DIR
    / "analysis"
    / "switzerland"
    / "sources"
    / "withholding_tax_2026"
)


def decode_bytes(raw: bytes) -> str:
    """Decode Swiss tariff files with common encodings."""
    for encoding in ["utf-8-sig", "latin-1", "cp1252"]:
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue

    return raw.decode("latin-1", errors="replace")


def inspect_zip(path: Path) -> None:
    """Inspect one ZIP archive."""
    print()
    print("=" * 90)
    print(path.name)
    print("=" * 90)

    with ZipFile(path, "r") as archive:
        names = archive.namelist()

        print("Files in archive:")
        for name in names[:80]:
            print(" -", name)

        if len(names) > 80:
            print(f" ... {len(names) - 80} more files")

        print()
        print("Text-like file samples:")

        for name in names:
            lower_name = name.lower()

            if not lower_name.endswith((".txt", ".dat", ".asc", ".csv")):
                continue

            print()
            print("---", name, "---")

            with archive.open(name) as file:
                raw = file.read(5000)

            text = decode_bytes(raw)
            lines = text.splitlines()

            for line in lines[:25]:
                print(repr(line))


def main() -> None:
    zip_files = sorted(SOURCE_DIR.glob("*.zip"))

    if not zip_files:
        raise FileNotFoundError(
            "No ZIP files found in "
            + str(SOURCE_DIR)
        )

    for path in zip_files:
        inspect_zip(path)


if __name__ == "__main__":
    main()