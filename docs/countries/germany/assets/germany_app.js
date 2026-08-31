var GERMANY_DATA = [];
const GERMANY_LANGUAGE_STORAGE_KEY = "germany_language";
const GERMANY_TAB_STORAGE_KEY = "germany_tab";

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
        localStorage.setItem("germany-theme", "dark");
        updateGermanyThemeButton("dark");
    } else {
        localStorage.setItem("germany-theme", "light");
        updateGermanyThemeButton("light");
    }

    renderGermany(getActiveI18nLanguage(GERMANY_LANGUAGE_STORAGE_KEY));
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

function geLocale(lang) {
    return lang === "en" ? "en-US" : "fr-FR";
}

function deEuro(value, lang) {
    return Math.round(deNum(value)).toLocaleString(geLocale(lang)) + " €";
}

function dePct(value, lang) {
    const text = (deNum(value) * 100).toFixed(1);
    return (lang === "en" ? text : text.replace(".", ",")) + " %";
}

function deRatio(value, lang) {
    const text = deNum(value).toFixed(2);
    return lang === "en" ? text : text.replace(".", ",");
}

function getGermanySelectedProfile(lang) {
    const select = getI18nElement("germany-profile-select", lang);

    if (!select) {
        return "germany__public_health__with_children__outside_saxony";
    }

    return select.value;
}

function getGermanyWaterfallMultiple(lang) {
    const select = getI18nElement("germany-waterfall-multiple", lang);

    if (!select) {
        return 2.00;
    }

    return deNum(select.value);
}

function getGermanyVisibleEmploymentZones(lang) {
    const minijob = getI18nElement("germany-zone-minijob", lang);
    const midijob = getI18nElement("germany-zone-midijob", lang);
    const standard = getI18nElement("germany-zone-standard", lang);

    return {
        minijob: minijob ? minijob.checked : true,
        midijob: midijob ? midijob.checked : true,
        standard: standard ? standard.checked : true
    };
}

function getGermanyProfileData(lang) {
    const profileId = getGermanySelectedProfile(lang);

    return GERMANY_DATA
        .filter(row => row.profile_id === profileId)
        .sort((a, b) => deNum(a.smic_multiple) - deNum(b.smic_multiple));
}

function germanyBaseLayout(lang, yTitle) {
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
                text: getI18nText(lang).x_axis_minimum_wage,
                standoff: 14
            },
            range: [0.15, 6.05],
            showgrid: false,
            zeroline: false,
            linecolor: axisColor,
            tickcolor: axisColor,
            ticks: "outside",
            tickvals: [0.2, 0.5, 1, 2, 3, 4, 5, 6],
            ticktext: lang === "en"
                ? ["0.2", "0.5", "1", "2", "3", "4", "5", "6"]
                : ["0,2", "0,5", "1", "2", "3", "4", "5", "6"]
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

function addGermanyEmploymentZones(layout, lang) {
    const visibleZones = getGermanyVisibleEmploymentZones(lang);

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

function renderGermanyMetrics(lang) {
    const data = getGermanyProfileData(lang);

    if (!data.length) {
        return;
    }

    const rowOne = findGermanyClosestRow(data, 1.00);
    const rowTwo = findGermanyClosestRow(data, 2.00);

    setTextContentById("germany-net-minimum-" + lang, deEuro(rowOne.net_before_income_tax_monthly_eur, lang));
    setTextContentById("germany-cost-minimum-" + lang, deEuro(rowOne.employer_cost_monthly_eur, lang));
    setTextContentById("germany-employer-rate-" + lang, dePct(rowOne.employer_contribution_rate, lang));
    setTextContentById("germany-cost-net-ratio-" + lang, deRatio(rowTwo.cost_to_net_ratio, lang));
}

function setTextContentById(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function renderGermanyCostChart(lang) {
    const data = getGermanyProfileData(lang);
    const t = getI18nText(lang);

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => deNum(row.gross_monthly_eur)),
            mode: "lines",
            name: t.gross_wage,
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
            name: lang === "en" ? "Net wage before income tax" : "Salaire net avant impôt",
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
            name: t.employer_cost,
            line: {
                color: GERMANY_COLORS.blue,
                width: 3
            },
            type: "scatter"
        }
    ];

    let layout = germanyBaseLayout(lang, t.y_amount);
    layout = addGermanyEmploymentZones(layout, lang);
    layout = addGermanyCeilingLines(layout);

    layout.yaxis.ticksuffix = " €";

    germanyPlot("chart-germany-cost-" + lang, traces, layout);
}


function renderGermanyContributionRateChart(lang) {
    const data = getGermanyProfileData(lang);

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => deNum(row.employee_contribution_rate) * 100),
            mode: "lines",
            name: lang === "en" ? "Employee rate" : "Taux salarié",
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
            name: lang === "en" ? "Employer rate" : "Taux employeur",
            line: {
                color: GERMANY_COLORS.blue,
                width: 3
            },
            type: "scatter"
        }
    ];

    let layout = germanyBaseLayout(lang, getI18nText(lang).y_rate);
    layout = addGermanyEmploymentZones(layout, lang);
    layout = addGermanyCeilingLines(layout);

    layout.yaxis.ticksuffix = "%";

    germanyPlot("chart-germany-rates-" + lang, traces, layout);
}

function renderGermanyWedgeChart(lang) {
    const data = getGermanyProfileData(lang);

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => deNum(row.social_wedge_rate) * 100),
            mode: "lines",
            name: getI18nText(lang).social_wedge,
            line: {
                color: GERMANY_COLORS.teal,
                width: 3
            },
            fill: "tozeroy",
            fillcolor: "rgba(8, 145, 178, 0.12)",
            type: "scatter"
        }
    ];

    let layout = germanyBaseLayout(lang, lang === "en" ? "Social wedge / employer cost" : "Coin social / coût employeur");
    layout = addGermanyEmploymentZones(layout, lang);
    layout = addGermanyCeilingLines(layout);

    layout.yaxis.ticksuffix = "%";

    germanyPlot("chart-germany-wedge-" + lang, traces, layout);
}

function renderGermanyFiscalReturnChart(lang) {
    const profileData = getGermanyProfileData(lang);

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
            name: lang === "en" ? "Before income tax" : "Avant IR",
            line: {
                width: 3
            }
        },
        {
            x: data.map(row => row.smic_multiple),
            y: data.map(row => row.marginal_net_after_tax_share * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "After Lohnsteuer + Soli" : "Après Lohnsteuer + Soli",
            line: {
                width: 3
            }
        },
        {
            x: data.map(row => row.smic_multiple),
            y: data.map(row => row.marginal_social_wedge * 100),
            type: "scatter",
            mode: "lines",
            name: lang === "en" ? "Marginal social effect" : "Effet marginal social",
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
            name: lang === "en" ? "Estimated total marginal levy" : "Prélèvement marginal total estimé",
            line: {
                width: 2,
                dash: "dash"
            }
        }
    ];

    let layout = germanyBaseLayout(
        lang,
        lang === "en"
            ? "Share of an additional euro of gross wage"
            : "Part d'un euro supplémentaire de salaire brut"
    );

    layout = addGermanyEmploymentZones(layout, lang);
    layout = addGermanyCeilingLines(layout);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [-10, 110];

    germanyPlot(
        "chart-germany-fiscal-return-" + lang,
        traces,
        layout
    );
}

function renderGermanyDecompositionChart(lang) {
    const data = getGermanyProfileData(lang);

    if (!data.length) {
        return;
    }

    const selectedMultiple = getGermanyWaterfallMultiple(lang);
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

    const title = document.getElementById("germany-waterfall-title-" + lang);
    const subtitle = document.getElementById("germany-waterfall-subtitle-" + lang);

    const multipleLabel = lang === "en"
        ? actualMultiple.toFixed(2) + " minimum wage(s)"
        : actualMultiple.toFixed(2).replace(".", ",") + " salaire(s) minimum(s)";

    if (title) {
        title.textContent = (lang === "en" ? "Breakdown at " : "Décomposition à ") + multipleLabel;
    }

    if (subtitle) {
        subtitle.textContent = lang === "en"
            ? "Detailed breakdown of the path from net wage before income tax to total employer cost, "
                + "for a gross wage of " + deEuro(gross, lang) + "."
            : "Décomposition détaillée du passage du salaire net avant impôt au coût employeur total, "
                + "pour un salaire brut de " + deEuro(gross, lang) + ".";
    }

    function employeePct(value) {
        const text = (deNum(value) / gross * 100).toFixed(1);
        return lang === "en"
            ? text + " % of gross"
            : text.replace(".", ",") + " % du brut";
    }

    function employerPct(value) {
        const text = (deNum(value) / employerCost * 100).toFixed(1);
        return lang === "en"
            ? text + " % of cost"
            : text.replace(".", ",") + " % du coût";
    }

    const labels = lang === "en"
        ? [
            "Net wage<br>before tax",
            "Employee<br>pension",
            "Employee<br>health",
            "Employee<br>care",
            "Employee<br>unemployment",
            "Gross<br>wage",
            "Employer<br>pension",
            "Employer<br>health",
            "Employer<br>care",
            "Employer<br>unemployment",
            "Employer<br>cost"
        ]
        : [
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
                deEuro(netBeforeTax, lang),

                "+" + deEuro(employeePension, lang) + "<br>" + employeePct(employeePension),
                "+" + deEuro(employeeHealth, lang) + "<br>" + employeePct(employeeHealth),
                "+" + deEuro(employeeCare, lang) + "<br>" + employeePct(employeeCare),
                "+" + deEuro(employeeUnemployment, lang) + "<br>" + employeePct(employeeUnemployment),

                deEuro(gross, lang),

                "+" + deEuro(employerPension, lang) + "<br>" + employerPct(employerPension),
                "+" + deEuro(employerHealth, lang) + "<br>" + employerPct(employerHealth),
                "+" + deEuro(employerCare, lang) + "<br>" + employerPct(employerCare),
                "+" + deEuro(employerUnemployment, lang) + "<br>" + employerPct(employerUnemployment),

                deEuro(employerCost, lang)
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
                (lang === "en" ? "Amount: " : "Montant: ") + "%{y:,.0f} €" +
                "<extra></extra>"
        }
    ];

    const layout = germanyBaseLayout(lang, getI18nText(lang).y_amount);

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

    germanyPlot("chart-germany-decomposition-" + lang, traces, layout);
}

function renderGermanyContributionBreakdownChart(lang) {
    const data = getGermanyProfileData(lang);

    if (!data.length) {
        return;
    }

    const row = findGermanyClosestRow(data, 2.00);

    const labels = lang === "en"
        ? ["Pension", "Health", "Long-term care", "Unemployment", "Insolvency levy", "U2 (maternity)"]
        : ["Retraite", "Maladie", "Dépendance", "Chômage", "Insolvenzgeldumlage", "U2 (maternité)"];

    const employeeValues = [
        deNum(row.employee_pension_monthly_eur),
        deNum(row.employee_health_monthly_eur),
        deNum(row.employee_care_monthly_eur),
        deNum(row.employee_unemployment_monthly_eur),
        0,
        0
    ];

    const employerValues = [
        deNum(row.employer_pension_monthly_eur),
        deNum(row.employer_health_monthly_eur),
        deNum(row.employer_care_monthly_eur),
        deNum(row.employer_unemployment_monthly_eur),
        deNum(row.employer_insolvency_levy_monthly_eur),
        deNum(row.employer_u2_levy_monthly_eur)
    ];

    const employeeLabel = lang === "en" ? "Employee" : "Salarié";
    const employerLabel = lang === "en" ? "Employer" : "Employeur";

    const traces = [
        {
            x: labels,
            y: employeeValues,
            name: employeeLabel,
            type: "bar",
            marker: {
                color: "rgba(249, 115, 22, 0.82)"
            },
            text: employeeValues.map(value => deEuro(value, lang)),
            textposition: "outside",
            cliponaxis: false,
            hovertemplate:
                "<b>%{x}</b><br>" +
                employeeLabel + ": %{y:,.0f} €" +
                "<extra></extra>"
        },
        {
            x: labels,
            y: employerValues,
            name: employerLabel,
            type: "bar",
            marker: {
                color: "rgba(37, 99, 235, 0.82)"
            },
            text: employerValues.map(value => deEuro(value, lang)),
            textposition: "outside",
            hovertemplate:
                "<b>%{x}</b><br>" +
                employerLabel + ": %{y:,.0f} €" +
                "<extra></extra>"
        }
    ];

    const t = getI18nText(lang);
    const layout = germanyBaseLayout(lang, t.y_amount);

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
            text: t.y_amount,
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

    germanyPlot("chart-germany-breakdown-" + lang, traces, layout);
}

function getGermanyDataSelectedProfile(lang) {
    const select = getI18nElement("germany-data-profile-select", lang);

    if (!select) {
        return getGermanySelectedProfile(lang);
    }

    return select.value;
}

function getGermanyDataProfileData(lang) {
    const profileId = getGermanyDataSelectedProfile(lang);

    return GERMANY_DATA
        .filter(row => row.profile_id === profileId)
        .sort((a, b) => deNum(a.smic_multiple) - deNum(b.smic_multiple));
}

function renderGermanyDataTable(lang) {
    const table = document.getElementById("germany-data-table-" + lang);
    const label = document.getElementById("germany-data-profile-label-" + lang);

    if (!table) {
        return;
    }

    const tbody = table.querySelector("tbody");

    if (!tbody) {
        return;
    }

    const data = getGermanyDataProfileData(lang);

    tbody.innerHTML = "";

    if (!data.length) {
        if (label) {
            label.textContent = lang === "en"
                ? "No data available for this profile."
                : "Aucune donnée disponible pour ce profil.";
        }

        return;
    }

    const firstRow = data[0];

    if (label) {
        label.textContent = lang === "en"
            ? (firstRow.profile_label_en || firstRow.profile_label_fr)
            : firstRow.profile_label_fr;
    }

    data.forEach(row => {
        const tr = document.createElement("tr");

        const regimeLabel = lang === "en"
            ? (row.employment_regime_label_en || row.employment_regime_label_fr)
            : row.employment_regime_label_fr;

        const cells = [
            deRatio(row.smic_multiple, lang),
            regimeLabel,
            deEuro(row.gross_monthly_eur, lang),
            deEuro(row.net_before_income_tax_monthly_eur, lang),
            deEuro(row.employer_cost_monthly_eur, lang),
            deEuro(row.employee_contributions_monthly_eur, lang),
            deEuro(row.employer_contributions_monthly_eur, lang),
            deEuro(row.social_wedge_monthly_eur, lang),
            dePct(row.employee_contribution_rate, lang),
            dePct(row.employer_contribution_rate, lang),
            deRatio(row.cost_to_net_ratio, lang)
        ];

        cells.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function renderGermany(lang) {
    renderGermanyMetrics(lang);
    renderGermanyCostChart(lang);
    renderGermanyContributionRateChart(lang);
    renderGermanyWedgeChart(lang);
    renderGermanyFiscalReturnChart(lang);
    renderGermanyDecompositionChart(lang);
    renderGermanyContributionBreakdownChart(lang);
    renderGermanyDataTable(lang);
}

function computeGermanyFlclIndicators(row) {
    const net = deNum(row.net_before_income_tax_monthly_eur);
    const employerCost = deNum(row.employer_cost_monthly_eur);

    const flclE = employerCost > 0 ? 100 * net / employerCost : 0;
    const flclB = 100 - flclE;

    return {
        flclE,
        flclB
    };
}

function renderGermanyFlclIndexCards(lang) {
    const t = getI18nText(lang);
    const data = getGermanyProfileData(lang);

    if (!data.length) {
        return;
    }

    const row = findGermanyClosestRow(data, 1.0);
    const indicators = computeGermanyFlclIndicators(row);

    setTextContentById("germany-flcl-e-value-" + lang, indicators.flclE.toFixed(1));
    setTextContentById("germany-flcl-b-value-" + lang, indicators.flclB.toFixed(1));

    setTextContentById("germany-flcl-e-caption-" + lang, indicators.flclE.toFixed(1) + " € " + t.flcl_e_desc);
    setTextContentById("germany-flcl-b-caption-" + lang, indicators.flclB.toFixed(1) + " % " + t.flcl_b_desc);
}

function renderGermanyFlclMarginalCards(lang) {
    const t = getI18nText(lang);
    const data = getGermanyProfileData(lang);

    if (!data.length) {
        return;
    }

    const marginalRows = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = deNum(data[i].net_before_income_tax_monthly_eur) - deNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = deNum(data[i].employer_cost_monthly_eur) - deNum(data[i - 1].employer_cost_monthly_eur);
        const deltaMultiple = deNum(data[i].smic_multiple) - deNum(data[i - 1].smic_multiple);

        if (deltaCost !== 0 && deltaMultiple !== 0) {
            const current = computeGermanyFlclIndicators(data[i]);
            const previous = computeGermanyFlclIndicators(data[i - 1]);

            marginalRows.push({
                smic_multiple: deNum(data[i].smic_multiple),
                transmission: deltaNet / deltaCost,
                capture: 1 - deltaNet / deltaCost,
                progressivity: (current.flclE - previous.flclE) / deltaMultiple
            });
        }
    }

    const rowAtOne = marginalRows.length ? findGermanyClosestRow(marginalRows, 1.0) : null;
    const oneRow = findGermanyClosestRow(data, 1.0);
    const threeRow = findGermanyClosestRow(data, 3.0);

    const support = (oneRow && threeRow)
        ? computeGermanyFlclIndicators(oneRow).flclE - computeGermanyFlclIndicators(threeRow).flclE
        : 0;

    setTextContentById("germany-flcl-transmission-value-" + lang, rowAtOne ? (rowAtOne.transmission * 100).toFixed(1) + "%" : "—");
    setTextContentById("germany-flcl-capture-value-" + lang, rowAtOne ? (rowAtOne.capture * 100).toFixed(1) + "%" : "—");
    setTextContentById("germany-flcl-progressivity-value-" + lang, rowAtOne ? rowAtOne.progressivity.toFixed(1) + " pts" : "—");
    setTextContentById("germany-flcl-support-value-" + lang, support.toFixed(1) + " pts");

    setTextContentById("germany-flcl-transmission-caption-" + lang, t.marginal_transmission_desc);
    setTextContentById("germany-flcl-capture-caption-" + lang, t.marginal_capture_desc);
    setTextContentById("germany-flcl-progressivity-caption-" + lang, t.implicit_progressivity_desc);
    setTextContentById("germany-flcl-support-caption-" + lang, t.low_wage_support_desc);
}

function renderGermanyFlclEChart(lang) {
    const t = getI18nText(lang);
    const data = getGermanyProfileData(lang);

    const traces = [
        {
            x: data.map(row => deNum(row.smic_multiple)),
            y: data.map(row => computeGermanyFlclIndicators(row).flclE),
            type: "scatter",
            mode: "lines",
            name: t.flcl_e,
            line: {
                color: GERMANY_COLORS.orange,
                width: 3
            }
        }
    ];

    let layout = germanyBaseLayout(lang, t.flcl_e);
    layout = addGermanyEmploymentZones(layout, lang);
    layout = addGermanyCeilingLines(layout);

    germanyPlot("chart-germany-flcl-e-" + lang, traces, layout);
}

function renderGermanyFlclMarginalChart(lang) {
    const t = getI18nText(lang);
    const data = getGermanyProfileData(lang);

    const x = [];
    const transmission = [];
    const capture = [];

    for (let i = 1; i < data.length; i++) {
        const deltaNet = deNum(data[i].net_before_income_tax_monthly_eur) - deNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaCost = deNum(data[i].employer_cost_monthly_eur) - deNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const transmissionRate = deltaNet / deltaCost;

        x.push(deNum(data[i].smic_multiple));
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
                color: GERMANY_COLORS.green,
                width: 3
            }
        },
        {
            x: x,
            y: capture,
            mode: "lines",
            name: t.marginal_capture,
            line: {
                color: GERMANY_COLORS.red,
                width: 3
            }
        }
    ];

    let layout = germanyBaseLayout(lang, "%");
    layout = addGermanyEmploymentZones(layout, lang);
    layout = addGermanyCeilingLines(layout);
    layout.yaxis.ticksuffix = "%";

    germanyPlot("chart-germany-flcl-marginal-" + lang, traces, layout);
}

function renderGermanyFlclProgressivityChart(lang) {
    const t = getI18nText(lang);
    const data = getGermanyProfileData(lang);

    const x = [];
    const progressivity = [];

    for (let i = 1; i < data.length; i++) {
        const current = computeGermanyFlclIndicators(data[i]);
        const previous = computeGermanyFlclIndicators(data[i - 1]);
        const deltaMultiple = deNum(data[i].smic_multiple) - deNum(data[i - 1].smic_multiple);

        if (deltaMultiple === 0) {
            continue;
        }

        x.push(deNum(data[i].smic_multiple));
        progressivity.push((current.flclE - previous.flclE) / deltaMultiple);
    }

    const traces = [
        {
            x: x,
            y: progressivity,
            mode: "lines",
            name: t.implicit_progressivity,
            line: {
                color: GERMANY_COLORS.purple,
                width: 3
            }
        }
    ];

    let layout = germanyBaseLayout(
        lang,
        lang === "en" ? "Lab-E points per minimum wage" : "Points de Lab-E par salaire minimum"
    );
    layout = addGermanyEmploymentZones(layout, lang);
    layout = addGermanyCeilingLines(layout);

    layout.shapes = (layout.shapes || []).concat([{
        type: "line",
        xref: "paper",
        yref: "y",
        x0: 0,
        x1: 1,
        y0: 0,
        y1: 0,
        line: {
            color: GERMANY_COLORS.gray,
            dash: "dash",
            width: 1.5
        }
    }]);

    germanyPlot("chart-germany-flcl-progressivity-" + lang, traces, layout);
}

function renderGermanyFlclMarginalDestinationChart(lang) {
    const data = getGermanyProfileData(lang);

    const x = [];
    const netShare = [];
    const employeeShare = [];
    const employerShare = [];

    for (let i = 1; i < data.length; i++) {
        const deltaCost = deNum(data[i].employer_cost_monthly_eur) - deNum(data[i - 1].employer_cost_monthly_eur);

        if (deltaCost === 0) {
            continue;
        }

        const deltaNet = deNum(data[i].net_before_income_tax_monthly_eur) - deNum(data[i - 1].net_before_income_tax_monthly_eur);
        const deltaEmployee = deNum(data[i].employee_contributions_monthly_eur) - deNum(data[i - 1].employee_contributions_monthly_eur);
        const deltaEmployer = deNum(data[i].employer_contributions_monthly_eur) - deNum(data[i - 1].employer_contributions_monthly_eur);

        x.push(deNum(data[i].smic_multiple));
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
                color: GERMANY_COLORS.orange,
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
                color: GERMANY_COLORS.teal,
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
                color: GERMANY_COLORS.blue,
                width: 2
            }
        }
    ];

    let layout = germanyBaseLayout(
        lang,
        lang === "en"
            ? "Marginal destination of one additional euro, %"
            : "Destination marginale d’un euro supplémentaire, %"
    );
    layout = addGermanyEmploymentZones(layout, lang);

    layout.yaxis.ticksuffix = "%";
    layout.yaxis.range = [0, 100];

    germanyPlot("chart-germany-flcl-destination-" + lang, traces, layout);
}

function renderGermanyFlclIndex(lang) {
    renderGermanyFlclIndexCards(lang);
    renderGermanyFlclMarginalCards(lang);
    renderGermanyFlclEChart(lang);
    renderGermanyFlclMarginalChart(lang);
    renderGermanyFlclProgressivityChart(lang);
    renderGermanyFlclMarginalDestinationChart(lang);
}

function germanyOnTabShow(lang, tabName) {
    if (tabName === "simulation") {
        renderGermany(lang);
    }

    if (tabName === "data") {
        renderGermanyDataTable(lang);
    }

    if (tabName === "flcl-index") {
        renderGermanyFlclIndex(lang);
    }
}

function showGermanyTab(lang, tabName) {
    showLangTab(lang, tabName, {
        tabStorageKey: GERMANY_TAB_STORAGE_KEY,
        onShow: germanyOnTabShow
    });
}

function switchGermanyLanguage() {
    switchLangLanguage({
        storageKey: GERMANY_LANGUAGE_STORAGE_KEY,
        tabStorageKey: GERMANY_TAB_STORAGE_KEY,
        onShow: germanyOnTabShow
    });
}

function setupGermanyEvents() {
    ["fr", "en"].forEach(function(lang) {
        const profileSelect = getI18nElement("germany-profile-select", lang);
        const waterfallSelect = getI18nElement("germany-waterfall-multiple", lang);
        const dataProfileSelect = getI18nElement("germany-data-profile-select", lang);
        const minijobZone = getI18nElement("germany-zone-minijob", lang);
        const midijobZone = getI18nElement("germany-zone-midijob", lang);
        const standardZone = getI18nElement("germany-zone-standard", lang);

        if (profileSelect) {
            profileSelect.addEventListener("change", function() {
                renderGermany(lang);
                renderGermanyFlclIndex(lang);
            });
        }

        if (waterfallSelect) {
            waterfallSelect.addEventListener("change", function() {
                renderGermanyDecompositionChart(lang);
            });
        }

        if (dataProfileSelect) {
            dataProfileSelect.addEventListener("change", function() {
                renderGermanyDataTable(lang);
            });
        }

        [minijobZone, midijobZone, standardZone].forEach(zoneCheckbox => {
            if (zoneCheckbox) {
                zoneCheckbox.addEventListener("change", function() {
                    renderGermanyCostChart(lang);
                    renderGermanyContributionRateChart(lang);
                    renderGermanyWedgeChart(lang);
                    renderGermanyFiscalReturnChart(lang);
                    renderGermanyFlclEChart(lang);
                    renderGermanyFlclMarginalChart(lang);
                    renderGermanyFlclProgressivityChart(lang);
                    renderGermanyFlclMarginalDestinationChart(lang);
                });
            }
        });
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

            setupGermanyEvents();

            const initialLang = localStorage.getItem(GERMANY_LANGUAGE_STORAGE_KEY) || "fr";
            setLangLanguage(initialLang, {
                storageKey: GERMANY_LANGUAGE_STORAGE_KEY,
                tabStorageKey: GERMANY_TAB_STORAGE_KEY,
                onShow: germanyOnTabShow
            });
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
