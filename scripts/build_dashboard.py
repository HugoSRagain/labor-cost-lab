from pathlib import Path
from datetime import datetime

import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "labour_cost_grid_mon_entreprise.csv"
DOCS_DIR = BASE_DIR / "docs"
OUTPUT_PATH = DOCS_DIR / "index.html"
DOCS_DATA_DIR = DOCS_DIR / "data"
DOCS_DATA_PATH = DOCS_DATA_DIR / "labour_cost_grid_mon_entreprise.csv"


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
	"tab_simulation": "Simulation",
	"tab_comparisons": "Comparisons",
	"tab_data": "Data",
	"tab_methodology": "Methodology",
	"profile_data_title": "Data for selected profile",
	"comparisons_title": "Comparisons",
	"comparisons_intro": "Comparative charts will be added here to compare AT/MP scenarios, employee status and territorial regimes.",
	"data_title": "Data",
	"data_intro": "The full simulation dataset can be downloaded as a CSV file. It contains all wage points and all combinations of employee status, territorial regime and AT/MP scenarios.",
	"status_label": "Employee status",
	"comparison_status_title": "Employer cost by employee status",
	"comparison_status_subtitle": (
    		"For the selected territorial regime and AT/MP scenario, this chart compares "
    		"total employer cost between non-executive and executive employees."
	),
	"comparison_status_gap_title": "Employer cost gap: executive minus non-executive",
	"comparison_status_gap_subtitle": (
    		"This chart shows the monthly employer-cost difference between executive and "
    		"non-executive employees."
	),
	"executive_gap": "Executive cost gap",
	"comparison_atmp_title": "Employer cost by AT/MP scenario",
	"comparison_atmp_subtitle": (
   		"For the selected employee status and territorial regime, this chart compares "
    		"the total employer cost across AT/MP risk scenarios."
	),
	"territory_label": "Territorial regime",
	"download_csv": "Download simulation dataset (CSV)",
	"atmp_label": "AT/MP risk scenario",
	"comparison_atmp_title": "Employer cost by AT/MP scenario",
	"comparison_atmp_subtitle": (
    		"For the selected employee status and territorial regime, this chart compares "
    		"total employer cost across AT/MP risk scenarios."
	),
	"comparison_atmp_gap_title": "Employer cost gap relative to standard AT/MP",
	"comparison_atmp_gap_subtitle": (
   		 "This chart shows the monthly employer-cost difference relative to the standard "
    		"AT/MP scenario."
	),
"employer_cost_gap": "Employer cost gap",
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
    		"<strong>Wage grid.</strong> Gross monthly wages are expressed as multiples of the gross monthly SMIC, from 0.8 to 3.5 SMIC, with a 0.01 SMIC step.",
    		"<strong>Combinatorial simulation.</strong> Users can combine three dimensions: employee status, territorial regime and AT/MP risk scenario.",
    		"<strong>Employee status.</strong> The status dimension distinguishes non-executive and executive employees.",
    		"<strong>Territorial regime.</strong> The territorial dimension distinguishes the general regime from the Alsace-Moselle regime.",
    		"<strong>AT/MP scenarios.</strong> The AT/MP dimension should be interpreted as a risk-rate scenario, not as a precise occupation or sector. Explicit rates, such as 1% or 4%, are directly passed to the Mon-entreprise engine. The support-functions scenario relies on a rule flagged as experimental by the API.",
    		"<strong>Indicators.</strong> Employer cost, net wage, employer contributions, employee contributions, RGDU 2026, social wedge and cost-to-net ratios are derived from API outputs.",
    		"<strong>Effective employer contribution rate.</strong> The rate shown in the chart is not the gross statutory employer contribution schedule. It is an apparent rate after employer contribution reliefs, computed as net employer contributions divided by gross wage.",
    		"<strong>Marginal indicators.</strong> The marginal employer-cost rate is computed as the finite difference between two adjacent points of the wage grid: Δ employer cost / Δ gross wage.",
    		"<strong>Limitations.</strong> Results are reference simulations, not official payslip calculations. They may vary depending on firm size, collective agreements, precise AT/MP classification, exemptions and specific contribution regimes."
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
	"chart_total_levy_title": "Total contribution rate on labour",
        "chart_total_levy_subtitle": "Employee and employer contributions expressed as a share of total employer cost.",
        "chart_net_gross_return_title": "Socio-fiscal return of a gross wage increase",
	"chart_net_gross_return_subtitle": (
    		"Share of one additional euro of gross wage converted into disposable income after "
    		"employee contributions, estimated personal income tax and estimated in-work benefit. "
    		"Reference scenario: single taxpayer, 1 tax unit, no other income, no housing benefit."
	),
        "employer_cost": "Employer cost",
        "net_wage": "Net wage",
        "gross_wage": "Gross wage",
        "employee_contrib": "Employee contrib.",
        "employer_contrib": "Employer contrib.",
        "social_wedge": "Social wedge",
        "employee_rate": "Employee rate",
        "employer_rate": "Employer rate",
	"decomp_employer_contrib_before_relief": "Employer contributions before reliefs",
	"decomp_contribution_relief": "Contribution reliefs",
	"decomp_effective_cost": "Effective employer cost",
        "social_wedge_rate": "Social wedge rate",
        "cost_net_ratio": "Cost / net ratio",
	"tab_working_paper": "Working Paper",
        "working_paper_title": "Working Paper",
        "working_paper_intro": (
            "This working paper documents the French Labour Cost Lab, its methodology, "
            "indicators, internal consistency checks and limitations."
        ),
        "working_paper_download": "Download the working paper (PDF)",
        "rgdu": "RGDU 2026",
        "rgdu_rate": "RGDU / gross wage",
        "rgdu_zone": "RGDU 2026<br>degressive area",
        "marginal_cost_rate": "Δ employer cost / Δ gross wage",
        "marginal_net_retention": "Δ net wage / Δ employer cost",
        "monthly": "Monthly",
        "annual": "Annual",
	"consistency_title": "Internal consistency checks",
	"consistency_intro": (
    		"These checks verify that the main derived indicators satisfy the expected accounting "
    		"identities over the full simulated dataset."
	),
        "monthly_amount": "Monthly amount",
        "annual_amount": "Annual amount",
        "y_monthly_rgdu": "Monthly relief amount, euros",
        "y_annual_rgdu": "Annual relief amount, euros",
        "y2_rgdu": "RGDU / gross wage",
	"decomposition_title": "Employer cost decomposition",
	"decomposition_subtitle": (
    		"This chart decomposes employer cost at a selected wage point. "
    		"Contribution reliefs are shown as a reduction in theoretical employer contributions."
	),
	"decomposition_wage_label": "Selected wage point",
	"decomp_net_wage": "Net wage",
	"decomp_employee_contrib": "Employee contributions",
	"decomp_employer_contrib": "Employer contributions after reliefs",
	"decomp_total_cost": "Total employer cost",
	"decomp_gross_wage": "Gross wage",
    },
    "fr": {
        "page_title": "French Labour Cost Lab",
        "subtitle": "Outil open source de simulation et de visualisation du coût du travail en France.",
        "language_button": "English",
        "engine_badge": "Moteur de calcul : API Mon-entreprise / URSSAF",
        "profile_label": "Profil salarié",
	"tab_simulation": "Simulation",
	"tab_comparisons": "Comparaisons",
	"tab_data": "Données",
	"tab_methodology": "Méthodologie",
	"profile_data_title": "Données du profil sélectionné",
	"comparisons_title": "Comparaisons",
	"comparisons_intro": "Des graphiques comparatifs seront ajoutés ici pour comparer les scénarios AT/MP, le statut salarié et les régimes territoriaux.",
	"data_title": "Données",
	"data_intro": "Le jeu de données complet peut être téléchargé au format CSV. Il contient tous les points de salaire et toutes les combinaisons de statut salarié, régime territorial et scénario AT/MP.",
	"status_label": "Statut salarié",
	"comparison_status_title": "Coût employeur selon le statut salarié",
	"comparison_status_subtitle": (
    		"Pour le régime territorial et le scénario AT/MP sélectionnés, ce graphique compare "
    		"le coût total employeur entre salariés non-cadres et cadres."
	),
	"comparison_status_gap_title": "Écart de coût employeur : cadre moins non-cadre",
	"comparison_status_gap_subtitle": (
    		"Ce graphique montre l’écart mensuel de coût employeur entre salarié cadre et "
    		"salarié non-cadre."
	),
	"executive_gap": "Écart cadre - non-cadre",
	"territory_label": "Régime territorial",
	"comparison_atmp_title": "Coût employeur selon le scénario AT/MP",
	"comparison_atmp_subtitle": (
    		"Pour le statut salarié et le régime territorial sélectionnés, ce graphique compare "
    		"le coût total employeur selon les scénarios de risque AT/MP."
	),
	"comparison_atmp_gap_title": "Écart de coût employeur par rapport au scénario AT/MP standard",
	"comparison_atmp_gap_subtitle": (
    		"Ce graphique montre l’écart mensuel de coût employeur par rapport au scénario "
    		"AT/MP standard."
	),
	"employer_cost_gap": "Écart de coût employeur",
	"comparison_atmp_title": "Coût employeur selon le scénario AT/MP",
	"comparison_atmp_subtitle": (
    		"Pour le statut salarié et le régime territorial sélectionnés, ce graphique compare "
    		"le coût total employeur selon les scénarios de risque AT/MP."
	),
	"download_csv": "Télécharger les données de simulation (CSV)",
	"atmp_label": "Scénario AT/MP",
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
    		"<strong>Grille salariale.</strong> Les salaires bruts mensuels sont exprimés en multiples du SMIC brut mensuel, de 0,8 à 3,5 SMIC, avec un pas de 0,01 SMIC.",
    		"<strong>Simulation combinatoire.</strong> L’utilisateur peut combiner trois dimensions : statut salarié, régime territorial et scénario de risque AT/MP.",
    		"<strong>Statut salarié.</strong> La dimension de statut distingue les salariés non-cadres et cadres.",
    		"<strong>Régime territorial.</strong> La dimension territoriale distingue le régime général du régime Alsace-Moselle.",
    		"<strong>Scénarios AT/MP.</strong> La dimension AT/MP doit être interprétée comme un scénario de taux de risque, et non comme une profession ou un secteur précis. Les taux explicites, par exemple 1 % ou 4 %, sont directement transmis au moteur Mon-		entreprise. Le scénario fonctions support repose sur une règle signalée comme expérimentale par l’API.",
    		"<strong>Indicateurs.</strong> Coût employeur, salaire net, cotisations employeur, cotisations salarié, RGDU 2026, coin social et ratio coût/net sont dérivés des sorties de l’API.",
    		"<strong>Taux effectif de cotisations employeur.</strong> Le taux affiché dans le graphique ne correspond pas au barème légal brut de cotisations patronales. Il s’agit d’un taux apparent après allègements de charges, calculé comme cotisations employeur 		nettes rapportées au salaire brut.",
    		"<strong>Indicateurs marginaux.</strong> Le taux marginal de coût employeur est calculé par différence finie entre deux points adjacents de la grille : Δ coût employeur / Δ salaire brut.",
    		"<strong>Limites.</strong> Les résultats sont des simulations de référence, non des calculs officiels de fiche de paie. Ils peuvent varier selon la taille de l’entreprise, les conventions collectives, la classification AT/MP précise, les exonérations et 		les régimes spécifiques."
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
	"chart_total_levy_title": "Taux de prélèvement total sur le travail",
        "chart_total_levy_subtitle": "Cotisations salarié et employeur rapportées au coût total employeur.",
        "chart_net_gross_return_title": "Rendement socio-fiscal d’une hausse de salaire brut",
	"chart_net_gross_return_subtitle": (
    		"Part d’un euro supplémentaire de salaire brut qui se transforme en revenu disponible "
    		"après cotisations salariées, impôt sur le revenu estimé et prime d’activité estimée. "
    		"Scénario de référence : célibataire, 1 part, sans autre revenu, sans aide au logement."
	),
        "employer_cost": "Coût employeur",
        "net_wage": "Salaire net",
        "gross_wage": "Salaire brut",
        "employee_contrib": "Cotisations salarié",
        "employer_contrib": "Cotisations employeur",
        "social_wedge": "Coin social",
        "employee_rate": "Taux salarié",
        "employer_rate": "Taux employeur",
	"decomp_employer_contrib_before_relief": "Cotisations employeur avant allègements",
	"decomp_contribution_relief": "Allègements de cotisations",
	"decomp_effective_cost": "Coût employeur effectif",
        "social_wedge_rate": "Taux de coin social",
        "cost_net_ratio": "Ratio coût / net",
	"tab_working_paper": "Working Paper",
        "working_paper_title": "Working Paper",
        "working_paper_intro": (
            "Ce working paper documente le French Labour Cost Lab, sa méthodologie, "
            "ses indicateurs, ses contrôles de cohérence interne et ses limites."
        ),
        "working_paper_download": "Télécharger le working paper (PDF)",
        "rgdu": "RGDU 2026",
        "rgdu_rate": "RGDU / salaire brut",
        "rgdu_zone": "RGDU 2026<br>zone dégressive",
        "marginal_cost_rate": "Δ coût employeur / Δ salaire brut",
        "marginal_net_retention": "Δ salaire net / Δ coût employeur",
        "monthly": "Mensuel",
        "annual": "Annuel",
	"consistency_title": "Contrôles de cohérence interne",
	"consistency_intro": (
    		"Ces contrôles vérifient que les principaux indicateurs dérivés respectent les identités "
    		"comptables attendues sur l’ensemble du jeu de données simulé."
	),
        "monthly_amount": "Montant mensuel",
        "annual_amount": "Montant annuel",
        "y_monthly_rgdu": "Montant mensuel d’allègement, euros",
        "y_annual_rgdu": "Montant annuel d’allègement, euros",
        "y2_rgdu": "RGDU / salaire brut",
	"decomposition_title": "Décomposition du coût employeur",
	"decomposition_subtitle": (
    		"Ce graphique décompose le coût employeur à un point de salaire donné. "
    		"Les allègements de cotisations sont représentés comme une réduction des cotisations employeur théoriques."
	),
	"decomposition_wage_label": "Point de salaire sélectionné",
	"decomp_net_wage": "Salaire net",
	"decomp_employee_contrib": "Cotisations salarié",
	"decomp_employer_contrib": "Cotisations employeur après allègements",
	"decomp_total_cost": "Coût total employeur",
	"decomp_gross_wage": "Salaire brut",
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

def make_employer_cost_decomposition_chart(row, lang: str):
    t = TEXT[lang]

    net_wage = float(row["net_monthly_eur"])
    employee_contrib = float(row["employee_contributions_monthly_eur"])
    employer_contrib_net = float(row["employer_contributions_monthly_eur"])
    employer_cost = float(row["employer_cost_monthly_eur"])
    gross_wage = float(row["gross_monthly_eur"])
    rgdu = float(row.get("rgdu_monthly_eur", 0.0))
    smic_multiple = float(row["smic_multiple"])

    # Cotisations patronales théoriques avant allègements
    employer_contrib_before_relief = employer_contrib_net + rgdu

    # Coût théorique avant allègements
    theoretical_total_cost = employer_cost + rgdu

    fig = go.Figure()

    # IMPORTANT :
    # L'ordre des traces = ordre d'empilement du bas vers le haut.
    # Donc ici on obtient bien du haut vers le bas :
    # allègements > cotisations patronales > cotisations salariales > salaire net
    components = [
        (t["decomp_net_wage"], net_wage, COLOR_BLUE),
        (t["decomp_employee_contrib"], employee_contrib, COLOR_ORANGE),
        (t["decomp_employer_contrib"], employer_contrib_net, COLOR_GREEN),
        (t["decomp_contribution_relief"], rgdu, COLOR_RED),
    ]

    for label, value, color in components:
        fig.add_trace(
            go.Bar(
                x=[""],
                y=[value],
                name=label,
                marker=dict(color=color),
                customdata=[[
                    gross_wage,
                    employer_cost,
                    rgdu,
                    smic_multiple,
                    employer_contrib_net,
                    employer_contrib_before_relief,
                    theoretical_total_cost
                ]],
                hovertemplate=(
                    "<b>%{fullData.name}</b><br>"
                    + f"{t['x_axis']}: " + "%{customdata[3]:.2f}× SMIC<br>"
                    + f"{t['gross_wage']}: " + "%{customdata[0]:,.0f} €<br>"
                    + f"{t['decomp_effective_cost']}: " + "%{customdata[1]:,.0f} €<br>"
                    + f"{t['decomp_contribution_relief']}: " + "%{customdata[2]:,.0f} €<br>"
                    + f"{t['decomp_employer_contrib']}: " + "%{customdata[4]:,.0f} €<br>"
                    + f"{t['decomp_employer_contrib_before_relief']}: " + "%{customdata[5]:,.0f} €<br>"
                    + ("Coût avant allègements : " if lang == "fr" else "Cost before reliefs: ")
                    + "%{customdata[6]:,.0f} €"
                    + "<br>Montant : %{y:,.0f} €"
                    + "<extra></extra>"
                )
            )
        )

    # Ligne du salaire brut
    fig.add_hline(
        y=gross_wage,
        line_width=2,
        line_dash="dash",
        line_color=COLOR_RED
    )

    # Ligne du coût employeur effectif (après allègements)
    fig.add_hline(
        y=employer_cost,
        line_width=2,
        line_dash="dot",
        line_color=COLOR_NAVY
    )

    # Annotations séparées pour éviter les chevauchements
    fig.add_annotation(
        x=0.98,
        xref="paper",
        y=gross_wage,
        yref="y",
        text=f"{t['decomp_gross_wage']}: {euro(gross_wage)}",
        showarrow=False,
        xanchor="right",
        yanchor="bottom",
        font=dict(size=12, color=COLOR_RED),
        bgcolor="rgba(255,255,255,0.80)"
    )

    fig.add_annotation(
        x=0.98,
        xref="paper",
        y=employer_cost,
        yref="y",
        text=f"{t['decomp_effective_cost']}: {euro(employer_cost)}",
        showarrow=False,
        xanchor="right",
        yanchor="top",
        font=dict(size=12, color=COLOR_NAVY),
        bgcolor="rgba(255,255,255,0.80)"
    )

    y_max = max(theoretical_total_cost, gross_wage)

    fig.update_layout(
        template="plotly_white",
        height=470,
        margin=dict(l=70, r=70, t=35, b=95),
        barmode="stack",
        font=dict(family="Arial", size=13, color=COLOR_NAVY),
        hovermode="closest",
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="top",
            y=-0.18,
            xanchor="center",
            x=0.5,
            font=dict(size=12),
            traceorder="reversed"
        ),
        xaxis=dict(
            title="",
            showgrid=False,
            zeroline=False,
            showticklabels=False
        ),
        yaxis=dict(
            title=t["y_monthly_amount"],
            ticksuffix=" €",
            showgrid=True,
            gridcolor="#e5e7eb",
            zeroline=False,
            range=[0, y_max * 1.18]
        )
    )

    return fig



def make_atmp_comparison_chart(df_subset, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    atmp_labels = {
        "standard": "AT/MP standard" if lang == "fr" else "Standard AT/MP",
        "atmp_1": "AT/MP 1 %",
        "atmp_4": "AT/MP 4 %",
        "fonctions_support": "Fonctions support" if lang == "fr" else "Support functions",
    }

    colors = {
        "standard": COLOR_BLUE,
        "atmp_1": COLOR_GREEN,
        "atmp_4": COLOR_RED,
        "fonctions_support": COLOR_PURPLE,
    }

    for atmp_id, label in atmp_labels.items():
        df_line = df_subset[df_subset["dimension_atmp"] == atmp_id].copy()

        if df_line.empty:
            continue

        df_line = df_line.sort_values("smic_multiple")

        fig.add_trace(
            go.Scatter(
                x=df_line["smic_multiple"],
                y=df_line["employer_cost_monthly_eur"],
                mode="lines",
                name=label,
                line=dict(color=colors.get(atmp_id, COLOR_BLUE), width=3),
                customdata=df_line[[
                    "gross_monthly_eur",
                    "net_monthly_eur",
                    "employer_contributions_monthly_eur",
                    "rgdu_monthly_eur"
                ]],
                hovertemplate=(
                    "<b>%{x:.2f}× SMIC</b><br>"
                    + f"{t['gross_wage']}: "
                    + "%{customdata[0]:,.0f} €<br>"
                    + f"{t['net_wage']}: "
                    + "%{customdata[1]:,.0f} €<br>"
                    + f"{t['employer_cost']}: "
                    + "%{y:,.0f} €<br>"
                    + f"{t['employer_contrib']}: "
                    + "%{customdata[2]:,.0f} €<br>"
                    + f"{t['rgdu']}: "
                    + "%{customdata[3]:,.0f} €"
                    + "<extra></extra>"
                )
            )
        )

    fig.update_layout(
        template="plotly_white",
        height=440,
        margin=dict(l=70, r=35, t=30, b=85),
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
            title=t["y_monthly_amount"],
            ticksuffix=" €",
            showgrid=True,
            gridcolor="#e5e7eb",
            zeroline=False
        )
    )

    add_rgdu_zone(fig, lang)

    return fig

def make_atmp_gap_chart(df_subset, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    atmp_labels = {
        "atmp_1": "AT/MP 1 %",
        "atmp_4": "AT/MP 4 %",
        "fonctions_support": "Fonctions support" if lang == "fr" else "Support functions",
    }

    colors = {
        "atmp_1": COLOR_GREEN,
        "atmp_4": COLOR_RED,
        "fonctions_support": COLOR_PURPLE,
    }

    df_standard = df_subset[df_subset["dimension_atmp"] == "standard"].copy()

    if df_standard.empty:
        fig.update_layout(
            template="plotly_white",
            height=440,
            margin=dict(l=70, r=35, t=30, b=85),
            font=dict(family="Arial", size=13, color=COLOR_NAVY),
            xaxis=dict(title=t["x_axis"]),
            yaxis=dict(title=t["employer_cost_gap"])
        )
        return fig

    df_standard = df_standard.sort_values("smic_multiple")
    standard_map = (
        df_standard.set_index("smic_multiple")["employer_cost_monthly_eur"].to_dict()
    )

    for atmp_id, label in atmp_labels.items():
        df_line = df_subset[df_subset["dimension_atmp"] == atmp_id].copy()

        if df_line.empty:
            continue

        df_line = df_line.sort_values("smic_multiple").copy()
        df_line["standard_employer_cost"] = df_line["smic_multiple"].map(standard_map)
        df_line["gap_eur"] = (
            df_line["employer_cost_monthly_eur"] - df_line["standard_employer_cost"]
        )

        fig.add_trace(
            go.Scatter(
                x=df_line["smic_multiple"],
                y=df_line["gap_eur"],
                mode="lines",
                name=label,
                line=dict(color=colors.get(atmp_id, COLOR_BLUE), width=3),
                customdata=df_line[[
                    "gross_monthly_eur",
                    "employer_cost_monthly_eur",
                    "standard_employer_cost",
                    "gap_eur"
                ]],
                hovertemplate=(
                    "<b>%{x:.2f}× SMIC</b><br>"
                    + f"{t['gross_wage']}: "
                    + "%{customdata[0]:,.0f} €<br>"
                    + f"{t['employer_cost']}: "
                    + "%{customdata[1]:,.0f} €<br>"
                    + ("Standard AT/MP: " if lang == "en" else "AT/MP standard : ")
                    + "%{customdata[2]:,.0f} €<br>"
                    + f"{t['employer_cost_gap']}: "
                    + "%{customdata[3]:,.0f} €"
                    + "<extra></extra>"
                )
            )
        )

    fig.add_hline(
        y=0,
        line_width=1.5,
        line_dash="dash",
        line_color="#6b7280"
    )

    fig.update_layout(
        template="plotly_white",
        height=440,
        margin=dict(l=70, r=35, t=30, b=85),
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
            title=t["employer_cost_gap"],
            ticksuffix=" €",
            showgrid=True,
            gridcolor="#e5e7eb",
            zeroline=False
        )
    )

    add_rgdu_zone(fig, lang)

    return fig

def make_status_comparison_chart(df_subset, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    status_labels = {
        "non_cadre": "Non-cadre" if lang == "fr" else "Non-executive",
        "cadre": "Cadre" if lang == "fr" else "Executive",
    }

    colors = {
        "non_cadre": COLOR_BLUE,
        "cadre": COLOR_ORANGE,
    }

    for status_id, label in status_labels.items():
        df_line = df_subset[df_subset["dimension_status"] == status_id].copy()

        if df_line.empty:
            continue

        df_line = df_line.sort_values("smic_multiple")

        fig.add_trace(
            go.Scatter(
                x=df_line["smic_multiple"],
                y=df_line["employer_cost_monthly_eur"],
                mode="lines",
                name=label,
                line=dict(color=colors.get(status_id, COLOR_BLUE), width=3),
                customdata=df_line[[
                    "gross_monthly_eur",
                    "net_monthly_eur",
                    "employer_contributions_monthly_eur",
                    "rgdu_monthly_eur"
                ]],
                hovertemplate=(
                    "<b>%{x:.2f}× SMIC</b><br>"
                    + f"{t['gross_wage']}: "
                    + "%{customdata[0]:,.0f} €<br>"
                    + f"{t['net_wage']}: "
                    + "%{customdata[1]:,.0f} €<br>"
                    + f"{t['employer_cost']}: "
                    + "%{y:,.0f} €<br>"
                    + f"{t['employer_contrib']}: "
                    + "%{customdata[2]:,.0f} €<br>"
                    + f"{t['rgdu']}: "
                    + "%{customdata[3]:,.0f} €"
                    + "<extra></extra>"
                )
            )
        )

    fig.update_layout(
        template="plotly_white",
        height=440,
        margin=dict(l=70, r=35, t=30, b=85),
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
            title=t["y_monthly_amount"],
            ticksuffix=" €",
            showgrid=True,
            gridcolor="#e5e7eb",
            zeroline=False
        )
    )

    add_rgdu_zone(fig, lang)

    return fig


def make_status_gap_chart(df_subset, lang: str):
    t = TEXT[lang]
    fig = go.Figure()

    df_non_cadre = df_subset[df_subset["dimension_status"] == "non_cadre"].copy()
    df_cadre = df_subset[df_subset["dimension_status"] == "cadre"].copy()

    if df_non_cadre.empty or df_cadre.empty:
        fig.update_layout(
            template="plotly_white",
            height=440,
            margin=dict(l=70, r=35, t=30, b=85),
            font=dict(family="Arial", size=13, color=COLOR_NAVY),
            xaxis=dict(title=t["x_axis"]),
            yaxis=dict(title=t["executive_gap"])
        )
        return fig

    df_non_cadre = df_non_cadre.sort_values("smic_multiple")
    non_cadre_map = (
        df_non_cadre.set_index("smic_multiple")["employer_cost_monthly_eur"].to_dict()
    )

    df_cadre = df_cadre.sort_values("smic_multiple").copy()
    df_cadre["non_cadre_employer_cost"] = df_cadre["smic_multiple"].map(non_cadre_map)
    df_cadre["gap_eur"] = (
        df_cadre["employer_cost_monthly_eur"] - df_cadre["non_cadre_employer_cost"]
    )

    fig.add_trace(
        go.Scatter(
            x=df_cadre["smic_multiple"],
            y=df_cadre["gap_eur"],
            mode="lines",
            name=t["executive_gap"],
            line=dict(color=COLOR_RED, width=3),
            customdata=df_cadre[[
                "gross_monthly_eur",
                "employer_cost_monthly_eur",
                "non_cadre_employer_cost",
                "gap_eur"
            ]],
            hovertemplate=(
                "<b>%{x:.2f}× SMIC</b><br>"
                + f"{t['gross_wage']}: "
                + "%{customdata[0]:,.0f} €<br>"
                + ("Executive cost: " if lang == "en" else "Coût cadre : ")
                + "%{customdata[1]:,.0f} €<br>"
                + ("Non-executive cost: " if lang == "en" else "Coût non-cadre : ")
                + "%{customdata[2]:,.0f} €<br>"
                + f"{t['executive_gap']}: "
                + "%{customdata[3]:,.0f} €"
                + "<extra></extra>"
            )
        )
    )

    fig.add_hline(
        y=0,
        line_width=1.5,
        line_dash="dash",
        line_color="#6b7280"
    )

    fig.update_layout(
        template="plotly_white",
        height=440,
        margin=dict(l=70, r=35, t=30, b=85),
        font=dict(family="Arial", size=13, color=COLOR_NAVY),
        hovermode="x unified",
        showlegend=False,
        xaxis=dict(
            title=t["x_axis"],
            showgrid=False,
            zeroline=False
        ),
        yaxis=dict(
            title=t["executive_gap"],
            ticksuffix=" €",
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

def build_full_data_table(df, lang: str):
    t = TEXT[lang]

    table = df.copy().sort_values("smic_multiple")

    columns = [
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
        "cost_to_net_ratio",
    ]

    table = table[columns]

    table = table.rename(columns={
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
        "cost_to_net_ratio": t["cost_net_ratio"],
    })

    euro_columns = [
        f"{t['gross_wage']} (€)",
        f"{t['net_wage']} (€)",
        f"{t['employer_cost']} (€)",
        f"{t['employee_contrib']} (€)",
        f"{t['employer_contrib']} (€)",
        f"{t['rgdu']} (€)",
        f"{t['social_wedge']} (€)",
    ]

    for col in euro_columns:
        table[col] = table[col].map(lambda x: euro(float(x)) if pd.notna(x) else "")

    rate_columns = [
        t["employee_rate"],
        t["employer_rate"],
        t["rgdu_rate"],
        t["social_wedge_rate"],
    ]

    for col in rate_columns:
        table[col] = table[col].map(lambda x: pct(float(x) * 100) if pd.notna(x) else "")

    table[t["cost_net_ratio"]] = table[t["cost_net_ratio"]].map(
        lambda x: f"{float(x):.2f}" if pd.notna(x) else ""
    )

    table["SMIC"] = table["SMIC"].map(lambda x: f"{float(x):.2f}")

    return table.to_html(
        index=False,
        classes="data-table data-table-full",
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

    return f"""
    <div class="profile-panel active" id="panel-{lang}">
        <section>
            <h2>{t["figures_title"]}</h2>

            <div class="charts-grid">
                <div class="chart-card">
                    <h3>{t["chart_cost_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_cost_subtitle"]}</p>
                    <div id="chart-cost-{lang}" class="plotly-chart lazy-chart"></div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_employer_rate_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_employer_rate_subtitle"]}</p>
                    <div id="chart-employer-rate-{lang}" class="plotly-chart lazy-chart"></div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_rgdu_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_rgdu_subtitle"]}</p>
                    <div id="chart-rgdu-{lang}" class="plotly-chart lazy-chart"></div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_wedge_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_wedge_subtitle"]}</p>
                    <div id="chart-wedge-{lang}" class="plotly-chart lazy-chart"></div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_ratio_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_ratio_subtitle"]}</p>
                    <div id="chart-ratio-{lang}" class="plotly-chart lazy-chart"></div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_marginal_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_marginal_subtitle"]}</p>
                    <div id="chart-marginal-{lang}" class="plotly-chart lazy-chart"></div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_total_levy_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_total_levy_subtitle"]}</p>
                    <div id="chart-total-levy-{lang}" class="plotly-chart lazy-chart"></div>
                </div>

                <div class="chart-card">
                    <h3>{t["chart_net_gross_return_title"]}</h3>
                    <p class="chart-subtitle">{t["chart_net_gross_return_subtitle"]}</p>
                    <div id="chart-net-gross-return-{lang}" class="plotly-chart lazy-chart"></div>
                </div>
            </div>
        </section>
    </div>
    """
def build_comparison_panels(df, lang: str):
    t = TEXT[lang]

    combinations = (
        df[["dimension_status", "dimension_territory"]]
        .drop_duplicates()
        .sort_values(["dimension_status", "dimension_territory"])
        .to_dict("records")
    )

    panels = []

    for row in combinations:
        status = row["dimension_status"]
        territory = row["dimension_territory"]

        panel_id = f"comparison-{lang}-{status}__{territory}"

        df_subset_atmp = df[
            (df["dimension_status"] == status)
            & (df["dimension_territory"] == territory)
        ].copy()

        chart_atmp_level_html = fig_to_html(make_atmp_comparison_chart(df_subset_atmp, lang))
        chart_atmp_gap_html = fig_to_html(make_atmp_gap_chart(df_subset_atmp, lang))

        panels.append(f"""
        <div class="comparison-panel" id="{panel_id}">
            <section>
                <div class="charts-grid">
                    <div class="chart-card">
                        <h2>{t["comparison_atmp_title"]}</h2>
                        <p class="chart-subtitle">{t["comparison_atmp_subtitle"]}</p>
                        <div class="plotly-chart">{chart_atmp_level_html}</div>
                    </div>

                    <div class="chart-card">
                        <h2>{t["comparison_atmp_gap_title"]}</h2>
                        <p class="chart-subtitle">{t["comparison_atmp_gap_subtitle"]}</p>
                        <div class="plotly-chart">{chart_atmp_gap_html}</div>
                    </div>
                </div>
            </section>
        </div>
        """)

    status_combinations = (
        df[["dimension_territory", "dimension_atmp"]]
        .drop_duplicates()
        .sort_values(["dimension_territory", "dimension_atmp"])
        .to_dict("records")
    )

    for row in status_combinations:
        territory = row["dimension_territory"]
        atmp = row["dimension_atmp"]

        panel_id = f"status-comparison-{lang}-{territory}__{atmp}"

        df_subset_status = df[
            (df["dimension_territory"] == territory)
            & (df["dimension_atmp"] == atmp)
        ].copy()

        chart_status_level_html = fig_to_html(make_status_comparison_chart(df_subset_status, lang))
        chart_status_gap_html = fig_to_html(make_status_gap_chart(df_subset_status, lang))

        panels.append(f"""
        <div class="status-comparison-panel" id="{panel_id}">
            <section>
                <div class="charts-grid">
                    <div class="chart-card">
                        <h2>{t["comparison_status_title"]}</h2>
                        <p class="chart-subtitle">{t["comparison_status_subtitle"]}</p>
                        <div class="plotly-chart">{chart_status_level_html}</div>
                    </div>

                    <div class="chart-card">
                        <h2>{t["comparison_status_gap_title"]}</h2>
                        <p class="chart-subtitle">{t["comparison_status_gap_subtitle"]}</p>
                        <div class="plotly-chart">{chart_status_gap_html}</div>
                    </div>
                </div>
            </section>
        </div>
        """)

    return "\n".join(panels)

def build_data_panels(df, lang: str):
    t = TEXT[lang]

    profiles = (
        df[[
            "profile_id",
            "profile_label_fr",
            "profile_label_en"
        ]]
        .drop_duplicates()
        .sort_values("profile_id")
        .to_dict("records")
    )

    panels = []

    for row in profiles:
        profile_id = row["profile_id"]
        profile_label = row[f"profile_label_{lang}"]

        df_profile = df[df["profile_id"] == profile_id].copy()
        table_html = build_full_data_table(df_profile, lang)

        panels.append(f"""
        <div class="data-panel" id="data-panel-{lang}-{safe_id(profile_id)}">
            <section>
                <h2>{t["profile_data_title"]}</h2>
                <p class="interpretation">{profile_label}</p>
                <div class="table-wrapper table-wrapper-full">
                    {table_html}
                </div>
            </section>
        </div>
        """)

    return "\n".join(panels)

def wage_point_key(value):
    return f"{float(value):.2f}".replace(".", "_")


def build_decomposition_panels(df, lang: str, default_profile: str):
    wage_points = [1.0, 1.6, 2.0, 3.0]

    profiles = (
        df[["profile_id"]]
        .drop_duplicates()
        .sort_values("profile_id")
        .to_dict("records")
    )

    panels = []

    for profile in profiles:
        profile_id = profile["profile_id"]
        df_profile = df[df["profile_id"] == profile_id].copy()

        for point in wage_points:
            idx = (df_profile["smic_multiple"] - point).abs().idxmin()
            row = df_profile.loc[idx]
            point_key = wage_point_key(point)

            chart_html = fig_to_html(
                make_employer_cost_decomposition_chart(row, lang)
            )

            active_class = ""
            if profile_id == default_profile and abs(point - 2.0) < 0.001:
                active_class = " active"

            panels.append(f"""
            <div
                class="decomposition-panel{active_class}"
                id="decomposition-{lang}-{safe_id(profile_id)}-{point_key}"
            >
                <div class="chart-card chart-card-full decomposition-chart-card">
                    <div class="plotly-chart">{chart_html}</div>
                </div>
            </div>
            """)

    return "\n".join(panels)

def build_metrics_panels(df, lang: str):
    t = TEXT[lang]

    profiles = (
        df[["profile_id"]]
        .drop_duplicates()
        .sort_values("profile_id")
        .to_dict("records")
    )

    panels = []

    for profile in profiles:
        profile_id = profile["profile_id"]
        df_profile = df[df["profile_id"] == profile_id].copy()
        metrics = build_key_metrics(df_profile)

        panels.append(f"""
        <div class="metrics-panel" id="metrics-{lang}-{safe_id(profile_id)}">
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
        </div>
        """)

    return "\n".join(panels)

def build_dimension_options(df, dimension_column, label_map, lang):
    values = (
        df[[dimension_column]]
        .drop_duplicates()
        .sort_values(dimension_column)
        [dimension_column]
        .tolist()
    )

    options = []
    for value in values:
        label = label_map.get(value, value)
        options.append(f'<option value="{value}">{label}</option>')

    return "\n".join(options)


def build_language_section(df, lang: str, updated_at: str):
    t = TEXT[lang]
    methodology_html = build_methodology_list(lang)

    status_labels = {
        "non_cadre": "Non-cadre" if lang == "fr" else "Non-executive",
        "cadre": "Cadre" if lang == "fr" else "Executive",
    }

    territory_labels = {
        "standard": "Hors Alsace-Moselle" if lang == "fr" else "Outside Alsace-Moselle",
        "alsace_moselle": "Alsace-Moselle",
    }

    atmp_labels = {
        "standard": "AT/MP standard" if lang == "fr" else "Standard AT/MP",
        "atmp_1": "AT/MP 1 %",
        "atmp_4": "AT/MP 4 %",
        "fonctions_support": "Fonctions support" if lang == "fr" else "Support functions",
    }

    status_options = build_dimension_options(df, "dimension_status", status_labels, lang)
    territory_options = build_dimension_options(df, "dimension_territory", territory_labels, lang)
    atmp_options = build_dimension_options(df, "dimension_atmp", atmp_labels, lang)

    profiles = (
        df[[
            "profile_id",
            "profile_label_fr",
            "profile_label_en",
            "dimension_status",
            "dimension_territory",
            "dimension_atmp"
        ]]
        .drop_duplicates()
        .sort_values("profile_id")
        .to_dict("records")
    )

    default_profile = profiles[0]["profile_id"]
  

    panels_html = build_profile_panel(None, "current", lang)

 
    metrics_panels_html = build_metrics_panels(df, lang)

    return f"""

    <div class="language-section {'active' if lang == 'fr' else ''}" id="section-{lang}" data-default-profile="{default_profile}">
        <header>
            <div>
                <h1>{t["page_title"]}</h1>
                <p>{t["subtitle"]}</p>
                <p class="author-line">Par Hugo Spring-Ragain, Économiste, CEDS Paris</p>
            </div>
            <div class="header-actions">
                <button class="theme-toggle" onclick="toggleTheme()" title="Dark mode" aria-label="Dark mode">🌙</button>
                <button class="language-toggle" onclick="switchLanguage()">{t["language_button"]}</button>
            </div>
        </header>

        <main>
            <nav class="tabs" aria-label="Dashboard sections">
                <button class="tab-button active" data-tab="simulation" onclick="showTab('{lang}', 'simulation')">{t["tab_simulation"]}</button>
                <button class="tab-button" data-tab="comparisons" onclick="showTab('{lang}', 'comparisons')">{t["tab_comparisons"]}</button>
                <button class="tab-button" data-tab="data" onclick="showTab('{lang}', 'data')">{t["tab_data"]}</button>
                <button class="tab-button" data-tab="methodology" onclick="showTab('{lang}', 'methodology')">{t["tab_methodology"]}</button>
                <button class="tab-button" data-tab="working-paper" onclick="showTab('{lang}', 'working-paper')">{t["tab_working_paper"]}</button>
            </nav>

            <div class="tab-panel active" id="tab-{lang}-simulation">
                <section>
                    <div class="badge">{t["engine_badge"]}</div>
                    <h2>{t["purpose_title"]}</h2>
                    <p>{t["purpose_text"]}</p>
                    <div class="method-box">{t["method_note"]}</div>

                    <div class="profile-selector profile-selector-grid">
                        <div class="selector-field">
                            <label for="status-select-{lang}">{t["status_label"]}</label>
                            <select id="status-select-{lang}" onchange="switchCombinatorialProfile('{lang}'); renderSimulation('{lang}');">
                                {status_options}
                            </select>
                        </div>

                        <div class="selector-field">
                            <label for="territory-select-{lang}">{t["territory_label"]}</label>
                            <select id="territory-select-{lang}" onchange="switchCombinatorialProfile('{lang}'); renderSimulation('{lang}');">
                                {territory_options}
                            </select>
                        </div>

                        <div class="selector-field">
                            <label for="atmp-select-{lang}">{t["atmp_label"]}</label>
                            <select id="atmp-select-{lang}" onchange="switchCombinatorialProfile('{lang}'); renderSimulation('{lang}');">
                                {atmp_options}
                            </select>
                        </div>
                    </div>
                </section>

                <div id="profile-panels-{lang}">
                    {panels_html}
                </div>

                <section>
                    <h2>{t["decomposition_title"]}</h2>
                    <p class="chart-subtitle">{t["decomposition_subtitle"]}</p>

                    <div class="profile-selector decomposition-selector">
                        <div class="selector-field">
                            <label for="decomposition-wage-select-{lang}">{t["decomposition_wage_label"]}</label>
                            <select id="decomposition-wage-select-{lang}" onchange="renderSimulation('{lang}')">
                                <option value="1.00">1 SMIC</option>
                                <option value="1.60">1,6 SMIC</option>
                                <option value="2.00" selected>2 SMIC</option>
                                <option value="3.00">3 SMIC</option>
                            </select>
                        </div>
                    </div>

                    <div class="chart-card chart-card-full decomposition-chart-card">
                        <div id="chart-decomposition-{lang}" class="plotly-chart lazy-chart"></div>
                    </div>
                </section>

                <div id="metrics-panels-{lang}">
                    {metrics_panels_html}
                </div>
            </div>

            <div class="tab-panel" id="tab-{lang}-comparisons">
                <section>
                    <h2>{t["comparisons_title"]}</h2>
                    <p class="interpretation">{t["comparisons_intro"]}</p>

                    <div class="charts-grid">
                        <div class="chart-card">
                            <h3>{t["comparison_atmp_title"]}</h3>
                            <p class="chart-subtitle">{t["comparison_atmp_subtitle"]}</p>
                            <div id="chart-comparison-atmp-level-{lang}" class="plotly-chart lazy-chart"></div>
                        </div>

                        <div class="chart-card">
                            <h3>{t["comparison_atmp_gap_title"]}</h3>
                            <p class="chart-subtitle">{t["comparison_atmp_gap_subtitle"]}</p>
                            <div id="chart-comparison-atmp-gap-{lang}" class="plotly-chart lazy-chart"></div>
                        </div>

                        <div class="chart-card">
                            <h3>{t["comparison_status_title"]}</h3>
                            <p class="chart-subtitle">{t["comparison_status_subtitle"]}</p>
                            <div id="chart-comparison-status-level-{lang}" class="plotly-chart lazy-chart"></div>
                        </div>

                        <div class="chart-card">
                            <h3>{t["comparison_status_gap_title"]}</h3>
                            <p class="chart-subtitle">{t["comparison_status_gap_subtitle"]}</p>
                            <div id="chart-comparison-status-gap-{lang}" class="plotly-chart lazy-chart"></div>
                        </div>
                    </div>
                </section>
            </div>

            <div class="tab-panel" id="tab-{lang}-data">
                <section>
                    <h2>{t["data_title"]}</h2>
                    <p class="interpretation">{t["data_intro"]}</p>

                    <div class="download-row" style="margin-top: 18px;">
                        <a
                            class="download-link"
                            href="data/labour_cost_grid_mon_entreprise.csv"
                            download
                        >
                            ⬇ {t["download_csv"]}
                        </a>
                    </div>

                    <div class="profile-selector profile-selector-grid data-profile-selector">
                        <div class="selector-field">
                            <label for="data-status-select-{lang}">{t["status_label"]}</label>
                            <select id="data-status-select-{lang}" onchange="switchDataCombinatorialProfile('{lang}'); renderDataTable('{lang}')">
                                {status_options}
                            </select>
                        </div>

                        <div class="selector-field">
                            <label for="data-territory-select-{lang}">{t["territory_label"]}</label>
                            <select id="data-territory-select-{lang}" onchange="switchDataCombinatorialProfile('{lang}'); renderDataTable('{lang}')">
                                {territory_options}
                            </select>
                        </div>

                        <div class="selector-field">
                            <label for="data-atmp-select-{lang}">{t["atmp_label"]}</label>
                            <select id="data-atmp-select-{lang}" onchange="switchDataCombinatorialProfile('{lang}'); renderDataTable('{lang}')">
                                {atmp_options}
                            </select>
                        </div>
                    </div>
                </section>

                <div id="data-panels-{lang}">
                    <section>
                        <h2>{t["profile_data_title"]}</h2>
                        <p class="interpretation" id="data-profile-label-{lang}"></p>

                        <div class="table-wrapper table-wrapper-full">
                            <table class="data-table data-table-full" id="data-table-{lang}"></table>
                        </div>
                    </section>
                </div>
            </div>

            <div class="tab-panel" id="tab-{lang}-methodology">
                <section>
                    <h2>{t["methodology_title"]}</h2>
                    {methodology_html}
                </section>

                <section>
                    <h2>{t["consistency_title"]}</h2>
                    <p class="interpretation">{t["consistency_intro"]}</p>

                    <div id="consistency-checks-{lang}" class="consistency-checks-grid"></div>
                </section>
            </div>

            <div class="tab-panel" id="tab-{lang}-working-paper">
                <section class="working-paper-section">
                    <div class="working-paper-header">
                        <div>
                            <h2>{t["working_paper_title"]}</h2>
                            <p class="interpretation">{t["working_paper_intro"]}</p>
                        </div>

                        <a
                            class="download-link working-paper-download"
                            href="assets/french_labour_cost_lab_working_paper.pdf"
                            download
                        >
                            ⬇ {t["working_paper_download"]}
                        </a>
                    </div>

                    <div class="working-paper-card">
                        <div class="pdf-viewer-wrapper">
                            <iframe
                                class="pdf-viewer"
                                src="assets/french_labour_cost_lab_working_paper.pdf#view=FitH"
                                title="French Labour Cost Lab Working Paper"
                            ></iframe>
                        </div>
                    </div>
                </section>
            </div>
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
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>French Labour Cost Lab</title>
    <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
    <link rel="stylesheet" href="assets/style.css?v=18">
    <script defer src="assets/app.js?v=8"></script>
</head>
<body>
    {english_section}
    {french_section}

    <script>
        function safeId(value) {{
            return String(value).replaceAll(" ", "_").replaceAll("-", "_");
        }}

        function getSelectedCombinatorialProfile(lang) {{
            const status = document.getElementById("status-select-" + lang).value;
            const territory = document.getElementById("territory-select-" + lang).value;
            const atmp = document.getElementById("atmp-select-" + lang).value;

            return status + "__" + territory + "__" + atmp;
        }}

        function getSelectedDataProfile(lang) {{
            const status = document.getElementById("data-status-select-" + lang).value;
            const territory = document.getElementById("data-territory-select-" + lang).value;
            const atmp = document.getElementById("data-atmp-select-" + lang).value;

            return status + "__" + territory + "__" + atmp;
        }}

        function restoreCombinatorialSelectors(lang) {{
            const statusSelect = document.getElementById("status-select-" + lang);
            const territorySelect = document.getElementById("territory-select-" + lang);
            const atmpSelect = document.getElementById("atmp-select-" + lang);

            const savedStatus = localStorage.getItem("flcl_status_" + lang);
            const savedTerritory = localStorage.getItem("flcl_territory_" + lang);
            const savedAtmp = localStorage.getItem("flcl_atmp_" + lang);

            if (savedStatus && statusSelect.querySelector('option[value="' + savedStatus + '"]')) {{
                statusSelect.value = savedStatus;
            }}

            if (savedTerritory && territorySelect.querySelector('option[value="' + savedTerritory + '"]')) {{
                territorySelect.value = savedTerritory;
            }}

            if (savedAtmp && atmpSelect.querySelector('option[value="' + savedAtmp + '"]')) {{
                atmpSelect.value = savedAtmp;
            }}

            return getSelectedCombinatorialProfile(lang);
        }}

        function syncDataSelectorsFromSimulation(lang) {{
            const status = document.getElementById("status-select-" + lang).value;
            const territory = document.getElementById("territory-select-" + lang).value;
            const atmp = document.getElementById("atmp-select-" + lang).value;

            const dataStatus = document.getElementById("data-status-select-" + lang);
            const dataTerritory = document.getElementById("data-territory-select-" + lang);
            const dataAtmp = document.getElementById("data-atmp-select-" + lang);

            if (dataStatus) {{
                dataStatus.value = status;
            }}

            if (dataTerritory) {{
                dataTerritory.value = territory;
            }}

            if (dataAtmp) {{
                dataAtmp.value = atmp;
            }}
        }}

        function syncSimulationSelectorsFromData(lang) {{
            const status = document.getElementById("data-status-select-" + lang).value;
            const territory = document.getElementById("data-territory-select-" + lang).value;
            const atmp = document.getElementById("data-atmp-select-" + lang).value;

            document.getElementById("status-select-" + lang).value = status;
            document.getElementById("territory-select-" + lang).value = territory;
            document.getElementById("atmp-select-" + lang).value = atmp;

            localStorage.setItem("flcl_status_" + lang, status);
            localStorage.setItem("flcl_territory_" + lang, territory);
            localStorage.setItem("flcl_atmp_" + lang, atmp);
        }}

        function showProfile(lang, profileId) {{
            const panels = document.querySelectorAll("#profile-panels-" + lang + " .profile-panel");

            panels.forEach(function(panel) {{
                panel.classList.remove("active");
            }});

            const directTarget = document.getElementById("panel-" + lang);
            const oldTarget = document.getElementById("panel-" + lang + "-" + safeId(profileId));

            if (directTarget) {{
                directTarget.classList.add("active");
            }} else if (oldTarget) {{
                oldTarget.classList.add("active");
            }} else if (panels.length > 0) {{
                panels[0].classList.add("active");
            }}

            setTimeout(function() {{
                window.dispatchEvent(new Event("resize"));
            }}, 150);
        }}

        function showComparison(lang) {{
            const panels = document.querySelectorAll("#comparison-panels-" + lang + " .comparison-panel");

            panels.forEach(function(panel) {{
                panel.classList.remove("active");
            }});

            const statusSelect = document.getElementById("status-select-" + lang);
            const territorySelect = document.getElementById("territory-select-" + lang);

            let target = null;

            if (statusSelect && territorySelect) {{
                const status = statusSelect.value;
                const territory = territorySelect.value;
                const comparisonId = "comparison-" + lang + "-" + status + "__" + territory;
                target = document.getElementById(comparisonId);
            }}

            if (target) {{
                target.classList.add("active");
            }} else if (panels.length > 0) {{
                panels[0].classList.add("active");
            }}

            setTimeout(function() {{
                window.dispatchEvent(new Event("resize"));
            }}, 200);
        }}

        function showStatusComparison(lang) {{
            const panels = document.querySelectorAll("#comparison-panels-" + lang + " .status-comparison-panel");

            panels.forEach(function(panel) {{
                panel.classList.remove("active");
            }});

            const territorySelect = document.getElementById("territory-select-" + lang);
            const atmpSelect = document.getElementById("atmp-select-" + lang);

            let target = null;

            if (territorySelect && atmpSelect) {{
                const territory = territorySelect.value;
                const atmp = atmpSelect.value;
                const comparisonId = "status-comparison-" + lang + "-" + territory + "__" + atmp;
                target = document.getElementById(comparisonId);
            }}

            if (target) {{
                target.classList.add("active");
            }} else if (panels.length > 0) {{
                panels[0].classList.add("active");
            }}

            setTimeout(function() {{
                window.dispatchEvent(new Event("resize"));
            }}, 200);
        }}

        function showTerritoryComparison(lang) {{
            return;
        }}

        function showDataPanel(lang) {{
            let profileId;

            const dataStatus = document.getElementById("data-status-select-" + lang);

            if (dataStatus) {{
                profileId = getSelectedDataProfile(lang);
            }} else {{
                profileId = getSelectedCombinatorialProfile(lang);
            }}

            const panels = document.querySelectorAll("#data-panels-" + lang + " .data-panel");

            panels.forEach(function(panel) {{
                panel.classList.remove("active");
            }});

            const target = document.getElementById("data-panel-" + lang + "-" + safeId(profileId));

            if (target) {{
                target.classList.add("active");
            }} else if (panels.length > 0) {{
                panels[0].classList.add("active");
            }}
        }}

        function showMetricsPanel(lang) {{
            const profileId = getSelectedCombinatorialProfile(lang);
            const panels = document.querySelectorAll("#metrics-panels-" + lang + " .metrics-panel");

            panels.forEach(function(panel) {{
                panel.classList.remove("active");
            }});

            const target = document.getElementById("metrics-" + lang + "-" + safeId(profileId));

            if (target) {{
                target.classList.add("active");
            }} else if (panels.length > 0) {{
                panels[0].classList.add("active");
            }}
        }}

        function switchCombinatorialProfile(lang) {{
            const profileId = getSelectedCombinatorialProfile(lang);

            localStorage.setItem("flcl_status_" + lang, document.getElementById("status-select-" + lang).value);
            localStorage.setItem("flcl_territory_" + lang, document.getElementById("territory-select-" + lang).value);
            localStorage.setItem("flcl_atmp_" + lang, document.getElementById("atmp-select-" + lang).value);

            showProfile(lang, profileId);
            showComparison(lang);
            showStatusComparison(lang);
            showTerritoryComparison(lang);
            syncDataSelectorsFromSimulation(lang);
            showDataPanel(lang);
            showMetricsPanel(lang);

            if (typeof renderSimulation === "function") {{
                renderSimulation(lang);
            }}
        }}

        function switchDataCombinatorialProfile(lang) {{
            syncSimulationSelectorsFromData(lang);

            const profileId = getSelectedDataProfile(lang);

            showProfile(lang, profileId);
            showComparison(lang);
            showStatusComparison(lang);
            showTerritoryComparison(lang);
            showDataPanel(lang);
            showMetricsPanel(lang);

            if (typeof renderSimulation === "function") {{
                renderSimulation(lang);
            }}
        }}

        function showTab(lang, tabName) {{
            const panels = document.querySelectorAll("#section-" + lang + " .tab-panel");
            const buttons = document.querySelectorAll("#section-" + lang + " .tab-button");

            panels.forEach(function(panel) {{
                panel.classList.remove("active");
            }});

            buttons.forEach(function(button) {{
                button.classList.remove("active");
            }});

            const targetPanel = document.getElementById("tab-" + lang + "-" + tabName);
            const targetButton = document.querySelector(
                "#section-" + lang + " .tab-button[data-tab='" + tabName + "']"
            );

            if (targetPanel) {{
                targetPanel.classList.add("active");
            }}

            if (targetButton) {{
                targetButton.classList.add("active");
            }}

            localStorage.setItem("flcl_tab_" + lang, tabName);

            if (tabName === "simulation" && typeof renderSimulation === "function") {{
                setTimeout(function() {{
                    renderSimulation(lang);
                }}, 150);
            }}

            if (tabName === "comparisons" && typeof renderComparisons === "function") {{
                setTimeout(function() {{
                    renderComparisons(lang);
                }}, 150);
            }}

            if (tabName === "methodology" && typeof renderConsistencyChecks === "function") {{
                setTimeout(function() {{
                    renderConsistencyChecks(lang);
                }}, 150);
            }}

            setTimeout(function() {{
                window.dispatchEvent(new Event("resize"));
            }}, 150);
        }}

        function restoreTab(lang) {{
            const savedTab = localStorage.getItem("flcl_tab_" + lang) || "simulation";
            const targetPanel = document.getElementById("tab-" + lang + "-" + savedTab);

            if (targetPanel) {{
                showTab(lang, savedTab);
            }} else {{
                localStorage.setItem("flcl_tab_" + lang, "simulation");
                showTab(lang, "simulation");
            }}
        }}

        function switchLanguage() {{
            const current = localStorage.getItem("flcl_language") || "fr";
            setLanguage(current === "fr" ? "en" : "fr");
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

        function updatePlotlyTheme(theme) {{
            if (typeof Plotly === "undefined") {{
                return;
            }}

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
                "yaxis.color": axisColor,
                "yaxis.gridcolor": gridColor,
                "yaxis.zerolinecolor": gridColor,
                "yaxis2.color": axisColor,
                "yaxis2.gridcolor": gridColor,
                "yaxis2.zerolinecolor": gridColor,
                "yaxis2.overlaying": "y",
                "yaxis2.side": "right",
                "yaxis2.showgrid": false
            }};

            document.querySelectorAll(".js-plotly-plot").forEach(function(plot) {{
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

        function setLanguage(lang) {{
            const enSection = document.getElementById("section-en");
            const frSection = document.getElementById("section-fr");

            if (!enSection || !frSection) {{
                console.error("Language sections not found.");
                return;
            }}

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

            const selectedProfile = restoreCombinatorialSelectors(lang);

            showProfile(lang, selectedProfile);
            showComparison(lang);
            showStatusComparison(lang);
            showTerritoryComparison(lang);
            syncDataSelectorsFromSimulation(lang);
            showDataPanel(lang);
            showMetricsPanel(lang);
            restoreTab(lang);

            if (typeof renderSimulation === "function") {{
                setTimeout(function() {{
                    renderSimulation(lang);
                }}, 300);
            }}
        }}

        const savedTheme = localStorage.getItem("flcl_theme") || "light";
        applyTheme(savedTheme);

        const savedLanguage = localStorage.getItem("flcl_language") || "fr";
        setLanguage(savedLanguage);
    </script>
</body>
</html>
"""

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(DOCS_DATA_PATH, index=False, encoding="utf-8-sig")
    OUTPUT_PATH.write_text(html, encoding="utf-8")
    print(f"Dashboard created: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
