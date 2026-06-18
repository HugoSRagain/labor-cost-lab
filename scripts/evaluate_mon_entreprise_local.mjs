const originalWarn = console.warn;
console.warn = () => {};

const { default: Engine } = await import("publicodes");
const { default: rules } = await import("modele-social");

const input = JSON.parse(process.argv[2]);

const engine = new Engine(rules);

engine.setSituation(input.situation || {});

const output = {
    evaluate: {},
    missingVariables: {},
    warnings: {}
};

for (const expression of input.expressions || []) {
    try {
        const result = engine.evaluate(expression);

        output.evaluate[expression] = {
            nodeValue: result.nodeValue ?? null,
            unit: result.unit ?? null
        };
    } catch (error) {
        output.evaluate[expression] = {
            nodeValue: null,
            unit: null,
            error: String(error.message || error)
        };
    }
}

console.log(JSON.stringify(output));