/**
 * Position Limit Recommendation Algorithms
 * 
 * This module contains various algorithms for calculating recommended position limits
 * based on different risk management approaches, account characteristics, and trading styles.
 * 
 * All recommendations are provided as suggestions and should not be considered financial advice.
 */

export interface PositionSizingInput {
  accountSize: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  tradingStrategy: 'day_trading' | 'swing_trading' | 'position_trading' | 'scalping';
  goalType: 'growth' | 'income' | 'preservation' | 'capital_objective';
  assetClass?: 'stocks' | 'options' | 'futures' | 'forex' | 'crypto';
  experience?: 'learning' | 'import' | 'broker';
  timeHorizon?: number; // months
  volatilityContext?: 'low' | 'normal' | 'high';
}

export interface PositionLimitRecommendation {
  maxPositionSize: number; // percentage of account
  maxTotalExposure: number; // percentage of account
  reasoning: string;
  method: string;
  warnings?: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface ComprehensiveRecommendation {
  primary: PositionLimitRecommendation;
  alternatives: PositionLimitRecommendation[];
  riskMetrics: {
    estimatedMaxDrawdown: number;
    concentrationRisk: 'low' | 'medium' | 'high';
    liquidityRisk: 'low' | 'medium' | 'high';
  };
}

/**
 * Fixed Percentage Method
 * Classic approach using fixed percentages based on risk tolerance
 */
export function calculateFixedPercentageLimits(input: PositionSizingInput): PositionLimitRecommendation {
  let maxPosition: number;
  let maxExposure: number;
  
  // Base recommendations by risk tolerance
  switch (input.riskTolerance) {
    case 'conservative':
      maxPosition = 2;
      maxExposure = 15;
      break;
    case 'moderate':
      maxPosition = 5;
      maxExposure = 25;
      break;
    case 'aggressive':
      maxPosition = 10;
      maxExposure = 40;
      break;
    default:
      maxPosition = 5;
      maxExposure = 25;
  }

  // Adjust for asset class risk
  if (input.assetClass) {
    const assetMultiplier = getAssetClassMultiplier(input.assetClass);
    maxPosition *= assetMultiplier;
    maxExposure *= assetMultiplier;
  }

  // Adjust for experience level
  if (input.experience === 'learning') {
    maxPosition *= 0.5;
    maxExposure *= 0.6;
  } else if (input.experience === 'broker') {
    maxPosition *= 1.2;
    maxExposure *= 1.1;
  }

  // Ensure reasonable limits
  maxPosition = Math.min(maxPosition, 15);
  maxExposure = Math.min(maxExposure, 60);

  const warnings: string[] = [];
  if (maxPosition > 8) {
    warnings.push('High position concentration may increase portfolio volatility');
  }

  return {
    maxPositionSize: Math.round(maxPosition * 10) / 10,
    maxTotalExposure: Math.round(maxExposure * 10) / 10,
    reasoning: `Fixed percentage approach based on ${input.riskTolerance} risk tolerance${input.assetClass ? ` for ${input.assetClass}` : ''}`,
    method: 'Fixed Percentage',
    warnings: warnings.length > 0 ? warnings : undefined,
    confidence: 'high'
  };
}

/**
 * Risk-Based Method
 * Calculates limits based on maximum acceptable loss per trade
 */
export function calculateRiskBasedLimits(input: PositionSizingInput): PositionLimitRecommendation {
  // Define risk per trade based on risk tolerance
  let riskPerTrade: number;
  let maxConcurrentTrades: number;

  switch (input.riskTolerance) {
    case 'conservative':
      riskPerTrade = 0.5; // 0.5% risk per trade
      maxConcurrentTrades = 5;
      break;
    case 'moderate':
      riskPerTrade = 1.0; // 1% risk per trade
      maxConcurrentTrades = 8;
      break;
    case 'aggressive':
      riskPerTrade = 2.0; // 2% risk per trade
      maxConcurrentTrades = 10;
      break;
    default:
      riskPerTrade = 1.0;
      maxConcurrentTrades = 8;
  }

  // Adjust for trading strategy
  const strategyMultiplier = getStrategyMultiplier(input.tradingStrategy);
  riskPerTrade *= strategyMultiplier;
  
  // Assume average stop loss of 5% to calculate position size from risk
  const averageStopLoss = 5; // percent
  const maxPosition = (riskPerTrade / averageStopLoss) * 100;
  
  // Total exposure based on concurrent trades
  const maxExposure = maxPosition * maxConcurrentTrades;

  const warnings: string[] = [];
  if (riskPerTrade > 1.5) {
    warnings.push('High risk per trade may lead to significant drawdowns');
  }

  return {
    maxPositionSize: Math.round(maxPosition * 10) / 10,
    maxTotalExposure: Math.min(Math.round(maxExposure * 10) / 10, 50),
    reasoning: `Risk-based calculation limiting loss to ${riskPerTrade}% per trade with up to ${maxConcurrentTrades} concurrent positions`,
    method: 'Risk-Based',
    warnings: warnings.length > 0 ? warnings : undefined,
    confidence: 'high'
  };
}

/**
 * Volatility-Based Method
 * Adjusts position sizes based on market volatility conditions
 */
export function calculateVolatilityBasedLimits(input: PositionSizingInput): PositionLimitRecommendation {
  // Start with base limits
  const baseLimits = calculateFixedPercentageLimits(input);
  
  let volatilityMultiplier = 1.0;
  let volatilityDesc = 'normal';

  // Adjust based on volatility context
  if (input.volatilityContext) {
    switch (input.volatilityContext) {
      case 'low':
        volatilityMultiplier = 1.2;
        volatilityDesc = 'low';
        break;
      case 'normal':
        volatilityMultiplier = 1.0;
        volatilityDesc = 'normal';
        break;
      case 'high':
        volatilityMultiplier = 0.6;
        volatilityDesc = 'high';
        break;
    }
  }

  // Apply additional asset class volatility adjustments
  if (input.assetClass === 'crypto') {
    volatilityMultiplier *= 0.5; // Reduce further for crypto
  } else if (input.assetClass === 'forex') {
    volatilityMultiplier *= 0.8;
  }

  const adjustedPosition = baseLimits.maxPositionSize * volatilityMultiplier;
  const adjustedExposure = baseLimits.maxTotalExposure * volatilityMultiplier;

  const warnings: string[] = [];
  if (input.volatilityContext === 'high') {
    warnings.push('Position sizes reduced due to high market volatility');
  }

  return {
    maxPositionSize: Math.round(adjustedPosition * 10) / 10,
    maxTotalExposure: Math.round(adjustedExposure * 10) / 10,
    reasoning: `Volatility-adjusted limits for ${volatilityDesc} market conditions${input.assetClass ? ` in ${input.assetClass}` : ''}`,
    method: 'Volatility-Based',
    warnings: warnings.length > 0 ? warnings : undefined,
    confidence: 'medium'
  };
}

/**
 * Strategy-Specific Method
 * Tailored recommendations based on specific trading strategies
 */
export function calculateStrategySpecificLimits(input: PositionSizingInput): PositionLimitRecommendation {
  let maxPosition: number;
  let maxExposure: number;
  let reasoning: string;

  switch (input.tradingStrategy) {
    case 'day_trading':
      // Day trading typically requires smaller positions due to leverage and speed
      maxPosition = input.riskTolerance === 'conservative' ? 3 : 
                   input.riskTolerance === 'moderate' ? 6 : 12;
      maxExposure = input.riskTolerance === 'conservative' ? 20 : 
                   input.riskTolerance === 'moderate' ? 35 : 50;
      reasoning = 'Day trading limits optimized for quick entries/exits and intraday risk management';
      break;

    case 'swing_trading':
      // Swing trading allows moderate positions with multi-day holds
      maxPosition = input.riskTolerance === 'conservative' ? 4 : 
                   input.riskTolerance === 'moderate' ? 8 : 15;
      maxExposure = input.riskTolerance === 'conservative' ? 25 : 
                   input.riskTolerance === 'moderate' ? 40 : 60;
      reasoning = 'Swing trading limits for 2-10 day holding periods with moderate diversification';
      break;

    case 'position_trading':
      // Position trading allows larger positions due to longer timeframes
      maxPosition = input.riskTolerance === 'conservative' ? 6 : 
                   input.riskTolerance === 'moderate' ? 12 : 20;
      maxExposure = input.riskTolerance === 'conservative' ? 30 : 
                   input.riskTolerance === 'moderate' ? 50 : 70;
      reasoning = 'Position trading limits for long-term holds with focused portfolio concentration';
      break;

    case 'scalping':
      // Scalping requires very small positions due to high frequency
      maxPosition = input.riskTolerance === 'conservative' ? 1 : 
                   input.riskTolerance === 'moderate' ? 2 : 4;
      maxExposure = input.riskTolerance === 'conservative' ? 10 : 
                   input.riskTolerance === 'moderate' ? 15 : 25;
      reasoning = 'Scalping limits for high-frequency trading with minimal per-trade risk';
      break;

    default:
      return calculateFixedPercentageLimits(input);
  }

  // Apply goal-based adjustments
  if (input.goalType === 'preservation') {
    maxPosition *= 0.6;
    maxExposure *= 0.7;
  } else if (input.goalType === 'growth') {
    maxPosition *= 1.1;
    maxExposure *= 1.1;
  }

  const warnings: string[] = [];
  if (input.tradingStrategy === 'scalping' && input.experience === 'learning') {
    warnings.push('Scalping requires advanced skills and may not be suitable for beginners');
  }

  return {
    maxPositionSize: Math.round(maxPosition * 10) / 10,
    maxTotalExposure: Math.round(maxExposure * 10) / 10,
    reasoning,
    method: 'Strategy-Specific',
    warnings: warnings.length > 0 ? warnings : undefined,
    confidence: 'high'
  };
}

/**
 * Capital Objective Method
 * Calculates limits based on specific capital growth targets
 */
export function calculateCapitalObjectiveLimits(
  input: PositionSizingInput,
  currentBalance: number,
  targetBalance: number,
  timeHorizonMonths: number,
  winRate?: number,
  payoffRatio?: number
): PositionLimitRecommendation {
  const requiredReturn = (targetBalance / currentBalance - 1) * 100;
  const annualizedReturn = (requiredReturn / timeHorizonMonths) * 12;
  
  let maxPosition: number;
  let maxExposure: number;
  
  // Conservative approach for capital objectives
  if (annualizedReturn <= 10) {
    // Low target return - conservative sizing
    maxPosition = 3;
    maxExposure = 20;
  } else if (annualizedReturn <= 25) {
    // Moderate target return
    maxPosition = 5;
    maxExposure = 30;
  } else if (annualizedReturn <= 50) {
    // Aggressive target return
    maxPosition = 8;
    maxExposure = 40;
  } else {
    // Very aggressive target - warn user
    maxPosition = 10;
    maxExposure = 50;
  }

  // Adjust based on risk tolerance
  const riskMultiplier = input.riskTolerance === 'conservative' ? 0.7 :
                        input.riskTolerance === 'aggressive' ? 1.3 : 1.0;
  
  maxPosition *= riskMultiplier;
  maxExposure *= riskMultiplier;

  const warnings: string[] = [];
  if (annualizedReturn > 30) {
    warnings.push('Target return is very aggressive and may require significant risk');
  }
  if (timeHorizonMonths < 6) {
    warnings.push('Short time horizon increases risk for achieving target');
  }

  const reasoning = `Capital objective sizing for ${requiredReturn.toFixed(1)}% return over ${timeHorizonMonths} months (${annualizedReturn.toFixed(1)}% annualized)`;

  return {
    maxPositionSize: Math.round(maxPosition * 10) / 10,
    maxTotalExposure: Math.round(maxExposure * 10) / 10,
    reasoning,
    method: 'Capital Objective',
    warnings: warnings.length > 0 ? warnings : undefined,
    confidence: 'medium'
  };
}

/**
 * Comprehensive Recommendation Engine
 * Generates multiple recommendations and selects the most appropriate
 */
export function generateComprehensiveRecommendation(
  input: PositionSizingInput,
  capitalObjectiveData?: {
    currentBalance: number;
    targetBalance: number;
    timeHorizonMonths: number;
    winRate?: number;
    payoffRatio?: number;
  }
): ComprehensiveRecommendation {
  const recommendations: PositionLimitRecommendation[] = [];

  // Generate all applicable recommendations
  recommendations.push(calculateFixedPercentageLimits(input));
  recommendations.push(calculateRiskBasedLimits(input));
  recommendations.push(calculateVolatilityBasedLimits(input));
  recommendations.push(calculateStrategySpecificLimits(input));

  // Add capital objective if data provided
  if (capitalObjectiveData && input.goalType === 'capital_objective') {
    recommendations.push(calculateCapitalObjectiveLimits(
      input,
      capitalObjectiveData.currentBalance,
      capitalObjectiveData.targetBalance,
      capitalObjectiveData.timeHorizonMonths,
      capitalObjectiveData.winRate,
      capitalObjectiveData.payoffRatio
    ));
  }

  // Select primary recommendation based on goal type and strategy
  let primaryIndex = 0;
  
  if (input.goalType === 'capital_objective' && capitalObjectiveData) {
    primaryIndex = recommendations.length - 1; // Use capital objective method
  } else if (input.tradingStrategy && input.tradingStrategy !== 'swing_trading') {
    primaryIndex = 3; // Use strategy-specific method
  } else if (input.volatilityContext && input.volatilityContext !== 'normal') {
    primaryIndex = 2; // Use volatility-based method
  } else {
    primaryIndex = 1; // Use risk-based method as default
  }

  const primary = recommendations[primaryIndex];
  const alternatives = recommendations.filter((_, index) => index !== primaryIndex);

  // Calculate risk metrics
  const riskMetrics = calculateRiskMetrics(primary, input);

  return {
    primary,
    alternatives,
    riskMetrics
  };
}

// Helper functions
function getAssetClassMultiplier(assetClass: string): number {
  switch (assetClass) {
    case 'stocks': return 1.0;
    case 'options': return 0.7;
    case 'futures': return 0.6;
    case 'forex': return 0.8;
    case 'crypto': return 0.4;
    default: return 1.0;
  }
}

function getStrategyMultiplier(strategy: string): number {
  switch (strategy) {
    case 'day_trading': return 0.8;
    case 'swing_trading': return 1.0;
    case 'position_trading': return 1.2;
    case 'scalping': return 0.5;
    default: return 1.0;
  }
}

function calculateRiskMetrics(
  recommendation: PositionLimitRecommendation,
  input: PositionSizingInput
): {
  estimatedMaxDrawdown: number;
  concentrationRisk: 'low' | 'medium' | 'high';
  liquidityRisk: 'low' | 'medium' | 'high';
} {
  // Estimate maximum drawdown based on position size and market conditions
  let estimatedMaxDrawdown = recommendation.maxPositionSize * 2; // Conservative estimate
  
  if (input.volatilityContext === 'high') {
    estimatedMaxDrawdown *= 1.5;
  }
  
  if (input.assetClass === 'crypto') {
    estimatedMaxDrawdown *= 2;
  }

  // Assess concentration risk
  let concentrationRisk: 'low' | 'medium' | 'high' = 'low';
  if (recommendation.maxPositionSize > 8) {
    concentrationRisk = 'high';
  } else if (recommendation.maxPositionSize > 5) {
    concentrationRisk = 'medium';
  }

  // Assess liquidity risk
  let liquidityRisk: 'low' | 'medium' | 'high' = 'low';
  if (input.assetClass === 'crypto' || input.assetClass === 'options') {
    liquidityRisk = 'medium';
  }
  if (recommendation.maxTotalExposure > 40) {
    liquidityRisk = liquidityRisk === 'medium' ? 'high' : 'medium';
  }

  return {
    estimatedMaxDrawdown: Math.round(estimatedMaxDrawdown * 10) / 10,
    concentrationRisk,
    liquidityRisk
  };
}

/**
 * Validates if user-selected limits deviate significantly from recommendations
 */
export function validateUserLimits(
  userMaxPosition: number,
  userMaxExposure: number,
  recommendation: PositionLimitRecommendation
): {
  isValid: boolean;
  warnings: string[];
  severity: 'low' | 'medium' | 'high';
} {
  const warnings: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  const positionDeviation = (userMaxPosition / recommendation.maxPositionSize) - 1;
  const exposureDeviation = (userMaxExposure / recommendation.maxTotalExposure) - 1;

  // Check position size deviation
  if (Math.abs(positionDeviation) > 0.5) {
    warnings.push(`Position size deviates ${Math.abs(positionDeviation * 100).toFixed(0)}% from recommended`);
    severity = 'medium';
  }

  if (positionDeviation > 1.0) {
    warnings.push('Position size is more than double the recommended amount');
    severity = 'high';
  }

  // Check exposure deviation
  if (Math.abs(exposureDeviation) > 0.5) {
    warnings.push(`Total exposure deviates ${Math.abs(exposureDeviation * 100).toFixed(0)}% from recommended`);
    if (severity === 'low') severity = 'medium';
  }

  if (exposureDeviation > 1.0) {
    warnings.push('Total exposure is more than double the recommended amount');
    severity = 'high';
  }

  // Absolute limits
  if (userMaxPosition > 20) {
    warnings.push('Position size above 20% carries very high concentration risk');
    severity = 'high';
  }

  if (userMaxExposure > 80) {
    warnings.push('Total exposure above 80% leaves little room for risk management');
    severity = 'high';
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    severity
  };
} 
 
 
 