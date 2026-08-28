const ITALY_DATA_PATH = "../../data/italy/italy_labour_cost_grid_2026.csv";
const ITALY_LANGUAGE_STORAGE_KEY = "italy_language";
const ITALY_TAB_STORAGE_KEY = "italy_tab";
const ITALY_PROFILE_ID = "italy__standard_employee_roma_lazio";

let ITALY_DATA = [];


function applyStoredItalyTheme() {
    const storedTheme = localStorage.getItem("italy-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateItalyThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateItalyThemeButton("light");
    }
}


function updateItalyThemeButton(theme) {
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
        localStorage.setItem("italy-theme", "dark");
        updateItalyThemeButton("dark");
    } else {
        localStorage.setItem("italy-theme", "light");
        updateItalyThemeButton("light");
    }

    renderItaly(getActiveI18nLanguage(ITALY_LANGUAGE_STORAGE_KEY));
}


const ITALY_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    incomeTax: "#0d9488",
    tfr: "#7c3aed",
    ivsEmployer: "#dc2626",
    ivsEmployee: "#9333ea",
    otherEmployer: "#f59e0b",
    otherEmployee: "#c084fc",
    aggiuntivo: "#be123c",
    irpef: "#0d9488",
    addRegionale: "#a16207",
    addComunale: "#65a30d",
    wedge: "#f97316",
    total: "#0f172a"
};


function itNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function itLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function eur(value, lang) {
    return itNum(value).toLocaleString(
        itLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function itPct(value, lang) {
    return (itNum(value) * 100).toLocaleString(
        itLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function itRatio(value, lang) {
    const text = itNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getItalyWaterfallMultiple(lang) {
    const select = getI18nElement("italy-waterfall-multiple", lang);

    if (!select) {
        return 1.00;
    }

    return itNum(select.value);
}


function getItalyData() {
    return ITALY_DATA
        .filter(row => row.profile_id === ITALY_PROFILE_ID)
        .sort((a, b) => itNum(a.smic_multiple) - itNum(b.smic_multiple));
}


function findItalyClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            itNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            itNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


// Reconstructs the monthly national-IRPEF-net figure (IRPEF lorda less the
// three detrazioni, converted to a monthly amount) from the CSV's annual
// sub-total columns, mirroring how the Sweden module reconstructs
// kommunalskatt/statlig skatt from annual columns.
function italyIrpefNetMonthly(row) {
    const annual = (
        itNum(row.irpef_lorda_annual_eur)
        - itNum(row.detrazione_lavoro_dipendente_annual_eur)
        - itNum(row.ulteriore_detrazione_annual_eur)
        - itNum(row.trattamento_integrativo_annual_eur)
    );

    return annual / 12;
}


function italyOtherEmployerMonthly(row) {
    return (
        itNum(row.naspi_monthly_eur)
        + itNum(row.cigo_monthly_eur)
        + itNum(row.cigs_employer_monthly_eur)
        + itNum(row.maternita_monthly_eur)
        + itNum(row.fondo_garanzia_tfr_monthly_eur)
        + itNum(row.cuaf_monthly_eur)
        + itNum(row.inail_monthly_eur)
    );
}


function italyBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en" ? "Multiple of the Italian reference wage" : "Multiple du salaire de référence italien",
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


function italyPlot(elementId, traces, layout) {
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


function renderItalyMetrics(lang) {
    const data = getItalyData();
    const referenceRow = data.find(row => itNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-italy-reference-wage-" + lang,
        eur(referenceRow.gross_monthly_eur, lang) + " EUR"
    );

    const incomeTaxRate = (
        itNum(referenceRow.income_tax_monthly_eur)
        / itNum(referenceRow.gross_monthly_eur)
    );

    setTextContent(
        "metric-italy-income-tax-rate-" + lang,
        itPct(incomeTaxRate, lang)
    );

    setTextContent(
        "metric-italy-employer-rate-" + lang,
        itPct(referenceRow.employer_contribution_rate, lang)
    );

    const tfrRate = (
        itNum(referenceRow.tfr_accrual_monthly_eur)
        / itNum(referenceRow.employer_cost_monthly_eur)
    );

    setTextContent(
        "metric-italy-tfr-rate-" + lang,
        itPct(tfrRate, lang)
    );

    setTextContent(
        "metric-italy-cost-to-net-" + lang,
        itRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );
}


function renderItalyWaterfallChart(lang) {
    const data = getItalyData();

    if (!data.length) {
        return;
    }

    const selectedMultiple = getItalyWaterfallMultiple(lang);
    const row = findItalyClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = itNum(row.smic_multiple);

    const netAfterTax = itNum(row.net_after_income_tax_monthly_eur);
    const incomeTax = itNum(row.income_tax_monthly_eur);
    const netBeforeTax = itNum(row.net_before_income_tax_monthly_eur);
    const employeeContrib = itNum(row.employee_contributions_monthly_eur);
    const gross = itNum(row.gross_monthly_eur);
    const employerContrib = itNum(row.employer_contributions_monthly_eur);
    const tfr = itNum(row.tfr_accrual_monthly_eur);
    const employerCost = itNum(row.employer_cost_monthly_eur);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " reference wage(s)"
        : actualMultiple.toFixed(2).replace(".", ",") + " salaire(s) de référence";

    setTextContent(
        "italy-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Décomposition à ") + multipleLabel
    );

    setTextContent(
        "italy-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + eur(gross, lang) + " EUR."
            : "Décomposition détaillée du passage du salaire net après impôt "
                + "au coût employeur total, pour un salaire brut de "
                + eur(gross, lang) + " EUR."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Income tax",
            "Net before tax",
            "Employee contributions (INPS)",
            "Gross wage",
            "Employer contributions (INPS)",
            "TFR (deferred severance)",
            "Employer cost"
        ]
        : [
            "Net après impôt",
            "Impôt sur le revenu",
            "Net avant impôt",
            "Cotisations salariales (INPS)",
            "Salaire brut",
            "Cotisations patronales (INPS)",
            "TFR (indemnité de départ différée)",
            "Coût employeur"
        ];

    const values = [
        netAfterTax,
        incomeTax,
        netBeforeTax,
        employeeContrib,
        gross,
        employerContrib,
        tfr,
        employerCost
    ];

    const measures = [
        "absolute",
        "relative",
        "total",
        "relative",
        "total",
        "relative",
        "relative",
        "total"
    ];

    // Distinct per-bar colors (rather than the increasing/decreasing/totals
    // trio) so the TFR bar can carry its own dedicated color, visually
    // separating it from ordinary INPS employer contributions.
    const barColors = [
        ITALY_COLORS.net,
        ITALY_COLORS.wedge,
        ITALY_COLORS.gross,
        ITALY_COLORS.wedge,
        ITALY_COLORS.gross,
        ITALY_COLORS.employer,
        ITALY_COLORS.tfr,
        ITALY_COLORS.total
    ];

    const traces = [
        {
            type: "waterfall",
            orientation: "v",
            measure: measures,
            x: labels,
            y: values,
            text: values.map((value, index) => (
                (index === 1 || index === 3 || index === 5 || index === 6 ? "+" : "")
                + eur(value, lang) + " EUR"
            )),
            textposition: "outside",
            cliponaxis: false,
            connector: {
                line: {
                    color: "rgba(100, 116, 139, 0.45)"
                }
            },
            marker: {
                color: barColors
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} EUR<extra></extra>"
        }
    ];

    const layout = italyBaseLayout(lang, lang === "en" ? "Monthly amount, EUR" : "Montant mensuel, EUR");

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

    layout.yaxis.ticksuffix = " EUR";
    layout.showlegend = false;

    layout.margin = {
        l: 82,
        r: 28,
        t: 34,
        b: 135
    };

    italyPlot(
        "chart-italy-waterfall-" + lang,
        traces,
        layout
    );
}


function renderItalyCostChart(lang) {
    const data = getItalyData();
    const t = getI18nText(lang);

    const x = data.map(row => itNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => itNum(row.gross_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: ITALY_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} EUR<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => itNum(row.net_before_income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impôt",
            line: {
                color: ITALY_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} EUR<extra></extra>" : "Net avant impôt : %{y:,.0f} EUR<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => itNum(row.net_after_income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net après impôt",
            line: {
                color: ITALY_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} EUR<extra></extra>" : "Net après impôt : %{y:,.0f} EUR<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => itNum(row.employer_cost_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: ITALY_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} EUR<extra></extra>"
        }
    ];

    const layout = italyBaseLayout(lang, lang === "en" ? "Monthly amount, EUR" : "Montant mensuel, EUR");

    layout.yaxis.ticksuffix = " EUR";

    italyPlot(
        "chart-italy-cost-" + lang,
        traces,
        layout
    );
}


function renderItalyRateChart(lang) {
    const data = getItalyData();

    const x = data.map(row => itNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => itNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate (INPS)" : "Taux salarié (INPS)",
            line: {
                color: ITALY_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee INPS: %{y:.1f} %<extra></extra>" : "INPS salarié : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => itNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate (INPS, excl. TFR)" : "Taux employeur (INPS, hors TFR)",
            line: {
                color: ITALY_COLORS.employer,
                width: 3,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employer INPS: %{y:.1f} %<extra></extra>" : "INPS employeur : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                (itNum(row.employer_contributions_monthly_eur) + itNum(row.tfr_accrual_monthly_eur))
                / itNum(row.gross_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate incl. TFR" : "Taux employeur y compris TFR",
            line: {
                color: ITALY_COLORS.tfr,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employer incl. TFR: %{y:.1f} %<extra></extra>" : "Employeur y c. TFR : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                itNum(row.income_tax_monthly_eur)
                / itNum(row.gross_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective income tax rate" : "Taux d'imposition effectif",
            line: {
                color: ITALY_COLORS.incomeTax,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Income tax: %{y:.1f} %<extra></extra>" : "Impôt sur le revenu : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = italyBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 55];

    italyPlot(
        "chart-italy-rates-" + lang,
        traces,
        layout
    );
}


function renderItalyInpsBreakdownChart(lang) {
    const data = getItalyData();

    const x = data.map(row => itNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => itNum(row.ivs_employer_monthly_eur)),
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: "IVS " + (lang === "en" ? "(employer)" : "(employeur)"),
            line: {
                color: ITALY_COLORS.ivsEmployer,
                width: 1
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => italyOtherEmployerMonthly(row)),
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Other employer (NASpI, CIGO, CIGS, maternita, Fondo Garanzia TFR, CUAF, INAIL)" : "Autres employeur (NASpI, CIGO, CIGS, maternità, Fondo Garanzia TFR, CUAF, INAIL)",
            line: {
                color: ITALY_COLORS.otherEmployer,
                width: 1
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => itNum(row.ivs_employee_monthly_eur)),
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: "IVS " + (lang === "en" ? "(employee)" : "(salarié)"),
            line: {
                color: ITALY_COLORS.ivsEmployee,
                width: 1
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => itNum(row.cigs_employee_monthly_eur)),
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "CIGS (employee)" : "CIGS (salarié)",
            line: {
                color: ITALY_COLORS.otherEmployee,
                width: 1
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => itNum(row.aggiuntivo_1_percent_monthly_eur)),
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Additional 1% (employee)" : "Additionnelle 1 % (salarié)",
            line: {
                color: ITALY_COLORS.aggiuntivo,
                width: 1
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => (
                itNum(row.employee_contributions_monthly_eur)
                + itNum(row.employer_contributions_monthly_eur)
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total INPS contributions" : "Total cotisations INPS",
            line: {
                color: ITALY_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        }
    ];

    const layout = italyBaseLayout(lang, lang === "en" ? "Monthly amount, EUR" : "Montant mensuel, EUR");

    layout.yaxis.ticksuffix = " EUR";
    layout.height = 480;

    italyPlot(
        "chart-italy-inps-breakdown-" + lang,
        traces,
        layout
    );
}


function renderItalyTaxBreakdownChart(lang) {
    const data = getItalyData();

    const x = data.map(row => itNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => italyIrpefNetMonthly(row)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "National IRPEF (net of detrazioni)" : "IRPEF national (net des détrazioni)",
            line: {
                color: ITALY_COLORS.irpef,
                width: 2
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => itNum(row.addizionale_regionale_annual_eur) / 12),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Addizionale regionale (Lazio)" : "Addizionale regionale (Latium)",
            line: {
                color: ITALY_COLORS.addRegionale,
                width: 2
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => itNum(row.addizionale_comunale_annual_eur) / 12),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Addizionale comunale (Roma)" : "Addizionale comunale (Rome)",
            line: {
                color: ITALY_COLORS.addComunale,
                width: 2,
                dash: "dash"
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => itNum(row.income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total income tax" : "Impôt sur le revenu total",
            line: {
                color: ITALY_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate: hoverPrefix + "%{y:,.0f} EUR<extra></extra>"
        }
    ];

    const layout = italyBaseLayout(lang, lang === "en" ? "Monthly amount, EUR" : "Montant mensuel, EUR");

    layout.yaxis.ticksuffix = " EUR";

    italyPlot(
        "chart-italy-tax-breakdown-" + lang,
        traces,
        layout
    );
}


function renderItalyWedgeChart(lang) {
    const data = getItalyData();
    const t = getI18nText(lang);

    const x = data.map(row => itNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                itNum(row.social_wedge_monthly_eur)
                / itNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / coût employeur",
            line: {
                color: ITALY_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                itNum(row.total_wedge_after_income_tax_monthly_eur)
                / itNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / coût employeur",
            line: {
                color: ITALY_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => itNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio coût / net avant impôt",
            yaxis: "y2",
            line: {
                color: ITALY_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Coût / net avant impôt : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => itNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio coût / net après impôt",
            yaxis: "y2",
            line: {
                color: ITALY_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Coût / net après impôt : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = italyBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / coût employeur");

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

    italyPlot(
        "chart-italy-wedge-" + lang,
        traces,
        layout
    );
}


function renderItalyFiscalReturnChart(lang) {
    const target = document.getElementById("chart-italy-fiscal-return-" + lang);

    if (!target) {
        return;
    }

    const data = getItalyData().filter(row => (
        Number.isFinite(itNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(itNum(row.marginal_net_after_income_tax_rate))
        && Number.isFinite(itNum(row.marginal_social_wedge_rate))
        && Number.isFinite(itNum(row.marginal_total_wedge_after_income_tax_rate))
        && itNum(row.delta_gross_monthly_eur) > 0
    ));

    const x = data.map(row => itNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × ref. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                itNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impôt",
            line: {
                color: ITALY_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impôt : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                itNum(row.marginal_net_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Après impôt",
            line: {
                color: ITALY_COLORS.afterTax,
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
                itNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: ITALY_COLORS.wedge,
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
                itNum(row.marginal_total_wedge_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prélèvement marginal total",
            line: {
                color: ITALY_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prélèvement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = italyBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional euro of gross wage (%)"
            : "Part d'un euro supplémentaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    italyPlot(
        "chart-italy-fiscal-return-" + lang,
        traces,
        layout
    );
}


function renderItalyDataTable(lang) {
    const tableBody = getI18nElement("italy-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const caption = getI18nElement("italy-data-caption", lang);

    if (caption) {
        caption.textContent = lang === "en" ? "Standard employee (Rome, Lazio)" : "Salarié standard (Rome, Latium)";
    }

    const data = getItalyData();

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            itRatio(row.smic_multiple, lang),
            eur(row.gross_monthly_eur, lang),
            eur(row.net_before_income_tax_monthly_eur, lang),
            eur(row.income_tax_monthly_eur, lang),
            eur(row.net_after_income_tax_monthly_eur, lang),
            eur(row.tfr_accrual_monthly_eur, lang),
            eur(row.employer_cost_monthly_eur, lang),
            eur(row.employee_contributions_monthly_eur, lang),
            eur(row.employer_contributions_monthly_eur, lang),
            eur(row.social_wedge_monthly_eur, lang),
            eur(row.total_wedge_after_income_tax_monthly_eur, lang),
            itPct(row.employer_contribution_rate, lang),
            itRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderItaly(lang) {
    renderItalyMetrics(lang);
    renderItalyWaterfallChart(lang);
    renderItalyCostChart(lang);
    renderItalyRateChart(lang);
    renderItalyInpsBreakdownChart(lang);
    renderItalyTaxBreakdownChart(lang);
    renderItalyWedgeChart(lang);
    renderItalyFiscalReturnChart(lang);
    renderItalyDataTable(lang);
}


function computeItalyFlclIndicators(row) {
    const net = itNum(row.net_before_income_tax_monthly_eur);
    const employerCost = itNum(row.employer_cost_monthly_eur);

    // Unlike Sweden, Italy's Lab-E genuinely varies across the wage grid
    // (real IRPEF progressivity, the INPS massimale cap). Rounding to 4
    // decimal places is still applied defensively, following the same
    // pattern already used for Sweden, so that sub-cent currency-rounding
    // noise in the underlying CSV columns cannot be amplified into a false
    // sawtooth once the chart auto-scales to this indicator's range.
    const rawFlclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclE = Math.round(rawFlclE * 10000) / 10000;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderItalyFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getItalyData();
    const row = findItalyClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeItalyFlclIndicators(row);

    setTextContent("italy-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("italy-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("italy-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " EUR " + t.flcl_e_desc);
    setTextContent("italy-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderItalyFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getItalyData();

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = itNum(data[i].net_before_income_tax_monthly_eur) - itNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = itNum(data[i].employer_cost_monthly_eur) - itNum(data[i - 1].employer_cost_monthly_eur);
        const deltaMultiple = itNum(data[i].smic_multiple) - itNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeItalyFlclIndicators(data[i]);
            const previous = computeItalyFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: itNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findItalyClosestRow(marginalRows, 1.0);
    const oneRow = findItalyClosestRow(data, 1.0);
    const threeRow = findItalyClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeItalyFlclIndicators(oneRow).flclE - computeItalyFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("italy-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("italy-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("italy-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("italy-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("italy-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("italy-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("italy-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("italy-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderItalyFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getItalyData();

    const traces = [
        {
            x: data.map(row => itNum(row.smic_multiple)),
            y: data.map(row => computeItalyFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: ITALY_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × ref. wage<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = italyBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    italyPlot("chart-italy-flcl-e-" + lang, traces, layout);
}


function renderItalyFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getItalyData();

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = itNum(data[i].net_before_income_tax_monthly_eur) - itNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = itNum(data[i].employer_cost_monthly_eur) - itNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(itNum(data[i].smic_multiple));
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
                color: ITALY_COLORS.incomeTax,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: ITALY_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = italyBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    italyPlot("chart-italy-flcl-marginal-" + lang, traces, layout);
}


function renderItalyFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getItalyData();

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeItalyFlclIndicators(data[i]);
        const previous = computeItalyFlclIndicators(data[i - 1]);
        const deltaMultiple = itNum(data[i].smic_multiple) - itNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(itNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: ITALY_COLORS.employee,
                width: 3
            }
        }
    ];

    const layout = italyBaseLayout(
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

    italyPlot("chart-italy-flcl-progressivity-" + lang, traces, layout);
}


function renderItalyFlclMarginalDestinationChart(lang) {
    const data = getItalyData();

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];
    const tfrShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = itNum(data[i].employer_cost_monthly_eur) - itNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = itNum(data[i].net_before_income_tax_monthly_eur) - itNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaEmployee = itNum(data[i].employee_contributions_monthly_eur) - itNum(data[i - 1].employee_contributions_monthly_eur);
        const deltaEmployer = itNum(data[i].employer_contributions_monthly_eur) - itNum(data[i - 1].employer_contributions_monthly_eur);
        const deltaTfr = itNum(data[i].tfr_accrual_monthly_eur) - itNum(data[i - 1].tfr_accrual_monthly_eur);

        x.push(itNum(data[i].smic_multiple));
        netShare.push(100 * deltaNet / deltaCost);
        employeeShare.push(100 * deltaEmployee / deltaCost);
        employerShare.push(100 * deltaEmployer / deltaCost);
        tfrShare.push(100 * deltaTfr / deltaCost);
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
                color: ITALY_COLORS.net,
                width: 2
            }
        },
        {
            x: x,
            y: employeeShare,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Employee contributions (INPS)" : "Cotisations salarié (INPS)",
            line: {
                color: ITALY_COLORS.employee,
                width: 2
            }
        },
        {
            x: x,
            y: employerShare,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: lang === "en" ? "Employer contributions (INPS)" : "Cotisations employeur (INPS)",
            line: {
                color: ITALY_COLORS.employer,
                width: 2
            }
        },
        {
            x: x,
            y: tfrShare,
            type: "scatter",
            mode: "lines",
            stackgroup: "one",
            name: "TFR",
            line: {
                color: ITALY_COLORS.tfr,
                width: 2
            }
        }
    ];

    const layout = italyBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional euro, %"
            : "Destination marginale d'un euro supplémentaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    italyPlot("chart-italy-flcl-destination-" + lang, traces, layout);
}


function renderItalyFlclIndex(lang) {
    renderItalyFlclIndexCards(lang);
    renderItalyFlclMarginalCards(lang);
    renderItalyFlclEChart(lang);
    renderItalyFlclMarginalChart(lang);
    renderItalyFlclProgressivityChart(lang);
    renderItalyFlclMarginalDestinationChart(lang);
}


function italyOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderItaly(lang);
    }

    if (tabName === "data") {
        renderItalyDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderItalyFlclIndex(lang);
    }
}


function showItalyTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: ITALY_TAB_STORAGE_KEY,
        onShow: italyOnTabShow
    });
}


function switchItalyLanguage() {
    switchLangLanguage({
        storageKey: ITALY_LANGUAGE_STORAGE_KEY,
        tabStorageKey: ITALY_TAB_STORAGE_KEY,
        onShow: italyOnTabShow
    });
}


function setupItalyEvents() {
    ["fr", "en"].forEach(function(lang) {
        const waterfallMultipleSelect = getI18nElement("italy-waterfall-multiple", lang);

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderItalyWaterfallChart(lang);
            });
        }
    });
}


applyStoredItalyTheme();


Papa.parse(
    ITALY_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            ITALY_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => (
                    itNum(a.smic_multiple)
                    - itNum(b.smic_multiple)
                ));

            console.log(
                "Italy Labour Cost Lab data loaded:",
                ITALY_DATA.length,
                "rows"
            );

            setupItalyEvents();

            const initialLang = localStorage.getItem(ITALY_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: ITALY_LANGUAGE_STORAGE_KEY,
                tabStorageKey: ITALY_TAB_STORAGE_KEY,
                onShow: italyOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Italy CSV loading error:",
                error
            );
        }
    }
);
