// Placeholder - we'll need a JS equivalent
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// Define the possible volatility regimes
export var VolatilityRegime;
(function (VolatilityRegime) {
    VolatilityRegime["LOW"] = "Low";
    VolatilityRegime["MEDIUM"] = "Medium";
    VolatilityRegime["HIGH"] = "High";
    VolatilityRegime["UNKNOWN"] = "Unknown";
})(VolatilityRegime || (VolatilityRegime = {}));
/**
 * Calculates the log returns for a series of price data.
 */
function calculateLogReturns(prices) {
    if (prices.length < 2) {
        return [];
    }
    var logReturns = [];
    for (var i = 1; i < prices.length; i++) {
        if (prices[i - 1].price > 0 && prices[i].price > 0) {
            logReturns.push(Math.log(prices[i].price / prices[i - 1].price));
        }
        else {
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
function calculateRollingStdDev(data, windowSize) {
    if (data.length < windowSize) {
        return Array(data.length).fill(NaN); // Not enough data for the window
    }
    var rollingStdDev = Array(windowSize - 1).fill(NaN); // Fill initial NaNs
    var _loop_1 = function (i) {
        var window_1 = data.slice(i - windowSize, i);
        var mean = window_1.reduce(function (sum, val) { return sum + val; }, 0) / windowSize;
        var variance = window_1.reduce(function (sum, val) { return sum + Math.pow(val - mean, 2); }, 0) / windowSize; // Use population variance N
        rollingStdDev.push(Math.sqrt(variance));
    };
    for (var i = windowSize; i <= data.length; i++) {
        _loop_1(i);
    }
    return rollingStdDev;
}
/**
 * Calculates the current volatility regime based on historical prices.
 * Uses rolling standard deviation of log returns and dynamic percentile thresholds.
 */
export function calculateCurrentVolatilityRegime(prices, config // Default config using percentiles
) {
    if (config === void 0) { config = { windowSize: 20, lowPercentile: 25, highPercentile: 75, minDataForPercentile: 30 }; }
    if (prices.length < config.windowSize + 1) {
        return VolatilityRegime.UNKNOWN;
    }
    // 1. Calculate Log Returns for the entire series
    var logReturns = calculateLogReturns(prices);
    if (logReturns.length < config.windowSize) {
        return VolatilityRegime.UNKNOWN;
    }
    // 2. Calculate Rolling Standard Deviation for the entire series
    var rollingStdDev = calculateRollingStdDev(logReturns, config.windowSize);
    // 3. Annualize all standard deviations
    var annualizedVols = rollingStdDev.map(function (stdDev) { return stdDev * Math.sqrt(252); });
    // Filter out invalid numbers for percentile calculation and get the latest valid one
    var validAnnualizedVols = annualizedVols.filter(function (vol) { return !isNaN(vol) && isFinite(vol); });
    var latestAnnualizedVol = validAnnualizedVols[validAnnualizedVols.length - 1]; // Get the most recent valid vol
    if (latestAnnualizedVol === undefined) { // Check if latest is valid
        return VolatilityRegime.UNKNOWN;
    }
    // 4. Determine Thresholds (Dynamic or Fallback)
    var lowThreshold;
    var highThreshold;
    if (validAnnualizedVols.length >= config.minDataForPercentile) {
        var percentiles = calculatePercentiles(validAnnualizedVols, [config.lowPercentile, config.highPercentile]);
        lowThreshold = percentiles[0];
        highThreshold = percentiles[1];
    }
    else {
        // Fallback to fixed thresholds if not enough data for percentiles
        // These fixed values might need adjustment based on typical market conditions
        lowThreshold = 0.15; // Example fixed fallback
        highThreshold = 0.30; // Example fixed fallback
        console.warn("Not enough historical volatility data (".concat(validAnnualizedVols.length, ") for percentile calculation. Falling back to fixed thresholds."));
    }
    // 5. Determine Regime based on the latest volatility and calculated thresholds
    if (latestAnnualizedVol < lowThreshold) {
        return VolatilityRegime.LOW;
    }
    else if (latestAnnualizedVol > highThreshold) {
        return VolatilityRegime.HIGH;
    }
    else {
        return VolatilityRegime.MEDIUM;
    }
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
function calculatePercentiles(data, percentiles) {
    var sortedData = __spreadArray([], data, true).sort(function (a, b) { return a - b; });
    var results = [];
    for (var _i = 0, percentiles_1 = percentiles; _i < percentiles_1.length; _i++) {
        var p = percentiles_1[_i];
        var index = (p / 100) * (sortedData.length - 1);
        if (Number.isInteger(index)) {
            results.push(sortedData[index]);
        }
        else {
            // Linear interpolation
            var lowerIndex = Math.floor(index);
            var upperIndex = Math.ceil(index);
            // Ensure indices are within bounds
            if (lowerIndex < 0 || upperIndex >= sortedData.length) {
                // Handle edge case: not enough data for interpolation, return NaN or edge value
                results.push(NaN);
                continue;
            }
            var weight = index - lowerIndex;
            results.push(sortedData[lowerIndex] * (1 - weight) + sortedData[upperIndex] * weight);
        }
    }
    return results;
}
