/**
 * Solves for the fixed fraction 'f' to risk per trade to reach a target capital ratio.
 * Uses a binary search approach.
 * 
 * Equation: (1 + f * (winRate * payoffRatio - (1 - winRate))) ^ numTrades = targetCapitalRatio
 * Let expectancy = winRate * payoffRatio - (1 - winRate)
 * Then: (1 + f * expectancy) ^ numTrades = targetCapitalRatio
 * And: 1 + f * expectancy = targetCapitalRatio ^ (1 / numTrades)
 * So: f * expectancy = (targetCapitalRatio ^ (1 / numTrades)) - 1
 * Finally: f = ((targetCapitalRatio ^ (1 / numTrades)) - 1) / expectancy
 * 
 * However, the above direct formula for 'f' assumes that (1 + f * expectancy) is the growth factor per trade.
 * If expectancy is negative (losing strategy), this direct formula might suggest risking a negative fraction
 * or behave unexpectedly if the base (1 + f * expectancy) becomes negative or zero.
 * 
 * The problem is more about finding an 'f' such that repeated application of geometric growth achieves the target.
 * The original formula is (Portfolio_End) = Portfolio_Start * (1 + f * KellyExpectancy)^numTrades
 * where KellyExpectancy = (winRate * Payoff) - (1-winRate).
 * 
 * Let's use an iterative approach (binary search) for 'f' to ensure stability and handle edge cases,
 * especially since 'f' (fraction risked) should ideally be between 0 and 1 (or a practical upper limit like 0.2-0.3).
 */

interface FixedFractionalParams {
  targetCapitalRatio: number; // targetBalance / currentBalance
  winRate: number; // 0.0 to 1.0
  payoffRatio: number; // e.g., 1.5 (for 1.5:1 win/loss)
  numTrades: number;
  maxIterations?: number;
  tolerance?: number;
  maxF?: number; // Practical upper limit for f (e.g., 0.5 meaning 50% risk)
}

export function solveFixedFractionalF({
  targetCapitalRatio,
  winRate,
  payoffRatio,
  numTrades,
  maxIterations = 100,
  tolerance = 1e-6, // Tolerance for how close the achieved ratio should be to target
  maxF = 0.5, // Do not suggest risking more than 50% per trade
}: FixedFractionalParams): number | null {
  if (targetCapitalRatio <= 1) return 0; // No growth needed, so risk 0
  if (winRate <= 0 || winRate > 1 || payoffRatio <= 0 || numTrades <= 0) return null; // Invalid basic params

  const expectancy = winRate * payoffRatio - (1 - winRate);

  // If expectancy is non-positive, growth to targetCapitalRatio > 1 is impossible with positive f
  // unless payoffRatio is extremely high and winRate is positive, but numTrades allows it.
  // If expectancy is <=0, then (1 + f*expectancy) will be <=1 for f>0.
  // If targetCapitalRatio > 1, you can't reach it if each trade doesn't grow capital on average.
  if (expectancy <= 0 && targetCapitalRatio > 1) {
    // One edge case: if winRate is 1 (always win), then expectancy = payoffRatio.
    // (1 + f * payoffRatio)^numTrades = targetCapitalRatio
    // 1 + f * payoffRatio = targetCapitalRatio^(1/numTrades)
    // f = (targetCapitalRatio^(1/numTrades) - 1) / payoffRatio
    // This would only be hit if expectancy was calculated based on something other than unit loss for (1-winRate)
    // The standard interpretation implies expectancy > 0 is needed for growth.
    return null; 
  }
  
  // Binary search for f
  let lowF = 0;
  let highF = maxF; // Max practical fraction to risk

  for (let i = 0; i < maxIterations; i++) {
    const midF = (lowF + highF) / 2;
    if (midF <= 0) { // if midF becomes 0 or negative, means lowF and highF are likely 0.
        // if target is > 1, and f=0, achieved is 1.
        // if midF is 0, and targetRatio is >1, we need to increase midF.
        // This scenario should be rare if expectancy > 0.
        lowF = tolerance; // nudge it up slightly to continue search if expectancy is positive
        continue;
    }

    const growthFactorPerTrade = 1 + midF * expectancy;

    // Avoid issues with Math.pow if growthFactor is negative or zero
    if (growthFactorPerTrade <= 0) {
      // Risking midF leads to a non-positive growth factor, this 'f' is too high or expectancy is an issue.
      // If expectancy is positive, this shouldn't happen unless midF is huge, but highF caps it.
      // If expectancy is negative, this can happen.
      highF = midF; // Reduce f
      continue;
    }

    const achievedRatio = Math.pow(growthFactorPerTrade, numTrades);

    if (Math.abs(achievedRatio - targetCapitalRatio) < tolerance) {
      return midF; // Found a suitable f
    }

    if (achievedRatio < targetCapitalRatio) {
      lowF = midF; // Need to risk more
    } else {
      highF = midF; // Risking too much or found it
    }
  }
  
  // If loop finishes, check the best 'f' found within practical limits.
  // Let's check lowF as it's the highest 'f' that resulted in achievedRatio < target.
  // Or highF if it's very close.
  // For simplicity, if highF is very close to a valid f, it could be the result.
  // However, if it didn't converge, it might mean no solution within maxF.
  const finalCheckF = (lowF + highF) / 2;
  if (finalCheckF > 0 && finalCheckF <= maxF) {
     const finalGrowthFactor = 1 + finalCheckF * expectancy;
     if (finalGrowthFactor > 0) {
        const finalAchievedRatio = Math.pow(finalGrowthFactor, numTrades);
        // If it's reasonably close and positive expectancy, return it.
        // Or if it's the best we can get under maxF for a high targetRatio.
        if (Math.abs(finalAchievedRatio - targetCapitalRatio) < tolerance * 10 || (expectancy > 0 && finalAchievedRatio < targetCapitalRatio)) {
             // If we are here, it implies that even at maxF (or close to it), we might not have hit the target.
             // If expectancy is positive, and we still haven't hit the target, it means the target is very aggressive
             // or numTrades is too low. In this case, lowF will approach maxF.
             // We return lowF if it's the best achievable f that doesn't overshoot or is within practical limits.
             if (lowF > 0 && lowF <=maxF) return lowF; // Return the highest f that was still "too low" but valid
        }
     }
  }


  return null; // No solution found within practical limits or iterations
}

interface KellyParams {
  winRate: number; // 0.0 to 1.0
  payoffRatio: number; // e.g., 1.5 (for 1.5:1 win/loss)
}

/**
 * Calculates the full Kelly Criterion fraction.
 * f* = p - q/R  where p=winRate, q=(1-winRate), R=payoffRatio
 */
export function calculateKellyFraction({
  winRate,
  payoffRatio,
}: KellyParams): number | null {
  if (winRate < 0 || winRate > 1 || payoffRatio <= 0) {
    return null; // Invalid parameters
  }
  if (winRate === 0) return 0; // If win rate is 0, Kelly fraction is 0 (or negative, meaning don't bet)

  const q = 1 - winRate;
  const kellyF = winRate - q / payoffRatio;

  // Kelly fraction should be positive to indicate a bet.
  // If negative or zero, it means the edge is not favorable enough.
  return kellyF > 0 ? kellyF : 0;
} 