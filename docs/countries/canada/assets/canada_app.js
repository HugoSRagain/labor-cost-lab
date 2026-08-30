const CANADA_DATA_PATH = "../../data/canada/canada_labour_cost_grid_2026.csv";
const CANADA_LANGUAGE_STORAGE_KEY = "canada_language";
const CANADA_TAB_STORAGE_KEY = "canada_tab";
const CANADA_DEFAULT_PROVINCE = "ON";

let CANADA_DATA = [];


function applyStoredCanadaTheme() {
    const storedTheme = localStorage.getItem("canada-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateCanadaThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateCanadaThemeButton("light");
    }
}


function updateCanadaThemeButton(theme) {
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
        localStorage.setItem("canada-theme", "dark");
        updateCanadaThemeButton("dark");
    } else {
        localStorage.setItem("canada-theme", "light");
        updateCanadaThemeButton("light");
    }

    renderCanada(getActiveI18nLanguage(CANADA_LANGUAGE_STORAGE_KEY));
}


const CANADA_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    incomeTax: "#0d9488",
    wedge: "#f97316",
    total: "#0f172a"
};

// Palette for the detailed federal + provincial tax and contribution
// breakdown chart, one color per stacked component (tax first, then
// employee-side contributions, then employer-side contributions),
// mirroring the US module's federal+state breakdown palette convention.
// QPIP (employee and employer) is non-zero only for Quebec; the Ontario
// Employer Health Tax (EHT) is non-zero only for Ontario; the Quebec
// Fonds des services de sante (FSS) is non-zero only for Quebec -- all
// three simply render as a flat zero line for the other jurisdictions.
const CANADA_BREAKDOWN_PALETTE = [
    "#0d9488", // federal income tax
    "#14b8a6", // provincial income tax
    "#9333ea", // CPP/QPP, employee
    "#a855f7", // EI, employee
    "#d946ef", // QPIP, employee (Quebec only)
    "#dc2626", // CPP/QPP, employer
    "#ef4444", // EI, employer
    "#f97316", // QPIP, employer (Quebec only)
    "#fb923c", // Ontario EHT, employer (Ontario only)
    "#fbbf24", // Quebec FSS, employer (Quebec only)
    "#eab308"  // Workers' compensation, employer
];


function caNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function caLocale(lang) {
    return lang === "en" ? "en-CA" : "fr-CA";
}


function caCad(value, lang) {
    return caNum(value).toLocaleString(
        caLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ) + " $";
}


function caPct(value, lang) {
    return (caNum(value) * 100).toLocaleString(
        caLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function caRatio(value, lang) {
    const text = caNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getCanadaWaterfallMultiple(lang) {
    const select = getI18nElement("canada-waterfall-multiple", lang);

    if (!select) {
        return 1.00;
    }

    return caNum(select.value);
}


function getCanadaProvinces() {
    const provinceMap = new Map();

    CANADA_DATA.forEach(row => {
        if (!provinceMap.has(row.province_code)) {
            provinceMap.set(
                row.province_code,
                {
                    code: row.province_code,
                    labelFr: row.province_name_fr,
                    labelEn: row.province_name_en,
                    isQuebec: String(row.is_quebec) === "True"
                }
            );
        }
    });

    return Array.from(provinceMap.values());
}


function getSelectedCanadaProvince(lang) {
    const select = getI18nElement("canada-province-select", lang);

    if (!select) {
        return CANADA_DEFAULT_PROVINCE;
    }

    return select.value;
}


function getSelectedCanadaDataProvince(lang) {
    const select = getI18nElement("canada-data-province-select", lang);

    if (!select) {
        return getSelectedCanadaProvince(lang);
    }

    return select.value;
}


function getSelectedCanadaFlclProvince(lang) {
    const select = getI18nElement("canada-flcl-province-select", lang);

    if (!select) {
        return getSelectedCanadaProvince(lang);
    }

    return select.value;
}


function populateCanadaProvinceSelects() {
    const provinces = getCanadaProvinces();

    ["fr", "en"].forEach(function(lang) {
        const sortedProvinces = provinces.slice().sort((a, b) => (
            lang === "en"
                ? a.labelEn.localeCompare(b.labelEn)
                : a.labelFr.localeCompare(b.labelFr)
        ));

        const selects = [
            getI18nElement("canada-province-select", lang),
            getI18nElement("canada-data-province-select", lang),
            getI18nElement("canada-flcl-province-select", lang)
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
                    || (!currentValue && province.code === CANADA_DEFAULT_PROVINCE)
                ) {
                    option.selected = true;
                }

                select.appendChild(option);
            });
        });
    });
}


function getCanadaData(provinceCode) {
    const province = provinceCode || CANADA_DEFAULT_PROVINCE;

    return CANADA_DATA
        .filter(row => row.province_code === province)
        .sort((a, b) => caNum(a.smic_multiple) - caNum(b.smic_multiple));
}


function findCanadaClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            caNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            caNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function canadaBaseLayout(lang, yAxisTitle) {
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


function canadaPlot(elementId, traces, layout) {
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


function renderCanadaMetrics(lang) {
    const data = getCanadaData(getSelectedCanadaProvince(lang));
    const referenceRow = data.find(row => caNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-canada-reference-wage-" + lang,
        caCad(referenceRow.gross_monthly_cad, lang)
    );

    const incomeTaxRate = (
        caNum(referenceRow.income_tax_monthly_cad)
        / caNum(referenceRow.gross_monthly_cad)
    );

    setTextContent(
        "metric-canada-income-tax-rate-" + lang,
        caPct(incomeTaxRate, lang)
    );

    setTextContent(
        "metric-canada-employer-rate-" + lang,
        caPct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-canada-cost-to-net-" + lang,
        caRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );
}


function renderCanadaWaterfallChart(lang) {
    const data = getCanadaData(getSelectedCanadaProvince(lang));

    if (!data.length) {
        return;
    }

    const selectedMultiple = getCanadaWaterfallMultiple(lang);
    const row = findCanadaClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = caNum(row.smic_multiple);

    const netAfterTax = caNum(row.net_after_income_tax_monthly_cad);
    const incomeTax = caNum(row.income_tax_monthly_cad);
    const netBeforeTax = caNum(row.net_before_income_tax_monthly_cad);
    const employeeContrib = caNum(row.employee_contributions_monthly_cad);
    const gross = caNum(row.gross_monthly_cad);
    const employerContrib = caNum(row.employer_contributions_monthly_cad);
    const employerCost = caNum(row.employer_cost_monthly_cad);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " x reference wage"
        : actualMultiple.toFixed(2).replace(".", ",") + " x salaire de reference";

    setTextContent(
        "canada-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Decomposition a ") + multipleLabel
    );

    setTextContent(
        "canada-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + caCad(gross, lang) + "."
            : "Decomposition detaillee du passage du salaire net apres impot "
                + "au cout employeur total, pour un salaire brut de "
                + caCad(gross, lang) + "."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Income tax (federal + provincial)",
            "Net before tax",
            "Employee contributions",
            "Gross wage",
            "Employer contributions",
            "Employer cost"
        ]
        : [
            "Net apres impot",
            "Impot sur le revenu (federal + provincial)",
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
                caCad(netAfterTax, lang),
                "+" + caCad(incomeTax, lang),
                caCad(netBeforeTax, lang),
                "+" + caCad(employeeContrib, lang),
                caCad(gross, lang),
                "+" + caCad(employerContrib, lang),
                caCad(employerCost, lang)
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
                    color: CANADA_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: CANADA_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: CANADA_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} $<extra></extra>"
        }
    ];

    const layout = canadaBaseLayout(lang, lang === "en" ? "Monthly amount, CAD" : "Montant mensuel, CAD");

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

    canadaPlot(
        "chart-canada-waterfall-" + lang,
        traces,
        layout
    );
}


function renderCanadaBreakdownChart(lang) {
    const data = getCanadaData(getSelectedCanadaProvince(lang));

    const x = data.map(row => caNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const components = [
        {
            key: "__federal_tax_monthly",
            fr: "Impot federal",
            en: "Federal income tax"
        },
        {
            key: "__provincial_tax_monthly",
            fr: "Impot provincial",
            en: "Provincial income tax"
        },
        {
            key: "cpp_qpp_employee_monthly_cad",
            fr: "RPC/RRQ (salarie)",
            en: "CPP/QPP (employee)"
        },
        {
            key: "ei_employee_monthly_cad",
            fr: "Assurance-emploi (salarie)",
            en: "EI (employee)"
        },
        {
            key: "qpip_employee_monthly_cad",
            fr: "RQAP (salarie, Quebec)",
            en: "QPIP (employee, Quebec)"
        },
        {
            key: "cpp_qpp_employer_monthly_cad",
            fr: "RPC/RRQ (employeur)",
            en: "CPP/QPP (employer)"
        },
        {
            key: "ei_employer_monthly_cad",
            fr: "Assurance-emploi (employeur)",
            en: "EI (employer)"
        },
        {
            key: "qpip_employer_monthly_cad",
            fr: "RQAP (employeur, Quebec)",
            en: "QPIP (employer, Quebec)"
        },
        {
            key: "ontario_eht_monthly_cad",
            fr: "Impot-sante des employeurs (Ontario)",
            en: "Employer Health Tax (Ontario)"
        },
        {
            key: "quebec_fss_monthly_cad",
            fr: "Fonds des services de sante (Quebec)",
            en: "Health Services Fund (Quebec)"
        },
        {
            key: "workers_comp_monthly_cad",
            fr: "Accidents du travail (employeur)",
            en: "Workers' compensation (employer)"
        }
    ];

    function componentValue(row, key) {
        if (key === "__federal_tax_monthly") {
            return caNum(row.federal_tax_annual_cad) / 12;
        }

        if (key === "__provincial_tax_monthly") {
            return caNum(row.provincial_tax_annual_cad) / 12;
        }

        return caNum(row[key]);
    }

    const traces = components.map((component, index) => ({
        x: x,
        y: data.map(row => componentValue(row, component.key)),
        type: "scatter",
        mode: "lines",
        stackgroup: "one",
        name: lang === "en" ? component.en : component.fr,
        line: {
            color: CANADA_BREAKDOWN_PALETTE[index % CANADA_BREAKDOWN_PALETTE.length],
            width: 1
        },
        hovertemplate: hoverPrefix + "%{y:,.0f} $<extra></extra>"
    }));

    traces.push({
        x: x,
        y: data.map(row => caNum(row.total_wedge_after_income_tax_monthly_cad)),
        type: "scatter",
        mode: "lines",
        name: lang === "en" ? "Total (income tax + employee + employer contributions)" : "Total (impot + cotisations salariales + patronales)",
        line: {
            color: CANADA_COLORS.total,
            width: 3,
            dash: "dot"
        },
        hovertemplate: hoverPrefix + "%{y:,.0f} $<extra></extra>"
    });

    const layout = canadaBaseLayout(lang, lang === "en" ? "Monthly amount, CAD" : "Montant mensuel, CAD");

    layout.yaxis.ticksuffix = " $";
    layout.height = 520;

    canadaPlot(
        "chart-canada-breakdown-" + lang,
        traces,
        layout
    );
}


function renderCanadaCostChart(lang) {
    const data = getCanadaData(getSelectedCanadaProvince(lang));
    const t = getI18nText(lang);

    const x = data.map(row => caNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => caNum(row.gross_monthly_cad)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: CANADA_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} $<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => caNum(row.net_before_income_tax_monthly_cad)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impot",
            line: {
                color: CANADA_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} $<extra></extra>" : "Net avant impot : %{y:,.0f} $<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => caNum(row.net_after_income_tax_monthly_cad)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net apres impot",
            line: {
                color: CANADA_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} $<extra></extra>" : "Net apres impot : %{y:,.0f} $<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => caNum(row.employer_cost_monthly_cad)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: CANADA_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} $<extra></extra>"
        }
    ];

    const layout = canadaBaseLayout(lang, lang === "en" ? "Monthly amount, CAD" : "Montant mensuel, CAD");

    layout.yaxis.ticksuffix = " $";

    canadaPlot(
        "chart-canada-cost-" + lang,
        traces,
        layout
    );
}


function renderCanadaRateChart(lang) {
    const data = getCanadaData(getSelectedCanadaProvince(lang));

    const x = data.map(row => caNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => caNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate (CPP/QPP + EI + QPIP)" : "Taux salarie (RPC/RRQ + AE + RQAP)",
            line: {
                color: CANADA_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee: %{y:.1f} %<extra></extra>" : "Salarie : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => caNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate (CPP/QPP + EI + QPIP + EHT/FSS + workers' comp)" : "Taux employeur (RPC/RRQ + AE + RQAP + EHT/FSS + accidents du travail)",
            line: {
                color: CANADA_COLORS.employer,
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
                caNum(row.income_tax_monthly_cad)
                / caNum(row.gross_monthly_cad)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective income tax rate (federal + provincial)" : "Taux d'imposition effectif (federal + provincial)",
            line: {
                color: CANADA_COLORS.incomeTax,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Income tax: %{y:.1f} %<extra></extra>" : "Impot sur le revenu : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = canadaBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 45];

    canadaPlot(
        "chart-canada-rates-" + lang,
        traces,
        layout
    );
}


function renderCanadaWedgeChart(lang) {
    const data = getCanadaData(getSelectedCanadaProvince(lang));
    const t = getI18nText(lang);

    const x = data.map(row => caNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                caNum(row.social_wedge_monthly_cad)
                / caNum(row.employer_cost_monthly_cad)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / cout employeur",
            line: {
                color: CANADA_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                caNum(row.total_wedge_after_income_tax_monthly_cad)
                / caNum(row.employer_cost_monthly_cad)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / cout employeur",
            line: {
                color: CANADA_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => caNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio cout / net avant impot",
            yaxis: "y2",
            line: {
                color: CANADA_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Cout / net avant impot : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => caNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio cout / net apres impot",
            yaxis: "y2",
            line: {
                color: CANADA_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Cout / net apres impot : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = canadaBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / cout employeur");

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 50];

    layout.yaxis2 = {
        title: {
            text: t.cost_net_ratio,
            standoff: 16
        },
        overlaying: "y",
        side: "right",
        range: [1, 2],
        zeroline: false,
        showgrid: false
    };

    canadaPlot(
        "chart-canada-wedge-" + lang,
        traces,
        layout
    );
}


function renderCanadaMarginalRateChart(lang) {
    const target = document.getElementById("chart-canada-marginal-" + lang);

    if (!target) {
        return;
    }

    const data = getCanadaData(getSelectedCanadaProvince(lang)).filter(row => (
        Number.isFinite(caNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(caNum(row.marginal_net_after_income_tax_rate))
        && Number.isFinite(caNum(row.marginal_social_wedge_rate))
        && Number.isFinite(caNum(row.marginal_total_wedge_after_income_tax_rate))
        && caNum(row.delta_gross_monthly_cad) > 0
    ));

    const x = data.map(row => caNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                caNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impot",
            line: {
                color: CANADA_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impot : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                caNum(row.marginal_net_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Apres impot",
            line: {
                color: CANADA_COLORS.afterTax,
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
                caNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: CANADA_COLORS.wedge,
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
                caNum(row.marginal_total_wedge_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prelevement marginal total",
            line: {
                color: CANADA_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prelevement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = canadaBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional CAD of gross wage (%)"
            : "Part d'un CAD supplementaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    canadaPlot(
        "chart-canada-marginal-" + lang,
        traces,
        layout
    );
}


function renderCanadaDataTable(lang) {
    const tableBody = getI18nElement("canada-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const caption = getI18nElement("canada-data-caption", lang);
    const provinceCode = getSelectedCanadaDataProvince(lang);
    const province = getCanadaProvinces().find(p => p.code === provinceCode);

    if (caption) {
        const provinceLabel = province ? (lang === "en" ? province.labelEn : province.labelFr) : "";
        caption.textContent = (lang === "en" ? "Standard employee (" : "Salarie standard (") + provinceLabel + ")";
    }

    const data = getCanadaData(provinceCode);

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            caRatio(row.smic_multiple, lang),
            caCad(row.gross_monthly_cad, lang),
            caCad(row.net_before_income_tax_monthly_cad, lang),
            caCad(row.income_tax_monthly_cad, lang),
            caCad(row.net_after_income_tax_monthly_cad, lang),
            caCad(row.employer_cost_monthly_cad, lang),
            caCad(row.employee_contributions_monthly_cad, lang),
            caCad(row.employer_contributions_monthly_cad, lang),
            caCad(row.social_wedge_monthly_cad, lang),
            caCad(row.total_wedge_after_income_tax_monthly_cad, lang),
            caPct(row.employer_contribution_rate, lang),
            caRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderCanada(lang) {
    renderCanadaMetrics(lang);
    renderCanadaWaterfallChart(lang);
    renderCanadaBreakdownChart(lang);
    renderCanadaCostChart(lang);
    renderCanadaRateChart(lang);
    renderCanadaWedgeChart(lang);
    renderCanadaMarginalRateChart(lang);
    renderCanadaDataTable(lang);
}


function computeCanadaFlclIndicators(row) {
    const net = caNum(row.net_before_income_tax_monthly_cad);
    const employerCost = caNum(row.employer_cost_monthly_cad);

    // Defensive rounding, mirroring the fix already applied in the Sweden
    // and Japan modules (computeSwedenFlclIndicators / computeJapanFlclIndicators):
    // suppresses sub-cent floating-point noise that Plotly's y-axis
    // auto-scaling would otherwise amplify into a false sawtooth pattern.
    // Canada's CPP/QPP/EI/QPIP contributions are smooth percentage-of-income
    // mechanisms with hard caps rather than banded lookup tables, so this
    // is a defensive convention rather than a fix for an observed issue
    // (verified directly from the CSV: Ontario and Quebec each show only 1
    // real sign-flip in their marginal Lab-E delta across the full grid).
    // Uses the Sweden/Japan 4-decimal precision (not the coarser 2-decimal
    // convention used elsewhere): this value's delta is also divided by a
    // ~0.01 grid step in the progressivity chart, so a 2-decimal rounding
    // step gets amplified ~100x into a false integer-snapped staircase --
    // confirmed directly against the unrounded CSV values, which are smooth.
    const rawFlclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclE = Math.round(rawFlclE * 10000) / 10000;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderCanadaFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getCanadaData(getSelectedCanadaFlclProvince(lang));
    const row = findCanadaClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeCanadaFlclIndicators(row);

    setTextContent("canada-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("canada-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("canada-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " CAD " + t.flcl_e_desc);
    setTextContent("canada-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderCanadaFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getCanadaData(getSelectedCanadaFlclProvince(lang));

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = caNum(data[i].net_before_income_tax_monthly_cad) - caNum(data[i - 1].net_before_income_tax_monthly_cad);
        const deltaCost = caNum(data[i].employer_cost_monthly_cad) - caNum(data[i - 1].employer_cost_monthly_cad);
        const deltaMultiple = caNum(data[i].smic_multiple) - caNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeCanadaFlclIndicators(data[i]);
            const previous = computeCanadaFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: caNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findCanadaClosestRow(marginalRows, 1.0);
    const oneRow = findCanadaClosestRow(data, 1.0);
    const threeRow = findCanadaClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeCanadaFlclIndicators(oneRow).flclE - computeCanadaFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("canada-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("canada-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("canada-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("canada-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("canada-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("canada-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("canada-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("canada-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderCanadaFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getCanadaData(getSelectedCanadaFlclProvince(lang));

    const traces = [
        {
            x: data.map(row => caNum(row.smic_multiple)),
            y: data.map(row => computeCanadaFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: CANADA_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} x ref. wage<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = canadaBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    canadaPlot("chart-canada-flcl-e-" + lang, traces, layout);
}


function renderCanadaFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getCanadaData(getSelectedCanadaFlclProvince(lang));

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = caNum(data[i].net_before_income_tax_monthly_cad) - caNum(data[i - 1].net_before_income_tax_monthly_cad);
        const deltaCost = caNum(data[i].employer_cost_monthly_cad) - caNum(data[i - 1].employer_cost_monthly_cad);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(caNum(data[i].smic_multiple));
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
                color: CANADA_COLORS.incomeTax,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: CANADA_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = canadaBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    canadaPlot("chart-canada-flcl-marginal-" + lang, traces, layout);
}


function renderCanadaFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getCanadaData(getSelectedCanadaFlclProvince(lang));

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeCanadaFlclIndicators(data[i]);
        const previous = computeCanadaFlclIndicators(data[i - 1]);
        const deltaMultiple = caNum(data[i].smic_multiple) - caNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(caNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: CANADA_COLORS.employee,
                width: 3
            }
        }
    ];

    const layout = canadaBaseLayout(
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

    canadaPlot("chart-canada-flcl-progressivity-" + lang, traces, layout);
}


function renderCanadaFlclMarginalDestinationChart(lang) {
    const data = getCanadaData(getSelectedCanadaFlclProvince(lang));

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = caNum(data[i].employer_cost_monthly_cad) - caNum(data[i - 1].employer_cost_monthly_cad);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = caNum(data[i].net_before_income_tax_monthly_cad) - caNum(data[i - 1].net_before_income_tax_monthly_cad);
        const deltaEmployee = caNum(data[i].employee_contributions_monthly_cad) - caNum(data[i - 1].employee_contributions_monthly_cad);
        const deltaEmployer = caNum(data[i].employer_contributions_monthly_cad) - caNum(data[i - 1].employer_contributions_monthly_cad);

        x.push(caNum(data[i].smic_multiple));
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
                color: CANADA_COLORS.net,
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
                color: CANADA_COLORS.employee,
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
                color: CANADA_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = canadaBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional CAD, %"
            : "Destination marginale d'un CAD supplementaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    canadaPlot("chart-canada-flcl-destination-" + lang, traces, layout);
}


function renderCanadaFlclIndex(lang) {
    renderCanadaFlclIndexCards(lang);
    renderCanadaFlclMarginalCards(lang);
    renderCanadaFlclEChart(lang);
    renderCanadaFlclMarginalChart(lang);
    renderCanadaFlclProgressivityChart(lang);
    renderCanadaFlclMarginalDestinationChart(lang);
}


function canadaOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderCanada(lang);
    }

    if (tabName === "data") {
        renderCanadaDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderCanadaFlclIndex(lang);
    }
}


function showCanadaTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: CANADA_TAB_STORAGE_KEY,
        onShow: canadaOnTabShow
    });
}


function switchCanadaLanguage() {
    switchLangLanguage({
        storageKey: CANADA_LANGUAGE_STORAGE_KEY,
        tabStorageKey: CANADA_TAB_STORAGE_KEY,
        onShow: canadaOnTabShow
    });
}


function setupCanadaEvents() {
    ["fr", "en"].forEach(function(lang) {
        const waterfallMultipleSelect = getI18nElement("canada-waterfall-multiple", lang);

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderCanadaWaterfallChart(lang);
            });
        }

        const provinceSelect = getI18nElement("canada-province-select", lang);

        if (provinceSelect) {
            provinceSelect.addEventListener("change", function() {
                renderCanada(lang);
            });
        }

        const dataProvinceSelect = getI18nElement("canada-data-province-select", lang);

        if (dataProvinceSelect) {
            dataProvinceSelect.addEventListener("change", function() {
                renderCanadaDataTable(lang);
            });
        }

        const flclProvinceSelect = getI18nElement("canada-flcl-province-select", lang);

        if (flclProvinceSelect) {
            flclProvinceSelect.addEventListener("change", function() {
                renderCanadaFlclIndex(lang);
            });
        }
    });
}


applyStoredCanadaTheme();


Papa.parse(
    CANADA_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            CANADA_DATA = results.data
                .filter(row => row.province_code)
                .sort((a, b) => (
                    caNum(a.smic_multiple)
                    - caNum(b.smic_multiple)
                ));

            console.log(
                "Canada Labour Cost Lab data loaded:",
                CANADA_DATA.length,
                "rows"
            );

            populateCanadaProvinceSelects();
            setupCanadaEvents();

            const initialLang = localStorage.getItem(CANADA_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: CANADA_LANGUAGE_STORAGE_KEY,
                tabStorageKey: CANADA_TAB_STORAGE_KEY,
                onShow: canadaOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Canada CSV loading error:",
                error
            );
        }
    }
);
