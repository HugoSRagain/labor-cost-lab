let DATA = [];
let currentLanguage = localStorage.getItem("flcl_language") || "fr";
let currentTab = "simulation";

const SMIC_POINTS = ["1.00", "1.60", "2.00", "3.00"];

const TEXT = {
    fr: {
        gross_wage: "Salaire brut",
        net_wage: "Salaire net",
        employer_cost: "Coût employeur",
        employer_contrib: "Cotisations employeur",
        employee_contrib: "Cotisations salarié",
        rgdu: "RGDU 2026",
        x_axis: "Salaire brut, multiple du SMIC",
        y_amount: "Montant mensuel, euros",
        total_levy_rate: "Taux de prélèvement total",
        net_gross_return: "Δ salaire net / Δ salaire brut",
        decomp_net_wage: "Salaire net",
        decomp_employee_contrib: "Cotisations salarié",
        decomp_employer_contrib: "Cotisations employeur",
        decomp_contribution_relief: "Allègements de cotisations",
        decomp_effective_cost: "Coût employeur effectif",
        decomp_gross_wage: "Salaire brut"
    },
    en: {
        gross_wage: "Gross wage",
        net_wage: "Net wage",
        employer_cost: "Employer cost",
        employer_contrib: "Employer contributions",
        employee_contrib: "Employee contributions",
        rgdu: "RGDU 2026",
        x_axis: "Gross wage, SMIC multiple",
        y_amount: "Monthly amount, euros",
        total_levy_rate: "Total contribution rate",
        net_gross_return: "Δ net wage / Δ gross wage",
        decomp_net_wage: "Net wage",
        decomp_employee_contrib: "Employee contributions",
        decomp_employer_contrib: "Employer contributions",
        decomp_contribution_relief: "Contribution reliefs",
        decomp_effective_cost: "Effective employer cost",
        decomp_gross_wage: "Gross wage"
    }
};

const COLORS = {
    blue: "#2563eb",
    orange: "#f97316",
    green: "#16a34a",
    red: "#dc2626",
    purple: "#7c3aed",
    teal: "#0891b2",
    navy: "#0f172a"
};

function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function euro(value) {
    return Math.round(value).toLocaleString("fr-FR") + " €";
}

function pct(value) {
    return value.toFixed(1) + "%";
}

function getText() {
    return TEXT[currentLanguage] || TEXT.fr;
}

function getSelectedProfile() {
    const status = document.getElementById("status-select").value;
    const territory = document.getElementById("territory-select").value;
    const atmp = document.getElementById("atmp-select").value;
    return { status, territory, atmp };
}

function getProfileData() {
    const p = getSelectedProfile();

    return DATA
        .filter(row =>
            row.dimension_status === p.status &&
            row.dimension_territory === p.territory &&
            row.dimension_atmp === p.atmp
        )
        .sort((a, b) => num(a.smic_multiple) - num(b.smic_multiple));
}

function baseLayout(yTitle) {
    const isDark = document.body.classList.contains("dark-mode");

    return {
        template: "plotly_white",
        height: 420,
        margin: { l: 64, r: 42, t: 24, b: 70 },
        font: {
            family: "Arial",
            size: 13,
            color: isDark ? "#e5e7eb" : COLORS.navy
        },
        paper_bgcolor: isDark ? "#111827" : "#ffffff",
        plot_bgcolor: isDark ? "#111827" : "#ffffff",
        hovermode: "x unified",
        legend: {
            orientation: "h",
            yanchor: "top",
            y: -0.18,
            xanchor: "center",
            x: 0.5,
            font: { size: 12 }
        },
        xaxis: {
            title: getText().x_axis,
            showgrid: false,
            zeroline: false,
            color: isDark ? "#e5e7eb" : COLORS.navy
        },
        yaxis: {
            title: yTitle,
            showgrid: true,
            gridcolor: isDark ? "#374151" : "#e5e7eb",
            zeroline: false,
            ticksuffix: " €",
            color: isDark ? "#e5e7eb" : COLORS.navy
        }
    };
}

function addRgduZone(layout) {
    layout.shapes = [
        {
            type: "rect",
            xref: "x",
            yref: "paper",
            x0: 1,
            x1: 3,
            y0: 0,
            y1: 1,
            fillcolor: "rgba(37, 99, 235, 0.08)",
            line: { width: 0 },
            layer: "below"
        },
        {
            type: "line",
            xref: "x",
            yref: "paper",
            x0: 1,
            x1: 1,
            y0: 0,
            y1: 1,
            line: { color: COLORS.blue, dash: "dash", width: 1 }
        },
        {
            type: "line",
            xref: "x",
            yref: "paper",
            x0: 3,
            x1: 3,
            y0: 0,
            y1: 1,
            line: { color: COLORS.blue, dash: "dash", width: 1 }
        }
    ];
    return layout;
}

function renderCostChart(data) {
    const t = getText();

    const traces = [
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => num(d.employer_cost_monthly_eur)),
            mode: "lines",
            name: t.employer_cost,
            line: { color: COLORS.blue, width: 3 },
            type: "scatter"
        },
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => num(d.net_monthly_eur)),
            mode: "lines",
            name: t.net_wage,
            line: { color: COLORS.orange, width: 3 },
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(t.y_amount));

    Plotly.react("chart-cost", traces, layout, {
        responsive: true,
        displaylogo: false
    });
}

function renderRgduChart(data) {
    const t = getText();

    const filtered = data.filter(d => num(d.smic_multiple) >= 1);

    const traces = [
        {
            x: filtered.map(d => num(d.smic_multiple)),
            y: filtered.map(d => num(d.rgdu_monthly_eur)),
            mode: "lines",
            name: t.rgdu,
            line: { color: COLORS.purple, width: 3 },
            fill: "tozeroy",
            fillcolor: "rgba(124, 58, 237, 0.12)",
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(t.y_amount));

    Plotly.react("chart-rgdu", traces, layout, {
        responsive: true,
        displaylogo: false
    });
}

function renderTotalLevyChart(data) {
    const t = getText();

    const traces = [
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => {
                const total = num(d.employee_contributions_monthly_eur) + num(d.employer_contributions_monthly_eur);
                const cost = num(d.employer_cost_monthly_eur);
                return cost > 0 ? (total / cost) * 100 : 0;
            }),
            mode: "lines",
            name: t.total_levy_rate,
            line: { color: COLORS.purple, width: 3 },
            fill: "tozeroy",
            fillcolor: "rgba(124, 58, 237, 0.10)",
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(t.total_levy_rate));
    layout.yaxis.ticksuffix = "%";

    Plotly.react("chart-total-levy", traces, layout, {
        responsive: true,
        displaylogo: false
    });
}

function renderNetGrossReturnChart(data) {
    const t = getText();

    const x = [];
    const y = [];

    for (let i = 1; i < data.length; i++) {
        const deltaGross = num(data[i].gross_monthly_eur) - num(data[i - 1].gross_monthly_eur);
        const deltaNet = num(data[i].net_monthly_eur) - num(data[i - 1].net_monthly_eur);

        if (deltaGross !== 0) {
            x.push(num(data[i].smic_multiple));
            y.push((deltaNet / deltaGross) * 100);
        }
    }

    const traces = [
        {
            x,
            y,
            mode: "lines",
            name: t.net_gross_return,
            line: { color: COLORS.teal, width: 3 },
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(t.net_gross_return));
    layout.yaxis.ticksuffix = "%";

    Plotly.react("chart-net-gross-return", traces, layout, {
        responsive: true,
        displaylogo: false
    });
}

function renderDecompositionChart(data) {
    const t = getText();

    const wageSelect = document.getElementById("decomposition-wage-select");
    const targetSmic = wageSelect ? Number(wageSelect.value) : 2.0;

    let row = data[0];
    let minDistance = Infinity;

    data.forEach(d => {
        const distance = Math.abs(num(d.smic_multiple) - targetSmic);
        if (distance < minDistance) {
            row = d;
            minDistance = distance;
        }
    });

    const netWage = num(row.net_monthly_eur);
    const employeeContrib = num(row.employee_contributions_monthly_eur);
    const employerContrib = num(row.employer_contributions_monthly_eur);
    const rgdu = num(row.rgdu_monthly_eur);
    const grossWage = num(row.gross_monthly_eur);
    const employerCost = num(row.employer_cost_monthly_eur);
    const theoreticalCost = employerCost + rgdu;

    const traces = [
        {
            x: [""],
            y: [netWage],
            name: t.decomp_net_wage,
            type: "bar",
            marker: { color: COLORS.blue }
        },
        {
            x: [""],
            y: [employeeContrib],
            name: t.decomp_employee_contrib,
            type: "bar",
            marker: { color: COLORS.orange }
        },
        {
            x: [""],
            y: [employerContrib],
            name: t.decomp_employer_contrib,
            type: "bar",
            marker: { color: COLORS.green }
        },
        {
            x: [""],
            y: [rgdu],
            name: t.decomp_contribution_relief,
            type: "bar",
            marker: { color: COLORS.red }
        }
    ];

    const layout = baseLayout(t.y_amount);
    layout.barmode = "stack";
    layout.height = 470;
    layout.xaxis.showticklabels = false;
    layout.yaxis.range = [0, theoreticalCost * 1.18];
    layout.shapes = [
        {
            type: "line",
            xref: "paper",
            yref: "y",
            x0: 0,
            x1: 1,
            y0: grossWage,
            y1: grossWage,
            line: { color: COLORS.red, dash: "dash", width: 2 }
        },
        {
            type: "line",
            xref: "paper",
            yref: "y",
            x0: 0,
            x1: 1,
            y0: employerCost,
            y1: employerCost,
            line: { color: COLORS.navy, dash: "dot", width: 2 }
        }
    ];
    layout.annotations = [
        {
            xref: "paper",
            yref: "y",
            x: 0.98,
            y: grossWage,
            text: `${t.decomp_gross_wage}: ${euro(grossWage)}`,
            showarrow: false,
            xanchor: "right",
            yanchor: "bottom"
        },
        {
            xref: "paper",
            yref: "y",
            x: 0.98,
            y: employerCost,
            text: `${t.decomp_effective_cost}: ${euro(employerCost)}`,
            showarrow: false,
            xanchor: "right",
            yanchor: "top"
        }
    ];
    layout.legend.traceorder = "reversed";

    Plotly.react("chart-decomposition", traces, layout, {
        responsive: true,
        displaylogo: false
    });
}

function renderSimulation() {
    const data = getProfileData();

    if (!data.length) {
        console.warn("No data for selected profile.");
        return;
    }

    renderCostChart(data);
    renderRgduChart(data);
    renderTotalLevyChart(data);
    renderNetGrossReturnChart(data);
    renderDecompositionChart(data);
}

function updateAll() {
    if (currentTab === "simulation") {
        renderSimulation();
    }

    if (currentTab === "data") {
        renderDataTable();
    }

    if (currentTab === "comparisons") {
        renderComparisons();
    }
}

function setupEvents() {
    ["status-select", "territory-select", "atmp-select"].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("change", updateAll);
        }
    });

    const wageSelect = document.getElementById("decomposition-wage-select");
    if (wageSelect) {
        wageSelect.addEventListener("change", function () {
            renderDecompositionChart(getProfileData());
        });
    }

    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", function () {
            currentTab = this.dataset.tab;
            updateAll();
        });
    });
}

function loadData() {
    Papa.parse("data/labour_cost_grid_mon_entreprise.csv", {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            DATA = results.data.filter(row => row.profile_id);
            setupEvents();
            renderSimulation();
        },
        error: function(error) {
            console.error("CSV loading error:", error);
        }
    });
}

document.addEventListener("DOMContentLoaded", loadData);


