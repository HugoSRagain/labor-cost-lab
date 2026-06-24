const BELGIUM_DATA_PATH = "../../data/belgium/belgium_labour_cost_grid_2026.csv";

let BELGIUM_DATA = [];

const BELGIUM_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    employer: "#dc2626",
    employee: "#9333ea",
    wedge: "#f97316"
};


function deNum(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return number;
}


function deEuro(value) {
    return deNum(value).toLocaleString(
        "fr-FR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function dePct(value) {
    return (deNum(value) * 100).toLocaleString(
        "fr-FR",
        {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }
    ) + " %";
}


function getBelgiumSelectedProfile() {
    const select = document.getElementById("belgium-profile-select");

    if (!select) {
        return "belgium__standard_private_sector";
    }

    return select.value;
}


function getBelgiumProfileData(profileId) {
    return BELGIUM_DATA
        .filter(row => row.profile_id === profileId)
        .sort((a, b) => deNum(a.smic_multiple) - deNum(b.smic_multiple));
}


function belgiumBaseLayout(yAxisTitle) {
    return {
        margin: {
            l: 82,
            r: 28,
            t: 24,
            b: 76
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        hovermode: "x unified",
        xaxis: {
            title: {
                text: "Multiple du salaire minimum belge",
                standoff: 14
            },
            range: [0.75, 6.05],
            showgrid: false,
            zeroline: false,
            linecolor: "#cbd5e1",
            tickcolor: "#cbd5e1",
            ticks: "outside",
            tickvals: [1, 2, 3, 4, 5, 6],
            ticktext: ["1", "2", "3", "4", "5", "6"]
        },
        yaxis: {
            title: {
                text: yAxisTitle,
                standoff: 16
            },
            gridcolor: "rgba(148, 163, 184, 0.25)",
            zeroline: false
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


function belgiumPlot(elementId, traces, layout) {
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


function renderBelgiumMetrics() {
    const profileId = getBelgiumSelectedProfile();
    const profileData = getBelgiumProfileData(profileId);
    const referenceRow = profileData.find(row => deNum(row.smic_multiple) === 1);

    if (!referenceRow) {
        return;
    }

    document.getElementById("metric-belgium-reference-wage").textContent = (
        deEuro(referenceRow.gross_monthly_eur)
        + " €"
    );

    document.getElementById("metric-belgium-employee-rate").textContent = (
        dePct(referenceRow.employee_contribution_rate)
    );

    document.getElementById("metric-belgium-employer-rate").textContent = (
        dePct(referenceRow.employer_contribution_rate)
    );

    document.getElementById("metric-belgium-cost-to-net").textContent = (
        deNum(referenceRow.cost_to_net_ratio).toFixed(2).replace(".", ",")
    );
}


function renderBelgiumCostChart() {
    const profileId = getBelgiumSelectedProfile();
    const data = getBelgiumProfileData(profileId);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => deNum(row.net_before_income_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: "Net avant impôt",
            line: {
                color: BELGIUM_COLORS.net,
                width: 3
            }
        },
        {
            x: x,
            y: data.map(row => deNum(row.gross_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: "Brut",
            line: {
                color: BELGIUM_COLORS.gross,
                width: 3
            }
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_cost_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: "Coût employeur",
            line: {
                color: BELGIUM_COLORS.employer,
                width: 3
            }
        }
    ];

    const layout = belgiumBaseLayout("Montant mensuel, euros");

    layout.yaxis.ticksuffix = " €";

    belgiumPlot(
        "chart-belgium-cost",
        traces,
        layout
    );
}


function renderBelgiumContributionRateChart() {
    const profileId = getBelgiumSelectedProfile();
    const data = getBelgiumProfileData(profileId);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => deNum(row.employee_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: "Taux salarié",
            line: {
                color: BELGIUM_COLORS.employee,
                width: 3
            }
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.employer_contribution_rate_before_reduction)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: "Taux employeur avant réduction",
            line: {
                color: BELGIUM_COLORS.employer,
                width: 2,
                dash: "dash"
            }
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_contribution_rate) * 100),
            type: "scatter",
            mode: "lines",
            name: "Taux employeur après réduction",
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = belgiumBaseLayout("Taux effectif");

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 35];

    belgiumPlot(
        "chart-belgium-rates",
        traces,
        layout
    );
}

function renderBelgiumStructuralReductionChart() {
    const profileId = getBelgiumSelectedProfile();
    const data = getBelgiumProfileData(profileId);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => deNum(row.structural_reduction_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: "Réduction structurelle",
            line: {
                color: BELGIUM_COLORS.net,
                width: 3
            }
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_contributions_before_reduction_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: "Cotisations employeur avant réduction",
            line: {
                color: BELGIUM_COLORS.employer,
                width: 2,
                dash: "dash"
            }
        },
        {
            x: x,
            y: data.map(row => deNum(row.employer_contributions_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: "Cotisations employeur après réduction",
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 3
            }
        }
    ];

    const layout = belgiumBaseLayout("Montant mensuel, euros");

    layout.yaxis.ticksuffix = " €";

    belgiumPlot(
        "chart-belgium-structural-reduction",
        traces,
        layout
    );
}

function renderBelgiumWedgeChart() {
    const profileId = getBelgiumSelectedProfile();
    const data = getBelgiumProfileData(profileId);

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => (
                deNum(row.social_wedge_monthly_eur)
                / deNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: "Coin social / coût employeur",
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 3
            }
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.cost_to_net_ratio)
            )),
            type: "scatter",
            mode: "lines",
            name: "Ratio coût / net",
            yaxis: "y2",
            line: {
                color: BELGIUM_COLORS.gross,
                width: 2,
                dash: "dash"
            }
        }
    ];

    const layout = belgiumBaseLayout("Coin social / coût employeur");

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 45];

    layout.yaxis2 = {
        title: {
            text: "Ratio coût / net",
            standoff: 16
        },
        overlaying: "y",
        side: "right",
        range: [1, 2],
        zeroline: false,
        showgrid: false
    };

    belgiumPlot(
        "chart-belgium-wedge",
        traces,
        layout
    );
}


function renderBelgiumDataTable() {
    const tableBody = document.getElementById("belgium-data-table-body");

    if (!tableBody) {
        return;
    }

    const profileId = getBelgiumSelectedProfile();
    const data = getBelgiumProfileData(profileId)
        .filter(row => [1, 2, 3, 4, 5, 6].includes(deNum(row.smic_multiple)));

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            deNum(row.smic_multiple).toFixed(2).replace(".", ","),
            deEuro(row.gross_monthly_eur),
            deEuro(row.net_before_income_tax_monthly_eur),
            deEuro(row.employer_cost_monthly_eur),
            deEuro(row.employee_contributions_monthly_eur),
            deEuro(row.employer_contributions_monthly_eur),
            deEuro(row.social_wedge_monthly_eur),
            dePct(row.employee_contribution_rate),
            dePct(row.employer_contribution_rate),
            deNum(row.cost_to_net_ratio).toFixed(2).replace(".", ",")
        ];

        cells.forEach(cell => {
            const tableCell = document.createElement("td");

            tableCell.textContent = cell;
            tableRow.appendChild(tableCell);
        });

        tableBody.appendChild(tableRow);
    });
}


function renderBelgium() {
    renderBelgiumMetrics();
    renderBelgiumCostChart();
    renderBelgiumContributionRateChart();
    renderBelgiumStructuralReductionChart();
    renderBelgiumWedgeChart();
    renderBelgiumDataTable();
}


function setupBelgiumTabs() {
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
                    renderBelgium();
                }, 80);
            }

            if (target === "data") {
                setTimeout(function() {
                    renderBelgiumDataTable();
                }, 80);
            }
        });
    });
}


function setupBelgiumEvents() {
    const profileSelect = document.getElementById("belgium-profile-select");

    if (profileSelect) {
        profileSelect.addEventListener("change", function() {
            renderBelgium();
        });
    }
}


Papa.parse(
    BELGIUM_DATA_PATH,
    {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            BELGIUM_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => (
                    deNum(a.smic_multiple)
                    - deNum(b.smic_multiple)
                ));

            console.log(
                "Belgium Labour Cost Lab data loaded:",
                BELGIUM_DATA.length,
                "rows"
            );

            setupBelgiumTabs();
            setupBelgiumEvents();
            renderBelgium();
        },
        error: function(error) {
            console.error(
                "Belgium CSV loading error:",
                error
            );
        }
    }
);