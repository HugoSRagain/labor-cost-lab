from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "labour_cost_grid.csv"
FIGURES_DIR = BASE_DIR / "docs" / "figures"

# Palette simple et propre
NAVY = "#0f172a"
BLUE = "#2563eb"
ORANGE = "#f97316"
TEAL = "#0891b2"
RED = "#dc2626"
GREY = "#6b7280"
LIGHT_GREY = "#e5e7eb"
VERY_LIGHT_BLUE = "#dbeafe"


def euro_formatter(x, pos):
    return f"{x:,.0f} €".replace(",", " ")


def percent_formatter(x, pos):
    return f"{x:.0f}%"


def ratio_formatter(x, pos):
    return f"{x:.2f}"


def format_smic_multiple(value):
    return f"{value:.1f}× SMIC"


def save_figure(fig, filename: str):
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    output_path = FIGURES_DIR / filename
    fig.savefig(output_path, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"Figure created: {output_path}")


def style_axes(ax):
    ax.set_facecolor("white")
    ax.grid(True, axis="y", color=LIGHT_GREY, linewidth=1, alpha=0.8)
    ax.grid(False, axis="x")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(LIGHT_GREY)
    ax.spines["bottom"].set_color(LIGHT_GREY)
    ax.tick_params(colors=GREY, labelsize=10)
    ax.yaxis.label.set_color(GREY)
    ax.xaxis.label.set_color(GREY)
    ax.title.set_color(NAVY)


def add_relief_zone(ax):
    ax.axvspan(1.0, 1.6, color=VERY_LIGHT_BLUE, alpha=0.55, zorder=0)
    ax.axvline(1.0, color=BLUE, linestyle="--", linewidth=1.5, alpha=0.8)
    ax.axvline(1.6, color=BLUE, linestyle="--", linewidth=1.5, alpha=0.8)

    ymin, ymax = ax.get_ylim()
    ax.text(
        1.3,
        ymax - (ymax - ymin) * 0.08,
        "Relief phase-out zone\n(1.0 to 1.6 SMIC)",
        ha="center",
        va="top",
        fontsize=9,
        color=BLUE,
        bbox=dict(boxstyle="round,pad=0.3", facecolor="white", edgecolor=LIGHT_GREY)
    )


def get_point(df, target_multiple):
    idx = (df["smic_multiple"] - target_multiple).abs().idxmin()
    return df.loc[idx]


def make_cost_and_net_figure(df):
    fig, ax = plt.subplots(figsize=(9.5, 5.8))

    ax.plot(
        df["gross_monthly_eur"],
        df["employer_cost_monthly_eur"],
        label="Employer cost",
        color=BLUE,
        linewidth=2.8
    )

    ax.plot(
        df["gross_monthly_eur"],
        df["net_monthly_eur"],
        label="Net wage",
        color=ORANGE,
        linewidth=2.8
    )

    ax.fill_between(
        df["gross_monthly_eur"],
        df["net_monthly_eur"],
        df["employer_cost_monthly_eur"],
        color=BLUE,
        alpha=0.08
    )

    point_1 = get_point(df, 1.0)
    point_16 = get_point(df, 1.6)

    ax.scatter(
        [point_1["gross_monthly_eur"], point_16["gross_monthly_eur"]],
        [point_1["employer_cost_monthly_eur"], point_16["employer_cost_monthly_eur"]],
        color=BLUE,
        s=50,
        zorder=5
    )

    ax.annotate(
        "1.0 SMIC",
        (point_1["gross_monthly_eur"], point_1["employer_cost_monthly_eur"]),
        xytext=(10, 10),
        textcoords="offset points",
        fontsize=9,
        color=BLUE
    )

    ax.annotate(
        "1.6 SMIC",
        (point_16["gross_monthly_eur"], point_16["employer_cost_monthly_eur"]),
        xytext=(10, -18),
        textcoords="offset points",
        fontsize=9,
        color=BLUE
    )

    ax.set_title("From gross wage to employer cost", fontsize=15, fontweight="bold", pad=14)
    ax.set_xlabel("Gross monthly wage")
    ax.set_ylabel("Monthly amount")
    ax.yaxis.set_major_formatter(FuncFormatter(euro_formatter))
    ax.xaxis.set_major_formatter(FuncFormatter(euro_formatter))

    style_axes(ax)

    legend = ax.legend(frameon=False, loc="upper left")
    for text in legend.get_texts():
        text.set_color(NAVY)

    ax.text(
        0.0,
        1.02,
        "Stylized simulation of net wage and employer cost along the wage distribution.",
        transform=ax.transAxes,
        fontsize=10,
        color=GREY,
        va="bottom"
    )

    save_figure(fig, "cost_and_net_vs_gross.png")


def make_employer_rate_figure(df):
    fig, ax = plt.subplots(figsize=(9.5, 5.8))

    y = df["employer_contribution_rate"] * 100

    ax.plot(
        df["smic_multiple"],
        y,
        color=BLUE,
        linewidth=2.8
    )

    ax.set_title("Effective employer contribution rate", fontsize=15, fontweight="bold", pad=14)
    ax.set_xlabel("Gross wage")
    ax.set_ylabel("Contribution rate")
    ax.yaxis.set_major_formatter(FuncFormatter(percent_formatter))

    style_axes(ax)
    add_relief_zone(ax)

    ax.text(
        0.0,
        1.02,
        "The simulation assumes reduced employer contributions near the minimum wage.",
        transform=ax.transAxes,
        fontsize=10,
        color=GREY,
        va="bottom"
    )

    save_figure(fig, "employer_contribution_rate.png")


def make_social_wedge_figure(df):
    fig, ax = plt.subplots(figsize=(9.5, 5.8))

    y = df["social_wedge_rate"] * 100

    ax.plot(
        df["smic_multiple"],
        y,
        color=TEAL,
        linewidth=2.8
    )

    ax.fill_between(
        df["smic_multiple"],
        y,
        color=TEAL,
        alpha=0.12
    )

    ax.set_title("Social wedge as a share of employer cost", fontsize=15, fontweight="bold", pad=14)
    ax.set_xlabel("Gross wage")
    ax.set_ylabel("Social wedge")
    ax.yaxis.set_major_formatter(FuncFormatter(percent_formatter))

    style_axes(ax)
    add_relief_zone(ax)

    ax.text(
        0.0,
        1.02,
        "This wedge captures the gap between what the employer pays and what the employee receives.",
        transform=ax.transAxes,
        fontsize=10,
        color=GREY,
        va="bottom"
    )

    save_figure(fig, "social_wedge_rate.png")


def make_cost_to_net_ratio_figure(df):
    fig, ax = plt.subplots(figsize=(9.5, 5.8))

    y = df["cost_to_net_ratio"]

    ax.plot(
        df["smic_multiple"],
        y,
        color=RED,
        linewidth=2.8
    )

    ax.set_title("Employer cost to net wage ratio", fontsize=15, fontweight="bold", pad=14)
    ax.set_xlabel("Gross wage")
    ax.set_ylabel("Employer cost / net wage")
    ax.yaxis.set_major_formatter(FuncFormatter(ratio_formatter))

    style_axes(ax)
    add_relief_zone(ax)

    ax.text(
        0.0,
        1.02,
        "A useful summary indicator: how many euros the employer pays for one euro of net wage.",
        transform=ax.transAxes,
        fontsize=10,
        color=GREY,
        va="bottom"
    )

    save_figure(fig, "cost_to_net_ratio.png")


def main():
    df = pd.read_csv(DATA_PATH)

    plt.rcParams.update({
        "font.family": "DejaVu Sans",
        "axes.titlesize": 15,
        "axes.labelsize": 11,
        "xtick.labelsize": 10,
        "ytick.labelsize": 10
    })

    make_cost_and_net_figure(df)
    make_employer_rate_figure(df)
    make_social_wedge_figure(df)
    make_cost_to_net_ratio_figure(df)


if __name__ == "__main__":
    main()