/**
 * Paul Tudor Jones Risk Management Rules Implementation
 * Based on documented trading principles and risk management strategies
 */

export interface PTJPosition {
  symbol: string;
  entry: number;
  stop: number;
  target: number;
  size: number;
  accountSize: number;
  entryTime: Date;
  timeframe: 'SCALP' | 'SWING' | 'POSITION';
}

export interface PTJRiskMetrics {
  maxLoss: number;
  maxGain: number;
  riskReward: number;
  riskOfCapital: number;
  passesPTJRule: boolean;
  adjustedSize: number;
  violationReasons: string[];
  recommendations: string[];
}

export interface PTJSentimentIndicators {
  vixTerm: number;            // VIX term structure
  putCallRatio: number;       // CBOE put/call ratio
  aaiiBullBear: number;       // AAII bull/bear spread
  insiderSelling: number;     // Insider transaction ratio
  marginDebt: number;         // NYSE margin debt
  extremeLevel: number;       // 0-1 scale of sentiment extreme
  sentiment: 'EXTREMELY_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'EXTREMELY_BEARISH';
}

export interface PTJTechnicalSetup {
  rsiDivergence: boolean;     // RSI divergence signals
  volumeClimaxes: boolean;    // Selling/buying climaxes
  supportResistance: number;  // Key level tests (0-1)
  trendlineBreak: boolean;    // Trendline breaks
  setupQuality: number;       // Overall setup quality (0-1)
  entryLevel: number;
  stopLevel: number;
  targetLevel: number;
}

export interface PTJMacroBackdrop {
  fedPolicy: number;          // Fed policy stance (-1 to 1)
  liquidityConditions: number; // Market liquidity (0-1)
  geopoliticalRisk: number;   // Risk-off potential (0-1)
  overall: number;            // Combined macro score (0-1)
}

export interface PTJContrarian {
  sentimentIndicators: PTJSentimentIndicators;
  technicalSetups: PTJTechnicalSetup;
  macroBackdrop: PTJMacroBackdrop;
}

export interface PTJSignal {
  direction: 'LONG' | 'SHORT' | 'WAIT';
  entry?: number;
  stop?: number;
  target?: number;
  conviction: number; // 0-1
  positionSize?: number;
  timeframe: 'SCALP' | 'SWING' | 'POSITION';
  reasoning?: string;
}

export interface PTJRuleValidation {
  ruleName: string;
  passes: boolean;
  currentValue: number;
  requiredValue: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export class PTJRulesService {
  // PTJ's core rule constants
  private static readonly MIN_RISK_REWARD = 5; // 5:1 minimum
  private static readonly MAX_RISK_PERCENT = 0.01; // 1% max risk
  private static readonly MIN_CONVICTION_THRESHOLD = 0.7; // 70% conviction minimum
  private static readonly EXTREME_SENTIMENT_THRESHOLD = 0.8; // 80% for extreme readings
  private static readonly MIN_TECHNICAL_QUALITY = 0.7; // 70% setup quality minimum

  /**
   * PTJ's 5:1 Rule - Never risk more than 1% to make less than 5%
   */
  public static validatePTJ51Rule(position: PTJPosition): PTJRiskMetrics {
    const maxLoss = Math.abs(position.entry - position.stop) * position.size;
    const maxGain = Math.abs(position.target - position.entry) * position.size;
    const riskReward = maxGain / maxLoss;
    const riskOfCapital = maxLoss / position.accountSize;
    
    const violationReasons: string[] = [];
    const recommendations: string[] = [];
    
    // Check risk/reward ratio
    if (riskReward < this.MIN_RISK_REWARD) {
      violationReasons.push(`Risk/reward ratio ${riskReward.toFixed(1)}:1 is below PTJ minimum of ${this.MIN_RISK_REWARD}:1`);
      recommendations.push('Increase profit target or tighten stop loss to improve risk/reward');
    }
    
    // Check capital risk
    if (riskOfCapital > this.MAX_RISK_PERCENT) {
      violationReasons.push(`Risk of ${(riskOfCapital * 100).toFixed(2)}% exceeds PTJ maximum of ${this.MAX_RISK_PERCENT * 100}%`);
      recommendations.push('Reduce position size to limit capital risk to 1%');
    }
    
    const passesPTJRule = riskReward >= this.MIN_RISK_REWARD && riskOfCapital <= this.MAX_RISK_PERCENT;
    
    // Calculate adjusted size that would meet PTJ criteria
    const maxAllowableRisk = position.accountSize * this.MAX_RISK_PERCENT;
    const stopDistance = Math.abs(position.entry - position.stop);
    const adjustedSize = passesPTJRule ? position.size : 
      Math.floor(maxAllowableRisk / stopDistance);
    
    if (!passesPTJRule) {
      recommendations.push('Consider waiting for a better setup that meets PTJ criteria');
      recommendations.push('Focus on high-probability, high-reward setups only');
    }

    return {
      maxLoss,
      maxGain,
      riskReward,
      riskOfCapital,
      passesPTJRule,
      adjustedSize,
      violationReasons,
      recommendations
    };
  }

  /**
   * PTJ Contrarian Signal Generation
   * Looks for extreme sentiment + high-quality technical setup
   */
  public static generatePTJContrarian(
    sentiment: PTJSentimentIndicators,
    technical: PTJTechnicalSetup,
    macro: PTJMacroBackdrop,
    timeframe: 'SCALP' | 'SWING' | 'POSITION' = 'SWING'
  ): PTJSignal {
    
    // PTJ looks for extreme sentiment + technical setup
    if (sentiment.extremeLevel > this.EXTREME_SENTIMENT_THRESHOLD && 
        technical.setupQuality > this.MIN_TECHNICAL_QUALITY) {
      
      const direction = sentiment.sentiment === 'EXTREMELY_BULLISH' ? 'SHORT' : 'LONG';
      const conviction = (sentiment.extremeLevel + technical.setupQuality) / 2;
      
      const signal: PTJSignal = {
        direction,
        entry: technical.entryLevel,
        stop: technical.stopLevel,
        target: technical.targetLevel,
        conviction,
        positionSize: this.calculatePTJPositionSize(sentiment, technical, macro),
        timeframe,
        reasoning: `PTJ Contrarian: ${sentiment.sentiment} sentiment (${(sentiment.extremeLevel * 100).toFixed(0)}%) + ${(technical.setupQuality * 100).toFixed(0)}% quality setup`
      };
      
      return signal;
    }
    
    return { 
      direction: 'WAIT', 
      conviction: 0, 
      timeframe,
      reasoning: 'Waiting for extreme sentiment + high-quality technical setup combination'
    };
  }

  /**
   * Calculate PTJ-style position size based on conviction and conditions
   */
  private static calculatePTJPositionSize(
    sentiment: PTJSentimentIndicators,
    technical: PTJTechnicalSetup,
    macro: PTJMacroBackdrop
  ): number {
    let baseSize = 0.01; // Start with 1% max risk
    
    // Adjust based on conviction
    const conviction = (sentiment.extremeLevel + technical.setupQuality) / 2;
    baseSize *= conviction;
    
    // Adjust based on macro conditions
    if (macro.overall > 0.7) {
      baseSize *= 1.2; // Increase size in favorable macro environment
    } else if (macro.overall < 0.3) {
      baseSize *= 0.8; // Reduce size in unfavorable macro environment
    }
    
    // PTJ never risks more than 1% regardless of conviction
    return Math.min(baseSize, 0.01);
  }

  /**
   * Analyze sentiment indicators for extreme readings
   */
  public static analyzeSentimentExtremes(data: {
    vix: number;
    putCallRatio: number;
    aaiiBullishPercent: number;
    aaiiBearishPercent: number;
    insiderBuyingSelling: number;
    marginDebt: number;
  }): PTJSentimentIndicators {
    
    const indicators = {
      vixTerm: this.normalizeVIXTerm(data.vix),
      putCallRatio: this.normalizePutCallRatio(data.putCallRatio),
      aaiiBullBear: this.normalizeAAIISentiment(data.aaiiBullishPercent, data.aaiiBearishPercent),
      insiderSelling: this.normalizeInsiderActivity(data.insiderBuyingSelling),
      marginDebt: this.normalizeMarginDebt(data.marginDebt),
      extremeLevel: 0,
      sentiment: 'NEUTRAL' as const
    };
    
    // Calculate composite extreme level
    const sentimentScores = [
      indicators.vixTerm,
      indicators.putCallRatio,
      indicators.aaiiBullBear,
      indicators.insiderSelling,
      indicators.marginDebt
    ];
    
    const avgScore = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    indicators.extremeLevel = Math.abs(avgScore - 0.5) * 2; // Convert to 0-1 extreme scale
    
    // Determine overall sentiment
    if (avgScore > 0.8) {
      indicators.sentiment = 'EXTREMELY_BULLISH';
    } else if (avgScore > 0.6) {
      indicators.sentiment = 'BULLISH';
    } else if (avgScore < 0.2) {
      indicators.sentiment = 'EXTREMELY_BEARISH';
    } else if (avgScore < 0.4) {
      indicators.sentiment = 'BEARISH';
    } else {
      indicators.sentiment = 'NEUTRAL';
    }
    
    return indicators;
  }

  /**
   * Validate all PTJ rules for a given trade setup
   */
  public static validateAllPTJRules(
    position: PTJPosition,
    sentiment?: PTJSentimentIndicators,
    technical?: PTJTechnicalSetup
  ): PTJRuleValidation[] {
    const validations: PTJRuleValidation[] = [];
    
    // 5:1 Risk/Reward Rule
    const riskMetrics = this.validatePTJ51Rule(position);
    validations.push({
      ruleName: 'PTJ 5:1 Risk/Reward Rule',
      passes: riskMetrics.passesPTJRule,
      currentValue: riskMetrics.riskReward,
      requiredValue: this.MIN_RISK_REWARD,
      severity: riskMetrics.passesPTJRule ? 'info' : 'critical',
      message: riskMetrics.passesPTJRule 
        ? `Risk/reward ratio of ${riskMetrics.riskReward.toFixed(1)}:1 meets PTJ standards`
        : `Risk/reward ratio of ${riskMetrics.riskReward.toFixed(1)}:1 violates PTJ 5:1 rule`
    });
    
    // 1% Maximum Risk Rule
    validations.push({
      ruleName: 'PTJ 1% Maximum Risk Rule',
      passes: riskMetrics.riskOfCapital <= this.MAX_RISK_PERCENT,
      currentValue: riskMetrics.riskOfCapital * 100,
      requiredValue: this.MAX_RISK_PERCENT * 100,
      severity: riskMetrics.riskOfCapital <= this.MAX_RISK_PERCENT ? 'info' : 'critical',
      message: riskMetrics.riskOfCapital <= this.MAX_RISK_PERCENT
        ? `Capital risk of ${(riskMetrics.riskOfCapital * 100).toFixed(2)}% is within PTJ limits`
        : `Capital risk of ${(riskMetrics.riskOfCapital * 100).toFixed(2)}% exceeds PTJ 1% maximum`
    });
    
    // Contrarian Setup Quality (if provided)
    if (sentiment && technical) {
      const hasExtremeSetup = sentiment.extremeLevel > this.EXTREME_SENTIMENT_THRESHOLD && 
                             technical.setupQuality > this.MIN_TECHNICAL_QUALITY;
      
      validations.push({
        ruleName: 'PTJ Contrarian Setup Quality',
        passes: hasExtremeSetup,
        currentValue: (sentiment.extremeLevel + technical.setupQuality) / 2 * 100,
        requiredValue: 75,
        severity: hasExtremeSetup ? 'info' : 'warning',
        message: hasExtremeSetup
          ? 'Setup meets PTJ contrarian criteria with extreme sentiment and high technical quality'
          : 'Setup lacks extreme sentiment or high technical quality for PTJ contrarian approach'
      });
    }
    
    return validations;
  }

  /**
   * Generate PTJ-style position sizing recommendations
   */
  public static generatePositionSizingRecommendations(
    accountSize: number,
    stopDistance: number,
    conviction: number = 0.8,
    marketConditions: 'FAVORABLE' | 'NEUTRAL' | 'UNFAVORABLE' = 'NEUTRAL'
  ): {
    conservative: number;
    standard: number;
    aggressive: number;
    ptjRecommended: number;
    reasoning: string;
  } {
    
    const maxRisk = accountSize * this.MAX_RISK_PERCENT;
    const baseSize = maxRisk / stopDistance;
    
    let ptjRecommended = baseSize * conviction;
    
    // Adjust for market conditions
    switch (marketConditions) {
      case 'FAVORABLE':
        ptjRecommended *= 1.0; // No increase - PTJ stays disciplined
        break;
      case 'UNFAVORABLE':
        ptjRecommended *= 0.7; // Reduce size in poor conditions
        break;
      default:
        ptjRecommended *= 0.8; // Slightly conservative as default
    }
    
    // Never exceed maximum position size
    ptjRecommended = Math.min(ptjRecommended, baseSize);
    
    return {
      conservative: baseSize * 0.5,
      standard: baseSize * 0.8,
      aggressive: baseSize,
      ptjRecommended,
      reasoning: `PTJ recommended size based on ${(conviction * 100).toFixed(0)}% conviction and ${marketConditions.toLowerCase()} market conditions`
    };
  }

  // Helper methods for normalizing sentiment indicators
  private static normalizeVIXTerm(vix: number): number {
    // VIX > 30 = fear (contrarian bullish), VIX < 15 = complacency (contrarian bearish)
    if (vix > 30) return 0.1; // Extreme fear
    if (vix > 25) return 0.3; // High fear
    if (vix < 15) return 0.9; // Extreme complacency
    if (vix < 20) return 0.7; // Low fear
    return 0.5; // Neutral
  }
  
  private static normalizePutCallRatio(ratio: number): number {
    // High put/call ratio = bearish sentiment (contrarian bullish)
    if (ratio > 1.2) return 0.1; // Extreme bearishness
    if (ratio > 1.0) return 0.3; // High bearishness
    if (ratio < 0.7) return 0.9; // Extreme bullishness
    if (ratio < 0.8) return 0.7; // High bullishness
    return 0.5; // Neutral
  }
  
  private static normalizeAAIISentiment(bullish: number, bearish: number): number {
    const spread = bullish - bearish;
    // Large positive spread = extreme bullishness (contrarian bearish)
    if (spread > 30) return 0.9; // Extreme bullishness
    if (spread > 15) return 0.7; // High bullishness
    if (spread < -30) return 0.1; // Extreme bearishness
    if (spread < -15) return 0.3; // High bearishness
    return 0.5; // Neutral
  }
  
  private static normalizeInsiderActivity(buyingSelling: number): number {
    // High selling ratio = bearish insider sentiment
    if (buyingSelling < 0.3) return 0.9; // Heavy insider selling (contrarian bearish)
    if (buyingSelling < 0.5) return 0.7; // Moderate selling
    if (buyingSelling > 0.8) return 0.1; // Heavy insider buying (contrarian bullish)
    if (buyingSelling > 0.6) return 0.3; // Moderate buying
    return 0.5; // Neutral
  }
  
  private static normalizeMarginDebt(debt: number): number {
    // This would need historical context - simplified here
    // High margin debt typically indicates excessive bullishness
    return debt > 600 ? 0.8 : debt < 400 ? 0.2 : 0.5; // Billions
  }

  /**
   * Get PTJ-style trading rules summary
   */
  public static getPTJRulesSummary(): {
    title: string;
    rules: Array<{
      name: string;
      description: string;
      threshold: string;
      importance: 'critical' | 'high' | 'medium';
    }>;
  } {
    return {
      title: 'Paul Tudor Jones Risk Management Rules',
      rules: [
        {
          name: '5:1 Risk/Reward Minimum',
          description: 'Never risk more than 1% to make less than 5%',
          threshold: '5:1 minimum ratio',
          importance: 'critical'
        },
        {
          name: '1% Maximum Risk Per Trade',
          description: 'Never risk more than 1% of total capital on any single trade',
          threshold: '1% of account value',
          importance: 'critical'
        },
        {
          name: 'Contrarian Extreme Sentiment',
          description: 'Look for extreme sentiment readings as entry signals',
          threshold: '80%+ extreme readings',
          importance: 'high'
        },
        {
          name: 'High-Quality Technical Setups',
          description: 'Only trade A+ technical setups with clear risk/reward',
          threshold: '70%+ setup quality',
          importance: 'high'
        },
        {
          name: 'Macro Condition Awareness',
          description: 'Adjust position sizes based on overall market conditions',
          threshold: 'Favorable/Neutral/Unfavorable',
          importance: 'medium'
        }
      ]
    };
  }
}

export default PTJRulesService;