const POLAND_DATA_PATH = "../../data/poland/poland_labour_cost_grid_2026.csv";
const POLAND_LANGUAGE_STORAGE_KEY = "poland_language";
const POLAND_TAB_STORAGE_KEY = "poland_tab";
const POLAND_PROFILE_ID = "poland__standard_employee";

// Annual retirement + disability contribution-base cap (PLN 282,600/year),
// modeled as a constant monthly-equivalent ceiling. 23,550 / 4,806 (the 2026
// reference minimum wage) is the multiple at which the cap starts to bind;
// used only to place chart annotations, never to recompute contributions
// (those come straight from the CSV, which already applies the cap).
const POLAND_CAP_MONTHLY_PLN = 23550.0;
const POLAND_REFERENCE_WAGE_PLN = 4806.0;
const POLAND_CAP_MULTIPLE = POLAND_CAP_MONTHLY_PLN / POLAND_REFERENCE_WAGE_PLN;

let POLAND_DATA = [];


function applyStoredPolandTheme() {
    const storedTheme = localStorage.getItem("poland-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updatePolandThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updatePolandThemeButton("light");
    }
}


function updatePolandThemeButton(theme) {
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
        localStorage.setItem("poland-theme", "dark");
        updatePolandThemeButton("dark");
    } else {
        localStorage.setItem("poland-theme", "light");
        updatePolandThemeButton("light");
    }

    renderPoland(getActiveI18nLanguage(POLAND_LANGUAGE_STORAGE_KEY));
}


const POLAND_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    incomeTax: "#0d9488",
    health: "#a16207",
    wedge: "#f97316",
    total: "#0f172a",
    capZone: "rgba(249, 115, 22, 0.14)"
};

// Detailed breakdown palette: employee-side ZUS components first (purple
// shades), then employer-side components (red/orange/amber shades),
// mirroring the China module's five-insurances-and-housing-fund breakdown
// palette convention.
const POLAND_BREAKDOWN_PALETTE = {
    retirementEmployee: "#9333ea",
    disabilityEmployee: "#a855f7",
    sicknessEmployee: "#c084fc",
    retirementEmployer: "#dc2626",
    disabilityEmployer: "#ef4444",
    accidentEmployer: "#f97316",
    labourFundEmployer: "#fb923c",
    guaranteedBenefitsFundEmployer: "#eab308"
};


function plNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


// Locale used for number formatting follows the reader's chosen UI language
// (fr-FR / en-US), not the country being described -- this project's
// convention across every module (see e.g. Sweden's seLocale, Ireland's
// ieLocale). "pl-PL" is deliberately never used here.
function plLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function plCur(value, lang) {
    return plNum(value).toLocaleString(
        plLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function plPct(value, lang) {
    return (plNum(value) * 100).toLocaleString(
        plLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function plRatio(value, lang) {
    const text = plNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getPolandWaterfallMultiple(lang) {
    const select = getI18nElement("poland-waterfall-multiple", lang);

    if (!select) {
        return 2.00;
    }

    return plNum(select.value);
}


function getPolandData() {
    return POLAND_DATA
        .filter(row => row.profile_id === POLAND_PROFILE_ID)
        .sort((a, b) => plNum(a.smic_multiple) - plNum(b.smic_multiple));
}


function findPolandClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            plNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            plNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function polandEmployeeZusMonthly(row) {
    return (
        plNum(row.retirement_employee_monthly_pln)
        + plNum(row.disability_employee_monthly_pln)
        + plNum(row.sickness_employee_monthly_pln)
    );
}


function polandBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en" ? "Multiple of the Polish minimum wage" : "Multiple du salaire minimum polonais",
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


function polandPlot(elementId, traces, layout) {
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


function renderPolandMetrics(lang) {
    const data = getPolandData();
    const referenceRow = data.find(row => plNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-poland-reference-wage-" + lang,
        plCur(referenceRow.gross_monthly_pln, lang) + " PLN"
    );

    const incomeTaxRate = (
        plNum(referenceRow.income_tax_monthly_pln)
        / plNum(referenceRow.gross_monthly_pln)
    );

    setTextContent(
        "metric-poland-income-tax-rate-" + lang,
        plPct(incomeTaxRate, lang)
    );

    setTextContent(
        "metric-poland-employer-rate-" + lang,
        plPct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-poland-cost-to-net-" + lang,
        plRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );
}


function renderPolandWaterfallChart(lang) {
    const data = getPolandData();

    if (!data.length) {
        return;
    }

    const selectedMultiple = getPolandWaterfallMultiple(lang);
    const row = findPolandClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = plNum(row.smic_multiple);

    const netAfterTax = plNum(row.net_after_income_tax_monthly_pln);
    const incomeTax = plNum(row.income_tax_monthly_pln);
    const netBeforeTax = plNum(row.net_before_income_tax_monthly_pln);
    const employeeContributions = plNum(row.employee_contributions_monthly_pln);
    const gross = plNum(row.gross_monthly_pln);
    const employerContributions = plNum(row.employer_contributions_monthly_pln);
    const employerCost = plNum(row.employer_cost_monthly_pln);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " minimum wage(s)"
        : actualMultiple.toFixed(2).replace(".", ",") + " salaire(s) minimum(s)";

    setTextContent(
        "poland-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Décomposition à ") + multipleLabel
    );

    setTextContent(
        "poland-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + plCur(gross, lang) + " PLN."
            : "Décomposition détaillée du passage du salaire net après impôt "
                + "au coût employeur total, pour un salaire brut de "
                + plCur(gross, lang) + " PLN."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Income tax",
            "Net before tax",
            "Employee contributions",
            "Gross wage",
            "Employer contributions",
            "Employer cost"
        ]
        : [
            "Net après impôt",
            "Impôt sur le revenu",
            "Net avant impôt",
            "Cotisations salariales",
            "Salaire brut",
            "Cotisations employeur",
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
                employeeContributions,
                gross,
                employerContributions,
                employerCost
            ],
            text: [
                plCur(netAfterTax, lang) + " PLN",
                "+" + plCur(incomeTax, lang) + " PLN",
                plCur(netBeforeTax, lang) + " PLN",
                "+" + plCur(employeeContributions, lang) + " PLN",
                plCur(gross, lang) + " PLN",
                "+" + plCur(employerContributions, lang) + " PLN",
                plCur(employerCost, lang) + " PLN"
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
                    color: POLAND_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: POLAND_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: POLAND_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} PLN<extra></extra>"
        }
    ];

    const layout = polandBaseLayout(lang, lang === "en" ? "Monthly amount, PLN" : "Montant mensuel, PLN");

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

    layout.yaxis.ticksuffix = " PLN";
    layout.showlegend = false;

    layout.margin = {
        l: 92,
        r: 28,
        t: 34,
        b: 125
    };

    polandPlot(
        "chart-poland-waterfall-" + lang,
        traces,
        layout
    );
}


function renderPolandCostChart(lang) {
    const data = getPolandData();
    const t = getI18nText(lang);

    const x = data.map(row => plNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => plNum(row.gross_monthly_pln)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: POLAND_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} PLN<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => plNum(row.net_before_income_tax_monthly_pln)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impôt",
            line: {
                color: POLAND_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} PLN<extra></extra>" : "Net avant impôt : %{y:,.0f} PLN<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => plNum(row.net_after_income_tax_monthly_pln)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net après impôt",
            line: {
                color: POLAND_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} PLN<extra></extra>" : "Net après impôt : %{y:,.0f} PLN<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => plNum(row.employer_cost_monthly_pln)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: POLAND_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} PLN<extra></extra>"
        }
    ];

    const layout = polandBaseLayout(lang, lang === "en" ? "Monthly amount, PLN" : "Montant mensuel, PLN");

    layout.yaxis.ticksuffix = " PLN";

    polandPlot(
        "chart-poland-cost-" + lang,
        traces,
        layout
    );
}


function renderPolandRateChart(lang) {
    const data = getPolandData();

    const x = data.map(row => plNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => plNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate (ZUS + health)" : "Taux salarié (ZUS + maladie)",
            line: {
                color: POLAND_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee contributions: %{y:.1f} %<extra></extra>" : "Cotisations salarié : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => plNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate (ZUS)" : "Taux employeur (ZUS)",
            line: {
                color: POLAND_COLORS.employer,
                width: 3,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employer contributions: %{y:.1f} %<extra></extra>" : "Cotisations employeur : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                plNum(row.income_tax_monthly_pln)
                / plNum(row.gross_monthly_pln)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective income tax rate" : "Taux d'imposition effectif",
            line: {
                color: POLAND_COLORS.incomeTax,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Income tax: %{y:.1f} %<extra></extra>" : "Impôt sur le revenu : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = polandBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 50];

    const isDarkMode = document.body.classList.contains("dark-mode");
    const annotationColor = isDarkMode ? "#fdba74" : "#c2410c";

    // Two visible callouts, mirroring the China module's contribution-base
    // floor annotation pattern: a kink at 1.00x (Labour Fund/FGSP exemption
    // below the minimum wage) and a shaded zone from the ZUS retirement +
    // disability cap (~4.90x) onward, where the employer/employee rates
    // gradually decline. Neither is a computation error -- see the
    // Methodology tab, section 1.
    layout.shapes = [
        {
            type: "line",
            xref: "x",
            yref: "paper",
            x0: 1.0,
            x1: 1.0,
            y0: 0,
            y1: 1,
            line: {
                color: annotationColor,
                dash: "dot",
                width: 1.5
            }
        },
        {
            type: "rect",
            xref: "x",
            yref: "paper",
            x0: POLAND_CAP_MULTIPLE,
            x1: 6.05,
            y0: 0,
            y1: 1,
            fillcolor: POLAND_COLORS.capZone,
            line: { width: 0 },
            layer: "below"
        }
    ];

    layout.annotations = [
        {
            x: 1.0,
            y: 46,
            xref: "x",
            yref: "y",
            showarrow: false,
            align: "left",
            xanchor: "left",
            font: {
                size: 11,
                color: annotationColor
            },
            text: lang === "en"
                ? " Labour Fund + FGSP kick in here"
                : " Fundusz Pracy + FGSP actifs ici"
        },
        {
            x: (POLAND_CAP_MULTIPLE + 6.05) / 2,
            y: 8,
            xref: "x",
            yref: "y",
            showarrow: false,
            align: "center",
            font: {
                size: 11,
                color: annotationColor
            },
            text: lang === "en"
                ? "ZUS retirement + disability cap active<br>above ~4.90× (not an error)"
                : "Plafond ZUS retraite + invalidité actif<br>au-delà de ~4,90× (pas une erreur)"
        }
    ];

    polandPlot(
        "chart-poland-rates-" + lang,
        traces,
        layout
    );
}


function renderPolandContribTaxChart(lang) {
    const data = getPolandData();

    const x = data.map(row => plNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    function line(field, name, color, extra) {
        return Object.assign({
            x: x,
            y: data.map(row => plNum(row[field])),
            type: "scatter",
            mode: "lines",
            name: name,
            line: Object.assign({ color: color, width: 1.75 }, extra || {}),
            hovertemplate: hoverPrefix + "%{y:,.0f} PLN<extra></extra>"
        });
    }

    const traces = [
        line(
            "retirement_employee_monthly_pln",
            lang === "en" ? "Retirement (employee)" : "Retraite (salarié)",
            POLAND_BREAKDOWN_PALETTE.retirementEmployee
        ),
        line(
            "disability_employee_monthly_pln",
            lang === "en" ? "Disability (employee)" : "Invalidité (salarié)",
            POLAND_BREAKDOWN_PALETTE.disabilityEmployee
        ),
        line(
            "sickness_employee_monthly_pln",
            lang === "en" ? "Sickness (employee)" : "Maladie ZUS (salarié)",
            POLAND_BREAKDOWN_PALETTE.sicknessEmployee
        ),
        line(
            "retirement_employer_monthly_pln",
            lang === "en" ? "Retirement (employer)" : "Retraite (employeur)",
            POLAND_BREAKDOWN_PALETTE.retirementEmployer
        ),
        line(
            "disability_employer_monthly_pln",
            lang === "en" ? "Disability (employer)" : "Invalidité (employeur)",
            POLAND_BREAKDOWN_PALETTE.disabilityEmployer
        ),
        line(
            "accident_employer_monthly_pln",
            lang === "en" ? "Accident insurance (employer)" : "Accidents du travail (employeur)",
            POLAND_BREAKDOWN_PALETTE.accidentEmployer
        ),
        line(
            "labour_fund_employer_monthly_pln",
            lang === "en" ? "Labour Fund (employer)" : "Fundusz Pracy (employeur)",
            POLAND_BREAKDOWN_PALETTE.labourFundEmployer
        ),
        line(
            "guaranteed_benefits_fund_employer_monthly_pln",
            lang === "en" ? "FGSP (employer)" : "FGŚP (employeur)",
            POLAND_BREAKDOWN_PALETTE.guaranteedBenefitsFundEmployer
        ),
        line(
            "health_insurance_monthly_pln",
            lang === "en" ? "NFZ health insurance" : "Assurance maladie NFZ",
            POLAND_COLORS.health,
            { width: 2 }
        ),
        line(
            "income_tax_monthly_pln",
            lang === "en" ? "Income tax (PIT)" : "Impôt sur le revenu (PIT)",
            POLAND_COLORS.incomeTax,
            { width: 2, dash: "dash" }
        ),
        {
            x: x,
            y: data.map(row => (
                polandEmployeeZusMonthly(row)
                + plNum(row.employer_contributions_monthly_pln)
                + plNum(row.health_insurance_monthly_pln)
                + plNum(row.income_tax_monthly_pln)
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total" : "Total",
            line: {
                color: POLAND_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} PLN<extra></extra>"
        }
    ];

    const layout = polandBaseLayout(lang, lang === "en" ? "Monthly amount, PLN" : "Montant mensuel, PLN");

    layout.yaxis.ticksuffix = " PLN";
    layout.height = 460;

    polandPlot(
        "chart-poland-contrib-tax-" + lang,
        traces,
        layout
    );
}


function renderPolandWedgeChart(lang) {
    const data = getPolandData();
    const t = getI18nText(lang);

    const x = data.map(row => plNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                plNum(row.social_wedge_monthly_pln)
                / plNum(row.employer_cost_monthly_pln)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / coût employeur",
            line: {
                color: POLAND_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                plNum(row.total_wedge_after_income_tax_monthly_pln)
                / plNum(row.employer_cost_monthly_pln)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / coût employeur",
            line: {
                color: POLAND_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => plNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio coût / net avant impôt",
            yaxis: "y2",
            line: {
                color: POLAND_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Coût / net avant impôt : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => plNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio coût / net après impôt",
            yaxis: "y2",
            line: {
                color: POLAND_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Coût / net après impôt : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = polandBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / coût employeur");

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

    polandPlot(
        "chart-poland-wedge-" + lang,
        traces,
        layout
    );
}


function renderPolandFiscalReturnChart(lang) {
    const target = document.getElementById("chart-poland-fiscal-return-" + lang);

    if (!target) {
        return;
    }

    const data = getPolandData().filter(row => (
        Number.isFinite(plNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(plNum(row.marginal_net_after_income_tax_rate))
        && Number.isFinite(plNum(row.marginal_social_wedge_rate))
        && Number.isFinite(plNum(row.marginal_total_wedge_after_income_tax_rate))
        && plNum(row.delta_gross_monthly_pln) > 0
    ));

    const x = data.map(row => plNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                plNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impôt",
            line: {
                color: POLAND_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impôt : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                plNum(row.marginal_net_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Après impôt",
            line: {
                color: POLAND_COLORS.afterTax,
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
                plNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: POLAND_COLORS.wedge,
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
                plNum(row.marginal_total_wedge_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prélèvement marginal total",
            line: {
                color: POLAND_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prélèvement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = polandBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional zloty of gross wage (%)"
            : "Part d'un zloty supplémentaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    polandPlot(
        "chart-poland-fiscal-return-" + lang,
        traces,
        layout
    );
}


function renderPolandDataTable(lang) {
    const tableBody = getI18nElement("poland-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const caption = getI18nElement("poland-data-caption", lang);

    if (caption) {
        caption.textContent = lang === "en" ? "Standard employee" : "Salarié standard";
    }

    const data = getPolandData();

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            plRatio(row.smic_multiple, lang),
            plCur(row.gross_monthly_pln, lang),
            plCur(row.retirement_employee_monthly_pln, lang),
            plCur(row.disability_employee_monthly_pln, lang),
            plCur(row.sickness_employee_monthly_pln, lang),
            plCur(row.health_insurance_monthly_pln, lang),
            plCur(row.net_before_income_tax_monthly_pln, lang),
            plCur(row.income_tax_monthly_pln, lang),
            plCur(row.net_after_income_tax_monthly_pln, lang),
            plCur(row.retirement_employer_monthly_pln, lang),
            plCur(row.disability_employer_monthly_pln, lang),
            plCur(row.accident_employer_monthly_pln, lang),
            plCur(row.labour_fund_employer_monthly_pln, lang),
            plCur(row.guaranteed_benefits_fund_employer_monthly_pln, lang),
            plCur(row.employer_cost_monthly_pln, lang),
            plCur(row.social_wedge_monthly_pln, lang),
            plCur(row.total_wedge_after_income_tax_monthly_pln, lang),
            plPct(row.employer_contribution_rate, lang),
            plRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderPoland(lang) {
    renderPolandMetrics(lang);
    renderPolandWaterfallChart(lang);
    renderPolandCostChart(lang);
    renderPolandRateChart(lang);
    renderPolandContribTaxChart(lang);
    renderPolandWedgeChart(lang);
    renderPolandFiscalReturnChart(lang);
    renderPolandDataTable(lang);
}


function computePolandFlclIndicators(row) {
    const net = plNum(row.net_before_income_tax_monthly_pln);
    const employerCost = plNum(row.employer_cost_monthly_pln);

    // Round to 4 decimal places to suppress sub-cent floating-point noise
    // from the underlying net/employer-cost series before computing Lab-E.
    // Poland's underlying PIT/ZUS calculation is smooth (no banded lookup
    // tables), so 4dp is both sufficient to remove noise on the main Lab-E
    // chart AND safe for the progressivity chart's derivative
    // (current.flclE - previous.flclE) / deltaMultiple, where deltaMultiple
    // is the ~0.01 wage-grid step: a coarser 2dp rounding (as used in the
    // France/Ireland/Spain modules) would get amplified about 100x by that
    // division and produce a false integer-snapped staircase artifact, as
    // was found and fixed in the Canada module (commit c2058b3). Mirrors
    // the Sweden/Japan convention instead.
    const rawFlclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclE = Math.round(rawFlclE * 10000) / 10000;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderPolandFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getPolandData();
    const row = findPolandClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computePolandFlclIndicators(row);

    setTextContent("poland-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("poland-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("poland-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " PLN " + t.flcl_e_desc);
    setTextContent("poland-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderPolandFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getPolandData();

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = plNum(data[i].net_before_income_tax_monthly_pln) - plNum(data[i - 1].net_before_income_tax_monthly_pln);
        const deltaCost = plNum(data[i].employer_cost_monthly_pln) - plNum(data[i - 1].employer_cost_monthly_pln);
        const deltaMultiple = plNum(data[i].smic_multiple) - plNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computePolandFlclIndicators(data[i]);
            const previous = computePolandFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: plNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findPolandClosestRow(marginalRows, 1.0);
    const oneRow = findPolandClosestRow(data, 1.0);
    const threeRow = findPolandClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computePolandFlclIndicators(oneRow).flclE - computePolandFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("poland-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("poland-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("poland-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("poland-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("poland-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("poland-flcl-capture-caption-" + lang, t.marginal_capture_desc);

    // The reference wage (1.0x) is exactly where the employer-side Labour
    // Fund and Guaranteed Employee Benefits Fund contributions switch on
    // (see Methodology): a real, one-time institutional threshold, not
    // calculation noise. Because it falls exactly on this card's reference
    // point, the point-to-point Lab-E derivative here is genuinely much
    // larger than anywhere else on the grid (0-3.5 pts elsewhere). The
    // generic shared caption would make this number look like an error, so
    // Poland overrides it with an explanation specific to this threshold.
    setTextContent(
        "poland-flcl-progressivity-caption-" + lang,
        lang === "en"
            ? "Unusually large here because the reference wage (1.0x) is exactly where the employer's Labour Fund and FGSP levies switch on (see Methodology); elsewhere on the grid this indicator stays within 0-3.5 points."
            : "Valeur inhabituellement élevée ici car le salaire de référence (1,0x) correspond exactement au seuil d'activation du Fundusz Pracy et du FGSP côté employeur (voir Méthodologie) ; ailleurs sur la grille, cet indicateur reste compris entre 0 et 3,5 points."
    );
    setTextContent("poland-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderPolandFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getPolandData();

    const traces = [
        {
            x: data.map(row => plNum(row.smic_multiple)),
            y: data.map(row => computePolandFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: POLAND_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × min. wage<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = polandBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    polandPlot("chart-poland-flcl-e-" + lang, traces, layout);
}


function renderPolandFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getPolandData();

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = plNum(data[i].net_before_income_tax_monthly_pln) - plNum(data[i - 1].net_before_income_tax_monthly_pln);
        const deltaCost = plNum(data[i].employer_cost_monthly_pln) - plNum(data[i - 1].employer_cost_monthly_pln);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(plNum(data[i].smic_multiple));
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
                color: POLAND_COLORS.incomeTax,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: POLAND_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = polandBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    polandPlot("chart-poland-flcl-marginal-" + lang, traces, layout);
}


function renderPolandFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getPolandData();

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computePolandFlclIndicators(data[i]);
        const previous = computePolandFlclIndicators(data[i - 1]);
        const deltaMultiple = plNum(data[i].smic_multiple) - plNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(plNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: POLAND_COLORS.employee,
                width: 3
            }
        }
    ];

    const layout = polandBaseLayout(
        lang,
        lang === "en" ? "Lab-E points per minimum wage" : "Points de Lab-E par salaire minimum"
    );
    layout.height = 400;

    // The employer's Labour Fund and FGSP levies switch on exactly at the
    // 1.0x reference wage (see Methodology), producing one genuine,
    // isolated derivative spike (around -141 points) at that single grid
    // step. Left on auto-scale, this single real point forces the y-axis
    // to span roughly -150 to +10, squeezing the meaningful 0-3.5 point
    // variation seen everywhere else on the grid into an unreadable sliver.
    // A fixed range keeps that variation visible; the spike is still
    // present in the data and shown in full via the hover tooltip, just
    // visually clipped at the axis edge -- the same "explain, don't hide"
    // treatment used for other countries' genuine (but disruptive) kinks.
    layout.yaxis.range = [-8, 6];

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

    layout.annotations = [{
        x: 1.0,
        y: -8,
        xref: "x",
        yref: "y",
        text: lang === "en"
            ? "Labour Fund / FGSP threshold (~-141 pts, clipped)"
            : "Seuil Fundusz Pracy / FGSP (~-141 pts, tronqué)",
        showarrow: true,
        arrowhead: 2,
        ax: 40,
        ay: -30,
        font: { size: 10, color: "#64748b" }
    }];

    polandPlot("chart-poland-flcl-progressivity-" + lang, traces, layout);
}


function renderPolandFlclMarginalDestinationChart(lang) {
    const data = getPolandData();

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = plNum(data[i].employer_cost_monthly_pln) - plNum(data[i - 1].employer_cost_monthly_pln);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = plNum(data[i].net_before_income_tax_monthly_pln) - plNum(data[i - 1].net_before_income_tax_monthly_pln);
        const deltaEmployee = plNum(data[i].employee_contributions_monthly_pln) - plNum(data[i - 1].employee_contributions_monthly_pln);
        const deltaEmployer = plNum(data[i].employer_contributions_monthly_pln) - plNum(data[i - 1].employer_contributions_monthly_pln);

        x.push(plNum(data[i].smic_multiple));
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
                color: POLAND_COLORS.net,
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
                color: POLAND_COLORS.employee,
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
                color: POLAND_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = polandBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional zloty, %"
            : "Destination marginale d'un zloty supplémentaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    polandPlot("chart-poland-flcl-destination-" + lang, traces, layout);
}


function renderPolandFlclIndex(lang) {
    renderPolandFlclIndexCards(lang);
    renderPolandFlclMarginalCards(lang);
    renderPolandFlclEChart(lang);
    renderPolandFlclMarginalChart(lang);
    renderPolandFlclProgressivityChart(lang);
    renderPolandFlclMarginalDestinationChart(lang);
}


function polandOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderPoland(lang);
    }

    if (tabName === "data") {
        renderPolandDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderPolandFlclIndex(lang);
    }
}


function showPolandTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: POLAND_TAB_STORAGE_KEY,
        onShow: polandOnTabShow
    });
}


function switchPolandLanguage() {
    switchLangLanguage({
        storageKey: POLAND_LANGUAGE_STORAGE_KEY,
        tabStorageKey: POLAND_TAB_STORAGE_KEY,
        onShow: polandOnTabShow
    });
}


function setupPolandEvents() {
    ["fr", "en"].forEach(function(lang) {
        const waterfallMultipleSelect = getI18nElement("poland-waterfall-multiple", lang);

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderPolandWaterfallChart(lang);
            });
        }
    });
}


applyStoredPolandTheme();


Papa.parse(
    POLAND_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            POLAND_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => (
                    plNum(a.smic_multiple)
                    - plNum(b.smic_multiple)
                ));

            console.log(
                "Poland Labour Cost Lab data loaded:",
                POLAND_DATA.length,
                "rows"
            );

            setupPolandEvents();

            const initialLang = localStorage.getItem(POLAND_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: POLAND_LANGUAGE_STORAGE_KEY,
                tabStorageKey: POLAND_TAB_STORAGE_KEY,
                onShow: polandOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Poland CSV loading error:",
                error
            );
        }
    }
);
