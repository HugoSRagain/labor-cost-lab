from pathlib import Path
import pandas as pd
from datetime import datetime


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "labour_cost_grid.csv"
DOCS_DIR = BASE_DIR / "docs"
OUTPUT_PATH = DOCS_DIR / "index.html"


def main():
    df = pd.read_csv(DATA_PATH)

    updated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    sample_rows = df[
        df["smic_multiple"].isin([1.0, 1.2, 1.6, 2.0, 2.5, 3.0])
    ].copy()

    table_html = sample_rows.to_html(
        index=False,
        classes="data-table",
        border=0
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>French Labour Cost Lab</title>
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
            padding: 32px 48px;
        }}

        header h1 {{
            margin: 0 0 8px 0;
            font-size: 34px;
        }}

        header p {{
            margin: 0;
            color: #d1d5db;
            font-size: 16px;
        }}

        main {{
            max-width: 1100px;
            margin: 32px auto;
            padding: 0 24px;
        }}

        section {{
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            overflow: hidden;
        }}

        h2 {{
            margin-top: 0;
        }}

        .grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }}

        .figure-card img {{
            width: 100%;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            background: white;
        }}

        .table-wrapper {{
            width: 100%;
            overflow-x: auto;
            padding-bottom: 6px;
        }}

        .data-table {{
            width: 100%;
            min-width: 1100px;
            border-collapse: collapse;
            font-size: 13px;
        }}

        .data-table th,
        .data-table td {{
            border-bottom: 1px solid #e5e7eb;
            padding: 8px;
            text-align: right;
            white-space: nowrap;
        }}

        .data-table th {{
            background: #f9fafb;
            font-weight: 700;
        }}

        .note {{
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
        }}

        footer {{
            text-align: center;
            color: #6b7280;
            padding: 24px;
            font-size: 13px;
        }}

        @media (max-width: 900px) {{
            header {{
                padding: 24px;
            }}

            main {{
                margin: 24px auto;
                padding: 0 16px;
            }}

            .grid {{
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
            <p class="note">
                This first version uses stylized assumptions. Future versions will connect
                the simulation engine to official Mon-entreprise calculations.
            </p>
        </section>

        <section>
            <h2>Selected salary points</h2>
            <div class="table-wrapper">
                {table_html}
            </div>
        </section>

        <section>
            <h2>Figures</h2>

            <div class="grid">
                <div class="figure-card">
                    <h3>Gross wage, net wage and employer cost</h3>
                    <img src="../figures/cost_and_net_vs_gross.png" alt="Gross wage, net wage and employer cost">
                </div>

                <div class="figure-card">
                    <h3>Employer contribution rate</h3>
                    <img src="../figures/employer_contribution_rate.png" alt="Employer contribution rate">
                </div>

                <div class="figure-card">
                    <h3>Social wedge</h3>
                    <img src="../figures/social_wedge_rate.png" alt="Social wedge">
                </div>

                <div class="figure-card">
                    <h3>Cost-to-net ratio</h3>
                    <img src="../figures/cost_to_net_ratio.png" alt="Cost-to-net ratio">
                </div>
            </div>
        </section>

        <section>
            <h2>Interpretation</h2>
            <p>
                The central object of the project is not only the legal distinction between
                employer and employee contributions, but the full wedge between what the employer
                pays and what the employee receives as net wage.
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