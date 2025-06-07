/**
 * Position Sizing Best Practices Database
 * 
 * This module contains industry best practices, guidelines, and recommendations
 * for position sizing across different asset classes, trading strategies, and market conditions.
 * 
 * Sources: Professional trading literature, risk management standards, and industry research.
 * Note: These are educational guidelines, not financial advice.
 */

export interface BestPracticeRule {
  id: string;
  category: 'risk_management' | 'position_sizing' | 'asset_specific' | 'strategy_specific' | 'market_conditions';
  title: string;
  description: string;
  recommendation: {
    maxPositionSize?: number; // percentage
    maxTotalExposure?: number; // percentage
    riskPerTrade?: number; // percentage
    notes?: string;
  };
  applicableFor: {
    assetClasses?: string[];
    tradingStrategies?: string[];
    riskProfiles?: string[];
    experienceLevels?: string[];
    marketConditions?: string[];
  };
  severity: 'guideline' | 'recommended' | 'critical';
  source: string;
}

export interface PositionSizingStandards {
  conservative: {
    maxPositionSize: number;
    maxTotalExposure: number;
    riskPerTrade: number;
    description: string;
  };
  moderate: {
    maxPositionSize: number;
    maxTotalExposure: number;
    riskPerTrade: number;
    description: string;
  };
  aggressive: {
    maxPositionSize: number;
    maxTotalExposure: number;
    riskPerTrade: number;
    description: string;
  };
}

// Industry-standard position sizing guidelines
export const POSITION_SIZING_STANDARDS: PositionSizingStandards = {
  conservative: {
    maxPositionSize: 2,
    maxTotalExposure: 15,
    riskPerTrade: 0.5,
    description: 'Capital preservation focused, suitable for beginners or risk-averse traders'
  },
  moderate: {
    maxPositionSize: 5,
    maxTotalExposure: 25,
    riskPerTrade: 1.0,
    description: 'Balanced approach for experienced traders with moderate risk tolerance'
  },
  aggressive: {
    maxPositionSize: 10,
    maxTotalExposure: 40,
    riskPerTrade: 2.0,
    description: 'Growth-focused for experienced traders willing to accept higher volatility'
  }
};

// Comprehensive best practices database
export const POSITION_SIZING_BEST_PRACTICES: BestPracticeRule[] = [
  {
    id: 'RISK_001',
    category: 'risk_management',
    title: 'Never Risk More Than 1-2% Per Trade',
    description: 'Professional traders typically limit risk to 1-2% of total capital per individual trade to preserve capital and maintain longevity in trading.',
    recommendation: {
      riskPerTrade: 1.5,
      notes: 'This is the most fundamental rule in professional trading'
    },
    applicableFor: {
      tradingStrategies: ['day_trading', 'swing_trading', 'position_trading'],
      riskProfiles: ['conservative', 'moderate', 'aggressive'],
      experienceLevels: ['beginner', 'intermediate', 'advanced']
    },
    severity: 'critical',
    source: 'Van Tharp - Trade Your Way to Financial Freedom'
  },
  {
    id: 'RISK_002',
    category: 'risk_management',
    title: 'Diversification Limits',
    description: 'Avoid concentration risk by limiting individual positions and maintaining proper diversification across sectors and assets.',
    recommendation: {
      maxPositionSize: 5,
      maxTotalExposure: 25,
      notes: 'No single position should dominate your portfolio'
    },
    applicableFor: {
      assetClasses: ['stocks', 'etfs'],
      riskProfiles: ['conservative', 'moderate']
    },
    severity: 'recommended',
    source: 'Modern Portfolio Theory - Harry Markowitz'
  },
  {
    id: 'POS_001',
    category: 'position_sizing',
    title: 'Position Size Based on Volatility',
    description: 'Adjust position sizes inversely to volatility - smaller positions for more volatile assets, larger for stable assets.',
    recommendation: {
      notes: 'Use volatility-adjusted position sizing for optimal risk management'
    },
    applicableFor: {
      assetClasses: ['stocks', 'crypto', 'forex', 'futures'],
      tradingStrategies: ['swing_trading', 'position_trading']
    },
    severity: 'recommended',
    source: 'Volatility-Based Position Sizing - Academic Research'
  },
  {
    id: 'AST_001',
    category: 'asset_specific',
    title: 'Cryptocurrency Position Limits',
    description: 'Crypto assets require significantly smaller position sizes due to extreme volatility and market immaturity.',
    recommendation: {
      maxPositionSize: 2,
      maxTotalExposure: 10,
      riskPerTrade: 0.5,
      notes: 'Crypto markets can move 10-50% in a single day'
    },
    applicableFor: {
      assetClasses: ['crypto'],
      riskProfiles: ['conservative', 'moderate', 'aggressive']
    },
    severity: 'critical',
    source: 'Digital Asset Risk Management Guidelines'
  },
  {
    id: 'AST_002',
    category: 'asset_specific',
    title: 'Options Position Sizing',
    description: 'Options positions require careful sizing due to leverage and time decay effects.',
    recommendation: {
      maxPositionSize: 3,
      maxTotalExposure: 15,
      notes: 'Account for implied volatility and time decay'
    },
    applicableFor: {
      assetClasses: ['options'],
      experienceLevels: ['intermediate', 'advanced']
    },
    severity: 'recommended',
    source: 'Options Strategies and Risk Management'
  },
  {
    id: 'AST_003',
    category: 'asset_specific',
    title: 'Futures Contract Sizing',
    description: 'Futures contracts have built-in leverage requiring smaller notional position sizes.',
    recommendation: {
      maxPositionSize: 4,
      maxTotalExposure: 20,
      notes: 'Account for margin requirements and leverage multiplier'
    },
    applicableFor: {
      assetClasses: ['futures'],
      experienceLevels: ['intermediate', 'advanced']
    },
    severity: 'recommended',
    source: 'Futures Trading Risk Management'
  },
  {
    id: 'STR_001',
    category: 'strategy_specific',
    title: 'Day Trading Position Limits',
    description: 'Day trading requires smaller position sizes due to frequent trades and intraday volatility.',
    recommendation: {
      maxPositionSize: 6,
      maxTotalExposure: 30,
      riskPerTrade: 0.5,
      notes: 'Multiple trades per day compound risk'
    },
    applicableFor: {
      tradingStrategies: ['day_trading'],
      experienceLevels: ['intermediate', 'advanced']
    },
    severity: 'recommended',
    source: 'Professional Day Trading Guidelines'
  },
  {
    id: 'STR_002',
    category: 'strategy_specific',
    title: 'Scalping Position Constraints',
    description: 'Scalping strategies should use very small position sizes due to high frequency and minimal profit margins.',
    recommendation: {
      maxPositionSize: 2,
      maxTotalExposure: 15,
      riskPerTrade: 0.25,
      notes: 'High frequency requires minimal risk per trade'
    },
    applicableFor: {
      tradingStrategies: ['scalping'],
      experienceLevels: ['advanced']
    },
    severity: 'critical',
    source: 'High-Frequency Trading Risk Management'
  },
  {
    id: 'STR_003',
    category: 'strategy_specific',
    title: 'Position Trading Concentration',
    description: 'Position trading allows larger individual positions but requires careful fundamental analysis.',
    recommendation: {
      maxPositionSize: 12,
      maxTotalExposure: 50,
      notes: 'Longer holding periods allow for larger positions with proper analysis'
    },
    applicableFor: {
      tradingStrategies: ['position_trading'],
      experienceLevels: ['intermediate', 'advanced'],
      riskProfiles: ['moderate', 'aggressive']
    },
    severity: 'recommended',
    source: 'Long-Term Investment Strategies'
  },
  {
    id: 'MKT_001',
    category: 'market_conditions',
    title: 'High Volatility Adjustments',
    description: 'Reduce position sizes during periods of high market volatility to account for increased risk.',
    recommendation: {
      notes: 'Reduce normal position sizes by 30-50% during high volatility periods'
    },
    applicableFor: {
      marketConditions: ['high_volatility'],
      tradingStrategies: ['day_trading', 'swing_trading']
    },
    severity: 'recommended',
    source: 'VIX-Based Risk Management Studies'
  },
  {
    id: 'MKT_002',
    category: 'market_conditions',
    title: 'Bear Market Position Sizing',
    description: 'During bear markets, reduce position sizes and increase cash reserves for opportunities.',
    recommendation: {
      maxTotalExposure: 15,
      notes: 'Preserve capital and maintain liquidity during market downturns'
    },
    applicableFor: {
      marketConditions: ['bear_market'],
      riskProfiles: ['conservative', 'moderate']
    },
    severity: 'recommended',
    source: 'Bear Market Trading Strategies'
  },
  {
    id: 'EXP_001',
    category: 'risk_management',
    title: 'Beginner Position Limits',
    description: 'New traders should use significantly smaller position sizes while learning and developing skills.',
    recommendation: {
      maxPositionSize: 1,
      maxTotalExposure: 10,
      riskPerTrade: 0.25,
      notes: 'Focus on learning rather than maximizing returns'
    },
    applicableFor: {
      experienceLevels: ['beginner'],
      riskProfiles: ['conservative']
    },
    severity: 'critical',
    source: 'Trading Education Best Practices'
  },
  {
    id: 'RISK_003',
    category: 'risk_management',
    title: 'Account Size Considerations',
    description: 'Smaller accounts require more conservative position sizing due to reduced diversification ability.',
    recommendation: {
      notes: 'Accounts under $25k should use more conservative sizing'
    },
    applicableFor: {
      riskProfiles: ['conservative'],
      experienceLevels: ['beginner', 'intermediate']
    },
    severity: 'recommended',
    source: 'Small Account Management Strategies'
  },
  {
    id: 'RISK_004',
    category: 'risk_management',
    title: 'Correlation Risk Management',
    description: 'Avoid over-concentration in correlated assets that could move together during market stress.',
    recommendation: {
      notes: 'Consider correlation when calculating total exposure'
    },
    applicableFor: {
      assetClasses: ['stocks', 'etfs'],
      tradingStrategies: ['swing_trading', 'position_trading']
    },
    severity: 'recommended',
    source: 'Portfolio Risk Management Theory'
  },
  {
    id: 'RISK_005',
    category: 'risk_management',
    title: 'Leverage Usage Guidelines',
    description: 'Use leverage conservatively and always account for leveraged exposure in position sizing calculations.',
    recommendation: {
      notes: 'Never use more than 2:1 leverage for beginners, 3:1 for experienced traders'
    },
    applicableFor: {
      assetClasses: ['forex', 'futures', 'crypto'],
      experienceLevels: ['intermediate', 'advanced']
    },
    severity: 'critical',
    source: 'Leverage Risk Management Guidelines'
  }
];

// Asset class specific guidelines
export const ASSET_CLASS_GUIDELINES = {
  stocks: {
    maxPositionSize: 5,
    maxTotalExposure: 25,
    considerations: ['Market cap', 'Sector concentration', 'Beta'],
    notes: 'Blue chip stocks can support larger positions than small caps'
  },
  crypto: {
    maxPositionSize: 2,
    maxTotalExposure: 10,
    considerations: ['Extreme volatility', 'Regulatory risk', 'Liquidity'],
    notes: 'Highest risk asset class requiring minimal position sizes'
  },
  forex: {
    maxPositionSize: 4,
    maxTotalExposure: 20,
    considerations: ['Leverage', 'Interest rate differentials', 'Economic events'],
    notes: 'Built-in leverage requires careful position management'
  },
  options: {
    maxPositionSize: 3,
    maxTotalExposure: 15,
    considerations: ['Time decay', 'Implied volatility', 'Delta exposure'],
    notes: 'Complex instruments requiring advanced risk management'
  },
  futures: {
    maxPositionSize: 4,
    maxTotalExposure: 20,
    considerations: ['Margin requirements', 'Contract size', 'Expiration'],
    notes: 'Leveraged instruments with specific risk characteristics'
  },
  etfs: {
    maxPositionSize: 6,
    maxTotalExposure: 30,
    considerations: ['Underlying assets', 'Expense ratios', 'Tracking error'],
    notes: 'Generally safer than individual stocks due to diversification'
  }
};

// Trading strategy specific guidelines
export const STRATEGY_GUIDELINES = {
  day_trading: {
    maxPositionSize: 6,
    maxTotalExposure: 30,
    riskPerTrade: 0.5,
    considerations: ['Multiple trades per day', 'Intraday volatility', 'Commission costs'],
    notes: 'High frequency requires strict risk control'
  },
  swing_trading: {
    maxPositionSize: 8,
    maxTotalExposure: 40,
    riskPerTrade: 1.0,
    considerations: ['Multi-day holds', 'Overnight risk', 'Technical analysis'],
    notes: 'Balanced approach allowing moderate position sizes'
  },
  position_trading: {
    maxPositionSize: 12,
    maxTotalExposure: 50,
    riskPerTrade: 1.5,
    considerations: ['Long-term trends', 'Fundamental analysis', 'Market cycles'],
    notes: 'Longer timeframes allow for larger concentrated positions'
  },
  scalping: {
    maxPositionSize: 2,
    maxTotalExposure: 15,
    riskPerTrade: 0.25,
    considerations: ['Very high frequency', 'Minimal profit margins', 'Transaction costs'],
    notes: 'Requires smallest position sizes due to high frequency'
  }
};

// Market condition adjustments
export const MARKET_CONDITION_ADJUSTMENTS = {
  low_volatility: {
    sizeMultiplier: 1.2,
    notes: 'Can increase position sizes moderately in stable markets'
  },
  normal_volatility: {
    sizeMultiplier: 1.0,
    notes: 'Use standard position sizing guidelines'
  },
  high_volatility: {
    sizeMultiplier: 0.6,
    notes: 'Significantly reduce position sizes to account for increased risk'
  },
  bear_market: {
    sizeMultiplier: 0.7,
    notes: 'Reduce exposure and maintain higher cash reserves'
  },
  bull_market: {
    sizeMultiplier: 1.1,
    notes: 'Can slightly increase exposure but maintain discipline'
  },
  crisis_conditions: {
    sizeMultiplier: 0.4,
    notes: 'Minimal exposure during systemic crisis periods'
  }
};

// Experience level guidelines
export const EXPERIENCE_LEVEL_ADJUSTMENTS = {
  beginner: {
    maxPositionMultiplier: 0.5,
    maxExposureMultiplier: 0.6,
    riskMultiplier: 0.5,
    notes: 'Focus on learning and capital preservation'
  },
  intermediate: {
    maxPositionMultiplier: 0.8,
    maxExposureMultiplier: 0.9,
    riskMultiplier: 0.8,
    notes: 'Gradual increase as skills develop'
  },
  advanced: {
    maxPositionMultiplier: 1.2,
    maxExposureMultiplier: 1.1,
    riskMultiplier: 1.2,
    notes: 'Can handle larger positions with proper risk management'
  }
};

/**
 * Get best practice recommendations for specific criteria
 */
export function getBestPracticesFor(criteria: {
  assetClass?: string;
  tradingStrategy?: string;
  riskProfile?: string;
  experienceLevel?: string;
  marketCondition?: string;
}): BestPracticeRule[] {
  return POSITION_SIZING_BEST_PRACTICES.filter(rule => {
    const { assetClass, tradingStrategy, riskProfile, experienceLevel, marketCondition } = criteria;
    
    const matchesAssetClass = !assetClass || 
      !rule.applicableFor.assetClasses || 
      rule.applicableFor.assetClasses.includes(assetClass);
    
    const matchesStrategy = !tradingStrategy || 
      !rule.applicableFor.tradingStrategies || 
      rule.applicableFor.tradingStrategies.includes(tradingStrategy);
    
    const matchesRiskProfile = !riskProfile || 
      !rule.applicableFor.riskProfiles || 
      rule.applicableFor.riskProfiles.includes(riskProfile);
    
    const matchesExperience = !experienceLevel || 
      !rule.applicableFor.experienceLevels || 
      rule.applicableFor.experienceLevels.includes(experienceLevel);
    
    const matchesMarketCondition = !marketCondition || 
      !rule.applicableFor.marketConditions || 
      rule.applicableFor.marketConditions.includes(marketCondition);
    
    return matchesAssetClass && matchesStrategy && matchesRiskProfile && 
           matchesExperience && matchesMarketCondition;
  });
}

/**
 * Get critical rules that should never be violated
 */
export function getCriticalRules(): BestPracticeRule[] {
  return POSITION_SIZING_BEST_PRACTICES.filter(rule => rule.severity === 'critical');
}

/**
 * Get educational content for tooltips and explanations
 */
export const EDUCATIONAL_CONTENT = {
  positionSizing: {
    title: 'Position Sizing',
    explanation: 'Position sizing determines how much capital to allocate to each trade. Proper sizing is crucial for long-term trading success and capital preservation.',
    keyPoints: [
      'Risk management is more important than maximizing returns',
      'Consistency in sizing leads to predictable outcomes',
      'Adjust for volatility and market conditions',
      'Never risk more than you can afford to lose'
    ]
  },
  riskPerTrade: {
    title: 'Risk Per Trade',
    explanation: 'The percentage of total capital you are willing to lose on a single trade. Professional traders typically risk 1-2% per trade.',
    keyPoints: [
      '1% risk allows for 100 consecutive losses before bankruptcy',
      '2% risk allows for 50 consecutive losses',
      'Higher risk per trade increases volatility of returns',
      'Lower risk per trade promotes longevity'
    ]
  },
  diversification: {
    title: 'Diversification',
    explanation: 'Spreading risk across multiple assets to reduce portfolio volatility. Avoid putting all eggs in one basket.',
    keyPoints: [
      'Reduce concentration risk',
      'Consider correlation between assets',
      'Balance across sectors and asset classes',
      'Monitor total exposure limits'
    ]
  },
  volatility: {
    title: 'Volatility Considerations',
    explanation: 'More volatile assets require smaller position sizes to maintain consistent risk levels.',
    keyPoints: [
      'Volatile assets can move against you quickly',
      'Adjust position size inversely to volatility',
      'Use volatility indicators like ATR',
      'Consider market regime changes'
    ]
  }
}; 
 
 
 