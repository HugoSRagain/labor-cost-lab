var DATA = [];
var currentLanguage = localStorage.getItem("flcl_language") || "fr";
var currentTab = localStorage.getItem("flcl_tab_" + currentLanguage) || "simulation";

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
        y_rate: "Taux",
        total_levy_rate: "Taux de prélèvement total",
        net_gross_return: "Δ salaire net / Δ salaire brut",
        cost_net_ratio: "Coût employeur / salaire net",
        social_wedge: "Coin social",
        employer_rate: "Taux employeur",
        marginal_cost_rate: "Δ coût employeur / Δ salaire brut",
        marginal_net_retention: "Δ salaire net / Δ coût employeur",
        decomp_net_wage: "Salaire net",
        decomp_employee_contrib: "Cotisations salarié",
        decomp_employer_contrib: "Cotisations employeur après allègements",
        decomp_employer_contrib_before_relief: "Cotisations employeur avant allègements",
        decomp_contribution_relief: "Allègements de cotisations",
        decomp_effective_cost: "Coût employeur effectif",
        decomp_theoretical_cost: "Coût avant allègements",
        decomp_gross_wage: "Salaire brut",
        rgdu_zone: "RGDU 2026<br>zone dégressive"
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
        y_rate: "Rate",
        total_levy_rate: "Total contribution rate",
        net_gross_return: "Δ net wage / Δ gross wage",
        cost_net_ratio: "Employer cost / net wage",
        social_wedge: "Social wedge",
        employer_rate: "Employer rate",
        marginal_cost_rate: "Δ employer cost / Δ gross wage",
        marginal_net_retention: "Δ net wage / Δ employer cost",
        decomp_net_wage: "Net wage",
        decomp_employee_contrib: "Employee contributions",
        decomp_employer_contrib: "Employer contributions after reliefs",
        decomp_employer_contrib_before_relief: "Employer contributions before reliefs",
        decomp_contribution_relief: "Contribution reliefs",
        decomp_effective_cost: "Effective employer cost",
        decomp_theoretical_cost: "Cost before reliefs",
        decomp_gross_wage: "Gross wage",
        rgdu_zone: "RGDU 2026<br>degressive area"
    }
};

const COLORS = {
    blue: "#2563eb",
    orange: "#f97316",
    green: "#16a34a",
    red: "#dc2626",
    purple: "#7c3aed",
    teal: "#0891b2",
    navy: "#0f172a",
    gray: "#6b7280"
};

function num(value) {
    if (value === null || value === undefined || value === "") {
        return 0;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    const cleaned = String(value)
        .replace(/\s/g, "")
        .replace(",", ".");

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}

function euro(value) {
    return Math.round(num(value)).toLocaleString("fr-FR") + " €";
}

function pct(value) {
    return num(value).toFixed(1) + "%";
}

function getText(lang) {
    return TEXT[lang] || TEXT.fr;
}

function getElement(id, lang) {
    return document.getElementById(id + "-" + lang);
}

function getActiveLanguage() {
    const activeSection = document.querySelector(".language-section.active");

    if (activeSection && activeSection.id === "section-en") {
        return "en";
    }

    if (activeSection && activeSection.id === "section-fr") {
        return "fr";
    }

    return localStorage.getItem("flcl_language") || "fr";
}

function getSelectedProfile(lang) {
    const statusSelect = getElement("status-select", lang);
    const territorySelect = getElement("territory-select", lang);
    const atmpSelect = getElement("atmp-select", lang);

    return {
        status: statusSelect ? statusSelect.value : "non_cadre",
        territory: territorySelect ? territorySelect.value : "standard",
        atmp: atmpSelect ? atmpSelect.value : "standard"
    };
}

function getProfileData(lang) {
    const profile = getSelectedProfile(lang);

    return DATA
        .filter(row =>
            row.dimension_status === profile.status &&
            row.dimension_territory === profile.territory &&
            row.dimension_atmp === profile.atmp
        )
        .sort((a, b) => num(a.smic_multiple) - num(b.smic_multiple));
}

function isDarkMode() {
    return document.body.classList.contains("dark-mode");
}

function plot(targetId, traces, layout) {
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

function baseLayout(lang, yTitle) {
    const dark = isDarkMode();
    const t = getText(lang);

    return {
        template: "plotly_white",
        height: 420,
        margin: {
            l: 64,
            r: 42,
            t: 24,
            b: 70
        },
        font: {
            family: "Arial",
            size: 13,
            color: dark ? "#e5e7eb" : COLORS.navy
        },
        paper_bgcolor: dark ? "#111827" : "#ffffff",
        plot_bgcolor: dark ? "#111827" : "#ffffff",
        hovermode: "x unified",
        legend: {
            orientation: "h",
            yanchor: "top",
            y: -0.18,
            xanchor: "center",
            x: 0.5,
            font: {
                size: 12,
                color: dark ? "#e5e7eb" : COLORS.navy
            }
        },
        xaxis: {
            title: t.x_axis,
            showgrid: false,
            zeroline: false,
            color: dark ? "#e5e7eb" : COLORS.navy
        },
        yaxis: {
            title: yTitle,
            showgrid: true,
            gridcolor: dark ? "#374151" : "#e5e7eb",
            zeroline: false,
            color: dark ? "#e5e7eb" : COLORS.navy
        }
    };
}

function addRgduZone(layout, lang) {
    const t = getText(lang);

    layout.shapes = layout.shapes || [];
    layout.annotations = layout.annotations || [];

    layout.shapes.push(
        {
            type: "rect",
            xref: "x",
            yref: "paper",
            x0: 1,
            x1: 3,
            y0: 0,
            y1: 1,
            fillcolor: "rgba(37, 99, 235, 0.08)",
            line: {
                width: 0
            },
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
            line: {
                color: COLORS.blue,
                dash: "dash",
                width: 1.5
            }
        },
        {
            type: "line",
            xref: "x",
            yref: "paper",
            x0: 3,
            x1: 3,
            y0: 0,
            y1: 1,
            line: {
                color: COLORS.blue,
                dash: "dash",
                width: 1.5
            }
        }
    );

    layout.annotations.push({
        xref: "x",
        yref: "paper",
        x: 1.05,
        y: 0.97,
        text: t.rgdu_zone,
        showarrow: false,
        xanchor: "left",
        yanchor: "top",
        font: {
            size: 12,
            color: COLORS.blue
        }
    });

    return layout;
}

function renderCostChart(data, lang) {
    const t = getText(lang);

    const traces = [
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => num(d.gross_monthly_eur)),
            mode: "lines",
            name: t.gross_wage,
            line: {
                color: COLORS.green,
                width: 2.5,
                dash: "dot"
            },
            type: "scatter"
        },
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => num(d.net_monthly_eur)),
            mode: "lines",
            name: t.net_wage,
            line: {
                color: COLORS.orange,
                width: 3
            },
            type: "scatter"
        },
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => num(d.employer_cost_monthly_eur)),
            mode: "lines",
            name: t.employer_cost,
            line: {
                color: COLORS.blue,
                width: 3
            },
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(lang, t.y_amount), lang);
    layout.yaxis.ticksuffix = " €";

    plot("chart-cost-" + lang, traces, layout);
}

function renderEmployerRateChart(data, lang) {
    const t = getText(lang);

    const traces = [
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => num(d.employer_contribution_rate) * 100),
            mode: "lines",
            name: t.employer_rate,
            line: {
                color: COLORS.blue,
                width: 3
            },
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(lang, t.employer_rate), lang);
    layout.yaxis.ticksuffix = "%";

    plot("chart-employer-rate-" + lang, traces, layout);
}

function renderRgduChart(data, lang) {
    const t = getText(lang);

    const filtered = data
        .filter(d => num(d.smic_multiple) >= 1)
        .map(d => {
            const smic = num(d.smic_multiple);
            const monthly = smic >= 3 ? 0 : num(d.rgdu_monthly_eur);
            const gross = num(d.gross_monthly_eur);

            return {
                smic_multiple: smic,
                gross_monthly_eur: gross,
                employer_cost_monthly_eur: num(d.employer_cost_monthly_eur),
                rgdu_monthly_eur: monthly,
                rgdu_annual_eur: monthly * 12,
                rgdu_rate_percent: gross > 0 ? (monthly / gross) * 100 : 0
            };
        });

    const traces = [
        {
            x: filtered.map(d => d.smic_multiple),
            y: filtered.map(d => d.rgdu_monthly_eur),
            mode: "lines",
            name: lang === "fr" ? "Montant mensuel" : "Monthly amount",
            line: {
                color: COLORS.purple,
                width: 3
            },
            fill: "tozeroy",
            fillcolor: "rgba(124, 58, 237, 0.12)",
            type: "scatter",
            yaxis: "y"
        },
        {
            x: filtered.map(d => d.smic_multiple),
            y: filtered.map(d => d.rgdu_annual_eur),
            mode: "lines",
            name: lang === "fr" ? "Montant annuel" : "Annual amount",
            line: {
                color: COLORS.purple,
                width: 3
            },
            fill: "tozeroy",
            fillcolor: "rgba(124, 58, 237, 0.12)",
            type: "scatter",
            yaxis: "y",
            visible: false
        },
        {
            x: filtered.map(d => d.smic_multiple),
            y: filtered.map(d => d.rgdu_rate_percent),
            mode: "lines",
            name: lang === "fr" ? "RGDU / salaire brut" : "RGDU / gross wage",
            line: {
                color: COLORS.red,
                width: 2.5,
                dash: "dot"
            },
            type: "scatter",
            yaxis: "y2"
        }
    ];

    const layout = addRgduZone(baseLayout(lang, lang === "fr" ? "Montant mensuel d’allègement, euros" : "Monthly relief amount, euros"), lang);

    layout.height = 500;
    layout.margin = {
        l: 72,
        r: 78,
        t: 90,
        b: 95
    };

    layout.xaxis.range = [0.95, 3.5];

    layout.yaxis.ticksuffix = " €";

    layout.yaxis2 = {
        title: lang === "fr" ? "RGDU / salaire brut" : "RGDU / gross wage",
        overlaying: "y",
        side: "right",
        ticksuffix: "%",
        showgrid: false,
        zeroline: false,
        color: isDarkMode() ? "#e5e7eb" : COLORS.navy
    };

    layout.updatemenus = [
        {
            type: "buttons",
            direction: "right",
            x: 0,
            y: 1.16,
            xanchor: "left",
            yanchor: "top",
            buttons: [
                {
                    label: lang === "fr" ? "Mensuel" : "Monthly",
                    method: "update",
                    args: [
                        {
                            visible: [true, false, true]
                        },
                        {
                            "yaxis.title.text": lang === "fr" ? "Montant mensuel d’allègement, euros" : "Monthly relief amount, euros"
                        }
                    ]
                },
                {
                    label: lang === "fr" ? "Annuel" : "Annual",
                    method: "update",
                    args: [
                        {
                            visible: [false, true, true]
                        },
                        {
                            "yaxis.title.text": lang === "fr" ? "Montant annuel d’allègement, euros" : "Annual relief amount, euros"
                        }
                    ]
                }
            ],
            showactive: true,
            bgcolor: isDarkMode() ? "#111827" : "#ffffff",
            bordercolor: isDarkMode() ? "#374151" : "#e5e7eb",
            borderwidth: 1,
            font: {
                color: isDarkMode() ? "#e5e7eb" : COLORS.navy,
                size: 12
            }
        }
    ];

    layout.legend.y = -0.22;

    plot("chart-rgdu-" + lang, traces, layout);
}

function renderWedgeChart(data, lang) {
    const t = getText(lang);

    const traces = [
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => num(d.social_wedge_rate) * 100),
            mode: "lines",
            name: t.social_wedge,
            line: {
                color: COLORS.teal,
                width: 3
            },
            fill: "tozeroy",
            fillcolor: "rgba(8, 145, 178, 0.12)",
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(lang, t.social_wedge), lang);
    layout.yaxis.ticksuffix = "%";

    plot("chart-wedge-" + lang, traces, layout);
}

function renderRatioChart(data, lang) {
    const t = getText(lang);

    const traces = [
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => num(d.cost_to_net_ratio)),
            mode: "lines",
            name: t.cost_net_ratio,
            line: {
                color: COLORS.red,
                width: 3
            },
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(lang, t.cost_net_ratio), lang);

    plot("chart-ratio-" + lang, traces, layout);
}

function renderMarginalChart(data, lang) {
    const t = getText(lang);

    const x = [];
    const marginalCost = [];
    const netRetention = [];

    for (let i = 1; i < data.length; i++) {
        const deltaGross = num(data[i].gross_monthly_eur) - num(data[i - 1].gross_monthly_eur);
        const deltaCost = num(data[i].employer_cost_monthly_eur) - num(data[i - 1].employer_cost_monthly_eur);
        const deltaNet = num(data[i].net_monthly_eur) - num(data[i - 1].net_monthly_eur);

        if (deltaGross !== 0 && deltaCost !== 0) {
            x.push(num(data[i].smic_multiple));
            marginalCost.push((deltaCost / deltaGross) * 100);
            netRetention.push((deltaNet / deltaCost) * 100);
        }
    }

    const traces = [
        {
            x,
            y: marginalCost,
            mode: "lines",
            name: t.marginal_cost_rate,
            line: {
                color: COLORS.green,
                width: 3
            },
            type: "scatter"
        },
        {
            x,
            y: netRetention,
            mode: "lines",
            name: t.marginal_net_retention,
            line: {
                color: COLORS.orange,
                width: 3,
                dash: "dot"
            },
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(lang, t.y_rate), lang);
    layout.height = 500;
    layout.margin.b = 105;
    layout.yaxis.ticksuffix = "%";

    plot("chart-marginal-" + lang, traces, layout);
}

function renderTotalLevyChart(data, lang) {
    const t = getText(lang);

    const traces = [
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => {
                const employee = num(d.employee_contributions_monthly_eur);
                const employer = num(d.employer_contributions_monthly_eur);
                const gross = num(d.gross_monthly_eur);

                return gross > 0 ? ((employee + employer) / gross) * 100 : 0;
            }),
            mode: "lines",
            name: t.total_levy_rate,
            line: {
                color: COLORS.purple,
                width: 3
            },
            fill: "tozeroy",
            fillcolor: "rgba(124, 58, 237, 0.10)",
            type: "scatter"
        },
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => {
                const employee = num(d.employee_contributions_monthly_eur);
                const gross = num(d.gross_monthly_eur);

                return gross > 0 ? (employee / gross) * 100 : 0;
            }),
            mode: "lines",
            name: lang === "fr" ? "Part salarié" : "Employee part",
            line: {
                color: COLORS.orange,
                width: 2,
                dash: "dot"
            },
            type: "scatter"
        },
        {
            x: data.map(d => num(d.smic_multiple)),
            y: data.map(d => {
                const employer = num(d.employer_contributions_monthly_eur);
                const gross = num(d.gross_monthly_eur);

                return gross > 0 ? (employer / gross) * 100 : 0;
            }),
            mode: "lines",
            name: lang === "fr" ? "Part employeur" : "Employer part",
            line: {
                color: COLORS.green,
                width: 2,
                dash: "dot"
            },
            type: "scatter"
        }
    ];

    const layout = addRgduZone(baseLayout(lang, lang === "fr" ? "Cotisations / salaire brut" : "Contributions / gross wage"), lang);
    layout.yaxis.ticksuffix = "%";

    plot("chart-total-levy-" + lang, traces, layout);
}

const INCOME_TAX_2026_BRACKETS = [
    { threshold: 0, rate: 0.00 },
    { threshold: 11600, rate: 0.11 },
    { threshold: 29579, rate: 0.30 },
    { threshold: 84577, rate: 0.41 },
    { threshold: 181917, rate: 0.45 }
];

function computeProgressiveIncomeTax2026(taxableIncome, parts = 1) {
    const safeParts = Math.max(1, num(parts));
    const incomePerPart = Math.max(0, num(taxableIncome) / safeParts);

    let taxPerPart = 0;

    for (let i = 0; i < INCOME_TAX_2026_BRACKETS.length; i++) {
        const current = INCOME_TAX_2026_BRACKETS[i];
        const next = INCOME_TAX_2026_BRACKETS[i + 1];

        const lower = current.threshold;
        const upper = next ? next.threshold : Infinity;

        if (incomePerPart > lower) {
            const taxableSlice = Math.min(incomePerPart, upper) - lower;
            taxPerPart += taxableSlice * current.rate;
        }
    }

    return taxPerPart * safeParts;
}

function computeSimplifiedAnnualIncomeTaxFromNetMonthly(netMonthly) {
    const annualNet = num(netMonthly) * 12;

    /*
        Simplified fiscal scenario:
        - single taxpayer;
        - 1 tax unit;
        - no other income;
        - no tax credits or reductions;
        - 10% professional-expense allowance approximated from annual net wage.
        This is not an official income-tax simulation.
    */
    const taxableIncome = annualNet * 0.90;

    return computeProgressiveIncomeTax2026(taxableIncome, 1);
}

function computeAnnualDisposableIncomeFromNetMonthly(netMonthly) {
    const annualNet = num(netMonthly) * 12;
    const annualTax = computeSimplifiedAnnualIncomeTaxFromNetMonthly(netMonthly);

    return annualNet - annualTax;
}

function renderNetGrossReturnChart(data, lang) {
    const t = getText(lang);

    const x = [];
    const beforeIncomeTaxReturn = [];
    const afterIncomeTaxReturn = [];
    const incomeTaxBite = [];
    const totalMarginalLevy = [];

    for (let i = 1; i < data.length; i++) {
        const deltaGrossMonthly =
            num(data[i].gross_monthly_eur) - num(data[i - 1].gross_monthly_eur);

        const deltaNetMonthly =
            num(data[i].net_monthly_eur) - num(data[i - 1].net_monthly_eur);

        const disposableAnnualCurrent =
            computeAnnualDisposableIncomeFromNetMonthly(data[i].net_monthly_eur);

        const disposableAnnualPrevious =
            computeAnnualDisposableIncomeFromNetMonthly(data[i - 1].net_monthly_eur);

        const deltaDisposableMonthly =
            (disposableAnnualCurrent - disposableAnnualPrevious) / 12;

        if (deltaGrossMonthly !== 0) {
            const beforeIR = (deltaNetMonthly / deltaGrossMonthly) * 100;
            const afterIR = (deltaDisposableMonthly / deltaGrossMonthly) * 100;
            const irBite = beforeIR - afterIR;
            const totalLevy = 100 - afterIR;

            x.push(num(data[i].smic_multiple));
            beforeIncomeTaxReturn.push(beforeIR);
            afterIncomeTaxReturn.push(afterIR);
            incomeTaxBite.push(irBite);
            totalMarginalLevy.push(totalLevy);
        }
    }

    const traces = [
        {
            x,
            y: beforeIncomeTaxReturn,
            mode: "lines",
            name: lang === "fr" ? "Avant IR" : "Before PIT",
            line: {
                color: COLORS.teal,
                width: 3
            },
            hovertemplate:
                "<b>%{x:.2f}× SMIC</b><br>" +
                "%{fullData.name}: %{y:.1f}%<extra></extra>",
            type: "scatter"
        },
        {
            x,
            y: afterIncomeTaxReturn,
            mode: "lines",
            name: lang === "fr" ? "Après IR" : "After PIT",
            line: {
                color: COLORS.blue,
                width: 3
            },
            hovertemplate:
                "<b>%{x:.2f}× SMIC</b><br>" +
                "%{fullData.name}: %{y:.1f}%<extra></extra>",
            type: "scatter"
        },
        {
            x,
            y: incomeTaxBite,
            mode: "lines",
            name: lang === "fr" ? "Effet marginal IR" : "Marginal PIT effect",
            line: {
                color: COLORS.red,
                width: 2.5,
                dash: "dot"
            },
            hovertemplate:
                "<b>%{x:.2f}× SMIC</b><br>" +
                "%{fullData.name}: %{y:.1f}%<extra></extra>",
            type: "scatter"
        },
        {
            x,
            y: totalMarginalLevy,
            mode: "lines",
            name: lang === "fr" ? "Prélèvement marginal total" : "Total marginal levy",
            line: {
                color: COLORS.purple,
                width: 2.5,
                dash: "dash"
            },
            visible: "legendonly",
            hovertemplate:
                "<b>%{x:.2f}× SMIC</b><br>" +
                "%{fullData.name}: %{y:.1f}%<extra></extra>",
            type: "scatter"
        }
    ];

    const layout = addRgduZone(
        baseLayout(
            lang,
            lang === "fr"
                ? "Part d’un euro supplémentaire de salaire brut"
                : "Share of one additional euro of gross wage"
        ),
        lang
    );

    layout.height = 520;

    layout.margin = {
        l: 78,
        r: 36,
        t: 34,
        b: 125
    };

    layout.xaxis.title = {
        text: lang === "fr"
            ? "Salaire brut, multiple du SMIC"
            : "Gross wage, SMIC multiple",
        standoff: 16
    };

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    layout.legend = {
        orientation: "h",
        x: 0.5,
        y: -0.22,
        xanchor: "center",
        yanchor: "top",
        bgcolor: "rgba(0,0,0,0)",
        borderwidth: 0,
        font: {
            size: 11,
            color: isDarkMode() ? "#e5e7eb" : COLORS.navy
        }
    };

    layout.annotations = (layout.annotations || []).filter(annotation => {
        return !(annotation.yref === "paper" && annotation.y < 0);
    });

    plot("chart-net-gross-return-" + lang, traces, layout);
}

function renderDecompositionChart(data, lang) {
    const t = getText(lang);
    const wageSelect = getElement("decomposition-wage-select", lang);
    const targetSmic = wageSelect ? num(wageSelect.value) : 2.0;

    let row = data[0];
    let minDistance = Infinity;

    data.forEach(d => {
        const distance = Math.abs(num(d.smic_multiple) - targetSmic);

        if (distance < minDistance) {
            row = d;
            minDistance = distance;
        }
    });

    if (!row) {
        return;
    }

    const netWage = num(row.net_monthly_eur);
    const employeeContrib = num(row.employee_contributions_monthly_eur);
    const employerContrib = num(row.employer_contributions_monthly_eur);
    const rgdu = num(row.rgdu_monthly_eur);
    const grossWage = num(row.gross_monthly_eur);
    const employerCost = num(row.employer_cost_monthly_eur);
    const employerBeforeRelief = employerContrib + rgdu;
    const theoreticalCost = employerCost + rgdu;

    const customData = [[
        targetSmic,
        grossWage,
        employerCost,
        rgdu,
        employerContrib,
        employerBeforeRelief,
        theoreticalCost
    ]];

    const hoverTemplate =
        "<b>%{fullData.name}</b><br>" +
        `${t.x_axis}: %{customdata[0]:.2f}× SMIC<br>` +
        `${t.decomp_gross_wage}: %{customdata[1]:,.0f} €<br>` +
        `${t.decomp_effective_cost}: %{customdata[2]:,.0f} €<br>` +
        `${t.decomp_contribution_relief}: %{customdata[3]:,.0f} €<br>` +
        `${t.decomp_employer_contrib}: %{customdata[4]:,.0f} €<br>` +
        `${t.decomp_employer_contrib_before_relief}: %{customdata[5]:,.0f} €<br>` +
        `${t.decomp_theoretical_cost}: %{customdata[6]:,.0f} €<br>` +
        "Montant: %{y:,.0f} €" +
        "<extra></extra>";

    const traces = [
        {
            x: [""],
            y: [netWage],
            name: t.decomp_net_wage,
            type: "bar",
            marker: {
                color: COLORS.blue
            },
            customdata: customData,
            hovertemplate: hoverTemplate
        },
        {
            x: [""],
            y: [employeeContrib],
            name: t.decomp_employee_contrib,
            type: "bar",
            marker: {
                color: COLORS.orange
            },
            customdata: customData,
            hovertemplate: hoverTemplate
        },
        {
            x: [""],
            y: [employerContrib],
            name: t.decomp_employer_contrib,
            type: "bar",
            marker: {
                color: COLORS.green
            },
            customdata: customData,
            hovertemplate: hoverTemplate
        },
        {
            x: [""],
            y: [rgdu],
            name: t.decomp_contribution_relief,
            type: "bar",
            marker: {
                color: COLORS.red
            },
            customdata: customData,
            hovertemplate: hoverTemplate
        }
    ];

    const layout = baseLayout(lang, t.y_amount);

    layout.barmode = "stack";
    layout.height = 470;
    layout.margin = {
        l: 80,
        r: 90,
        t: 70,
        b: 95
    };

    layout.xaxis.title = "";
    layout.xaxis.showticklabels = false;

    layout.yaxis.range = [
        0,
        Math.max(theoreticalCost, grossWage, employerCost) * 1.18
    ];
    layout.yaxis.ticksuffix = " €";

    layout.shapes = [
        {
            type: "line",
            xref: "paper",
            yref: "y",
            x0: 0,
            x1: 1,
            y0: grossWage,
            y1: grossWage,
            line: {
                color: COLORS.red,
                dash: "dash",
                width: 2
            }
        },
        {
            type: "line",
            xref: "paper",
            yref: "y",
            x0: 0,
            x1: 1,
            y0: employerCost,
            y1: employerCost,
            line: {
                color: COLORS.navy,
                dash: "dot",
                width: 2
            }
        }
    ];

    layout.annotations = [
        {
            xref: "paper",
            yref: "paper",
            x: 1,
            y: 1.08,
            text:
                `${t.decomp_gross_wage}: ${euro(grossWage)}` +
                "<br>" +
                `${t.decomp_effective_cost}: ${euro(employerCost)}`,
            showarrow: false,
            xanchor: "right",
            yanchor: "bottom",
            align: "right",
            font: {
                size: 12,
                color: COLORS.navy
            },
            bgcolor: isDarkMode() ? "rgba(17,24,39,0.94)" : "rgba(255,255,255,0.94)",
            bordercolor: "rgba(15,23,42,0.20)",
            borderwidth: 1,
            borderpad: 4
        }
    ];

    layout.legend.traceorder = "reversed";

    plot("chart-decomposition-" + lang, traces, layout);
}

function renderSimulation(lang = getActiveLanguage()) {
    currentLanguage = lang;

    const data = getProfileData(lang);

    if (!data.length) {
        console.warn("No data for selected profile.", {
            lang: lang,
            profile: getSelectedProfile(lang),
            totalRows: DATA.length
        });
        return;
    }

    renderCostChart(data, lang);
    renderEmployerRateChart(data, lang);
    renderRgduChart(data, lang);
    renderWedgeChart(data, lang);
    renderRatioChart(data, lang);
    renderMarginalChart(data, lang);
    renderTotalLevyChart(data, lang);
    renderNetGrossReturnChart(data, lang);
    renderDecompositionChart(data, lang);
}

function renderDataTable(lang = getActiveLanguage()) {
    return;
}

function renderComparisons(lang = getActiveLanguage()) {
    return;
}

function updateAll(lang = getActiveLanguage()) {
    currentLanguage = lang;
    currentTab = localStorage.getItem("flcl_tab_" + lang) || currentTab || "simulation";

    if (currentTab === "simulation") {
        renderSimulation(lang);
    }

    if (currentTab === "data") {
        renderDataTable(lang);
    }

    if (currentTab === "comparisons") {
        renderComparisons(lang);
    }
}

function setupEventsForLanguage(lang) {
    ["status-select", "territory-select", "atmp-select"].forEach(id => {
        const element = getElement(id, lang);

        if (element) {
            element.addEventListener("change", function () {
                renderSimulation(lang);
            });
        }
    });

    const wageSelect = getElement("decomposition-wage-select", lang);

    if (wageSelect) {
        wageSelect.addEventListener("change", function () {
            renderDecompositionChart(getProfileData(lang), lang);
        });
    }
}

function setupEvents() {
    setupEventsForLanguage("fr");
    setupEventsForLanguage("en");

    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", function () {
            const section = this.closest(".language-section");
            const lang = section && section.id === "section-en" ? "en" : "fr";

            currentLanguage = lang;
            currentTab = this.dataset.tab || "simulation";

            localStorage.setItem("flcl_tab_" + lang, currentTab);

            setTimeout(function () {
                updateAll(lang);
            }, 200);
        });
    });
}

function loadData() {
    if (typeof Papa === "undefined") {
        console.error("PapaParse is not loaded. Check the script tag in index.html.");
        return;
    }

    Papa.parse("data/labour_cost_grid_mon_entreprise.csv", {
        download: true,
        header: true,
        dynamicTyping: false,
        complete: function (results) {
            DATA = results.data.filter(row => row.profile_id);

            console.log("French Labour Cost Lab data loaded:", DATA.length, "rows");

            setupEvents();

            setTimeout(function () {
                renderSimulation(getActiveLanguage());
            }, 250);
        },
        error: function (error) {
            console.error("CSV loading error:", error);
        }
    });
}

document.addEventListener("DOMContentLoaded", loadData);