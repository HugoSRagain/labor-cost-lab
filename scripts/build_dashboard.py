from pathlib import Path
from datetime import datetime

import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "labour_cost_grid.csv"
DOCS_DIR = BASE_DIR / "docs"
OUTPUT_PATH = DOCS_DIR / "index.html"


COLOR_NAVY = "#0f172a"
COLOR_BLUE = "#2563eb"
COLOR_ORANGE = "#f97316"
COLOR_TEAL = "#0891b2"
COLOR_RED = "#dc2626"
COLOR_GREY = "#64748b"
COLOR_LIGHT_BLUE = "rgba(37, 99, 235, 0.10)"


def euro(value):
    return f"{value:,.0f} €".replace(",", " ")


def pct(value):
    return f"{value:.1f}%"


def base_layout(title: str, yaxis_title: str, xaxis_title: str = "Gross wage, SMIC multiple"):
    return dict(
        title=dict(
            text=title,
            x=0.02,
            xanchor="left",
            font=dict(size=18, color=COLOR_NAVY)
        ),
        template="plotly_white",
        height=430,
        margin=dict(l=64, r=32, t=70, b=60),
        font=dict(family="Arial", size=13, color=COLOR_NAVY),
        hovermode="x unified",
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        ),
        xaxis=dict(
            title=xaxis_title,
            showgrid=False,
            zeroline=False
        ),
        yaxis=dict(
            title=yaxis_title,
            showgrid=True,
            gridcolor="#e5e7eb",
            zeroline=False
        )
    )


def add_relief_zone(fig):
    fig.add_vrect(
        x0=1.0,
        x1=1.6,
        fillcolor=COLOR_LIGHT_BLUE,
        line_width=0,
        layer="below",
        annotation_text="Relief phase-out<br>1.0–1.6 SMIC",
        annotation_position="top left",
        annotation_font_size=12,
        annotation_font_color=COLOR_BLUE
    )

    fig.add_vline(
        x=1.0,
        line_dash="dash",
        line_color=COLOR_BLUE,
        opacity=0.7
    )

    fig.add_vline(
        x=1.6,
        line_dash="dash",
        line_color=COLOR_BLUE,
        opacity=0.7
    )


def make_cost_chart(df):
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["employer_cost_monthly_eur"],
            mode="lines",
            name="Employer cost",
            line=dict(color=COLOR_BLUE, width=3),
            customdata=df[["gross_monthly_eur", "net_monthly_eur"]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                "Gross wage: %{customdata[0]:,.0f} €<br>"
                "Net wage: %{customdata[1]:,.0f} €<br>"
                "Employer cost: %{y:,.0f} €"
                "<extra></extra>"
            )
        )
    )

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["net_monthly_eur"],
            mode="lines",
            name="Net wage",
            line=dict(color=COLOR_ORANGE, width=3),
            customdata=df[["gross_monthly_eur", "employer_cost_monthly_eur"]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                "Gross wage: %{customdata[0]:,.0f} €<br>"
                "Net wage: %{y:,.0f} €<br>"
                "Employer cost: %{customdata[1]:,.0f} €"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(
        **base_layout(
            title="From gross wage to employer cost",
            yaxis_title="Monthly amount, euros"
        )
    )

    fig.update_yaxes(tickprefix="", ticksuffix=" €")
    add_relief_zone(fig)

    return fig


def make_employer_rate_chart(df):
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["employer_contribution_rate"] * 100,
            mode="lines",
            name="Employer contribution rate",
            line=dict(color=COLOR_BLUE, width=3),
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                "Employer contribution rate: %{y:.1f}%"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(
        **base_layout(
            title="Effective employer contribution rate",
            yaxis_title="Contribution rate"
        )
    )

    fig.update_yaxes(ticksuffix="%")
    add_relief_zone(fig)

    return fig


def make_social_wedge_chart(df):
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["social_wedge_rate"] * 100,
            mode="lines",
            name="Social wedge",
            line=dict(color=COLOR_TEAL, width=3),
            fill="tozeroy",
            fillcolor="rgba(8, 145, 178, 0.12)",
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                "Social wedge: %{y:.1f}% of employer cost"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(
        **base_layout(
            title="Social wedge as a share of employer cost",
            yaxis_title="Social wedge"
        )
    )

    fig.update_yaxes(ticksuffix="%")
    add_relief_zone(fig)

    return fig


def make_cost_to_net_chart(df):
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["cost_to_net_ratio"],
            mode="lines",
            name="Employer cost / net wage",
            line=dict(color=COLOR_RED, width=3),
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                "Cost-to-net ratio: %{y:.2f}"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(
        **base_layout(
            title="Employer cost to net wage ratio",
            yaxis_title="Employer cost / net wage"
        )
    )

    add_relief_zone(fig)

    return fig


def fig_to_html(fig):
    return pio.to_html(
        fig,
        include_plotlyjs=False,
        full_html=False,
        config={
            "displaylogo": False,
            "responsive": True,
            "modeBarButtonsToRemove": [
                "select2d",
                "lasso2d",
                "autoScale2d"
            ]
        }
    )


def build_table(df):
    sample_rows = df[
        df["smic_multiple"].isin([1.0, 1.2, 1.6, 2.0, 2.5, 3.0])
    ].copy()

    sample_rows = sample_rows.rename(columns={
        "smic_multiple": "SMIC multiple",
        "gross_monthly_eur": "Gross wage (€)",
        "net_monthly_eur": "Net wage (€)",
        "employer_cost_monthly_eur": "Employer cost (€)",
        "employee_contributions_monthly_eur": "Employee contrib. (€)",
        "employer_contributions_monthly_eur": "Employer contrib. (€)",
        "employee_contribution_rate": "Employee rate",
        "employer_contribution_rate": "Employer rate",
        "social_wedge_monthly_eur": "Social wedge (€)",
        "social_wedge_rate": "Social wedge rate",
        "cost_to_net_ratio": "Cost / net ratio"
    })

    money_columns = [
        "Gross wage (€)",
        "Net wage (€)",
        "Employer cost (€)",
        "Employee contrib. (€)",
        "Employer contrib. (€)",
        "Social wedge (€)"
    ]

    rate_columns = [
        "Employee rate",
        "Employer rate",
        "Social wedge rate"
    ]

    for col in money_columns:
        sample_rows[col] = sample_rows[col].map(lambda x: euro(float(x)))

    for col in rate_columns:
        sample_rows[col] = sample_rows[col].map(lambda x: pct(float(x) * 100))

    sample_rows["Cost / net ratio"] = sample_rows["Cost / net ratio"].map(lambda x: f"{float(x):.2f}")

    return sample_rows.to_html(
        index=False,
        classes="data-table",
        border=0,
        escape=False
    )


def main():
    df = pd.read_csv(DATA_PATH)

    updated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    table_html = build_table(df)

    cost_chart = fig_to_html(make_cost_chart(df))
    employer_rate_chart = fig_to_html(make_employer_rate_chart(df))
    social_wedge_chart = fig_to_html(make_social_wedge_chart(df))
    cost_to_net_chart = fig_to_html(make_cost_to_net_chart(df))

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>French Labour Cost Lab</title>

    <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>

    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            background: #f4f5f7;
            color: #1f2937;
        }}

        header {{
            background: #111827;
            color: white;
            padding: 42px 52px;
        }}

        header h1 {{
            margin: 0 0 10px 0;
            font-size: 42px;
            letter-spacing: -0.03em;
        }}

        header p {{
            margin: 0;
            color: #d1d5db;
            font-size: 18px;
        }}

        main {{
            max-width: 1220px;
            margin: 34px auto;
            padding: 0 24px;
        }}

        section {{
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            padding: 30px;
            margin-bottom: 26px;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
            overflow: hidden;
        }}

        h2 {{
            margin-top: 0;
            margin-bottom: 18px;
            font-size: 25px;
            color: #0f172a;
            letter-spacing: -0.02em;
        }}

        h3 {{
            margin-top: 0;
            margin-bottom: 8px;
            font-size: 18px;
            color: #0f172a;
        }}

        p {{
            line-height: 1.55;
        }}

        .method-box {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 16px 18px;
            color: #475569;
            font-size: 14px;
            line-height: 1.55;
        }}

        .table-wrapper {{
            width: 100%;
            overflow-x: auto;
            padding-bottom: 6px;
        }}

        .data-table {{
            width: 100%;
            min-width: 1080px;
            border-collapse: collapse;
            font-size: 13px;
        }}

        .data-table th,
        .data-table td {{
            border-bottom: 1px solid #e5e7eb;
            padding: 9px 10px;
            text-align: right;
            white-space: nowrap;
        }}

        .data-table th {{
            background: #f9fafb;
            font-weight: 700;
            color: #0f172a;
        }}

        .charts-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }}

        .chart-card {{
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 18px 18px 10px 18px;
            background: #ffffff;
            min-width: 0;
        }}

        .chart-subtitle {{
            margin: 0 0 10px 0;
            color: #64748b;
            font-size: 14px;
            line-height: 1.45;
        }}

        .plotly-chart {{
            width: 100%;
        }}

        .interpretation {{
            color: #334155;
            font-size: 15px;
        }}

        footer {{
            text-align: center;
            color: #6b7280;
            padding: 30px;
            font-size: 13px;
        }}

        @media (max-width: 980px) {{
            header {{
                padding: 30px 24px;
            }}

            header h1 {{
                font-size: 34px;
            }}

            main {{
                margin: 24px auto;
                padding: 0 16px;
            }}

            section {{
                padding: 22px;
            }}

            .charts-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <header>
        <h1>French Labour Cost Lab</h1>
        <p>Open-source research tool for simulating and visualizing labour costs in France.</p>
    </header>

    <main>
        <section>
            <h2>Purpose</h2>
            <p>
                French Labour Cost Lab provides reproducible simulations of gross wages,
                net wages, employer costs and social wedges in France.
            </p>
            <div class="method-box">
                <strong>Methodological note.</strong> This first version relies on stylized assumptions.
                It is designed to illustrate the structure of labour costs and contribution wedges,
                not to serve as an official payroll calculator. Future versions will connect the
                simulation engine to official Mon-entreprise calculations.
            </div>
        </section>

        <section>
            <h2>Selected salary points</h2>
            <div class="table-wrapper">
                {table_html}
            </div>
        </section>

        <section>
            <h2>Interactive figures</h2>

            <div class="charts-grid">
                <div class="chart-card">
                    <h3>From gross wage to employer cost</h3>
                    <p class="chart-subtitle">
                        Compare monthly gross wage, net wage and total employer cost across the wage grid.
                    </p>
                    <div class="plotly-chart">
                        {cost_chart}
                    </div>
                </div>

                <div class="chart-card">
                    <h3>Effective employer contribution rate</h3>
                    <p class="chart-subtitle">
                        The shaded zone highlights the phase-out of contribution relief between 1.0 and 1.6 SMIC.
                    </p>
                    <div class="plotly-chart">
                        {employer_rate_chart}
                    </div>
                </div>

                <div class="chart-card">
                    <h3>Social wedge as a share of employer cost</h3>
                    <p class="chart-subtitle">
                        The social wedge measures the gap between what the employer pays and what the employee receives.
                    </p>
                    <div class="plotly-chart">
                        {social_wedge_chart}
                    </div>
                </div>

                <div class="chart-card">
                    <h3>Employer cost to net wage ratio</h3>
                    <p class="chart-subtitle">
                        This ratio summarizes how many euros the employer pays for one euro of net wage.
                    </p>
                    <div class="plotly-chart">
                        {cost_to_net_chart}
                    </div>
                </div>
            </div>
        </section>

        <section>
            <h2>Interpretation</h2>
            <p class="interpretation">
                The central object of the project is not only the legal distinction between employer
                and employee contributions, but the full wedge between what the employer pays and what
                the employee receives as net wage. This makes it possible to study not only average
                labour costs, but also the implicit structure of contribution relief and the marginal
                incentives embedded in the French payroll system.
            </p>
        </section>
    </main>

    <footer>
        Last updated: {updated_at}
    </footer>
</body>
</html>
"""

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(html, encoding="utf-8")

    print(f"Dashboard created: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()