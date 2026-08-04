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
        status_available: "Disponible",
        status_prototype: "Prototype",
        download_dataset: "Télécharger le jeu de données",
        download_parameters: "Télécharger les paramètres 2026",
        download_sources: "Télécharger les sources 2026"
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
        status_available: "Available",
        status_prototype: "Prototype",
        download_dataset: "Download the dataset",
        download_parameters: "Download the 2026 parameters",
        download_sources: "Download the 2026 sources"
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
