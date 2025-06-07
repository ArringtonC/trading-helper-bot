/** 
 * Kelly Criterion for optimal position sizing
 * Returns fraction of capital to risk (0 to 0.5 max for safety)
 */
export function kellyFraction(expectedReturn: number, variance: number): number {
  if (variance === 0 || expectedReturn <= 0) return 0;
  
  const fullKelly = expectedReturn / variance;
  
  // Apply half-Kelly constraint for safety (max 50% of optimal)
  const halfKelly = fullKelly / 2;
  
  // Clamp between 0 and 0.5 (never risk more than 50% of capital)
  return Math.max(0, Math.min(0.5, halfKelly));
}

/**
 * Calculate Kelly fraction from win rate and average win/loss
 */
export function kellyFromWinRate(
  winRate: number, 
  avgWin: number, 
  avgLoss: number
): number {
  if (winRate <= 0 || winRate >= 1 || avgWin <= 0 || avgLoss <= 0) return 0;
  
  const lossRate = 1 - winRate;
  const expectedReturn = (winRate * avgWin) - (lossRate * avgLoss);
  
  if (expectedReturn <= 0) return 0;
  
  // Kelly formula: f = (bp - q) / b
  // where b = avgWin/avgLoss, p = winRate, q = lossRate
  const b = avgWin / avgLoss;
  const fullKelly = (b * winRate - lossRate) / b;
  
  // Apply half-Kelly constraint
  const halfKelly = fullKelly / 2;
  
  return Math.max(0, Math.min(0.5, halfKelly));
}

/**
 * Calculate position size in dollars given Kelly fraction and account size
 */
export function calculatePositionSize(
  kellyFraction: number,
  accountSize: number,
  maxRiskPerTrade: number = 0.02 // 2% max risk per trade
): number {
  const kellySize = kellyFraction * accountSize;
  const maxRiskSize = maxRiskPerTrade * accountSize;
  
  // Use smaller of Kelly size or max risk constraint
  return Math.min(kellySize, maxRiskSize);
} 
 
 
 