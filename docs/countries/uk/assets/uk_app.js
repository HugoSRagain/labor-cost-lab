const UK_DATA_PATH = "../../data/uk/uk_labour_cost_grid_2026.csv";
const UK_LANGUAGE_STORAGE_KEY = "uk_language";
const UK_TAB_STORAGE_KEY = "uk_tab";

let UK_DATA = [];


function applyStoredUkTheme() {
    const storedTheme = localStorage.getItem("uk-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateUkThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateUkThemeButton("light");
    }
}


function updateUkThemeButton(theme) {
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
        localStorage.setItem("uk-theme", "dark");
        updateUkThemeButton("dark");
    } else {
        localStorage.setItem("uk-theme", "light");
        updateUkThemeButton("light");
    }

    renderUk(getActiveI18nLanguage(UK_LANGUAGE_STORAGE_KEY));
}


const UK_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    ni: "#0d9488",
    pension: "#a16207",
    wedge: "#f97316",
    total: "#0f172a"
};


function ukNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function ukLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function ukGbp(value, lang) {
    return ukNum(value).toLocaleString(
        ukLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function ukPct(value, lang) {
    return (ukNum(value) * 100).toLocaleString(
        ukLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function ukRatio(value, lang) {
    const text = ukNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getUkSelectedProfile(lang) {
    const select = getI18nElement("uk-profile-select", lang);

    if (!select) {
        return "uk__standard_employee_ruk";
    }

    return select.value;
}

function getUkSelectedDataProfile(lang) {
    const select = getI18nElement("uk-data-profile-select", lang);

    if (!select) {
        return getUkSelectedProfile(lang);
    }

    return select.value;
}

function getUkWaterfallMultiple(lang) {
    const select = getI18nElement("uk-waterfall-multiple", lang);

    if (!select) {
        return 2.00;
    }

    return ukNum(select.value);
}


function getUkProfileData(profileId) {
    return UK_DATA
        .filter(row => row.profile_id === profileId)
        .sort((a, b) => ukNum(a.smic_multiple) - ukNum(b.smic_multiple));
}


function findUkClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            ukNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            ukNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function ukBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en" ? "Multiple of the UK minimum wage" : "Multiple du salaire minimum britannique",
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


function ukPlot(elementId, traces, layout) {
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


function renderUkMetrics(lang) {
    const profileId = getUkSelectedProfile(lang);
    const profileData = getUkProfileData(profileId);
    const referenceRow = profileData.find(row => ukNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-uk-reference-wage-" + lang,
        ukGbp(referenceRow.gross_monthly_gbp, lang) + " £"
    );

    const incomeTaxRate = (
        ukNum(referenceRow.income_tax_monthly_gbp)
        / ukNum(referenceRow.gross_monthly_gbp)
    );

    setTextContent(
        "metric-uk-income-tax-rate-" + lang,
        ukPct(incomeTaxRate, lang)
    );

    setTextContent(
        "metric-uk-employer-rate-" + lang,
        ukPct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-uk-cost-to-net-" + lang,
        ukRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );
}


function renderUkWaterfallChart(lang) {
    const profileId = getUkSelectedProfile(lang);
    const data = getUkProfileData(profileId);

    if (!data.length) {
        return;
    }

    const selectedMultiple = getUkWaterfallMultiple(lang);
    const row = findUkClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = ukNum(row.smic_multiple);

    const netAfterTax = ukNum(row.net_after_income_tax_monthly_gbp);
    const incomeTax = ukNum(row.income_tax_monthly_gbp);
    const netBeforeTax = ukNum(row.net_before_income_tax_monthly_gbp);
    const employeeNi = ukNum(row.employee_ni_monthly_gbp);
    const employeePension = ukNum(row.employee_pension_monthly_gbp);
    const gross = ukNum(row.gross_monthly_gbp);
    const employerNi = ukNum(row.employer_ni_monthly_gbp);
    const employerPension = ukNum(row.employer_pension_monthly_gbp);
    const employerCost = ukNum(row.employer_cost_monthly_gbp);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " minimum wage(s)"
        : actualMultiple.toFixed(2).replace(".", ",") + " salaire(s) minimum(s)";

    setTextContent(
        "uk-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Décomposition à ") + multipleLabel
    );

    setTextContent(
        "uk-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + ukGbp(gross, lang) + " £."
            : "Décomposition détaillée du passage du salaire net après impôt "
                + "au coût employeur total, pour un salaire brut de "
                + ukGbp(gross, lang) + " £."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Income tax",
            "Net before tax",
            "Employee NI",
            "Employee pension",
            "Gross wage",
            "Employer NI",
            "Employer pension",
            "Employer cost"
        ]
        : [
            "Net après impôt",
            "Impôt sur le revenu",
            "Net avant impôt",
            "NI salarié",
            "Pension salarié",
            "Salaire brut",
            "NI employeur",
            "Pension employeur",
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
                "total",
                "relative",
                "relative",
                "total"
            ],
            x: labels,
            y: [
                netAfterTax,
                incomeTax,
                netBeforeTax,
                employeeNi,
                employeePension,
                gross,
                employerNi,
                employerPension,
                employerCost
            ],
            text: [
                ukGbp(netAfterTax, lang) + " £",
                "+" + ukGbp(incomeTax, lang) + " £",
                ukGbp(netBeforeTax, lang) + " £",
                "+" + ukGbp(employeeNi, lang) + " £",
                "+" + ukGbp(employeePension, lang) + " £",
                ukGbp(gross, lang) + " £",
                "+" + ukGbp(employerNi, lang) + " £",
                "+" + ukGbp(employerPension, lang) + " £",
                ukGbp(employerCost, lang) + " £"
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
                    color: UK_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: UK_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: UK_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} £<extra></extra>"
        }
    ];

    const layout = ukBaseLayout(lang, lang === "en" ? "Monthly amount, GBP" : "Montant mensuel, GBP");

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

    layout.yaxis.ticksuffix = " £";
    layout.showlegend = false;

    layout.margin = {
        l: 82,
        r: 28,
        t: 34,
        b: 125
    };

    ukPlot(
        "chart-uk-waterfall-" + lang,
        traces,
        layout
    );
}

function renderUkCostChart(lang) {
    const profileId = getUkSelectedProfile(lang);
    const data = getUkProfileData(profileId);
    const t = getI18nText(lang);

    const x = data.map(row => ukNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × NLW<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => ukNum(row.gross_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: UK_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} £<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => ukNum(row.net_before_income_tax_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impôt",
            line: {
                color: UK_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} £<extra></extra>" : "Net avant impôt : %{y:,.0f} £<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ukNum(row.net_after_income_tax_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net après impôt",
            line: {
                color: UK_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} £<extra></extra>" : "Net après impôt : %{y:,.0f} £<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ukNum(row.employer_cost_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: UK_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} £<extra></extra>"
        }
    ];

    const layout = ukBaseLayout(lang, lang === "en" ? "Monthly amount, GBP" : "Montant mensuel, GBP");

    layout.yaxis.ticksuffix = " £";

    ukPlot(
        "chart-uk-cost-" + lang,
        traces,
        layout
    );
}


function renderUkRateChart(lang) {
    const profileId = getUkSelectedProfile(lang);
    const data = getUkProfileData(profileId);

    const x = data.map(row => ukNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × NLW<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => ukNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate" : "Taux salarié",
            line: {
                color: UK_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee rate: %{y:.1f} %<extra></extra>" : "Taux salarié : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ukNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate" : "Taux employeur",
            line: {
                color: UK_COLORS.employer,
                width: 3,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employer rate: %{y:.1f} %<extra></extra>" : "Taux employeur : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                ukNum(row.income_tax_monthly_gbp)
                / ukNum(row.gross_monthly_gbp)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective income tax rate" : "Taux d'imposition effectif",
            line: {
                color: UK_COLORS.total,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Income tax: %{y:.1f} %<extra></extra>" : "Impôt sur le revenu : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = ukBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 50];

    ukPlot(
        "chart-uk-rates-" + lang,
        traces,
        layout
    );
}


function renderUkEmployeeComponentsChart(lang) {
    const profileId = getUkSelectedProfile(lang);
    const data = getUkProfileData(profileId);

    const x = data.map(row => ukNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × NLW<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => ukNum(row.employee_ni_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee National Insurance" : "National Insurance salarié",
            line: {
                color: UK_COLORS.ni,
                width: 2
            },
            hovertemplate: hoverPrefix + "NI : %{y:,.0f} £<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => ukNum(row.employee_pension_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee pension" : "Pension salarié",
            line: {
                color: UK_COLORS.pension,
                width: 2
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Pension: %{y:,.0f} £<extra></extra>" : "Pension : %{y:,.0f} £<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ukNum(row.employee_contributions_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total employee levies" : "Total prélèvements salarié",
            line: {
                color: UK_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total: %{y:,.0f} £<extra></extra>" : "Total : %{y:,.0f} £<extra></extra>")
        }
    ];

    const layout = ukBaseLayout(lang, lang === "en" ? "Monthly amount, GBP" : "Montant mensuel, GBP");

    layout.yaxis.ticksuffix = " £";

    ukPlot(
        "chart-uk-employee-components-" + lang,
        traces,
        layout
    );
}


function renderUkEmployerComponentsChart(lang) {
    const profileId = getUkSelectedProfile(lang);
    const data = getUkProfileData(profileId);

    const x = data.map(row => ukNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × NLW<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => ukNum(row.employer_ni_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer National Insurance" : "National Insurance employeur",
            line: {
                color: UK_COLORS.ni,
                width: 2
            },
            hovertemplate: hoverPrefix + "NI : %{y:,.0f} £<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => ukNum(row.employer_pension_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer pension" : "Pension employeur",
            line: {
                color: UK_COLORS.pension,
                width: 2
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Pension: %{y:,.0f} £<extra></extra>" : "Pension : %{y:,.0f} £<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ukNum(row.employer_contributions_monthly_gbp)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total employer contributions" : "Total cotisations employeur",
            line: {
                color: UK_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total: %{y:,.0f} £<extra></extra>" : "Total : %{y:,.0f} £<extra></extra>")
        }
    ];

    const layout = ukBaseLayout(lang, lang === "en" ? "Monthly amount, GBP" : "Montant mensuel, GBP");

    layout.yaxis.ticksuffix = " £";

    ukPlot(
        "chart-uk-employer-components-" + lang,
        traces,
        layout
    );
}


function renderUkWedgeChart(lang) {
    const profileId = getUkSelectedProfile(lang);
    const data = getUkProfileData(profileId);
    const t = getI18nText(lang);

    const x = data.map(row => ukNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × NLW<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                ukNum(row.social_wedge_monthly_gbp)
                / ukNum(row.employer_cost_monthly_gbp)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / coût employeur",
            line: {
                color: UK_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                ukNum(row.total_wedge_after_income_tax_monthly_gbp)
                / ukNum(row.employer_cost_monthly_gbp)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / coût employeur",
            line: {
                color: UK_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ukNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio coût / net avant impôt",
            yaxis: "y2",
            line: {
                color: UK_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Coût / net avant impôt : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => ukNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio coût / net après impôt",
            yaxis: "y2",
            line: {
                color: UK_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Coût / net après impôt : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = ukBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / coût employeur");

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

    ukPlot(
        "chart-uk-wedge-" + lang,
        traces,
        layout
    );
}


function renderUkFiscalReturnChart(lang) {
    const target = document.getElementById("chart-uk-fiscal-return-" + lang);

    if (!target) {
        return;
    }

    const profileId = getUkSelectedProfile(lang);

    const data = getUkProfileData(profileId).filter(row => (
        Number.isFinite(ukNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(ukNum(row.marginal_net_after_income_tax_rate))
        && Number.isFinite(ukNum(row.marginal_social_wedge_rate))
        && Number.isFinite(ukNum(row.marginal_total_wedge_after_income_tax_rate))
        && ukNum(row.delta_gross_monthly_gbp) > 0
    ));

    const x = data.map(row => ukNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × NLW<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                ukNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impôt",
            line: {
                color: UK_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impôt : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                ukNum(row.marginal_net_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Après impôt",
            line: {
                color: UK_COLORS.afterTax,
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
                ukNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: UK_COLORS.wedge,
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
                ukNum(row.marginal_total_wedge_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prélèvement marginal total",
            line: {
                color: UK_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prélèvement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = ukBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional pound of gross wage (%)"
            : "Part d'une livre supplémentaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    ukPlot(
        "chart-uk-fiscal-return-" + lang,
        traces,
        layout
    );
}


function renderUkDataTable(lang) {
    const tableBody = getI18nElement("uk-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const profileId = getUkSelectedDataProfile(lang);

    const profileLabels = {
        fr: {
            uk__standard_employee_ruk: "Salarié standard, hors Écosse"
        },
        en: {
            uk__standard_employee_ruk: "Standard employee, outside Scotland"
        }
    };

    const caption = getI18nElement("uk-data-profile-caption", lang);

    if (caption) {
        caption.textContent = (profileLabels[lang] || profileLabels.fr)[profileId] || profileId;
    }

    const data = getUkProfileData(profileId);

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            ukRatio(row.smic_multiple, lang),
            ukGbp(row.gross_monthly_gbp, lang),
            ukGbp(row.net_before_income_tax_monthly_gbp, lang),
            ukGbp(row.income_tax_monthly_gbp, lang),
            ukGbp(row.net_after_income_tax_monthly_gbp, lang),
            ukGbp(row.employer_cost_monthly_gbp, lang),
            ukGbp(row.employee_contributions_monthly_gbp, lang),
            ukGbp(row.employer_contributions_monthly_gbp, lang),
            ukGbp(row.social_wedge_monthly_gbp, lang),
            ukGbp(row.total_wedge_after_income_tax_monthly_gbp, lang),
            ukPct(row.employer_contribution_rate, lang),
            ukRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}

function renderUk(lang) {
    renderUkMetrics(lang);
    renderUkWaterfallChart(lang);
    renderUkCostChart(lang);
    renderUkRateChart(lang);
    renderUkEmployeeComponentsChart(lang);
    renderUkEmployerComponentsChart(lang);
    renderUkWedgeChart(lang);
    renderUkFiscalReturnChart(lang);
    renderUkDataTable(lang);
}


function ukOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderUk(lang);
    }

    if (tabName === "data") {
        renderUkDataTable(lang);
    }
}


function showUkTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: UK_TAB_STORAGE_KEY,
        onShow: ukOnTabShow
    });
}


function switchUkLanguage() {
    switchLangLanguage({
        storageKey: UK_LANGUAGE_STORAGE_KEY,
        tabStorageKey: UK_TAB_STORAGE_KEY,
        onShow: ukOnTabShow
    });
}


function setupUkEvents() {
    ["fr", "en"].forEach(function(lang) {
        const profileSelect = getI18nElement("uk-profile-select", lang);
        const dataProfileSelect = getI18nElement("uk-data-profile-select", lang);
        const waterfallMultipleSelect = getI18nElement("uk-waterfall-multiple", lang);

        if (profileSelect) {
            profileSelect.addEventListener("change", function() {
                renderUk(lang);
            });
        }

        if (dataProfileSelect) {
            dataProfileSelect.addEventListener("change", function() {
                renderUkDataTable(lang);
            });
        }

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderUkWaterfallChart(lang);
            });
        }
    });
}


applyStoredUkTheme();


Papa.parse(
    UK_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            UK_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => (
                    ukNum(a.smic_multiple)
                    - ukNum(b.smic_multiple)
                ));

            console.log(
                "UK Labour Cost Lab data loaded:",
                UK_DATA.length,
                "rows"
            );

            setupUkEvents();

            const initialLang = localStorage.getItem(UK_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: UK_LANGUAGE_STORAGE_KEY,
                tabStorageKey: UK_TAB_STORAGE_KEY,
                onShow: ukOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "UK CSV loading error:",
                error
            );
        }
    }
);
