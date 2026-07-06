const BELGIUM_DATA_PATH = "../../data/belgium/belgium_labour_cost_grid_2026.csv";

let BELGIUM_DATA = [];


function applyStoredBelgiumTheme() {
    const storedTheme = localStorage.getItem("belgium-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateBelgiumThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateBelgiumThemeButton("light");
    }
}


function updateBelgiumThemeButton(theme) {
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
        localStorage.setItem("belgium-theme", "dark");
        updateBelgiumThemeButton("dark");
    } else {
        localStorage.setItem("belgium-theme", "light");
        updateBelgiumThemeButton("light");
    }

    renderBelgium();
}


const BELGIUM_COLORS = {
    gross: "#2563eb",
    net: "#16a34a",
    afterTax: "#0891b2",
    employer: "#dc2626",
    employee: "#9333ea",
    wedge: "#f97316",
    total: "#0f172a"
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


function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = value;
}


function getBelgiumSelectedProfile() {
    const select = document.getElementById("belgium-profile-select");

    if (!select) {
        return "belgium__standard_private_sector";
    }

    return select.value;
}

function getBelgiumSelectedDataProfile() {
    const select = document.getElementById("belgium-data-profile-select");

    if (!select) {
        return getBelgiumSelectedProfile();
    }

    return select.value;
}

function getBelgiumWaterfallMultiple() {
    const select = document.getElementById("belgium-waterfall-multiple");

    if (!select) {
        return 2.00;
    }

    return deNum(select.value);
}


function getBelgiumProfileData(profileId) {
    return BELGIUM_DATA
        .filter(row => row.profile_id === profileId)
        .sort((a, b) => deNum(a.smic_multiple) - deNum(b.smic_multiple));
}


function findBelgiumClosestRow(data, selectedMultiple) {
    if (!data.length) {
        return null;
    }

    return data.reduce((closestRow, currentRow) => {
        const closestDistance = Math.abs(
            deNum(closestRow.smic_multiple)
            - selectedMultiple
        );

        const currentDistance = Math.abs(
            deNum(currentRow.smic_multiple)
            - selectedMultiple
        );

        if (currentDistance < closestDistance) {
            return currentRow;
        }

        return closestRow;
    });
}


function belgiumBaseLayout(yAxisTitle) {
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
                text: "Multiple du salaire minimum belge",
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

    setTextContent(
        "metric-belgium-reference-wage",
        deEuro(referenceRow.gross_monthly_eur) + " €"
    );

    setTextContent(
        "metric-belgium-employee-rate",
        dePct(referenceRow.employee_contribution_rate)
    );

    setTextContent(
        "metric-belgium-employer-rate",
        dePct(referenceRow.employer_contribution_rate)
    );

    const costToNetAfterTax = (
        referenceRow.cost_to_net_after_withholding_tax_ratio
        || referenceRow.cost_to_net_ratio
    );

    setTextContent(
        "metric-belgium-cost-to-net",
        deNum(costToNetAfterTax).toFixed(2).replace(".", ",")
    );
}


function renderBelgiumWaterfallChart() {
    const profileId = getBelgiumSelectedProfile();
    const data = getBelgiumProfileData(profileId);

    if (!data.length) {
        return;
    }

    const selectedMultiple = getBelgiumWaterfallMultiple();
    const row = findBelgiumClosestRow(data, selectedMultiple);

    if (!row) {
        return;
    }

    const actualMultiple = deNum(row.smic_multiple);

    const netAfterTax = deNum(row.net_after_withholding_tax_monthly_eur);
    const withholdingTax = deNum(row.withholding_tax_monthly_eur);
    const netBeforeTax = deNum(row.net_before_income_tax_monthly_eur);
    const employeeContrib = deNum(row.employee_contributions_monthly_eur);
    const gross = deNum(row.gross_monthly_eur);

    const employerContribBeforeReduction = deNum(
        row.employer_contributions_before_reduction_monthly_eur
    );

    const structuralReduction = -deNum(
        row.structural_reduction_monthly_eur
    );

    const employerCost = deNum(row.employer_cost_monthly_eur);

    setTextContent(
        "belgium-waterfall-title",
        "Décomposition à "
        + actualMultiple.toFixed(2).replace(".", ",")
        + " salaire(s) minimum(s)"
    );

    setTextContent(
        "belgium-waterfall-subtitle",
        "Décomposition détaillée du passage du salaire net après précompte "
        + "au coût employeur total, pour un salaire brut de "
        + deEuro(gross)
        + " €."
    );

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
                "relative",
                "total"
            ],
            x: [
                "Net après précompte",
                "Précompte",
                "Net avant précompte",
                "Cotisations salarié",
                "Salaire brut",
                "Cotisations employeur",
                "Réduction structurelle",
                "Coût employeur"
            ],
            y: [
                netAfterTax,
                withholdingTax,
                netBeforeTax,
                employeeContrib,
                gross,
                employerContribBeforeReduction,
                structuralReduction,
                employerCost
            ],
            text: [
                deEuro(netAfterTax) + " €",
                "+" + deEuro(withholdingTax) + " €",
                deEuro(netBeforeTax) + " €",
                "+" + deEuro(employeeContrib) + " €",
                deEuro(gross) + " €",
                "+" + deEuro(employerContribBeforeReduction) + " €",
                deEuro(structuralReduction) + " €",
                deEuro(employerCost) + " €"
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
                    color: BELGIUM_COLORS.wedge
                }
            },
            decreasing: {
                marker: {
                    color: BELGIUM_COLORS.employer
                }
            },
            totals: {
                marker: {
                    color: BELGIUM_COLORS.gross
                }
            },
            hovertemplate:
                "%{x}<br>" +
                "%{y:,.2f} €<extra></extra>"
        }
    ];

    const layout = belgiumBaseLayout("Montant mensuel, euros");

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

    belgiumPlot(
        "chart-belgium-waterfall",
        traces,
        layout
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
            name: "Net avant précompte",
            line: {
                color: BELGIUM_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Net avant précompte : %{y:,.0f} €<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => deNum(row.net_after_withholding_tax_monthly_eur)),
            type: "scatter",
            mode: "lines",
            name: "Net après précompte",
            line: {
                color: BELGIUM_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Net après précompte : %{y:,.0f} €<extra></extra>"
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
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Brut : %{y:,.0f} €<extra></extra>"
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
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Coût employeur : %{y:,.0f} €<extra></extra>"
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
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Taux salarié : %{y:.1f} %<extra></extra>"
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
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Avant réduction : %{y:.1f} %<extra></extra>"
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
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Après réduction : %{y:.1f} %<extra></extra>"
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
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Réduction structurelle : %{y:,.0f} €<extra></extra>"
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
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Cotisations avant réduction : %{y:,.0f} €<extra></extra>"
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
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Cotisations après réduction : %{y:,.0f} €<extra></extra>"
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
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Coin social : %{y:.1f} %<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.total_wedge_after_withholding_tax_monthly_eur)
                / deNum(row.employer_cost_monthly_eur)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: "Coin socio-fiscal / coût employeur",
            line: {
                color: BELGIUM_COLORS.total,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Coin socio-fiscal : %{y:.1f} %<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => deNum(row.cost_to_net_ratio)),
            type: "scatter",
            mode: "lines",
            name: "Ratio coût / net avant précompte",
            yaxis: "y2",
            line: {
                color: BELGIUM_COLORS.gross,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Coût / net avant précompte : %{y:.2f}<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => deNum(row.cost_to_net_after_withholding_tax_ratio)),
            type: "scatter",
            mode: "lines",
            name: "Ratio coût / net après précompte",
            yaxis: "y2",
            line: {
                color: BELGIUM_COLORS.afterTax,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Coût / net après précompte : %{y:.2f}<extra></extra>"
        }
    ];

    const layout = belgiumBaseLayout("Coin / coût employeur");

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 70];

    layout.yaxis2 = {
        title: {
            text: "Ratio coût / net",
            standoff: 16
        },
        overlaying: "y",
        side: "right",
        range: [1, 3],
        zeroline: false,
        showgrid: false
    };

    belgiumPlot(
        "chart-belgium-wedge",
        traces,
        layout
    );
}


function renderBelgiumFiscalReturnChart() {
    const target = document.getElementById("chart-belgium-fiscal-return");

    if (!target) {
        return;
    }

    const profileId = getBelgiumSelectedProfile();

    const data = getBelgiumProfileData(profileId).filter(row => (
        Number.isFinite(deNum(row.marginal_net_before_income_tax_rate))
        && Number.isFinite(deNum(row.marginal_net_after_withholding_tax_rate))
        && Number.isFinite(deNum(row.marginal_social_wedge_rate))
        && Number.isFinite(deNum(row.marginal_total_wedge_after_withholding_tax_rate))
        && deNum(row.delta_gross_monthly_eur) > 0
    ));

    const x = data.map(row => deNum(row.smic_multiple));

    const traces = [
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_net_before_income_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: "Avant précompte",
            line: {
                color: BELGIUM_COLORS.net,
                width: 3
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Avant précompte : %{y:.1f} %<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_net_after_withholding_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: "Après précompte",
            line: {
                color: BELGIUM_COLORS.afterTax,
                width: 3,
                dash: "dot"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Après précompte : %{y:.1f} %<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_social_wedge_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: "Effet marginal social",
            line: {
                color: BELGIUM_COLORS.wedge,
                width: 2,
                dash: "dash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Effet social : %{y:.1f} %<extra></extra>"
        },
        {
            x: x,
            y: data.map(row => (
                deNum(row.marginal_total_wedge_after_withholding_tax_rate)
                * 100
            )),
            type: "scatter",
            mode: "lines",
            name: "Prélèvement marginal total",
            line: {
                color: BELGIUM_COLORS.employer,
                width: 2,
                dash: "longdash"
            },
            hovertemplate:
                "%{x:.2f} × RMMMG<br>" +
                "Prélèvement total : %{y:.1f} %<extra></extra>"
        }
    ];

    const layout = belgiumBaseLayout(
        "Part d’un euro supplémentaire de salaire brut (%)"
    );

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 120];

    belgiumPlot(
        "chart-belgium-fiscal-return",
        traces,
        layout
    );
}


function renderBelgiumDataTable() {
    const tableBody = document.getElementById("belgium-data-table-body");

    if (!tableBody) {
        return;
    }

    const profileId = getBelgiumSelectedDataProfile();

    const profileLabels = {
        belgium__standard_private_sector: "Secteur privé standard"
    };

    const caption = document.getElementById("belgium-data-profile-caption");

    if (caption) {
        caption.textContent = profileLabels[profileId] || profileId;
    }

    const data = getBelgiumProfileData(profileId);

    tableBody.innerHTML = "";

    data.forEach(row => {
        const tableRow = document.createElement("tr");

        const cells = [
            deNum(row.smic_multiple).toFixed(2).replace(".", ","),
            deEuro(row.gross_monthly_eur),
            deEuro(row.net_before_income_tax_monthly_eur),
            deEuro(row.withholding_tax_monthly_eur),
            deEuro(row.net_after_withholding_tax_monthly_eur),
            deEuro(row.employer_cost_monthly_eur),
            deEuro(row.employee_contributions_monthly_eur),
            deEuro(row.employer_contributions_monthly_eur),
            deEuro(row.social_wedge_monthly_eur),
            deEuro(row.total_wedge_after_withholding_tax_monthly_eur),
            dePct(row.employee_contribution_rate),
            dePct(row.employer_contribution_rate),
            deNum(row.cost_to_net_ratio).toFixed(2).replace(".", ","),
            deNum(row.cost_to_net_after_withholding_tax_ratio).toFixed(2).replace(".", ",")
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
    renderBelgiumWaterfallChart();
    renderBelgiumCostChart();
    renderBelgiumContributionRateChart();
    renderBelgiumStructuralReductionChart();
    renderBelgiumWedgeChart();
    renderBelgiumFiscalReturnChart();
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
    const dataProfileSelect = document.getElementById("belgium-data-profile-select");
    const waterfallMultipleSelect = document.getElementById(
        "belgium-waterfall-multiple"
    );

    if (profileSelect) {
        profileSelect.addEventListener("change", function() {
            renderBelgium();
        });
    }

    if (dataProfileSelect) {
        dataProfileSelect.addEventListener("change", function() {
            renderBelgiumDataTable();
        });
    }

    if (waterfallMultipleSelect) {
        waterfallMultipleSelect.addEventListener("change", function() {
            renderBelgiumWaterfallChart();
        });
    }
}


applyStoredBelgiumTheme();


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