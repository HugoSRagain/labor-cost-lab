const COMPARISON_DATA_PATH = "../../data/comparison/labour_cost_comparison_2026.csv";
const COMPARISON_LANGUAGE_STORAGE_KEY = "comparison_language";
const COMPARISON_TAB_STORAGE_KEY = "comparison_tab";

let COMPARISON_DATA = [];

const COMPARISON_COUNTRY_ORDER = ["FR", "DE", "BE", "CH", "NL", "UK", "IE", "ES", "SE", "IT", "US", "CN"];

const COMPARISON_COUNTRY_LABELS = {
    fr: {
        FR: "France",
        DE: "Allemagne",
        BE: "Belgique",
        CH: "Suisse",
        NL: "Pays-Bas",
        UK: "Royaume-Uni",
        IE: "Irlande",
        ES: "Espagne",
        SE: "Suède",
        IT: "Italie",
        US: "États-Unis",
        CN: "Chine"
    },
    en: {
        FR: "France",
        DE: "Germany",
        BE: "Belgium",
        CH: "Switzerland",
        NL: "Netherlands",
        UK: "United Kingdom",
        IE: "Ireland",
        ES: "Spain",
        SE: "Sweden",
        IT: "Italy",
        US: "United States",
        CN: "China"
    }
};

const COMPARISON_COLORS = {
    FR: "#2563eb",
    DE: "#dc2626",
    BE: "#f59e0b",
    CH: "#16a34a",
    NL: "#f97316",
    UK: "#8b5cf6",
    IE: "#059669",
    ES: "#e11d48",
    SE: "#ca8a04",
    IT: "#0d9488",
    US: "#a21caf",
    CN: "#eab308"
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
        localStorage.setItem("comparison-theme", "dark");
        updateComparisonThemeButton("dark");
    } else {
        localStorage.setItem("comparison-theme", "light");
        updateComparisonThemeButton("light");
    }

    renderComparison(getActiveI18nLanguage(COMPARISON_LANGUAGE_STORAGE_KEY));
}


function cpNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return null;
    }

    return number;
}


function cpLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}


function usd(value, lang) {
    const number = cpNum(value);

    if (number === null) {
        return "—";
    }

    return number.toLocaleString(
        cpLocale(lang),
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ) + " $";
}


function ratio(value, lang) {
    const number = cpNum(value);

    if (number === null) {
        return "—";
    }

    const text = number.toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}


function ratePercent(value, lang) {
    const number = cpNum(value);

    if (number === null) {
        return "—";
    }

    return (number * 100).toLocaleString(
        cpLocale(lang),
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


function getSelectedComparisonWage(lang) {
    const select = getI18nElement("comparison-wage-select", lang);

    if (!select) {
        return 6000;
    }

    return cpNum(select.value);
}


function getSelectedComparisonMetric(lang) {
    const select = getI18nElement("comparison-data-metric-select", lang);

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


function populateComparisonWageSelect(lang) {
    const select = getI18nElement("comparison-wage-select", lang);

    if (!select) {
        return;
    }

    const wageGrid = getComparisonWageGrid();
    const currentValue = select.value;

    select.innerHTML = "";

    wageGrid.forEach(wage => {
        const option = document.createElement("option");

        option.value = String(wage);
        option.textContent = usd(wage, lang) + (lang === "en" ? " international" : " internationaux");

        if (
            String(wage) === currentValue
            || (!currentValue && wage === 6000)
        ) {
            option.selected = true;
        }

        select.appendChild(option);
    });
}


function comparisonBaseLayout(lang, yAxisTitle) {
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
                text: lang === "en"
                    ? "Harmonized wage, international dollars (PPP)"
                    : "Salaire harmonisé, dollars internationaux (PPA)",
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


function comparisonCountryTrace(lang, countryCode, x, y, hoverSuffix) {
    const label = COMPARISON_COUNTRY_LABELS[lang][countryCode];

    return {
        x: x,
        y: y,
        type: "scatter",
        mode: "lines",
        name: label,
        line: {
            color: COMPARISON_COLORS[countryCode],
            width: 3
        },
        hovertemplate:
            label
            + " : %{y:,.0f}"
            + (hoverSuffix || "")
            + "<extra></extra>"
    };
}


function renderComparisonMetrics(lang) {
    const wage = getSelectedComparisonWage(lang);

    setTextContent(
        "comparison-metrics-subtitle-" + lang,
        (lang === "en" ? "Values for the 12 countries at " : "Valeurs des 12 pays à ")
        + usd(wage, lang)
        + (lang === "en"
            ? " international monthly, expressed in international dollars (PPP)."
            : " internationaux mensuels, exprimées en dollars internationaux (PPA).")
    );

    const fields = {
        FR: "metric-comparison-fr-net-" + lang,
        DE: "metric-comparison-de-net-" + lang,
        BE: "metric-comparison-be-net-" + lang,
        CH: "metric-comparison-ch-net-" + lang,
        NL: "metric-comparison-nl-net-" + lang,
        UK: "metric-comparison-uk-net-" + lang,
        IE: "metric-comparison-ie-net-" + lang,
        ES: "metric-comparison-es-net-" + lang,
        SE: "metric-comparison-se-net-" + lang,
        IT: "metric-comparison-it-net-" + lang,
        US: "metric-comparison-us-net-" + lang,
        CN: "metric-comparison-cn-net-" + lang
    };

    COMPARISON_COUNTRY_ORDER.forEach(countryCode => {
        const data = getComparisonCountryData(countryCode);
        const row = findComparisonRowAtWage(data, wage);

        if (!row) {
            return;
        }

        setTextContent(
            fields[countryCode],
            usd(row.net_before_income_tax_monthly_intl_usd, lang)
        );
    });
}


function renderComparisonNetBeforeTaxChart(lang) {
    const traces = COMPARISON_COUNTRY_ORDER.map(countryCode => {
        const data = getComparisonCountryData(countryCode);

        return comparisonCountryTrace(
            lang,
            countryCode,
            data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
            data.map(row => cpNum(row.net_before_income_tax_monthly_intl_usd)),
            " $ intl"
        );
    });

    const layout = comparisonBaseLayout(lang, lang === "en" ? "Net before tax, intl $" : "Net avant impôt, intl $");

    layout.yaxis.ticksuffix = " $";

    comparisonPlot(
        "chart-comparison-net-before-tax-" + lang,
        traces,
        layout
    );
}


function renderComparisonNetAfterTaxChart(lang) {
    const traces = COMPARISON_COUNTRY_ORDER
        .map(countryCode => {
            const data = getComparisonCountryData(countryCode);

            return comparisonCountryTrace(
                lang,
                countryCode,
                data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
                data.map(row => cpNum(row.net_after_income_tax_monthly_intl_usd)),
                " $ intl"
            );
        });

    const layout = comparisonBaseLayout(lang, lang === "en" ? "Net after tax, intl $" : "Net après impôt, intl $");

    layout.yaxis.ticksuffix = " $";

    comparisonPlot(
        "chart-comparison-net-after-tax-" + lang,
        traces,
        layout
    );
}


function renderComparisonEmployerCostChart(lang) {
    const traces = COMPARISON_COUNTRY_ORDER.map(countryCode => {
        const data = getComparisonCountryData(countryCode);

        return comparisonCountryTrace(
            lang,
            countryCode,
            data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
            data.map(row => cpNum(row.employer_cost_monthly_intl_usd)),
            " $ intl"
        );
    });

    const layout = comparisonBaseLayout(lang, lang === "en" ? "Employer cost, intl $" : "Coût employeur, intl $");

    layout.yaxis.ticksuffix = " $";

    comparisonPlot(
        "chart-comparison-employer-cost-" + lang,
        traces,
        layout
    );
}


function renderComparisonCostToNetChart(lang) {
    const traces = COMPARISON_COUNTRY_ORDER.map(countryCode => {
        const data = getComparisonCountryData(countryCode);

        return comparisonCountryTrace(
            lang,
            countryCode,
            data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
            data.map(row => cpNum(row.cost_to_net_before_income_tax_ratio))
        );
    });

    const layout = comparisonBaseLayout(
        lang,
        lang === "en" ? "Employer cost / net before tax ratio" : "Ratio coût employeur / net avant impôt"
    );

    comparisonPlot(
        "chart-comparison-cost-to-net-" + lang,
        traces,
        layout
    );
}


function renderComparisonFlclEChart(lang) {
    const traces = COMPARISON_COUNTRY_ORDER.map(countryCode => {
        const data = getComparisonCountryData(countryCode);

        return comparisonCountryTrace(
            lang,
            countryCode,
            data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
            data.map(row => cpNum(row.flcl_e_before_income_tax))
        );
    });

    const layout = comparisonBaseLayout(lang, "Lab-E");

    comparisonPlot(
        "chart-comparison-flcl-e-" + lang,
        traces,
        layout
    );
}


function renderComparisonWedgeChart(lang) {
    const traces = COMPARISON_COUNTRY_ORDER.map(countryCode => {
        const data = getComparisonCountryData(countryCode);

        return comparisonCountryTrace(
            lang,
            countryCode,
            data.map(row => cpNum(row.harmonized_wage_point_intl_usd)),
            data.map(row => cpNum(row.social_wedge_before_income_tax_rate) * 100),
            " %"
        );
    });

    const layout = comparisonBaseLayout(
        lang,
        lang === "en" ? "Social wedge before tax, % of employer cost" : "Coin social avant impôt, % du coût employeur"
    );

    layout.yaxis.ticksuffix = "%";

    comparisonPlot(
        "chart-comparison-wedge-" + lang,
        traces,
        layout
    );
}


function formatComparisonMetricValue(metric, value, lang) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    if (
        metric === "social_wedge_before_income_tax_rate"
        || metric === "total_wedge_after_income_tax_rate"
    ) {
        return ratePercent(value, lang);
    }

    if (
        metric === "cost_to_net_before_income_tax_ratio"
        || metric === "cost_to_net_after_income_tax_ratio"
    ) {
        return ratio(value, lang);
    }

    if (metric === "flcl_e_before_income_tax") {
        const number = cpNum(value);

        if (number === null) {
            return "—";
        }

        return number.toLocaleString(
            cpLocale(lang),
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }
        );
    }

    return usd(value, lang);
}


function renderComparisonDataTable(lang) {
    const tableBody = getI18nElement("comparison-data-table-body", lang);

    if (!tableBody) {
        return;
    }

    const metric = getSelectedComparisonMetric(lang);
    const wageGrid = getComparisonWageGrid();

    const caption = getI18nElement("comparison-data-caption", lang);
    const metricSelect = getI18nElement("comparison-data-metric-select", lang);

    if (caption && metricSelect) {
        caption.textContent = (
            metricSelect.options[metricSelect.selectedIndex].textContent.trim()
            + (lang === "en" ? " · one row per harmonized wage point" : " · une ligne par point de salaire harmonisé")
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
                text: usd(wage, lang),
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
                text: formatComparisonMetricValue(metric, value, lang),
                belowMinimumWage: belowMinimumWage
            });
        });

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell.text;

            if (cell.belowMinimumWage) {
                tableCell.textContent += " *";
                tableCell.classList.add("below-minimum-wage");
                tableCell.title = lang === "en"
                    ? "Hypothetical wage, below this country's national minimum (or reference) wage at this point of the harmonized grid."
                    : "Salaire hypothétique, inférieur au salaire minimum (ou de référence) national de ce pays à ce point de la grille harmonisée.";
            }

            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });

    const footnote = document.getElementById("comparison-data-footnote-" + lang);

    if (footnote) {
        footnote.style.display = hasBelowMinimumWage ? "block" : "none";
    }
}


function renderComparison(lang) {
    renderComparisonMetrics(lang);
    renderComparisonNetBeforeTaxChart(lang);
    renderComparisonNetAfterTaxChart(lang);
    renderComparisonEmployerCostChart(lang);
    renderComparisonCostToNetChart(lang);
    renderComparisonWedgeChart(lang);
    renderComparisonFlclEChart(lang);
    renderComparisonDataTable(lang);
}


function comparisonOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderComparison(lang);
    }

    if (tabName === "data") {
        renderComparisonDataTable(lang);
    }
}


function showComparisonTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: COMPARISON_TAB_STORAGE_KEY,
        onShow: comparisonOnTabShow
    });
}


function switchComparisonLanguage() {
    switchLangLanguage({
        storageKey: COMPARISON_LANGUAGE_STORAGE_KEY,
        tabStorageKey: COMPARISON_TAB_STORAGE_KEY,
        onShow: comparisonOnTabShow
    });
}


function setupComparisonEvents() {
    ["fr", "en"].forEach(function(lang) {
        const wageSelect = getI18nElement("comparison-wage-select", lang);
        const dataMetricSelect = getI18nElement("comparison-data-metric-select", lang);

        if (wageSelect) {
            wageSelect.addEventListener("change", function() {
                renderComparisonMetrics(lang);
            });
        }

        if (dataMetricSelect) {
            dataMetricSelect.addEventListener("change", function() {
                renderComparisonDataTable(lang);
            });
        }
    });
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

            populateComparisonWageSelect("fr");
            populateComparisonWageSelect("en");
            setupComparisonEvents();

            const initialLang = localStorage.getItem(COMPARISON_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: COMPARISON_LANGUAGE_STORAGE_KEY,
                tabStorageKey: COMPARISON_TAB_STORAGE_KEY,
                onShow: comparisonOnTabShow
            });
        },
        error: function(error) {
            console.error(
                "Comparison CSV loading error:",
                error
            );
        }
    }
);
