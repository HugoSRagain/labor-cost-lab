const BELGIUM_DATA_PATH = "../../data/belgium/belgium_labour_cost_grid_2026.csv";
const BELGIUM_LANGUAGE_STORAGE_KEY = "belgium_language";
const BELGIUM_TAB_STORAGE_KEY = "belgium_tab";

let BELGIUM_DATA = [];


function applyStoredBelgiumTheme() {
    const storedTheme = localStorage.getItem("belgium-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateBelgiumThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateBelgiumThemeButton("light");
    }
}


function updateBelgiumThemeButton(theme) {
    document.querySelectorAll(".theme-toggle").forEach(function(themeToggle) {
        if (theme === "dark") {
            themeToggle.textContent = "☀️";
            themeToggle.title = "Light mode";
            themeToggle.setAttribute("aria-label", "Light mode");
        } else {
            themeToggle.textContent = "🌙";
            themeToggle.title = "Dark mode";
            themeToggle.setAttribute("aria-label", "Dark mode");
        }
    });
}


function toggleTheme() {
    const isDarkMode = document.body.classList.toggle("dark-mode");

    if (isDarkMode) {
        localStorage.setItem("belgium-theme", "dark");
        updateBelgiumThemeButton("dark");
    } else {
        localStorage.setItem("belgium-theme", "light");
        updateBelgiumThemeButton("light");
    }

    renderBelgium(getActiveI18nLanguage(BELGIUM_LANGUAGE_STORAGE_KEY));
}


const BELGIUM_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    wedge: "#f97316",
    total: "#0f172a"
};


function deNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function beLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function deEuro(value, lang) {
    return deNum(value).toLocaleString(
        beLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function dePct(value, lang) {
    return (deNum(value) * 100).toLocaleString(
        beLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function deRatio(value, lang) {
    const text = deNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getBelgiumSelectedProfile(lang) {
    const select = getI18nElement("belgium-profile-select", lang);

    if (!select) {
        return "belgium__standard_private_sector";
    }

    return select.value;
}

function getBelgiumSelectedDataProfile(lang) {
    const select = getI18nElement("belgium-data-profile-select", lang);

    if (!select) {
        return getBelgiumSelectedProfile(lang);
    }

    return select.value;
}

function getBelgiumWaterfallMultiple(lang) {
    const select = getI18nElement("belgium-waterfall-multiple", lang);

    if (!select) {
        return 2.00;
    }

    return deNum(select.value);
}


function getBelgiumProfileData(profileId) {
    return BELGIUM_DATA
        .filter(row => row.profile_id === profileId)
        .sort((a, b) => deNum(a.smic_multiple) - deNum(b.smic_multiple));
}


function findBelgiumClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            deNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            deNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function belgiumBaseLayout(lang, yAxisTitle) {
    const isDarkMode = document.body.classList.contains("dark-mode");

    const textColor = isDarkMode ? "#f9fafb" : "#0f172a";
    const gridColor = isDarkMode ? "rgba(148, 163, 184, 0.22)" : "rgba(148, 163, 184, 0.25)";
    const axisColor = isDarkMode ? "#475569" : "#cbd5e1";
    const hoverBackground = isDarkMode ? "#111827" : "#ffffff";

    return {
        margin: {
            l: 82,
            r: 28,
            t: 24,
            b: 76
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: {
            family: "Inter, Arial, sans-serif",
            color: textColor
        },
        hovermode: "x unified",
        hoverlabel: {
            bgcolor: hoverBackground,
            bordercolor: axisColor,
            font: {
                color: textColor
            }
        },
        xaxis: {
            title: {
                text: getI18nText(lang).x_axis_minimum_wage,
                standoff: 14
            },
            range: [0.75, 6.05],
            showgrid: false,
            zeroline: false,
            linecolor: axisColor,
            tickcolor: axisColor,
            ticks: "outside",
            tickvals: [1, 2, 3, 4, 5, 6],
            ticktext: ["1", "2", "3", "4", "5", "6"]
        },
        yaxis: {
            title: {
                text: yAxisTitle,
                standoff: 16
            },
            gridcolor: gridColor,
            zeroline: false,
            linecolor: axisColor,
            tickcolor: axisColor
        },
        legend: {
            orientation: "h",
            x: 0.5,
            xanchor: "center",
            y: -0.24,
            yanchor: "top"
        }
    };
}


function belgiumPlot(elementId, traces, layout) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    Plotly.newPlot(
        element,
        traces,
        layout,
        {
            responsive: true,
            displayModeBar: false
        }
    );
}


function renderBelgiumMetrics(lang) {
    const profileId = getBelgiumSelectedProfile(lang);
    const profileData = getBelgiumProfileData(profileId);
    const referenceRow = profileData.find(row => deNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-belgium-reference-wage-" + lang,
        deEuro(referenceRow.gross_monthly_eur, lang) + " €"
    );

    setTextContent(
        "metric-belgium-employee-rate-" + lang,
        dePct(referenceRow.employee_contribution_rate, lang)
    );

    setTextContent(
        "metric-belgium-employer-rate-" + lang,
        dePct(referenceRow.employer_contribution_rate, lang)
    );

    const costToNetAfterTax = (
        referenceRow.cost_to_net_after_withholding_tax_ratio
        || referenceRow.cost_to_net_ratio
    );

    setTextContent(
        "metric-belgium-cost-to-net-" + lang,
        deRatio(costToNetAfterTax, lang)
    );
}


function renderBelgiumWaterfallChart(lang) {
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);

    if (!data.length) {
        return;
    }

    const selectedMultiple = getBelgiumWaterfallMultiple(lang);
    const row = findBelgiumClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = deNum(row.smic_multiple);

    const netAfterTax = deNum(row.net_after_withholding_tax_monthly_eur);
    const withholdingTax = deNum(row.withholding_tax_monthly_eur);
    const netBeforeTax = deNum(row.net_before_income_tax_monthly_eur);
    const employeeContrib = deNum(row.employee_contributions_monthly_eur);
    const gross = deNum(row.gross_monthly_eur);

    const employerContribBeforeReduction = deNum(
        row.employer_contributions_before_reduction_monthly_eur
    );

    const structuralReduction = -deNum(
        row.structural_reduction_monthly_eur
    );

    const employerCost = deNum(row.employer_cost_monthly_eur);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " minimum wage(s)"
        : actualMultiple.toFixed(2).replace(".", ",") + " salaire(s) minimum(s)";

    setTextContent(
        "belgium-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Décomposition à ") + multipleLabel
    );

    setTextContent(
        "belgium-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after withholding tax "
                + "to total employer cost, for a gross wage of "
                + deEuro(gross, lang) + " €."
            : "Décomposition détaillée du passage du salaire net après précompte "
                + "au coût employeur total, pour un salaire brut de "
                + deEuro(gross, lang) + " €."
    );

    const labels = lang === "en"
        ? [
            "Net after withholding tax",
            "Withholding tax",
            "Net before withholding tax",
            "Employee contributions",
            "Gross wage",
            "Employer contributions",
            "Structural reduction",
            "Employer cost"
        ]
        : [
            "Net après précompte",
            "Précompte",
            "Net avant précompte",
            "Cotisations salarié",
            "Salaire brut",
            "Cotisations employeur",
            "Réduction structurelle",
            "Coût employeur"
        ];

    const traces = [
        {
            type: "waterfall",
            orientation: "v",
            measure: [
                "absolute",
                "relative",
                "total",
                "relative",
                "total",
                "relative",
                "relative",
                "total"
            ],
            x: labels,
            y: [
                netAfterTax,
                withholdingTax,
                netBeforeTax,
                employeeContrib,
                gross,
                employerContribBeforeReduction,
                structuralReduction,
                employerCost
            ],
            text: [
                deEuro(netAfterTax, lang) + " €",
                "+" + deEuro(withholdingTax, lang) + " €",
                deEuro(netBeforeTax, lang) + " €",
                "+" + deEuro(employeeContrib, lang) + " €",
                deEuro(gross, lang) + " €",
                "+" + deEuro(employerContribBeforeReduction, lang) + " €",
                deEuro(structuralReduction, lang) + " €",
                deEuro(employerCost, lang) + " €"
            ],
            textposition: "outside",
            cliponaxis: false,
            connector: {
                line: {
                    color: "rgba(100, 116, 139, 0.45)"
                }
            },
            increasing: {
                marker: {
                    color: BELGIUM_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: BELGIUM_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: BELGIUM_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} €<extra></extra>"
        }
    ];

    const layout = belgiumBaseLayout(lang, getI18nText(lang).y_amount);

    layout.xaxis.title = {
        text: ""
    };

    layout.xaxis.type = "category";
    layout.xaxis.tickangle = -35;
    layout.xaxis.automargin = true;
    layout.xaxis.showgrid = false;

    delete layout.xaxis.range;
    delete layout.xaxis.tickvals;
    delete layout.xaxis.ticktext;

    layout.yaxis.ticksuffix = " €";
    layout.showlegend = false;

    layout.margin = {
        l: 82,
        r: 28,
        t: 34,
        b: 125
    };

    belgiumPlot(
        "chart-belgium-waterfall-" + lang,
        traces,
        layout
    );
}

function renderBelgiumCostChart(lang) {
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);
    const t = getI18nText(lang);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => deNum(row.net_before_income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before withholding tax" : "Net avant précompte",
            line: {
                color: BELGIUM_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Net before withholding tax: %{y:,.0f} €<extra></extra>" : "Net avant précompte : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.net_after_withholding_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after withholding tax" : "Net après précompte",
            line: {
                color: BELGIUM_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Net after withholding tax: %{y:,.0f} €<extra></extra>" : "Net après précompte : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.gross_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: BELGIUM_COLORS.gross,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                t.gross_wage + " : %{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_cost_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: BELGIUM_COLORS.employer,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                t.employer_cost + " : %{y:,.0f} €<extra></extra>"
        }
    ];

    const layout = belgiumBaseLayout(lang, t.y_amount);

    layout.yaxis.ticksuffix = " €";

    belgiumPlot(
        "chart-belgium-cost-" + lang,
        traces,
        layout
    );
}


function renderBelgiumContributionRateChart(lang) {
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => deNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate" : "Taux salarié",
            line: {
                color: BELGIUM_COLORS.employee,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Employee rate: %{y:.1f} %<extra></extra>" : "Taux salarié : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.employer_contribution_rate_before_reduction)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate before reduction" : "Taux employeur avant réduction",
            line: {
                color: BELGIUM_COLORS.employer,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Before reduction: %{y:.1f} %<extra></extra>" : "Avant réduction : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate after reduction" : "Taux employeur après réduction",
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "After reduction: %{y:.1f} %<extra></extra>" : "Après réduction : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = belgiumBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 35];

    belgiumPlot(
        "chart-belgium-rates-" + lang,
        traces,
        layout
    );
}


function renderBelgiumStructuralReductionChart(lang) {
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => deNum(row.structural_reduction_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Structural reduction" : "Réduction structurelle",
            line: {
                color: BELGIUM_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Structural reduction: %{y:,.0f} €<extra></extra>" : "Réduction structurelle : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_contributions_before_reduction_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer contributions before reduction" : "Cotisations employeur avant réduction",
            line: {
                color: BELGIUM_COLORS.employer,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Before reduction: %{y:,.0f} €<extra></extra>" : "Cotisations avant réduction : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_contributions_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer contributions after reduction" : "Cotisations employeur après réduction",
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "After reduction: %{y:,.0f} €<extra></extra>" : "Cotisations après réduction : %{y:,.0f} €<extra></extra>")
        }
    ];

    const layout = belgiumBaseLayout(lang, getI18nText(lang).y_amount);

    layout.yaxis.ticksuffix = " €";

    belgiumPlot(
        "chart-belgium-structural-reduction-" + lang,
        traces,
        layout
    );
}


function renderBelgiumWedgeChart(lang) {
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);
    const t = getI18nText(lang);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => (
                deNum(row.social_wedge_monthly_eur)
                / deNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / coût employeur",
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.total_wedge_after_withholding_tax_monthly_eur)
                / deNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / coût employeur",
            line: {
                color: BELGIUM_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before withholding tax" : "Ratio coût / net avant précompte",
            yaxis: "y2",
            line: {
                color: BELGIUM_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Cost / net before withholding tax: %{y:.2f}<extra></extra>" : "Coût / net avant précompte : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.cost_to_net_after_withholding_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after withholding tax" : "Ratio coût / net après précompte",
            yaxis: "y2",
            line: {
                color: BELGIUM_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Cost / net after withholding tax: %{y:.2f}<extra></extra>" : "Coût / net après précompte : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = belgiumBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / coût employeur");

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 70];

    layout.yaxis2 = {
        title: {
            text: t.cost_net_ratio,
            standoff: 16
        },
        overlaying: "y",
        side: "right",
        range: [1, 3],
        zeroline: false,
        showgrid: false
    };

    belgiumPlot(
        "chart-belgium-wedge-" + lang,
        traces,
        layout
    );
}


function renderBelgiumFiscalReturnChart(lang) {
    const target = document.getElementById("chart-belgium-fiscal-return-" + lang);

    if (!target) {
        return;
    }

    const profileId = getBelgiumSelectedProfile(lang);

    const data = getBelgiumProfileData(profileId).filter(row => (
        Number.isFinite(deNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(deNum(row.marginal_net_after_withholding_tax_rate))
        && Number.isFinite(deNum(row.marginal_social_wedge_rate))
        && Number.isFinite(deNum(row.marginal_total_wedge_after_withholding_tax_rate))
        && deNum(row.delta_gross_monthly_eur) > 0
    ));

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before withholding tax" : "Avant précompte",
            line: {
                color: BELGIUM_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Before withholding tax: %{y:.1f} %<extra></extra>" : "Avant précompte : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_net_after_withholding_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After withholding tax" : "Après précompte",
            line: {
                color: BELGIUM_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "After withholding tax: %{y:.1f} %<extra></extra>" : "Après précompte : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Social effect: %{y:.1f} %<extra></extra>" : "Effet social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_total_wedge_after_withholding_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prélèvement marginal total",
            line: {
                color: BELGIUM_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prélèvement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = belgiumBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional euro of gross wage (%)"
            : "Part d'un euro supplémentaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    belgiumPlot(
        "chart-belgium-fiscal-return-" + lang,
        traces,
        layout
    );
}


function renderBelgiumDataTable(lang) {
    const tableBody = getI18nElement("belgium-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const profileId = getBelgiumSelectedDataProfile(lang);

    const profileLabels = {
        fr: {
            belgium__standard_private_sector: "Secteur privé standard"
        },
        en: {
            belgium__standard_private_sector: "Standard private sector"
        }
    };

    const caption = getI18nElement("belgium-data-profile-caption", lang);

    if (caption) {
        caption.textContent = (profileLabels[lang] || profileLabels.fr)[profileId] || profileId;
    }

    const data = getBelgiumProfileData(profileId);

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            deRatio(row.smic_multiple, lang),
            deEuro(row.gross_monthly_eur, lang),
            deEuro(row.net_before_income_tax_monthly_eur, lang),
            deEuro(row.withholding_tax_monthly_eur, lang),
            deEuro(row.net_after_withholding_tax_monthly_eur, lang),
            deEuro(row.employer_cost_monthly_eur, lang),
            deEuro(row.employee_contributions_monthly_eur, lang),
            deEuro(row.employer_contributions_monthly_eur, lang),
            deEuro(row.social_wedge_monthly_eur, lang),
            deEuro(row.total_wedge_after_withholding_tax_monthly_eur, lang),
            dePct(row.employee_contribution_rate, lang),
            dePct(row.employer_contribution_rate, lang),
            deRatio(row.cost_to_net_ratio, lang),
            deRatio(row.cost_to_net_after_withholding_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}

function renderBelgium(lang) {
    renderBelgiumMetrics(lang);
    renderBelgiumWaterfallChart(lang);
    renderBelgiumCostChart(lang);
    renderBelgiumContributionRateChart(lang);
    renderBelgiumStructuralReductionChart(lang);
    renderBelgiumWedgeChart(lang);
    renderBelgiumFiscalReturnChart(lang);
    renderBelgiumDataTable(lang);
}


function computeBelgiumFlclIndicators(row) {
    const net = deNum(row.net_before_income_tax_monthly_eur);
    const employerCost = deNum(row.employer_cost_monthly_eur);
    const structuralReduction = deNum(row.structural_reduction_monthly_eur);

    const flclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclB = 100 - flclE;

    const costWithoutReduction = employerCost + structuralReduction;
    const flclEWithoutReduction = costWithoutReduction > 0
        ? 100 * net / costWithoutReduction
        : 0;
    const flclR = flclE - flclEWithoutReduction;

    return {
        flclE,
        flclB,
        flclR
    };
}


function renderBelgiumFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);
    const row = findBelgiumClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeBelgiumFlclIndicators(row);

    setTextContent("belgium-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("belgium-flcl-b-value-" + lang, indicators.flclB.toFixed(1));
    setTextContent("belgium-flcl-r-value-" + lang, "+" + indicators.flclR.toFixed(1) + " pts");

    setTextContent("belgium-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " € " + t.flcl_e_desc);
    setTextContent("belgium-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
    setTextContent("belgium-flcl-r-caption-" + lang, t.flcl_r_desc);
}


function renderBelgiumFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = deNum(data[i].net_before_income_tax_monthly_eur) - deNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = deNum(data[i].employer_cost_monthly_eur) - deNum(data[i - 1].employer_cost_monthly_eur);
        const deltaMultiple = deNum(data[i].smic_multiple) - deNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeBelgiumFlclIndicators(data[i]);
            const previous = computeBelgiumFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: deNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findBelgiumClosestRow(marginalRows, 1.0);
    const oneRow = findBelgiumClosestRow(data, 1.0);
    const threeRow = findBelgiumClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeBelgiumFlclIndicators(oneRow).flclE - computeBelgiumFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("belgium-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("belgium-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("belgium-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("belgium-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("belgium-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("belgium-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("belgium-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("belgium-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderBelgiumFlclEChart(lang) {
    const t = getI18nText(lang);
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => computeBelgiumFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: BELGIUM_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = belgiumBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    belgiumPlot("chart-belgium-flcl-e-" + lang, traces, layout);
}


function renderBelgiumFlclRChart(lang) {
    const t = getI18nText(lang);
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => computeBelgiumFlclIndicators(row).flclR),
            type: "scatter",
            mode: "lines",
            name: t.flcl_r,
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Efficiency gain" : "Gain d’efficacité") + " : %{y:.1f} pts<extra></extra>"
        }
    ];

    const layout = belgiumBaseLayout(
        lang,
        lang === "en" ? "Efficiency gain, points" : "Gain d’efficacité, points"
    );
    layout.height = 400;

    belgiumPlot("chart-belgium-flcl-r-" + lang, traces, layout);
}


function renderBelgiumFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = deNum(data[i].net_before_income_tax_monthly_eur) - deNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = deNum(data[i].employer_cost_monthly_eur) - deNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(deNum(data[i].smic_multiple));
        transmission.push(transmissionRate * 100);
        capture.push((1 - transmissionRate) * 100);
    }

    const traces = [
        {
            x: x,
            y: transmission,
            mode: "lines",
            name: t.marginal_transmission,
            line: {
                color: BELGIUM_COLORS.net,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = belgiumBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    belgiumPlot("chart-belgium-flcl-marginal-" + lang, traces, layout);
}


function renderBelgiumFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeBelgiumFlclIndicators(data[i]);
        const previous = computeBelgiumFlclIndicators(data[i - 1]);
        const deltaMultiple = deNum(data[i].smic_multiple) - deNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(deNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: BELGIUM_COLORS.employee,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                (lang === "en" ? "Change in Lab-E" : "Variation de Lab-E") + " : %{y:.2f}<extra></extra>"
        }
    ];

    const layout = belgiumBaseLayout(
        lang,
        lang === "en" ? "Lab-E points per minimum wage" : "Points de Lab-E par RMMMG"
    );
    layout.height = 400;

    layout.shapes = [{
        type: "line",
        xref: "paper",
        yref: "y",
        x0: 0,
        x1: 1,
        y0: 0,
        y1: 0,
        line: {
            color: "#94a3b8",
            dash: "dash",
            width: 1.5
        }
    }];

    belgiumPlot("chart-belgium-flcl-progressivity-" + lang, traces, layout);
}


function renderBelgiumFlclMarginalDestinationChart(lang) {
    const profileId = getBelgiumSelectedProfile(lang);
    const data = getBelgiumProfileData(profileId);

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = deNum(data[i].employer_cost_monthly_eur) - deNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = deNum(data[i].net_before_income_tax_monthly_eur) - deNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaEmployee = deNum(data[i].employee_contributions_monthly_eur) - deNum(data[i - 1].employee_contributions_monthly_eur);
        const deltaEmployer = deNum(data[i].employer_contributions_monthly_eur) - deNum(data[i - 1].employer_contributions_monthly_eur);

        x.push(deNum(data[i].smic_multiple));
        netShare.push(100 * deltaNet / deltaCost);
        employeeShare.push(100 * deltaEmployee / deltaCost);
        employerShare.push(100 * deltaEmployer / deltaCost);
    }

    const traces = [
        {
            x: x,
            y: netShare,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Net wage" : "Salaire net",
            line: {
                color: BELGIUM_COLORS.net,
                width: 2
            }
        },
        {
            x: x,
            y: employeeShare,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Employee contributions" : "Cotisations salarié",
            line: {
                color: BELGIUM_COLORS.employee,
                width: 2
            }
        },
        {
            x: x,
            y: employerShare,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Employer contributions" : "Cotisations employeur",
            line: {
                color: BELGIUM_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = belgiumBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional euro, %"
            : "Destination marginale d’un euro supplémentaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    belgiumPlot("chart-belgium-flcl-destination-" + lang, traces, layout);
}


function renderBelgiumFlclIndex(lang) {
    renderBelgiumFlclIndexCards(lang);
    renderBelgiumFlclMarginalCards(lang);
    renderBelgiumFlclEChart(lang);
    renderBelgiumFlclRChart(lang);
    renderBelgiumFlclMarginalChart(lang);
    renderBelgiumFlclProgressivityChart(lang);
    renderBelgiumFlclMarginalDestinationChart(lang);
}


function belgiumOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderBelgium(lang);
    }

    if (tabName === "data") {
        renderBelgiumDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderBelgiumFlclIndex(lang);
    }
}


function showBelgiumTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: BELGIUM_TAB_STORAGE_KEY,
        onShow: belgiumOnTabShow
    });
}


function switchBelgiumLanguage() {
    switchLangLanguage({
        storageKey: BELGIUM_LANGUAGE_STORAGE_KEY,
        tabStorageKey: BELGIUM_TAB_STORAGE_KEY,
        onShow: belgiumOnTabShow
    });
}


function setupBelgiumEvents() {
    ["fr", "en"].forEach(function(lang) {
        const profileSelect = getI18nElement("belgium-profile-select", lang);
        const dataProfileSelect = getI18nElement("belgium-data-profile-select", lang);
        const waterfallMultipleSelect = getI18nElement("belgium-waterfall-multiple", lang);

        if (profileSelect) {
            profileSelect.addEventListener("change", function() {
                renderBelgium(lang);
                renderBelgiumFlclIndex(lang);
            });
        }

        if (dataProfileSelect) {
            dataProfileSelect.addEventListener("change", function() {
                renderBelgiumDataTable(lang);
            });
        }

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderBelgiumWaterfallChart(lang);
            });
        }
    });
}


applyStoredBelgiumTheme();


Papa.parse(
    BELGIUM_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            BELGIUM_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => (
                    deNum(a.smic_multiple)
                    - deNum(b.smic_multiple)
                ));

            console.log(
                "Belgium Labour Cost Lab data loaded:",
                BELGIUM_DATA.length,
                "rows"
            );

            setupBelgiumEvents();

            const initialLang = localStorage.getItem(BELGIUM_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: BELGIUM_LANGUAGE_STORAGE_KEY,
                tabStorageKey: BELGIUM_TAB_STORAGE_KEY,
                onShow: belgiumOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Belgium CSV loading error:",
                error
            );
        }
    }
);
