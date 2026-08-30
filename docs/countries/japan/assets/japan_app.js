const JAPAN_DATA_PATH = "../../data/japan/japan_labour_cost_grid_2026.csv";
const JAPAN_LANGUAGE_STORAGE_KEY = "japan_language";
const JAPAN_TAB_STORAGE_KEY = "japan_tab";
const JAPAN_DEFAULT_PREFECTURE = "tokyo";

let JAPAN_DATA = [];


function applyStoredJapanTheme() {
    const storedTheme = localStorage.getItem("japan-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateJapanThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateJapanThemeButton("light");
    }
}


function updateJapanThemeButton(theme) {
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
        localStorage.setItem("japan-theme", "dark");
        updateJapanThemeButton("dark");
    } else {
        localStorage.setItem("japan-theme", "light");
        updateJapanThemeButton("light");
    }

    renderJapan(getActiveI18nLanguage(JAPAN_LANGUAGE_STORAGE_KEY));
}


const JAPAN_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    incomeTax: "#0d9488",
    residentTax: "#f59e0b",
    wedge: "#f97316",
    total: "#0f172a"
};

// Palette for the detailed shakai-hoken (social insurance) breakdown chart:
// employee-side components first (purple shades), then employer-side
// components (red/orange/amber shades), mirroring the China module's
// five-insurances-and-housing-fund breakdown palette convention.
const JAPAN_BREAKDOWN_PALETTE = [
    "#9333ea", // health insurance, employee
    "#a855f7", // child-support money, employee
    "#c084fc", // employee pension, employee
    "#d946ef", // employment insurance, employee
    "#dc2626", // health insurance, employer
    "#ef4444", // child-support money, employer
    "#f97316", // employee pension, employer
    "#fb923c", // child/childcare contribution, employer only
    "#eab308", // employment insurance, employer
    "#facc15"  // workers' accident insurance, employer only
];


function jpNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function jpLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


// JPY has no minor/decimal unit in practice: every amount is formatted as a
// rounded whole number with a "¥" prefix, unlike the 2-decimal EUR/USD/GBP
// formatting used elsewhere in this project.
function jpYen(value, lang) {
    return "¥" + Math.round(jpNum(value)).toLocaleString(
        jpLocale(lang),
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    );
}


function jpPct(value, lang) {
    return (jpNum(value) * 100).toLocaleString(
        jpLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function jpRatio(value, lang) {
    const text = jpNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getJapanWaterfallMultiple(lang) {
    const select = getI18nElement("japan-waterfall-multiple", lang);

    if (!select) {
        return 1.00;
    }

    return jpNum(select.value);
}


function getJapanPrefectures() {
    const prefectureMap = new Map();

    JAPAN_DATA.forEach(row => {
        if (!prefectureMap.has(row.prefecture_code)) {
            prefectureMap.set(
                row.prefecture_code,
                {
                    code: row.prefecture_code,
                    labelFr: row.prefecture_name_fr,
                    labelEn: row.prefecture_name_en
                }
            );
        }
    });

    return Array.from(prefectureMap.values());
}


function getSelectedJapanPrefecture(lang) {
    const select = getI18nElement("japan-prefecture-select", lang);

    if (!select) {
        return JAPAN_DEFAULT_PREFECTURE;
    }

    return select.value;
}


function getSelectedJapanDataPrefecture(lang) {
    const select = getI18nElement("japan-data-prefecture-select", lang);

    if (!select) {
        return getSelectedJapanPrefecture(lang);
    }

    return select.value;
}


function getSelectedJapanFlclPrefecture(lang) {
    const select = getI18nElement("japan-flcl-prefecture-select", lang);

    if (!select) {
        return getSelectedJapanPrefecture(lang);
    }

    return select.value;
}


function populateJapanPrefectureSelects() {
    const prefectures = getJapanPrefectures();

    ["fr", "en"].forEach(function(lang) {
        const sortedPrefectures = prefectures.slice().sort((a, b) => (
            lang === "en"
                ? a.labelEn.localeCompare(b.labelEn)
                : a.labelFr.localeCompare(b.labelFr)
        ));

        const selects = [
            getI18nElement("japan-prefecture-select", lang),
            getI18nElement("japan-data-prefecture-select", lang),
            getI18nElement("japan-flcl-prefecture-select", lang)
        ];

        selects.forEach(select => {
            if (!select) {
                return;
            }

            const currentValue = select.value;

            select.innerHTML = "";

            sortedPrefectures.forEach(prefecture => {
                const option = document.createElement("option");

                option.value = prefecture.code;
                option.textContent = lang === "en" ? prefecture.labelEn : prefecture.labelFr;

                if (
                    prefecture.code === currentValue
                    || (!currentValue && prefecture.code === JAPAN_DEFAULT_PREFECTURE)
                ) {
                    option.selected = true;
                }

                select.appendChild(option);
            });
        });
    });
}


function getJapanData(prefectureCode) {
    const prefecture = prefectureCode || JAPAN_DEFAULT_PREFECTURE;

    return JAPAN_DATA
        .filter(row => row.prefecture_code === prefecture)
        .sort((a, b) => jpNum(a.smic_multiple) - jpNum(b.smic_multiple));
}


function findJapanClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            jpNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            jpNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function japanBaseLayout(lang, yAxisTitle) {
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


function japanPlot(elementId, traces, layout) {
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


function renderJapanMetrics(lang) {
    const data = getJapanData(getSelectedJapanPrefecture(lang));
    const referenceRow = data.find(row => jpNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-japan-reference-wage-" + lang,
        jpYen(referenceRow.gross_monthly_jpy, lang)
    );

    const incomeTaxRate = (
        jpNum(referenceRow.income_tax_monthly_jpy)
        / jpNum(referenceRow.gross_monthly_jpy)
    );

    setTextContent(
        "metric-japan-income-tax-rate-" + lang,
        jpPct(incomeTaxRate, lang)
    );

    setTextContent(
        "metric-japan-employer-rate-" + lang,
        jpPct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-japan-cost-to-net-" + lang,
        jpRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );

    const iitMonthly = jpNum(referenceRow.iit_annual_jpy) / 12.0;
    const residentMonthly = jpNum(referenceRow.resident_tax_annual_jpy) / 12.0;
    const residentShare = (iitMonthly + residentMonthly) > 0
        ? residentMonthly / (iitMonthly + residentMonthly)
        : 0;

    setTextContent(
        "metric-japan-resident-tax-share-" + lang,
        jpPct(residentShare, lang)
    );
}


function renderJapanWaterfallChart(lang) {
    const data = getJapanData(getSelectedJapanPrefecture(lang));

    if (!data.length) {
        return;
    }

    const selectedMultiple = getJapanWaterfallMultiple(lang);
    const row = findJapanClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = jpNum(row.smic_multiple);

    const netAfterTax = jpNum(row.net_after_income_tax_monthly_jpy);
    const incomeTax = jpNum(row.income_tax_monthly_jpy);
    const netBeforeTax = jpNum(row.net_before_income_tax_monthly_jpy);
    const employeeContrib = jpNum(row.employee_contributions_monthly_jpy);
    const gross = jpNum(row.gross_monthly_jpy);
    const employerContrib = jpNum(row.employer_contributions_monthly_jpy);
    const employerCost = jpNum(row.employer_cost_monthly_jpy);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " x reference wage"
        : actualMultiple.toFixed(2).replace(".", ",") + " x salaire de reference";

    setTextContent(
        "japan-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Decomposition a ") + multipleLabel
    );

    setTextContent(
        "japan-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + jpYen(gross, lang) + "."
            : "Decomposition detaillee du passage du salaire net apres impot "
                + "au cout employeur total, pour un salaire brut de "
                + jpYen(gross, lang) + "."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Income tax (national + resident)",
            "Net before tax",
            "Employee contributions",
            "Gross wage",
            "Employer contributions",
            "Employer cost"
        ]
        : [
            "Net apres impot",
            "Impot (national + habitation)",
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
                jpYen(netAfterTax, lang),
                "+" + jpYen(incomeTax, lang),
                jpYen(netBeforeTax, lang),
                "+" + jpYen(employeeContrib, lang),
                jpYen(gross, lang),
                "+" + jpYen(employerContrib, lang),
                jpYen(employerCost, lang)
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
                    color: JAPAN_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: JAPAN_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: JAPAN_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.0f} JPY<extra></extra>"
        }
    ];

    const layout = japanBaseLayout(lang, lang === "en" ? "Monthly amount, JPY" : "Montant mensuel, JPY");

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

    layout.yaxis.ticksuffix = " JPY";
    layout.showlegend = false;

    layout.margin = {
        l: 82,
        r: 28,
        t: 34,
        b: 140
    };

    japanPlot(
        "chart-japan-waterfall-" + lang,
        traces,
        layout
    );
}


function renderJapanBreakdownChart(lang) {
    const data = getJapanData(getSelectedJapanPrefecture(lang));

    const x = data.map(row => jpNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const components = [
        {
            key: "health_employee_monthly_jpy",
            fr: "Assurance maladie (salarie)",
            en: "Health insurance (employee)"
        },
        {
            key: "child_support_money_employee_monthly_jpy",
            fr: "Soutien enfants et famille (salarie)",
            en: "Child-support money (employee)"
        },
        {
            key: "pension_employee_monthly_jpy",
            fr: "Retraite salariee (salarie)",
            en: "Employee pension (employee)"
        },
        {
            key: "employment_insurance_employee_monthly_jpy",
            fr: "Assurance emploi (salarie)",
            en: "Employment insurance (employee)"
        },
        {
            key: "health_employer_monthly_jpy",
            fr: "Assurance maladie (employeur)",
            en: "Health insurance (employer)"
        },
        {
            key: "child_support_money_employer_monthly_jpy",
            fr: "Soutien enfants et famille (employeur)",
            en: "Child-support money (employer)"
        },
        {
            key: "pension_employer_monthly_jpy",
            fr: "Retraite salariee (employeur)",
            en: "Employee pension (employer)"
        },
        {
            key: "child_childcare_contribution_monthly_jpy",
            fr: "Cotisation enfants/garde d'enfants (employeur)",
            en: "Child/childcare contribution (employer only)"
        },
        {
            key: "employment_insurance_employer_monthly_jpy",
            fr: "Assurance emploi (employeur)",
            en: "Employment insurance (employer)"
        },
        {
            key: "workers_accident_insurance_monthly_jpy",
            fr: "Assurance accidents du travail (employeur)",
            en: "Workers' accident insurance (employer only)"
        }
    ];

    const traces = components.map((component, index) => ({
        x: x,
        y: data.map(row => jpNum(row[component.key])),
        type: "scatter",
        mode: "lines",
        stackgroup: "one",
        name: lang === "en" ? component.en : component.fr,
        line: {
            color: JAPAN_BREAKDOWN_PALETTE[index % JAPAN_BREAKDOWN_PALETTE.length],
            width: 1
        },
        hovertemplate: hoverPrefix + "%{y:,.0f} JPY<extra></extra>"
    }));

    traces.push({
        x: x,
        y: data.map(row => jpNum(row.total_wedge_after_income_tax_monthly_jpy)),
        type: "scatter",
        mode: "lines",
        name: lang === "en" ? "Total (income tax + employee + employer contributions)" : "Total (impot + cotisations salariales + patronales)",
        line: {
            color: JAPAN_COLORS.total,
            width: 3,
            dash: "dot"
        },
        hovertemplate: hoverPrefix + "%{y:,.0f} JPY<extra></extra>"
    });

    const layout = japanBaseLayout(lang, lang === "en" ? "Monthly amount, JPY" : "Montant mensuel, JPY");

    layout.yaxis.ticksuffix = " JPY";
    layout.height = 520;

    japanPlot(
        "chart-japan-breakdown-" + lang,
        traces,
        layout
    );
}


// Japan-specific chart (see Methodology tab, section 2): the split between
// national income tax (iit_annual_jpy / 12) and resident tax
// (resident_tax_annual_jpy / 12) inside the single bundled
// income_tax_monthly_jpy figure used everywhere else in this module. A 2026
// tax reform raised the national income tax's basic deduction substantially
// (up to JPY 1,040,000) while leaving the resident tax's basic deduction
// flat at JPY 430,000, so resident tax is now frequently the LARGER of the
// two at low and middle income levels -- a genuinely new pattern versus the
// pre-reform system.
function renderJapanTaxSplitChart(lang) {
    const data = getJapanData(getSelectedJapanPrefecture(lang));

    const x = data.map(row => jpNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const nationalTax = data.map(row => jpNum(row.iit_annual_jpy) / 12.0);
    const residentTax = data.map(row => jpNum(row.resident_tax_annual_jpy) / 12.0);
    const total = data.map(row => jpNum(row.income_tax_monthly_jpy));

    const traces = [
        {
            x: x,
            y: nationalTax,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "National income tax (shotokuzei)" : "Impot national sur le revenu (shotokuzei)",
            line: {
                color: JAPAN_COLORS.incomeTax,
                width: 2
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} JPY<extra></extra>"
        },
        {
            x: x,
            y: residentTax,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Resident tax (juminzei)" : "Taxe d'habitation (juminzei)",
            line: {
                color: JAPAN_COLORS.residentTax,
                width: 2
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} JPY<extra></extra>"
        },
        {
            x: x,
            y: total,
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total income tax (bundled figure used elsewhere)" : "Impot total (figure regroupee utilisee ailleurs)",
            line: {
                color: JAPAN_COLORS.total,
                width: 2,
                dash: "dot"
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} JPY<extra></extra>"
        }
    ];

    const layout = japanBaseLayout(lang, lang === "en" ? "Monthly amount, JPY" : "Montant mensuel, JPY");

    layout.yaxis.ticksuffix = " JPY";
    layout.height = 450;

    japanPlot(
        "chart-japan-tax-split-" + lang,
        traces,
        layout
    );
}


function renderJapanCostChart(lang) {
    const data = getJapanData(getSelectedJapanPrefecture(lang));
    const t = getI18nText(lang);

    const x = data.map(row => jpNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => jpNum(row.gross_monthly_jpy)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: JAPAN_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} JPY<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => jpNum(row.net_before_income_tax_monthly_jpy)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impot",
            line: {
                color: JAPAN_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} JPY<extra></extra>" : "Net avant impot : %{y:,.0f} JPY<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => jpNum(row.net_after_income_tax_monthly_jpy)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net apres impot",
            line: {
                color: JAPAN_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} JPY<extra></extra>" : "Net apres impot : %{y:,.0f} JPY<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => jpNum(row.employer_cost_monthly_jpy)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: JAPAN_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} JPY<extra></extra>"
        }
    ];

    const layout = japanBaseLayout(lang, lang === "en" ? "Monthly amount, JPY" : "Montant mensuel, JPY");

    layout.yaxis.ticksuffix = " JPY";

    japanPlot(
        "chart-japan-cost-" + lang,
        traces,
        layout
    );
}


function renderJapanRateChart(lang) {
    const data = getJapanData(getSelectedJapanPrefecture(lang));

    const x = data.map(row => jpNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => jpNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate (social insurance)" : "Taux salarie (assurances sociales)",
            line: {
                color: JAPAN_COLORS.employee,
                width: 2
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee: %{y:.1f} %<extra></extra>" : "Salarie : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => jpNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate (social insurance)" : "Taux employeur (assurances sociales)",
            line: {
                color: JAPAN_COLORS.employer,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employer: %{y:.1f} %<extra></extra>" : "Employeur : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                jpNum(row.income_tax_monthly_jpy)
                / jpNum(row.gross_monthly_jpy)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective income tax rate (national + resident)" : "Taux d'imposition effectif (national + habitation)",
            line: {
                color: JAPAN_COLORS.incomeTax,
                width: 2
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Income tax: %{y:.1f} %<extra></extra>" : "Impot sur le revenu : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = japanBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";

    japanPlot(
        "chart-japan-rates-" + lang,
        traces,
        layout
    );
}


function renderJapanWedgeChart(lang) {
    const data = getJapanData(getSelectedJapanPrefecture(lang));
    const t = getI18nText(lang);

    const x = data.map(row => jpNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                jpNum(row.social_wedge_monthly_jpy)
                / jpNum(row.employer_cost_monthly_jpy)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / cout employeur",
            line: {
                color: JAPAN_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                jpNum(row.total_wedge_after_income_tax_monthly_jpy)
                / jpNum(row.employer_cost_monthly_jpy)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / cout employeur",
            line: {
                color: JAPAN_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => jpNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio cout / net avant impot",
            yaxis: "y2",
            line: {
                color: JAPAN_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Cout / net avant impot : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => jpNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio cout / net apres impot",
            yaxis: "y2",
            line: {
                color: JAPAN_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Cout / net apres impot : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = japanBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / cout employeur");

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 80];

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

    japanPlot(
        "chart-japan-wedge-" + lang,
        traces,
        layout
    );
}


// Japan's health-insurance and pension contributions are looked up from a
// banded "standard monthly remuneration" table (see Methodology), not
// computed as a smooth percentage of actual salary. Crossing a band
// boundary makes the contribution base jump by a discrete amount, which can
// exceed a single 0.01x-reference-wage grid step's gross increase -- a
// real, well-documented "notch" effect, not a data error (confirmed by
// inspecting the raw CSV: net-before-tax genuinely falls between some
// consecutive rows even though gross rises, exactly at a band edge). At
// the CSV's native point-to-point (0.01x) granularity this makes a
// marginal-RATE chart (a derivative, far more sensitive to local noise
// than a level-based chart like Lab-E) swing wildly and become unreadable.
// This module therefore computes marginal rates over a wider window (10
// grid steps, ~0.1x the reference wage) rather than one step at a time,
// averaging across roughly a full contribution band so the real,
// larger-scale trend reads clearly while individual band-edge notches no
// longer dominate the chart. See the Methodology tab for the underlying
// mechanism.
const JAPAN_MARGINAL_WINDOW = 10;

function computeJapanWindowedMarginalSeries(data) {
    const x = [];
    const beforeTax = [];
    const afterTax = [];
    const socialEffect = [];
    const totalLevy = [];

    for (let i = JAPAN_MARGINAL_WINDOW; i < data.length; i++) {
        const prev = data[i - JAPAN_MARGINAL_WINDOW];
        const curr = data[i];

        const deltaGross = jpNum(curr.gross_monthly_jpy) - jpNum(prev.gross_monthly_jpy);

        if (!(deltaGross > 0)) {
            continue;
        }

        const deltaNetBefore = jpNum(curr.net_before_income_tax_monthly_jpy) - jpNum(prev.net_before_income_tax_monthly_jpy);
        const deltaNetAfter = jpNum(curr.net_after_income_tax_monthly_jpy) - jpNum(prev.net_after_income_tax_monthly_jpy);
        const deltaCost = jpNum(curr.employer_cost_monthly_jpy) - jpNum(prev.employer_cost_monthly_jpy);
        const deltaWedgeAfter = jpNum(curr.total_wedge_after_income_tax_monthly_jpy) - jpNum(prev.total_wedge_after_income_tax_monthly_jpy);

        x.push(jpNum(curr.smic_multiple));
        beforeTax.push((deltaNetBefore / deltaGross) * 100);
        afterTax.push((deltaNetAfter / deltaGross) * 100);
        socialEffect.push(((deltaCost - deltaNetBefore) / deltaGross) * 100);
        totalLevy.push((deltaWedgeAfter / deltaGross) * 100);
    }

    return { x, beforeTax, afterTax, socialEffect, totalLevy };
}

function renderJapanMarginalRateChart(lang) {
    const target = document.getElementById("chart-japan-marginal-" + lang);

    if (!target) {
        return;
    }

    const data = getJapanData(getSelectedJapanPrefecture(lang));
    const series = computeJapanWindowedMarginalSeries(data);
    const hoverPrefix = "%{x:.2f} x ref. wage<br>";

    const traces = [
        {
            x: series.x,
            y: series.beforeTax,
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impot",
            line: {
                color: JAPAN_COLORS.net,
                width: 2
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impot : %{y:.1f} %<extra></extra>")
        },
        {
            x: series.x,
            y: series.afterTax,
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Apres impot",
            line: {
                color: JAPAN_COLORS.afterTax,
                width: 2,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "After tax: %{y:.1f} %<extra></extra>" : "Apres impot : %{y:.1f} %<extra></extra>")
        },
        {
            x: series.x,
            y: series.socialEffect,
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: JAPAN_COLORS.wedge,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social effect: %{y:.1f} %<extra></extra>" : "Effet social : %{y:.1f} %<extra></extra>")
        },
        {
            x: series.x,
            y: series.totalLevy,
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prelevement marginal total",
            line: {
                color: JAPAN_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prelevement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = japanBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional JPY of gross wage, averaged over a 0.1x-reference-wage window (%)"
            : "Part d'un yen supplementaire de salaire brut, moyennee sur une fenetre de 0,1x le salaire de reference (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [-20, 120];

    japanPlot(
        "chart-japan-marginal-" + lang,
        traces,
        layout
    );
}


function renderJapanDataTable(lang) {
    const tableBody = getI18nElement("japan-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const caption = getI18nElement("japan-data-caption", lang);
    const prefectureCode = getSelectedJapanDataPrefecture(lang);
    const prefecture = getJapanPrefectures().find(p => p.code === prefectureCode);

    if (caption) {
        const prefectureLabel = prefecture ? (lang === "en" ? prefecture.labelEn : prefecture.labelFr) : "";
        caption.textContent = (lang === "en" ? "Standard employee (" : "Salarie standard (") + prefectureLabel + ")";
    }

    const data = getJapanData(prefectureCode);

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            jpRatio(row.smic_multiple, lang),
            jpYen(row.gross_monthly_jpy, lang),
            jpYen(row.net_before_income_tax_monthly_jpy, lang),
            jpYen(row.income_tax_monthly_jpy, lang),
            jpYen(row.net_after_income_tax_monthly_jpy, lang),
            jpYen(row.employer_cost_monthly_jpy, lang),
            jpYen(row.employee_contributions_monthly_jpy, lang),
            jpYen(row.employer_contributions_monthly_jpy, lang),
            jpYen(row.social_wedge_monthly_jpy, lang),
            jpYen(row.total_wedge_after_income_tax_monthly_jpy, lang),
            jpPct(row.employer_contribution_rate, lang),
            jpRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderJapan(lang) {
    renderJapanMetrics(lang);
    renderJapanWaterfallChart(lang);
    renderJapanBreakdownChart(lang);
    renderJapanTaxSplitChart(lang);
    renderJapanCostChart(lang);
    renderJapanRateChart(lang);
    renderJapanWedgeChart(lang);
    renderJapanMarginalRateChart(lang);
    renderJapanDataTable(lang);
}


function computeJapanFlclIndicators(row) {
    const net = jpNum(row.net_before_income_tax_monthly_jpy);
    const employerCost = jpNum(row.employer_cost_monthly_jpy);

    // Defensive rounding, mirroring the fix already applied in the Sweden,
    // US and China modules (computeSwedenFlclIndicators /
    // computeUsaFlclIndicators / computeChinaFlclIndicators): suppresses
    // sub-yen rounding noise that Plotly's y-axis auto-scaling would
    // otherwise amplify into a false sawtooth pattern, while still letting
    // real step artifacts driven by the standard-remuneration banding (see
    // Methodology tab) show through at the 4-decimal-place level.
    const rawFlclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclE = Math.round(rawFlclE * 10000) / 10000;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderJapanFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getJapanData(getSelectedJapanFlclPrefecture(lang));
    const row = findJapanClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeJapanFlclIndicators(row);

    setTextContent("japan-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("japan-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("japan-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " JPY " + t.flcl_e_desc);
    setTextContent("japan-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderJapanFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getJapanData(getSelectedJapanFlclPrefecture(lang));

    // Windowed, not point-to-point: see the note above
    // computeJapanWindowedMarginalSeries.
    const marginalRows = [];

    for (let i = JAPAN_MARGINAL_WINDOW; i < data.length; i++) {
        const prev = data[i - JAPAN_MARGINAL_WINDOW];
        const curr = data[i];

        const deltaNet = jpNum(curr.net_before_income_tax_monthly_jpy) - jpNum(prev.net_before_income_tax_monthly_jpy);
        const deltaCost = jpNum(curr.employer_cost_monthly_jpy) - jpNum(prev.employer_cost_monthly_jpy);
        const deltaMultiple = jpNum(curr.smic_multiple) - jpNum(prev.smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeJapanFlclIndicators(curr);
            const previous = computeJapanFlclIndicators(prev);

            marginalRows.push({
                smic_multiple: jpNum(curr.smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findJapanClosestRow(marginalRows, 1.0);
    const oneRow = findJapanClosestRow(data, 1.0);
    const threeRow = findJapanClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeJapanFlclIndicators(oneRow).flclE - computeJapanFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("japan-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("japan-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("japan-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("japan-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("japan-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("japan-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("japan-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("japan-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderJapanFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getJapanData(getSelectedJapanFlclPrefecture(lang));

    const traces = [
        {
            x: data.map(row => jpNum(row.smic_multiple)),
            y: data.map(row => computeJapanFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: JAPAN_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} x ref. wage<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = japanBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    japanPlot("chart-japan-flcl-e-" + lang, traces, layout);
}


function renderJapanFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getJapanData(getSelectedJapanFlclPrefecture(lang));

    // Windowed, not point-to-point: see the note above
    // computeJapanWindowedMarginalSeries for why (standard-remuneration
    // banding creates real but very frequent notches at the CSV's native
    // 0.01x granularity).
    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = JAPAN_MARGINAL_WINDOW; i < data.length; i++) {
        const prev = data[i - JAPAN_MARGINAL_WINDOW];
        const curr = data[i];

        const deltaNet = jpNum(curr.net_before_income_tax_monthly_jpy) - jpNum(prev.net_before_income_tax_monthly_jpy);
        const deltaCost = jpNum(curr.employer_cost_monthly_jpy) - jpNum(prev.employer_cost_monthly_jpy);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(jpNum(curr.smic_multiple));
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
                color: JAPAN_COLORS.incomeTax,
                width: 2
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: JAPAN_COLORS.wedge,
                width: 2
            }
        }
    ];

    const layout = japanBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    japanPlot("chart-japan-flcl-marginal-" + lang, traces, layout);
}


function renderJapanFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getJapanData(getSelectedJapanFlclPrefecture(lang));

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeJapanFlclIndicators(data[i]);
        const previous = computeJapanFlclIndicators(data[i - 1]);
        const deltaMultiple = jpNum(data[i].smic_multiple) - jpNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(jpNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: JAPAN_COLORS.employee,
                width: 2
            }
        }
    ];

    const layout = japanBaseLayout(
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

    japanPlot("chart-japan-flcl-progressivity-" + lang, traces, layout);
}


function renderJapanFlclMarginalDestinationChart(lang) {
    const data = getJapanData(getSelectedJapanFlclPrefecture(lang));

    // Windowed, not point-to-point: see the note above
    // computeJapanWindowedMarginalSeries.
    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = JAPAN_MARGINAL_WINDOW; i < data.length; i++) {
        const prev = data[i - JAPAN_MARGINAL_WINDOW];
        const curr = data[i];

        const deltaCost = jpNum(curr.employer_cost_monthly_jpy) - jpNum(prev.employer_cost_monthly_jpy);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = jpNum(curr.net_before_income_tax_monthly_jpy) - jpNum(prev.net_before_income_tax_monthly_jpy);
        const deltaEmployee = jpNum(curr.employee_contributions_monthly_jpy) - jpNum(prev.employee_contributions_monthly_jpy);
        const deltaEmployer = jpNum(curr.employer_contributions_monthly_jpy) - jpNum(prev.employer_contributions_monthly_jpy);

        x.push(jpNum(curr.smic_multiple));
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
                color: JAPAN_COLORS.net,
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
                color: JAPAN_COLORS.employee,
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
                color: JAPAN_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = japanBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional JPY, %"
            : "Destination marginale d'un yen supplementaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [-50, 150];

    japanPlot("chart-japan-flcl-destination-" + lang, traces, layout);
}


function renderJapanFlclIndex(lang) {
    renderJapanFlclIndexCards(lang);
    renderJapanFlclMarginalCards(lang);
    renderJapanFlclEChart(lang);
    renderJapanFlclMarginalChart(lang);
    renderJapanFlclProgressivityChart(lang);
    renderJapanFlclMarginalDestinationChart(lang);
}


function japanOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderJapan(lang);
    }

    if (tabName === "data") {
        renderJapanDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderJapanFlclIndex(lang);
    }
}


function showJapanTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: JAPAN_TAB_STORAGE_KEY,
        onShow: japanOnTabShow
    });
}


function switchJapanLanguage() {
    switchLangLanguage({
        storageKey: JAPAN_LANGUAGE_STORAGE_KEY,
        tabStorageKey: JAPAN_TAB_STORAGE_KEY,
        onShow: japanOnTabShow
    });
}


function setupJapanEvents() {
    ["fr", "en"].forEach(function(lang) {
        const waterfallMultipleSelect = getI18nElement("japan-waterfall-multiple", lang);

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderJapanWaterfallChart(lang);
            });
        }

        const prefectureSelect = getI18nElement("japan-prefecture-select", lang);

        if (prefectureSelect) {
            prefectureSelect.addEventListener("change", function() {
                renderJapan(lang);
            });
        }

        const dataPrefectureSelect = getI18nElement("japan-data-prefecture-select", lang);

        if (dataPrefectureSelect) {
            dataPrefectureSelect.addEventListener("change", function() {
                renderJapanDataTable(lang);
            });
        }

        const flclPrefectureSelect = getI18nElement("japan-flcl-prefecture-select", lang);

        if (flclPrefectureSelect) {
            flclPrefectureSelect.addEventListener("change", function() {
                renderJapanFlclIndex(lang);
            });
        }
    });
}


applyStoredJapanTheme();


Papa.parse(
    JAPAN_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            JAPAN_DATA = results.data
                .filter(row => row.prefecture_code)
                .sort((a, b) => (
                    jpNum(a.smic_multiple)
                    - jpNum(b.smic_multiple)
                ));

            console.log(
                "Japan Labour Cost Lab data loaded:",
                JAPAN_DATA.length,
                "rows"
            );

            populateJapanPrefectureSelects();
            setupJapanEvents();

            const initialLang = localStorage.getItem(JAPAN_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: JAPAN_LANGUAGE_STORAGE_KEY,
                tabStorageKey: JAPAN_TAB_STORAGE_KEY,
                onShow: japanOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Japan CSV loading error:",
                error
            );
        }
    }
);
