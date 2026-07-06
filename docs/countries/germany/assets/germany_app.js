var GERMANY_DATA = [];

function applyStoredGermanyTheme() {
    const storedTheme = localStorage.getItem("germany-theme");

    if (storedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateGermanyThemeButton("dark");
    } else {
        document.body.classList.remove("dark-mode");
        updateGermanyThemeButton("light");
    }
}


function updateGermanyThemeButton(theme) {
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
        localStorage.setItem("germany-theme", "dark");
        updateGermanyThemeButton("dark");
    } else {
        localStorage.setItem("germany-theme", "light");
        updateGermanyThemeButton("light");
    }

    renderGermany();
}

const GERMANY_COLORS = {
    blue: "#2563eb",
    orange: "#f97316",
    green: "#16a34a",
    red: "#dc2626",
    purple: "#7c3aed",
    teal: "#0891b2",
    navy: "#0f172a",
    gray: "#6b7280"
};

const GERMANY_THRESHOLDS = {
    healthCare: 2.4125,
    pensionUnemployment: 3.5072
};

const GERMANY_EMPLOYMENT_ZONES = {
    minijobUpper: 0.2503,
    midijobUpper: 0.8301,
    chartMin: 0.20,
    chartMax: 6.00
};

function deNum(value) {
    if (value === null || value === undefined || value === "") {
        return 0;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    const parsed = Number(
        String(value)
            .replace(/\s/g, "")
            .replace(",", ".")
    );

    return Number.isFinite(parsed) ? parsed : 0;
}

function deEuro(value) {
    return Math.round(deNum(value)).toLocaleString("fr-FR") + " €";
}

function dePct(value) {
    return (deNum(value) * 100).toFixed(1).replace(".", ",") + " %";
}

function getGermanySelectedProfile() {
    const select = document.getElementById("germany-profile-select");

    if (!select) {
        return "germany__public_health__with_children__outside_saxony";
    }

    return select.value;
}

function getGermanyWaterfallMultiple() {
    const select = document.getElementById("germany-waterfall-multiple");

    if (!select) {
        return 2.00;
    }

    return deNum(select.value);
}

function getGermanyVisibleEmploymentZones() {
    const minijob = document.getElementById("germany-zone-minijob");
    const midijob = document.getElementById("germany-zone-midijob");
    const standard = document.getElementById("germany-zone-standard");

    return {
        minijob: minijob ? minijob.checked : true,
        midijob: midijob ? midijob.checked : true,
        standard: standard ? standard.checked : true
    };
}

function getGermanyProfileData() {
    const profileId = getGermanySelectedProfile();

    return GERMANY_DATA
        .filter(row => row.profile_id === profileId)
        .sort((a, b) => deNum(a.smic_multiple) - deNum(b.smic_multiple));
}

function germanyBaseLayout(yTitle) {
    const isDarkMode = document.body.classList.contains("dark-mode");

    const backgroundColor = isDarkMode ? "#111827" : "#ffffff";
    const textColor = isDarkMode ? "#f9fafb" : GERMANY_COLORS.navy;
    const gridColor = isDarkMode ? "#374151" : "#e5e7eb";
    const axisColor = isDarkMode ? "#4b5563" : "#cbd5e1";

    return {
        template: "plotly_white",
        height: 460,
        margin: {
            l: 76,
            r: 42,
            t: 38,
            b: 92
        },
        font: {
            family: "Inter, Arial, sans-serif",
            size: 13,
            color: textColor
        },
        paper_bgcolor: backgroundColor,
        plot_bgcolor: backgroundColor,

        hovermode: "x unified",
        hoverlabel: {
            bgcolor: backgroundColor,
            bordercolor: axisColor,
            font: {
                color: textColor,
                size: 12
            }
        },
        legend: {
            orientation: "h",
            yanchor: "top",
            y: -0.20,
            xanchor: "center",
            x: 0.5,
            font: {
                size: 12
            }
        },
        xaxis: {
            title: {
                text: "Multiple du salaire minimum allemand",
                standoff: 14
            },
            range: [0.15, 6.05],
            showgrid: false,
            zeroline: false,
            linecolor: axisColor,
            tickcolor: axisColor,
            ticks: "outside",
            tickvals: [0.2, 0.5, 1, 2, 3, 4, 5, 6],
            ticktext: ["0,2", "0,5", "1", "2", "3", "4", "5", "6"]
        },
        yaxis: {
            title: {
                text: yTitle,
                standoff: 16
            },
            showgrid: true,
            zeroline: false,
            gridcolor: gridColor,
            linecolor: axisColor,
            tickcolor: axisColor,
            ticks: "outside"
        }
    };
}

function addGermanyCeilingLines(layout) {
    if (!layout.shapes) {
        layout.shapes = [];
    }

    if (!layout.annotations) {
        layout.annotations = [];
    }

    layout.shapes = layout.shapes.concat([
        {
            type: "line",
            x0: GERMANY_THRESHOLDS.healthCare,
            x1: GERMANY_THRESHOLDS.healthCare,
            y0: 0,
            y1: 1,
            xref: "x",
            yref: "paper",
            line: {
                color: "rgba(100, 116, 139, 0.75)",
                width: 1.5,
                dash: "dash"
            }
        },
        {
            type: "line",
            x0: GERMANY_THRESHOLDS.pensionUnemployment,
            x1: GERMANY_THRESHOLDS.pensionUnemployment,
            y0: 0,
            y1: 1,
            xref: "x",
            yref: "paper",
            line: {
                color: "rgba(100, 116, 139, 0.75)",
                width: 1.5,
                dash: "dot"
            }
        }
    ]);

    layout.annotations = layout.annotations.concat([]);

    return layout;
}

function addGermanyEmploymentZones(layout) {
    const visibleZones = getGermanyVisibleEmploymentZones();

    if (!layout.shapes) {
        layout.shapes = [];
    }

    const shapes = [];

    if (visibleZones.minijob) {
        shapes.push({
            type: "rect",
            x0: GERMANY_EMPLOYMENT_ZONES.chartMin,
            x1: GERMANY_EMPLOYMENT_ZONES.minijobUpper,
            y0: 0,
            y1: 1,
            xref: "x",
            yref: "paper",
            fillcolor: "rgba(59, 130, 246, 0.10)",
            line: {
                width: 0
            },
            layer: "below"
        });
    }

    if (visibleZones.midijob) {
        shapes.push({
            type: "rect",
            x0: GERMANY_EMPLOYMENT_ZONES.minijobUpper,
            x1: GERMANY_EMPLOYMENT_ZONES.midijobUpper,
            y0: 0,
            y1: 1,
            xref: "x",
            yref: "paper",
            fillcolor: "rgba(249, 115, 22, 0.10)",
            line: {
                width: 0
            },
            layer: "below"
        });
    }

    if (visibleZones.standard) {
        shapes.push({
            type: "rect",
            x0: GERMANY_EMPLOYMENT_ZONES.midijobUpper,
            x1: GERMANY_EMPLOYMENT_ZONES.chartMax,
            y0: 0,
            y1: 1,
            xref: "x",
            yref: "paper",
            fillcolor: "rgba(34, 197, 94, 0.06)",
            line: {
                width: 0
            },
            layer: "below"
        });
    }

    layout.shapes = layout.shapes.concat(shapes);

    return layout;
}


function germanyPlot(targetId, traces, layout) {
    const target = document.getElementById(targetId);

    if (!target) {
        console.warn("Plot target not found:", targetId);
        return;
    }

    Plotly.react(target, traces, layout, {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d"]
    });
}

function findGermanyClosestRow(data, targetMultiple) {
    let closestRow = data[0];
    let minDistance = Infinity;

    data.forEach(row => {
        const distance = Math.abs(
            deNum(row.smic_multiple) - targetMultiple
        );

        if (distance < minDistance) {
            closestRow = row;
            minDistance = distance;
        }
    });

    return closestRow;
}

function renderGermanyMetrics() {
    const data = getGermanyProfileData();

    if (!data.length) {
        return;
    }

    const rowOne = findGermanyClosestRow(data, 1.00);
    const rowTwo = findGermanyClosestRow(data, 2.00);

    document.getElementById("germany-net-minimum").textContent =
        deEuro(rowOne.net_before_income_tax_monthly_eur);

    document.getElementById("germany-cost-minimum").textContent =
        deEuro(rowOne.employer_cost_monthly_eur);

    document.getElementById("germany-employer-rate").textContent =
        dePct(rowOne.employer_contribution_rate);

    document.getElementById("germany-cost-net-ratio").textContent =
        deNum(rowTwo.cost_to_net_ratio).toFixed(2);
}

function renderGermanyCostChart() {
    const data = getGermanyProfileData();

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => deNum(row.gross_monthly_eur)),
            mode: "lines",
            name: "Salaire brut",
            line: {
                color: GERMANY_COLORS.green,
                width: 2.5,
                dash: "dot"
            },
            type: "scatter"
        },
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => deNum(row.net_before_income_tax_monthly_eur)),
            mode: "lines",
            name: "Salaire net avant impôt",
            line: {
                color: GERMANY_COLORS.orange,
                width: 3
            },
            type: "scatter"
        },
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => deNum(row.employer_cost_monthly_eur)),
            mode: "lines",
            name: "Coût employeur",
            line: {
                color: GERMANY_COLORS.blue,
                width: 3
            },
            type: "scatter"
        }
    ];

    let layout = germanyBaseLayout("Montant mensuel, euros");
    layout = addGermanyEmploymentZones(layout);
    layout = addGermanyCeilingLines(layout);

    layout.yaxis.ticksuffix = " €";

    germanyPlot("chart-germany-cost", traces, layout);
}


function renderGermanyContributionRateChart() {
    const data = getGermanyProfileData();

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => deNum(row.employee_contribution_rate) * 100),
            mode: "lines",
            name: "Taux salarié",
            line: {
                color: GERMANY_COLORS.orange,
                width: 3
            },
            type: "scatter"
        },
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => deNum(row.employer_contribution_rate) * 100),
            mode: "lines",
            name: "Taux employeur",
            line: {
                color: GERMANY_COLORS.blue,
                width: 3
            },
            type: "scatter"
        }
    ];

    let layout = germanyBaseLayout("Taux effectif");
    layout = addGermanyEmploymentZones(layout);
    layout = addGermanyCeilingLines(layout);

    layout.yaxis.ticksuffix = "%";

    germanyPlot("chart-germany-rates", traces, layout);
}

function renderGermanyWedgeChart() {
    const data = getGermanyProfileData();

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => deNum(row.social_wedge_rate) * 100),
            mode: "lines",
            name: "Coin social",
            line: {
                color: GERMANY_COLORS.teal,
                width: 3
            },
            fill: "tozeroy",
            fillcolor: "rgba(8, 145, 178, 0.12)",
            type: "scatter"
        }
    ];

    let layout = germanyBaseLayout("Coin social / coût employeur");
    layout = addGermanyEmploymentZones(layout);
    layout = addGermanyCeilingLines(layout);

    layout.yaxis.ticksuffix = "%";

    germanyPlot("chart-germany-wedge", traces, layout);
}

function renderGermanyFiscalReturnChart() {
    const profileId = getGermanySelectedProfile();
    const profileData = getGermanyProfileData(profileId);

    if (!profileData.length) {
        return;
    }

    const marginalData = [];

    for (let index = 1; index < profileData.length; index += 1) {
        const previous = profileData[index - 1];
        const current = profileData[index];

        const deltaGross = (
            deNum(current.gross_monthly_eur)
            - deNum(previous.gross_monthly_eur)
        );

        if (deltaGross <= 0) {
            continue;
        }

        const deltaNetBeforeTax = (
            deNum(current.net_before_income_tax_monthly_eur)
            - deNum(previous.net_before_income_tax_monthly_eur)
        );

        const deltaNetAfterTax = (
            deNum(current.net_after_income_tax_monthly_eur)
            - deNum(previous.net_after_income_tax_monthly_eur)
        );

        const marginalNetBeforeTaxShare = (
            deltaNetBeforeTax
            / deltaGross
        );

        const marginalNetAfterTaxShare = (
            deltaNetAfterTax
            / deltaGross
        );

        marginalData.push({
            smic_multiple: deNum(current.smic_multiple),
            marginal_net_before_tax_share: marginalNetBeforeTaxShare,
            marginal_net_after_tax_share: marginalNetAfterTaxShare,
            marginal_social_wedge: 1 - marginalNetBeforeTaxShare,
            marginal_total_tax_wedge: 1 - marginalNetAfterTaxShare
        });
    }

    const data = marginalData.filter(row => (
        Number.isFinite(row.marginal_net_before_tax_share)
        && Number.isFinite(row.marginal_net_after_tax_share)
    ));

    if (!data.length) {
        return;
    }

    const traces = [
        {
            x: data.map(row => row.smic_multiple),
            y: data.map(row => row.marginal_net_before_tax_share * 100),
            type: "scatter",
            mode: "lines",
            name: "Avant IR",
            line: {
                width: 3
            }
        },
        {
            x: data.map(row => row.smic_multiple),
            y: data.map(row => row.marginal_net_after_tax_share * 100),
            type: "scatter",
            mode: "lines",
            name: "Après Lohnsteuer + Soli",
            line: {
                width: 3
            }
        },
        {
            x: data.map(row => row.smic_multiple),
            y: data.map(row => row.marginal_social_wedge * 100),
            type: "scatter",
            mode: "lines",
            name: "Effet marginal social",
            line: {
                width: 2,
                dash: "dot"
            }
        },
        {
            x: data.map(row => row.smic_multiple),
            y: data.map(row => row.marginal_total_tax_wedge * 100),
            type: "scatter",
            mode: "lines",
            name: "Prélèvement marginal total estimé",
            line: {
                width: 2,
                dash: "dash"
            }
        }
    ];

    let layout = germanyBaseLayout(
        "Part d’un euro supplémentaire de salaire brut"
    );

    layout = addGermanyEmploymentZones(layout);
    layout = addGermanyCeilingLines(layout);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [-10, 110];

    germanyPlot(
        "chart-germany-fiscal-return",
        traces,
        layout
    );
}

function renderGermanyDecompositionChart() {
    const data = getGermanyProfileData();

    if (!data.length) {
        return;
    }

    const selectedMultiple = getGermanyWaterfallMultiple();
    const row = findGermanyClosestRow(data, selectedMultiple);

    const actualMultiple = deNum(row.smic_multiple);

    const netBeforeTax = deNum(row.net_before_income_tax_monthly_eur);
    const gross = deNum(row.gross_monthly_eur);
    const employerCost = deNum(row.employer_cost_monthly_eur);

    const employeePension = deNum(row.employee_pension_monthly_eur);
    const employeeHealth = deNum(row.employee_health_monthly_eur);
    const employeeCare = deNum(row.employee_care_monthly_eur);
    const employeeUnemployment = deNum(row.employee_unemployment_monthly_eur);

    const employerPension = deNum(row.employer_pension_monthly_eur);
    const employerHealth = deNum(row.employer_health_monthly_eur);
    const employerCare = deNum(row.employer_care_monthly_eur);
    const employerUnemployment = deNum(row.employer_unemployment_monthly_eur);

    const title = document.getElementById("germany-waterfall-title");
    const subtitle = document.getElementById("germany-waterfall-subtitle");

    if (title) {
        title.textContent =
            "Décomposition à " +
            actualMultiple.toFixed(2).replace(".", ",") +
            " salaire(s) minimum(s)";
    }

    if (subtitle) {
        subtitle.textContent =
            "Décomposition détaillée du passage du salaire net avant impôt au coût employeur total, " +
            "pour un salaire brut de " +
            deEuro(gross) +
            ".";
    }

    function employeePct(value) {
        return (
            deNum(value) / gross * 100
        ).toFixed(1).replace(".", ",") + " % du brut";
    }

    function employerPct(value) {
        return (
            deNum(value) / employerCost * 100
        ).toFixed(1).replace(".", ",") + " % du coût";
    }
    const labels = [
        "Salaire net<br>avant impôt",

        "Retraite<br>salarié",
        "Maladie<br>salarié",
        "Dépendance<br>salarié",
        "Chômage<br>salarié",

        "Salaire<br>brut",

        "Retraite<br>employeur",
        "Maladie<br>employeur",
        "Dépendance<br>employeur",
        "Chômage<br>employeur",

        "Coût<br>employeur"
    ];

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
            x: labels,
            y: [
                netBeforeTax,

                employeePension,
                employeeHealth,
                employeeCare,
                employeeUnemployment,

                gross,

                employerPension,
                employerHealth,
                employerCare,
                employerUnemployment,

                employerCost
            ],
            text: [
                deEuro(netBeforeTax),

                "+" + deEuro(employeePension) + "<br>" + employeePct(employeePension),
                "+" + deEuro(employeeHealth) + "<br>" + employeePct(employeeHealth),
                "+" + deEuro(employeeCare) + "<br>" + employeePct(employeeCare),
                "+" + deEuro(employeeUnemployment) + "<br>" + employeePct(employeeUnemployment),

                deEuro(gross),

                "+" + deEuro(employerPension) + "<br>" + employerPct(employerPension),
                "+" + deEuro(employerHealth) + "<br>" + employerPct(employerHealth),
                "+" + deEuro(employerCare) + "<br>" + employerPct(employerCare),
                "+" + deEuro(employerUnemployment) + "<br>" + employerPct(employerUnemployment),

                deEuro(employerCost)
            ],
            textposition: "outside",
            connector: {
                line: {
                    color: "rgba(100, 116, 139, 0.45)",
                    width: 1
                }
            },
            increasing: {
                marker: {
                    color: "rgba(249, 115, 22, 0.86)"
                }
            },
            totals: {
                marker: {
                    color: "rgba(37, 99, 235, 0.90)"
                }
            },
            decreasing: {
                marker: {
                    color: "rgba(220, 38, 38, 0.82)"
                }
            },
            hovertemplate:
                "<b>%{x}</b><br>" +
                "Montant: %{y:,.0f} €" +
                "<extra></extra>"
        }
    ];

    const layout = germanyBaseLayout("Montant mensuel, euros");

    layout.height = 680;
    layout.showlegend = false;

    layout.xaxis.title = "";
    layout.xaxis.range = null;
    layout.xaxis.tickangle = -35;
    layout.xaxis.automargin = true;
    layout.xaxis.tickmode = "array";
    layout.xaxis.tickvals = labels;
    layout.xaxis.ticktext = labels;
    layout.xaxis.categoryorder = "array";
    layout.xaxis.categoryarray = labels;
    layout.xaxis.tickfont = {
        size: 11
    };

    layout.yaxis.ticksuffix = " €";
    layout.yaxis.range = [
        0,
        employerCost * 1.18
    ];

    layout.margin = {
        l: 82,
        r: 52,
        t: 72,
        b: 185
    };

    germanyPlot("chart-germany-decomposition", traces, layout);
}

function renderGermanyContributionBreakdownChart() {
    const data = getGermanyProfileData();

    if (!data.length) {
        return;
    }

    const row = findGermanyClosestRow(data, 2.00);

    const labels = [
        "Retraite",
        "Maladie",
        "Dépendance",
        "Chômage"
    ];

    const employeeValues = [
        deNum(row.employee_pension_monthly_eur),
        deNum(row.employee_health_monthly_eur),
        deNum(row.employee_care_monthly_eur),
        deNum(row.employee_unemployment_monthly_eur)
    ];

    const employerValues = [
        deNum(row.employer_pension_monthly_eur),
        deNum(row.employer_health_monthly_eur),
        deNum(row.employer_care_monthly_eur),
        deNum(row.employer_unemployment_monthly_eur)
    ];

    const traces = [
        {
            x: labels,
            y: employeeValues,
            name: "Salarié",
            type: "bar",
            marker: {
                color: "rgba(249, 115, 22, 0.82)"
            },
            text: employeeValues.map(value => deEuro(value)),
            textposition: "outside",
            cliponaxis: false,
            hovertemplate:
                "<b>%{x}</b><br>" +
                "Salarié: %{y:,.0f} €" +
                "<extra></extra>"
        },
        {
            x: labels,
            y: employerValues,
            name: "Employeur",
            type: "bar",
            marker: {
                color: "rgba(37, 99, 235, 0.82)"
            },
            text: employerValues.map(value => deEuro(value)),
            textposition: "outside",
            hovertemplate:
                "<b>%{x}</b><br>" +
                "Employeur: %{y:,.0f} €" +
                "<extra></extra>"
        }
    ];

    const layout = germanyBaseLayout("Montant mensuel, euros");

    layout.height = 430;
    layout.barmode = "group";
    layout.showlegend = true;

    layout.xaxis = {
        title: {
            text: ""
        },
        type: "category",
        showgrid: false,
        zeroline: false,
        linecolor: "#cbd5e1",
        tickcolor: "#cbd5e1",
        ticks: "outside",
        automargin: true
    };

    layout.yaxis = {
        title: {
            text: "Montant mensuel, euros",
            standoff: 16
        },
        showgrid: true,
        gridcolor: "#e5e7eb",
        zeroline: false,
        linecolor: "#cbd5e1",
        tickcolor: "#cbd5e1",
        ticks: "outside",
        ticksuffix: " €"
    };

    layout.margin = {
        l: 76,
        r: 42,
        t: 38,
        b: 82
    };

    germanyPlot("chart-germany-breakdown", traces, layout);
}

function getGermanyDataSelectedProfile() {
    const select = document.getElementById("germany-data-profile-select");

    if (!select) {
        return getGermanySelectedProfile();
    }

    return select.value;
}

function getGermanyDataProfileData() {
    const profileId = getGermanyDataSelectedProfile();

    return GERMANY_DATA
        .filter(row => row.profile_id === profileId)
        .sort((a, b) => deNum(a.smic_multiple) - deNum(b.smic_multiple));
}

function renderGermanyDataTable() {
    const table = document.getElementById("germany-data-table");
    const label = document.getElementById("germany-data-profile-label");

    if (!table) {
        return;
    }

    const tbody = table.querySelector("tbody");

    if (!tbody) {
        return;
    }

    const data = getGermanyDataProfileData();

    tbody.innerHTML = "";

    if (!data.length) {
        if (label) {
            label.textContent = "Aucune donnée disponible pour ce profil.";
        }

        return;
    }

    const firstRow = data[0];

    if (label) {
        label.textContent = firstRow.profile_label_fr;
    }

    data.forEach(row => {
        const tr = document.createElement("tr");

        const cells = [
            deNum(row.smic_multiple).toFixed(2).replace(".", ","),
            row.employment_regime_label_fr,
            deEuro(row.gross_monthly_eur),
            deEuro(row.net_before_income_tax_monthly_eur),
            deEuro(row.employer_cost_monthly_eur),
            deEuro(row.employee_contributions_monthly_eur),
            deEuro(row.employer_contributions_monthly_eur),
            deEuro(row.social_wedge_monthly_eur),
            dePct(row.employee_contribution_rate),
            dePct(row.employer_contribution_rate),
            deNum(row.cost_to_net_ratio).toFixed(2)
        ];

        cells.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function renderGermany() {
    renderGermanyMetrics();
    renderGermanyCostChart();
    renderGermanyContributionRateChart();
    renderGermanyWedgeChart();
    renderGermanyFiscalReturnChart();
    renderGermanyDecompositionChart();
    renderGermanyContributionBreakdownChart();
    renderGermanyDataTable();
}

function setupGermanyTabs() {
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
                    renderGermany();
                }, 80);
            }

            if (target === "data") {
                setTimeout(function() {
                    renderGermanyDataTable();
                }, 80);
            }
        });
    });
}

function setupGermanyEvents() {
    const profileSelect = document.getElementById("germany-profile-select");
    const waterfallSelect = document.getElementById("germany-waterfall-multiple");
    const dataProfileSelect = document.getElementById("germany-data-profile-select");
    const minijobZone = document.getElementById("germany-zone-minijob");
    const midijobZone = document.getElementById("germany-zone-midijob");
    const standardZone = document.getElementById("germany-zone-standard");

    if (profileSelect) {
        profileSelect.addEventListener("change", function() {
            renderGermany();
        });
    }

    if (waterfallSelect) {
        waterfallSelect.addEventListener("change", function() {
            renderGermanyDecompositionChart();
        });
    }

    if (dataProfileSelect) {
        dataProfileSelect.addEventListener("change", function() {
            renderGermanyDataTable();
        });
    }

    [minijobZone, midijobZone, standardZone].forEach(zoneCheckbox => {
        if (zoneCheckbox) {
            zoneCheckbox.addEventListener("change", function() {
                renderGermanyCostChart();
                renderGermanyContributionRateChart();
                renderGermanyWedgeChart();
                renderGermanyFiscalReturnChart();
            });
        }
    });
}

function loadGermanyData() {
    if (typeof Papa === "undefined") {
        console.error("PapaParse is not loaded.");
        return;
    }

    Papa.parse("../../data/germany/germany_labour_cost_grid_2026.csv", {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            GERMANY_DATA = results.data
                .filter(row => row.profile_id)
                .sort((a, b) => deNum(a.smic_multiple) - deNum(b.smic_multiple));

            console.log(
                "Germany Labour Cost Lab data loaded:",
                GERMANY_DATA.length,
                "rows"
            );

	    setupGermanyTabs();
	    setupGermanyEvents();
	    renderGermany();
	    renderGermanyDataTable();
        },
        error: function(error) {
            console.error("Germany CSV loading error:", error);
        }
    });

}

document.addEventListener("DOMContentLoaded", function() {
    applyStoredGermanyTheme();
    loadGermanyData();
});