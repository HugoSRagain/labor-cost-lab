const SWITZERLAND_DATA_PATH = "../../data/switzerland/switzerland_labour_cost_grid_2026.csv";
const SWITZERLAND_LANGUAGE_STORAGE_KEY = "switzerland_language";
const SWITZERLAND_TAB_STORAGE_KEY = "switzerland_tab";

let SWITZERLAND_DATA = [];


function applyStoredSwitzerlandTheme() {
    const storedTheme = localStorage.getItem("switzerland-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateSwitzerlandThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateSwitzerlandThemeButton("light");
    }
}


function updateSwitzerlandThemeButton(theme) {
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
        localStorage.setItem("switzerland-theme", "dark");
        updateSwitzerlandThemeButton("dark");
    } else {
        localStorage.setItem("switzerland-theme", "light");
        updateSwitzerlandThemeButton("light");
    }

    renderSwitzerland(getActiveI18nLanguage(SWITZERLAND_LANGUAGE_STORAGE_KEY));
}


const SWITZERLAND_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    netBeforeTax: "#22c55e",
    employer: "#dc2626",
    employee: "#9333ea",
    tax: "#7c2d12",
    wedge: "#f97316",
    lpp: "#0891b2",
    accident: "#64748b",
    total: "#0f172a"
};


function chNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function chLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function chf(value, lang) {
    return chNum(value).toLocaleString(
        chLocale(lang),
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function pct(value, lang) {
    return (chNum(value) * 100).toLocaleString(
        chLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function pctDirect(value, lang) {
    return chNum(value).toLocaleString(
        chLocale(lang),
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function chRatio(value, lang) {
    const text = chNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getSelectedCanton(lang) {
    const select = getI18nElement("switzerland-canton-select", lang);

    if (!select) {
        return "ZH";
    }

    return select.value;
}


function getSelectedDataCanton(lang) {
    const select = getI18nElement("switzerland-data-canton-select", lang);

    if (!select) {
        return getSelectedCanton(lang);
    }

    return select.value;
}


function getSelectedWaterfallWage(lang) {
    const select = getI18nElement("switzerland-waterfall-wage-select", lang);

    if (!select) {
        return 5000;
    }

    return chNum(select.value);
}


function getSwitzerlandCantonData(cantonCode) {
    return SWITZERLAND_DATA
        .filter(row => row.canton_code === cantonCode)
        .sort((a, b) => (
            chNum(a.gross_monthly_chf)
            - chNum(b.gross_monthly_chf)
        ));
}


function getSwitzerlandCantons() {
    const cantonMap = new Map();

    SWITZERLAND_DATA.forEach(row => {
        if (!cantonMap.has(row.canton_code)) {
            cantonMap.set(
                row.canton_code,
                {
                    code: row.canton_code,
                    nameFr: row.canton_name_fr,
                    nameEn: row.canton_name_en,
                    municipality: row.reference_municipality
                }
            );
        }
    });

    return Array.from(cantonMap.values()).sort((a, b) => (
        a.code.localeCompare(b.code)
    ));
}


function getSelectedFlclCanton(lang) {
    const select = getI18nElement("switzerland-flcl-canton-select", lang);

    if (!select) {
        return getSelectedCanton(lang);
    }

    return select.value;
}


function populateCantonSelects() {
    ["fr", "en"].forEach(function(lang) {
        const selects = [
            getI18nElement("switzerland-canton-select", lang),
            getI18nElement("switzerland-data-canton-select", lang),
            getI18nElement("switzerland-flcl-canton-select", lang)
        ];

        const cantons = getSwitzerlandCantons();

        selects.forEach(select => {
            if (!select) {
                return;
            }

            const currentValue = select.value;

            select.innerHTML = "";

            cantons.forEach(canton => {
                const option = document.createElement("option");

                option.value = canton.code;
                option.textContent = (
                    canton.code
                    + " — "
                    + (lang === "en" ? canton.nameEn : canton.nameFr)
                    + " · "
                    + canton.municipality
                );

                if (
                    canton.code === currentValue
                    || (!currentValue && canton.code === "ZH")
                ) {
                    option.selected = true;
                }

                select.appendChild(option);
            });
        });
    });
}


function findClosestSwitzerlandRow(data, selectedWage) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            chNum(closestRow.gross_monthly_chf)
            - selectedWage
        );

        const currentDistance = Math.abs(
            chNum(currentRow.gross_monthly_chf)
            - selectedWage
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function switzerlandBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en" ? "Monthly gross wage, CHF" : "Salaire brut mensuel, CHF",
                standoff: 14
            },
            range: [2800, 20200],
            showgrid: false,
            zeroline: false,
            linecolor: axisColor,
            tickcolor: axisColor,
            ticks: "outside"
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


function switzerlandPlot(elementId, traces, layout) {
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


function renderSwitzerlandMetrics(lang) {
    const cantonCode = getSelectedCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);
    const referenceRow = data.find(row => chNum(row.gross_monthly_chf) === 5000);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-switzerland-reference-wage-" + lang,
        chf(referenceRow.gross_monthly_chf, lang) + " CHF"
    );

    setTextContent(
        "metric-switzerland-net-before-tax-" + lang,
        chf(referenceRow.net_before_tax_monthly_chf, lang) + " CHF"
    );

    setTextContent(
        "metric-switzerland-net-after-tax-" + lang,
        chf(referenceRow.net_after_tax_monthly_chf, lang) + " CHF"
    );

    setTextContent(
        "metric-switzerland-withholding-tax-" + lang,
        chf(referenceRow.withholding_tax_monthly_chf, lang) + " CHF"
    );

    setTextContent(
        "metric-switzerland-withholding-tax-rate-" + lang,
        pctDirect(referenceRow.withholding_tax_rate_percent, lang)
    );

    setTextContent(
        "metric-switzerland-employer-cost-" + lang,
        chf(referenceRow.employer_cost_monthly_chf, lang) + " CHF"
    );

    setTextContent(
        "metric-switzerland-cost-to-net-" + lang,
        chRatio(referenceRow.cost_to_net_after_tax_ratio, lang)
    );
}


function renderSwitzerlandWaterfallChart(lang) {
    const cantonCode = getSelectedCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    if (!data.length) {
        return;
    }

    const selectedWage = getSelectedWaterfallWage(lang);
    const row = findClosestSwitzerlandRow(data, selectedWage);

    if (!row) {
        return;
    }

    const gross = chNum(row.gross_monthly_chf);
    const netAfterTax = chNum(row.net_after_tax_monthly_chf);
    const netBeforeTax = chNum(row.net_before_tax_monthly_chf);
    const withholdingTax = chNum(row.withholding_tax_monthly_chf);
    const withholdingTaxRate = chNum(row.withholding_tax_rate_percent);

    const employeeAhv = chNum(row.employee_ahv_iv_eo_monthly_chf);
    const employeeUnemployment = chNum(row.employee_unemployment_monthly_chf);
    const employeeLpp = chNum(row.employee_lpp_monthly_chf);
    const employeeAccident = chNum(row.employee_accident_monthly_chf);

    const employerAhv = chNum(row.employer_ahv_iv_eo_monthly_chf);
    const employerUnemployment = chNum(row.employer_unemployment_monthly_chf);
    const employerLpp = chNum(row.employer_lpp_monthly_chf);
    const employerAccident = chNum(row.employer_accident_monthly_chf);

    const employerCost = chNum(row.employer_cost_monthly_chf);

    setTextContent(
        "switzerland-waterfall-title-" + lang,
        (lang === "en" ? "Breakdown at " : "Décomposition à ")
        + chf(gross, lang)
        + (lang === "en" ? " CHF monthly gross" : " CHF bruts mensuels")
    );

    setTextContent(
        "switzerland-waterfall-subtitle-" + lang,
        lang === "en"
            ? "Canton " + cantonCode + " · A0 withholding-tax tariff. "
                + "Net wage after tax is CHF " + chf(netAfterTax, lang)
                + ", including CHF " + chf(withholdingTax, lang) + " of withholding tax "
                + "(" + pctDirect(withholdingTaxRate, lang) + "), for an employer cost of "
                + chf(employerCost, lang) + " CHF."
            : "Canton " + cantonCode + " · tarif d'impôt à la source A0. "
                + "Le salaire net après impôt est de " + chf(netAfterTax, lang)
                + " CHF, dont " + chf(withholdingTax, lang) + " CHF d'impôt à la source "
                + "(" + pctDirect(withholdingTaxRate, lang) + "), pour un coût employeur de "
                + chf(employerCost, lang) + " CHF."
    );

    const labels = lang === "en"
        ? [
            "Net after tax",
            "Withholding tax",
            "Net before tax",
            "OASI / DI / EO employee",
            "Unemployment employee",
            "LPP employee",
            "Accident employee",
            "Gross wage",
            "OASI / DI / EO employer",
            "Unemployment employer",
            "LPP employer",
            "Accident employer",
            "Employer cost"
        ]
        : [
            "Net après impôt",
            "Impôt à la source",
            "Net avant impôt",
            "AVS / AI / APG salarié",
            "Chômage salarié",
            "LPP salarié",
            "Accident salarié",
            "Salaire brut",
            "AVS / AI / APG employeur",
            "Chômage employeur",
            "LPP employeur",
            "Accident employeur",
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
                "relative",
                "relative",
                "total",
                "relative",
                "relative",
                "relative",
                "relative",
                "total"
            ],
            x: labels,
            y: [
                netAfterTax,
                withholdingTax,
                netBeforeTax,
                employeeAhv,
                employeeUnemployment,
                employeeLpp,
                employeeAccident,
                gross,
                employerAhv,
                employerUnemployment,
                employerLpp,
                employerAccident,
                employerCost
            ],
            text: [
                chf(netAfterTax, lang) + " CHF",
                "+" + chf(withholdingTax, lang) + " CHF",
                chf(netBeforeTax, lang) + " CHF",
                "+" + chf(employeeAhv, lang) + " CHF",
                "+" + chf(employeeUnemployment, lang) + " CHF",
                "+" + chf(employeeLpp, lang) + " CHF",
                "+" + chf(employeeAccident, lang) + " CHF",
                chf(gross, lang) + " CHF",
                "+" + chf(employerAhv, lang) + " CHF",
                "+" + chf(employerUnemployment, lang) + " CHF",
                "+" + chf(employerLpp, lang) + " CHF",
                "+" + chf(employerAccident, lang) + " CHF",
                chf(employerCost, lang) + " CHF"
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
                    color: SWITZERLAND_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: SWITZERLAND_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: SWITZERLAND_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} CHF<extra></extra>"
        }
    ];

    const layout = switzerlandBaseLayout(lang, lang === "en" ? "Monthly amount, CHF" : "Montant mensuel, CHF");

    layout.xaxis.title = {
        text: ""
    };

    layout.xaxis.type = "category";
    layout.xaxis.tickangle = -35;
    layout.xaxis.automargin = true;
    layout.xaxis.showgrid = false;

    delete layout.xaxis.range;

    layout.yaxis.ticksuffix = " CHF";
    layout.showlegend = false;

    layout.margin = {
        l: 82,
        r: 28,
        t: 34,
        b: 150
    };

    switzerlandPlot(
        "chart-switzerland-waterfall-" + lang,
        traces,
        layout
    );
}


function renderSwitzerlandCostChart(lang) {
    const cantonCode = getSelectedCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);
    const t = getI18nText(lang);

    const x = data.map(row => chNum(row.gross_monthly_chf));
    const hoverWagePrefix = lang === "en" ? "CHF %{x:,.0f} gross<br>" : "%{x:,.0f} CHF bruts<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.net_after_tax_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net after tax" : "Net après impôt",
            line: {
                color: SWITZERLAND_COLORS.net,
                width: 3
            },
            hovertemplate:
                hoverWagePrefix +
                (lang === "en" ? "Net after tax: %{y:,.0f} CHF<extra></extra>" : "Net après impôt : %{y:,.0f} CHF<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => chNum(row.net_before_tax_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Net before tax" : "Net avant impôt",
            line: {
                color: SWITZERLAND_COLORS.netBeforeTax,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverWagePrefix +
                (lang === "en" ? "Net before tax: %{y:,.0f} CHF<extra></extra>" : "Net avant impôt : %{y:,.0f} CHF<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => chNum(row.gross_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: SWITZERLAND_COLORS.gross,
                width: 3
            },
            hovertemplate:
                hoverWagePrefix +
                t.gross_wage + " : %{y:,.0f} CHF<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => chNum(row.employer_cost_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: SWITZERLAND_COLORS.employer,
                width: 3
            },
            hovertemplate:
                hoverWagePrefix +
                t.employer_cost + " : %{y:,.0f} CHF<extra></extra>"
        }
    ];

    const layout = switzerlandBaseLayout(lang, t.y_amount.replace("euros", "CHF"));

    layout.yaxis.ticksuffix = " CHF";

    switzerlandPlot(
        "chart-switzerland-cost-" + lang,
        traces,
        layout
    );
}


function renderSwitzerlandRateChart(lang) {
    const cantonCode = getSelectedCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const x = data.map(row => chNum(row.gross_monthly_chf));
    const hoverWagePrefix = lang === "en" ? "CHF %{x:,.0f} gross<br>" : "%{x:,.0f} CHF bruts<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employee rate" : "Taux salarié",
            line: {
                color: SWITZERLAND_COLORS.employee,
                width: 3
            },
            hovertemplate:
                hoverWagePrefix +
                (lang === "en" ? "Employee rate: %{y:.1f} %<extra></extra>" : "Taux salarié : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => chNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Employer rate" : "Taux employeur",
            line: {
                color: SWITZERLAND_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverWagePrefix +
                (lang === "en" ? "Employer rate: %{y:.1f} %<extra></extra>" : "Taux employeur : %{y:.1f} %<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => chNum(row.withholding_tax_rate_percent)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Withholding tax" : "Impôt à la source",
            line: {
                color: SWITZERLAND_COLORS.tax,
                width: 3
            },
            hovertemplate:
                hoverWagePrefix +
                (lang === "en" ? "Withholding tax: %{y:.1f} %<extra></extra>" : "Impôt à la source : %{y:.1f} %<extra></extra>")
        }
    ];

    const layout = switzerlandBaseLayout(lang, getI18nText(lang).y_rate);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 30];

    switzerlandPlot(
        "chart-switzerland-rates-" + lang,
        traces,
        layout
    );
}


function renderSwitzerlandEmployeeComponentsChart(lang) {
    const cantonCode = getSelectedCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const x = data.map(row => chNum(row.gross_monthly_chf));

    const labels = lang === "en"
        ? { ahv: "OASI / DI / EO", unemployment: "Unemployment", lpp: "LPP", accident: "Accident", tax: "Withholding tax" }
        : { ahv: "AVS / AI / APG", unemployment: "Chômage", lpp: "LPP", accident: "Accident", tax: "Impôt à la source" };

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.employee_ahv_iv_eo_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: labels.ahv,
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.employee,
                width: 1
            }
        },
        {
            x: x,
            y: data.map(row => chNum(row.employee_unemployment_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: labels.unemployment,
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.wedge,
                width: 1
            }
        },
        {
            x: x,
            y: data.map(row => chNum(row.employee_lpp_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: labels.lpp,
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.lpp,
                width: 1
            }
        },
        {
            x: x,
            y: data.map(row => chNum(row.employee_accident_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: labels.accident,
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.accident,
                width: 1
            }
        },
        {
            x: x,
            y: data.map(row => chNum(row.withholding_tax_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: labels.tax,
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.tax,
                width: 1
            }
        }
    ];

    const layout = switzerlandBaseLayout(
        lang,
        lang === "en" ? "Employee levies and tax, CHF" : "Prélèvements salarié et impôt, CHF"
    );

    layout.yaxis.ticksuffix = " CHF";

    switzerlandPlot(
        "chart-switzerland-employee-components-" + lang,
        traces,
        layout
    );
}


function renderSwitzerlandEmployerComponentsChart(lang) {
    const cantonCode = getSelectedCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const x = data.map(row => chNum(row.gross_monthly_chf));

    const labels = lang === "en"
        ? { ahv: "OASI / DI / EO", unemployment: "Unemployment", lpp: "LPP", accident: "Accident" }
        : { ahv: "AVS / AI / APG", unemployment: "Chômage", lpp: "LPP", accident: "Accident" };

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.employer_ahv_iv_eo_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: labels.ahv,
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.employer,
                width: 1
            }
        },
        {
            x: x,
            y: data.map(row => chNum(row.employer_unemployment_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: labels.unemployment,
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.wedge,
                width: 1
            }
        },
        {
            x: x,
            y: data.map(row => chNum(row.employer_lpp_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: labels.lpp,
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.lpp,
                width: 1
            }
        },
        {
            x: x,
            y: data.map(row => chNum(row.employer_accident_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: labels.accident,
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.accident,
                width: 1
            }
        }
    ];

    const layout = switzerlandBaseLayout(
        lang,
        lang === "en" ? "Employer contributions, CHF" : "Cotisations employeur, CHF"
    );

    layout.yaxis.ticksuffix = " CHF";

    switzerlandPlot(
        "chart-switzerland-employer-components-" + lang,
        traces,
        layout
    );
}


function renderSwitzerlandWedgeChart(lang) {
    const cantonCode = getSelectedCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const x = data.map(row => chNum(row.gross_monthly_chf));
    const hoverWagePrefix = lang === "en" ? "CHF %{x:,.0f} gross<br>" : "%{x:,.0f} CHF bruts<br>";

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.social_wedge_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: getI18nText(lang).social_wedge,
            line: {
                color: SWITZERLAND_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                hoverWagePrefix +
                getI18nText(lang).social_wedge + " : %{y:,.0f} CHF<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => chNum(row.total_wedge_after_tax_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Total wedge after tax" : "Coin total après impôt",
            line: {
                color: SWITZERLAND_COLORS.tax,
                width: 3
            },
            hovertemplate:
                hoverWagePrefix +
                (lang === "en" ? "Total wedge after tax: %{y:,.0f} CHF<extra></extra>" : "Coin total après impôt : %{y:,.0f} CHF<extra></extra>")
        },
        {
            x: x,
            y: data.map(row => chNum(row.cost_to_net_after_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Cost / net after tax" : "Coût / net après impôt",
            yaxis: "y2",
            line: {
                color: SWITZERLAND_COLORS.total,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                hoverWagePrefix +
                (lang === "en" ? "Cost / net after tax: %{y:.2f}<extra></extra>" : "Coût / net après impôt : %{y:.2f}<extra></extra>")
        }
    ];

    const layout = switzerlandBaseLayout(lang, lang === "en" ? "Monthly wedge, CHF" : "Coin mensuel, CHF");

    layout.yaxis.ticksuffix = " CHF";

    layout.yaxis2 = {
        title: {
            text: lang === "en" ? "Cost / net ratio after tax" : "Ratio coût / net après impôt",
            standoff: 16
        },
        overlaying: "y",
        side: "right",
        range: [1.1, 2.4],
        zeroline: false,
        showgrid: false
    };

    switzerlandPlot(
        "chart-switzerland-wedge-" + lang,
        traces,
        layout
    );
}


function renderSwitzerlandDataTable(lang) {
    const tableBody = getI18nElement("switzerland-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const cantonCode = getSelectedDataCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const firstRow = data[0];
    const caption = getI18nElement("switzerland-data-canton-caption", lang);

    if (caption && firstRow) {
        caption.textContent = (
            firstRow.canton_code
            + " — "
            + (lang === "en" ? firstRow.canton_name_en : firstRow.canton_name_fr)
            + " · "
            + firstRow.reference_municipality
            + " · tariff A0"
        );
    }

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            chf(row.gross_monthly_chf, lang) + " CHF",
            chf(row.net_before_tax_monthly_chf, lang) + " CHF",
            chf(row.employer_cost_monthly_chf, lang) + " CHF",
            chf(row.employee_total_contrib_monthly_chf, lang) + " CHF",
            chf(row.employer_total_contrib_monthly_chf, lang) + " CHF",
            chf(row.social_wedge_monthly_chf, lang) + " CHF",
            pct(row.employee_contribution_rate, lang),
            pct(row.employer_contribution_rate, lang),
            chRatio(row.cost_to_net_ratio, lang)
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderSwitzerland(lang) {
    renderSwitzerlandMetrics(lang);
    renderSwitzerlandWaterfallChart(lang);
    renderSwitzerlandCostChart(lang);
    renderSwitzerlandRateChart(lang);
    renderSwitzerlandEmployeeComponentsChart(lang);
    renderSwitzerlandEmployerComponentsChart(lang);
    renderSwitzerlandWedgeChart(lang);
    renderSwitzerlandDataTable(lang);
}


function computeSwitzerlandFlclIndicators(row) {
    const net = chNum(row.net_before_tax_monthly_chf);
    const employerCost = chNum(row.employer_cost_monthly_chf);

    const flclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}


function renderSwitzerlandFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const cantonCode = getSelectedFlclCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);
    const row = findClosestSwitzerlandRow(data, 3000);

    if (!row) {
        return;
    }

    const indicators = computeSwitzerlandFlclIndicators(row);

    setTextContent("switzerland-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContent("switzerland-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContent("switzerland-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " CHF " + t.flcl_e_desc);
    setTextContent("switzerland-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}


function renderSwitzerlandFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const cantonCode = getSelectedFlclCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = chNum(data[i].net_before_tax_monthly_chf) - chNum(data[i - 1].net_before_tax_monthly_chf);
        const deltaCost = chNum(data[i].employer_cost_monthly_chf) - chNum(data[i - 1].employer_cost_monthly_chf);
        const deltaGross = chNum(data[i].gross_monthly_chf) - chNum(data[i - 1].gross_monthly_chf);

        if (deltaCost !== 0 && deltaGross !== 0) {
            const current = computeSwitzerlandFlclIndicators(data[i]);
            const previous = computeSwitzerlandFlclIndicators(data[i - 1]);

            marginalRows.push({
                gross_monthly_chf: chNum(data[i].gross_monthly_chf),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / (deltaGross / 1000)
            });
        }
    }

    const rowAtOne = marginalRows.length
        ? marginalRows.reduce((closest, current) => (
            Math.abs(current.gross_monthly_chf - 3000) < Math.abs(closest.gross_monthly_chf - 3000)
                ? current
                : closest
        ))
        : null;

    const oneRow = findClosestSwitzerlandRow(data, 3000);
    const threeRow = findClosestSwitzerlandRow(data, 9000);

    const support = (oneRow && threeRow)
        ? computeSwitzerlandFlclIndicators(oneRow).flclE - computeSwitzerlandFlclIndicators(threeRow).flclE
        : 0;

    setTextContent("switzerland-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContent("switzerland-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContent("switzerland-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContent("switzerland-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContent("switzerland-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContent("switzerland-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContent(
        "switzerland-flcl-progressivity-caption-" + lang,
        lang === "en"
            ? "Local change in Lab-E around 3,000 CHF gross."
            : "Variation locale de Lab-E autour de 3 000 CHF bruts."
    );
    setTextContent(
        "switzerland-flcl-support-caption-" + lang,
        lang === "en"
            ? "Lab-E gap between 3,000 and 9,000 CHF gross."
            : "Écart Lab-E entre 3 000 et 9 000 CHF bruts."
    );
}


function renderSwitzerlandFlclEChart(lang) {
    const t = getI18nText(lang);
    const cantonCode = getSelectedFlclCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const traces = [
        {
            x: data.map(row => chNum(row.gross_monthly_chf)),
            y: data.map(row => computeSwitzerlandFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: SWITZERLAND_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:,.0f} CHF bruts<br>" +
                t.flcl_e + " : %{y:.1f}<extra></extra>"
        }
    ];

    const layout = switzerlandBaseLayout(lang, t.flcl_e);
    layout.height = 450;

    switzerlandPlot("chart-switzerland-flcl-e-" + lang, traces, layout);
}


function renderSwitzerlandFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const cantonCode = getSelectedFlclCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = chNum(data[i].net_before_tax_monthly_chf) - chNum(data[i - 1].net_before_tax_monthly_chf);
        const deltaCost = chNum(data[i].employer_cost_monthly_chf) - chNum(data[i - 1].employer_cost_monthly_chf);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(chNum(data[i].gross_monthly_chf));
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
                color: SWITZERLAND_COLORS.net,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: SWITZERLAND_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = switzerlandBaseLayout(lang, "%");
    layout.height = 400;
    layout.yaxis.ticksuffix = "%";

    switzerlandPlot("chart-switzerland-flcl-marginal-" + lang, traces, layout);
}


function renderSwitzerlandFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const cantonCode = getSelectedFlclCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeSwitzerlandFlclIndicators(data[i]);
        const previous = computeSwitzerlandFlclIndicators(data[i - 1]);
        const deltaGross = chNum(data[i].gross_monthly_chf) - chNum(data[i - 1].gross_monthly_chf);

        if (deltaGross === 0) {
            continue;
        }

        x.push(chNum(data[i].gross_monthly_chf));
        progressivity.push((current.flclE - previous.flclE) / (deltaGross / 1000));
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: SWITZERLAND_COLORS.employee,
                width: 3
            }
        }
    ];

    const layout = switzerlandBaseLayout(
        lang,
        lang === "en" ? "Lab-E points per 1,000 CHF gross" : "Points de Lab-E par 1 000 CHF bruts"
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

    switzerlandPlot("chart-switzerland-flcl-progressivity-" + lang, traces, layout);
}


function renderSwitzerlandFlclMarginalDestinationChart(lang) {
    const cantonCode = getSelectedFlclCanton(lang);
    const data = getSwitzerlandCantonData(cantonCode);

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = chNum(data[i].employer_cost_monthly_chf) - chNum(data[i - 1].employer_cost_monthly_chf);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = chNum(data[i].net_before_tax_monthly_chf) - chNum(data[i - 1].net_before_tax_monthly_chf);
        const deltaEmployee = chNum(data[i].employee_total_contrib_monthly_chf) - chNum(data[i - 1].employee_total_contrib_monthly_chf);
        const deltaEmployer = chNum(data[i].employer_total_contrib_monthly_chf) - chNum(data[i - 1].employer_total_contrib_monthly_chf);

        x.push(chNum(data[i].gross_monthly_chf));
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
                color: SWITZERLAND_COLORS.net,
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
                color: SWITZERLAND_COLORS.employee,
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
                color: SWITZERLAND_COLORS.employer,
                width: 2
            }
        }
    ];

    const layout = switzerlandBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional CHF, %"
            : "Destination marginale d’un franc supplémentaire, %"
    );

    layout.height = 450;
    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    switzerlandPlot("chart-switzerland-flcl-destination-" + lang, traces, layout);
}


function renderSwitzerlandFlclIndex(lang) {
    renderSwitzerlandFlclIndexCards(lang);
    renderSwitzerlandFlclMarginalCards(lang);
    renderSwitzerlandFlclEChart(lang);
    renderSwitzerlandFlclMarginalChart(lang);
    renderSwitzerlandFlclProgressivityChart(lang);
    renderSwitzerlandFlclMarginalDestinationChart(lang);
}


function switzerlandOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderSwitzerland(lang);
    }

    if (tabName === "data") {
        renderSwitzerlandDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderSwitzerlandFlclIndex(lang);
    }
}


function showSwitzerlandTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: SWITZERLAND_TAB_STORAGE_KEY,
        onShow: switzerlandOnTabShow
    });
}


function switchSwitzerlandLanguage() {
    switchLangLanguage({
        storageKey: SWITZERLAND_LANGUAGE_STORAGE_KEY,
        tabStorageKey: SWITZERLAND_TAB_STORAGE_KEY,
        onShow: switzerlandOnTabShow
    });
}


function setupSwitzerlandEvents() {
    ["fr", "en"].forEach(function(lang) {
        const cantonSelect = getI18nElement("switzerland-canton-select", lang);
        const dataCantonSelect = getI18nElement("switzerland-data-canton-select", lang);
        const flclCantonSelect = getI18nElement("switzerland-flcl-canton-select", lang);
        const waterfallWageSelect = getI18nElement("switzerland-waterfall-wage-select", lang);

        if (cantonSelect) {
            cantonSelect.addEventListener("change", function() {
                renderSwitzerland(lang);
            });
        }

        if (dataCantonSelect) {
            dataCantonSelect.addEventListener("change", function() {
                renderSwitzerlandDataTable(lang);
            });
        }

        if (flclCantonSelect) {
            flclCantonSelect.addEventListener("change", function() {
                renderSwitzerlandFlclIndex(lang);
            });
        }

        if (waterfallWageSelect) {
            waterfallWageSelect.addEventListener("change", function() {
                renderSwitzerlandWaterfallChart(lang);
            });
        }
    });
}


applyStoredSwitzerlandTheme();


Papa.parse(
    SWITZERLAND_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            SWITZERLAND_DATA = results.data
                .filter(row => row.canton_code)
                .sort((a, b) => (
                    chNum(a.gross_monthly_chf)
                    - chNum(b.gross_monthly_chf)
                ));

            console.log(
                "Swiss Labour Cost Lab data loaded:",
                SWITZERLAND_DATA.length,
                "rows"
            );

            populateCantonSelects();
            setupSwitzerlandEvents();

            const initialLang = localStorage.getItem(SWITZERLAND_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: SWITZERLAND_LANGUAGE_STORAGE_KEY,
                tabStorageKey: SWITZERLAND_TAB_STORAGE_KEY,
                onShow: switzerlandOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Switzerland CSV loading error:",
                error
            );
        }
    }
);
