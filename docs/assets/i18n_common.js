/*
Shared FR/EN i18n helpers, generalized from the France module's pattern
(docs/assets/app.js: TEXT / getText / getElement / getActiveLanguage).

Every non-France module (Belgium, Germany, Switzerland, Netherlands,
Comparison, and future modules) includes this file and reuses:
  - I18N_TEXT.fr / I18N_TEXT.en for cross-module common labels
  - getI18nText(lang), getI18nElement(id, lang), getActiveI18nLanguage(modulePrefix)
  - setupLanguageToggle / showLangTab / restoreLangTab for the tab + language
    orchestration, instead of every module re-deriving its own.
*/

const I18N_TEXT = {
    fr: {
        gross_wage: "Salaire brut",
        net_wage: "Salaire net",
        net_before_tax: "Net avant impôt",
        net_after_tax: "Net après impôt",
        employer_cost: "Coût employeur",
        employer_contrib: "Cotisations employeur",
        employee_contrib: "Cotisations salarié",
        social_wedge: "Coin social",
        total_wedge: "Coin socio-fiscal",
        cost_net_ratio: "Ratio coût / net",
        employer_rate: "Taux employeur",
        employee_rate: "Taux salarié",
        effective_rate: "Taux effectif",
        x_axis_minimum_wage: "Multiple du salaire minimum",
        y_amount: "Montant mensuel, euros",
        y_rate: "Taux",
        tab_simulation: "Simulation",
        tab_data: "Données",
        tab_methodology: "Méthodologie",
        tab_comparison: "Comparaison",
        tab_flcl_index: "Indice du Lab",
        status_available: "Disponible",
        status_prototype: "Prototype",
        download_dataset: "Télécharger le jeu de données",
        download_parameters: "Télécharger les paramètres 2026",
        download_sources: "Télécharger les sources 2026",
        flcl_index_title: "Indice du Lab",
        flcl_index_subtitle: "Indicateurs d’efficacité salariale du coût du travail.",
        flcl_e: "Lab-E",
        flcl_b: "Lab-B",
        flcl_r: "Lab-R",
        flcl_e_desc: "de salaire net pour 100 de coût employeur",
        flcl_b_desc: "du coût du travail absorbé par les prélèvements",
        flcl_r_desc: "points d’efficacité créés par l’allègement employeur ciblé",
        marginal_transmission: "Transmission marginale",
        marginal_capture: "Captation marginale",
        implicit_progressivity: "Progressivité implicite",
        low_wage_support: "Soutien bas salaires",
        marginal_transmission_desc: "Part d’une unité supplémentaire de coût employeur allant au salarié net.",
        marginal_capture_desc: "Part d’une unité supplémentaire captée par le système socio-fiscal.",
        implicit_progressivity_desc: "Variation locale de Lab-E autour de 1× le salaire de référence.",
        low_wage_support_desc: "Écart Lab-E entre 1× et 3× le salaire de référence.",
        flcl_e_chart_title: "Indice du Lab",
        flcl_e_chart_subtitle: "Lab-E = 100 × salaire net avant impôt / coût employeur.",
        flcl_r_chart_title: "Lab-R",
        flcl_r_chart_subtitle: "Effet de l’allègement employeur ciblé sur l’efficacité salariale.",
        marginal_chart_title: "Transmission marginale",
        marginal_chart_subtitle: "Part d’une unité supplémentaire de coût employeur allant au salarié net.",
        progressivity_chart_title: "Progressivité implicite",
        progressivity_chart_subtitle: "Variation de Lab-E lorsque le niveau de salaire augmente.",
        marginal_destination_chart_title: "Destination marginale d’une unité supplémentaire de coût employeur",
        marginal_destination_chart_subtitle: "Répartition marginale entre salaire net, cotisations salarié et cotisations employeur.",
        no_flcl_r_note: "Aucun allègement employeur ciblé et dégressif n’est modélisé pour ce pays : l’indicateur Lab-R ne s’applique donc pas ici."
    },
    en: {
        gross_wage: "Gross wage",
        net_wage: "Net wage",
        net_before_tax: "Net before tax",
        net_after_tax: "Net after tax",
        employer_cost: "Employer cost",
        employer_contrib: "Employer contributions",
        employee_contrib: "Employee contributions",
        social_wedge: "Social wedge",
        total_wedge: "Total socio-fiscal wedge",
        cost_net_ratio: "Cost-to-net ratio",
        employer_rate: "Employer rate",
        employee_rate: "Employee rate",
        effective_rate: "Effective rate",
        x_axis_minimum_wage: "Multiple of the minimum wage",
        y_amount: "Monthly amount, euros",
        y_rate: "Rate",
        tab_simulation: "Simulation",
        tab_data: "Data",
        tab_methodology: "Methodology",
        tab_comparison: "Comparison",
        tab_flcl_index: "Lab Index",
        status_available: "Available",
        status_prototype: "Prototype",
        download_dataset: "Download the dataset",
        download_parameters: "Download the 2026 parameters",
        download_sources: "Download the 2026 sources",
        flcl_index_title: "Lab Index",
        flcl_index_subtitle: "Labour cost efficiency indicators.",
        flcl_e: "Lab-E",
        flcl_b: "Lab-B",
        flcl_r: "Lab-R",
        flcl_e_desc: "of net wage for 100 of employer cost",
        flcl_b_desc: "of labour cost absorbed by contributions",
        flcl_r_desc: "efficiency points created by the targeted employer relief",
        marginal_transmission: "Marginal transmission",
        marginal_capture: "Marginal capture",
        implicit_progressivity: "Implicit progressivity",
        low_wage_support: "Low-wage support",
        marginal_transmission_desc: "Share of one additional unit of employer cost reaching net wage.",
        marginal_capture_desc: "Share of one additional unit captured by the socio-fiscal system.",
        implicit_progressivity_desc: "Local change in Lab-E around 1x the reference wage.",
        low_wage_support_desc: "Lab-E gap between 1x and 3x the reference wage.",
        flcl_e_chart_title: "Lab Index",
        flcl_e_chart_subtitle: "Lab-E = 100 x net wage before income tax / employer cost.",
        flcl_r_chart_title: "Lab-R",
        flcl_r_chart_subtitle: "Effect of the targeted employer relief on wage efficiency.",
        marginal_chart_title: "Marginal transmission",
        marginal_chart_subtitle: "Share of one additional unit of employer cost reaching net wage.",
        progressivity_chart_title: "Implicit progressivity",
        progressivity_chart_subtitle: "Change in Lab-E when the wage level increases.",
        marginal_destination_chart_title: "Marginal destination of one additional unit of employer cost",
        marginal_destination_chart_subtitle: "Marginal split between net wage, employee contributions and employer contributions.",
        no_flcl_r_note: "No targeted, degressive employer relief is modeled for this country: the Lab-R indicator does not apply here."
    }
};


function getI18nText(lang) {
    return I18N_TEXT[lang] || I18N_TEXT.fr;
}


function getI18nElement(id, lang) {
    return document.getElementById(id + "-" + lang);
}


function getActiveI18nLanguage(storageKey) {
    const activeSection = document.querySelector(".language-section.active");

    if (activeSection && activeSection.id === "section-en") {
        return "en";
    }

    if (activeSection && activeSection.id === "section-fr") {
        return "fr";
    }

    return localStorage.getItem(storageKey) || "fr";
}


/*
Generic tab switcher, mirroring France's showTab(lang, tabName): scopes to
the given language's #section-<lang>, toggles .tab-button/.tab-panel
active classes, persists the choice, and calls renderFn(lang) if provided
(so chart-bearing tabs re-render after becoming visible).
*/
function showLangTab(lang, tabName, options) {
    options = options || {};

    const section = document.getElementById("section-" + lang);

    if (!section) {
        return;
    }

    section.querySelectorAll(".tab-button").forEach(function(button) {
        button.classList.toggle("active", button.dataset.tab === tabName);
    });

    section.querySelectorAll(".tab-panel, .tab-content").forEach(function(panel) {
        panel.classList.toggle(
            "active",
            panel.id === "tab-" + lang + "-" + tabName
        );
    });

    if (options.tabStorageKey) {
        localStorage.setItem(options.tabStorageKey + "_" + lang, tabName);
    }

    if (typeof options.onShow === "function") {
        setTimeout(function() {
            options.onShow(lang, tabName);
        }, 80);
    }
}


function restoreLangTab(lang, options) {
    options = options || {};

    const savedTab = options.tabStorageKey
        ? (localStorage.getItem(options.tabStorageKey + "_" + lang) || "simulation")
        : "simulation";

    showLangTab(lang, savedTab, options);
}


/*
Generic language switcher: toggles which #section-<lang> is visible,
persists the choice, and re-renders the now-active tab. `options.onShow`
should be the module's own render-dispatch function (lang, tabName) => void.
*/
function setLangLanguage(lang, options) {
    options = options || {};

    const enSection = document.getElementById("section-en");
    const frSection = document.getElementById("section-fr");

    if (!enSection || !frSection) {
        console.error("Language sections not found.");
        return;
    }

    enSection.classList.toggle("active", lang === "en");
    frSection.classList.toggle("active", lang === "fr");
    document.documentElement.lang = lang;

    if (options.storageKey) {
        localStorage.setItem(options.storageKey, lang);
    }

    restoreLangTab(lang, options);
}


function switchLangLanguage(options) {
    options = options || {};

    const current = options.storageKey
        ? (localStorage.getItem(options.storageKey) || "fr")
        : "fr";

    setLangLanguage(current === "fr" ? "en" : "fr", options);
}
