const CHINA_DATA_PATH = "../../data/china/china_labour_cost_grid_2026.csv";
const CHINA_LANGUAGE_STORAGE_KEY = "china_language";
const CHINA_TAB_STORAGE_KEY = "china_tab";
const CHINA_DEFAULT_PROVINCE = "SH";

// This module's headline structural finding (see the top-of-page callout
// and the Methodology tab, section 3): Shanghai's own social-insurance
// contribution-base floor (RMB 7,460/month) is nearly 3x its own minimum
// wage (RMB 2,740/month, this module's 1.0x reference wage), because the
// floor is indexed to the local AVERAGE wage, not the minimum wage. This
// is a fixed, documented fact (analysis/china/china_payroll_2026.py,
// PROVINCE_DATA_2026["SH"]), not derived from the CSV.
const CHINA_SHANGHAI_SI_FLOOR_RMB = 7460.0;
const CHINA_SHANGHAI_MIN_WAGE_RMB = 2740.0;

let CHINA_DATA = [];


function applyStoredChinaTheme() {
    const storedTheme = localStorage.getItem("china-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateChinaThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateChinaThemeButton("light");
    }
}


function updateChinaThemeButton(theme) {
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
        localStorage.setItem("china-theme", "dark");
        updateChinaThemeButton("dark");
    } else {
        localStorage.setItem("china-theme", "light");
        updateChinaThemeButton("light");
    }

    renderChina(getActiveI18nLanguage(CHINA_LANGUAGE_STORAGE_KEY));
}


const CHINA_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    incomeTax: "#0d9488",
    wedge: "#f97316",
    total: "#0f172a",
    floorZone: "rgba(249, 115, 22, 0.14)"
};

// Palette for the detailed five-insurances-and-housing-fund breakdown
// chart, one color per stacked component (employee-side first, then
// employer-side, mirroring the US module's federal+state breakdown
// palette convention).
const CHINA_BREAKDOWN_PALETTE = [
    "#9333ea", // pension, employee
    "#a855f7", // medical, employee
    "#c084fc", // unemployment, employee
    "#d946ef", // housing fund, employee
    "#dc2626", // pension, employer
    "#ef4444", // medical, employer
    "#f97316", // unemployment, employer
    "#fb923c", // work injury, employer
    "#eab308"  // housing fund, employer
];


function cnNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function cnLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function cnRmb(value, lang) {
    return "¥" + cnNum(value).toLocaleString(
        cnLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function cnPct(value, lang) {
    return (cnNum(value) * 100).toLocaleString(
        cnLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function cnRatio(value, lang) {
    const text = cnNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getChinaWaterfallMultiple(lang) {
    const select = getI18nElement("china-waterfall-multiple", lang);

    if (!select) {
        return 1.00;
    }

    return cnNum(select.value);
}


function getChinaProvinces() {
    const provinceMap = new Map();

    CHINA_DATA.forEach(row => {
        if (!provinceMap.has(row.province_code)) {
            provinceMap.set(
                row.province_code,
                {
                    code: row.province_code,
                    labelFr: row.province_name_fr,
                    labelEn: row.province_name_en
                }
            );
        }
    });

    return Array.from(provinceMap.values());
}


function getSelectedChinaProvince(lang) {
    const select = getI18nElement("china-province-select", lang);

    if (!select) {
        return CHINA_DEFAULT_PROVINCE;
    }

    return select.value;
}


function getSelectedChinaDataProvince(lang) {
    const select = getI18nElement("china-data-province-select", lang);

    if (!select) {
        return getSelectedChinaProvince(lang);
    }

    return select.value;
}


function getSelectedChinaFlclProvince(lang) {
    const select = getI18nElement("china-flcl-province-select", lang);

    if (!select) {
        return getSelectedChinaProvince(lang);
    }

    return select.value;
}


function populateChinaProvinceSelects() {
    const provinces = getChinaProvinces();

    ["fr", "en"].forEach(function(lang) {
        const sortedProvinces = provinces.slice().sort((a, b) => (
            lang === "en"
                ? a.labelEn.localeCompare(b.labelEn)
                : a.labelFr.localeCompare(b.labelFr)
        ));

        const selects = [
            getI18nElement("china-province-select", lang),
            getI18nElement("china-data-province-select", lang),
            getI18nElement("china-flcl-province-select", lang)
        ];

        selects.forEach(select => {
            if (!select) {
                return;
            }

            const currentValue = select.value;

            select.innerHTML = "";

            sortedProvinces.forEach(province => {
                const option = document.createElement("option");

                option.value = province.code;
                option.textContent = lang === "en" ? province.labelEn : province.labelFr;

                if (
                    province.code === currentValue
                    || (!currentValue && province.code === CHINA_DEFAULT_PROVINCE)
                ) {
                    option.selected = true;
                }

                select.appendChild(option);
            });
        });
    });
}


function getChinaData(provinceCode) {
    const province = provinceCode || CHINA_DEFAULT_PROVINCE;

    return CHINA_DATA
        .filter(row => row.province_code === province)
        .sort((a, b) => cnNum(a.smic_multiple) - cnNum(b.smic_multiple));
}


function findChinaClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            cnNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            cnNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function chinaBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en" ? "Multiple of the reference wage" : "Multiple du salaire de reference",
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


function chinaPlot(elementId, traces, layout) {
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


function renderChinaMetrics(lang) {
    const data = getChinaData(getSelectedChinaProvince(lang));
    const referenceRow = data.find(row => cnNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-china-reference-wage-" + lang,
        cnRmb(referenceRow.gross_monthly_rmb, lang)
    );

    const incomeTaxRate = (
        cnNum(referenceRow.income_tax_monthly_rmb)
        / cnNum(referenceRow.gross_monthly_rmb)
    );

    setTextContent(
        "metric-china-income-tax-rate-" + lang,
        cnPct(incomeTaxRate, lang)
    );

    setTextContent(
        "metric-china-employer-rate-" + lang,
        cnPct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-china-cost-to-net-" + lang,
        cnRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );
}


function renderChinaWaterfallChart(lang) {
    const data = getChinaData(getSelectedChinaProvince(lang));

    if (!data.length) {
        return;
    }

    const selectedMultiple = getChinaWaterfallMultiple(lang);
    const row = findChinaClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = cnNum(row.smic_multiple);

    const netAfterTax = cnNum(row.net_after_income_tax_monthly_rmb);
    const incomeTax = cnNum(row.income_tax_monthly_rmb);
    const netBeforeTax = cnNum(row.net_before_income_tax_monthly_rmb);
    const employeeContrib = cnNum(row.employee_contributions_monthly_rmb);
    const gross = cnNum(row.gross_monthly_rmb);
    const employerContrib = cnNum(row.employer_contributions_monthly_rmb);
    const employerCost = cnNum(row.employer_cost_monthly_rmb);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " x reference wage"
        : actualMultiple.toFixed(2).replace(".", ",") + " x salaire de reference";

    setTextContent(
        "china-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Decomposition a ") + multipleLabel
    );

    setTextContent(
        "china-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + cnRmb(gross, lang) + "."
            : "Decomposition detaillee du passage du salaire net apres impot "
                + "au cout employeur total, pour un salaire brut de "
                + cnRmb(gross, lang) + "."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Income tax (national IIT)",
            "Net before tax",
            "Employee contributions",
            "Gross wage",
            "Employer contributions",
            "Employer cost"
        ]
        : [
            "Net apres impot",
            "Impot sur le revenu (IIT national)",
            "Net avant impot",
            "Cotisations salariales",
            "Salaire brut",
            "Cotisations patronales",
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
                cnRmb(netAfterTax, lang),
                "+" + cnRmb(incomeTax, lang),
                cnRmb(netBeforeTax, lang),
                "+" + cnRmb(employeeContrib, lang),
                cnRmb(gross, lang),
                "+" + cnRmb(employerContrib, lang),
                cnRmb(employerCost, lang)
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
                    color: CHINA_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: CHINA_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: CHINA_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} RMB<extra></extra>"
        }
    ];

    const layout = chinaBaseLayout(lang, lang === "en" ? "Monthly amount, RMB" : "Montant mensuel, RMB");

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

    layout.yaxis.ticksuffix = " RMB";
    layout.showlegend = false;

    layout.margin = {
        l: 82,
        r: 28,
        t: 34,
        b: 140
    };

    chinaPlot(
        "chart-china-waterfall-" + lang,
        traces,
        layout
    );
}


function renderChinaBreakdownChart(lang) {
    const data = getChinaData(getSelectedChinaProvince(lang));

    const x = data.map(row => cnNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const components = [
        {
            key: "pension_employee_monthly_rmb",
            fr: "Retraite (salarie)",
            en: "Pension (employee)"
        },
        {
            key: "medical_employee_monthly_rmb",
            fr: "Maladie (salarie)",
            en: "Medical (employee)"
        },
        {
            key: "unemployment_employee_monthly_rmb",
            fr: "Chomage (salarie)",
            en: "Unemployment (employee)"
        },
        {
            key: "hpf_employee_monthly_rmb",
            fr: "Fonds de logement (salarie)",
            en: "Housing fund (employee)"
        },
        {
            key: "pension_employer_monthly_rmb",
            fr: "Retraite (employeur)",
            en: "Pension (employer)"
        },
        {
            key: "medical_employer_monthly_rmb",
            fr: "Maladie (employeur)",
            en: "Medical (employer)"
        },
        {
            key: "unemployment_employer_monthly_rmb",
            fr: "Chomage (employeur)",
            en: "Unemployment (employer)"
        },
        {
            key: "work_injury_employer_monthly_rmb",
            fr: "Accident du travail (employeur)",
            en: "Work injury (employer)"
        },
        {
            key: "hpf_employer_monthly_rmb",
            fr: "Fonds de logement (employeur)",
            en: "Housing fund (employer)"
        }
    ];

    const traces = components.map((component, index) => ({
        x: x,
        y: data.map(row => cnNum(row[component.key])),
        type: "scatter",
        mode: "lines",
        stackgroup: "one",
        name: lang === "en" ? component.en : component.fr,
        line: {
            color: CHINA_BREAKDOWN_PALETTE[index % CHINA_BREAKDOWN_PALETTE.length],
            width: 1
        },
        hovertemplate: hoverPrefix + "%{y:,.0f} RMB<extra></extra>"
    }));

    traces.push({
        x: x,
        y: data.map(row => cnNum(row.total_wedge_after_income_tax_monthly_rmb)),
        type: "scatter",
        mode: "lines",
        name: lang === "en" ? "Total (income tax + employee + employer contributions)" : "Total (impot + cotisations salariales + patronales)",
        line: {
            color: CHINA_COLORS.total,
            width: 3,
            dash: "dot"
        },
        hovertemplate: hoverPrefix + "%{y:,.0f} RMB<extra></extra>"
    });

    const layout = chinaBaseLayout(lang, lang === "en" ? "Monthly amount, RMB" : "Montant mensuel, RMB");

    layout.yaxis.ticksuffix = " RMB";
    layout.height = 520;

    chinaPlot(
        "chart-china-breakdown-" + lang,
        traces,
        layout
    );
}


function renderChinaCostChart(lang) {
    const data = getChinaData(getSelectedChinaProvince(lang));
    const t = getI18nText(lang);

    const x = data.map(row => cnNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => cnNum(row.gross_monthly_rmb)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: CHINA_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} RMB<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => cnNum(row.net_before_income_tax_monthly_rmb)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impot",
            line: {
                color: CHINA_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} RMB<extra></extra>" : "Net avant impot : %{y:,.0f} RMB<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => cnNum(row.net_after_income_tax_monthly_rmb)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net apres impot",
            line: {
                color: CHINA_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} RMB<extra></extra>" : "Net apres impot : %{y:,.0f} RMB<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => cnNum(row.employer_cost_monthly_rmb)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: CHINA_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} RMB<extra></extra>"
        }
    ];

    const layout = chinaBaseLayout(lang, lang === "en" ? "Monthly amount, RMB" : "Montant mensuel, RMB");

    layout.yaxis.ticksuffix = " RMB";

    chinaPlot(
        "chart-china-cost-" + lang,
        traces,
        layout
    );
}


function renderChinaRateChart(lang) {
    const data = getChinaData(getSelectedChinaProvince(lang));

    const x = data.map(row => cnNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => cnNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate (5 insurances + housing fund)" : "Taux salarie (5 assurances + fonds de logement)",
            line: {
                color: CHINA_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee: %{y:.1f} %<extra></extra>" : "Salarie : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => cnNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate (5 insurances + housing fund)" : "Taux employeur (5 assurances + fonds de logement)",
            line: {
                color: CHINA_COLORS.employer,
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
                cnNum(row.income_tax_monthly_rmb)
                / cnNum(row.gross_monthly_rmb)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective income tax rate (national IIT)" : "Taux d'imposition effectif (IIT national)",
            line: {
                color: CHINA_COLORS.incomeTax,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Income tax: %{y:.1f} %<extra></extra>" : "Impot sur le revenu : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = chinaBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    // Visible callout: shade the wage range where this province's
    // social-insurance contribution-base floor typically binds (0.80x to
    // ~2.00x the reference wage), so a reader does not mistake the
    // resulting high apparent rates for a computation error. See the
    // module's top-of-page note and Methodology tab, section 3.
    layout.shapes = [{
        type: "rect",
        xref: "x",
        yref: "paper",
        x0: 0.75,
        x1: 2.0,
        y0: 0,
        y1: 1,
        fillcolor: CHINA_COLORS.floorZone,
        line: { width: 0 },
        layer: "below"
    }];

    layout.annotations = [{
        x: 1.35,
        y: 108,
        xref: "x",
        yref: "y",
        showarrow: false,
        align: "center",
        font: {
            size: 11,
            color: document.body.classList.contains("dark-mode") ? "#fdba74" : "#c2410c"
        },
        text: lang === "en"
            ? "Contribution-base floor often binds here<br>(not an error — see note above)"
            : "Plancher de cotisation souvent actif ici<br>(pas une erreur — voir la note ci-dessus)"
    }];

    chinaPlot(
        "chart-china-rates-" + lang,
        traces,
        layout
    );
}


function renderChinaWedgeChart(lang) {
    const data = getChinaData(getSelectedChinaProvince(lang));
    const t = getI18nText(lang);

    const x = data.map(row => cnNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                cnNum(row.social_wedge_monthly_rmb)
                / cnNum(row.employer_cost_monthly_rmb)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / cout employeur",
            line: {
                color: CHINA_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                cnNum(row.total_wedge_after_income_tax_monthly_rmb)
                / cnNum(row.employer_cost_monthly_rmb)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / cout employeur",
            line: {
                color: CHINA_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => cnNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio cout / net avant impot",
            yaxis: "y2",
            line: {
                color: CHINA_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Cout / net avant impot : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => cnNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio cout / net apres impot",
            yaxis: "y2",
            line: {
                color: CHINA_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Cout / net apres impot : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = chinaBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / cout employeur");

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    layout.yaxis2 = {
        title: {
            text: t.cost_net_ratio,
            standoff: 16
        },
        overlaying: "y",
        side: "right",
        range: [1, 5],
        zeroline: false,
        showgrid: false
    };

    chinaPlot(
        "chart-china-wedge-" + lang,
        traces,
        layout
    );
}


function renderChinaMarginalRateChart(lang) {
    const target = document.getElementById("chart-china-marginal-" + lang);

    if (!target) {
        return;
    }

    const data = getChinaData(getSelectedChinaProvince(lang)).filter(row => (
        Number.isFinite(cnNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(cnNum(row.marginal_net_after_income_tax_rate))
        && Number.isFinite(cnNum(row.marginal_social_wedge_rate))
        && Number.isFinite(cnNum(row.marginal_total_wedge_after_income_tax_rate))
        && cnNum(row.delta_gross_monthly_rmb) > 0
    ));

    const x = data.map(row => cnNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                cnNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impot",
            line: {
                color: CHINA_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impot : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                cnNum(row.marginal_net_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Apres impot",
            line: {
                color: CHINA_COLORS.afterTax,
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
                cnNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: CHINA_COLORS.wedge,
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
                cnNum(row.marginal_total_wedge_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prelevement marginal total",
            line: {
                color: CHINA_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prelevement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = chinaBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional RMB of gross wage (%)"
            : "Part d'un RMB supplementaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [-50, 150];

    chinaPlot(
        "chart-china-marginal-" + lang,
        traces,
        layout
    );
}


function renderChinaDataTable(lang) {
    const tableBody = getI18nElement("china-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const caption = getI18nElement("china-data-caption", lang);
    const provinceCode = getSelectedChinaDataProvince(lang);
    const province = getChinaProvinces().find(p => p.code === provinceCode);

    if (caption) {
        const provinceLabel = province ? (lang === "en" ? province.labelEn : province.labelFr) : "";
        caption.textContent = (lang === "en" ? "Standard employee (" : "Salarie standard (") + provinceLabel + ")";
    }

    const data = getChinaData(provinceCode);

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            cnRatio(row.smic_multiple, lang),
            cnRmb(row.gross_monthly_rmb, lang),
            cnRmb(row.net_before_income_tax_monthly_rmb, lang),
            cnRmb(row.income_tax_monthly_rmb, lang),
            cnRmb(row.net_after_income_tax_monthly_rmb, lang),
            cnRmb(row.employer_cost_monthly_rmb, lang),
            cnRmb(row.employee_contributions_monthly_rmb, lang),
            cnRmb(row.employer_contributions_monthly_rmb, lang),
            cnRmb(row.social_wedge_monthly_rmb, lang),
            cnRmb(row.total_wedge_after_income_tax_monthly_rmb, lang),
            cnPct(row.employer_contribution_rate, lang),
            cnRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderChina(lang) {
    renderChinaMetrics(lang);
    renderChinaWaterfallChart(lang);
    renderChinaBreakdownChart(lang);
    renderChinaCostChart(lang);
    renderChinaRateChart(lang);
    renderChinaWedgeChart(lang);
    renderChinaMarginalRateChart(lang);
    renderChinaDataTable(lang);
}


function computeChinaFlclIndicators(row) {
    const net = cnNum(row.net_before_income_tax_monthly_rmb);
    const employerCost = cnNum(row.employer_cost_monthly_rmb);

    // Defensive rounding, mirroring the fix already applied in the
    // Sweden and US modules (computeSwedenFlclIndicators /
    // computeUsaFlclIndicators): suppresses sub-fen rounding noise that
    // Plotly's y-axis auto-scaling would otherwise amplify into a false
    // sawtooth pattern, while still letting real bracket- and
    // floor-driven progressivity show through at the 4-decimal-place
    // level.
    const rawFlclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclE = Math.round(rawFlclE * 10000) / 10000;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderChinaFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getChinaData(getSelectedChinaFlclProvince(lang));
    const row = findChinaClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeChinaFlclIndicators(row);

    setTextContent("china-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("china-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("china-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " RMB " + t.flcl_e_desc);
    setTextContent("china-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderChinaFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getChinaData(getSelectedChinaFlclProvince(lang));

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = cnNum(data[i].net_before_income_tax_monthly_rmb) - cnNum(data[i - 1].net_before_income_tax_monthly_rmb);
        const deltaCost = cnNum(data[i].employer_cost_monthly_rmb) - cnNum(data[i - 1].employer_cost_monthly_rmb);
        const deltaMultiple = cnNum(data[i].smic_multiple) - cnNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeChinaFlclIndicators(data[i]);
            const previous = computeChinaFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: cnNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findChinaClosestRow(marginalRows, 1.0);
    const oneRow = findChinaClosestRow(data, 1.0);
    const threeRow = findChinaClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeChinaFlclIndicators(oneRow).flclE - computeChinaFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("china-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("china-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("china-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("china-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("china-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("china-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("china-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("china-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderChinaFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getChinaData(getSelectedChinaFlclProvince(lang));

    const traces = [
        {
            x: data.map(row => cnNum(row.smic_multiple)),
            y: data.map(row => computeChinaFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: CHINA_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} x ref. wage<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = chinaBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    chinaPlot("chart-china-flcl-e-" + lang, traces, layout);
}


function renderChinaFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getChinaData(getSelectedChinaFlclProvince(lang));

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = cnNum(data[i].net_before_income_tax_monthly_rmb) - cnNum(data[i - 1].net_before_income_tax_monthly_rmb);
        const deltaCost = cnNum(data[i].employer_cost_monthly_rmb) - cnNum(data[i - 1].employer_cost_monthly_rmb);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(cnNum(data[i].smic_multiple));
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
                color: CHINA_COLORS.incomeTax,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: CHINA_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = chinaBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    chinaPlot("chart-china-flcl-marginal-" + lang, traces, layout);
}


function renderChinaFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getChinaData(getSelectedChinaFlclProvince(lang));

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeChinaFlclIndicators(data[i]);
        const previous = computeChinaFlclIndicators(data[i - 1]);
        const deltaMultiple = cnNum(data[i].smic_multiple) - cnNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(cnNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: CHINA_COLORS.employee,
                width: 3
            }
        }
    ];

    const layout = chinaBaseLayout(
        lang,
        lang === "en" ? "Lab-E points per reference wage" : "Points de Lab-E par salaire de reference"
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

    chinaPlot("chart-china-flcl-progressivity-" + lang, traces, layout);
}


function renderChinaFlclMarginalDestinationChart(lang) {
    const data = getChinaData(getSelectedChinaFlclProvince(lang));

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = cnNum(data[i].employer_cost_monthly_rmb) - cnNum(data[i - 1].employer_cost_monthly_rmb);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = cnNum(data[i].net_before_income_tax_monthly_rmb) - cnNum(data[i - 1].net_before_income_tax_monthly_rmb);
        const deltaEmployee = cnNum(data[i].employee_contributions_monthly_rmb) - cnNum(data[i - 1].employee_contributions_monthly_rmb);
        const deltaEmployer = cnNum(data[i].employer_contributions_monthly_rmb) - cnNum(data[i - 1].employer_contributions_monthly_rmb);

        x.push(cnNum(data[i].smic_multiple));
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
                color: CHINA_COLORS.net,
                width: 2
            }
        },
        {
            x: x,
            y: employeeShare,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Employee contributions" : "Cotisations salariales",
            line: {
                color: CHINA_COLORS.employee,
                width: 2
            }
        },
        {
            x: x,
            y: employerShare,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Employer contributions" : "Cotisations patronales",
            line: {
                color: CHINA_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = chinaBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional RMB, %"
            : "Destination marginale d'un RMB supplementaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [-50, 150];

    chinaPlot("chart-china-flcl-destination-" + lang, traces, layout);
}


function renderChinaFlclIndex(lang) {
    renderChinaFlclIndexCards(lang);
    renderChinaFlclMarginalCards(lang);
    renderChinaFlclEChart(lang);
    renderChinaFlclMarginalChart(lang);
    renderChinaFlclProgressivityChart(lang);
    renderChinaFlclMarginalDestinationChart(lang);
}


function chinaOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderChina(lang);
    }

    if (tabName === "data") {
        renderChinaDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderChinaFlclIndex(lang);
    }
}


function showChinaTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: CHINA_TAB_STORAGE_KEY,
        onShow: chinaOnTabShow
    });
}


function switchChinaLanguage() {
    switchLangLanguage({
        storageKey: CHINA_LANGUAGE_STORAGE_KEY,
        tabStorageKey: CHINA_TAB_STORAGE_KEY,
        onShow: chinaOnTabShow
    });
}


function setupChinaEvents() {
    ["fr", "en"].forEach(function(lang) {
        const waterfallMultipleSelect = getI18nElement("china-waterfall-multiple", lang);

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderChinaWaterfallChart(lang);
            });
        }

        const provinceSelect = getI18nElement("china-province-select", lang);

        if (provinceSelect) {
            provinceSelect.addEventListener("change", function() {
                renderChina(lang);
            });
        }

        const dataProvinceSelect = getI18nElement("china-data-province-select", lang);

        if (dataProvinceSelect) {
            dataProvinceSelect.addEventListener("change", function() {
                renderChinaDataTable(lang);
            });
        }

        const flclProvinceSelect = getI18nElement("china-flcl-province-select", lang);

        if (flclProvinceSelect) {
            flclProvinceSelect.addEventListener("change", function() {
                renderChinaFlclIndex(lang);
            });
        }
    });
}


applyStoredChinaTheme();


Papa.parse(
    CHINA_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            CHINA_DATA = results.data
                .filter(row => row.province_code)
                .sort((a, b) => (
                    cnNum(a.smic_multiple)
                    - cnNum(b.smic_multiple)
                ));

            console.log(
                "China Labour Cost Lab data loaded:",
                CHINA_DATA.length,
                "rows"
            );

            populateChinaProvinceSelects();
            setupChinaEvents();

            const initialLang = localStorage.getItem(CHINA_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: CHINA_LANGUAGE_STORAGE_KEY,
                tabStorageKey: CHINA_TAB_STORAGE_KEY,
                onShow: chinaOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "China CSV loading error:",
                error
            );
        }
    }
);
