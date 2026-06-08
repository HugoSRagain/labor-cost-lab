from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

DATA_PATH = Path("data/labour_cost_grid_mon_entreprise.csv")
OUT = Path("outputs")
OUT.mkdir(exist_ok=True)

BASELINE_PROFILE = "non_cadre__standard__standard"


def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Compute FLCL paper indicators for all profiles."""
    df = df.copy()

    if "status" in df.columns:
        df = df[df["status"] == "ok"].copy()

    df = df.sort_values(["profile_id", "smic_multiple"]).reset_index(drop=True)

    df["rgdu_monthly_eur"] = df["rgdu_monthly_eur"].fillna(0.0)

    df["A"] = df["net_monthly_eur"] / df["employer_cost_monthly_eur"]

    df["cost_without_rgdu"] = (
        df["employer_cost_monthly_eur"] + df["rgdu_monthly_eur"]
    )

    df["A_without_rgdu"] = df["net_monthly_eur"] / df["cost_without_rgdu"]
    df["R"] = df["A"] - df["A_without_rgdu"]

    results = []

    for profile_id, g in df.groupby("profile_id"):
        g = g.sort_values("smic_multiple").copy()

        # Smoothed central difference over +/- 0.03 SMIC.
        # This reduces local numerical artefacts while preserving statutory kinks.
        window = 3

        delta_net = (
            g["net_monthly_eur"].shift(-window)
            - g["net_monthly_eur"].shift(window)
        )

        delta_cost = (
            g["employer_cost_monthly_eur"].shift(-window)
            - g["employer_cost_monthly_eur"].shift(window)
        )

        g["T"] = delta_net / delta_cost

        g["T"] = (
            g["T"]
            .interpolate(limit_direction="both")
        )

        g["epsilon_NC"] = g["T"] / g["A"]

        results.append(g)

    return pd.concat(results, ignore_index=True)


def export_summary_tables(paper: pd.DataFrame, baseline: pd.DataFrame, rgdu_start: float, rgdu_end: float) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Export profile summary, zone summary and main results tables."""
    summary = (
        paper.groupby("profile_id")
        .agg(
            A_min=("A", "min"),
            A_max=("A", "max"),
            T_min=("T", "min"),
            T_max=("T", "max"),
            epsilon_min=("epsilon_NC", "min"),
            epsilon_max=("epsilon_NC", "max"),
            R_max=("R", "max"),
        )
        .reset_index()
    )

    t_min_rows = (
        paper.loc[paper.groupby("profile_id")["T"].idxmin()]
        [["profile_id", "smic_multiple", "T"]]
        .rename(
            columns={
                "smic_multiple": "smic_at_T_min",
                "T": "T_min_check",
            }
        )
    )

    summary = summary.merge(t_min_rows, on="profile_id", how="left")

    summary.to_csv(OUT / "table_1_summary_by_profile.csv", index=False)
    summary.to_latex(
        OUT / "table_1_summary_by_profile.tex",
        index=False,
        float_format="%.3f",
    )

    zone_summary = pd.DataFrame(
        {
            "zone": [
                f"{rgdu_start:.2f}-{rgdu_end:.2f} SMIC",
                f">{rgdu_end:.2f} SMIC",
            ],
            "T_mean": [
                baseline[
                    (baseline["smic_multiple"] >= rgdu_start)
                    & (baseline["smic_multiple"] <= rgdu_end)
                ]["T"].mean(),
                baseline[
                    baseline["smic_multiple"] > rgdu_end
                ]["T"].mean(),
            ],
        }
    )

    zone_summary.to_csv(
        OUT / "table_2_marginal_transmission_by_zone.csv",
        index=False,
    )
    zone_summary.to_latex(
        OUT / "table_2_marginal_transmission_by_zone.tex",
        index=False,
        float_format="%.3f",
    )

    main_results = pd.DataFrame(
        {
            "Statistic": [
                "Minimum average transmission",
                "Maximum average transmission",
                "Minimum marginal transmission",
                "Maximum marginal transmission",
                "Minimum elasticity",
                "Maximum elasticity",
                "Maximum relief transmission premium",
                "Mean marginal transmission in RGDU-positive zone",
                "Mean marginal transmission above RGDU threshold",
            ],
            "Value": [
                baseline["A"].min(),
                baseline["A"].max(),
                baseline["T"].min(),
                baseline["T"].max(),
                baseline["epsilon_NC"].min(),
                baseline["epsilon_NC"].max(),
                baseline["R"].max(),
                zone_summary.iloc[0]["T_mean"],
                zone_summary.iloc[1]["T_mean"],
            ],
        }
    )

    main_results.to_csv(OUT / "table_0_main_results.csv", index=False)
    main_results.to_latex(
        OUT / "table_0_main_results.tex",
        index=False,
        float_format="%.3f",
    )

    return summary, zone_summary


def export_largest_breaks(baseline: pd.DataFrame) -> None:
    """Export the largest downward breaks in marginal transmission."""
    baseline = baseline.copy()

    baseline["delta_T"] = baseline["T"].diff()
    baseline["delta_net"] = baseline["net_monthly_eur"].diff()
    baseline["delta_cost"] = baseline["employer_cost_monthly_eur"].diff()
    baseline["delta_rgdu"] = baseline["rgdu_monthly_eur"].diff()

    largest_breaks = (
        baseline[
            [
                "smic_multiple",
                "gross_monthly_eur",
                "employer_cost_monthly_eur",
                "net_monthly_eur",
                "rgdu_monthly_eur",
                "T",
                "delta_T",
                "delta_net",
                "delta_cost",
                "delta_rgdu",
            ]
        ]
        .sort_values("delta_T")
        .head(20)
    )

    largest_breaks.to_csv(
        OUT / "table_3_largest_breaks.csv",
        index=False,
    )


def save_line(
    baseline: pd.DataFrame,
    y: str,
    ylabel: str,
    title: str,
    filename: str,
    rgdu_start: float,
    rgdu_end: float,
) -> None:
    """Save a line chart with the observed RGDU-positive zone."""
    plt.figure(figsize=(8, 4.8))
    plt.plot(baseline["smic_multiple"], baseline[y])

    plt.axvspan(rgdu_start, rgdu_end, alpha=0.12)
    plt.axvline(rgdu_start, linestyle="--", linewidth=1)
    plt.axvline(rgdu_end, linestyle="--", linewidth=1)

    plt.text(
        (rgdu_start + rgdu_end) / 2,
        plt.ylim()[1] * 0.97,
        f"RGDU analytical zone\n{rgdu_start:.2f}-{rgdu_end:.2f} SMIC",
        ha="center",
        va="top",
        fontsize=8,
    )

    plt.xlabel("Gross wage, multiples of SMIC")
    plt.ylabel(ylabel)
    plt.title(title)
    plt.tight_layout()
    plt.savefig(OUT / filename, dpi=300)
    plt.close()


def save_transmission_function(
    baseline: pd.DataFrame,
    rgdu_end: float,
) -> None:
    """Save the labour cost transmission function."""
    rgdu_end_cost = baseline.loc[
        baseline["smic_multiple"].sub(rgdu_end).abs().idxmin(),
        "employer_cost_monthly_eur",
    ]

    plt.figure(figsize=(6, 6))
    plt.plot(
        baseline["employer_cost_monthly_eur"],
        baseline["net_monthly_eur"],
    )

    # The full RGDU-positive span is visually too large in (C, N) space.
    # We therefore mark only the observed end of relief.
    plt.axvline(
        rgdu_end_cost,
        linestyle="--",
        linewidth=1.5,
    )

    plt.text(
        rgdu_end_cost,
        plt.ylim()[1] * 0.95,
        f"End of RGDU-positive zone\n{rgdu_end:.2f} SMIC",
        ha="right",
        va="top",
        fontsize=8,
    )

    plt.plot(
        baseline["employer_cost_monthly_eur"],
        baseline["employer_cost_monthly_eur"],
        linestyle="--",
        linewidth=1,
    )

    plt.xlabel("Employer labour cost, €/month")
    plt.ylabel("Net wage, €/month")
    plt.title("Labour cost transmission function")
    plt.tight_layout()
    plt.savefig(OUT / "figure_1_transmission_function.png", dpi=300)
    plt.close()


def export_figures(baseline: pd.DataFrame, rgdu_start: float, rgdu_end: float) -> None:
    """Export paper figures."""
    save_transmission_function(baseline, rgdu_end)

    save_line(
        baseline,
        "A",
        "Average transmission A = N/C",
        "Average transmission ratio",
        "figure_2_average_transmission.png",
        rgdu_start,
        rgdu_end,
    )

    save_line(
        baseline,
        "T",
        "Marginal transmission T = dN/dC",
        "Marginal transmission",
        "figure_3_marginal_transmission.png",
        rgdu_start,
        rgdu_end,
    )

    save_line(
        baseline,
        "epsilon_NC",
        "Elasticity epsilon_NC = T/A",
        "Net-income-to-labour-cost elasticity",
        "figure_4_elasticity.png",
        rgdu_start,
        rgdu_end,
    )

    save_line(
        baseline,
        "R",
        "Relief premium R = A - A0",
        "Relief transmission premium",
        "figure_5_relief_premium.png",
        rgdu_start,
        rgdu_end,
    )


def main() -> None:
    df = pd.read_csv(DATA_PATH)

    paper = compute_indicators(df)
    paper.to_csv(OUT / "flcl_paper_dataset.csv", index=False)

    baseline = paper[paper["profile_id"] == BASELINE_PROFILE].copy()

    rgdu_positive = baseline[baseline["rgdu_monthly_eur"] > 0]

    if rgdu_positive.empty:
        raise ValueError(
            f"No positive RGDU observations found for baseline profile: {BASELINE_PROFILE}"
        )

    rgdu_start = 1.00
    rgdu_end = rgdu_positive["smic_multiple"].max()

    summary, zone_summary = export_summary_tables(
        paper,
        baseline,
        rgdu_start,
        rgdu_end,
    )

    export_largest_breaks(baseline)
    export_figures(baseline, rgdu_start, rgdu_end)

    print()
    print("Observed relief zone:")
    print(f"RGDU analytical zone from {rgdu_start:.2f} to {rgdu_end:.2f} SMIC")

    print("Done.")
    print("Files written to:", OUT.resolve())
    print()
    print("Baseline profile:", BASELINE_PROFILE)
    print(summary[summary["profile_id"] == BASELINE_PROFILE].to_string(index=False))
    print()
    print(zone_summary.to_string(index=False))

    print()
    print("Key result:")
    print(
        f"Maximum RGDU transmission premium = "
        f"{baseline['R'].max():.3f}"
    )
    print(
        f"Mean marginal transmission in RGDU-positive zone = "
        f"{zone_summary.iloc[0]['T_mean']:.3f}"
    )
    print(
        f"Mean marginal transmission above RGDU threshold = "
        f"{zone_summary.iloc[1]['T_mean']:.3f}"
    )


if __name__ == "__main__":
    main()
