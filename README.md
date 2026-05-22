# French Labour Cost Lab

**French Labour Cost Lab** is an open-source dashboard for simulating labour costs, employer social contributions, contribution reliefs and socio-fiscal marginal returns in France.

The project provides a public simulation grid based on the **Mon-entreprise / URSSAF** calculation engine. It visualizes how gross wage, net wage, total employer cost, employee contributions, employer contributions, contribution reliefs and socio-fiscal incentives vary along the wage scale.

Public dashboard:  
https://hugosragain.github.io/french-labour-cost-lab/

A methodological working paper is available directly in the dashboard, under the **Working Paper** tab.

---

## 1. Purpose

The purpose of the project is to make the structure of French labour costs easier to understand, visualize and discuss.

The dashboard is designed to answer questions such as:

- How does total employer cost evolve as a function of gross wage?
- How large are employer contribution reliefs close to the SMIC?
- How does the RGDU 2026 relief modify the effective employer contribution rate?
- What is the gap between employer cost and employee net wage?
- How much of an additional euro of gross wage is transformed into disposable income once employee contributions, estimated income tax and estimated in-work benefits are taken into account?
- How do labour cost profiles differ by employee status, territorial regime and AT/MP scenario?

The project is intended as a public research and policy-analysis tool. It is not an official payroll calculator and does not replace official tax or CAF simulators.

---

## 2. Main features

The dashboard includes:

- simulation of gross wage, net wage and total employer cost;
- effective employer contribution rates after reliefs;
- RGDU 2026 contribution relief amount and rate;
- social wedge indicators;
- employer cost-to-net-wage ratio;
- marginal employer cost of gross wage increases;
- total social levy rate;
- socio-fiscal return of a gross wage increase;
- employer cost decomposition at selected wage points;
- profile comparisons;
- downloadable CSV data;
- internal consistency checks;
- integrated methodological working paper.

---

## 3. Simulation scope

The current version uses the following wage grid:

| Parameter | Value |
|---|---:|
| Gross monthly SMIC reference | 1,801.80 euros |
| Minimum wage point | 0.8 SMIC |
| Maximum wage point | 3.5 SMIC |
| Step | 0.01 SMIC |
| Number of wage points | 271 |

The simulation covers a set of profiles combining:

| Dimension | Modalities |
|---|---|
| Employee status | Non-executive / Executive |
| Territorial regime | Standard / Alsace-Moselle |
| AT/MP scenario | Standard / 1% / 4% / Support functions |

This yields 16 profiles and 4,336 simulated observations.

---

## 4. Data source and calculation engine

Core labour-cost calculations are generated from the public **Mon-entreprise / URSSAF** calculation engine.

The project does not manually reproduce all French social contribution rules. Instead, it uses the public engine as the source for payroll contribution calculations and then constructs derived indicators, visualizations and consistency checks from the simulated data.

---

## 5. Key indicators

### Gross wage

Contractual monthly gross wage before employee social contributions.

### Net wage

Employee wage after employee social contributions.

\[
w_{net} = w_{gross} - Contributions_{employee}
\]

### Total employer cost

Total labour cost borne by the employer.

\[
C_{employer} = w_{gross} + Contributions_{employer}^{net}
\]

### Employer contributions after reliefs

Employer-side social contributions after deduction of contribution reliefs.

### RGDU 2026 relief

Estimated employer contribution relief returned by the calculation engine.

### Social wedge

Difference between total employer cost and employee net wage.

\[
Social\ wedge = C_{employer} - w_{net}
\]

### Employer cost-to-net-wage ratio

\[
Ratio = \frac{C_{employer}}{w_{net}}
\]

This indicator measures how many euros the employer pays for one euro of net wage received by the employee.

### Marginal employer cost

Computed by finite differences along the wage grid:

\[
\frac{\Delta C_{employer}}{\Delta w_{gross}}
\]

### Socio-fiscal return of a gross wage increase

The dashboard estimates the share of one additional euro of gross wage that becomes disposable income for a reference profile.

The reference disposable income is approximated as:

\[
Y^{sf} = 12w_{net} - IR^{est} + PA^{est}
\]

where:

- \(IR^{est}\) is estimated annual personal income tax;
- \(PA^{est}\) is estimated annual prime d’activité;
- the reference profile is a single individual, one tax unit, no children, no other income and no housing benefit.

The socio-fiscal return is:

\[
R^{sf} = \frac{\Delta Y^{sf}/12}{\Delta w_{gross}}
\]

This module is indicative and does not replace official tax or CAF simulations.

---

## 6. Reference socio-fiscal scenario

The socio-fiscal module uses a stylized reference case:

- single individual;
- one tax unit;
- no children;
- no other income;
- no housing benefit;
- no tax credits or reductions;
- standard 10% professional-expense allowance;
- 2026 personal income tax schedule applied to 2025 income;
- decote and low-tax recovery threshold included;
- estimated prime d’activité for a single person.

The purpose is not to produce an official household-level tax-benefit calculation, but to illustrate the marginal interaction between wages, employee contributions, estimated income tax and estimated in-work benefits.

---

## 7. Internal consistency checks

The dashboard reports internal consistency checks across the simulated dataset.

The main identities checked are:

\[
w_{net} = w_{gross} - Contributions_{employee}
\]

\[
C_{employer} = w_{gross} + Contributions_{employer}^{net}
\]

\[
C_{employer} - w_{net}
=
Contributions_{employer}^{net}
+
Contributions_{employee}
\]

\[
Ratio = \frac{C_{employer}}{w_{net}}
\]

\[
RGDU\ rate = \frac{RGDU}{w_{gross}}
\]

These checks validate the internal coherence of the simulated dataset. They do not constitute external validation against payroll records.

---

## 8. Dashboard structure

The public dashboard includes five tabs.

### Simulation

Main dashboard for a selected profile. It displays labour-cost indicators, contribution reliefs, marginal cost measures and the socio-fiscal return graph.

### Comparisons

Profile comparison charts by employee status and AT/MP scenario.

### Data

Downloadable CSV dataset and interactive data table.

### Methodology

Source, assumptions, internal consistency checks and methodological limitations.

### Working Paper

Embedded methodological working paper documenting the project.

---

## 9. Methodological limitations

The French Labour Cost Lab should be interpreted as an institutional simulation tool, not as a complete behavioural or administrative model.

Main limitations:

- it is not an official payroll calculator;
- results depend on the Mon-entreprise / URSSAF calculation engine;
- the AT/MP scenarios are parametric risk-rate scenarios;
- the support-functions scenario should be interpreted with caution;
- collective agreements and firm-specific regimes are not fully modelled;
- no behavioural response is estimated;
- no economic incidence or employment effect is estimated;
- the socio-fiscal module is restricted to a reference profile;
- the estimated prime d’activité is not an official CAF calculation;
- the estimated income tax is not an official tax assessment.

---

## 10. Project structure

```text
french-labour-cost-lab/
│
├── scripts/
│   └── build_dashboard.py
│
├── docs/
│   ├── index.html
│   ├── assets/
│   │   ├── app.js
│   │   ├── style.css
│   │   └── french_labour_cost_lab_working_paper.pdf
│   └── data/
│       └── labour_cost_grid_mon_entreprise.csv
│
└── README.md
```

---

## 11. Suggested citation

```text
Spring-Ragain, H. (2026). French Labour Cost Lab: an open-source dashboard for simulating labour costs, contribution reliefs and socio-fiscal marginal returns in France.
```

BibTeX:

```bibtex
@misc{springragain2026frenchlabourcostlab,
  author       = {Spring-Ragain, Hugo},
  title        = {French Labour Cost Lab: An Open-Source Dashboard for Simulating Labour Costs, Contribution Reliefs and Socio-Fiscal Marginal Returns in France},
  year         = {2026},
  howpublished = {\url{https://hugosragain.github.io/french-labour-cost-lab/}},
  note         = {Open-source research dashboard and methodological working paper}
}
```

---

## 12. Disclaimer

This project is an open-source research and policy-analysis tool.

It does not represent the official position of any institution. It does not replace official payroll, tax or social-benefit simulators. All results should be interpreted as institutional simulations under documented assumptions.

All errors remain the author’s own.
