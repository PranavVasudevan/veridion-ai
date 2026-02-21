import { generateMonteCarloPaths } from "./path-generator";

/**
 * Standalone demonstration of the Monte Carlo simulation logic.
 */
async function runDemo() {
    console.log("🚀 Starting Monte Carlo Simulation Demo...\n");

    // Sample Inputs
    const initialValue = 100000;    // $100,000
    const sharpeRatio = 0.5;
    const volatility = 0.15;        // 15% annual volatility
    const years = 10;               // 10-year horizon
    const numSimulations = 5000;
    const targetAmount = 250000;    // Target: $250,000

    const expectedReturn = sharpeRatio * volatility;

    console.log("--- Simulation Parameters ---");
    console.log(`Initial Portfolio Value: $${initialValue.toLocaleString()}`);
    console.log(`Expected Annual Return: ${(expectedReturn * 100).toFixed(2)}%`);
    console.log(`Annual Volatility: ${(volatility * 100).toFixed(2)}%`);
    console.log(`Time Horizon: ${years} years`);
    console.log(`Number of Simulations: ${numSimulations}`);
    console.log(`Target Goal Amount: $${targetAmount.toLocaleString()}\n`);

    // 1. Generate Paths
    console.log("⏳ Running simulations...");
    const startTime = Date.now();
    const paths = generateMonteCarloPaths(
        initialValue,
        expectedReturn,
        volatility,
        years,
        numSimulations
    );
    const endTime = Date.now();
    console.log(`✅ Simulations complete in ${endTime - startTime}ms\n`);

    // 2. Extract Final Values and Sort
    const finalValues = paths.map(path => path[path.length - 1]);
    finalValues.sort((a, b) => a - b);

    // 3. Compute Metrics
    const goalSuccessCount = finalValues.filter(v => v >= targetAmount).length;
    const goalProbability = (goalSuccessCount / numSimulations) * 100;
    const medianProjection = finalValues[Math.floor(numSimulations * 0.5)];
    const worstCaseProjection = finalValues[Math.floor(numSimulations * 0.1)];
    const bestCaseProjection = finalValues[Math.floor(numSimulations * 0.9)];

    // 4. Output Results
    console.log("--- Simulation Results ---");
    console.log(`Goal Success Probability: ${goalProbability.toFixed(2)}%`);
    console.log(`Worst Case (10th Percentile): $${worstCaseProjection.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    console.log(`Median Case (50th Percentile): $${medianProjection.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    console.log(`Best Case (90th Percentile): $${bestCaseProjection.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

    console.log("\n📈 Analysis:");
    if (goalProbability > 70) {
        console.log("Status: HIGH probability of reaching the goal. Stay the course.");
    } else if (goalProbability > 40) {
        console.log("Status: MODERATE probability. Consider increasing contributions or adjusting risk.");
    } else {
        console.log("Status: LOW probability. Significant changes to strategy or expectations may be needed.");
    }
}

runDemo().catch(err => {
    console.error("❌ Simulation failed:", err);
});
