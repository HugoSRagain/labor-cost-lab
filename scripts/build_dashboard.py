from pathlib import Path
from datetime import datetime

import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "labour_cost_grid_mon_entreprise.csv"
DOCS_DIR = BASE_DIR / "docs"
OUTPUT_PATH = DOCS_DIR / "index.html"


COLOR_NAVY = "#0f172a"
COLOR_BLUE = "#2563eb"
COLOR_ORANGE = "#f97316"
COLOR_TEAL = "#0891b2"
COLOR_RED = "#dc2626"
COLOR_PURPLE = "#7c3aed"
COLOR_LIGHT_BLUE = "rgba(37, 99, 235, 0.10)"


TEXT = {
    "en": {
        "html_lang": "en",
        "page_title": "French Labour Cost Lab",
        "subtitle": "Open-source research tool for simulating and visualizing labour costs in France.",
        "language_button": "Français",
        "engine_badge": "Calculation engine: Mon-entreprise / URSSAF API",
        "purpose_title": "Purpose",
        "purpose_text": (
            "French Labour Cost Lab provides reproducible simulations of gross wages, "
            "net wages, employer costs, employer contribution reliefs and social wedges in France."
        ),
        "method_note": (
            "<strong>Methodological note.</strong> This version uses the Mon-entreprise / URSSAF "
            "calculation engine through its public API. Results are computed for a generic wage grid "
            "and should be interpreted as a reference case, not as an official payslip calculator. "
            "Some institutional parameters may depend on firm size, sector, collective agreement, "
            "location, executive status and specific contribution regimes. The contribution relief "
            "shown here is labelled as RGDU 2026 in the dashboard."
        ),
        "metric_net_smic": "Net wage at 1 SMIC",
        "metric_cost_smic": "Employer cost at 1 SMIC",
        "metric_rgdu_smic": "RGDU 2026 at 1 SMIC",
        "metric_ratio_2_smic": "Cost/net ratio at 2 SMIC",
        "table_title": "Selected salary points",
        "figures_title": "Interactive figures",
        "interpretation_title": "Interpretation",
        "interpretation_text": (
            "The central object of the project is not only the legal distinction between employer "
            "and employee contributions, but the full wedge between what the employer pays and what "
            "the employee receives as net wage. The RGDU 2026 graph isolates the employer contribution "
            "relief component, which is central to the non-linear structure of labour costs in France."
        ),
        "footer": "Last updated",
        "x_axis": "Gross wage, SMIC multiple",
        "y_monthly_amount": "Monthly amount, euros",
        "y_rate": "Contribution rate",
        "y_wedge": "Social wedge",
        "y_ratio": "Employer cost / net wage",
        "y_rgdu": "Monthly relief amount, euros",
        "chart_cost_title": "From gross wage to employer cost",
        "chart_cost_subtitle": (
            "Compare monthly gross wage, net wage and total employer cost across the wage grid."
        ),
        "chart_employer_rate_title": "Effective employer contribution rate",
        "chart_employer_rate_subtitle": (
            "Employer contribution rates are computed from Mon-entreprise outputs as employer "
            "contributions divided by gross wage."
        ),
        "chart_rgdu_title": "Employer contribution relief — RGDU 2026",
        "chart_rgdu_subtitle": (
            "Monthly amount of the 2026 single degressive general reduction computed from "
            "the Mon-entreprise / URSSAF engine."
        ),
        "chart_wedge_title": "Social wedge as a share of employer cost",
        "chart_wedge_subtitle": (
            "The social wedge measures the gap between what the employer pays and what the employee receives."
        ),
        "chart_ratio_title": "Employer cost to net wage ratio",
        "chart_ratio_subtitle": (
            "This ratio summarizes how many euros the employer pays for one euro of net wage."
        ),
        "employer_cost": "Employer cost",
        "net_wage": "Net wage",
        "gross_wage": "Gross wage",
        "employee_contrib": "Employee contrib.",
        "employer_contrib": "Employer contrib.",
        "social_wedge": "Social wedge",
        "employee_rate": "Employee rate",
        "employer_rate": "Employer rate",
        "social_wedge_rate": "Social wedge rate",
        "cost_net_ratio": "Cost / net ratio",
        "rgdu": "RGDU 2026",
        "rgdu_rate": "RGDU / gross wage",
        "rgdu_zone": "RGDU 2026<br>degressive area",
    },
    "fr": {
        "html_lang": "fr",
        "page_title": "French Labour Cost Lab",
        "subtitle": "Outil open source de simulation et de visualisation du coût du travail en France.",
        "language_button": "English",
        "engine_badge": "Moteur de calcul : API Mon-entreprise / URSSAF",
        "purpose_title": "Objectif",
        "purpose_text": (
            "French Labour Cost Lab propose des simulations reproductibles du salaire brut, "
            "du salaire net, du coût employeur, des allègements de charges et du coin socio-fiscal en France."
        ),
        "method_note": (
            "<strong>Note méthodologique.</strong> Cette version utilise le moteur de calcul "
            "Mon-entreprise / URSSAF via son API publique. Les résultats sont calculés sur une grille "
            "générique de salaires et doivent être interprétés comme un cas de référence, non comme "
            "un simulateur officiel de fiche de paie. Certains paramètres institutionnels peuvent dépendre "
            "de la taille de l’entreprise, du secteur, de la convention collective, de la localisation, "
            "du statut cadre et de régimes spécifiques de cotisations. L’allègement représenté ici est "
            "désigné dans le tableau de bord comme RGDU 2026."
        ),
        "metric_net_smic": "Salaire net à 1 SMIC",
        "metric_cost_smic": "Coût employeur à 1 SMIC",
        "metric_rgdu_smic": "RGDU 2026 à 1 SMIC",
        "metric_ratio_2_smic": "Ratio coût/net à 2 SMIC",
        "table_title": "Points de salaire sélectionnés",
        "figures_title": "Graphiques interactifs",
        "interpretation_title": "Interprétation",
        "interpretation_text": (
            "L’objet central du projet n’est pas seulement la distinction juridique entre cotisations "
            "employeur et cotisations salarié, mais l’écart complet entre ce que l’employeur paie et "
            "ce que le salarié reçoit en salaire net. Le graphique RGDU 2026 isole la composante "
            "d’allègement de charges, qui joue un rôle central dans la non-linéarité du coût du travail en France."
        ),
        "footer": "Dernière mise à jour",
        "x_axis": "Salaire brut, multiple du SMIC",
        "y_monthly_amount": "Montant mensuel, euros",
        "y_rate": "Taux de cotisation",
        "y_wedge": "Coin social",
        "y_ratio": "Coût employeur / salaire net",
        "y_rgdu": "Montant mensuel d’allègement, euros",
        "chart_cost_title": "Du salaire brut au coût employeur",
        "chart_cost_subtitle": (
            "Comparaison du salaire brut, du salaire net et du coût total employeur le long de la grille salariale."
        ),
        "chart_employer_rate_title": "Taux effectif de cotisations employeur",
        "chart_employer_rate_subtitle": (
            "Le taux de cotisations employeur est calculé à partir des sorties Mon-entreprise, "
            "en rapportant les cotisations employeur au salaire brut."
        ),
        "chart_rgdu_title": "Allègements de charges — RGDU 2026",
        "chart_rgdu_subtitle": (
            "Montant mensuel de réduction générale dégressive unique calculé à partir du moteur "
            "Mon-entreprise / URSSAF."
        ),
        "chart_wedge_title": "Coin social en part du coût employeur",
        "chart_wedge_subtitle": (
            "Le coin social mesure l’écart entre ce que l’employeur paie et ce que le salarié reçoit."
        ),
        "chart_ratio_title": "Ratio coût employeur / salaire net",
        "chart_ratio_subtitle": (
            "Ce ratio indique combien l’employeur paie pour un euro de salaire net."
        ),
        "employer_cost": "Coût employeur",
        "net_wage": "Salaire net",
        "gross_wage": "Salaire brut",
        "employee_contrib": "Cotisations salarié",
        "employer_contrib": "Cotisations employeur",
        "social_wedge": "Coin social",
        "employee_rate": "Taux salarié",
        "employer_rate": "Taux employeur",
        "social_wedge_rate": "Taux de coin social",
        "cost_net_ratio": "Ratio coût / net",
        "rgdu": "RGDU 2026",
        "rgdu_rate": "RGDU / salaire brut",
        "rgdu_zone": "RGDU 2026<br>zone dégressive",
    },
}


def euro(value):
    return f"{value:,.0f} €".replace(",", " ")


def pct(value):
    return f"{value:.1f}%"


def base_layout(lang: str, title: str, yaxis_title: str):
    t = TEXT[lang]

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
            title=t["x_axis"],
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


def add_rgdu_zone(fig, lang: str):
    t = TEXT[lang]

    fig.add_vrect(
        x0=1.0,
        x1=3.0,
        fillcolor=COLOR_LIGHT_BLUE,
        line_width=0,
        layer="below",
        annotation_text=t["rgdu_zone"],
        annotation_position="top left",
        annotation_font_size=12,
        annotation_font_color=COLOR_BLUE
    )

    fig.add_vline(x=1.0, line_dash="dash", line_color=COLOR_BLUE, opacity=0.7)
    fig.add_vline(x=3.0, line_dash="dash", line_color=COLOR_BLUE, opacity=0.7)


def make_cost_chart(df, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["employer_cost_monthly_eur"],
            mode="lines",
            name=t["employer_cost"],
            line=dict(color=COLOR_BLUE, width=3),
            customdata=df[["gross_monthly_eur", "net_monthly_eur"]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
                + f"{t['net_wage']}: " + "%{customdata[1]:,.0f} €<br>"
                + f"{t['employer_cost']}: " + "%{y:,.0f} €"
                "<extra></extra>"
            )
        )
    )

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["net_monthly_eur"],
            mode="lines",
            name=t["net_wage"],
            line=dict(color=COLOR_ORANGE, width=3),
            customdata=df[["gross_monthly_eur", "employer_cost_monthly_eur"]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
                + f"{t['net_wage']}: " + "%{y:,.0f} €<br>"
                + f"{t['employer_cost']}: " + "%{customdata[1]:,.0f} €"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(**base_layout(lang, t["chart_cost_title"], t["y_monthly_amount"]))
    fig.update_yaxes(ticksuffix=" €")
    add_rgdu_zone(fig, lang)

    return fig


def make_employer_rate_chart(df, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["employer_contribution_rate"] * 100,
            mode="lines",
            name=t["employer_rate"],
            line=dict(color=COLOR_BLUE, width=3),
            customdata=df[["employer_contributions_monthly_eur", "gross_monthly_eur"]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                + f"{t['gross_wage']}: " + "%{customdata[1]:,.0f} €<br>"
                + f"{t['employer_contrib']}: " + "%{customdata[0]:,.0f} €<br>"
                + f"{t['employer_rate']}: " + "%{y:.1f}%"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(**base_layout(lang, t["chart_employer_rate_title"], t["y_rate"]))
    fig.update_yaxes(ticksuffix="%")
    add_rgdu_zone(fig, lang)

    return fig


def make_rgdu_chart(df, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    if "rgdu_monthly_eur" not in df.columns:
        df["rgdu_monthly_eur"] = 0.0

    if "rgdu_rate_gross" not in df.columns:
        df["rgdu_rate_gross"] = 0.0

    # La RGDU est représentée uniquement à partir de 1 SMIC.
    df_rgdu = df[df["smic_multiple"] >= 1.0].copy()

    # Par convention graphique, on force l'extinction à zéro à partir de 3 SMIC.
    df_rgdu.loc[df_rgdu["smic_multiple"] >= 3.0, "rgdu_monthly_eur"] = 0.0
    df_rgdu.loc[df_rgdu["smic_multiple"] >= 3.0, "rgdu_rate_gross"] = 0.0

    df_rgdu["rgdu_annual_eur"] = df_rgdu["rgdu_monthly_eur"] * 12
    df_rgdu["rgdu_rate_percent"] = df_rgdu["rgdu_rate_gross"] * 100

    if lang == "fr":
        monthly_label = "Montant mensuel"
        annual_label = "Montant annuel"
        percent_label = "RGDU / salaire brut"
        y_monthly_title = "Montant mensuel d’allègement, euros"
        y_annual_title = "Montant annuel d’allègement, euros"
        y2_title = "RGDU / salaire brut"
        button_monthly = "Mensuel"
        button_annual = "Annuel"
    else:
        monthly_label = "Monthly amount"
        annual_label = "Annual amount"
        percent_label = "RGDU / gross wage"
        y_monthly_title = "Monthly relief amount, euros"
        y_annual_title = "Annual relief amount, euros"
        y2_title = "RGDU / gross wage"
        button_monthly = "Monthly"
        button_annual = "Annual"

    # Trace 1 : montant mensuel
    fig.add_trace(
        go.Scatter(
            x=df_rgdu["smic_multiple"],
            y=df_rgdu["rgdu_monthly_eur"],
            mode="lines",
            name=monthly_label,
            line=dict(color=COLOR_PURPLE, width=3),
            fill="tozeroy",
            fillcolor="rgba(124, 58, 237, 0.12)",
            yaxis="y",
            customdata=df_rgdu[[
                "gross_monthly_eur",
                "employer_cost_monthly_eur",
                "rgdu_rate_percent"
            ]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
                + f"{t['employer_cost']}: " + "%{customdata[1]:,.0f} €<br>"
                + f"{monthly_label}: " + "%{y:,.0f} €<br>"
                + f"{percent_label}: " + "%{customdata[2]:.1f}%"
                "<extra></extra>"
            )
        )
    )

    # Trace 2 : montant annuel, caché par défaut
    fig.add_trace(
        go.Scatter(
            x=df_rgdu["smic_multiple"],
            y=df_rgdu["rgdu_annual_eur"],
            mode="lines",
            name=annual_label,
            line=dict(color=COLOR_PURPLE, width=3),
            fill="tozeroy",
            fillcolor="rgba(124, 58, 237, 0.12)",
            yaxis="y",
            visible=False,
            customdata=df_rgdu[[
                "gross_monthly_eur",
                "employer_cost_monthly_eur",
                "rgdu_rate_percent"
            ]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
                + f"{t['employer_cost']}: " + "%{customdata[1]:,.0f} €<br>"
                + f"{annual_label}: " + "%{y:,.0f} €<br>"
                + f"{percent_label}: " + "%{customdata[2]:.1f}%"
                "<extra></extra>"
            )
        )
    )

    # Trace 3 : taux RGDU / brut sur axe droit
    fig.add_trace(
        go.Scatter(
            x=df_rgdu["smic_multiple"],
            y=df_rgdu["rgdu_rate_percent"],
            mode="lines",
            name=percent_label,
            line=dict(color=COLOR_RED, width=2.5, dash="dot"),
            yaxis="y2",
            customdata=df_rgdu[[
                "gross_monthly_eur",
                "rgdu_monthly_eur",
                "rgdu_annual_eur"
            ]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
                + f"{monthly_label}: " + "%{customdata[1]:,.0f} €<br>"
                + f"{annual_label}: " + "%{customdata[2]:,.0f} €<br>"
                + f"{percent_label}: " + "%{y:.1f}%"
                "<extra></extra>"
            )
        )
    )

    # Base graphique, mais sans titre interne pour éviter les chevauchements.
    fig.update_layout(
        template="plotly_white",
        height=500,
        margin=dict(l=72, r=78, t=90, b=95),
        font=dict(family="Arial", size=13, color=COLOR_NAVY),
        hovermode="x unified",
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="top",
            y=-0.22,
            xanchor="center",
            x=0.5,
            font=dict(size=12)
        ),
        xaxis=dict(
            title=t["x_axis"],
            showgrid=False,
            zeroline=False,
            range=[0.95, 3.5]
        ),
        yaxis=dict(
            title=y_monthly_title,
            ticksuffix=" €",
            showgrid=True,
            gridcolor="#e5e7eb",
            zeroline=False
        ),
        yaxis2=dict(
            title=y2_title,
            overlaying="y",
            side="right",
            ticksuffix="%",
            showgrid=False,
            zeroline=False
        ),
        updatemenus=[
            dict(
                type="buttons",
                direction="right",
                x=0.0,
                y=1.16,
                xanchor="left",
                yanchor="top",
                buttons=[
                    dict(
                        label=button_monthly,
                        method="update",
                        args=[
                            {"visible": [True, False, True]},
                            {
                                "yaxis.title.text": y_monthly_title,
                                "yaxis.ticksuffix": " €"
                            }
                        ]
                    ),
                    dict(
                        label=button_annual,
                        method="update",
                        args=[
                            {"visible": [False, True, True]},
                            {
                                "yaxis.title.text": y_annual_title,
                                "yaxis.ticksuffix": " €"
                            }
                        ]
                    )
                ],
                showactive=True,
                bgcolor="white",
                bordercolor="#e5e7eb",
                borderwidth=1,
                font=dict(color=COLOR_NAVY, size=12)
            )
        ]
    )

    add_rgdu_zone(fig, lang)

    return fig


def make_social_wedge_chart(df, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["social_wedge_rate"] * 100,
            mode="lines",
            name=t["social_wedge"],
            line=dict(color=COLOR_TEAL, width=3),
            fill="tozeroy",
            fillcolor="rgba(8, 145, 178, 0.12)",
            customdata=df[["social_wedge_monthly_eur", "employer_cost_monthly_eur"]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                + f"{t['employer_cost']}: " + "%{customdata[1]:,.0f} €<br>"
                + f"{t['social_wedge']}: " + "%{customdata[0]:,.0f} €<br>"
                + f"{t['social_wedge_rate']}: " + "%{y:.1f}%"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(**base_layout(lang, t["chart_wedge_title"], t["y_wedge"]))
    fig.update_yaxes(ticksuffix="%")
    add_rgdu_zone(fig, lang)

    return fig


def make_cost_to_net_chart(df, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    fig.add_trace(
        go.Scatter(
            x=df["smic_multiple"],
            y=df["cost_to_net_ratio"],
            mode="lines",
            name=t["cost_net_ratio"],
            line=dict(color=COLOR_RED, width=3),
            customdata=df[["employer_cost_monthly_eur", "net_monthly_eur"]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                + f"{t['employer_cost']}: " + "%{customdata[0]:,.0f} €<br>"
                + f"{t['net_wage']}: " + "%{customdata[1]:,.0f} €<br>"
                + f"{t['cost_net_ratio']}: " + "%{y:.2f}"
                "<extra></extra>"
            )
        )
    )

    fig.update_layout(**base_layout(lang, t["chart_ratio_title"], t["y_ratio"]))
    add_rgdu_zone(fig, lang)

    return fig


def fig_to_html(fig):
    return pio.to_html(
        fig,
        include_plotlyjs=False,
        full_html=False,
        config={
            "displaylogo": False,
            "responsive": True,
            "modeBarButtonsToRemove": ["select2d", "lasso2d", "autoScale2d"]
        }
    )


def build_table(df, lang: str):
    t = TEXT[lang]

    selected_points = [1.0, 1.2, 1.6, 2.0, 2.5, 3.0]
    sample_rows = df[df["smic_multiple"].isin(selected_points)].copy()

    sample_rows = sample_rows[[
        "smic_multiple",
        "gross_monthly_eur",
        "net_monthly_eur",
        "employer_cost_monthly_eur",
        "employee_contributions_monthly_eur",
        "employer_contributions_monthly_eur",
        "rgdu_monthly_eur",
        "social_wedge_monthly_eur",
        "employee_contribution_rate",
        "employer_contribution_rate",
        "rgdu_rate_gross",
        "social_wedge_rate",
        "cost_to_net_ratio"
    ]]

    sample_rows = sample_rows.rename(columns={
        "smic_multiple": "SMIC",
        "gross_monthly_eur": f"{t['gross_wage']} (€)",
        "net_monthly_eur": f"{t['net_wage']} (€)",
        "employer_cost_monthly_eur": f"{t['employer_cost']} (€)",
        "employee_contributions_monthly_eur": f"{t['employee_contrib']} (€)",
        "employer_contributions_monthly_eur": f"{t['employer_contrib']} (€)",
        "rgdu_monthly_eur": f"{t['rgdu']} (€)",
        "social_wedge_monthly_eur": f"{t['social_wedge']} (€)",
        "employee_contribution_rate": t["employee_rate"],
        "employer_contribution_rate": t["employer_rate"],
        "rgdu_rate_gross": t["rgdu_rate"],
        "social_wedge_rate": t["social_wedge_rate"],
        "cost_to_net_ratio": t["cost_net_ratio"]
    })

    money_columns = [
        f"{t['gross_wage']} (€)",
        f"{t['net_wage']} (€)",
        f"{t['employer_cost']} (€)",
        f"{t['employee_contrib']} (€)",
        f"{t['employer_contrib']} (€)",
        f"{t['rgdu']} (€)",
        f"{t['social_wedge']} (€)"
    ]

    rate_columns = [
        t["employee_rate"],
        t["employer_rate"],
        t["rgdu_rate"],
        t["social_wedge_rate"]
    ]

    for col in money_columns:
        sample_rows[col] = sample_rows[col].map(lambda x: euro(float(x)))

    for col in rate_columns:
        sample_rows[col] = sample_rows[col].map(lambda x: pct(float(x) * 100))

    sample_rows[t["cost_net_ratio"]] = sample_rows[t["cost_net_ratio"]].map(lambda x: f"{float(x):.2f}")

    return sample_rows.to_html(
        index=False,
        classes="data-table",
        border=0,
        escape=False
    )


def build_key_metrics(df):
    point_1 = df.loc[(df["smic_multiple"] - 1.0).abs().idxmin()]
    point_2 = df.loc[(df["smic_multiple"] - 2.0).abs().idxmin()]

    return {
        "smic_net": euro(point_1["net_monthly_eur"]),
        "smic_cost": euro(point_1["employer_cost_monthly_eur"]),
        "smic_rgdu": euro(point_1["rgdu_monthly_eur"]),
        "smic_2_cost_net_ratio": f"{point_2['cost_to_net_ratio']:.2f}"
    }


def build_language_section(df, lang: str, updated_at: str):
    t = TEXT[lang]

    table_html = build_table(df, lang)
    metrics = build_key_metrics(df)

    cost_chart = fig_to_html(make_cost_chart(df, lang))
    employer_rate_chart = fig_to_html(make_employer_rate_chart(df, lang))
    rgdu_chart = fig_to_html(make_rgdu_chart(df, lang))
    social_wedge_chart = fig_to_html(make_social_wedge_chart(df, lang))
    cost_to_net_chart = fig_to_html(make_cost_to_net_chart(df, lang))

    return f"""
    <div class="language-section" id="section-{lang}">
        <header>
            <div>
                <h1>{t["page_title"]}</h1>
                <p>{t["subtitle"]}</p>
            </div>
            <button class="language-toggle" onclick="switchLanguage()">{t["language_button"]}</button>
        </header>

        <main>
            <section>
                <div class="badge">{t["engine_badge"]}</div>
                <h2>{t["purpose_title"]}</h2>
                <p>{t["purpose_text"]}</p>
                <div class="method-box">
                    {t["method_note"]}
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">{t["metric_net_smic"]}</div>
                        <div class="metric-value">{metrics["smic_net"]}</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-label">{t["metric_cost_smic"]}</div>
                        <div class="metric-value">{metrics["smic_cost"]}</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-label">{t["metric_rgdu_smic"]}</div>
                        <div class="metric-value">{metrics["smic_rgdu"]}</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-label">{t["metric_ratio_2_smic"]}</div>
                        <div class="metric-value">{metrics["smic_2_cost_net_ratio"]}</div>
                    </div>
                </div>
            </section>

            <section>
                <h2>{t["table_title"]}</h2>
                <div class="table-wrapper">
                    {table_html}
                </div>
            </section>

            <section>
                <h2>{t["figures_title"]}</h2>

                <div class="charts-grid">
                    <div class="chart-card">
                        <h3>{t["chart_cost_title"]}</h3>
                        <p class="chart-subtitle">{t["chart_cost_subtitle"]}</p>
                        <div class="plotly-chart">{cost_chart}</div>
                    </div>

                    <div class="chart-card">
                        <h3>{t["chart_employer_rate_title"]}</h3>
                        <p class="chart-subtitle">{t["chart_employer_rate_subtitle"]}</p>
                        <div class="plotly-chart">{employer_rate_chart}</div>
                    </div>

                    <div class="chart-card">
                        <h3>{t["chart_rgdu_title"]}</h3>
                        <p class="chart-subtitle">{t["chart_rgdu_subtitle"]}</p>
                        <div class="plotly-chart">{rgdu_chart}</div>
                    </div>

                    <div class="chart-card">
                        <h3>{t["chart_wedge_title"]}</h3>
                        <p class="chart-subtitle">{t["chart_wedge_subtitle"]}</p>
                        <div class="plotly-chart">{social_wedge_chart}</div>
                    </div>

                    <div class="chart-card chart-card-wide">
                        <h3>{t["chart_ratio_title"]}</h3>
                        <p class="chart-subtitle">{t["chart_ratio_subtitle"]}</p>
                        <div class="plotly-chart">{cost_to_net_chart}</div>
                    </div>
                </div>
            </section>

            <section>
                <h2>{t["interpretation_title"]}</h2>
                <p class="interpretation">{t["interpretation_text"]}</p>
            </section>
        </main>

        <footer>
            {t["footer"]}: {updated_at}
        </footer>
    </div>
    """


def main():
    df = pd.read_csv(DATA_PATH)

    if "status" in df.columns:
        df = df[df["status"] == "ok"].copy()

    df = df.sort_values("smic_multiple").reset_index(drop=True)

    for column in ["rgdu_monthly_eur", "rgdu_rate_gross", "rgdu_rate_employer_cost"]:
        if column not in df.columns:
            df[column] = 0.0

    df[["rgdu_monthly_eur", "rgdu_rate_gross", "rgdu_rate_employer_cost"]] = (
        df[["rgdu_monthly_eur", "rgdu_rate_gross", "rgdu_rate_employer_cost"]]
        .fillna(0.0)
    )

    updated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    english_section = build_language_section(df, "en", updated_at)
    french_section = build_language_section(df, "fr", updated_at)

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

        .language-section {{
            display: none;
        }}

        .language-section.active {{
            display: block;
        }}

        header {{
            background: #111827;
            color: white;
            padding: 42px 52px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
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

        .language-toggle {{
            border: 1px solid rgba(255, 255, 255, 0.25);
            background: rgba(255, 255, 255, 0.08);
            color: white;
            border-radius: 999px;
            padding: 10px 16px;
            cursor: pointer;
            font-weight: 700;
        }}

        .language-toggle:hover {{
            background: rgba(255, 255, 255, 0.16);
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

        .badge {{
            display: inline-block;
            background: #dbeafe;
            color: #1d4ed8;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 16px;
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

        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-top: 22px;
        }}

        .metric-card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 16px;
        }}

        .metric-label {{
            color: #64748b;
            font-size: 13px;
            margin-bottom: 8px;
        }}

        .metric-value {{
            color: #0f172a;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.03em;
        }}

        .table-wrapper {{
            width: 100%;
            overflow-x: auto;
            padding-bottom: 6px;
        }}

        .data-table {{
            width: 100%;
            min-width: 1180px;
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

        .chart-card-wide {{
            grid-column: 1 / -1;
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
                flex-direction: column;
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

            .chart-card-wide {{
                grid-column: auto;
            }}

            .metrics-grid {{
                grid-template-columns: 1fr 1fr;
            }}
        }}

        @media (max-width: 620px) {{
            .metrics-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    {english_section}
    {french_section}

    <script>
        function setLanguage(lang) {{
            const enSection = document.getElementById("section-en");
            const frSection = document.getElementById("section-fr");

            enSection.classList.remove("active");
            frSection.classList.remove("active");

            if (lang === "fr") {{
                frSection.classList.add("active");
                document.documentElement.lang = "fr";
            }} else {{
                enSection.classList.add("active");
                document.documentElement.lang = "en";
            }}

            localStorage.setItem("flcl_language", lang);

            setTimeout(function() {{
                window.dispatchEvent(new Event("resize"));
            }}, 100);
        }}

        function switchLanguage() {{
            const current = localStorage.getItem("flcl_language") || "en";
            setLanguage(current === "en" ? "fr" : "en");
        }}

        const savedLanguage = localStorage.getItem("flcl_language") || "en";
        setLanguage(savedLanguage);
    </script>
</body>
</html>
"""

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(html, encoding="utf-8")

    print(f"Dashboard created: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()