# Famous Trader Strategy Criteria Specification

## 1. Warren Buffett - Value Investing Screening Criteria

### Core Value Metrics
```typescript
interface BuffettScreeningCriteria {
  financialHealth: {
    debtToEquity: number;        // < 0.5 preferred
    currentRatio: number;        // > 1.5 preferred
    returnOnEquity: number;      // > 15% required
    returnOnAssets: number;      // > 7% preferred
  };
  profitability: {
    netProfitMargin: number;     // > 10% preferred
    grossProfitMargin: number;   // > 40% preferred
    operatingMargin: number;     // > 15% preferred
    earningsGrowth5Year: number; // > 10% annual
  };
  valuation: {
    peRatio: number;            // < 20 preferred
    pbRatio: number;            // < 3 preferred
    pegRatio: number;           // < 1.5 preferred
    priceToSales: number;       // < 2.5 preferred
  };
  moatIndicators: {
    brandStrength: number;       // Qualitative score 1-10
    marketShare: number;         // % of market
    switchingCosts: number;      // Score 1-10
    networkEffects: number;      // Score 1-10
  };
}

function evaluateBuffettCriteria(stock: StockData): BuffettEvaluation {
  const score = calculateBuffettScore(stock);
  
  return {
    overallScore: score,
    rating: getBuffettRating(score),
    strengths: identifyStrengths(stock),
    weaknesses: identifyWeaknesses(stock),
    investmentThesis: generateInvestmentThesis(stock),
    intrinsicValue: calculateIntrinsicValue(stock),
    marginOfSafety: calculateMarginOfSafety(stock)
  };
}

function calculateBuffettScore(stock: StockData): number {
  let score = 0;
  const weights = BUFFETT_WEIGHTS;
  
  // Financial Health (30% weight)
  score += evaluateFinancialHealth(stock) * weights.financialHealth;
  
  // Profitability (25% weight)
  score += evaluateProfitability(stock) * weights.profitability;
  
  // Valuation (20% weight)
  score += evaluateValuation(stock) * weights.valuation;
  
  // Moat Quality (25% weight)
  score += evaluateMoat(stock) * weights.moat;
  
  return Math.round(score);
}

function calculateIntrinsicValue(stock: StockData): number {
  // Discounted Cash Flow Model
  const fcf = stock.freeCashFlow;
  const growthRate = estimateGrowthRate(stock);
  const discountRate = 0.10; // 10% required return
  const terminalGrowthRate = 0.03; // 3% perpetual growth
  
  // 10-year DCF projection
  let intrinsicValue = 0;
  for (let year = 1; year <= 10; year++) {
    const projectedFCF = fcf * Math.pow(1 + growthRate, year);
    const presentValue = projectedFCF / Math.pow(1 + discountRate, year);
    intrinsicValue += presentValue;
  }
  
  // Terminal value
  const terminalFCF = fcf * Math.pow(1 + growthRate, 10) * (1 + terminalGrowthRate);
  const terminalValue = terminalFCF / (discountRate - terminalGrowthRate);
  const presentTerminalValue = terminalValue / Math.pow(1 + discountRate, 10);
  
  intrinsicValue += presentTerminalValue;
  
  // Per share value
  return intrinsicValue / stock.sharesOutstanding;
}
```

### Moat Quality Assessment
```typescript
interface MoatEvaluation {
  type: 'BRAND' | 'COST_ADVANTAGE' | 'NETWORK_EFFECT' | 'SWITCHING_COSTS' | 'REGULATORY';
  strength: 'NARROW' | 'WIDE' | 'VERY_WIDE';
  durability: number; // Years expected to maintain advantage
  competitivePosition: 'LEADER' | 'CHALLENGER' | 'FOLLOWER';
}

function evaluateMoat(stock: StockData): MoatEvaluation {
  const indicators = {
    brandStrength: calculateBrandStrength(stock),
    costAdvantage: calculateCostAdvantage(stock),
    networkEffect: calculateNetworkEffect(stock),
    switchingCosts: calculateSwitchingCosts(stock),
    regulatoryBarriers: calculateRegulatoryBarriers(stock)
  };
  
  const dominantMoat = Object.entries(indicators)
    .reduce((a, b) => a[1] > b[1] ? a : b);
  
  return {
    type: dominantMoat[0].toUpperCase() as any,
    strength: getMoatStrength(dominantMoat[1]),
    durability: estimateMoatDurability(stock, dominantMoat[0]),
    competitivePosition: assessCompetitivePosition(stock)
  };
}
```

## 2. George Soros - Reflexivity Theory Application

### Macro Economic Indicators
```typescript
interface SorosReflexivityModel {
  fundamentals: {
    economicGrowth: number;      // GDP growth rate
    inflation: number;           // CPI year-over-year
    interestRates: number;       // 10-year treasury yield
    currencyStrength: number;    // DXY index
    commodityPrices: number;     // CRB index
  };
  perceptions: {
    sentimentIndex: number;      // Market sentiment score
    mediaAttention: number;      // News volume/sentiment
    institutionalFlows: number;  // Money flows
    retailParticipation: number; // Retail investor activity
  };
  feedback: {
    priceAction: number;         // Recent price momentum
    volumeConfirmation: number;  // Volume analysis
    correlationBreakdown: number; // Cross-asset correlations
    volatilityRegime: number;    // VIX and realized vol
  };
}

function applySorosReflexivity(
  asset: AssetData,
  macroData: MacroData,
  timeframe: 'SHORT' | 'MEDIUM' | 'LONG'
): SorosSignal {
  
  const fundamentalValue = calculateFundamentalValue(asset, macroData);
  const perceivedValue = calculatePerceivedValue(asset, macroData);
  const reflexivityGap = perceivedValue - fundamentalValue;
  
  const signal = {
    direction: reflexivityGap > 0 ? 'SELL' : 'BUY',
    strength: Math.abs(reflexivityGap) / fundamentalValue,
    conviction: calculateConviction(asset, macroData, reflexivityGap),
    timeHorizon: estimateTimeHorizon(reflexivityGap, timeframe),
    riskLevel: assessReflexivityRisk(asset, macroData)
  };
  
  return signal;
}

function detectReflexivityTrend(priceHistory: PriceData[], fundamentals: FundamentalData[]): ReflexivityTrend {
  const phases = ['UNRECOGNIZED', 'ACCELERATION', 'CLIMAX', 'REVERSAL'];
  
  // Calculate price-to-fundamental ratio over time
  const ratios = priceHistory.map((price, i) => ({
    date: price.date,
    ratio: price.close / fundamentals[i].fairValue,
    volume: price.volume
  }));
  
  // Identify trend phase
  const currentPhase = identifyTrendPhase(ratios);
  const momentum = calculateMomentum(ratios);
  
  return {
    phase: currentPhase,
    momentum,
    reversalProbability: calculateReversalProbability(ratios, currentPhase),
    recommendedAction: getReflexivityAction(currentPhase, momentum)
  };
}
```

### Currency Trading Signals
```typescript
interface SorosCurrencyStrategy {
  fundamentalAnalysis: {
    interestRateDifferential: number;
    inflationDifferential: number;
    currentAccountBalance: number;
    fiscalDeficit: number;
    politicalStability: number;
  };
  technicalFactors: {
    momentum: number;
    support: number;
    resistance: number;
    volatility: number;
  };
  marketStructure: {
    positioning: number;        // COT data
    flows: number;             // Capital flows
    central_bank_intervention: boolean;
  };
}

function generateSorosCurrencySignal(pair: CurrencyPair): CurrencySignal {
  const fundamental = analyzeFundamentals(pair);
  const technical = analyzeTechnicals(pair);
  const structure = analyzeMarketStructure(pair);
  
  // Soros looks for fundamental-technical divergences
  const divergence = identifyDivergence(fundamental, technical);
  
  if (divergence.strength > 0.7) {
    return {
      action: divergence.direction === 'BULLISH' ? 'BUY' : 'SELL',
      conviction: 'HIGH',
      positionSize: 0.05, // 5% of capital
      stopLoss: calculateVolatilityStop(pair),
      target: calculateDivergenceTarget(pair, divergence),
      reasoning: `Fundamental-technical divergence detected: ${divergence.reason}`
    };
  }
  
  return { action: 'WAIT', conviction: 'LOW' };
}
```

## 3. Ray Dalio - All Weather / Risk Parity Strategy

### Risk Parity Allocation Model
```typescript
interface DalioRiskParityModel {
  assetClasses: {
    stocks: number;              // Growth assets
    bonds: number;               // Defensive assets
    commodities: number;         // Inflation hedge
    currencies: number;          // Deflation hedge
  };
  economicEnvironments: {
    growth_rising: number;       // Probability 0-1
    growth_falling: number;
    inflation_rising: number;
    inflation_falling: number;
  };
  riskContributions: {
    target: number[];           // Target risk contribution per asset
    actual: number[];           // Actual risk contribution
    rebalanceThreshold: number; // When to rebalance
  };
}

function calculateRiskParityWeights(
  assets: AssetData[],
  correlationMatrix: number[][],
  targetRisk: number = 0.10
): RiskParityAllocation {
  
  const n = assets.length;
  const weights = new Array(n).fill(1/n); // Start with equal weights
  
  // Iterative optimization to achieve equal risk contribution
  for (let iteration = 0; iteration < 100; iteration++) {
    const riskContributions = calculateRiskContributions(weights, correlationMatrix, assets);
    const adjustments = calculateWeightAdjustments(riskContributions, targetRisk);
    
    // Update weights
    for (let i = 0; i < n; i++) {
      weights[i] *= adjustments[i];
    }
    
    // Normalize weights to sum to 1
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    weights.forEach((w, i) => weights[i] = w / totalWeight);
    
    // Check for convergence
    const maxDeviation = Math.max(...riskContributions.map(rc => Math.abs(rc - 1/n)));
    if (maxDeviation < 0.001) break;
  }
  
  return {
    weights,
    expectedRisk: calculatePortfolioRisk(weights, correlationMatrix, assets),
    expectedReturn: calculatePortfolioReturn(weights, assets),
    sharpeRatio: calculateSharpeRatio(weights, assets, correlationMatrix),
    riskContributions: calculateRiskContributions(weights, correlationMatrix, assets)
  };
}

function adjustForEconomicRegime(
  baseAllocation: RiskParityAllocation,
  economicIndicators: EconomicIndicators
): DalioAllocation {
  
  const regimeProbabilities = calculateRegimeProbabilities(economicIndicators);
  
  // Adjust allocation based on regime
  const adjustments = {
    growth_rising: { stocks: 1.2, bonds: 0.8, commodities: 1.0, currencies: 0.9 },
    growth_falling: { stocks: 0.7, bonds: 1.3, commodities: 0.9, currencies: 1.1 },
    inflation_rising: { stocks: 0.9, bonds: 0.6, commodities: 1.5, currencies: 1.0 },
    inflation_falling: { stocks: 1.1, bonds: 1.2, commodities: 0.7, currencies: 1.0 }
  };
  
  let adjustedWeights = [...baseAllocation.weights];
  
  Object.entries(regimeProbabilities).forEach(([regime, probability]) => {
    const regimeAdjustments = adjustments[regime];
    Object.entries(regimeAdjustments).forEach(([asset, multiplier]) => {
      const assetIndex = getAssetIndex(asset);
      adjustedWeights[assetIndex] *= (1 + (multiplier - 1) * probability);
    });
  });
  
  // Renormalize
  const totalWeight = adjustedWeights.reduce((sum, w) => sum + w, 0);
  adjustedWeights = adjustedWeights.map(w => w / totalWeight);
  
  return {
    baseWeights: baseAllocation.weights,
    adjustedWeights,
    regimeProbabilities,
    expectedPerformance: calculateExpectedPerformance(adjustedWeights, regimeProbabilities)
  };
}
```

### Economic Cycle Analysis
```typescript
interface EconomicCycleModel {
  indicators: {
    gdpGrowth: number;
    employmentGrowth: number;
    inflationRate: number;
    yieldCurveShape: number;
    creditSpreads: number;
    commodityPrices: number;
  };
  cyclePhase: 'EXPANSION' | 'PEAK' | 'CONTRACTION' | 'TROUGH';
  confidence: number;
  timeInPhase: number; // months
  expectedDuration: number; // months remaining
}

function analyzeDalioEconomicCycle(indicators: EconomicIndicators): EconomicCycleModel {
  const normalizedIndicators = normalizeIndicators(indicators);
  const cycleScore = calculateCycleScore(normalizedIndicators);
  
  const phase = identifyPhase(cycleScore);
  const confidence = calculatePhaseConfidence(normalizedIndicators, phase);
  
  return {
    indicators: normalizedIndicators,
    cyclePhase: phase,
    confidence,
    timeInPhase: estimateTimeInPhase(indicators, phase),
    expectedDuration: estimateRemainingDuration(indicators, phase)
  };
}
```

## 4. Paul Tudor Jones - Contrarian Signals and Risk Management

### Contrarian Signal Generation
```typescript
interface PTJContrarian {
  sentimentIndicators: {
    vixTerm: number;            // VIX term structure
    putCallRatio: number;       // CBOE put/call ratio
    aaiiBullBear: number;       // AAII bull/bear spread
    insiderSelling: number;     // Insider transaction ratio
    marginDebt: number;         // NYSE margin debt
  };
  technicalSetups: {
    rsiDivergence: boolean;     // RSI divergence signals
    volumeClimaxes: boolean;    // Selling/buying climaxes
    supportResistance: number;  // Key level tests
    trendline: boolean;         // Trendline breaks
  };
  macroBackdrop: {
    fedPolicy: number;          // Fed policy stance
    liquidityConditions: number; // Market liquidity
    geopoliticalRisk: number;   // Risk-off potential
  };
}

function generatePTJContrarian(
  market: MarketData,
  sentiment: SentimentData,
  timeframe: 'SCALP' | 'SWING' | 'POSITION'
): PTJSignal {
  
  const contrarian = analyzeContrarian(sentiment);
  const technical = analyzeTechnical(market);
  const macro = analyzeMacro(market);
  
  // PTJ looks for extreme sentiment + technical setup
  if (contrarian.extremeLevel > 0.8 && technical.setupQuality > 0.7) {
    const signal = {
      direction: contrarian.sentiment === 'EXTREMELY_BULLISH' ? 'SHORT' : 'LONG',
      entry: technical.entryLevel,
      stop: technical.stopLevel,
      target: technical.targetLevel,
      conviction: (contrarian.extremeLevel + technical.setupQuality) / 2,
      positionSize: calculatePTJPositionSize(contrarian, technical, macro),
      timeframe
    };
    
    return signal;
  }
  
  return { direction: 'WAIT', conviction: 0 };
}

function calculatePTJRiskMetrics(position: Position, market: MarketData): PTJRiskMetrics {
  const maxLoss = position.size * Math.abs(position.entry - position.stop);
  const maxGain = position.size * Math.abs(position.target - position.entry);
  const riskReward = maxGain / maxLoss;
  
  // PTJ's 5:1 rule - never risk more than 1% to make less than 5%
  const passesPTJRule = riskReward >= 5 && (maxLoss / position.accountSize) <= 0.01;
  
  return {
    maxLoss,
    maxGain,
    riskReward,
    riskOfCapital: maxLoss / position.accountSize,
    passesPTJRule,
    adjustedSize: passesPTJRule ? position.size : 
      Math.floor((position.accountSize * 0.01) / Math.abs(position.entry - position.stop))
  };
}
```

### Macro Momentum Strategy
```typescript
interface PTJMacroMomentum {
  trends: {
    primary: 'UP' | 'DOWN' | 'SIDEWAYS';
    secondary: 'UP' | 'DOWN' | 'SIDEWAYS';
    strength: number; // 0-1
    duration: number; // days
  };
  momentum: {
    price: number;    // Price momentum score
    volume: number;   // Volume momentum score
    breadth: number;  // Market breadth score
  };
  regime: {
    volatility: 'LOW' | 'NORMAL' | 'HIGH';
    correlation: 'LOW' | 'NORMAL' | 'HIGH';
    liquidity: 'ABUNDANT' | 'NORMAL' | 'SCARCE';
  };
}

function analyzePTJMacroMomentum(data: MacroData): PTJMacroSignal {
  const trends = identifyMacroTrends(data);
  const momentum = calculateMacroMomentum(data);
  const regime = assessMarketRegime(data);
  
  // PTJ trades with the trend but watches for regime changes
  const signal = {
    primaryDirection: trends.primary,
    confidence: trends.strength * momentum.composite,
    allocation: calculateMacroAllocation(trends, momentum, regime),
    hedges: identifyRequiredHedges(trends, regime),
    timeHorizon: estimateTimeHorizon(trends, momentum)
  };
  
  return signal;
}
```

## Strategy Implementation Constants

```typescript
const FAMOUS_TRADER_CONFIG = {
  BUFFETT: {
    MIN_ROE: 0.15,              // 15% minimum ROE
    MAX_PE: 20,                 // Maximum P/E ratio
    MIN_PROFIT_MARGIN: 0.10,    // 10% minimum net margin
    MAX_DEBT_EQUITY: 0.5,       // 50% maximum debt/equity
    MIN_CURRENT_RATIO: 1.5,     // 1.5x minimum current ratio
    DISCOUNT_RATE: 0.10,        // 10% DCF discount rate
    MARGIN_OF_SAFETY: 0.25      // 25% margin of safety required
  },
  
  SOROS: {
    REFLEXIVITY_THRESHOLD: 0.20, // 20% deviation threshold
    MAX_POSITION_SIZE: 0.10,     // 10% max position size
    CORRELATION_THRESHOLD: 0.70, // High correlation threshold
    VOLATILITY_MULTIPLIER: 2.0,  // Stop loss multiplier
    MIN_CONVICTION: 0.70         // Minimum conviction level
  },
  
  DALIO: {
    TARGET_VOLATILITY: 0.10,     // 10% target portfolio vol
    REBALANCE_THRESHOLD: 0.05,   // 5% drift threshold
    MIN_CORRELATION: -0.30,      // Minimum diversification
    MAX_ASSET_WEIGHT: 0.40,      // 40% maximum asset weight
    RISK_CONTRIBUTION_TOLERANCE: 0.02 // 2% risk contribution tolerance
  },
  
  PTJ: {
    MIN_RISK_REWARD: 5.0,        // 5:1 minimum risk/reward
    MAX_RISK_PER_TRADE: 0.01,    // 1% maximum risk per trade
    SENTIMENT_EXTREME: 0.80,     // 80% sentiment extreme threshold
    MIN_SETUP_QUALITY: 0.70,     // 70% minimum technical setup quality
    MAX_CORRELATION: 0.60        // Maximum position correlation
  }
};
```