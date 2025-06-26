// Risk Calculation Utilities - Enhanced UX for trading risk validation
// Provides mathematical functions for risk assessment and educational examples

export interface RiskScenario {
  positionSize: number;
  consecutiveLosses: number;
  accountLossPercent: number;
  remainingCapital: number;
}

export interface KellyCalculation {
  kellyFraction: number;
  recommendedSize: number;
  isPositive: boolean;
  riskLevel: 'conservative' | 'moderate' | 'aggressive' | 'dangerous';
}

export interface LeverageImpact {
  leverage: number;
  amplificationFactor: number;
  marginRequirement: number;
  liquidationRisk: 'low' | 'medium' | 'high' | 'extreme';
}

/**
 * Simulate the impact of consecutive losses on account balance
 */
export function simulateLossSequence(
  positionSize: number, 
  trades: number = 5,
  initialBalance: number = 100
): RiskScenario {
  const lossPerTrade = positionSize / 100;
  let remainingBalance = initialBalance;
  
  for (let i = 0; i < trades; i++) {
    remainingBalance = remainingBalance * (1 - lossPerTrade);
  }
  
  const accountLossPercent = ((initialBalance - remainingBalance) / initialBalance) * 100;
  
  return {
    positionSize,
    consecutiveLosses: trades,
    accountLossPercent: Math.round(accountLossPercent * 100) / 100,
    remainingCapital: Math.round(remainingBalance * 100) / 100
  };
}

/**
 * Generate a formatted warning message for loss sequences
 */
export function generateLossWarning(positionSize: number, trades: number = 5): string {
  const scenario = simulateLossSequence(positionSize, trades);
  
  if (scenario.accountLossPercent > 50) {
    return `Danger: Losing ${trades} trades at ${positionSize}% each could wipe out ${scenario.accountLossPercent.toFixed(0)}% of your account.`;
  } else if (scenario.accountLossPercent > 25) {
    return `Risk Alert: ${positionSize}% per trade means losing ${trades} trades could cost ~${scenario.accountLossPercent.toFixed(0)}% of your account.`;
  } else {
    return `At ${positionSize}%, losing ${trades} trades would cost ~${scenario.accountLossPercent.toFixed(0)}% of your account.`;
  }
}

/**
 * Calculate Kelly Criterion and provide recommendations
 */
export function calculateKelly(winRate: number, payoffRatio: number): KellyCalculation {
  const kellyFraction = winRate - (1 - winRate) / payoffRatio;
  const kellyPercent = kellyFraction * 100;
  
  let recommendedSize: number;
  let riskLevel: 'conservative' | 'moderate' | 'aggressive' | 'dangerous';
  
  if (kellyFraction <= 0) {
    recommendedSize = 0;
    riskLevel = 'dangerous';
  } else if (kellyPercent <= 5) {
    recommendedSize = kellyPercent;
    riskLevel = 'conservative';
  } else if (kellyPercent <= 15) {
    recommendedSize = Math.min(kellyPercent * 0.5, 10); // Half Kelly, max 10%
    riskLevel = 'moderate';
  } else if (kellyPercent <= 25) {
    recommendedSize = Math.min(kellyPercent * 0.25, 8); // Quarter Kelly, max 8%
    riskLevel = 'aggressive';
  } else {
    recommendedSize = Math.min(kellyPercent * 0.1, 5); // 10% of Kelly, max 5%
    riskLevel = 'dangerous';
  }
  
  return {
    kellyFraction: Math.round(kellyPercent * 100) / 100,
    recommendedSize: Math.round(recommendedSize * 100) / 100,
    isPositive: kellyFraction > 0,
    riskLevel
  };
}

/**
 * Analyze leverage impact and risks
 */
export function analyzeLeverage(totalExposure: number): LeverageImpact {
  const leverage = totalExposure / 100;
  const amplificationFactor = leverage;
  const marginRequirement = totalExposure > 100 ? (totalExposure - 100) : 0;
  
  let liquidationRisk: 'low' | 'medium' | 'high' | 'extreme';
  
  if (totalExposure <= 100) {
    liquidationRisk = 'low';
  } else if (totalExposure <= 150) {
    liquidationRisk = 'medium';
  } else if (totalExposure <= 200) {
    liquidationRisk = 'high';
  } else {
    liquidationRisk = 'extreme';
  }
  
  return {
    leverage: Math.round(leverage * 100) / 100,
    amplificationFactor: Math.round(amplificationFactor * 100) / 100,
    marginRequirement: Math.round(marginRequirement * 100) / 100,
    liquidationRisk
  };
}

/**
 * Calculate the minimum win rate needed for profitability
 */
export function calculateMinWinRate(payoffRatio: number): number {
  return 1 / (1 + payoffRatio);
}

/**
 * Calculate the minimum payoff ratio needed for profitability
 */
export function calculateMinPayoffRatio(winRate: number): number {
  if (winRate >= 1) return 0;
  return (1 - winRate) / winRate;
}

/**
 * Generate risk assessment summary
 */
export function generateRiskSummary(
  positionSize: number,
  totalExposure: number,
  winRate: number,
  payoffRatio: number
): {
  overallRisk: 'low' | 'medium' | 'high' | 'extreme';
  warnings: string[];
  suggestions: string[];
  kellyAnalysis: KellyCalculation;
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Position size analysis
  if (positionSize > 10) {
    warnings.push(`Position size of ${positionSize}% is very high`);
    suggestions.push('Consider reducing position size to 2-5% for better risk management');
  } else if (positionSize > 5) {
    warnings.push(`Position size of ${positionSize}% requires careful risk management`);
  }
  
  // Leverage analysis
  const leverageAnalysis = analyzeLeverage(totalExposure);
  if (leverageAnalysis.liquidationRisk === 'extreme') {
    warnings.push(`Extreme leverage (${leverageAnalysis.leverage}x) detected`);
    suggestions.push('Reduce total exposure to under 200% for safety');
  } else if (leverageAnalysis.liquidationRisk === 'high') {
    warnings.push(`High leverage (${leverageAnalysis.leverage}x) increases risk`);
    suggestions.push('Consider using tighter stop losses with high leverage');
  }
  
  // Kelly analysis
  const kellyAnalysis = calculateKelly(winRate, payoffRatio);
  if (!kellyAnalysis.isPositive) {
    warnings.push('Strategy may not be profitable based on win rate and payoff ratio');
    suggestions.push('Review your trading approach or verify your statistics');
  } else if (kellyAnalysis.riskLevel === 'dangerous') {
    warnings.push('Kelly Criterion suggests very high risk per trade');
    suggestions.push(`Consider position sizes around ${kellyAnalysis.recommendedSize}% instead`);
  }
  
  // Overall risk assessment
  let overallRisk: 'low' | 'medium' | 'high' | 'extreme';
  
  if (warnings.length === 0 && positionSize <= 5 && totalExposure <= 100) {
    overallRisk = 'low';
  } else if (warnings.length <= 1 && positionSize <= 10 && totalExposure <= 150) {
    overallRisk = 'medium';
  } else if (warnings.length <= 2 && positionSize <= 20 && totalExposure <= 200) {
    overallRisk = 'high';
  } else {
    overallRisk = 'extreme';
  }
  
  return {
    overallRisk,
    warnings,
    suggestions,
    kellyAnalysis
  };
}

/**
 * Format currency values for display
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage values for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Generate educational examples based on user input
 */
export function generateEducationalExample(
  type: 'positionSize' | 'leverage' | 'kelly',
  value: number,
  additionalParams?: { winRate?: number; payoffRatio?: number; accountSize?: number }
): string {
  const accountSize = additionalParams?.accountSize || 10000;
  
  switch (type) {
    case 'positionSize':
      const riskAmount = (value / 100) * accountSize;
      const scenario = simulateLossSequence(value, 5);
      return `With a ${formatCurrency(accountSize)} account, ${value}% risk = ${formatCurrency(riskAmount)} per trade. ` +
             `Five consecutive losses would leave you with ${formatCurrency((scenario.remainingCapital / 100) * accountSize)}.`;
    
    case 'leverage':
      const leverageAnalysis = analyzeLeverage(value);
      const leverageAmount = (value / 100) * accountSize;
      return `${value}% exposure on ${formatCurrency(accountSize)} = ${formatCurrency(leverageAmount)} market exposure ` +
             `(${leverageAnalysis.leverage}x leverage). A 10% market move = ${formatPercentage(leverageAnalysis.amplificationFactor * 10)} account impact.`;
    
    case 'kelly':
      if (additionalParams?.winRate && additionalParams?.payoffRatio) {
        const kelly = calculateKelly(additionalParams.winRate, additionalParams.payoffRatio);
        return `Kelly suggests ${formatPercentage(kelly.kellyFraction)} per trade. ` +
               `For safety, consider ${formatPercentage(kelly.recommendedSize)} (${kelly.riskLevel} approach).`;
      }
      return 'Kelly Criterion helps optimize position sizing based on your win rate and payoff ratio.';
    
    default:
      return '';
  }
} 