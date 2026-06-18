from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
PARTS_DIR = DATA_DIR / "parts"
OUTPUT_PATH = DATA_DIR / "labour_cost_grid_mon_entreprise.csv"

EXPECTED_FILES = [
    "labour_cost_grid__non_cadre__standard__full_time.csv",
    "labour_cost_grid__non_cadre__standard__part_time_80.csv",
    "labour_cost_grid__non_cadre__standard__part_time_50.csv",
    "labour_cost_grid__non_cadre__alsace_moselle__full_time.csv",
    "labour_cost_grid__non_cadre__alsace_moselle__part_time_80.csv",
    "labour_cost_grid__non_cadre__alsace_moselle__part_time_50.csv",
    "labour_cost_grid__cadre__standard__full_time.csv",
    "labour_cost_grid__cadre__standard__part_time_80.csv",
    "labour_cost_grid__cadre__standard__part_time_50.csv",
    "labour_cost_grid__cadre__alsace_moselle__full_time.csv",
    "labour_cost_grid__cadre__alsace_moselle__part_time_80.csv",
    "labour_cost_grid__cadre__alsace_moselle__part_time_50.csv",
]

def main():
    frames = []
    missing = []

    for filename in EXPECTED_FILES:
        path = PARTS_DIR / filename

        if not path.exists():
            missing.append(str(path))
            continue

        df = pd.read_csv(path, low_memory=False)
        print(f"{filename}: {len(df)} rows")
        print(df["status"].value_counts(dropna=False))
        frames.append(df)

    if missing:
        raise FileNotFoundError("Missing part files:\n" + "\n".join(missing))

    df_all = pd.concat(frames, ignore_index=True)

    before = len(df_all)
    df_all = df_all.drop_duplicates(
        subset=["profile_id", "smic_multiple_etp"],
        keep="last"
    )
    after = len(df_all)

    print()
    print(f"Rows before dedup: {before}")
    print(f"Rows after dedup:  {after}")

    print()
    print("Final shape:", df_all.shape)
    print("Status counts:")
    print(df_all["status"].value_counts(dropna=False))

    print()
    print("Profiles:", df_all["profile_id"].nunique())
    rows_by_profile = df_all.groupby("profile_id").size()
    print(rows_by_profile.describe())

    print()
    print("RGDU summary:")
    print(df_all["rgdu_monthly_eur"].describe())

    if len(df_all) != 50016:
        raise ValueError(f"Expected 50016 rows, got {len(df_all)}")

    if df_all["profile_id"].nunique() != 96:
        raise ValueError(
            f"Expected 96 profiles, got {df_all['profile_id'].nunique()}"
        )

    if not df_all["status"].eq("ok").all():
        raise ValueError("Some rows are not ok")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df_all.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

    print()
    print(f"Merged dataset written to: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()