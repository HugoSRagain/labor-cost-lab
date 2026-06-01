import pandas as pd
from pathlib import Path

PROFILE = "non_cadre__standard__standard"

MAY_PATH = Path("archive/labour_cost_grid_2026_05.csv")
JUNE_PATH = Path("docs/data/labour_cost_grid_mon_entreprise.csv")
OUT_PATH = Path("docs/data/rgdu_reform_june_2026.csv")

may = pd.read_csv(MAY_PATH)
june = pd.read_csv(JUNE_PATH)

may = may[may["profile_id"] == PROFILE].copy()
june = june[june["profile_id"] == PROFILE].copy()

may = may[may["smic_multiple"] >= 1.0].sort_values("smic_multiple")
june = june[june["smic_multiple"] >= 1.0].sort_values("smic_multiple")

comparison = may[["smic_multiple", "rgdu_monthly_eur"]].merge(
    june[["smic_multiple", "rgdu_monthly_eur"]],
    on="smic_multiple",
    suffixes=("_may", "_june")
)

comparison["delta_rgdu_eur"] = (
    comparison["rgdu_monthly_eur_june"]
    - comparison["rgdu_monthly_eur_may"]
)

comparison.to_csv(OUT_PATH, index=False, encoding="utf-8-sig")

print(f"Created: {OUT_PATH}")
print(comparison.head())