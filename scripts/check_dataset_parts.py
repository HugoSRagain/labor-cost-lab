from pathlib import Path
import pandas as pd

files = sorted(Path("data/parts").glob("*.csv"))

print("files:", len(files))

total = 0
bad = []

for f in files:
    df = pd.read_csv(f, low_memory=False)

    rows = len(df)
    total += rows

    status = df["status"].value_counts(dropna=False).to_dict()
    profiles = df["profile_id"].nunique()
    rgdu_max = df["rgdu_monthly_eur"].max()

    print(
        f"{f.name} | rows={rows} | profiles={profiles} | "
        f"status={status} | rgdu_max={rgdu_max}"
    )

    if rows != 4168 or profiles != 8 or status.get("ok", 0) != 4168 or rgdu_max <= 0:
        bad.append(f.name)

print()
print("TOTAL:", total)
print("BAD:", bad)