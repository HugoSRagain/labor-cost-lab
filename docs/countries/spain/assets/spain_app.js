const SPAIN_DATA_PATH = "../../data/spain/spain_labour_cost_grid_2026.csv";
const SPAIN_LANGUAGE_STORAGE_KEY = "spain_language";
const SPAIN_TAB_STORAGE_KEY = "spain_tab";
const SPAIN_DEFAULT_REGION = "madrid";

let SPAIN_DATA = [];


function applyStoredSpainTheme() {
    const storedTheme = localStorage.getItem("spain-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateSpainThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateSpainThemeButton("light");
    }
}


function updateSpainThemeButton(theme) {
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
        localStorage.setItem("spain-theme", "dark");
        updateSpainThemeButton("dark");
    } else {
        localStorage.setItem("spain-theme", "light");
        updateSpainThemeButton("light");
    }

    renderSpain(getActiveI18nLanguage(SPAIN_LANGUAGE_STORAGE_KEY));
}


const SPAIN_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    irpf: "#0d9488",
    wedge: "#f97316",
    total: "#0f172a"
};


function esNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function esLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function esEuro(value, lang) {
    return esNum(value).toLocaleString(
        esLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function esPct(value, lang) {
    return (esNum(value) * 100).toLocaleString(
        esLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function esRatio(value, lang) {
    const text = esNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getSpainWaterfallMultiple(lang) {
    const select = getI18nElement("spain-waterfall-multiple", lang);

    if (!select) {
        return 2.00;
    }

    return esNum(select.value);
}


function getSpainRegions() {
    const regionMap = new Map();

    SPAIN_DATA.forEach(row => {
        if (!regionMap.has(row.region_code)) {
            regionMap.set(
                row.region_code,
                {
                    code: row.region_code,
                    labelFr: row.region_label_fr,
                    labelEn: row.region_label_en
                }
            );
        }
    });

    return Array.from(regionMap.values()).sort((a, b) => (
        a.labelFr.localeCompare(b.labelFr)
    ));
}


function getSelectedSpainRegion(lang) {
    const select = getI18nElement("spain-region-select", lang);

    if (!select) {
        return SPAIN_DEFAULT_REGION;
    }

    return select.value;
}


function getSelectedSpainDataRegion(lang) {
    const select = getI18nElement("spain-data-region-select", lang);

    if (!select) {
        return getSelectedSpainRegion(lang);
    }

    return select.value;
}


function getSelectedSpainFlclRegion(lang) {
    const select = getI18nElement("spain-flcl-region-select", lang);

    if (!select) {
        return getSelectedSpainRegion(lang);
    }

    return select.value;
}


function populateSpainRegionSelects() {
    const regions = getSpainRegions();

    ["fr", "en"].forEach(function(lang) {
        const selects = [
            getI18nElement("spain-region-select", lang),
            getI18nElement("spain-data-region-select", lang),
            getI18nElement("spain-flcl-region-select", lang)
        ];

        selects.forEach(select => {
            if (!select) {
                return;
            }

            const currentValue = select.value;

            select.innerHTML = "";

            regions.forEach(region => {
                const option = document.createElement("option");

                option.value = region.code;
                option.textContent = lang === "en" ? region.labelEn : region.labelFr;

                if (
                    region.code === currentValue
                    || (!currentValue && region.code === SPAIN_DEFAULT_REGION)
                ) {
                    option.selected = true;
                }

                select.appendChild(option);
            });
        });
    });
}


function getSpainData(regionCode) {
    const region = regionCode || SPAIN_DEFAULT_REGION;

    return SPAIN_DATA
        .filter(row => row.region_code === region)
        .sort((a, b) => esNum(a.smic_multiple) - esNum(b.smic_multiple));
}


function findSpainClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            esNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            esNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function spainBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en" ? "Multiple of the Spanish minimum wage (SMI)" : "Multiple du salaire minimum espagnol (SMI)",
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


function spainPlot(elementId, traces, layout) {
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


function renderSpainMetrics(lang) {
    const data = getSpainData(getSelectedSpainRegion(lang));
    const referenceRow = data.find(row => esNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-spain-reference-wage-" + lang,
        esEuro(referenceRow.gross_monthly_eur, lang) + " €"
    );

    const irpfRate = (
        esNum(referenceRow.irpf_monthly_eur)
        / esNum(referenceRow.gross_monthly_eur)
    );

    setTextContent(
        "metric-spain-irpf-rate-" + lang,
        esPct(irpfRate, lang)
    );

    setTextContent(
        "metric-spain-employer-rate-" + lang,
        esPct(referenceRow.employer_contribution_rate, lang)
    );

    setTextContent(
        "metric-spain-cost-to-net-" + lang,
        esRatio(referenceRow.cost_to_net_after_income_tax_ratio, lang)
    );
}


function renderSpainWaterfallChart(lang) {
    const data = getSpainData(getSelectedSpainRegion(lang));

    if (!data.length) {
        return;
    }

    const selectedMultiple = getSpainWaterfallMultiple(lang);
    const row = findSpainClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = esNum(row.smic_multiple);

    const netAfterTax = esNum(row.net_after_income_tax_monthly_eur);
    const irpf = esNum(row.irpf_monthly_eur);
    const netBeforeTax = esNum(row.net_before_income_tax_monthly_eur);
    const employeeSs = esNum(row.employee_ss_monthly_eur);
    const gross = esNum(row.gross_monthly_eur);
    const employerSs = esNum(row.employer_ss_monthly_eur);
    const employerCost = esNum(row.employer_cost_monthly_eur);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " minimum wage(s)"
        : actualMultiple.toFixed(2).replace(".", ",") + " salaire(s) minimum(s)";

    setTextContent(
        "spain-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Décomposition à ") + multipleLabel
    );

    setTextContent(
        "spain-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Detailed breakdown of the path from net wage after tax to total "
                + "employer cost, for a gross wage of " + esEuro(gross, lang) + " €."
            : "Décomposition détaillée du passage du salaire net après impôt "
                + "au coût employeur total, pour un salaire brut de "
                + esEuro(gross, lang) + " €."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "IRPF",
            "Net before tax",
            "Employee SS",
            "Gross wage",
            "Employer SS",
            "Employer cost"
        ]
        : [
            "Net après impôt",
            "IRPF",
            "Net avant impôt",
            "Cotisations salarié",
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
                irpf,
                netBeforeTax,
                employeeSs,
                gross,
                employerSs,
                employerCost
            ],
            text: [
                esEuro(netAfterTax, lang) + " €",
                "+" + esEuro(irpf, lang) + " €",
                esEuro(netBeforeTax, lang) + " €",
                "+" + esEuro(employeeSs, lang) + " €",
                esEuro(gross, lang) + " €",
                "+" + esEuro(employerSs, lang) + " €",
                esEuro(employerCost, lang) + " €"
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
                    color: SPAIN_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: SPAIN_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: SPAIN_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} €<extra></extra>"
        }
    ];

    const layout = spainBaseLayout(lang, lang === "en" ? "Monthly amount, EUR" : "Montant mensuel, EUR");

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

    spainPlot(
        "chart-spain-waterfall-" + lang,
        traces,
        layout
    );
}


function renderSpainCostChart(lang) {
    const data = getSpainData(getSelectedSpainRegion(lang));
    const t = getI18nText(lang);

    const x = data.map(row => esNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => esNum(row.gross_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: SPAIN_COLORS.gross,
                width: 3
            },
            hovertemplate: hoverPrefix + t.gross_wage + " : %{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => esNum(row.net_before_income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impôt",
            line: {
                color: SPAIN_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} €<extra></extra>" : "Net avant impôt : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => esNum(row.net_after_income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net après impôt",
            line: {
                color: SPAIN_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} €<extra></extra>" : "Net après impôt : %{y:,.0f} €<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => esNum(row.employer_cost_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: SPAIN_COLORS.employer,
                width: 3
            },
            hovertemplate: hoverPrefix + t.employer_cost + " : %{y:,.0f} €<extra></extra>"
        }
    ];

    const layout = spainBaseLayout(lang, lang === "en" ? "Monthly amount, EUR" : "Montant mensuel, EUR");

    layout.yaxis.ticksuffix = " €";

    spainPlot(
        "chart-spain-cost-" + lang,
        traces,
        layout
    );
}


function renderSpainRateChart(lang) {
    const data = getSpainData(getSelectedSpainRegion(lang));

    const x = data.map(row => esNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => esNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate (Seguridad Social)" : "Taux salarié (Seguridad Social)",
            line: {
                color: SPAIN_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employee SS: %{y:.1f} %<extra></extra>" : "Cotisations salarié : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => esNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate (Seguridad Social)" : "Taux employeur (Seguridad Social)",
            line: {
                color: SPAIN_COLORS.employer,
                width: 3,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Employer SS: %{y:.1f} %<extra></extra>" : "Cotisations employeur : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                esNum(row.irpf_monthly_eur)
                / esNum(row.gross_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Effective IRPF rate" : "Taux d'IRPF effectif",
            line: {
                color: SPAIN_COLORS.irpf,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "IRPF: %{y:.1f} %<extra></extra>" : "IRPF : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = spainBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 50];

    spainPlot(
        "chart-spain-rates-" + lang,
        traces,
        layout
    );
}


function renderSpainWedgeChart(lang) {
    const data = getSpainData(getSelectedSpainRegion(lang));
    const t = getI18nText(lang);

    const x = data.map(row => esNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                esNum(row.social_wedge_monthly_eur)
                / esNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Social wedge / employer cost" : "Coin social / coût employeur",
            line: {
                color: SPAIN_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Social wedge: %{y:.1f} %<extra></extra>" : "Coin social : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                esNum(row.total_wedge_after_income_tax_monthly_eur)
                / esNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge / employer cost" : "Coin socio-fiscal / coût employeur",
            line: {
                color: SPAIN_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total wedge: %{y:.1f} %<extra></extra>" : "Coin socio-fiscal : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => esNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio before tax" : "Ratio coût / net avant impôt",
            yaxis: "y2",
            line: {
                color: SPAIN_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net before tax: %{y:.2f}<extra></extra>" : "Coût / net avant impôt : %{y:.2f}<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => esNum(row.cost_to_net_after_income_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net ratio after tax" : "Ratio coût / net après impôt",
            yaxis: "y2",
            line: {
                color: SPAIN_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Coût / net après impôt : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = spainBaseLayout(lang, lang === "en" ? "Wedge / employer cost" : "Coin / coût employeur");

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

    spainPlot(
        "chart-spain-wedge-" + lang,
        traces,
        layout
    );
}


function renderSpainFiscalReturnChart(lang) {
    const target = document.getElementById("chart-spain-fiscal-return-" + lang);

    if (!target) {
        return;
    }

    const data = getSpainData(getSelectedSpainRegion(lang)).filter(row => (
        Number.isFinite(esNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(esNum(row.marginal_net_after_income_tax_rate))
        && Number.isFinite(esNum(row.marginal_social_wedge_rate))
        && Number.isFinite(esNum(row.marginal_total_wedge_after_income_tax_rate))
        && esNum(row.delta_gross_monthly_eur) > 0
    ));

    const x = data.map(row => esNum(row.smic_multiple));
    const hoverPrefix = "%{x:.2f} × min. wage<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => (
                esNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Before tax" : "Avant impôt",
            line: {
                color: SPAIN_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Before tax: %{y:.1f} %<extra></extra>" : "Avant impôt : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => (
                esNum(row.marginal_net_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After tax" : "Après impôt",
            line: {
                color: SPAIN_COLORS.afterTax,
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
                esNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
            line: {
                color: SPAIN_COLORS.wedge,
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
                esNum(row.marginal_total_wedge_after_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total marginal levy" : "Prélèvement marginal total",
            line: {
                color: SPAIN_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                hoverPrefix +
                (lang === "en" ? "Total levy: %{y:.1f} %<extra></extra>" : "Prélèvement total : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = spainBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional euro of gross wage (%)"
            : "Part d'un euro supplémentaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    spainPlot(
        "chart-spain-fiscal-return-" + lang,
        traces,
        layout
    );
}


function renderSpainDataTable(lang) {
    const tableBody = getI18nElement("spain-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const caption = getI18nElement("spain-data-caption", lang);
    const regionCode = getSelectedSpainDataRegion(lang);
    const region = getSpainRegions().find(r => r.code === regionCode);

    if (caption) {
        const regionLabel = region ? (lang === "en" ? region.labelEn : region.labelFr) : "";
        caption.textContent = (lang === "en" ? "Standard employee (" : "Salarié standard (") + regionLabel + ")";
    }

    const data = getSpainData(regionCode);

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            esRatio(row.smic_multiple, lang),
            esEuro(row.gross_monthly_eur, lang),
            esEuro(row.net_before_income_tax_monthly_eur, lang),
            esEuro(row.irpf_monthly_eur, lang),
            esEuro(row.net_after_income_tax_monthly_eur, lang),
            esEuro(row.employer_cost_monthly_eur, lang),
            esEuro(row.employee_contributions_monthly_eur, lang),
            esEuro(row.employer_contributions_monthly_eur, lang),
            esEuro(row.social_wedge_monthly_eur, lang),
            esEuro(row.total_wedge_after_income_tax_monthly_eur, lang),
            esPct(row.employer_contribution_rate, lang),
            esRatio(row.cost_to_net_after_income_tax_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderSpain(lang) {
    renderSpainMetrics(lang);
    renderSpainWaterfallChart(lang);
    renderSpainCostChart(lang);
    renderSpainRateChart(lang);
    renderSpainWedgeChart(lang);
    renderSpainFiscalReturnChart(lang);
    renderSpainDataTable(lang);
}


function computeSpainFlclIndicators(row) {
    const net = esNum(row.net_before_income_tax_monthly_eur);
    const employerCost = esNum(row.employer_cost_monthly_eur);

    // Round to 2 decimal places to suppress rounding noise from the
    // underlying net/employer-cost series (most visible in the flat region
    // around the social-security contribution base cap), which otherwise
    // gets amplified into a false sawtooth once the chart auto-scales to
    // this indicator's narrow real range (same fix family as
    // computeSwedenFlclIndicators / computeIrelandFlclIndicators).
    const rawFlclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclE = Math.round(rawFlclE * 100) / 100;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderSpainFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getSpainData(getSelectedSpainFlclRegion(lang));
    const row = findSpainClosestRow(data, 1.0);

    if (!row) {
        return;
    }

    const indicators = computeSpainFlclIndicators(row);

    setTextContent("spain-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("spain-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("spain-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " € " + t.flcl_e_desc);
    setTextContent("spain-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderSpainFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getSpainData(getSelectedSpainFlclRegion(lang));

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = esNum(data[i].net_before_income_tax_monthly_eur) - esNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = esNum(data[i].employer_cost_monthly_eur) - esNum(data[i - 1].employer_cost_monthly_eur);
        const deltaMultiple = esNum(data[i].smic_multiple) - esNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeSpainFlclIndicators(data[i]);
            const previous = computeSpainFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: esNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = findSpainClosestRow(marginalRows, 1.0);
    const oneRow = findSpainClosestRow(data, 1.0);
    const threeRow = findSpainClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeSpainFlclIndicators(oneRow).flclE - computeSpainFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("spain-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("spain-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("spain-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("spain-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("spain-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("spain-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent("spain-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContent("spain-flcl-support-caption-" + lang, t.low_wage_support_desc);
}


function renderSpainFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getSpainData(getSelectedSpainFlclRegion(lang));

    const traces = [
        {
            x: data.map(row => esNum(row.smic_multiple)),
            y: data.map(row => computeSpainFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: SPAIN_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × min. wage<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = spainBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    spainPlot("chart-spain-flcl-e-" + lang, traces, layout);
}


function renderSpainFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getSpainData(getSelectedSpainFlclRegion(lang));

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = esNum(data[i].net_before_income_tax_monthly_eur) - esNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = esNum(data[i].employer_cost_monthly_eur) - esNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(esNum(data[i].smic_multiple));
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
                color: SPAIN_COLORS.irpf,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: SPAIN_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = spainBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    spainPlot("chart-spain-flcl-marginal-" + lang, traces, layout);
}


function renderSpainFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getSpainData(getSelectedSpainFlclRegion(lang));

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeSpainFlclIndicators(data[i]);
        const previous = computeSpainFlclIndicators(data[i - 1]);
        const deltaMultiple = esNum(data[i].smic_multiple) - esNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(esNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: SPAIN_COLORS.employee,
                width: 3
            }
        }
    ];

    const layout = spainBaseLayout(
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

    spainPlot("chart-spain-flcl-progressivity-" + lang, traces, layout);
}


function renderSpainFlclMarginalDestinationChart(lang) {
    const data = getSpainData(getSelectedSpainFlclRegion(lang));

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = esNum(data[i].employer_cost_monthly_eur) - esNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = esNum(data[i].net_before_income_tax_monthly_eur) - esNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaEmployee = esNum(data[i].employee_contributions_monthly_eur) - esNum(data[i - 1].employee_contributions_monthly_eur);
        const deltaEmployer = esNum(data[i].employer_contributions_monthly_eur) - esNum(data[i - 1].employer_contributions_monthly_eur);

        x.push(esNum(data[i].smic_multiple));
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
                color: SPAIN_COLORS.net,
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
                color: SPAIN_COLORS.employee,
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
                color: SPAIN_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = spainBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional euro, %"
            : "Destination marginale d'un euro supplémentaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    spainPlot("chart-spain-flcl-destination-" + lang, traces, layout);
}


function renderSpainFlclIndex(lang) {
    renderSpainFlclIndexCards(lang);
    renderSpainFlclMarginalCards(lang);
    renderSpainFlclEChart(lang);
    renderSpainFlclMarginalChart(lang);
    renderSpainFlclProgressivityChart(lang);
    renderSpainFlclMarginalDestinationChart(lang);
}


function spainOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderSpain(lang);
    }

    if (tabName === "data") {
        renderSpainDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderSpainFlclIndex(lang);
    }
}


function showSpainTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: SPAIN_TAB_STORAGE_KEY,
        onShow: spainOnTabShow
    });
}


function switchSpainLanguage() {
    switchLangLanguage({
        storageKey: SPAIN_LANGUAGE_STORAGE_KEY,
        tabStorageKey: SPAIN_TAB_STORAGE_KEY,
        onShow: spainOnTabShow
    });
}


function setupSpainEvents() {
    ["fr", "en"].forEach(function(lang) {
        const waterfallMultipleSelect = getI18nElement("spain-waterfall-multiple", lang);

        if (waterfallMultipleSelect) {
            waterfallMultipleSelect.addEventListener("change", function() {
                renderSpainWaterfallChart(lang);
            });
        }

        const regionSelect = getI18nElement("spain-region-select", lang);

        if (regionSelect) {
            regionSelect.addEventListener("change", function() {
                renderSpain(lang);
            });
        }

        const dataRegionSelect = getI18nElement("spain-data-region-select", lang);

        if (dataRegionSelect) {
            dataRegionSelect.addEventListener("change", function() {
                renderSpainDataTable(lang);
            });
        }

        const flclRegionSelect = getI18nElement("spain-flcl-region-select", lang);

        if (flclRegionSelect) {
            flclRegionSelect.addEventListener("change", function() {
                renderSpainFlclIndex(lang);
            });
        }
    });
}


applyStoredSpainTheme();


Papa.parse(
    SPAIN_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            SPAIN_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => (
                    esNum(a.smic_multiple)
                    - esNum(b.smic_multiple)
                ));

            console.log(
                "Spain Labour Cost Lab data loaded:",
                SPAIN_DATA.length,
                "rows"
            );

            populateSpainRegionSelects();
            setupSpainEvents();

            const initialLang = localStorage.getItem(SPAIN_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: SPAIN_LANGUAGE_STORAGE_KEY,
                tabStorageKey: SPAIN_TAB_STORAGE_KEY,
                onShow: spainOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Spain CSV loading error:",
                error
            );
        }
    }
);
