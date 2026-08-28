const SWEDEN_DATA_PATH = "../../data/sweden/sweden_labour_cost_grid_2026.csv";
const SWEDEN_LANGUAGE_STORAGE_KEY = "sweden_language";
const SWEDEN_TAB_STORAGE_KEY = "sweden_tab";
const SWEDEN_PROFILE_ID = "sweden__standard_employee_stockholm";

let SWEDEN_DATA = [];


function applyStoredSwedenTheme() {
    const storedTheme = localStorage.getItem("sweden-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateSwedenThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateSwedenThemeButton("light");
    }
}


function updateSwedenThemeButton(theme) {
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
        localStorage.setItem("sweden-theme", "dark");
        updateSwedenThemeButton("dark");
    } else {
        localStorage.setItem("sweden-theme", "light");
        updateSwedenThemeButton("light");
    }

    renderSweden(getActiveI18nLanguage(SWEDEN_LANGUAGE_STORAGE_KEY));
}


const SWEDEN_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    incomeTax: "#0d9488",
    statligSkatt: "#a16207",
    jobbskatteavdrag: "#65a30d",
    wedge: "#f97316",
    total: "#0f172a"
};


function seNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function seLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function sek(value, lang) {
    return seNum(value).toLocaleString(
        seLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function sePct(value, lang) {
    return (seNum(value) * 100).toLocaleString(
        seLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function seRatio(value, lang) {
    const text = seNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getSwedenWaterfallMultiple(lang) {
    const select = getI18nElement("sweden-waterfall-multiple", lang);

    if (!select) {
        return 2.00;
    }

    return seNum(select.value);
}


function getSwedenData() {
    return SWEDEN_DATA
        .filter(row => row.profile_id === SWEDEN_PROFILE_ID)
        .sort((a, b) => seNum(a.smic_multiple) - seNum(b.smic_multiple));
}


function findSwedenClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            seNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            seNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function swedenBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en" ? "Multiple of the Swedish reference wage" : "Multiple du salaire de référence suédois",
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


function swedenPlot(elementId, traces, layout) {
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


function renderSwedenMetrics(lang) {
    const data = getSwedenData();
    const referenceRow = data.find(row => seNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-sweden-reference-wage-" + lang,
        sek(referenceRow.gross_monthly_sek, lang) + " SEK"
    );

    const incomeTaxRate = (
        seNum(referenceRow.income_tax_monthly_sek)
        / seNum(referenceRow.gross_monthly_sek)
    );

    setTextContent(
        "metric-sweden-income-tax-rate-" + lang,
        sePct(incomeTaxRate, lang)
    );

    setTextContent(
        "metric-sweden-employer-rate-" + lang,
        sePct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-sweden-cost-to-net-" + lang,
        seRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );
}


function renderSwedenWaterfallChart(lang) {
    const data = getSwedenData();

    if (!data.length) {
        return;
    }

    const selectedMultiple = getSwedenWaterfallMultiple(lang);
    const row = findSwedenClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = seNum(row.smic_multiple);

    const netAfterTax = seNum(row.net_after_income_tax_monthly_sek);
    const incomeTax = seNum(row.income_tax_monthly_sek);
    const netBeforeTax = seNum(row.net_before_income_tax_monthly_sek);
    const employeeContrib = seNum(row.employee_contributions_monthly_sek);
    const gross = seNum(row.gross_monthly_sek);
    const employerContrib = seNum(row.employer_contributions_monthly_sek);
    const employerCost = seNum(row.employer_cost_monthly_sek);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " reference wage(s)"
        : actualMultiple.toFixed(2).replace(".", ",") + " salaire(s) de référence";

    setTextContent(
        "sweden-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Décomposition à ") + multipleLabel
    );

    setTextContent(
        "sweden-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + sek(gross, lang) + " SEK."
            : "Décomposition détaillée du passage du salaire net après impôt "
                + "au coût employeur total, pour un salaire brut de "
                + sek(gross, lang) + " SEK."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Income tax",
            "Net before tax",
            "Employee contribution",
            "Gross wage",
            "Arbetsgivaravgifter",
            "Employer cost"
        ]
        : [
            "Net après impôt",
            "Impôt sur le revenu",
            "Net avant impôt",
            "Cotisation salariale",
            "Salaire brut",
            "Arbetsgivaravgifter",
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
                "total"
            ],
            x: labels,
            y: [
                netAfterTax,
                incomeTax,
                netBeforeTax,
                employeeContrib,
                gross,
                employerContrib,
                employerCost
            ],
            text: [
                sek(netAfterTax, lang) + " SEK",
                "+" + sek(incomeTax, lang) + " SEK",
                sek(netBeforeTax, lang) + " SEK",
                "+" + sek(employeeContrib, lang) + " SEK",
                sek(gross, lang) + " SEK",
                "+" + sek(employerContrib, lang) + " SEK",
                sek(employerCost, lang) + " SEK"
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
                    color: SWEDEN_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: SWEDEN_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: SWEDEN_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} SEK<extra></extra>"
        }
    ];

    const layout = swedenBaseLayout(lang, lang === "en" ? "Monthly amount, SEK" : "Montant mensuel, SEK");

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

    layout.yaxis.ticksuffix = " SEK";
    layout.showlegend = false;

    layout.margin = {
        l: 82,
        r: 28,
        t: 34,
        b: 125
    };

    swedenPlot(
        "chart-sweden-waterfall-" + lang,
        traces,
        layout
    );
}


function renderSwedenCostChart(lang) {
    const data = getSwedenData();
    const t = getI18nText(lang);

    const x = data.map(row => seNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => seNum(row.gross_monthly_sek)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: SWEDEN_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} SEK<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => seNum(row.net_before_income_tax_monthly_sek)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impôt",
            line: {
                color: SWEDEN_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} SEK<extra></extra>" : "Net avant impôt : %{y:,.0f} SEK<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => seNum(row.net_after_income_tax_monthly_sek)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net après impôt",
            line: {
                color: SWEDEN_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} SEK<extra></extra>" : "Net après impôt : %{y:,.0f} SEK<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => seNum(row.employer_cost_monthly_sek)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: SWEDEN_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} SEK<extra></extra>"
        }
    ];

    const layout = swedenBaseLayout(lang, lang === "en" ? "Monthly amount, SEK" : "Montant mensuel, SEK");

    layout.yaxis.ticksuffix = " SEK";

    swedenPlot(
        "chart-sweden-cost-" + lang,
        traces,
        layout
    );
}


function renderSwedenRateChart(lang) {
    const data = getSwedenData();

    const x = data.map(row => seNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => seNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate" : "Taux salarié",
            line: {
                color: SWEDEN_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee contribution: %{y:.1f} %<extra></extra>" : "Cotisation salariale : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => seNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate (arbetsgivaravgifter)" : "Taux employeur (arbetsgivaravgifter)",
            line: {
                color: SWEDEN_COLORS.employer,
                width: 3,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Arbetsgivaravgifter: %{y:.1f} %<extra></extra>" : "Arbetsgivaravgifter : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                seNum(row.income_tax_monthly_sek)
                / seNum(row.gross_monthly_sek)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective income tax rate" : "Taux d'imposition effectif",
            line: {
                color: SWEDEN_COLORS.incomeTax,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Income tax: %{y:.1f} %<extra></extra>" : "Impôt sur le revenu : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = swedenBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 50];

    swedenPlot(
        "chart-sweden-rates-" + lang,
        traces,
        layout
    );
}


function renderSwedenTaxBreakdownChart(lang) {
    const data = getSwedenData();

    const x = data.map(row => seNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => seNum(row.kommunalskatt_annual_sek) / 12),
            type: "scatter",
            mode: "lines",
            name: "Kommunalskatt",
            line: {
                color: SWEDEN_COLORS.incomeTax,
                width: 2
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} SEK<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => seNum(row.statlig_skatt_annual_sek) / 12),
            type: "scatter",
            mode: "lines",
            name: "Statlig inkomstskatt",
            line: {
                color: SWEDEN_COLORS.statligSkatt,
                width: 2
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} SEK<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => -seNum(row.jobbskatteavdrag_annual_sek) / 12),
            type: "scatter",
            mode: "lines",
            name: "Jobbskatteavdrag",
            line: {
                color: SWEDEN_COLORS.jobbskatteavdrag,
                width: 2,
                dash: "dash"
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} SEK<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => seNum(row.income_tax_monthly_sek)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total income tax" : "Impôt sur le revenu total",
            line: {
                color: SWEDEN_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} SEK<extra></extra>"
        }
    ];

    const layout = swedenBaseLayout(lang, lang === "en" ? "Monthly amount, SEK" : "Montant mensuel, SEK");

    layout.yaxis.ticksuffix = " SEK";

    swedenPlot(
        "chart-sweden-tax-breakdown-" + lang,
        traces,
        layout
    );
}


function renderSwedenWedgeChart(lang) {
    const data = getSwedenData();
    const t = getI18nText(lang);

    const x = data.map(row => seNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                seNum(row.social_wedge_monthly_sek)
                / seNum(row.employer_cost_monthly_sek)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / coût employeur",
            line: {
                color: SWEDEN_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                seNum(row.total_wedge_after_income_tax_monthly_sek)
                / seNum(row.employer_cost_monthly_sek)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / coût employeur",
            line: {
                color: SWEDEN_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => seNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio coût / net avant impôt",
            yaxis: "y2",
            line: {
                color: SWEDEN_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Coût / net avant impôt : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => seNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio coût / net après impôt",
            yaxis: "y2",
            line: {
                color: SWEDEN_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Coût / net après impôt : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = swedenBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / coût employeur");

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

    swedenPlot(
        "chart-sweden-wedge-" + lang,
        traces,
        layout
    );
}


function renderSwedenFiscalReturnChart(lang) {
    const target = document.getElementById("chart-sweden-fiscal-return-" + lang);

    if (!target) {
        return;
    }

    const data = getSwedenData().filter(row => (
        Number.isFinite(seNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(seNum(row.marginal_net_after_income_tax_rate))
        && Number.isFinite(seNum(row.marginal_social_wedge_rate))
        && Number.isFinite(seNum(row.marginal_total_wedge_after_income_tax_rate))
        && seNum(row.delta_gross_monthly_sek) > 0
    ));

    const x = data.map(row => seNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                seNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impôt",
            line: {
                color: SWEDEN_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impôt : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                seNum(row.marginal_net_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Après impôt",
            line: {
                color: SWEDEN_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "After tax: %{y:.1f} %<extra></extra>" : "Après impôt : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                seNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: SWEDEN_COLORS.wedge,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social effect: %{y:.1f} %<extra></extra>" : "Effet social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                seNum(row.marginal_total_wedge_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prélèvement marginal total",
            line: {
                color: SWEDEN_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prélèvement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = swedenBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional krona of gross wage (%)"
            : "Part d'une couronne supplémentaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    swedenPlot(
        "chart-sweden-fiscal-return-" + lang,
        traces,
        layout
    );
}


function renderSwedenDataTable(lang) {
    const tableBody = getI18nElement("sweden-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const caption = getI18nElement("sweden-data-caption", lang);

    if (caption) {
        caption.textContent = lang === "en" ? "Standard employee (Stockholm)" : "Salarié standard (Stockholm)";
    }

    const data = getSwedenData();

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            seRatio(row.smic_multiple, lang),
            sek(row.gross_monthly_sek, lang),
            sek(row.net_before_income_tax_monthly_sek, lang),
            sek(row.income_tax_monthly_sek, lang),
            sek(row.net_after_income_tax_monthly_sek, lang),
            sek(row.employer_cost_monthly_sek, lang),
            sek(row.employee_contributions_monthly_sek, lang),
            sek(row.employer_contributions_monthly_sek, lang),
            sek(row.social_wedge_monthly_sek, lang),
            sek(row.total_wedge_after_income_tax_monthly_sek, lang),
            sePct(row.employer_contribution_rate, lang),
            seRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderSweden(lang) {
    renderSwedenMetrics(lang);
    renderSwedenWaterfallChart(lang);
    renderSwedenCostChart(lang);
    renderSwedenRateChart(lang);
    renderSwedenTaxBreakdownChart(lang);
    renderSwedenWedgeChart(lang);
    renderSwedenFiscalReturnChart(lang);
    renderSwedenDataTable(lang);
}


function computeSwedenFlclIndicators(row) {
    const net = seNum(row.net_before_income_tax_monthly_sek);
    const employerCost = seNum(row.employer_cost_monthly_sek);

    // Lab-E is analytically a flat constant for Sweden (net before income
    // tax = gross exactly, employer_cost = gross x a flat, uncapped rate):
    // rounding to 4 decimal places suppresses sub-basis-point noise from
    // rounding employer contributions to the nearest ore, which otherwise
    // gets amplified into a false sawtooth once the chart auto-scales to
    // this indicator's tiny real range.
    const rawFlclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclE = Math.round(rawFlclE * 10000) / 10000;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderSwedenFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getSwedenData();
    const row = findSwedenClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeSwedenFlclIndicators(row);

    setTextContent("sweden-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("sweden-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("sweden-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " SEK " + t.flcl_e_desc);
    setTextContent("sweden-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderSwedenFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getSwedenData();

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = seNum(data[i].net_before_income_tax_monthly_sek) - seNum(data[i - 1].net_before_income_tax_monthly_sek);
        const deltaCost = seNum(data[i].employer_cost_monthly_sek) - seNum(data[i - 1].employer_cost_monthly_sek);
        const deltaMultiple = seNum(data[i].smic_multiple) - seNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeSwedenFlclIndicators(data[i]);
            const previous = computeSwedenFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: seNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findSwedenClosestRow(marginalRows, 1.0);
    const oneRow = findSwedenClosestRow(data, 1.0);
    const threeRow = findSwedenClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeSwedenFlclIndicators(oneRow).flclE - computeSwedenFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("sweden-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("sweden-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("sweden-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("sweden-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("sweden-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("sweden-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("sweden-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("sweden-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderSwedenFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getSwedenData();

    const traces = [
        {
            x: data.map(row => seNum(row.smic_multiple)),
            y: data.map(row => computeSwedenFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: SWEDEN_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × ref. wage<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = swedenBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    swedenPlot("chart-sweden-flcl-e-" + lang, traces, layout);
}


function renderSwedenFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getSwedenData();

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = seNum(data[i].net_before_income_tax_monthly_sek) - seNum(data[i - 1].net_before_income_tax_monthly_sek);
        const deltaCost = seNum(data[i].employer_cost_monthly_sek) - seNum(data[i - 1].employer_cost_monthly_sek);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(seNum(data[i].smic_multiple));
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
                color: SWEDEN_COLORS.incomeTax,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: SWEDEN_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = swedenBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    swedenPlot("chart-sweden-flcl-marginal-" + lang, traces, layout);
}


function renderSwedenFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getSwedenData();

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeSwedenFlclIndicators(data[i]);
        const previous = computeSwedenFlclIndicators(data[i - 1]);
        const deltaMultiple = seNum(data[i].smic_multiple) - seNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(seNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: SWEDEN_COLORS.employee,
                width: 3
            }
        }
    ];

    const layout = swedenBaseLayout(
        lang,
        lang === "en" ? "Lab-E points per reference wage" : "Points de Lab-E par salaire de référence"
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

    swedenPlot("chart-sweden-flcl-progressivity-" + lang, traces, layout);
}


function renderSwedenFlclMarginalDestinationChart(lang) {
    const data = getSwedenData();

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = seNum(data[i].employer_cost_monthly_sek) - seNum(data[i - 1].employer_cost_monthly_sek);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = seNum(data[i].net_before_income_tax_monthly_sek) - seNum(data[i - 1].net_before_income_tax_monthly_sek);
        const deltaEmployee = seNum(data[i].employee_contributions_monthly_sek) - seNum(data[i - 1].employee_contributions_monthly_sek);
        const deltaEmployer = seNum(data[i].employer_contributions_monthly_sek) - seNum(data[i - 1].employer_contributions_monthly_sek);

        x.push(seNum(data[i].smic_multiple));
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
                color: SWEDEN_COLORS.net,
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
                color: SWEDEN_COLORS.employee,
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
                color: SWEDEN_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = swedenBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional krona, %"
            : "Destination marginale d'une couronne supplémentaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    swedenPlot("chart-sweden-flcl-destination-" + lang, traces, layout);
}


function renderSwedenFlclIndex(lang) {
    renderSwedenFlclIndexCards(lang);
    renderSwedenFlclMarginalCards(lang);
    renderSwedenFlclEChart(lang);
    renderSwedenFlclMarginalChart(lang);
    renderSwedenFlclProgressivityChart(lang);
    renderSwedenFlclMarginalDestinationChart(lang);
}


function swedenOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderSweden(lang);
    }

    if (tabName === "data") {
        renderSwedenDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderSwedenFlclIndex(lang);
    }
}


function showSwedenTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: SWEDEN_TAB_STORAGE_KEY,
        onShow: swedenOnTabShow
    });
}


function switchSwedenLanguage() {
    switchLangLanguage({
        storageKey: SWEDEN_LANGUAGE_STORAGE_KEY,
        tabStorageKey: SWEDEN_TAB_STORAGE_KEY,
        onShow: swedenOnTabShow
    });
}


function setupSwedenEvents() {
    ["fr", "en"].forEach(function(lang) {
        const waterfallMultipleSelect = getI18nElement("sweden-waterfall-multiple", lang);

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderSwedenWaterfallChart(lang);
            });
        }
    });
}


applyStoredSwedenTheme();


Papa.parse(
    SWEDEN_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            SWEDEN_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => (
                    seNum(a.smic_multiple)
                    - seNum(b.smic_multiple)
                ));

            console.log(
                "Sweden Labour Cost Lab data loaded:",
                SWEDEN_DATA.length,
                "rows"
            );

            setupSwedenEvents();

            const initialLang = localStorage.getItem(SWEDEN_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: SWEDEN_LANGUAGE_STORAGE_KEY,
                tabStorageKey: SWEDEN_TAB_STORAGE_KEY,
                onShow: swedenOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Sweden CSV loading error:",
                error
            );
        }
    }
);
