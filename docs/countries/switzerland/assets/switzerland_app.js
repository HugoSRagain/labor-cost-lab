const SWITZERLAND_DATA_PATH = "../../data/switzerland/switzerland_labour_cost_grid_2026.csv";

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
    const themeToggle = document.querySelector(".theme-toggle");

    if (!themeToggle) {
        return;
    }

    if (theme === "dark") {
        themeToggle.textContent = "☀️";
        themeToggle.title = "Light mode";
        themeToggle.setAttribute("aria-label", "Light mode");
    } else {
        themeToggle.textContent = "🌙";
        themeToggle.title = "Dark mode";
        themeToggle.setAttribute("aria-label", "Dark mode");
    }
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

    renderSwitzerland();
}


const SWITZERLAND_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    employer: "#dc2626",
    employee: "#9333ea",
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


function chf(value) {
    return chNum(value).toLocaleString(
        "fr-FR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function pct(value) {
    return (chNum(value) * 100).toLocaleString(
        "fr-FR",
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getSelectedCanton() {
    const select = document.getElementById("switzerland-canton-select");

    if (!select) {
        return "ZH";
    }

    return select.value;
}


function getSelectedDataCanton() {
    const select = document.getElementById("switzerland-data-canton-select");

    if (!select) {
        return getSelectedCanton();
    }

    return select.value;
}


function getSelectedWaterfallWage() {
    const select = document.getElementById("switzerland-waterfall-wage-select");

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


function populateCantonSelects() {
    const selects = [
        document.getElementById("switzerland-canton-select"),
        document.getElementById("switzerland-data-canton-select")
    ];

    const cantons = getSwitzerlandCantons();

    selects.forEach(select => {
        if (!select) {
            return;
        }

        select.innerHTML = "";

        cantons.forEach(canton => {
            const option = document.createElement("option");

            option.value = canton.code;
            option.textContent = (
                canton.code
                + " — "
                + canton.nameFr
                + " · "
                + canton.municipality
            );

            if (canton.code === "ZH") {
                option.selected = true;
            }

            select.appendChild(option);
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


function switzerlandBaseLayout(yAxisTitle) {
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
                text: "Salaire brut mensuel, CHF",
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


function renderSwitzerlandMetrics() {
    const cantonCode = getSelectedCanton();
    const data = getSwitzerlandCantonData(cantonCode);
    const referenceRow = data.find(row => chNum(row.gross_monthly_chf) === 5000);

    if (!referenceRow) {
        return;
    }

    setTextContent(
        "metric-switzerland-reference-wage",
        chf(referenceRow.gross_monthly_chf) + " CHF"
    );

    setTextContent(
        "metric-switzerland-net-before-tax",
        chf(referenceRow.net_before_tax_monthly_chf) + " CHF"
    );

    setTextContent(
        "metric-switzerland-employer-cost",
        chf(referenceRow.employer_cost_monthly_chf) + " CHF"
    );

    setTextContent(
        "metric-switzerland-cost-to-net",
        chNum(referenceRow.cost_to_net_before_tax_ratio)
            .toFixed(2)
            .replace(".", ",")
    );
}


function renderSwitzerlandWaterfallChart() {
    const cantonCode = getSelectedCanton();
    const data = getSwitzerlandCantonData(cantonCode);

    if (!data.length) {
        return;
    }

    const selectedWage = getSelectedWaterfallWage();
    const row = findClosestSwitzerlandRow(data, selectedWage);

    if (!row) {
        return;
    }

    const gross = chNum(row.gross_monthly_chf);
    const netBeforeTax = chNum(row.net_before_tax_monthly_chf);

    const employeeAhv = chNum(row.employee_ahv_iv_eo_monthly_chf);
    const employeeUnemployment = chNum(row.employee_unemployment_monthly_chf);
    const employeeLpp = chNum(row.employee_lpp_monthly_chf);
    const employeeAccident = chNum(row.employee_accident_monthly_chf);

    const employerAhv = chNum(row.employer_ahv_iv_eo_monthly_chf);
    const employerUnemployment = chNum(row.employer_unemployment_monthly_chf);
    const employerLpp = chNum(row.employer_lpp_monthly_chf);
    const employerAccident = chNum(row.employer_accident_monthly_chf);

    const employeeTotal = chNum(row.employee_total_contrib_monthly_chf);
    const employerCost = chNum(row.employer_cost_monthly_chf);

    setTextContent(
        "switzerland-waterfall-title",
        "Décomposition à "
        + chf(gross)
        + " CHF bruts mensuels"
    );

    setTextContent(
        "switzerland-waterfall-subtitle",
        "Canton "
        + cantonCode
        + " · prototype social avant impôt. "
        + "Le salaire net avant impôt est de "
        + chf(netBeforeTax)
        + " CHF pour un coût employeur de "
        + chf(employerCost)
        + " CHF."
    );

    const traces = [
        {
            type: "waterfall",
            orientation: "v",
            measure: [
                "absolute",
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
            x: [
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
            ],
            y: [
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
                chf(netBeforeTax) + " CHF",
                "+" + chf(employeeAhv) + " CHF",
                "+" + chf(employeeUnemployment) + " CHF",
                "+" + chf(employeeLpp) + " CHF",
                "+" + chf(employeeAccident) + " CHF",
                chf(gross) + " CHF",
                "+" + chf(employerAhv) + " CHF",
                "+" + chf(employerUnemployment) + " CHF",
                "+" + chf(employerLpp) + " CHF",
                "+" + chf(employerAccident) + " CHF",
                chf(employerCost) + " CHF"
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

    const layout = switzerlandBaseLayout("Montant mensuel, CHF");

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
        b: 135
    };

    switzerlandPlot(
        "chart-switzerland-waterfall",
        traces,
        layout
    );
}


function renderSwitzerlandCostChart() {
    const cantonCode = getSelectedCanton();
    const data = getSwitzerlandCantonData(cantonCode);

    const x = data.map(row => chNum(row.gross_monthly_chf));

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.net_before_tax_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: "Net avant impôt",
            line: {
                color: SWITZERLAND_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:,.0f} CHF bruts<br>" +
                "Net avant impôt : %{y:,.0f} CHF<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => chNum(row.gross_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: "Brut",
            line: {
                color: SWITZERLAND_COLORS.gross,
                width: 3
            },
            hovertemplate:
                "%{x:,.0f} CHF bruts<br>" +
                "Brut : %{y:,.0f} CHF<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => chNum(row.employer_cost_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: "Coût employeur",
            line: {
                color: SWITZERLAND_COLORS.employer,
                width: 3
            },
            hovertemplate:
                "%{x:,.0f} CHF bruts<br>" +
                "Coût employeur : %{y:,.0f} CHF<extra></extra>"
        }
    ];

    const layout = switzerlandBaseLayout("Montant mensuel, CHF");

    layout.yaxis.ticksuffix = " CHF";

    switzerlandPlot(
        "chart-switzerland-cost",
        traces,
        layout
    );
}


function renderSwitzerlandRateChart() {
    const cantonCode = getSelectedCanton();
    const data = getSwitzerlandCantonData(cantonCode);

    const x = data.map(row => chNum(row.gross_monthly_chf));

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: "Taux salarié",
            line: {
                color: SWITZERLAND_COLORS.employee,
                width: 3
            },
            hovertemplate:
                "%{x:,.0f} CHF bruts<br>" +
                "Taux salarié : %{y:.1f} %<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => chNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: "Taux employeur",
            line: {
                color: SWITZERLAND_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                "%{x:,.0f} CHF bruts<br>" +
                "Taux employeur : %{y:.1f} %<extra></extra>"
        }
    ];

    const layout = switzerlandBaseLayout("Taux effectif");

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 22];

    switzerlandPlot(
        "chart-switzerland-rates",
        traces,
        layout
    );
}


function renderSwitzerlandEmployeeComponentsChart() {
    const cantonCode = getSelectedCanton();
    const data = getSwitzerlandCantonData(cantonCode);

    const x = data.map(row => chNum(row.gross_monthly_chf));

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.employee_ahv_iv_eo_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: "AVS / AI / APG",
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
            name: "Chômage",
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
            name: "LPP",
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
            name: "Accident",
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.accident,
                width: 1
            }
        }
    ];

    const layout = switzerlandBaseLayout("Cotisations salarié, CHF");

    layout.yaxis.ticksuffix = " CHF";

    switzerlandPlot(
        "chart-switzerland-employee-components",
        traces,
        layout
    );
}


function renderSwitzerlandEmployerComponentsChart() {
    const cantonCode = getSelectedCanton();
    const data = getSwitzerlandCantonData(cantonCode);

    const x = data.map(row => chNum(row.gross_monthly_chf));

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.employer_ahv_iv_eo_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: "AVS / AI / APG",
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
            name: "Chômage",
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
            name: "LPP",
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
            name: "Accident",
            stackgroup: "one",
            line: {
                color: SWITZERLAND_COLORS.accident,
                width: 1
            }
        }
    ];

    const layout = switzerlandBaseLayout("Cotisations employeur, CHF");

    layout.yaxis.ticksuffix = " CHF";

    switzerlandPlot(
        "chart-switzerland-employer-components",
        traces,
        layout
    );
}


function renderSwitzerlandWedgeChart() {
    const cantonCode = getSelectedCanton();
    const data = getSwitzerlandCantonData(cantonCode);

    const x = data.map(row => chNum(row.gross_monthly_chf));

    const traces = [
        {
            x: x,
            y: data.map(row => chNum(row.social_wedge_monthly_chf)),
            type: "scatter",
            mode: "lines",
            name: "Coin social",
            line: {
                color: SWITZERLAND_COLORS.wedge,
                width: 3
            },
            hovertemplate:
                "%{x:,.0f} CHF bruts<br>" +
                "Coin social : %{y:,.0f} CHF<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => chNum(row.social_wedge_rate_employer_cost) * 100),
            type: "scatter",
            mode: "lines",
            name: "Coin social / coût employeur",
            yaxis: "y2",
            line: {
                color: SWITZERLAND_COLORS.total,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                "%{x:,.0f} CHF bruts<br>" +
                "Part du coût employeur : %{y:.1f} %<extra></extra>"
        }
    ];

    const layout = switzerlandBaseLayout("Coin social mensuel, CHF");

    layout.yaxis.ticksuffix = " CHF";

    layout.yaxis2 = {
        title: {
            text: "Part du coût employeur",
            standoff: 16
        },
        overlaying: "y",
        side: "right",
        range: [0, 30],
        ticksuffix: "%",
        zeroline: false,
        showgrid: false
    };

    switzerlandPlot(
        "chart-switzerland-wedge",
        traces,
        layout
    );
}


function renderSwitzerlandDataTable() {
    const tableBody = document.getElementById("switzerland-data-table-body");

    if (!tableBody) {
        return;
    }

    const cantonCode = getSelectedDataCanton();
    const data = getSwitzerlandCantonData(cantonCode);

    const firstRow = data[0];
    const caption = document.getElementById("switzerland-data-canton-caption");

    if (caption && firstRow) {
        caption.textContent = (
            firstRow.canton_code
            + " — "
            + firstRow.canton_name_fr
            + " · "
            + firstRow.reference_municipality
        );
    }

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            chf(row.gross_monthly_chf) + " CHF",
            chf(row.net_before_tax_monthly_chf) + " CHF",
            chf(row.employer_cost_monthly_chf) + " CHF",
            chf(row.employee_total_contrib_monthly_chf) + " CHF",
            chf(row.employer_total_contrib_monthly_chf) + " CHF",
            chf(row.social_wedge_monthly_chf) + " CHF",
            pct(row.employee_contribution_rate),
            pct(row.employer_contribution_rate),
            chNum(row.cost_to_net_before_tax_ratio)
                .toFixed(2)
                .replace(".", ",")
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderSwitzerland() {
    renderSwitzerlandMetrics();
    renderSwitzerlandWaterfallChart();
    renderSwitzerlandCostChart();
    renderSwitzerlandRateChart();
    renderSwitzerlandEmployeeComponentsChart();
    renderSwitzerlandEmployerComponentsChart();
    renderSwitzerlandWedgeChart();
    renderSwitzerlandDataTable();
}


function setupSwitzerlandTabs() {
    const buttons = document.querySelectorAll(".tab-button");
    const panels = document.querySelectorAll(".tab-content");

    buttons.forEach(button => {
        button.addEventListener("click", function() {
            const target = button.dataset.tab;

            buttons.forEach(item => {
                item.classList.remove("active");
            });

            panels.forEach(panel => {
                panel.classList.remove("active");
            });

            button.classList.add("active");

            const targetPanel = document.getElementById("tab-" + target);

            if (targetPanel) {
                targetPanel.classList.add("active");
            }

            if (target === "simulation") {
                setTimeout(function() {
                    renderSwitzerland();
                }, 80);
            }

            if (target === "data") {
                setTimeout(function() {
                    renderSwitzerlandDataTable();
                }, 80);
            }
        });
    });
}


function setupSwitzerlandEvents() {
    const cantonSelect = document.getElementById("switzerland-canton-select");
    const dataCantonSelect = document.getElementById(
        "switzerland-data-canton-select"
    );
    const waterfallWageSelect = document.getElementById(
        "switzerland-waterfall-wage-select"
    );

    if (cantonSelect) {
        cantonSelect.addEventListener("change", function() {
            renderSwitzerland();
        });
    }

    if (dataCantonSelect) {
        dataCantonSelect.addEventListener("change", function() {
            renderSwitzerlandDataTable();
        });
    }

    if (waterfallWageSelect) {
        waterfallWageSelect.addEventListener("change", function() {
            renderSwitzerlandWaterfallChart();
        });
    }
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
            setupSwitzerlandTabs();
            setupSwitzerlandEvents();
            renderSwitzerland();
        },
        error: function(error) {
            console.error(
                "Switzerland CSV loading error:",
                error
            );
        }
    }
);