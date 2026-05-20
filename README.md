# French Labour Cost Lab

**French Labour Cost Lab** is an open-source research tool for simulating and visualizing labour costs in France.

It provides reproducible simulations of gross wages, net wages, employer costs, employer social contributions, employee social contributions, the RGDU 2026 contribution relief mechanism, social wedges, and marginal labour cost indicators.

The project is designed as a transparent economic dashboard rather than an official payroll calculator.

**Author:** Hugo Spring-Ragain, Economist, CEDS Paris

---

## Live dashboard

The interactive dashboard is available through GitHub Pages:

https://hugosragain.github.io/french-labour-cost-lab/

---

## Purpose

The purpose of this project is to make the structure of French labour costs easier to analyze, visualize and discuss.

The tool focuses on the gap between:

- the gross wage;
- the net wage received by the employee;
- the total cost paid by the employer;
- employer and employee social contributions;
- employer contribution reliefs, including RGDU 2026;
- the marginal cost of gross wage increases.

The dashboard is intended for applied economic analysis, policy discussion, teaching, and reproducible research.

---

## Calculation engine

The simulations are generated using the public **Mon-entreprise / URSSAF API**.

The project does not manually reproduce the French social contribution system. Instead, it queries the Mon-entreprise calculation engine over a grid of wage points and employee/employer scenarios.

The resulting dataset is then used to build a static interactive dashboard.

---

## Wage grid

The baseline wage grid is defined in `config/scenarios.yml`.

Current configuration:

- gross monthly SMIC: 1,801.80 euros;
- minimum wage point: 0.8 SMIC;
- maximum wage point: 3.5 SMIC;
- step: 0.01 SMIC.

This produces a fine wage grid suitable for visualizing non-linearities, discontinuities and marginal effects in the French labour cost schedule.

---

## Combinatorial profile system

The dashboard uses a combinatorial profile system defined in `config/profiles.yml`.

The user can combine three dimensions:

### 1. Employee status

- Non-executive employee;
- Executive employee.

### 2. Territorial regime

- Outside Alsace-Moselle;
- Alsace-Moselle.

### 3. AT/MP risk scenario

- Standard AT/MP;
- AT/MP 1%;
- AT/MP 4%;
- Support functions.

The profile selected in the dashboard is therefore not a fixed pre-written case, but a combination of economic and institutional assumptions.

---

## Indicators

The dashboard currently reports:

- gross monthly wage;
- net monthly wage;
- total employer cost;
- employee contributions;
- employer contributions;
- RGDU 2026 amount;
- social wedge;
- effective employer contribution rate;
- employer cost to net wage ratio;
- marginal employer-cost rate;
- marginal net retention rate.

The effective employer contribution rate should be interpreted as an apparent rate after contribution reliefs. It is computed as:

```text
net employer contributions / gross wage
```

It is not the gross statutory employer contribution schedule.

The marginal employer-cost rate is computed by finite difference:

```text
Δ employer cost / Δ gross wage
```

The marginal net retention rate is computed as:

```text
Δ net wage / Δ employer cost
```

---

## RGDU 2026

The dashboard includes a dedicated graph for the **RGDU 2026** employer contribution relief mechanism.

The RGDU is represented as a contribution relief component computed through the Mon-entreprise / URSSAF engine.

The graph can display the amount:

- monthly;
- annually;
- as a percentage of gross wage.

---

## Data output

The generated dataset is stored in:

```text
data/labour_cost_grid_mon_entreprise.csv
```

A public copy is also exported to:

```text
docs/data/labour_cost_grid_mon_entreprise.csv
```

This allows users to download the dataset directly from the dashboard.

---

## Project structure

```text
french-labour-cost-lab/
├── config/
│   ├── profiles.yml
│   └── scenarios.yml
├── data/
│   └── labour_cost_grid_mon_entreprise.csv
├── docs/
│   ├── index.html
│   ├── assets/
│   │   └── style.css
│   └── data/
│       └── labour_cost_grid_mon_entreprise.csv
├── scripts/
│   ├── build_dataset_mon_entreprise.py
│   ├── build_dashboard.py
│   ├── test_additional_profiles_mon_entreprise.py
│   └── test_atmp_profiles_mon_entreprise.py
├── requirements.txt
├── README.md
└── LICENSE
```

---

## Methodological limitations

The results should be interpreted as **reference simulations**, not as official payroll calculations.

The simulations may vary depending on:

- company size;
- collective agreements;
- precise AT/MP classification;
- sector-specific rules;
- executive status;
- territorial regimes;
- exemptions;
- contribution regimes;
- future changes in the Mon-entreprise / URSSAF rules.

The AT/MP scenarios are risk-rate scenarios. They should not be interpreted as exact occupations or sectors.

The “support functions” scenario relies on a Mon-entreprise rule flagged as experimental by the API.

---

## License

This project is released under the license specified in the `LICENSE` file.

---

## Citation

If you use this project, please cite it as:

```text
Spring-Ragain, Hugo. French Labour Cost Lab. Open-source research dashboard, 2026.
```