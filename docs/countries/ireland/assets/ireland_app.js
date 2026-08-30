const IRELAND_DATA_PATH = "../../data/ireland/ireland_labour_cost_grid_2026.csv";
const IRELAND_LANGUAGE_STORAGE_KEY = "ireland_language";
const IRELAND_TAB_STORAGE_KEY = "ireland_tab";
const IRELAND_PROFILE_ID = "ireland__standard_employee";

let IRELAND_DATA = [];


function applyStoredIrelandTheme() {
    const storedTheme = localStorage.getItem("ireland-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateIrelandThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateIrelandThemeButton("light");
    }
}


function updateIrelandThemeButton(theme) {
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
        localStorage.setItem("ireland-theme", "dark");
        updateIrelandThemeButton("dark");
    } else {
        localStorage.setItem("ireland-theme", "light");
        updateIrelandThemeButton("light");
    }

    renderIreland(getActiveI18nLanguage(IRELAND_LANGUAGE_STORAGE_KEY));
}


const IRELAND_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    incomeTax: "#0d9488",
    usc: "#a16207",
    wedge: "#f97316",
    total: "#0f172a"
};


function ieNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function ieLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function ieEuro(value, lang) {
    return ieNum(value).toLocaleString(
        ieLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function iePct(value, lang) {
    return (ieNum(value) * 100).toLocaleString(
        ieLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function ieRatio(value, lang) {
    const text = ieNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getIrelandWaterfallMultiple(lang) {
    const select = getI18nElement("ireland-waterfall-multiple", lang);

    if (!select) {
        return 2.00;
    }

    return ieNum(select.value);
}


function getIrelandData() {
    return IRELAND_DATA
        .filter(row => row.profile_id === IRELAND_PROFILE_ID)
        .sort((a, b) => ieNum(a.smic_multiple) - ieNum(b.smic_multiple));
}


function findIrelandClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            ieNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            ieNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function irelandBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en" ? "Multiple of the Irish minimum wage" : "Multiple du salaire minimum irlandais",
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


function irelandPlot(elementId, traces, layout) {
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


function renderIrelandMetrics(lang) {
    const data = getIrelandData();
    const referenceRow = data.find(row => ieNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-ireland-reference-wage-" + lang,
        ieEuro(referenceRow.gross_monthly_eur, lang) + " €"
    );

    const incomeTaxRate = (
        ieNum(referenceRow.income_tax_monthly_eur)
        / ieNum(referenceRow.gross_monthly_eur)
    );

    setTextContent(
        "metric-ireland-income-tax-rate-" + lang,
        iePct(incomeTaxRate, lang)
    );

    setTextContent(
        "metric-ireland-employer-rate-" + lang,
        iePct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-ireland-cost-to-net-" + lang,
        ieRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );
}


function renderIrelandWaterfallChart(lang) {
    const data = getIrelandData();

    if (!data.length) {
        return;
    }

    const selectedMultiple = getIrelandWaterfallMultiple(lang);
    const row = findIrelandClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = ieNum(row.smic_multiple);

    const netAfterTax = ieNum(row.net_after_income_tax_monthly_eur);
    const incomeTax = ieNum(row.income_tax_monthly_eur);
    const usc = ieNum(row.usc_monthly_eur);
    const netBeforeTax = ieNum(row.net_before_income_tax_monthly_eur);
    const employeePrsi = ieNum(row.employee_prsi_monthly_eur);
    const gross = ieNum(row.gross_monthly_eur);
    const employerPrsi = ieNum(row.employer_prsi_monthly_eur);
    const employerCost = ieNum(row.employer_cost_monthly_eur);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " minimum wage(s)"
        : actualMultiple.toFixed(2).replace(".", ",") + " salaire(s) minimum(s)";

    setTextContent(
        "ireland-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Décomposition à ") + multipleLabel
    );

    setTextContent(
        "ireland-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + ieEuro(gross, lang) + " €."
            : "Décomposition détaillée du passage du salaire net après impôt "
                + "au coût employeur total, pour un salaire brut de "
                + ieEuro(gross, lang) + " €."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Income tax",
            "USC",
            "Net before tax",
            "Employee PRSI",
            "Gross wage",
            "Employer PRSI",
            "Employer cost"
        ]
        : [
            "Net après impôt",
            "Impôt sur le revenu",
            "USC",
            "Net avant impôt",
            "PRSI salarié",
            "Salaire brut",
            "PRSI employeur",
            "Coût employeur"
        ];

    const traces = [
        {
            type: "waterfall",
            orientation: "v",
            measure: [
                "absolute",
                "relative",
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
                usc,
                netBeforeTax,
                employeePrsi,
                gross,
                employerPrsi,
                employerCost
            ],
            text: [
                ieEuro(netAfterTax, lang) + " €",
                "+" + ieEuro(incomeTax, lang) + " €",
                "+" + ieEuro(usc, lang) + " €",
                ieEuro(netBeforeTax, lang) + " €",
                "+" + ieEuro(employeePrsi, lang) + " €",
                ieEuro(gross, lang) + " €",
                "+" + ieEuro(employerPrsi, lang) + " €",
                ieEuro(employerCost, lang) + " €"
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
                    color: IRELAND_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: IRELAND_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: IRELAND_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} €<extra></extra>"
        }
    ];

    const layout = irelandBaseLayout(lang, lang === "en" ? "Monthly amount, EUR" : "Montant mensuel, EUR");

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

    irelandPlot(
        "chart-ireland-waterfall-" + lang,
        traces,
        layout
    );
}


function renderIrelandCostChart(lang) {
    const data = getIrelandData();
    const t = getI18nText(lang);

    const x = data.map(row => ieNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => ieNum(row.gross_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: IRELAND_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => ieNum(row.net_before_income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impôt",
            line: {
                color: IRELAND_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} €<extra></extra>" : "Net avant impôt : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ieNum(row.net_after_income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net après impôt",
            line: {
                color: IRELAND_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} €<extra></extra>" : "Net après impôt : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ieNum(row.employer_cost_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: IRELAND_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} €<extra></extra>"
        }
    ];

    const layout = irelandBaseLayout(lang, lang === "en" ? "Monthly amount, EUR" : "Montant mensuel, EUR");

    layout.yaxis.ticksuffix = " €";

    irelandPlot(
        "chart-ireland-cost-" + lang,
        traces,
        layout
    );
}


function renderIrelandRateChart(lang) {
    const data = getIrelandData();

    const x = data.map(row => ieNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => ieNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate (PRSI)" : "Taux salarié (PRSI)",
            line: {
                color: IRELAND_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee PRSI: %{y:.1f} %<extra></extra>" : "PRSI salarié : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ieNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate (PRSI)" : "Taux employeur (PRSI)",
            line: {
                color: IRELAND_COLORS.employer,
                width: 3,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employer PRSI: %{y:.1f} %<extra></extra>" : "PRSI employeur : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                ieNum(row.income_tax_monthly_eur)
                / ieNum(row.gross_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective income tax rate" : "Taux d'imposition effectif",
            line: {
                color: IRELAND_COLORS.incomeTax,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Income tax: %{y:.1f} %<extra></extra>" : "Impôt sur le revenu : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                ieNum(row.usc_monthly_eur)
                / ieNum(row.gross_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective USC rate" : "Taux d'USC effectif",
            line: {
                color: IRELAND_COLORS.usc,
                width: 2,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "USC: %{y:.1f} %<extra></extra>" : "USC : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = irelandBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 50];

    irelandPlot(
        "chart-ireland-rates-" + lang,
        traces,
        layout
    );
}


function renderIrelandTaxUscChart(lang) {
    const data = getIrelandData();

    const x = data.map(row => ieNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => ieNum(row.income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Income tax (PAYE)" : "Impôt sur le revenu (PAYE)",
            line: {
                color: IRELAND_COLORS.incomeTax,
                width: 2
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => ieNum(row.usc_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: "USC",
            line: {
                color: IRELAND_COLORS.usc,
                width: 2
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => ieNum(row.income_tax_monthly_eur) + ieNum(row.usc_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total" : "Total",
            line: {
                color: IRELAND_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} €<extra></extra>"
        }
    ];

    const layout = irelandBaseLayout(lang, lang === "en" ? "Monthly amount, EUR" : "Montant mensuel, EUR");

    layout.yaxis.ticksuffix = " €";

    irelandPlot(
        "chart-ireland-tax-usc-" + lang,
        traces,
        layout
    );
}


function renderIrelandWedgeChart(lang) {
    const data = getIrelandData();
    const t = getI18nText(lang);

    const x = data.map(row => ieNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                ieNum(row.social_wedge_monthly_eur)
                / ieNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / coût employeur",
            line: {
                color: IRELAND_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                ieNum(row.total_wedge_after_income_tax_monthly_eur)
                / ieNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / coût employeur",
            line: {
                color: IRELAND_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ieNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio coût / net avant impôt",
            yaxis: "y2",
            line: {
                color: IRELAND_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Coût / net avant impôt : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ieNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio coût / net après impôt",
            yaxis: "y2",
            line: {
                color: IRELAND_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Coût / net après impôt : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = irelandBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / coût employeur");

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

    irelandPlot(
        "chart-ireland-wedge-" + lang,
        traces,
        layout
    );
}


function renderIrelandFiscalReturnChart(lang) {
    const target = document.getElementById("chart-ireland-fiscal-return-" + lang);

    if (!target) {
        return;
    }

    const data = getIrelandData().filter(row => (
        Number.isFinite(ieNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(ieNum(row.marginal_net_after_income_tax_rate))
        && Number.isFinite(ieNum(row.marginal_social_wedge_rate))
        && Number.isFinite(ieNum(row.marginal_total_wedge_after_income_tax_rate))
        && ieNum(row.delta_gross_monthly_eur) > 0
    ));

    const x = data.map(row => ieNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                ieNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impôt",
            line: {
                color: IRELAND_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impôt : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                ieNum(row.marginal_net_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Après impôt",
            line: {
                color: IRELAND_COLORS.afterTax,
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
                ieNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: IRELAND_COLORS.wedge,
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
                ieNum(row.marginal_total_wedge_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prélèvement marginal total",
            line: {
                color: IRELAND_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prélèvement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = irelandBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional euro of gross wage (%)"
            : "Part d'un euro supplémentaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    irelandPlot(
        "chart-ireland-fiscal-return-" + lang,
        traces,
        layout
    );
}


function renderIrelandDataTable(lang) {
    const tableBody = getI18nElement("ireland-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const caption = getI18nElement("ireland-data-caption", lang);

    if (caption) {
        caption.textContent = lang === "en" ? "Standard employee" : "Salarié standard";
    }

    const data = getIrelandData();

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            ieRatio(row.smic_multiple, lang),
            ieEuro(row.gross_monthly_eur, lang),
            ieEuro(row.net_before_income_tax_monthly_eur, lang),
            ieEuro(row.income_tax_monthly_eur, lang),
            ieEuro(row.usc_monthly_eur, lang),
            ieEuro(row.net_after_income_tax_monthly_eur, lang),
            ieEuro(row.employer_cost_monthly_eur, lang),
            ieEuro(row.employee_contributions_monthly_eur, lang),
            ieEuro(row.employer_contributions_monthly_eur, lang),
            ieEuro(row.social_wedge_monthly_eur, lang),
            ieEuro(row.total_wedge_after_income_tax_monthly_eur, lang),
            iePct(row.employer_contribution_rate, lang),
            ieRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderIreland(lang) {
    renderIrelandMetrics(lang);
    renderIrelandWaterfallChart(lang);
    renderIrelandCostChart(lang);
    renderIrelandRateChart(lang);
    renderIrelandTaxUscChart(lang);
    renderIrelandWedgeChart(lang);
    renderIrelandFiscalReturnChart(lang);
    renderIrelandDataTable(lang);
}


function computeIrelandFlclIndicators(row) {
    const net = ieNum(row.net_before_income_tax_monthly_eur);
    const employerCost = ieNum(row.employer_cost_monthly_eur);

    // Round to 2 decimal places to suppress rounding noise from the
    // underlying net/employer-cost series (stored with sub-cent precision in
    // the source grid), which otherwise gets amplified into a false sawtooth
    // once the chart auto-scales to this indicator's narrow real range (same
    // fix family as computeSwedenFlclIndicators; a coarser rounding step is
    // needed here because the noise floor in Ireland's source data is larger
    // than Sweden's). 2dp is still finer than the 1dp shown in the UI.
    const rawFlclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclE = Math.round(rawFlclE * 100) / 100;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderIrelandFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getIrelandData();
    const row = findIrelandClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeIrelandFlclIndicators(row);

    setTextContent("ireland-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("ireland-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("ireland-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " € " + t.flcl_e_desc);
    setTextContent("ireland-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderIrelandFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getIrelandData();

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = ieNum(data[i].net_before_income_tax_monthly_eur) - ieNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = ieNum(data[i].employer_cost_monthly_eur) - ieNum(data[i - 1].employer_cost_monthly_eur);
        const deltaMultiple = ieNum(data[i].smic_multiple) - ieNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeIrelandFlclIndicators(data[i]);
            const previous = computeIrelandFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: ieNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findIrelandClosestRow(marginalRows, 1.0);
    const oneRow = findIrelandClosestRow(data, 1.0);
    const threeRow = findIrelandClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeIrelandFlclIndicators(oneRow).flclE - computeIrelandFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("ireland-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("ireland-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("ireland-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("ireland-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("ireland-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("ireland-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("ireland-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("ireland-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderIrelandFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getIrelandData();

    const traces = [
        {
            x: data.map(row => ieNum(row.smic_multiple)),
            y: data.map(row => computeIrelandFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: IRELAND_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × min. wage<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = irelandBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    irelandPlot("chart-ireland-flcl-e-" + lang, traces, layout);
}


function renderIrelandFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getIrelandData();

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = ieNum(data[i].net_before_income_tax_monthly_eur) - ieNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = ieNum(data[i].employer_cost_monthly_eur) - ieNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(ieNum(data[i].smic_multiple));
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
                color: IRELAND_COLORS.incomeTax,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: IRELAND_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = irelandBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    irelandPlot("chart-ireland-flcl-marginal-" + lang, traces, layout);
}


function renderIrelandFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getIrelandData();

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeIrelandFlclIndicators(data[i]);
        const previous = computeIrelandFlclIndicators(data[i - 1]);
        const deltaMultiple = ieNum(data[i].smic_multiple) - ieNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(ieNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: IRELAND_COLORS.employee,
                width: 3
            }
        }
    ];

    const layout = irelandBaseLayout(
        lang,
        lang === "en" ? "Lab-E points per minimum wage" : "Points de Lab-E par salaire minimum"
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

    irelandPlot("chart-ireland-flcl-progressivity-" + lang, traces, layout);
}


function renderIrelandFlclMarginalDestinationChart(lang) {
    const data = getIrelandData();

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = ieNum(data[i].employer_cost_monthly_eur) - ieNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = ieNum(data[i].net_before_income_tax_monthly_eur) - ieNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaEmployee = ieNum(data[i].employee_contributions_monthly_eur) - ieNum(data[i - 1].employee_contributions_monthly_eur);
        const deltaEmployer = ieNum(data[i].employer_contributions_monthly_eur) - ieNum(data[i - 1].employer_contributions_monthly_eur);

        x.push(ieNum(data[i].smic_multiple));
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
                color: IRELAND_COLORS.net,
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
                color: IRELAND_COLORS.employee,
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
                color: IRELAND_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = irelandBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional euro, %"
            : "Destination marginale d'un euro supplémentaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    irelandPlot("chart-ireland-flcl-destination-" + lang, traces, layout);
}


function renderIrelandFlclIndex(lang) {
    renderIrelandFlclIndexCards(lang);
    renderIrelandFlclMarginalCards(lang);
    renderIrelandFlclEChart(lang);
    renderIrelandFlclMarginalChart(lang);
    renderIrelandFlclProgressivityChart(lang);
    renderIrelandFlclMarginalDestinationChart(lang);
}


function irelandOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderIreland(lang);
    }

    if (tabName === "data") {
        renderIrelandDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderIrelandFlclIndex(lang);
    }
}


function showIrelandTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: IRELAND_TAB_STORAGE_KEY,
        onShow: irelandOnTabShow
    });
}


function switchIrelandLanguage() {
    switchLangLanguage({
        storageKey: IRELAND_LANGUAGE_STORAGE_KEY,
        tabStorageKey: IRELAND_TAB_STORAGE_KEY,
        onShow: irelandOnTabShow
    });
}


function setupIrelandEvents() {
    ["fr", "en"].forEach(function(lang) {
        const waterfallMultipleSelect = getI18nElement("ireland-waterfall-multiple", lang);

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderIrelandWaterfallChart(lang);
            });
        }
    });
}


applyStoredIrelandTheme();


Papa.parse(
    IRELAND_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            IRELAND_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => (
                    ieNum(a.smic_multiple)
                    - ieNum(b.smic_multiple)
                ));

            console.log(
                "Ireland Labour Cost Lab data loaded:",
                IRELAND_DATA.length,
                "rows"
            );

            setupIrelandEvents();

            const initialLang = localStorage.getItem(IRELAND_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: IRELAND_LANGUAGE_STORAGE_KEY,
                tabStorageKey: IRELAND_TAB_STORAGE_KEY,
                onShow: irelandOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Ireland CSV loading error:",
                error
            );
        }
    }
);
