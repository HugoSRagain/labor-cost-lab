import pandas as pd
import matplotlib.pyplot as plt

PROFILE = "non_cadre__standard__standard"

MAY_PATH = "archive/labour_cost_grid_2026_05.csv"
JUNE_PATH = "docs/data/labour_cost_grid_mon_entreprise.csv"

OUT_LEVEL = "analysis/rgdu_pre_post_june_2026.png"
OUT_DELTA = "analysis/rgdu_change_june_2026.png"

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

comparison["delta_rgdu"] = (
    comparison["rgdu_monthly_eur_june"]
    - comparison["rgdu_monthly_eur_may"]
)

# Graphique 1 : niveaux
plt.figure(figsize=(10, 6))
plt.plot(
    comparison["smic_multiple"],
    comparison["rgdu_monthly_eur_may"],
    label="Avant réforme — mai 2026"
)
plt.plot(
    comparison["smic_multiple"],
    comparison["rgdu_monthly_eur_june"],
    label="Après réforme — juin 2026"
)

plt.axvline(1.0, linestyle="--", linewidth=1)
plt.axvline(3.0, linestyle="--", linewidth=1)

plt.xlabel("Multiple du SMIC")
plt.ylabel("RGDU mensuelle (€)")
plt.title("Allègements de cotisations avant et après le 1er juin 2026")
plt.legend()
plt.xlim(1.0, 3.2)
plt.tight_layout()
plt.savefig(OUT_LEVEL, dpi=300, bbox_inches="tight")
plt.close()

# Graphique 2 : écart
plt.figure(figsize=(10, 6))
plt.plot(
    comparison["smic_multiple"],
    comparison["delta_rgdu"],
    label="Variation juin - mai"
)

plt.axhline(0, linestyle="--", linewidth=1)
plt.axvline(1.0, linestyle="--", linewidth=1)
plt.axvline(3.0, linestyle="--", linewidth=1)

plt.xlabel("Multiple du SMIC")
plt.ylabel("Variation mensuelle de RGDU (€)")
plt.title("Variation des allègements après le 1er juin 2026")
plt.legend()
plt.xlim(1.0, 3.2)
plt.tight_layout()
plt.savefig(OUT_DELTA, dpi=300, bbox_inches="tight")
plt.close()

print(f"Graph saved: {OUT_LEVEL}")
print(f"Graph saved: {OUT_DELTA}")

print("\nSelected points:")
print(
    comparison[
        comparison["smic_multiple"].isin([1.0, 1.2, 1.6, 2.0, 2.5, 3.0])
    ][
        [
            "smic_multiple",
            "rgdu_monthly_eur_may",
            "rgdu_monthly_eur_june",
            "delta_rgdu",
        ]
    ].to_string(index=False)
)

print("\nMaximum monthly loss:")
row = comparison.loc[comparison["delta_rgdu"].idxmin()]
print(row.to_string())