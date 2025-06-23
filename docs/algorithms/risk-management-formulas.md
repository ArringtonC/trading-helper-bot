# Risk Management Mathematical Formulas

## 1. Maximum Drawdown Calculations

### Basic Maximum Drawdown Formula
```typescript
interface DrawdownMetrics {
  maxDrawdown: number;        // Maximum peak-to-trough decline
  maxDrawdownDuration: number; // Days in drawdown
  currentDrawdown: number;    // Current drawdown from peak
  recoveryFactor: number;     // Return needed to recover
  calmarRatio: number;        // Annual return / max drawdown
}

function calculateMaximumDrawdown(equityCurve: number[]): DrawdownMetrics {
  let peak = equityCurve[0];
  let maxDrawdown = 0;
  let maxDrawdownStart = 0;
  let maxDrawdownEnd = 0;
  let currentDrawdownStart = 0;
  
  // Track all drawdown periods
  const drawdownPeriods: DrawdownPeriod[] = [];
  let inDrawdown = false;
  
  for (let i = 1; i < equityCurve.length; i++) {
    const currentValue = equityCurve[i];
    
    // New peak reached
    if (currentValue > peak) {
      // End current drawdown period if in one
      if (inDrawdown) {
        drawdownPeriods.push({
          startIndex: currentDrawdownStart,
          endIndex: i - 1,
          startValue: peak,
          endValue: equityCurve[i - 1],
          maxDrawdown: (peak - Math.min(...equityCurve.slice(currentDrawdownStart, i))) / peak,
          duration: i - currentDrawdownStart,
          recoveryTime: i - currentDrawdownStart
        });
        inDrawdown = false;
      }
      
      peak = currentValue;
    } else {
      // In drawdown
      if (!inDrawdown) {
        currentDrawdownStart = i - 1;
        inDrawdown = true;
      }
      
      const currentDrawdown = (peak - currentValue) / peak;
      
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
        maxDrawdownStart = currentDrawdownStart;
        maxDrawdownEnd = i;
      }
    }
  }
  
  // Handle ongoing drawdown
  if (inDrawdown) {
    const currentDrawdown = (peak - equityCurve[equityCurve.length - 1]) / peak;
    drawdownPeriods.push({
      startIndex: currentDrawdownStart,
      endIndex: equityCurve.length - 1,
      startValue: peak,
      endValue: equityCurve[equityCurve.length - 1],
      maxDrawdown: currentDrawdown,
      duration: equityCurve.length - currentDrawdownStart,
      recoveryTime: null, // Still in drawdown
      isOngoing: true
    });
  }
  
  const currentDrawdown = (peak - equityCurve[equityCurve.length - 1]) / peak;
  const recoveryFactor = peak / equityCurve[equityCurve.length - 1] - 1;
  
  return {
    maxDrawdown,
    maxDrawdownDuration: maxDrawdownEnd - maxDrawdownStart,
    currentDrawdown,
    recoveryFactor,
    calmarRatio: calculateCalmarRatio(equityCurve, maxDrawdown),
    drawdownPeriods,
    averageDrawdown: drawdownPeriods.reduce((sum, dd) => sum + dd.maxDrawdown, 0) / drawdownPeriods.length,
    averageRecoveryTime: calculateAverageRecoveryTime(drawdownPeriods)
  };
}

function calculateCalmarRatio(equityCurve: number[], maxDrawdown: number): number {
  if (maxDrawdown === 0) return Infinity;
  
  const totalReturn = (equityCurve[equityCurve.length - 1] - equityCurve[0]) / equityCurve[0];
  const years = equityCurve.length / 252; // Assuming daily data
  const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
  
  return annualizedReturn / maxDrawdown;
}
```

### Advanced Drawdown Analysis
```typescript
interface DrawdownAnalysis {
  underwater: number[];          // Time series of drawdown values
  ulcerIndex: number;           // Ulcer Index (RMS of drawdowns)
  painIndex: number;            // Average drawdown * duration
  serenityRatio: number;        // Ulcer Index adjusted return ratio
  drawdownDeviation: number;    // Standard deviation of drawdowns
}

function calculateAdvancedDrawdownMetrics(equityCurve: number[]): DrawdownAnalysis {
  const underwater = calculateUnderwaterCurve(equityCurve);
  
  // Ulcer Index - measures the depth and duration of drawdowns
  const ulcerIndex = Math.sqrt(
    underwater.reduce((sum, dd) => sum + dd * dd, 0) / underwater.length
  );
  
  // Pain Index - average drawdown weighted by duration
  const painIndex = underwater.reduce((sum, dd) => sum + Math.abs(dd), 0) / underwater.length;
  
  // Serenity Ratio - like Calmar but uses Ulcer Index
  const totalReturn = (equityCurve[equityCurve.length - 1] - equityCurve[0]) / equityCurve[0];
  const years = equityCurve.length / 252;
  const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
  const serenityRatio = ulcerIndex > 0 ? annualizedReturn / ulcerIndex : Infinity;
  
  // Drawdown deviation
  const meanDrawdown = underwater.reduce((sum, dd) => sum + dd, 0) / underwater.length;
  const drawdownDeviation = Math.sqrt(
    underwater.reduce((sum, dd) => sum + Math.pow(dd - meanDrawdown, 2), 0) / underwater.length
  );
  
  return {
    underwater,
    ulcerIndex,
    painIndex,
    serenityRatio,
    drawdownDeviation
  };
}

function calculateUnderwaterCurve(equityCurve: number[]): number[] {
  const underwater: number[] = [];
  let peak = equityCurve[0];
  
  for (let i = 0; i < equityCurve.length; i++) {
    if (equityCurve[i] > peak) {
      peak = equityCurve[i];
    }
    underwater.push((equityCurve[i] - peak) / peak);
  }
  
  return underwater;
}
```

## 2. Portfolio Correlation Limits

### Correlation Matrix Analysis
```typescript
interface CorrelationAnalysis {
  correlationMatrix: number[][];
  averageCorrelation: number;
  maxCorrelation: number;
  minCorrelation: number;
  eigenValues: number[];
  portfolioConcentration: number;
  diversificationRatio: number;
}

function calculatePortfolioCorrelations(
  returns: number[][],  // Array of return series for each asset
  assets: string[]
): CorrelationAnalysis {
  const n = returns.length;
  const correlationMatrix: number[][] = [];
  
  // Calculate correlation matrix
  for (let i = 0; i < n; i++) {
    correlationMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1.0;
      } else {
        correlationMatrix[i][j] = calculateCorrelation(returns[i], returns[j]);
      }
    }
  }
  
  // Calculate summary statistics
  const correlations = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      correlations.push(correlationMatrix[i][j]);
    }
  }
  
  const averageCorrelation = correlations.reduce((sum, corr) => sum + corr, 0) / correlations.length;
  const maxCorrelation = Math.max(...correlations);
  const minCorrelation = Math.min(...correlations);
  
  // Eigenvalue analysis for concentration risk
  const eigenValues = calculateEigenValues(correlationMatrix);
  const portfolioConcentration = calculateConcentrationRisk(eigenValues);
  
  // Diversification ratio
  const diversificationRatio = calculateDiversificationRatio(correlationMatrix, returns);
  
  return {
    correlationMatrix,
    averageCorrelation,
    maxCorrelation,
    minCorrelation,
    eigenValues,
    portfolioConcentration,
    diversificationRatio
  };
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let sumSquareX = 0;
  let sumSquareY = 0;
  
  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX;
    const deltaY = y[i] - meanY;
    
    numerator += deltaX * deltaY;
    sumSquareX += deltaX * deltaX;
    sumSquareY += deltaY * deltaY;
  }
  
  const denominator = Math.sqrt(sumSquareX * sumSquareY);
  return denominator === 0 ? 0 : numerator / denominator;
}

function enforceCorrelationLimits(
  proposedPortfolio: Portfolio,
  maxPairwiseCorrelation: number = 0.70,
  maxAverageCorrelation: number = 0.50
): PortfolioAdjustment {
  
  const correlations = calculatePortfolioCorrelations(
    proposedPortfolio.positions.map(p => p.returns),
    proposedPortfolio.positions.map(p => p.symbol)
  );
  
  const violations: CorrelationViolation[] = [];
  
  // Check pairwise correlations
  for (let i = 0; i < correlations.correlationMatrix.length; i++) {
    for (let j = i + 1; j < correlations.correlationMatrix.length; j++) {
      const correlation = correlations.correlationMatrix[i][j];
      if (Math.abs(correlation) > maxPairwiseCorrelation) {
        violations.push({
          type: 'PAIRWISE',
          asset1: proposedPortfolio.positions[i].symbol,
          asset2: proposedPortfolio.positions[j].symbol,
          correlation,
          severity: Math.abs(correlation) - maxPairwiseCorrelation
        });
      }
    }
  }
  
  // Check average correlation
  if (correlations.averageCorrelation > maxAverageCorrelation) {
    violations.push({
      type: 'AVERAGE',
      correlation: correlations.averageCorrelation,
      threshold: maxAverageCorrelation,
      severity: correlations.averageCorrelation - maxAverageCorrelation
    });
  }
  
  // Generate adjustment recommendations
  const adjustments = generateCorrelationAdjustments(violations, proposedPortfolio);
  
  return {
    violations,
    adjustments,
    adjustedPortfolio: applyCorrelationAdjustments(proposedPortfolio, adjustments),
    improvementMetrics: calculateImprovementMetrics(correlations, adjustments)
  };
}
```

## 3. Position Sizing Adjustments Based on Volatility

### Volatility-Adjusted Position Sizing
```typescript
interface VolatilityAdjustment {
  basePositionSize: number;
  volatilityMultiplier: number;
  adjustedPositionSize: number;
  riskAdjustment: number;
  confidenceInterval: number;
}

function adjustPositionForVolatility(
  basePosition: number,
  assetVolatility: number,
  portfolioVolatility: number,
  targetRisk: number = 0.02,
  method: 'SIMPLE' | 'KELLY' | 'RISK_PARITY' = 'SIMPLE'
): VolatilityAdjustment {
  
  let volatilityMultiplier: number;
  
  switch (method) {
    case 'SIMPLE':
      // Inverse volatility scaling
      volatilityMultiplier = portfolioVolatility / assetVolatility;
      break;
      
    case 'KELLY':
      // Kelly Criterion adjustment
      volatilityMultiplier = calculateKellyMultiplier(assetVolatility, targetRisk);
      break;
      
    case 'RISK_PARITY':
      // Risk parity adjustment
      volatilityMultiplier = calculateRiskParityMultiplier(assetVolatility, portfolioVolatility);
      break;
  }
  
  // Apply volatility bounds
  volatilityMultiplier = Math.max(0.25, Math.min(2.0, volatilityMultiplier));
  
  const adjustedPositionSize = basePosition * volatilityMultiplier;
  const riskAdjustment = (adjustedPositionSize - basePosition) / basePosition;
  
  return {
    basePositionSize: basePosition,
    volatilityMultiplier,
    adjustedPositionSize,
    riskAdjustment,
    confidenceInterval: calculateConfidenceInterval(assetVolatility)
  };
}

function calculateDynamicVolatilityMetrics(
  prices: number[],
  window: number = 20
): DynamicVolatilityMetrics {
  const returns = calculateReturns(prices);
  const rollingVolatilities: number[] = [];
  const volRegimes: VolatilityRegime[] = [];
  
  for (let i = window; i < returns.length; i++) {
    const windowReturns = returns.slice(i - window, i);
    const vol = calculateVolatility(windowReturns) * Math.sqrt(252); // Annualized
    rollingVolatilities.push(vol);
    
    // Classify volatility regime
    const regime = classifyVolatilityRegime(vol, rollingVolatilities);
    volRegimes.push(regime);
  }
  
  return {
    currentVolatility: rollingVolatilities[rollingVolatilities.length - 1],
    averageVolatility: rollingVolatilities.reduce((sum, vol) => sum + vol, 0) / rollingVolatilities.length,
    volatilityOfVolatility: calculateVolatility(rollingVolatilities),
    currentRegime: volRegimes[volRegimes.length - 1],
    regimeStability: calculateRegimeStability(volRegimes),
    garchForecast: forecastGARCH(returns, 5) // 5-day forecast
  };
}

function classifyVolatilityRegime(
  currentVol: number,
  historicalVols: number[]
): VolatilityRegime {
  if (historicalVols.length < 60) return 'NORMAL'; // Need sufficient history
  
  const percentiles = calculatePercentiles(historicalVols, [25, 75]);
  
  if (currentVol < percentiles[0]) return 'LOW';
  if (currentVol > percentiles[1]) return 'HIGH';
  return 'NORMAL';
}
```

### GARCH Volatility Forecasting
```typescript
interface GARCHModel {
  omega: number;      // Constant term
  alpha: number;      // ARCH coefficient
  beta: number;       // GARCH coefficient
  forecast: number[]; // Multi-step forecast
  logLikelihood: number;
}

function estimateGARCH(returns: number[]): GARCHModel {
  // GARCH(1,1): σ²(t) = ω + α*ε²(t-1) + β*σ²(t-1)
  
  // Initial parameter estimates
  let omega = 0.0001;
  let alpha = 0.05;
  let beta = 0.90;
  
  // Maximum likelihood estimation using optimization
  const result = optimizeGARCH(returns, omega, alpha, beta);
  
  return {
    omega: result.omega,
    alpha: result.alpha,
    beta: result.beta,
    forecast: generateGARCHForecast(returns, result, 10),
    logLikelihood: result.logLikelihood
  };
}

function generateGARCHForecast(
  returns: number[],
  model: { omega: number; alpha: number; beta: number },
  steps: number
): number[] {
  const forecast: number[] = [];
  
  // Calculate initial conditional variance
  let currentVariance = calculateSampleVariance(returns);
  const lastReturn = returns[returns.length - 1];
  
  for (let h = 1; h <= steps; h++) {
    if (h === 1) {
      // One-step ahead forecast
      currentVariance = model.omega + model.alpha * lastReturn * lastReturn + model.beta * currentVariance;
    } else {
      // Multi-step ahead forecast (reverts to long-run variance)
      const longRunVariance = model.omega / (1 - model.alpha - model.beta);
      const persistence = Math.pow(model.alpha + model.beta, h - 1);
      currentVariance = longRunVariance + persistence * (currentVariance - longRunVariance);
    }
    
    forecast.push(Math.sqrt(currentVariance * 252)); // Annualized volatility
  }
  
  return forecast;
}
```

## 4. Account Blow-Up Prevention Algorithms

### Kelly Criterion Implementation
```typescript
interface KellyCriterion {
  optimalFraction: number;     // Optimal bet size
  fractionOfKelly: number;     // Conservative fraction to use
  expectedGrowthRate: number;  // Expected log growth rate
  riskOfRuin: number;         // Probability of ruin
  timeToDoubleAccount: number; // Expected time to 2x account
}

function calculateKellyCriterion(
  winProbability: number,
  averageWin: number,
  averageLoss: number,
  conservativeFactor: number = 0.25
): KellyCriterion {
  // Kelly formula: f* = (bp - q) / b
  // where b = odds received (averageWin/averageLoss), p = win probability, q = loss probability
  
  const b = averageWin / Math.abs(averageLoss);
  const p = winProbability;
  const q = 1 - p;
  
  const optimalFraction = (b * p - q) / b;
  const fractionOfKelly = optimalFraction * conservativeFactor;
  
  // Expected growth rate using Kelly fraction
  const expectedGrowthRate = p * Math.log(1 + fractionOfKelly * b) + q * Math.log(1 - fractionOfKelly);
  
  // Risk of ruin calculation
  const riskOfRuin = calculateRiskOfRuin(fractionOfKelly, winProbability, b);
  
  // Time to double account
  const timeToDoubleAccount = Math.log(2) / expectedGrowthRate;
  
  return {
    optimalFraction: Math.max(0, optimalFraction), // Can't be negative
    fractionOfKelly: Math.max(0, fractionOfKelly),
    expectedGrowthRate,
    riskOfRuin,
    timeToDoubleAccount: timeToDoubleAccount > 0 ? timeToDoubleAccount : Infinity
  };
}

function calculateRiskOfRuin(
  fractionUsed: number,
  winProbability: number,
  odds: number
): number {
  // Gambler's ruin formula for Kelly betting
  if (fractionUsed <= 0) return 0;
  if (fractionUsed >= 1) return 1;
  
  const q = 1 - winProbability;
  const rho = q * (1 + fractionUsed * odds) / (winProbability * (1 - fractionUsed));
  
  if (rho >= 1) return 1; // Certain ruin
  
  // For small initial capital relative to target, approximate risk of ruin
  return Math.pow(rho, 1 / fractionUsed);
}
```

### Position Size Heat Map
```typescript
interface PositionHeatMap {
  riskLevels: RiskLevel[];
  positionSizes: number[];
  expectedOutcomes: OutcomeDistribution[];
  safeZone: { min: number; max: number };
  warningZone: { min: number; max: number };
  dangerZone: { min: number; max: number };
}

function generatePositionSizeHeatMap(
  accountSize: number,
  tradingStats: TradingStatistics,
  scenarios: number = 1000
): PositionHeatMap {
  const positionSizes = Array.from({ length: 21 }, (_, i) => i * 0.01); // 0% to 20%
  const riskLevels: RiskLevel[] = [];
  const expectedOutcomes: OutcomeDistribution[] = [];
  
  positionSizes.forEach(positionSize => {
    const outcomes = simulateTrading(accountSize, positionSize, tradingStats, scenarios);
    
    const riskLevel: RiskLevel = {
      positionSize,
      riskOfRuin: outcomes.filter(o => o.finalBalance <= accountSize * 0.5).length / scenarios,
      maxDrawdown: Math.max(...outcomes.map(o => o.maxDrawdown)),
      averageReturn: outcomes.reduce((sum, o) => sum + o.totalReturn, 0) / scenarios,
      sharpeRatio: calculateSharpeRatio(outcomes.map(o => o.totalReturn)),
      volatility: calculateVolatility(outcomes.map(o => o.totalReturn))
    };
    
    riskLevels.push(riskLevel);
    expectedOutcomes.push(analyzeOutcomeDistribution(outcomes));
  });
  
  // Define zones based on risk metrics
  const safeZone = identifySafeZone(riskLevels);
  const warningZone = identifyWarningZone(riskLevels);
  const dangerZone = identifyDangerZone(riskLevels);
  
  return {
    riskLevels,
    positionSizes,
    expectedOutcomes,
    safeZone,
    warningZone,
    dangerZone
  };
}

function simulateTrading(
  initialBalance: number,
  positionSize: number,
  stats: TradingStatistics,
  iterations: number
): TradingOutcome[] {
  const outcomes: TradingOutcome[] = [];
  
  for (let i = 0; i < iterations; i++) {
    let balance = initialBalance;
    let peak = initialBalance;
    let maxDrawdown = 0;
    const balanceHistory: number[] = [balance];
    
    // Simulate 100 trades
    for (let trade = 0; trade < 100; trade++) {
      const isWin = Math.random() < stats.winRate;
      const returnMultiple = isWin ? 
        generateRandomReturn(stats.averageWin, stats.winVolatility) :
        generateRandomReturn(stats.averageLoss, stats.lossVolatility);
      
      const positionValue = balance * positionSize;
      const pnl = positionValue * returnMultiple;
      balance += pnl;
      
      // Track drawdown
      if (balance > peak) peak = balance;
      const currentDrawdown = (peak - balance) / peak;
      maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      
      balanceHistory.push(balance);
      
      // Check for blow-up
      if (balance <= initialBalance * 0.1) break; // 90% loss = blow-up
    }
    
    outcomes.push({
      finalBalance: balance,
      totalReturn: (balance - initialBalance) / initialBalance,
      maxDrawdown,
      balanceHistory,
      blowUp: balance <= initialBalance * 0.1
    });
  }
  
  return outcomes;
}
```

### Dynamic Risk Adjustment
```typescript
interface DynamicRiskModel {
  baseRiskLevel: number;
  adjustmentFactors: {
    performance: number;       // Recent performance adjustment
    volatility: number;        // Market volatility adjustment
    correlation: number;       // Portfolio correlation adjustment
    drawdown: number;         // Current drawdown adjustment
  };
  finalRiskLevel: number;
  riskBudgetRemaining: number;
}

function calculateDynamicRiskAdjustment(
  portfolio: Portfolio,
  recentPerformance: PerformanceMetrics,
  marketConditions: MarketConditions
): DynamicRiskModel {
  const baseRiskLevel = 0.02; // 2% base risk per trade
  
  // Performance-based adjustment
  const performanceAdjustment = calculatePerformanceAdjustment(recentPerformance);
  
  // Volatility-based adjustment
  const volatilityAdjustment = calculateVolatilityAdjustment(marketConditions.volatility);
  
  // Correlation-based adjustment
  const correlationAdjustment = calculateCorrelationAdjustment(portfolio.correlations);
  
  // Drawdown-based adjustment
  const drawdownAdjustment = calculateDrawdownAdjustment(portfolio.currentDrawdown);
  
  const adjustmentFactors = {
    performance: performanceAdjustment,
    volatility: volatilityAdjustment,
    correlation: correlationAdjustment,
    drawdown: drawdownAdjustment
  };
  
  // Combine adjustments (multiplicative)
  const combinedAdjustment = Object.values(adjustmentFactors)
    .reduce((product, factor) => product * factor, 1);
  
  const finalRiskLevel = baseRiskLevel * combinedAdjustment;
  
  // Calculate remaining risk budget
  const currentRiskUsage = portfolio.positions.reduce(
    (sum, pos) => sum + pos.riskAmount, 0
  ) / portfolio.totalValue;
  
  const riskBudgetRemaining = Math.max(0, 0.10 - currentRiskUsage); // 10% max total risk
  
  return {
    baseRiskLevel,
    adjustmentFactors,
    finalRiskLevel: Math.min(finalRiskLevel, riskBudgetRemaining),
    riskBudgetRemaining
  };
}
```

## Risk Management Configuration

```typescript
const RISK_MANAGEMENT_CONFIG = {
  DRAWDOWN: {
    MAX_ACCEPTABLE: 0.20,         // 20% maximum drawdown
    WARNING_THRESHOLD: 0.15,      // 15% warning threshold
    DAILY_LIMIT: 0.05,           // 5% daily loss limit
    RECOVERY_MULTIPLIER: 2.0,     // 2x time to recover as time in drawdown
    ULCER_INDEX_LIMIT: 0.05      // 5% Ulcer Index limit
  },
  
  CORRELATION: {
    MAX_PAIRWISE: 0.70,          // 70% max pairwise correlation
    MAX_AVERAGE: 0.50,           // 50% max average correlation
    MIN_DIVERSIFICATION: 0.60,    // 60% min diversification ratio
    CONCENTRATION_LIMIT: 0.40,    // 40% max in single factor
    REBALANCE_THRESHOLD: 0.05     // 5% drift before rebalance
  },
  
  POSITION_SIZING: {
    MAX_POSITION: 0.20,          // 20% max single position
    MAX_SECTOR: 0.30,            // 30% max sector exposure
    MIN_LIQUIDITY: 100000,       // $100k min daily volume
    VOLATILITY_TARGET: 0.15,     // 15% target portfolio volatility
    KELLY_FRACTION: 0.25,        // 25% of full Kelly
    MIN_TRADES_FOR_KELLY: 30     // 30 trades minimum for Kelly calc
  },
  
  BLOW_UP_PREVENTION: {
    MAX_RISK_PER_TRADE: 0.02,    // 2% max risk per trade
    MAX_TOTAL_RISK: 0.10,        // 10% max total portfolio risk
    MIN_ACCOUNT_BALANCE: 0.50,   // 50% min account balance (stop trading)
    CONSECUTIVE_LOSS_LIMIT: 5,    // Stop after 5 consecutive losses
    DAILY_TRADE_LIMIT: 3,        // Max 3 trades per day
    WEEKLY_LOSS_LIMIT: 0.10      // 10% weekly loss limit
  }
};
```