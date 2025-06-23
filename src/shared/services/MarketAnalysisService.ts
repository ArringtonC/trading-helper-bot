// Placeholder - we'll need a JS equivalent
// Define the possible volatility regimes
export enum VolatilityRegime {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  UNKNOWN = 'Unknown', // For cases with insufficient data
}
// Define the input data structure (assuming daily prices)
interface PriceData {
  date: Date;
  price: number;
}
// Configuration for the calculation
interface RegimeConfig {
  windowSize: number; // e.g., 20 for 20-day rolling volatility
  lowThreshold: number; // Annualized vol percentile or value
  highThreshold: number; // Annualized vol percentile or value
}
/**
 * Calculates the log returns for a series of price data.
 */
function calculateLogReturns(prices: PriceData[]): number[] {
  if (prices.length < 2) {
    return [];
  }
  const logReturns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i-1].price > 0 && prices[i].price > 0) {
      logReturns.push(Math.log(prices[i].price / prices[i-1].price));
    } else {
      // Handle potential zero or negative prices if necessary
      logReturns.push(0);
    }
  }
  return logReturns;
}
/**
 * Calculates the rolling standard deviation of a numerical series.
 * Note: This is a basic implementation. A library might be more efficient.
 */
function calculateRollingStdDev(data: number[], windowSize: number): number[] {
  if (data.length < windowSize) {
    return Array(data.length).fill(NaN); // Not enough data for the window
  }
  const rollingStdDev: number[] = Array(windowSize - 1).fill(NaN); // Fill initial NaNs
  for (let i = windowSize; i <= data.length; i++) {
    const window = data.slice(i - windowSize, i);
    const mean = window.reduce((sum, val) => sum + val, 0) / windowSize;
    const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowSize; // Use population variance N
    rollingStdDev.push(Math.sqrt(variance));
  }
  return rollingStdDev;
}
/**
 * Calculates the current volatility regime based on historical prices.
 * Uses rolling standard deviation of log returns and dynamic percentile thresholds.
 */
export function calculateCurrentVolatilityRegime(
  prices: PriceData[],
  config: { windowSize: number; lowPercentile: number; highPercentile: number; minDataForPercentile: number } =
    { windowSize: 20, lowPercentile: 25, highPercentile: 75, minDataForPercentile: 30 } // Default config using percentiles
): VolatilityRegime {
  if (prices.length < config.windowSize + 1) {
    return VolatilityRegime.UNKNOWN;
  }
  // 1. Calculate Log Returns for the entire series
  const logReturns = calculateLogReturns(prices);
  if (logReturns.length < config.windowSize) {
     return VolatilityRegime.UNKNOWN;
  }
  // PATCH: If all log returns are zero, volatility is zero, regime is UNKNOWN
  if (logReturns.every(r => r === 0)) {
    return VolatilityRegime.UNKNOWN;
  }
  // 2. Calculate Rolling Standard Deviation for the entire series
  const rollingStdDev = calculateRollingStdDev(logReturns, config.windowSize);
  // 3. Annualize all standard deviations
  const annualizedVols = rollingStdDev.map(stdDev => stdDev * Math.sqrt(252));
  // Filter out invalid numbers for percentile calculation and get the latest valid one
  const validAnnualizedVols = annualizedVols.filter(vol => !isNaN(vol) && isFinite(vol));
  const latestAnnualizedVol = validAnnualizedVols[validAnnualizedVols.length - 1]; // Get the most recent valid vol
  if (latestAnnualizedVol === undefined) { // Check if latest is valid
    return VolatilityRegime.UNKNOWN;
  }
  // 4. Determine Thresholds (Dynamic or Fallback)
  let lowThreshold: number;
  let highThreshold: number;
  if (validAnnualizedVols.length >= config.minDataForPercentile) {
    const percentiles = calculatePercentiles(validAnnualizedVols, [config.lowPercentile, config.highPercentile]);
    lowThreshold = percentiles[0];
    highThreshold = percentiles[1];
  } else {
    // Fallback to fixed thresholds if not enough data for percentiles
    // These fixed values might need adjustment based on typical market conditions
    lowThreshold = 0.15; // Example fixed fallback
    highThreshold = 0.30; // Example fixed fallback
    console.warn(`Not enough historical volatility data (${validAnnualizedVols.length}) for percentile calculation. Falling back to fixed thresholds.`);
  }
  // 5. Determine Regime based on the latest volatility and calculated thresholds
  if (latestAnnualizedVol < lowThreshold) {
    return VolatilityRegime.LOW;
  } else if (latestAnnualizedVol > highThreshold) {
    return VolatilityRegime.HIGH;
  } else if (latestAnnualizedVol === lowThreshold || latestAnnualizedVol === highThreshold) {
    return VolatilityRegime.MEDIUM;
  } else {
    return VolatilityRegime.MEDIUM;
  }
  // Fallback in case of unexpected input
  return VolatilityRegime.UNKNOWN;
}
// --- Placeholder for future HMM integration ---
// export async function getHmmRegimePrediction(data: any): Promise<any> {
//   // TODO: Implement API call to Python HMM service
//   // const response = await fetch('http://localhost:5000/predict', { // Example endpoint
//   //   method: 'POST',
//   //   headers: { 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({ features: data })
//   // });
//   // if (!response.ok) {
//   //   throw new Error('Failed to get HMM prediction');
//   // }
//   // return response.json();
//    return Promise.resolve({ regime: 'Not Implemented', probabilities: {} });
// }
// --- Potential Helper for Percentile Thresholds ---
function calculatePercentiles(data: number[], percentiles: number[]): number[] {
  const sortedData = [...data].sort((a, b) => a - b);
  const results: number[] = [];
  for (const p of percentiles) {
    const index = (p / 100) * (sortedData.length - 1);
    if (Number.isInteger(index)) {
      results.push(sortedData[index]);
    } else {
      // Linear interpolation
      const lowerIndex = Math.floor(index);
      const upperIndex = Math.ceil(index);
      // Ensure indices are within bounds
      if (lowerIndex < 0 || upperIndex >= sortedData.length) {
        // Handle edge case: not enough data for interpolation, return NaN or edge value
        results.push(NaN);
        continue;
      }
      const weight = index - lowerIndex;
      results.push(sortedData[lowerIndex] * (1 - weight) + sortedData[upperIndex] * weight);
    }
  }
  return results;
}