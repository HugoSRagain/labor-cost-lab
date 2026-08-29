const USA_DATA_PATH = "../../data/usa/usa_labour_cost_grid_2026.csv";
const USA_LANGUAGE_STORAGE_KEY = "usa_language";
const USA_TAB_STORAGE_KEY = "usa_tab";
const USA_DEFAULT_STATE = "CA";

let USA_DATA = [];


function applyStoredUsaTheme() {
    const storedTheme = localStorage.getItem("usa-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateUsaThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateUsaThemeButton("light");
    }
}


function updateUsaThemeButton(theme) {
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
        localStorage.setItem("usa-theme", "dark");
        updateUsaThemeButton("dark");
    } else {
        localStorage.setItem("usa-theme", "light");
        updateUsaThemeButton("light");
    }

    renderUsa(getActiveI18nLanguage(USA_LANGUAGE_STORAGE_KEY));
}


const USA_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    incomeTax: "#0d9488",
    wedge: "#f97316",
    total: "#0f172a"
};

// Palette for the detailed federal + state breakdown chart, one color per
// stacked component (employee-side components first, then employer-side).
const USA_BREAKDOWN_PALETTE = [
    "#0d9488", // federal income tax
    "#14b8a6", // state income tax
    "#9333ea", // Social Security employee
    "#a855f7", // Medicare employee
    "#c084fc", // Additional Medicare employee
    "#7c3aed", // employee UI (AK/NJ/PA)
    "#d946ef", // state extra employee (SDI/PFML/TDI...)
    "#dc2626", // Social Security employer
    "#ef4444", // Medicare employer
    "#f97316", // FUTA employer
    "#fb923c", // SUI employer
    "#eab308"  // state extra employer
];


function usNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function usLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function usUsd(value, lang) {
    return usNum(value).toLocaleString(
        usLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ) + " $";
}


function usPct(value, lang) {
    return (usNum(value) * 100).toLocaleString(
        usLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function usRatio(value, lang) {
    const text = usNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getUsaWaterfallMultiple(lang) {
    const select = getI18nElement("usa-waterfall-multiple", lang);

    if (!select) {
        return 1.00;
    }

    return usNum(select.value);
}


function getUsaStates() {
    const stateMap = new Map();

    USA_DATA.forEach(row => {
        if (!stateMap.has(row.state_code)) {
            stateMap.set(
                row.state_code,
                {
                    code: row.state_code,
                    labelFr: row.state_name_fr,
                    labelEn: row.state_name_en,
                    hasIncomeTax: String(row.has_state_income_tax) === "True"
                }
            );
        }
    });

    return Array.from(stateMap.values()).sort((a, b) => (
        a.labelFr.localeCompare(b.labelFr)
    ));
}


function getSelectedUsaState(lang) {
    const select = getI18nElement("usa-state-select", lang);

    if (!select) {
        return USA_DEFAULT_STATE;
    }

    return select.value;
}


function getSelectedUsaDataState(lang) {
    const select = getI18nElement("usa-data-state-select", lang);

    if (!select) {
        return getSelectedUsaState(lang);
    }

    return select.value;
}


function getSelectedUsaFlclState(lang) {
    const select = getI18nElement("usa-flcl-state-select", lang);

    if (!select) {
        return getSelectedUsaState(lang);
    }

    return select.value;
}


function populateUsaStateSelects() {
    const states = getUsaStates();

    ["fr", "en"].forEach(function(lang) {
        const selects = [
            getI18nElement("usa-state-select", lang),
            getI18nElement("usa-data-state-select", lang),
            getI18nElement("usa-flcl-state-select", lang)
        ];

        selects.forEach(select => {
            if (!select) {
                return;
            }

            const currentValue = select.value;

            select.innerHTML = "";

            states.forEach(state => {
                const option = document.createElement("option");

                option.value = state.code;
                option.textContent = (lang === "en" ? state.labelEn : state.labelFr)
                    + (state.hasIncomeTax
                        ? ""
                        : (lang === "en" ? " (no income tax)" : " (sans impôt sur le revenu)"));

                if (
                    state.code === currentValue
                    || (!currentValue && state.code === USA_DEFAULT_STATE)
                ) {
                    option.selected = true;
                }

                select.appendChild(option);
            });
        });
    });
}


function getUsaData(stateCode) {
    const state = stateCode || USA_DEFAULT_STATE;

    return USA_DATA
        .filter(row => row.state_code === state)
        .sort((a, b) => usNum(a.smic_multiple) - usNum(b.smic_multiple));
}


function findUsaClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            usNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            usNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function usaBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en" ? "Multiple of the US federal minimum wage" : "Multiple du salaire minimum federal americain",
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


function usaPlot(elementId, traces, layout) {
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


function renderUsaMetrics(lang) {
    const data = getUsaData(getSelectedUsaState(lang));
    const referenceRow = data.find(row => usNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-usa-reference-wage-" + lang,
        usUsd(referenceRow.gross_monthly_usd, lang)
    );

    const incomeTaxRate = (
        usNum(referenceRow.income_tax_monthly_usd)
        / usNum(referenceRow.gross_monthly_usd)
    );

    setTextContent(
        "metric-usa-income-tax-rate-" + lang,
        usPct(incomeTaxRate, lang)
    );

    setTextContent(
        "metric-usa-employer-rate-" + lang,
        usPct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-usa-cost-to-net-" + lang,
        usRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );
}


function renderUsaWaterfallChart(lang) {
    const data = getUsaData(getSelectedUsaState(lang));

    if (!data.length) {
        return;
    }

    const selectedMultiple = getUsaWaterfallMultiple(lang);
    const row = findUsaClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = usNum(row.smic_multiple);

    const netAfterTax = usNum(row.net_after_income_tax_monthly_usd);
    const incomeTax = usNum(row.income_tax_monthly_usd);
    const netBeforeTax = usNum(row.net_before_income_tax_monthly_usd);
    const employeeContrib = usNum(row.employee_contributions_monthly_usd);
    const gross = usNum(row.gross_monthly_usd);
    const employerContrib = usNum(row.employer_contributions_monthly_usd);
    const employerCost = usNum(row.employer_cost_monthly_usd);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " x federal minimum wage"
        : actualMultiple.toFixed(2).replace(".", ",") + " x salaire minimum federal";

    setTextContent(
        "usa-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Decomposition a ") + multipleLabel
    );

    setTextContent(
        "usa-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + usUsd(gross, lang) + "."
            : "Decomposition detaillee du passage du salaire net apres impot "
                + "au cout employeur total, pour un salaire brut de "
                + usUsd(gross, lang) + "."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Income tax (federal + state)",
            "Net before tax",
            "Employee contributions",
            "Gross wage",
            "Employer contributions",
            "Employer cost"
        ]
        : [
            "Net apres impot",
            "Impot sur le revenu (federal + Etat)",
            "Net avant impot",
            "Cotisations salarie",
            "Salaire brut",
            "Cotisations employeur",
            "Cout employeur"
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
                usUsd(netAfterTax, lang),
                "+" + usUsd(incomeTax, lang),
                usUsd(netBeforeTax, lang),
                "+" + usUsd(employeeContrib, lang),
                usUsd(gross, lang),
                "+" + usUsd(employerContrib, lang),
                usUsd(employerCost, lang)
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
                    color: USA_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: USA_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: USA_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} $<extra></extra>"
        }
    ];

    const layout = usaBaseLayout(lang, lang === "en" ? "Monthly amount, USD" : "Montant mensuel, USD");

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

    layout.yaxis.ticksuffix = " $";
    layout.showlegend = false;

    layout.margin = {
        l: 82,
        r: 28,
        t: 34,
        b: 140
    };

    usaPlot(
        "chart-usa-waterfall-" + lang,
        traces,
        layout
    );
}


function renderUsaBreakdownChart(lang) {
    const data = getUsaData(getSelectedUsaState(lang));

    const x = data.map(row => usNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x fed. min. wage<br>";

    const components = [
        {
            key: "federal_income_tax_monthly_usd",
            fr: "Impot federal sur le revenu",
            en: "Federal income tax"
        },
        {
            key: "state_income_tax_monthly_usd",
            fr: "Impot d'Etat sur le revenu",
            en: "State income tax"
        },
        {
            key: "social_security_employee_monthly_usd",
            fr: "Social Security (salarie)",
            en: "Social Security (employee)"
        },
        {
            key: "medicare_employee_monthly_usd",
            fr: "Medicare (salarie)",
            en: "Medicare (employee)"
        },
        {
            key: "additional_medicare_employee_monthly_usd",
            fr: "Additional Medicare Tax (salarie)",
            en: "Additional Medicare Tax (employee)"
        },
        {
            key: "employee_ui_monthly_usd",
            fr: "Chomage salarie (AK/NJ/PA)",
            en: "Employee UI (AK/NJ/PA)"
        },
        {
            key: "state_extra_employee_monthly_usd",
            fr: "Dispositif d'Etat salarie (SDI/PFML/TDI...)",
            en: "State-mandated item, employee side (SDI/PFML/TDI...)"
        },
        {
            key: "social_security_employer_monthly_usd",
            fr: "Social Security (employeur)",
            en: "Social Security (employer)"
        },
        {
            key: "medicare_employer_monthly_usd",
            fr: "Medicare (employeur)",
            en: "Medicare (employer)"
        },
        {
            key: "futa_employer_monthly_usd",
            fr: "FUTA (employeur)",
            en: "FUTA (employer)"
        },
        {
            key: "sui_employer_monthly_usd",
            fr: "SUI/SUTA (employeur)",
            en: "SUI/SUTA (employer)"
        },
        {
            key: "state_extra_employer_monthly_usd",
            fr: "Dispositif d'Etat employeur (FAMLI/PFL...)",
            en: "State-mandated item, employer side (FAMLI/PFL...)"
        }
    ];

    const traces = components.map((component, index) => ({
        x: x,
        y: data.map(row => usNum(row[component.key])),
        type: "scatter",
        mode: "lines",
        stackgroup: "one",
        name: lang === "en" ? component.en : component.fr,
        line: {
            color: USA_BREAKDOWN_PALETTE[index % USA_BREAKDOWN_PALETTE.length],
            width: 1
        },
        hovertemplate: hoverPrefix + "%{y:,.0f} $<extra></extra>"
    }));

    traces.push({
        x: x,
        y: data.map(row => usNum(row.total_wedge_after_income_tax_monthly_usd)),
        type: "scatter",
        mode: "lines",
        name: lang === "en" ? "Total (income tax + employee + employer contributions)" : "Total (impot + cotisations salarie + employeur)",
        line: {
            color: USA_COLORS.total,
            width: 3,
            dash: "dot"
        },
        hovertemplate: hoverPrefix + "%{y:,.0f} $<extra></extra>"
    });

    const layout = usaBaseLayout(lang, lang === "en" ? "Monthly amount, USD" : "Montant mensuel, USD");

    layout.yaxis.ticksuffix = " $";
    layout.height = 520;

    usaPlot(
        "chart-usa-breakdown-" + lang,
        traces,
        layout
    );
}


function renderUsaCostChart(lang) {
    const data = getUsaData(getSelectedUsaState(lang));
    const t = getI18nText(lang);

    const x = data.map(row => usNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x fed. min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => usNum(row.gross_monthly_usd)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: USA_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} $<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => usNum(row.net_before_income_tax_monthly_usd)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impot",
            line: {
                color: USA_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} $<extra></extra>" : "Net avant impot : %{y:,.0f} $<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => usNum(row.net_after_income_tax_monthly_usd)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net apres impot",
            line: {
                color: USA_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} $<extra></extra>" : "Net apres impot : %{y:,.0f} $<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => usNum(row.employer_cost_monthly_usd)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: USA_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} $<extra></extra>"
        }
    ];

    const layout = usaBaseLayout(lang, lang === "en" ? "Monthly amount, USD" : "Montant mensuel, USD");

    layout.yaxis.ticksuffix = " $";

    usaPlot(
        "chart-usa-cost-" + lang,
        traces,
        layout
    );
}


function renderUsaRateChart(lang) {
    const data = getUsaData(getSelectedUsaState(lang));

    const x = data.map(row => usNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x fed. min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => usNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate (FICA + state items)" : "Taux salarie (FICA + dispositifs d'Etat)",
            line: {
                color: USA_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee: %{y:.1f} %<extra></extra>" : "Salarie : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => usNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate (FICA + FUTA + SUI + state items)" : "Taux employeur (FICA + FUTA + SUI + dispositifs d'Etat)",
            line: {
                color: USA_COLORS.employer,
                width: 3,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employer: %{y:.1f} %<extra></extra>" : "Employeur : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                usNum(row.income_tax_monthly_usd)
                / usNum(row.gross_monthly_usd)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective income tax rate (federal + state)" : "Taux d'imposition effectif (federal + Etat)",
            line: {
                color: USA_COLORS.incomeTax,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Income tax: %{y:.1f} %<extra></extra>" : "Impot sur le revenu : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = usaBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 55];

    usaPlot(
        "chart-usa-rates-" + lang,
        traces,
        layout
    );
}


function renderUsaWedgeChart(lang) {
    const data = getUsaData(getSelectedUsaState(lang));
    const t = getI18nText(lang);

    const x = data.map(row => usNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x fed. min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                usNum(row.social_wedge_monthly_usd)
                / usNum(row.employer_cost_monthly_usd)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / cout employeur",
            line: {
                color: USA_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                usNum(row.total_wedge_after_income_tax_monthly_usd)
                / usNum(row.employer_cost_monthly_usd)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / cout employeur",
            line: {
                color: USA_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => usNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio cout / net avant impot",
            yaxis: "y2",
            line: {
                color: USA_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Cout / net avant impot : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => usNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio cout / net apres impot",
            yaxis: "y2",
            line: {
                color: USA_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Cout / net apres impot : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = usaBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / cout employeur");

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

    usaPlot(
        "chart-usa-wedge-" + lang,
        traces,
        layout
    );
}


function renderUsaMarginalRateChart(lang) {
    const target = document.getElementById("chart-usa-marginal-" + lang);

    if (!target) {
        return;
    }

    const data = getUsaData(getSelectedUsaState(lang)).filter(row => (
        Number.isFinite(usNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(usNum(row.marginal_net_after_income_tax_rate))
        && Number.isFinite(usNum(row.marginal_social_wedge_rate))
        && Number.isFinite(usNum(row.marginal_total_wedge_after_income_tax_rate))
        && usNum(row.delta_gross_monthly_usd) > 0
    ));

    const x = data.map(row => usNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x fed. min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                usNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impot",
            line: {
                color: USA_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impot : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                usNum(row.marginal_net_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Apres impot",
            line: {
                color: USA_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "After tax: %{y:.1f} %<extra></extra>" : "Apres impot : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                usNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: USA_COLORS.wedge,
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
                usNum(row.marginal_total_wedge_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prelevement marginal total",
            line: {
                color: USA_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prelevement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = usaBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional dollar of gross wage (%)"
            : "Part d'un dollar supplementaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    usaPlot(
        "chart-usa-marginal-" + lang,
        traces,
        layout
    );
}


function renderUsaDataTable(lang) {
    const tableBody = getI18nElement("usa-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const caption = getI18nElement("usa-data-caption", lang);
    const stateCode = getSelectedUsaDataState(lang);
    const state = getUsaStates().find(s => s.code === stateCode);

    if (caption) {
        const stateLabel = state ? (lang === "en" ? state.labelEn : state.labelFr) : "";
        caption.textContent = (lang === "en" ? "Standard employee (" : "Salarie standard (") + stateLabel + ")";
    }

    const data = getUsaData(stateCode);

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            usRatio(row.smic_multiple, lang),
            usUsd(row.gross_monthly_usd, lang),
            usUsd(row.net_before_income_tax_monthly_usd, lang),
            usUsd(row.income_tax_monthly_usd, lang),
            usUsd(row.net_after_income_tax_monthly_usd, lang),
            usUsd(row.employer_cost_monthly_usd, lang),
            usUsd(row.employee_contributions_monthly_usd, lang),
            usUsd(row.employer_contributions_monthly_usd, lang),
            usUsd(row.social_wedge_monthly_usd, lang),
            usUsd(row.total_wedge_after_income_tax_monthly_usd, lang),
            usPct(row.employer_contribution_rate, lang),
            usRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderUsa(lang) {
    renderUsaMetrics(lang);
    renderUsaWaterfallChart(lang);
    renderUsaBreakdownChart(lang);
    renderUsaCostChart(lang);
    renderUsaRateChart(lang);
    renderUsaWedgeChart(lang);
    renderUsaMarginalRateChart(lang);
    renderUsaDataTable(lang);
}


function computeUsaFlclIndicators(row) {
    const net = usNum(row.net_before_income_tax_monthly_usd);
    const employerCost = usNum(row.employer_cost_monthly_usd);

    // Defensive rounding, mirroring the Sweden module's fix: suppresses
    // sub-cent rounding noise that Plotly's y-axis auto-scaling would
    // otherwise amplify into a false sawtooth pattern, while still letting
    // real bracket-driven progressivity (federal + state brackets) show
    // through at the 4-decimal-place level.
    const rawFlclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclE = Math.round(rawFlclE * 10000) / 10000;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderUsaFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getUsaData(getSelectedUsaFlclState(lang));
    const row = findUsaClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeUsaFlclIndicators(row);

    setTextContent("usa-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("usa-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("usa-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " $ " + t.flcl_e_desc);
    setTextContent("usa-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderUsaFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getUsaData(getSelectedUsaFlclState(lang));

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = usNum(data[i].net_before_income_tax_monthly_usd) - usNum(data[i - 1].net_before_income_tax_monthly_usd);
        const deltaCost = usNum(data[i].employer_cost_monthly_usd) - usNum(data[i - 1].employer_cost_monthly_usd);
        const deltaMultiple = usNum(data[i].smic_multiple) - usNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeUsaFlclIndicators(data[i]);
            const previous = computeUsaFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: usNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findUsaClosestRow(marginalRows, 1.0);
    const oneRow = findUsaClosestRow(data, 1.0);
    const threeRow = findUsaClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeUsaFlclIndicators(oneRow).flclE - computeUsaFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("usa-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("usa-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("usa-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("usa-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("usa-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("usa-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("usa-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("usa-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderUsaFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getUsaData(getSelectedUsaFlclState(lang));

    const traces = [
        {
            x: data.map(row => usNum(row.smic_multiple)),
            y: data.map(row => computeUsaFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: USA_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} x fed. min. wage<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = usaBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    usaPlot("chart-usa-flcl-e-" + lang, traces, layout);
}


function renderUsaFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getUsaData(getSelectedUsaFlclState(lang));

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = usNum(data[i].net_before_income_tax_monthly_usd) - usNum(data[i - 1].net_before_income_tax_monthly_usd);
        const deltaCost = usNum(data[i].employer_cost_monthly_usd) - usNum(data[i - 1].employer_cost_monthly_usd);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(usNum(data[i].smic_multiple));
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
                color: USA_COLORS.incomeTax,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: USA_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = usaBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    usaPlot("chart-usa-flcl-marginal-" + lang, traces, layout);
}


function renderUsaFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getUsaData(getSelectedUsaFlclState(lang));

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeUsaFlclIndicators(data[i]);
        const previous = computeUsaFlclIndicators(data[i - 1]);
        const deltaMultiple = usNum(data[i].smic_multiple) - usNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(usNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: USA_COLORS.employee,
                width: 3
            }
        }
    ];

    const layout = usaBaseLayout(
        lang,
        lang === "en" ? "Lab-E points per federal minimum wage" : "Points de Lab-E par salaire minimum federal"
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

    usaPlot("chart-usa-flcl-progressivity-" + lang, traces, layout);
}


function renderUsaFlclMarginalDestinationChart(lang) {
    const data = getUsaData(getSelectedUsaFlclState(lang));

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = usNum(data[i].employer_cost_monthly_usd) - usNum(data[i - 1].employer_cost_monthly_usd);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = usNum(data[i].net_before_income_tax_monthly_usd) - usNum(data[i - 1].net_before_income_tax_monthly_usd);
        const deltaEmployee = usNum(data[i].employee_contributions_monthly_usd) - usNum(data[i - 1].employee_contributions_monthly_usd);
        const deltaEmployer = usNum(data[i].employer_contributions_monthly_usd) - usNum(data[i - 1].employer_contributions_monthly_usd);

        x.push(usNum(data[i].smic_multiple));
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
                color: USA_COLORS.net,
                width: 2
            }
        },
        {
            x: x,
            y: employeeShare,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Employee contributions" : "Cotisations salarie",
            line: {
                color: USA_COLORS.employee,
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
                color: USA_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = usaBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional dollar, %"
            : "Destination marginale d'un dollar supplementaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    usaPlot("chart-usa-flcl-destination-" + lang, traces, layout);
}


function renderUsaFlclIndex(lang) {
    renderUsaFlclIndexCards(lang);
    renderUsaFlclMarginalCards(lang);
    renderUsaFlclEChart(lang);
    renderUsaFlclMarginalChart(lang);
    renderUsaFlclProgressivityChart(lang);
    renderUsaFlclMarginalDestinationChart(lang);
}


function usaOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderUsa(lang);
    }

    if (tabName === "data") {
        renderUsaDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderUsaFlclIndex(lang);
    }
}


function showUsaTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: USA_TAB_STORAGE_KEY,
        onShow: usaOnTabShow
    });
}


function switchUsaLanguage() {
    switchLangLanguage({
        storageKey: USA_LANGUAGE_STORAGE_KEY,
        tabStorageKey: USA_TAB_STORAGE_KEY,
        onShow: usaOnTabShow
    });
}


function setupUsaEvents() {
    ["fr", "en"].forEach(function(lang) {
        const waterfallMultipleSelect = getI18nElement("usa-waterfall-multiple", lang);

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderUsaWaterfallChart(lang);
            });
        }

        const stateSelect = getI18nElement("usa-state-select", lang);

        if (stateSelect) {
            stateSelect.addEventListener("change", function() {
                renderUsa(lang);
            });
        }

        const dataStateSelect = getI18nElement("usa-data-state-select", lang);

        if (dataStateSelect) {
            dataStateSelect.addEventListener("change", function() {
                renderUsaDataTable(lang);
            });
        }

        const flclStateSelect = getI18nElement("usa-flcl-state-select", lang);

        if (flclStateSelect) {
            flclStateSelect.addEventListener("change", function() {
                renderUsaFlclIndex(lang);
            });
        }
    });
}


applyStoredUsaTheme();


Papa.parse(
    USA_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            USA_DATA = results.data
                .filter(row => row.state_code)
                .sort((a, b) => (
                    usNum(a.smic_multiple)
                    - usNum(b.smic_multiple)
                ));

            console.log(
                "USA Labour Cost Lab data loaded:",
                USA_DATA.length,
                "rows"
            );

            populateUsaStateSelects();
            setupUsaEvents();

            const initialLang = localStorage.getItem(USA_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: USA_LANGUAGE_STORAGE_KEY,
                tabStorageKey: USA_TAB_STORAGE_KEY,
                onShow: usaOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "USA CSV loading error:",
                error
            );
        }
    }
);
