const NETHERLANDS_DATA_PATH = "../../data/netherlands/netherlands_labour_cost_grid_2026.csv";
const NETHERLANDS_LANGUAGE_STORAGE_KEY = "netherlands_language";
const NETHERLANDS_TAB_STORAGE_KEY = "netherlands_tab";

let NETHERLANDS_DATA = [];


function applyStoredNetherlandsTheme() {
    const storedTheme = localStorage.getItem("netherlands-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateNetherlandsThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateNetherlandsThemeButton("light");
    }
}


function updateNetherlandsThemeButton(theme) {
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
        localStorage.setItem("netherlands-theme", "dark");
        updateNetherlandsThemeButton("dark");
    } else {
        localStorage.setItem("netherlands-theme", "light");
        updateNetherlandsThemeButton("light");
    }

    renderNetherlands(getActiveI18nLanguage(NETHERLANDS_LANGUAGE_STORAGE_KEY));
}


const NETHERLANDS_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    ww: "#9333ea",
    aof: "#ea580c",
    zvw: "#0d9488",
    wko: "#a16207",
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


function nlLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function deEuro(value, lang) {
    return deNum(value).toLocaleString(
        nlLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function dePct(value, lang) {
    return (deNum(value) * 100).toLocaleString(
        nlLocale(lang),
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


function getNetherlandsSelectedProfile(lang) {
    const select = getI18nElement("netherlands-profile-select", lang);

    if (!select) {
        return "netherlands__standard_permanent_contract";
    }

    return select.value;
}

function getNetherlandsSelectedDataProfile(lang) {
    const select = getI18nElement("netherlands-data-profile-select", lang);

    if (!select) {
        return getNetherlandsSelectedProfile(lang);
    }

    return select.value;
}

function getNetherlandsWaterfallMultiple(lang) {
    const select = getI18nElement("netherlands-waterfall-multiple", lang);

    if (!select) {
        return 2.00;
    }

    return deNum(select.value);
}


function getNetherlandsProfileData(profileId) {
    return NETHERLANDS_DATA
        .filter(row => row.profile_id === profileId)
        .sort((a, b) => deNum(a.smic_multiple) - deNum(b.smic_multiple));
}


function findNetherlandsClosestRow(data, selectedMultiple) {
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


function netherlandsBaseLayout(lang, yAxisTitle) {
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


function netherlandsPlot(elementId, traces, layout) {
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


function renderNetherlandsMetrics(lang) {
    const profileId = getNetherlandsSelectedProfile(lang);
    const profileData = getNetherlandsProfileData(profileId);
    const referenceRow = profileData.find(row => deNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-netherlands-reference-wage-" + lang,
        deEuro(referenceRow.gross_monthly_eur, lang) + " €"
    );

    const loonheffingRate = (
        deNum(referenceRow.loonheffing_monthly_eur)
        / deNum(referenceRow.gross_monthly_eur)
    );

    setTextContent(
        "metric-netherlands-loonheffing-rate-" + lang,
        dePct(loonheffingRate, lang)
    );

    setTextContent(
        "metric-netherlands-employer-rate-" + lang,
        dePct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-netherlands-cost-to-net-" + lang,
        deRatio(referenceRow.cost_to_net_after_loonheffing_ratio, lang)
    );
}


function renderNetherlandsWaterfallChart(lang) {
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);

    if (!data.length) {
        return;
    }

    const selectedMultiple = getNetherlandsWaterfallMultiple(lang);
    const row = findNetherlandsClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = deNum(row.smic_multiple);

    const netAfterLoonheffing = deNum(row.net_after_loonheffing_monthly_eur);
    const loonheffing = deNum(row.loonheffing_monthly_eur);
    const gross = deNum(row.gross_monthly_eur);
    const ww = deNum(row.ww_monthly_eur);
    const aof = deNum(row.aof_monthly_eur);
    const zvw = deNum(row.zvw_monthly_eur);
    const wko = deNum(row.wko_monthly_eur);
    const employerCost = deNum(row.employer_cost_monthly_eur);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " minimum wage(s)"
        : actualMultiple.toFixed(2).replace(".", ",") + " salaire(s) minimum(s)";

    setTextContent(
        "netherlands-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Décomposition à ") + multipleLabel
    );

    setTextContent(
        "netherlands-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after loonheffing "
                + "to total employer cost (employer contributions detailed by "
                + "WW: unemployment, Aof: disability, Zvw: health and Wko: "
                + "childcare), for a gross wage of "
                + deEuro(gross, lang) + " €."
            : "Décomposition détaillée du passage du salaire net après loonheffing "
                + "au coût employeur total (cotisations employeur détaillées par "
                + "WW : chômage, Aof : invalidité, Zvw : maladie et Wko : garde "
                + "d'enfants), pour un salaire brut de "
                + deEuro(gross, lang) + " €."
    );

    const labels = lang === "en"
        ? [
            "Net after loonheffing",
            "Loonheffing",
            "Gross (= net before loonheffing)",
            "WW (unemployment)",
            "Aof (disability)",
            "Zvw (health)",
            "Wko (childcare)",
            "Employer cost"
        ]
        : [
            "Net après loonheffing",
            "Loonheffing",
            "Brut (= net avant loonheffing)",
            "WW (chômage)",
            "Aof (invalidité)",
            "Zvw (maladie)",
            "Wko (garde d'enfants)",
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
                "relative",
                "relative",
                "relative",
                "total"
            ],
            x: labels,
            y: [
                netAfterLoonheffing,
                loonheffing,
                gross,
                ww,
                aof,
                zvw,
                wko,
                employerCost
            ],
            text: [
                deEuro(netAfterLoonheffing, lang) + " €",
                "+" + deEuro(loonheffing, lang) + " €",
                deEuro(gross, lang) + " €",
                "+" + deEuro(ww, lang) + " €",
                "+" + deEuro(aof, lang) + " €",
                "+" + deEuro(zvw, lang) + " €",
                "+" + deEuro(wko, lang) + " €",
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
                    color: NETHERLANDS_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: NETHERLANDS_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: NETHERLANDS_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} €<extra></extra>"
        }
    ];

    const layout = netherlandsBaseLayout(lang, getI18nText(lang).y_amount);

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

    netherlandsPlot(
        "chart-netherlands-waterfall-" + lang,
        traces,
        layout
    );
}

function renderNetherlandsCostChart(lang) {
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);
    const t = getI18nText(lang);

    const x = data.map(row => deNum(row.smic_multiple));

    const hoverPrefix = lang === "en" ? "%{x:.2f} × WML<br>" : "%{x:.2f} × WML<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => deNum(row.gross_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Gross (= net before loonheffing)" : "Brut (= net avant loonheffing)",
            line: {
                color: NETHERLANDS_COLORS.gross,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Gross: %{y:,.0f} €<extra></extra>" : "Brut : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.net_after_loonheffing_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after loonheffing" : "Net après loonheffing",
            line: {
                color: NETHERLANDS_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after loonheffing: %{y:,.0f} €<extra></extra>" : "Net après loonheffing : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_cost_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: NETHERLANDS_COLORS.employer,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                t.employer_cost + " : %{y:,.0f} €<extra></extra>"
        }
    ];

    const layout = netherlandsBaseLayout(lang, t.y_amount);

    layout.yaxis.ticksuffix = " €";

    netherlandsPlot(
        "chart-netherlands-cost-" + lang,
        traces,
        layout
    );
}


function renderNetherlandsRateChart(lang) {
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => (
                deNum(row.loonheffing_monthly_eur)
                / deNum(row.gross_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective loonheffing rate" : "Taux de loonheffing effectif",
            line: {
                color: NETHERLANDS_COLORS.total,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Effective loonheffing: %{y:.1f} %<extra></extra>" : "Loonheffing effectif : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective employer rate" : "Taux employeur effectif",
            line: {
                color: NETHERLANDS_COLORS.employer,
                width: 3,
                dash: "dash"
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Employer rate: %{y:.1f} %<extra></extra>" : "Taux employeur : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = netherlandsBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 60];

    netherlandsPlot(
        "chart-netherlands-rates-" + lang,
        traces,
        layout
    );
}


function renderNetherlandsEmployerLeviesChart(lang) {
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => deNum(row.ww_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "WW (unemployment)" : "WW (chômage)",
            line: {
                color: NETHERLANDS_COLORS.ww,
                width: 2
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                "WW : %{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => deNum(row.aof_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Aof (disability)" : "Aof (invalidité)",
            line: {
                color: NETHERLANDS_COLORS.aof,
                width: 2
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                "Aof : %{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => deNum(row.zvw_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Zvw-werkgeversheffing (health)" : "Zvw-werkgeversheffing (maladie)",
            line: {
                color: NETHERLANDS_COLORS.zvw,
                width: 2
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                "Zvw : %{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => deNum(row.wko_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Wko (childcare)" : "Wko (garde d'enfants)",
            line: {
                color: NETHERLANDS_COLORS.wko,
                width: 2
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                "Wko : %{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_contributions_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total employer contributions" : "Total cotisations employeur",
            line: {
                color: NETHERLANDS_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Total: %{y:,.0f} €<extra></extra>" : "Total : %{y:,.0f} €<extra></extra>")
        }
    ];

    const layout = netherlandsBaseLayout(lang, getI18nText(lang).y_amount);

    layout.yaxis.ticksuffix = " €";

    netherlandsPlot(
        "chart-netherlands-employer-levies-" + lang,
        traces,
        layout
    );
}


function renderNetherlandsWedgeChart(lang) {
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);
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
                color: NETHERLANDS_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.total_wedge_after_loonheffing_monthly_eur)
                / deNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / coût employeur",
            line: {
                color: NETHERLANDS_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before loonheffing" : "Ratio coût / net avant loonheffing",
            yaxis: "y2",
            line: {
                color: NETHERLANDS_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Cost / net before loonheffing: %{y:.2f}<extra></extra>" : "Coût / net avant loonheffing : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => deNum(row.cost_to_net_after_loonheffing_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after loonheffing" : "Ratio coût / net après loonheffing",
            yaxis: "y2",
            line: {
                color: NETHERLANDS_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Cost / net after loonheffing: %{y:.2f}<extra></extra>" : "Coût / net après loonheffing : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = netherlandsBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / coût employeur");

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

    netherlandsPlot(
        "chart-netherlands-wedge-" + lang,
        traces,
        layout
    );
}


function renderNetherlandsFiscalReturnChart(lang) {
    const target = document.getElementById("chart-netherlands-fiscal-return-" + lang);

    if (!target) {
        return;
    }

    const profileId = getNetherlandsSelectedProfile(lang);

    const data = getNetherlandsProfileData(profileId).filter(row => (
        Number.isFinite(deNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(deNum(row.marginal_net_after_loonheffing_rate))
        && Number.isFinite(deNum(row.marginal_social_wedge_rate))
        && Number.isFinite(deNum(row.marginal_total_wedge_after_loonheffing_rate))
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
            name: lang === "en" ? "Before loonheffing" : "Avant loonheffing",
            line: {
                color: NETHERLANDS_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Before loonheffing: %{y:.1f} %<extra></extra>" : "Avant loonheffing : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_net_after_loonheffing_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After loonheffing" : "Après loonheffing",
            line: {
                color: NETHERLANDS_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "After loonheffing: %{y:.1f} %<extra></extra>" : "Après loonheffing : %{y:.1f} %<extra></extra>")
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
                color: NETHERLANDS_COLORS.wedge,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Social effect: %{y:.1f} %<extra></extra>" : "Effet social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_total_wedge_after_loonheffing_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prélèvement marginal total",
            line: {
                color: NETHERLANDS_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prélèvement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = netherlandsBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional euro of gross wage (%)"
            : "Part d'un euro supplémentaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    netherlandsPlot(
        "chart-netherlands-fiscal-return-" + lang,
        traces,
        layout
    );
}


function renderNetherlandsDataTable(lang) {
    const tableBody = getI18nElement("netherlands-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const profileId = getNetherlandsSelectedDataProfile(lang);

    const profileLabels = {
        fr: {
            netherlands__standard_permanent_contract: "CDI, grand employeur"
        },
        en: {
            netherlands__standard_permanent_contract: "Permanent contract, large employer"
        }
    };

    const caption = getI18nElement("netherlands-data-profile-caption", lang);

    if (caption) {
        caption.textContent = (profileLabels[lang] || profileLabels.fr)[profileId] || profileId;
    }

    const data = getNetherlandsProfileData(profileId);

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const loonheffingRate = (
            deNum(row.loonheffing_monthly_eur)
            / deNum(row.gross_monthly_eur)
        );

        const cells = [
            deRatio(row.smic_multiple, lang),
            deEuro(row.gross_monthly_eur, lang),
            deEuro(row.loonheffing_monthly_eur, lang),
            deEuro(row.net_after_loonheffing_monthly_eur, lang),
            deEuro(row.employer_cost_monthly_eur, lang),
            deEuro(row.employer_contributions_monthly_eur, lang),
            deEuro(row.social_wedge_monthly_eur, lang),
            deEuro(row.total_wedge_after_loonheffing_monthly_eur, lang),
            dePct(loonheffingRate, lang),
            dePct(row.employer_contribution_rate, lang),
            deRatio(row.cost_to_net_ratio, lang),
            deRatio(row.cost_to_net_after_loonheffing_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}

function renderNetherlands(lang) {
    renderNetherlandsMetrics(lang);
    renderNetherlandsWaterfallChart(lang);
    renderNetherlandsCostChart(lang);
    renderNetherlandsRateChart(lang);
    renderNetherlandsEmployerLeviesChart(lang);
    renderNetherlandsWedgeChart(lang);
    renderNetherlandsFiscalReturnChart(lang);
    renderNetherlandsDataTable(lang);
}


function computeNetherlandsFlclIndicators(row) {
    const net = deNum(row.net_before_income_tax_monthly_eur);
    const employerCost = deNum(row.employer_cost_monthly_eur);

    const flclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderNetherlandsFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);
    const row = findNetherlandsClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeNetherlandsFlclIndicators(row);

    setTextContent("netherlands-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("netherlands-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("netherlands-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " € " + t.flcl_e_desc);
    setTextContent("netherlands-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderNetherlandsFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = deNum(data[i].net_before_income_tax_monthly_eur) - deNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = deNum(data[i].employer_cost_monthly_eur) - deNum(data[i - 1].employer_cost_monthly_eur);
        const deltaMultiple = deNum(data[i].smic_multiple) - deNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeNetherlandsFlclIndicators(data[i]);
            const previous = computeNetherlandsFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: deNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findNetherlandsClosestRow(marginalRows, 1.0);
    const oneRow = findNetherlandsClosestRow(data, 1.0);
    const threeRow = findNetherlandsClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeNetherlandsFlclIndicators(oneRow).flclE - computeNetherlandsFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("netherlands-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("netherlands-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("netherlands-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("netherlands-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("netherlands-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("netherlands-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("netherlands-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("netherlands-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderNetherlandsFlclEChart(lang) {
    const t = getI18nText(lang);
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => computeNetherlandsFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: NETHERLANDS_COLORS.afterTax,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × WML<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = netherlandsBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    netherlandsPlot("chart-netherlands-flcl-e-" + lang, traces, layout);
}


function renderNetherlandsFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);

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
                color: NETHERLANDS_COLORS.zvw,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: NETHERLANDS_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = netherlandsBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    netherlandsPlot("chart-netherlands-flcl-marginal-" + lang, traces, layout);
}


function renderNetherlandsFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeNetherlandsFlclIndicators(data[i]);
        const previous = computeNetherlandsFlclIndicators(data[i - 1]);
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
                color: NETHERLANDS_COLORS.aof,
                width: 3
            }
        }
    ];

    const layout = netherlandsBaseLayout(
        lang,
        lang === "en" ? "Lab-E points per minimum wage" : "Points de Lab-E par WML"
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

    netherlandsPlot("chart-netherlands-flcl-progressivity-" + lang, traces, layout);
}


function renderNetherlandsFlclMarginalDestinationChart(lang) {
    const profileId = getNetherlandsSelectedProfile(lang);
    const data = getNetherlandsProfileData(profileId);

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
                color: NETHERLANDS_COLORS.afterTax,
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
                color: NETHERLANDS_COLORS.ww,
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
                color: NETHERLANDS_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = netherlandsBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional euro, %"
            : "Destination marginale d’un euro supplémentaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    netherlandsPlot("chart-netherlands-flcl-destination-" + lang, traces, layout);
}


function renderNetherlandsFlclIndex(lang) {
    renderNetherlandsFlclIndexCards(lang);
    renderNetherlandsFlclMarginalCards(lang);
    renderNetherlandsFlclEChart(lang);
    renderNetherlandsFlclMarginalChart(lang);
    renderNetherlandsFlclProgressivityChart(lang);
    renderNetherlandsFlclMarginalDestinationChart(lang);
}


function netherlandsOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderNetherlands(lang);
    }

    if (tabName === "data") {
        renderNetherlandsDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderNetherlandsFlclIndex(lang);
    }
}


function showNetherlandsTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: NETHERLANDS_TAB_STORAGE_KEY,
        onShow: netherlandsOnTabShow
    });
}


function switchNetherlandsLanguage() {
    switchLangLanguage({
        storageKey: NETHERLANDS_LANGUAGE_STORAGE_KEY,
        tabStorageKey: NETHERLANDS_TAB_STORAGE_KEY,
        onShow: netherlandsOnTabShow
    });
}


function setupNetherlandsEvents() {
    ["fr", "en"].forEach(function(lang) {
        const profileSelect = getI18nElement("netherlands-profile-select", lang);
        const dataProfileSelect = getI18nElement("netherlands-data-profile-select", lang);
        const waterfallMultipleSelect = getI18nElement("netherlands-waterfall-multiple", lang);

        if (profileSelect) {
            profileSelect.addEventListener("change", function() {
                renderNetherlands(lang);
                renderNetherlandsFlclIndex(lang);
            });
        }

        if (dataProfileSelect) {
            dataProfileSelect.addEventListener("change", function() {
                renderNetherlandsDataTable(lang);
            });
        }

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderNetherlandsWaterfallChart(lang);
            });
        }
    });
}


applyStoredNetherlandsTheme();


Papa.parse(
    NETHERLANDS_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            NETHERLANDS_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => (
                    deNum(a.smic_multiple)
                    - deNum(b.smic_multiple)
                ));

            console.log(
                "Netherlands Labour Cost Lab data loaded:",
                NETHERLANDS_DATA.length,
                "rows"
            );

            setupNetherlandsEvents();

            const initialLang = localStorage.getItem(NETHERLANDS_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: NETHERLANDS_LANGUAGE_STORAGE_KEY,
                tabStorageKey: NETHERLANDS_TAB_STORAGE_KEY,
                onShow: netherlandsOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Netherlands CSV loading error:",
                error
            );
        }
    }
);
