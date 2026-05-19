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
COLOR_GREEN = "#16a34a"
COLOR_LIGHT_BLUE = "rgba(37, 99, 235, 0.10)"


TEXT = {
    "en": {
        "page_title": "French Labour Cost Lab",
        "subtitle": "Open-source research tool for simulating and visualizing labour costs in France.",
        "language_button": "Français",
        "engine_badge": "Calculation engine: Mon-entreprise / URSSAF API",
        "profile_label": "Employee profile",
        "purpose_title": "Purpose",
        "purpose_text": (
            "French Labour Cost Lab provides reproducible simulations of gross wages, net wages, "
            "employer costs, employer contribution reliefs and social wedges in France."
        ),
        "method_note": (
            "<strong>Methodological note.</strong> This version uses the Mon-entreprise / URSSAF "
            "calculation engine through its public API. Results are computed over a wage grid and "
            "by employee profile. They should be interpreted as reference simulations, not as official "
            "payslip calculations."
        ),
        "methodology_title": "Methodology",
        "methodology_intro": (
            "The dashboard is built from a reproducible wage grid evaluated through the "
            "Mon-entreprise / URSSAF API. The objective is not to reproduce a full payslip, "
            "but to isolate economically meaningful indicators of labour cost formation."
        ),
        "methodology_points": [
            "<strong>Source.</strong> Calculations are obtained from the public Mon-entreprise / URSSAF API.",
            "<strong>Wage grid.</strong> Gross monthly wages are expressed as multiples of the gross monthly SMIC, from 0.8 to 3.5 SMIC.",
            "<strong>Profiles.</strong> The dashboard compares different employee profiles, including non-executive/executive status and Alsace-Moselle regime.",
	    "<strong>Effective employer contribution rate.</strong> The rate shown in the chart is not the gross statutory employer contribution schedule. It is an apparent rate after employer contribution 	                        	    reliefs, computed as net employer contributions divided by gross wage.",
            "<strong>Indicators.</strong> Employer cost, net wage, employer contributions, employee contributions, RGDU 2026, social wedge and cost-to-net ratios are derived from API outputs.",
            "<strong>Marginal indicators.</strong> The marginal employer-cost rate is computed as the finite difference between two adjacent points of the wage grid: Δ employer cost / Δ gross wage.",
            "<strong>Limitations.</strong> Results can vary with firm size, AT/MP rates, collective agreements, executive status, exemptions and other contribution regimes."
        ],
        "metric_net_smic": "Net wage at 1 SMIC",
        "metric_cost_smic": "Employer cost at 1 SMIC",
        "metric_rgdu_smic": "RGDU 2026 at 1 SMIC",
        "metric_ratio_2_smic": "Cost/net ratio at 2 SMIC",
        "table_title": "Selected salary points",
        "figures_title": "Interactive figures",
	"key_metrics_title": "Key indicators",
	"interpretation_title": "Interpretation",
        "interpretation_text": (
            "The dashboard now compares employee profiles instead of relying on a single generic case. "
            "This makes it possible to distinguish the effects of executive status and the Alsace-Moselle "
            "regime on net wages, employer costs and the structure of contribution wedges."
        ),
        "footer": "Last updated",
        "x_axis": "Gross wage, SMIC multiple",
        "y_monthly_amount": "Monthly amount, euros",
        "y_rate": "Contribution rate",
        "y_wedge": "Social wedge",
        "y_ratio": "Employer cost / net wage",
        "y_marginal": "Marginal rate",
        "chart_cost_title": "From gross wage to employer cost",
        "chart_cost_subtitle": "Compare monthly gross wage, net wage and total employer cost across the wage grid.",
        "chart_employer_rate_title": "Effective employer contribution rate",
        "chart_employer_rate_subtitle": "Employer contribution rates are computed as employer contributions divided by gross wage.",
        "chart_rgdu_title": "Employer contribution relief — RGDU 2026",
        "chart_rgdu_subtitle": "Monthly or annual amount of the 2026 single degressive general reduction. The right axis shows the amount as a share of gross wage.",
        "chart_wedge_title": "Social wedge as a share of employer cost",
        "chart_wedge_subtitle": "The social wedge measures the gap between what the employer pays and what the employee receives.",
        "chart_ratio_title": "Employer cost to net wage ratio",
        "chart_ratio_subtitle": "This ratio summarizes how many euros the employer pays for one euro of net wage.",
        "chart_marginal_title": "Marginal cost of gross wage increases",
        "chart_marginal_subtitle": "This chart shows how employer cost and net wage react locally to an additional euro of gross wage.",
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
        "marginal_cost_rate": "Δ employer cost / Δ gross wage",
        "marginal_net_retention": "Δ net wage / Δ employer cost",
        "monthly": "Monthly",
        "annual": "Annual",
        "monthly_amount": "Monthly amount",
        "annual_amount": "Annual amount",
        "y_monthly_rgdu": "Monthly relief amount, euros",
        "y_annual_rgdu": "Annual relief amount, euros",
        "y2_rgdu": "RGDU / gross wage",
    },
    "fr": {
        "page_title": "French Labour Cost Lab",
        "subtitle": "Outil open source de simulation et de visualisation du coût du travail en France.",
        "language_button": "English",
        "engine_badge": "Moteur de calcul : API Mon-entreprise / URSSAF",
        "profile_label": "Profil salarié",
        "purpose_title": "Objectif",
        "purpose_text": (
            "French Labour Cost Lab propose des simulations reproductibles du salaire brut, du salaire net, "
            "du coût employeur, des allègements de charges et du coin socio-fiscal en France."
        ),
        "method_note": (
            "<strong>Note méthodologique.</strong> Cette version utilise le moteur de calcul "
            "Mon-entreprise / URSSAF via son API publique. Les résultats sont calculés sur une grille "
            "salariale et par profil de salarié. Ils doivent être interprétés comme des simulations de référence, "
            "non comme des calculs officiels de fiche de paie."
        ),
        "methodology_title": "Méthodologie",
        "methodology_intro": (
            "Le tableau de bord est construit à partir d’une grille salariale reproductible évaluée via "
            "l’API Mon-entreprise / URSSAF. L’objectif n’est pas de reproduire une fiche de paie complète, "
            "mais d’isoler des indicateurs économiquement interprétables de formation du coût du travail."
        ),
        "methodology_points": [
            "<strong>Source.</strong> Les calculs sont obtenus à partir de l’API publique Mon-entreprise / URSSAF.",
            "<strong>Grille salariale.</strong> Les salaires bruts mensuels sont exprimés en multiples du SMIC brut mensuel, de 0,8 à 3,5 SMIC.",
            "<strong>Profils.</strong> Le tableau de bord compare plusieurs profils salariés, notamment selon le statut cadre/non-cadre et le régime Alsace-Moselle.",
	    "<strong>Taux effectif de cotisations employeur.</strong> Le taux affiché dans le graphique ne correspond pas au barème légal brut de cotisations patronales. Il s’agit d’un taux apparent après 		    allègements de charges, calculé comme cotisations employeur nettes rapportées au salaire brut.",
            "<strong>Indicateurs.</strong> Coût employeur, salaire net, cotisations employeur, cotisations salarié, RGDU 2026, coin social et ratio coût/net sont dérivés des sorties de l’API.",
            "<strong>Indicateurs marginaux.</strong> Le taux marginal de coût employeur est calculé par différence finie entre deux points adjacents de la grille : Δ coût employeur / Δ salaire brut.",
            "<strong>Limites.</strong> Les résultats peuvent varier selon la taille de l’entreprise, le taux AT/MP, la convention collective, le statut cadre, les exonérations et les régimes spécifiques."
        ],
        "metric_net_smic": "Salaire net à 1 SMIC",
        "metric_cost_smic": "Coût employeur à 1 SMIC",
        "metric_rgdu_smic": "RGDU 2026 à 1 SMIC",
        "metric_ratio_2_smic": "Ratio coût/net à 2 SMIC",
        "table_title": "Points de salaire sélectionnés",
        "figures_title": "Graphiques interactifs",
	"key_metrics_title": "Indicateurs clés",
	"interpretation_title": "Interprétation",
        "interpretation_text": (
            "Le tableau de bord compare désormais plusieurs profils salariés au lieu de s’appuyer sur un seul cas générique. "
            "Cela permet de distinguer les effets du statut cadre et du régime Alsace-Moselle sur le salaire net, "
            "le coût employeur et la structure du coin socio-fiscal."
        ),
        "footer": "Dernière mise à jour",
        "x_axis": "Salaire brut, multiple du SMIC",
        "y_monthly_amount": "Montant mensuel, euros",
        "y_rate": "Taux de cotisation",
        "y_wedge": "Coin social",
        "y_ratio": "Coût employeur / salaire net",
        "y_marginal": "Taux marginal",
        "chart_cost_title": "Du salaire brut au coût employeur",
        "chart_cost_subtitle": "Comparaison du salaire brut, du salaire net et du coût total employeur le long de la grille salariale.",
        "chart_employer_rate_title": "Taux effectif de cotisations employeur",
        "chart_employer_rate_subtitle": "Le taux de cotisations employeur est calculé en rapportant les cotisations employeur au salaire brut.",
        "chart_rgdu_title": "Allègements de charges — RGDU 2026",
        "chart_rgdu_subtitle": "Montant mensuel ou annuel de réduction générale dégressive unique. L’axe de droite indique le montant rapporté au salaire brut.",
        "chart_wedge_title": "Coin social en part du coût employeur",
        "chart_wedge_subtitle": "Le coin social mesure l’écart entre ce que l’employeur paie et ce que le salarié reçoit.",
        "chart_ratio_title": "Ratio coût employeur / salaire net",
        "chart_ratio_subtitle": "Ce ratio indique combien l’employeur paie pour un euro de salaire net.",
        "chart_marginal_title": "Coût marginal des hausses de salaire brut",
        "chart_marginal_subtitle": "Ce graphique montre comment le coût employeur et le salaire net réagissent localement à un euro supplémentaire de salaire brut.",
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
        "marginal_cost_rate": "Δ coût employeur / Δ salaire brut",
        "marginal_net_retention": "Δ salaire net / Δ coût employeur",
        "monthly": "Mensuel",
        "annual": "Annuel",
        "monthly_amount": "Montant mensuel",
        "annual_amount": "Montant annuel",
        "y_monthly_rgdu": "Montant mensuel d’allègement, euros",
        "y_annual_rgdu": "Montant annuel d’allègement, euros",
        "y2_rgdu": "RGDU / salaire brut",
    },
}


def euro(value):
    return f"{value:,.0f} €".replace(",", " ")


def pct(value):
    return f"{value:.1f}%"


def safe_id(value):
    return str(value).replace(" ", "_").replace("-", "_")


def base_layout(lang: str, title: str, yaxis_title: str):
    """
    Layout commun des graphiques.

    Important : le titre Plotly interne est volontairement supprimé,
    car chaque carte HTML possède déjà son propre titre <h3>.
    Cela évite les doublons et les chevauchements.
    """
    t = TEXT[lang]

    return dict(
        template="plotly_white",
        height=420,
        margin=dict(l=64, r=42, t=28, b=70),
        font=dict(family="Arial", size=13, color=COLOR_NAVY),
        hovermode="x unified",
        legend=dict(
            orientation="h",
            yanchor="top",
            y=-0.18,
            xanchor="center",
            x=0.5,
            font=dict(size=12)
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
        annotation_font_color=COLOR_BLUE,
    )
    fig.add_vline(x=1.0, line_dash="dash", line_color=COLOR_BLUE, opacity=0.7)
    fig.add_vline(x=3.0, line_dash="dash", line_color=COLOR_BLUE, opacity=0.7)


def make_cost_chart(df, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    fig.add_trace(go.Scatter(
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
    ))

    fig.add_trace(go.Scatter(
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
    ))

    fig.update_layout(**base_layout(lang, t["chart_cost_title"], t["y_monthly_amount"]))
    fig.update_yaxes(ticksuffix=" €")
    add_rgdu_zone(fig, lang)
    return fig


def make_employer_rate_chart(df, lang: str):
    t = TEXT[lang]
    fig = go.Figure()
    fig.add_trace(go.Scatter(
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
    ))
    fig.update_layout(**base_layout(lang, t["chart_employer_rate_title"], t["y_rate"]))
    fig.update_yaxes(ticksuffix="%")
    add_rgdu_zone(fig, lang)
    return fig


def make_rgdu_chart(df, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    df_rgdu = df[df["smic_multiple"] >= 1.0].copy()
    df_rgdu.loc[df_rgdu["smic_multiple"] >= 3.0, "rgdu_monthly_eur"] = 0.0
    df_rgdu.loc[df_rgdu["smic_multiple"] >= 3.0, "rgdu_rate_gross"] = 0.0
    df_rgdu["rgdu_annual_eur"] = df_rgdu["rgdu_monthly_eur"] * 12
    df_rgdu["rgdu_rate_percent"] = df_rgdu["rgdu_rate_gross"] * 100

    monthly_label = t["monthly_amount"]
    annual_label = t["annual_amount"]
    percent_label = t["rgdu_rate"]

    fig.add_trace(go.Scatter(
        x=df_rgdu["smic_multiple"],
        y=df_rgdu["rgdu_monthly_eur"],
        mode="lines",
        name=monthly_label,
        line=dict(color=COLOR_PURPLE, width=3),
        fill="tozeroy",
        fillcolor="rgba(124, 58, 237, 0.12)",
        yaxis="y",
        customdata=df_rgdu[["gross_monthly_eur", "employer_cost_monthly_eur", "rgdu_rate_percent"]],
        hovertemplate=(
            "<b>%{x:.2f}× SMIC</b><br>"
            + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
            + f"{t['employer_cost']}: " + "%{customdata[1]:,.0f} €<br>"
            + f"{monthly_label}: " + "%{y:,.0f} €<br>"
            + f"{percent_label}: " + "%{customdata[2]:.1f}%"
            "<extra></extra>"
        )
    ))

    fig.add_trace(go.Scatter(
        x=df_rgdu["smic_multiple"],
        y=df_rgdu["rgdu_annual_eur"],
        mode="lines",
        name=annual_label,
        line=dict(color=COLOR_PURPLE, width=3),
        fill="tozeroy",
        fillcolor="rgba(124, 58, 237, 0.12)",
        yaxis="y",
        visible=False,
        customdata=df_rgdu[["gross_monthly_eur", "employer_cost_monthly_eur", "rgdu_rate_percent"]],
        hovertemplate=(
            "<b>%{x:.2f}× SMIC</b><br>"
            + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
            + f"{t['employer_cost']}: " + "%{customdata[1]:,.0f} €<br>"
            + f"{annual_label}: " + "%{y:,.0f} €<br>"
            + f"{percent_label}: " + "%{customdata[2]:.1f}%"
            "<extra></extra>"
        )
    ))

    fig.add_trace(go.Scatter(
        x=df_rgdu["smic_multiple"],
        y=df_rgdu["rgdu_rate_percent"],
        mode="lines",
        name=percent_label,
        line=dict(color=COLOR_RED, width=2.5, dash="dot"),
        yaxis="y2",
        customdata=df_rgdu[["gross_monthly_eur", "rgdu_monthly_eur", "rgdu_annual_eur"]],
        hovertemplate=(
            "<b>%{x:.2f}× SMIC</b><br>"
            + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
            + f"{monthly_label}: " + "%{customdata[1]:,.0f} €<br>"
            + f"{annual_label}: " + "%{customdata[2]:,.0f} €<br>"
            + f"{percent_label}: " + "%{y:.1f}%"
            "<extra></extra>"
        )
    ))

    fig.update_layout(
        template="plotly_white",
        height=500,
        margin=dict(l=72, r=78, t=90, b=95),
        font=dict(family="Arial", size=13, color=COLOR_NAVY),
        hovermode="x unified",
        showlegend=True,
        legend=dict(orientation="h", yanchor="top", y=-0.22, xanchor="center", x=0.5, font=dict(size=12)),
        xaxis=dict(title=t["x_axis"], showgrid=False, zeroline=False, range=[0.95, 3.5]),
        yaxis=dict(title=t["y_monthly_rgdu"], ticksuffix=" €", showgrid=True, gridcolor="#e5e7eb", zeroline=False),
        yaxis2=dict(title=t["y2_rgdu"], overlaying="y", side="right", ticksuffix="%", showgrid=False, zeroline=False),
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
                        label=t["monthly"],
                        method="update",
                        args=[{"visible": [True, False, True]}, {"yaxis.title.text": t["y_monthly_rgdu"]}]
                    ),
                    dict(
                        label=t["annual"],
                        method="update",
                        args=[{"visible": [False, True, True]}, {"yaxis.title.text": t["y_annual_rgdu"]}]
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
    fig.add_trace(go.Scatter(
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
    ))
    fig.update_layout(**base_layout(lang, t["chart_wedge_title"], t["y_wedge"]))
    fig.update_yaxes(ticksuffix="%")
    add_rgdu_zone(fig, lang)
    return fig


def make_cost_to_net_chart(df, lang: str):
    t = TEXT[lang]
    fig = go.Figure()
    fig.add_trace(go.Scatter(
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
    ))
    fig.update_layout(**base_layout(lang, t["chart_ratio_title"], t["y_ratio"]))
    add_rgdu_zone(fig, lang)
    return fig


def compute_marginal_indicators(df):
    df_m = df.sort_values("smic_multiple").copy()
    df_m["delta_gross"] = df_m["gross_monthly_eur"].diff()
    df_m["delta_employer_cost"] = df_m["employer_cost_monthly_eur"].diff()
    df_m["delta_net"] = df_m["net_monthly_eur"].diff()
    df_m["marginal_employer_cost_rate"] = df_m["delta_employer_cost"] / df_m["delta_gross"]
    df_m["marginal_net_retention_rate"] = df_m["delta_net"] / df_m["delta_employer_cost"]
    return df_m.dropna(subset=["marginal_employer_cost_rate", "marginal_net_retention_rate"]).copy()


def make_marginal_chart(df, lang: str):
    t = TEXT[lang]
    df_m = compute_marginal_indicators(df)

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=df_m["smic_multiple"],
        y=df_m["marginal_employer_cost_rate"] * 100,
        mode="lines",
        name=t["marginal_cost_rate"],
        line=dict(color=COLOR_GREEN, width=3),
        customdata=df_m[["gross_monthly_eur", "delta_gross", "delta_employer_cost"]],
        hovertemplate=(
            "<b>%{x:.2f}× SMIC</b><br>"
            + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
            "Δ salaire brut: %{customdata[1]:,.0f} €<br>"
            "Δ coût employeur: %{customdata[2]:,.0f} €<br>"
            + f"{t['marginal_cost_rate']}: " + "%{y:.1f}%"
            "<extra></extra>"
        )
    ))

    fig.add_trace(go.Scatter(
        x=df_m["smic_multiple"],
        y=df_m["marginal_net_retention_rate"] * 100,
        mode="lines",
        name=t["marginal_net_retention"],
        line=dict(color=COLOR_ORANGE, width=3, dash="dot"),
        customdata=df_m[["gross_monthly_eur", "delta_net", "delta_employer_cost"]],
        hovertemplate=(
            "<b>%{x:.2f}× SMIC</b><br>"
            + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
            "Δ salaire net: %{customdata[1]:,.0f} €<br>"
            "Δ coût employeur: %{customdata[2]:,.0f} €<br>"
            + f"{t['marginal_net_retention']}: " + "%{y:.1f}%"
            "<extra></extra>"
        )
    ))

    # Layout spécifique au graphique marginal :
    # - pas de titre interne ;
    # - légende sous le graphique ;
    # - marges augmentées ;
    # - hauteur supérieure pour éviter les chevauchements.
    fig.update_layout(
        template="plotly_white",
        height=500,
        margin=dict(l=72, r=42, t=34, b=105),
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
            zeroline=False
        ),
        yaxis=dict(
            title=t["y_marginal"],
            ticksuffix="%",
            showgrid=True,
            gridcolor="#e5e7eb",
            zeroline=False
        )
    )

    add_rgdu_zone(fig, lang)

    return fig


def fig_to_html(fig):
    return pio.to_html(
        fig,
        include_plotlyjs=False,
        full_html=False,
        config={"displaylogo": False, "responsive": True, "modeBarButtonsToRemove": ["select2d", "lasso2d", "autoScale2d"]}
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

    for col in [
        f"{t['gross_wage']} (€)",
        f"{t['net_wage']} (€)",
        f"{t['employer_cost']} (€)",
        f"{t['employee_contrib']} (€)",
        f"{t['employer_contrib']} (€)",
        f"{t['rgdu']} (€)",
        f"{t['social_wedge']} (€)"
    ]:
        sample_rows[col] = sample_rows[col].map(lambda x: euro(float(x)))

    for col in [t["employee_rate"], t["employer_rate"], t["rgdu_rate"], t["social_wedge_rate"]]:
        sample_rows[col] = sample_rows[col].map(lambda x: pct(float(x) * 100))

    sample_rows[t["cost_net_ratio"]] = sample_rows[t["cost_net_ratio"]].map(lambda x: f"{float(x):.2f}")

    return sample_rows.to_html(index=False, classes="data-table", border=0, escape=False)


def build_key_metrics(df):
    point_1 = df.loc[(df["smic_multiple"] - 1.0).abs().idxmin()]
    point_2 = df.loc[(df["smic_multiple"] - 2.0).abs().idxmin()]

    return {
        "smic_net": euro(point_1["net_monthly_eur"]),
        "smic_cost": euro(point_1["employer_cost_monthly_eur"]),
        "smic_rgdu": euro(point_1["rgdu_monthly_eur"]),
        "smic_2_cost_net_ratio": f"{point_2['cost_to_net_ratio']:.2f}"
    }


def build_methodology_list(lang: str):
    t = TEXT[lang]
    items = "\n".join([f"<li>{item}</li>" for item in t["methodology_points"]])
    return f"""
    <p>{t["methodology_intro"]}</p>
    <ul class="methodology-list">
        {items}
    </ul>
    """


def build_profile_panel(df_profile, profile_id, lang: str):
    t = TEXT[lang]
    metrics = build_key_metrics(df_profile)
    table_html = build_table(df_profile, lang)

    return f"""
    <div class="profile-panel" id="panel-{lang}-{safe_id(profile_id)}">

        <section>
            <h2>{t["figures_title"]}</h2>
            <div class="charts-grid">
                <div class="chart-card">
                    <h3>{t["chart_cost_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_cost_subtitle"]}</p>
                    <div class="plotly-chart">{fig_to_html(make_cost_chart(df_profile, lang))}</div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_employer_rate_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_employer_rate_subtitle"]}</p>
                    <div class="plotly-chart">{fig_to_html(make_employer_rate_chart(df_profile, lang))}</div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_rgdu_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_rgdu_subtitle"]}</p>
                    <div class="plotly-chart">{fig_to_html(make_rgdu_chart(df_profile, lang))}</div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_wedge_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_wedge_subtitle"]}</p>
                    <div class="plotly-chart">{fig_to_html(make_social_wedge_chart(df_profile, lang))}</div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_ratio_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_ratio_subtitle"]}</p>
                    <div class="plotly-chart">{fig_to_html(make_cost_to_net_chart(df_profile, lang))}</div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_marginal_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_marginal_subtitle"]}</p>
                    <div class="plotly-chart">{fig_to_html(make_marginal_chart(df_profile, lang))}</div>
                </div>
            </div>
        </section>

        <section>
            <h2>{t["key_metrics_title"]}</h2>
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
            <div class="table-wrapper">{table_html}</div>
        </section>
    </div>
    """


def build_language_section(df, lang: str, updated_at: str):
    t = TEXT[lang]
    methodology_html = build_methodology_list(lang)

    profiles = (
        df[["profile_id", f"profile_label_{lang}"]]
        .drop_duplicates()
        .sort_values("profile_id")
        .to_dict("records")
    )

    default_profile = profiles[0]["profile_id"]

    options = "\n".join([
        f'<option value="{row["profile_id"]}">{row[f"profile_label_{lang}"]}</option>'
        for row in profiles
    ])

    panels = []
    for row in profiles:
        profile_id = row["profile_id"]
        df_profile = df[df["profile_id"] == profile_id].copy()
        panels.append(build_profile_panel(df_profile, profile_id, lang))

    panels_html = "\n".join(panels)

    return f"""
    <div class="language-section" id="section-{lang}" data-default-profile="{default_profile}">
	<header>
    		<div>
        		<h1>{t["page_title"]}</h1>
        		<p>{t["subtitle"]}</p>
        		<p class="author-line">Par Hugo Spring-Ragain, Économiste, CEDS Paris</p>
    		</div>

    		<div class="header-actions">
    			<button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme" aria-label="Toggle theme">🌙</button>
    			<button class="language-toggle" onclick="switchLanguage()">{t["language_button"]}</button>
		</div>
	</header>

        <main>
            <section>
                <div class="badge">{t["engine_badge"]}</div>
                <h2>{t["purpose_title"]}</h2>
                <p>{t["purpose_text"]}</p>
                <div class="method-box">{t["method_note"]}</div>

                <div class="profile-selector">
                    <label for="profile-select-{lang}">{t["profile_label"]}</label>
                    <select id="profile-select-{lang}" onchange="switchProfile('{lang}')">
                        {options}
                    </select>
                </div>
            </section>

            <div id="profile-panels-{lang}">
                {panels_html}
            </div>

            <section>
                <h2>{t["interpretation_title"]}</h2>
                <p class="interpretation">{t["interpretation_text"]}</p>
            </section>

            <section>
                <h2>{t["methodology_title"]}</h2>
                {methodology_html}
            </section>
        </main>

        <footer>{t["footer"]}: {updated_at}</footer>
    </div>
    """


def main():
    df = pd.read_csv(DATA_PATH)

    if "status" in df.columns:
        df = df[df["status"] == "ok"].copy()

    df = df.sort_values(["profile_id", "smic_multiple"]).reset_index(drop=True)

    for column in ["rgdu_monthly_eur", "rgdu_rate_gross", "rgdu_rate_employer_cost"]:
        if column not in df.columns:
            df[column] = 0.0

    df[["rgdu_monthly_eur", "rgdu_rate_gross", "rgdu_rate_employer_cost"]] = (
        df[["rgdu_monthly_eur", "rgdu_rate_gross", "rgdu_rate_employer_cost"]].fillna(0.0)
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
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    {english_section}
    {french_section}

    <script>
        function safeId(value) {{
            return String(value).replaceAll(" ", "_").replaceAll("-", "_");
        }}

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

            const selectedProfile = localStorage.getItem("flcl_profile_" + lang)
                || document.getElementById("section-" + lang).dataset.defaultProfile;

            const select = document.getElementById("profile-select-" + lang);
            if (select) {{
                select.value = selectedProfile;
            }}

            showProfile(lang, selectedProfile);
        }}

        function switchLanguage() {{
            const current = localStorage.getItem("flcl_language") || "en";
            setLanguage(current === "en" ? "fr" : "en");
        }}

        function switchProfile(lang) {{
            const select = document.getElementById("profile-select-" + lang);
            const profileId = select.value;
            localStorage.setItem("flcl_profile_" + lang, profileId);
            showProfile(lang, profileId);
        }}

        function showProfile(lang, profileId) {{
            const panels = document.querySelectorAll("#profile-panels-" + lang + " .profile-panel");
            panels.forEach(panel => panel.classList.remove("active"));

            const target = document.getElementById("panel-" + lang + "-" + safeId(profileId));
            if (target) {{
                target.classList.add("active");
            }}

            setTimeout(function() {{
                window.dispatchEvent(new Event("resize"));
            }}, 150);
        }}

        function updatePlotlyTheme(theme) {{
            const isDark = theme === "dark";

            const axisColor = isDark ? "#e5e7eb" : "#111827";
            const gridColor = isDark ? "#374151" : "#d1d5db";
            const paperColor = isDark ? "#111827" : "#ffffff";
            const plotColor = isDark ? "#111827" : "#ffffff";

            const layoutUpdate = {{
                "paper_bgcolor": paperColor,
                "plot_bgcolor": plotColor,
                "font.color": axisColor,

                "legend.bgcolor": "rgba(0,0,0,0)",
                "legend.font.color": axisColor,

                "xaxis.color": axisColor,
                "xaxis.gridcolor": gridColor,
                "xaxis.zerolinecolor": gridColor,
                "xaxis.linecolor": axisColor,
                "xaxis.tickfont.color": axisColor,
                "xaxis.title.font.color": axisColor,

                "yaxis.color": axisColor,
                "yaxis.gridcolor": gridColor,
                "yaxis.zerolinecolor": gridColor,
                "yaxis.linecolor": axisColor,
                "yaxis.tickfont.color": axisColor,
                "yaxis.title.font.color": axisColor,

                "yaxis2.color": axisColor,
                "yaxis2.gridcolor": gridColor,
                "yaxis2.zerolinecolor": gridColor,
                "yaxis2.linecolor": axisColor,
                "yaxis2.tickfont.color": axisColor,
                "yaxis2.title.font.color": axisColor,

                /*
                Important : on réaffirme ces paramètres pour ne pas casser
                l'axe droit du graphique RGDU.
                */
                "yaxis2.overlaying": "y",
                "yaxis2.side": "right",
                "yaxis2.showgrid": false
            }};

            const plots = document.querySelectorAll(".js-plotly-plot");

            plots.forEach(function(plot) {{
                Plotly.relayout(plot, layoutUpdate);
            }});
        }}

        function applyTheme(theme) {{
            if (theme === "dark") {{
                document.body.classList.add("dark-mode");
            }} else {{
                document.body.classList.remove("dark-mode");
            }}

            localStorage.setItem("flcl_theme", theme);
            updateThemeButtons(theme);
            updatePlotlyTheme(theme);

            setTimeout(function() {{
                window.dispatchEvent(new Event("resize"));
            }}, 150);
        }}

        function toggleTheme() {{
            const current = localStorage.getItem("flcl_theme") || "light";
            applyTheme(current === "light" ? "dark" : "light");
        }}

        function updateThemeButtons(theme) {{
            const buttons = document.querySelectorAll(".theme-toggle");

            buttons.forEach(function(button) {{
                if (theme === "dark") {{
                    button.textContent = "☀️";
                    button.title = "Light mode";
                    button.setAttribute("aria-label", "Light mode");
                }} else {{
                    button.textContent = "🌙";
                    button.title = "Dark mode";
                    button.setAttribute("aria-label", "Dark mode");
                }}
            }});
        }}

        const savedTheme = localStorage.getItem("flcl_theme") || "light";
        applyTheme(savedTheme);

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

