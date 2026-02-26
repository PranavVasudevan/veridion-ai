/**
 * Generates Monte Carlo paths using Geometric Brownian Motion (GBM).
 * 
 * Formula: V(t+1) = V(t) * exp((μ − 0.5σ²)dt + σ√dt * Z)
 * 
 * @param initialValue - Starting portfolio value
 * @param expectedReturn - Annual drift (μ)
 * @param volatility - Annual volatility (σ)
 * @param years - Simulation duration in years
 * @param numSimulations - Number of simulation paths to generate (e.g., 5000)
 * @returns 2D array of simulation paths [simulationIdx][stepIdx]
 */
export function generateMonteCarloPaths(
  initialValue: number,
  expectedReturn: number,
  volatility: number,
  years: number,
  numSimulations: number
): number[][] {
  const dt = 1 / 252;
  const steps = Math.ceil(years * 252);
  const drift = (expectedReturn - 0.5 * Math.pow(volatility, 2)) * dt;
  const volSqDt = volatility * Math.sqrt(dt);

  const paths: number[][] = [];

  for (let s = 0; s < numSimulations; s++) {
    const path: number[] = [initialValue];
    let currentValue = initialValue;

    for (let t = 0; t < steps; t++) {
      const z = generateGaussian();
      currentValue = currentValue * Math.exp(drift + volSqDt * z);
      path.push(currentValue);
    }
    paths.push(path);
  }

  return paths;
}

/**
 * Generates a standard normal random variable Z ~ N(0,1) using Box-Muller transform.
 */
function generateGaussian(): number {
  let u = 0;
  let v = 0;
  // Convert [0,1) to (0,1) to avoid log(0)
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
