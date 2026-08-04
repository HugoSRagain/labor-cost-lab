const COMPARISON_DATA_PATH = "../../data/comparison/labour_cost_comparison_2026.csv";

let COMPARISON_DATA = [];

const COMPARISON_COUNTRY_ORDER = ["FR", "DE", "BE", "CH"];

const COMPARISON_COUNTRY_LABELS = {
    FR: "France",
    DE: "Allemagne",
    BE: "Belgique",
    CH: "Suisse"
};

const COMPARISON_COLORS = {
    FR: "#2563eb",
    DE: "#dc2626",
    BE: "#f59e0b",
    CH: "#16a34a"
};


function applyStoredComparisonTheme() {
    const storedTheme = localStorage.getItem("comparison-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateComparisonThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateComparisonThemeButton("light");
    }
}


function updateComparisonThemeButton(theme) {
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
        localStorage.setItem("comparison-theme", "dark");
        updateComparisonThemeButton("dark");
    } else {
        localStorage.setItem("comparison-theme", "light");
        updateComparisonThemeButton("light");
    }

    renderComparison();
}


function cpNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return null;
    }

    return number;
}


function usd(value) {
    const number = cpNum(value);

    if (number === null) {
        return "—";
    }

    return number.toLocaleString(
        "fr-FR",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ) + " $";
}


function ratio(value) {
    const number = cpNum(value);

    if (number === null) {
        return "—";
    }

    return number.toFixed(2).replace(".", ",");
}


function ratePercent(value) {
    const number = cpNum(value);

    if (number === null) {
        return "—";
    }

    return (number * 100).toLocaleString(
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


function getComparisonCountryData(countryCode) {
    return COMPARISON_DATA
        .filter(row => row.country_code === countryCode)
        .sort((a, b) => (
            cpNum(a.harmonized_wage_point_intl_usd)
            - cpNum(b.harmonized_wage_point_intl_usd)
        ));
}


function getComparisonWageGrid() {
    const wageSet = new Set();

    COMPARISON_DATA.forEach(row => {
        wageSet.add(cpNum(row.harmonized_wage_point_intl_usd));
    });

    return Array.from(wageSet).sort((a, b) => a - b);
}


function getSelectedComparisonWage() {
    const select = document.getElementById("comparison-wage-select");

    if (!select) {
        return 6000;
    }

    return cpNum(select.value);
}


function getSelectedComparisonMetric() {
    const select = document.getElementById("comparison-data-metric-select");

    if (!select) {
        return "net_before_income_tax_monthly_intl_usd";
    }

    return select.value;
}


function findComparisonRowAtWage(data, wage) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            cpNum(closestRow.harmonized_wage_point_intl_usd) - wage
        );

        const currentDistance = Math.abs(
            cpNum(currentRow.harmonized_wage_point_intl_usd) - wage
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function populateComparisonWageSelect() {
    const select = document.getElementById("comparison-wage-select");

    if (!select) {
        return;
    }

    const wageGrid = getComparisonWageGrid();
    const currentValue = select.value;

    select.innerHTML = "";

    wageGrid.forEach(wage => {
        const option = document.createElement("option");

        option.value = String(wage);
        option.textContent = usd(wage) + " internationaux";

        if (
            String(wage) === currentValue
            || (!currentValue && wage === 6000)
        ) {
            option.selected = true;
        }

        select.appendChild(option);
    });
}


function comparisonBaseLayout(yAxisTitle) {
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
            family: "Archivo, Arial, sans-serif",
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
                text: "Salaire harmonisé, dollars internationaux (PPA)",
                standoff: 14
            },
            range: [1800, 12200],
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


function comparisonPlot(elementId, traces, layout) {
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


function comparisonCountryTrace(countryCode, x, y, hoverSuffix) {
    return {
        x: x,
        y: y,
        type: "scatter",
        mode: "lines",
        name: COMPARISON_COUNTRY_LABELS[countryCode],
        line: {
            color: COMPARISON_COLORS[countryCode],
            width: 3
        },
        hovertemplate:
            COMPARISON_COUNTRY_LABELS[countryCode]
            + " : %{y:,.0f}"
            + (hoverSuffix || "")
            + "<extra></extra>"
    };
}


function renderComparisonMetrics() {
    const wage = getSelectedComparisonWage();

    setTextContent(
        "comparison-metrics-subtitle",
        "Valeurs des 4 pays à "
        + usd(wage)
        + " internationaux mensuels, exprimées en dollars internationaux (PPA)."
    );

    const fields = {
        FR: "metric-comparison-fr-net",
        DE: "metric-comparison-de-net",
        BE: "metric-comparison-be-net",
        CH: "metric-comparison-ch-net"
    };

    COMPARISON_COUNTRY_ORDER.forEach(countryCode => {
        const data = getComparisonCountryData(countryCode);
        const row = findComparisonRowAtWage(data, wage);

        if (!row) {
            return;
        }

        setTextContent(
            fields[countryCode],
            usd(row.net_before_income_tax_monthly_intl_usd)
        );
    });
}


function renderComparisonNetBeforeTaxChart() {
    const traces = COMPARISON_COUNTRY_ORDER.map(countryCode => {
        const data = getComparisonCountryData(countryCode);

        return comparisonCountryTrace(
            countryCode,
            data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
            data.map(row => cpNum(row.net_before_income_tax_monthly_intl_usd)),
            " $ intl"
        );
    });

    const layout = comparisonBaseLayout("Net avant impôt, intl $");

    layout.yaxis.ticksuffix = " $";

    comparisonPlot(
        "chart-comparison-net-before-tax",
        traces,
        layout
    );
}


function renderComparisonNetAfterTaxChart() {
    const traces = COMPARISON_COUNTRY_ORDER
        .filter(countryCode => countryCode !== "FR")
        .map(countryCode => {
            const data = getComparisonCountryData(countryCode);

            return comparisonCountryTrace(
                countryCode,
                data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
                data.map(row => cpNum(row.net_after_income_tax_monthly_intl_usd)),
                " $ intl"
            );
        });

    const layout = comparisonBaseLayout("Net après impôt, intl $");

    layout.yaxis.ticksuffix = " $";

    comparisonPlot(
        "chart-comparison-net-after-tax",
        traces,
        layout
    );
}


function renderComparisonEmployerCostChart() {
    const traces = COMPARISON_COUNTRY_ORDER.map(countryCode => {
        const data = getComparisonCountryData(countryCode);

        return comparisonCountryTrace(
            countryCode,
            data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
            data.map(row => cpNum(row.employer_cost_monthly_intl_usd)),
            " $ intl"
        );
    });

    const layout = comparisonBaseLayout("Coût employeur, intl $");

    layout.yaxis.ticksuffix = " $";

    comparisonPlot(
        "chart-comparison-employer-cost",
        traces,
        layout
    );
}


function renderComparisonCostToNetChart() {
    const traces = COMPARISON_COUNTRY_ORDER.map(countryCode => {
        const data = getComparisonCountryData(countryCode);

        return comparisonCountryTrace(
            countryCode,
            data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
            data.map(row => cpNum(row.cost_to_net_before_income_tax_ratio))
        );
    });

    const layout = comparisonBaseLayout("Ratio coût employeur / net avant impôt");

    comparisonPlot(
        "chart-comparison-cost-to-net",
        traces,
        layout
    );
}


function renderComparisonWedgeChart() {
    const traces = COMPARISON_COUNTRY_ORDER.map(countryCode => {
        const data = getComparisonCountryData(countryCode);

        return comparisonCountryTrace(
            countryCode,
            data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
            data.map(row => cpNum(row.social_wedge_before_income_tax_rate) * 100),
            " %"
        );
    });

    const layout = comparisonBaseLayout("Coin social avant impôt, % du coût employeur");

    layout.yaxis.ticksuffix = "%";

    comparisonPlot(
        "chart-comparison-wedge",
        traces,
        layout
    );
}


function formatComparisonMetricValue(metric, value) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    if (
        metric === "social_wedge_before_income_tax_rate"
        || metric === "total_wedge_after_income_tax_rate"
    ) {
        return ratePercent(value);
    }

    if (
        metric === "cost_to_net_before_income_tax_ratio"
        || metric === "cost_to_net_after_income_tax_ratio"
    ) {
        return ratio(value);
    }

    return usd(value);
}


function renderComparisonDataTable() {
    const tableBody = document.getElementById("comparison-data-table-body");

    if (!tableBody) {
        return;
    }

    const metric = getSelectedComparisonMetric();
    const wageGrid = getComparisonWageGrid();

    const caption = document.getElementById("comparison-data-caption");
    const metricSelect = document.getElementById("comparison-data-metric-select");

    if (caption && metricSelect) {
        caption.textContent = (
            metricSelect.options[metricSelect.selectedIndex].textContent.trim()
            + " · une ligne par point de salaire harmonisé"
        );
    }

    const countryDataByCode = {};

    COMPARISON_COUNTRY_ORDER.forEach(countryCode => {
        countryDataByCode[countryCode] = getComparisonCountryData(countryCode);
    });

    tableBody.innerHTML = "";

    let hasBelowMinimumWage = false;

    wageGrid.forEach(wage => {
        const tableRow = document.createElement("tr");

        const cells = [
            {
                text: usd(wage),
                belowMinimumWage: false
            }
        ];

        COMPARISON_COUNTRY_ORDER.forEach(countryCode => {
            const row = findComparisonRowAtWage(
                countryDataByCode[countryCode],
                wage
            );

            const value = row ? row[metric] : null;
            const belowMinimumWage = row
                ? String(row.below_minimum_wage) === "True"
                : false;

            if (belowMinimumWage) {
                hasBelowMinimumWage = true;
            }

            cells.push({
                text: formatComparisonMetricValue(metric, value),
                belowMinimumWage: belowMinimumWage
            });
        });

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell.text;

            if (cell.belowMinimumWage) {
                tableCell.textContent += " *";
                tableCell.classList.add("below-minimum-wage");
                tableCell.title = (
                    "Salaire hypothétique, inférieur au salaire minimum "
                    + "(ou de référence) national de ce pays à ce point de "
                    + "la grille."
                );
            }

            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });

    const footnote = document.getElementById("comparison-data-footnote");

    if (footnote) {
        footnote.style.display = hasBelowMinimumWage ? "block" : "none";
    }
}


function renderComparison() {
    renderComparisonMetrics();
    renderComparisonNetBeforeTaxChart();
    renderComparisonNetAfterTaxChart();
    renderComparisonEmployerCostChart();
    renderComparisonCostToNetChart();
    renderComparisonWedgeChart();
    renderComparisonDataTable();
}


function setupComparisonTabs() {
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
                    renderComparison();
                }, 80);
            }

            if (target === "data") {
                setTimeout(function() {
                    renderComparisonDataTable();
                }, 80);
            }
        });
    });
}


function setupComparisonEvents() {
    const wageSelect = document.getElementById("comparison-wage-select");
    const dataMetricSelect = document.getElementById(
        "comparison-data-metric-select"
    );

    if (wageSelect) {
        wageSelect.addEventListener("change", function() {
            renderComparisonMetrics();
        });
    }

    if (dataMetricSelect) {
        dataMetricSelect.addEventListener("change", function() {
            renderComparisonDataTable();
        });
    }
}


applyStoredComparisonTheme();


Papa.parse(
    COMPARISON_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            COMPARISON_DATA = results.data.filter(row => row.country_code);

            console.log(
                "Comparison data loaded:",
                COMPARISON_DATA.length,
                "rows"
            );

            populateComparisonWageSelect();
            setupComparisonTabs();
            setupComparisonEvents();
            renderComparison();
        },
        error: function(error) {
            console.error(
                "Comparison CSV loading error:",
                error
            );
        }
    }
);
