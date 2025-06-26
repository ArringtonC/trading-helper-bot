/**
 * Enhanced Technical Fundamental Screener with Famous Trader Criteria
 * Implements screening strategies from Buffett, Soros, Dalio, and PTJ
 */

import { UserExperienceLevel } from '../../../shared/utils/ux/UXLayersController';

export interface FamousTraderCriteria {
  buffett?: BuffettCriteria;
  soros?: SorosCriteria;
  dalio?: DalioCriteria;
  ptj?: PTJCriteria;
}

export interface BuffettCriteria {
  financialHealth: {
    maxDebtToEquity: number;        // < 0.5 preferred
    minCurrentRatio: number;        // > 1.5 preferred
    minReturnOnEquity: number;      // > 15% required
    minReturnOnAssets: number;      // > 7% preferred
  };
  profitability: {
    minNetProfitMargin: number;     // > 10% preferred
    minGrossProfitMargin: number;   // > 40% preferred
    minOperatingMargin: number;     // > 15% preferred
    minEarningsGrowth5Year: number; // > 10% annual
  };
  valuation: {
    maxPeRatio: number;            // < 20 preferred
    maxPbRatio: number;            // < 3 preferred
    maxPegRatio: number;           // < 1.5 preferred
    maxPriceToSales: number;       // < 2.5 preferred
  };
  moatIndicators: {
    minBrandStrength: number;       // Score 1-10
    minMarketShare: number;         // % of market
    minSwitchingCosts: number;      // Score 1-10
    minNetworkEffects: number;      // Score 1-10
  };
}

export interface SorosCriteria {
  macroFactors: {
    currencyStrength: number;       // -1 to 1
    economicCyclePhase: 'EXPANSION' | 'PEAK' | 'CONTRACTION' | 'TROUGH';
    centralBankPolicy: 'DOVISH' | 'NEUTRAL' | 'HAWKISH';
    geopoliticalRisk: number;       // 0-1
  };
  reflexivity: {
    sentimentDivergence: number;    // 0-1
    fundamentalTechnicalGap: number; // 0-1
    narrativeStrength: number;      // 0-1
  };
  positioning: {
    institutionalFlow: number;      // Money flow
    retailSentiment: number;        // Contrarian indicator
    marginLevels: number;          // Market leverage
  };
}

export interface DalioCriteria {
  riskParity: {
    correlationLimit: number;       // Max correlation with existing positions
    riskContribution: number;       // Target risk contribution %
    diversificationScore: number;   // 0-1
  };
  economicEnvironment: {
    growthRegime: 'RISING' | 'FALLING';
    inflationRegime: 'RISING' | 'FALLING';
    liquidityConditions: number;    // 0-1
    creditCycle: 'EXPANSION' | 'CONTRACTION';
  };
  assetClassBalance: {
    stocksWeight: number;
    bondsWeight: number;
    commoditiesWeight: number;
    currenciesWeight: number;
  };
}

export interface PTJCriteria {
  contrarian: {
    sentimentExtremes: number;      // 0-1 (1 = extreme)
    technicalSetupQuality: number; // 0-1
    volumeConfirmation: boolean;
    supportResistanceTest: boolean;
  };
  riskManagement: {
    maxRiskPerPosition: number;     // Max 1% per PTJ rules
    minRiskReward: number;          // Min 5:1 per PTJ rules
    stopLossDistance: number;       // ATR multiples
  };
  momentum: {
    trendDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
    momentumStrength: number;       // 0-1
    breakoutQuality: number;        // 0-1
  };
}

export interface EnhancedScreeningCriteria {
  // Original criteria
  minMarketCap?: number;
  maxMarketCap?: number;
  minPE?: number;
  maxPE?: number;
  minROE?: number;
  maxROE?: number;
  sector?: string;
  minRSI?: number;
  maxRSI?: number;
  
  // Enhanced technical criteria
  technical?: {
    rsiRange: { min: number; max: number };
    macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    goldenCross: boolean;
    volumeThreshold: number;
    priceRange: { min: number; max: number };
    movingAverages: {
      sma20: 'ABOVE' | 'BELOW' | 'ANY';
      sma50: 'ABOVE' | 'BELOW' | 'ANY';
      sma200: 'ABOVE' | 'BELOW' | 'ANY';
    };
    volatility: {
      minATR: number;
      maxATR: number;
      impliedVol?: number;
    };
  };
  
  // Enhanced fundamental criteria
  fundamental?: {
    maxDebtToEquity: number;
    minCurrentRatio: number;
    minRevenueGrowth: number;
    maxPegRatio: number;
    minMarketCap: number;
    profitability: {
      minROE: number;
      minROA: number;
      minNetMargin: number;
      minOperatingMargin: number;
    };
    valuation: {
      maxPE: number;
      maxPB: number;
      maxPSales: number;
      minDividendYield?: number;
    };
    growth: {
      minEPSGrowth: number;
      minRevenueGrowth: number;
      earningsQuality: number; // 0-1
    };
  };
  
  // Famous trader criteria
  famousTrader?: FamousTraderCriteria;
  
  // Experience level and strategy
  level?: UserExperienceLevel;
  strategy?: 'BUFFETT' | 'SOROS' | 'DALIO' | 'PTJ' | 'HYBRID';
}

export interface EnhancedScreenedStock {
  // Basic stock info
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  sector: string;
  
  // Scoring
  overallScore: number;
  technicalScore: number;
  fundamentalScore: number;
  famousTraderScores: {
    buffett: number;
    soros: number;
    dalio: number;
    ptj: number;
  };
  
  // Technical indicators
  technical: {
    rsi14: number;
    macd: {
      line: number;
      signal: number;
      histogram: number;
    };
    movingAverages: {
      sma20: number;
      sma50: number;
      sma200: number;
    };
    volume: {
      avgVolume: number;
      relativeVolume: number;
    };
    volatility: {
      atr: number;
      impliedVol?: number;
    };
    support: number;
    resistance: number;
  };
  
  // Fundamental data
  fundamental: {
    pe?: number;
    pb?: number;
    peg?: number;
    roe?: number;
    roa?: number;
    debtToEquity: number;
    currentRatio: number;
    revenueGrowth: number;
    epsGrowth: number;
    netMargin: number;
    operatingMargin: number;
    grossMargin: number;
    dividendYield?: number;
  };
  
  // Famous trader analysis
  buffettAnalysis?: {
    moatScore: number;
    intrinsicValue: number;
    marginOfSafety: number;
    qualityScore: number;
  };
  
  sorosAnalysis?: {
    reflexivityScore: number;
    narrativeStrength: number;
    positioningScore: number;
    macroTheme: string;
  };
  
  dalioAnalysis?: {
    riskParityFit: number;
    economicRegimeFit: number;
    diversificationBenefit: number;
    allWeatherScore: number;
  };
  
  ptjAnalysis?: {
    contrarian: number;
    setupQuality: number;
    riskReward: number;
    momentumScore: number;
  };
  
  // Risk and recommendations
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  positionSizing: {
    conservative: number;
    moderate: number;
    aggressive: number;
    recommended: number;
  };
}

export interface EnhancedScreeningTemplate {
  id: string;
  name: string;
  description: string;
  strategy: 'BUFFETT' | 'SOROS' | 'DALIO' | 'PTJ' | 'HYBRID';
  criteria: EnhancedScreeningCriteria;
  level: UserExperienceLevel;
  isDefault?: boolean;
  expectedReturn: number;
  maxDrawdown: number;
  winRate: number;
  backtestPeriod: string;
}

export class EnhancedTechnicalFundamentalScreener {
  private criteria: EnhancedScreeningCriteria = {};
  
  constructor(initialCriteria?: EnhancedScreeningCriteria) {
    if (initialCriteria) {
      this.criteria = { ...initialCriteria };
    }
  }

  /**
   * Screen stocks using enhanced criteria including famous trader strategies
   */
  async screenWithFamousTraderCriteria(criteria: EnhancedScreeningCriteria): Promise<EnhancedScreenedStock[]> {
    // This would connect to real market data APIs
    // For now, return mock data that demonstrates the structure
    
    const mockStocks = this.generateMockScreenedStocks(criteria);
    
    // Apply famous trader scoring
    return mockStocks.map(stock => this.applyFamousTraderAnalysis(stock, criteria));
  }

  /**
   * Get pre-configured templates based on famous trader strategies
   */
  getFamousTraderTemplates(): EnhancedScreeningTemplate[] {
    return [
      this.getBuffettTemplate(),
      this.getSorosTemplate(),
      this.getDalioTemplate(),
      this.getPTJTemplate(),
      this.getHybridTemplate()
    ];
  }

  /**
   * Warren Buffett Value Investing Template
   */
  private getBuffettTemplate(): EnhancedScreeningTemplate {
    return {
      id: 'buffett_value',
      name: 'Buffett Value Investing',
      description: 'Focus on quality companies with strong moats, consistent profitability, and reasonable valuations',
      strategy: 'BUFFETT',
      level: 'INTERMEDIATE',
      expectedReturn: 0.12,
      maxDrawdown: 0.20,
      winRate: 0.65,
      backtestPeriod: '1990-2024',
      criteria: {
        minMarketCap: 1000000000, // $1B minimum
        fundamental: {
          maxDebtToEquity: 0.5,
          minCurrentRatio: 1.5,
          profitability: {
            minROE: 15,
            minROA: 7,
            minNetMargin: 10,
            minOperatingMargin: 15
          },
          valuation: {
            maxPE: 20,
            maxPB: 3,
            maxPSales: 2.5
          },
          growth: {
            minEPSGrowth: 10,
            minRevenueGrowth: 5,
            earningsQuality: 0.8
          }
        },
        famousTrader: {
          buffett: {
            financialHealth: {
              maxDebtToEquity: 0.5,
              minCurrentRatio: 1.5,
              minReturnOnEquity: 15,
              minReturnOnAssets: 7
            },
            profitability: {
              minNetProfitMargin: 10,
              minGrossProfitMargin: 40,
              minOperatingMargin: 15,
              minEarningsGrowth5Year: 10
            },
            valuation: {
              maxPeRatio: 20,
              maxPbRatio: 3,
              maxPegRatio: 1.5,
              maxPriceToSales: 2.5
            },
            moatIndicators: {
              minBrandStrength: 7,
              minMarketShare: 10,
              minSwitchingCosts: 6,
              minNetworkEffects: 5
            }
          }
        }
      }
    };
  }

  /**
   * George Soros Macro Momentum Template
   */
  private getSorosTemplate(): EnhancedScreeningTemplate {
    return {
      id: 'soros_macro',
      name: 'Soros Macro Momentum',
      description: 'Identify reflexivity opportunities and macro themes with strong momentum',
      strategy: 'SOROS',
      level: 'ADVANCED',
      expectedReturn: 0.25,
      maxDrawdown: 0.35,
      winRate: 0.45,
      backtestPeriod: '1992-2024',
      criteria: {
        technical: {
          rsiRange: { min: 30, max: 70 },
          macdSignal: 'BULLISH',
          volumeThreshold: 1.5,
          movingAverages: {
            sma20: 'ABOVE',
            sma50: 'ABOVE',
            sma200: 'ANY'
          }
        },
        famousTrader: {
          soros: {
            macroFactors: {
              currencyStrength: 0.3,
              economicCyclePhase: 'EXPANSION',
              centralBankPolicy: 'DOVISH',
              geopoliticalRisk: 0.3
            },
            reflexivity: {
              sentimentDivergence: 0.7,
              fundamentalTechnicalGap: 0.6,
              narrativeStrength: 0.8
            },
            positioning: {
              institutionalFlow: 0.6,
              retailSentiment: 0.4,
              marginLevels: 0.5
            }
          }
        }
      }
    };
  }

  /**
   * Ray Dalio All Weather Template
   */
  private getDalioTemplate(): EnhancedScreeningTemplate {
    return {
      id: 'dalio_allweather',
      name: 'Dalio All Weather',
      description: 'Risk parity approach focusing on uncorrelated assets across economic environments',
      strategy: 'DALIO',
      level: 'ADVANCED',
      expectedReturn: 0.08,
      maxDrawdown: 0.12,
      winRate: 0.60,
      backtestPeriod: '1996-2024',
      criteria: {
        famousTrader: {
          dalio: {
            riskParity: {
              correlationLimit: 0.6,
              riskContribution: 25, // 25% max per asset class
              diversificationScore: 0.8
            },
            economicEnvironment: {
              growthRegime: 'RISING',
              inflationRegime: 'FALLING',
              liquidityConditions: 0.7,
              creditCycle: 'EXPANSION'
            },
            assetClassBalance: {
              stocksWeight: 30,
              bondsWeight: 40,
              commoditiesWeight: 15,
              currenciesWeight: 15
            }
          }
        }
      }
    };
  }

  /**
   * Paul Tudor Jones Contrarian Template
   */
  private getPTJTemplate(): EnhancedScreeningTemplate {
    return {
      id: 'ptj_contrarian',
      name: 'PTJ Contrarian Momentum',
      description: 'Contrarian plays with extreme sentiment and high-quality technical setups',
      strategy: 'PTJ',
      level: 'EXPERT',
      expectedReturn: 0.30,
      maxDrawdown: 0.25,
      winRate: 0.55,
      backtestPeriod: '1980-2024',
      criteria: {
        technical: {
          rsiRange: { min: 20, max: 80 }, // Allow extreme readings
          volumeThreshold: 2.0,
          volatility: {
            minATR: 2.0,
            maxATR: 8.0
          }
        },
        famousTrader: {
          ptj: {
            contrarian: {
              sentimentExtremes: 0.8,
              technicalSetupQuality: 0.7,
              volumeConfirmation: true,
              supportResistanceTest: true
            },
            riskManagement: {
              maxRiskPerPosition: 0.01, // 1% max risk
              minRiskReward: 5.0, // 5:1 minimum
              stopLossDistance: 2.0 // 2 ATR stop
            },
            momentum: {
              trendDirection: 'UP',
              momentumStrength: 0.6,
              breakoutQuality: 0.7
            }
          }
        }
      }
    };
  }

  /**
   * Hybrid Multi-Strategy Template
   */
  private getHybridTemplate(): EnhancedScreeningTemplate {
    return {
      id: 'hybrid_multistrategy',
      name: 'Multi-Strategy Hybrid',
      description: 'Combines best elements from all famous trader strategies',
      strategy: 'HYBRID',
      level: 'INTERMEDIATE',
      expectedReturn: 0.15,
      maxDrawdown: 0.18,
      winRate: 0.58,
      backtestPeriod: '1990-2024',
      criteria: {
        fundamental: {
          profitability: {
            minROE: 12, // Slightly lower than pure Buffett
            minNetMargin: 8,
            minOperatingMargin: 12
          },
          valuation: {
            maxPE: 25, // More flexible than Buffett
            maxPB: 4
          }
        },
        technical: {
          rsiRange: { min: 35, max: 65 }, // Moderate range
          macdSignal: 'BULLISH',
          volumeThreshold: 1.2
        }
      }
    };
  }

  /**
   * Apply famous trader analysis to a stock
   */
  private applyFamousTraderAnalysis(stock: EnhancedScreenedStock, criteria: EnhancedScreeningCriteria): EnhancedScreenedStock {
    // Calculate scores for each famous trader strategy
    const buffettScore = this.calculateBuffettScore(stock, criteria.famousTrader?.buffett);
    const sorosScore = this.calculateSorosScore(stock, criteria.famousTrader?.soros);
    const dalioScore = this.calculateDalioScore(stock, criteria.famousTrader?.dalio);
    const ptjScore = this.calculatePTJScore(stock, criteria.famousTrader?.ptj);

    stock.famousTraderScores = {
      buffett: buffettScore,
      soros: sorosScore,
      dalio: dalioScore,
      ptj: ptjScore
    };

    // Add specific analysis
    if (criteria.famousTrader?.buffett) {
      stock.buffettAnalysis = this.generateBuffettAnalysis(stock);
    }
    if (criteria.famousTrader?.soros) {
      stock.sorosAnalysis = this.generateSorosAnalysis(stock);
    }
    if (criteria.famousTrader?.dalio) {
      stock.dalioAnalysis = this.generateDalioAnalysis(stock);
    }
    if (criteria.famousTrader?.ptj) {
      stock.ptjAnalysis = this.generatePTJAnalysis(stock);
    }

    // Update overall score
    const strategy = criteria.strategy;
    if (strategy === 'BUFFETT') {
      stock.overallScore = buffettScore;
    } else if (strategy === 'SOROS') {
      stock.overallScore = sorosScore;
    } else if (strategy === 'DALIO') {
      stock.overallScore = dalioScore;
    } else if (strategy === 'PTJ') {
      stock.overallScore = ptjScore;
    } else {
      // Hybrid approach
      stock.overallScore = (buffettScore + sorosScore + dalioScore + ptjScore) / 4;
    }

    return stock;
  }

  // Mock data generation and scoring methods would be implemented here
  private generateMockScreenedStocks(criteria: EnhancedScreeningCriteria): EnhancedScreenedStock[] {
    // Return mock data for demonstration
    return [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 175.50,
        marketCap: 2800000000000,
        sector: 'Technology',
        overallScore: 85,
        technicalScore: 78,
        fundamentalScore: 92,
        famousTraderScores: { buffett: 88, soros: 65, dalio: 82, ptj: 71 },
        technical: {
          rsi14: 55.2,
          macd: { line: 2.3, signal: 1.8, histogram: 0.5 },
          movingAverages: { sma20: 170.25, sma50: 165.80, sma200: 155.30 },
          volume: { avgVolume: 58000000, relativeVolume: 1.2 },
          volatility: { atr: 3.45 },
          support: 168.50,
          resistance: 182.00
        },
        fundamental: {
          pe: 18.5,
          pb: 8.2,
          peg: 1.4,
          roe: 26.8,
          roa: 15.2,
          debtToEquity: 0.31,
          currentRatio: 1.8,
          revenueGrowth: 12.5,
          epsGrowth: 15.8,
          netMargin: 23.4,
          operatingMargin: 28.1,
          grossMargin: 42.3
        },
        riskLevel: 'MEDIUM',
        recommendation: 'BUY',
        timeHorizon: 'LONG',
        positionSizing: {
          conservative: 2.0,
          moderate: 3.5,
          aggressive: 5.0,
          recommended: 3.0
        }
      }
      // Additional mock stocks would be added here
    ];
  }

  private calculateBuffettScore(stock: EnhancedScreenedStock, criteria?: BuffettCriteria): number {
    if (!criteria) return 0;
    
    let score = 0;
    let maxScore = 0;
    
    // Financial health scoring
    if (stock.fundamental.debtToEquity <= criteria.financialHealth.maxDebtToEquity) score += 25;
    if (stock.fundamental.currentRatio >= criteria.financialHealth.minCurrentRatio) score += 25;
    if (stock.fundamental.roe && stock.fundamental.roe >= criteria.financialHealth.minReturnOnEquity) score += 25;
    if (stock.fundamental.roa && stock.fundamental.roa >= criteria.financialHealth.minReturnOnAssets) score += 25;
    maxScore += 100;
    
    return Math.round((score / maxScore) * 100);
  }

  private calculateSorosScore(stock: EnhancedScreenedStock, criteria?: SorosCriteria): number {
    // Mock scoring based on momentum and reflexivity indicators
    return Math.round(Math.random() * 40 + 40); // 40-80 range
  }

  private calculateDalioScore(stock: EnhancedScreenedStock, criteria?: DalioCriteria): number {
    // Mock scoring based on risk-parity principles
    return Math.round(Math.random() * 30 + 50); // 50-80 range
  }

  private calculatePTJScore(stock: EnhancedScreenedStock, criteria?: PTJCriteria): number {
    // Mock scoring based on contrarian and momentum factors
    return Math.round(Math.random() * 40 + 30); // 30-70 range
  }

  private generateBuffettAnalysis(stock: EnhancedScreenedStock) {
    return {
      moatScore: 8.5,
      intrinsicValue: stock.price * 1.15,
      marginOfSafety: 0.13,
      qualityScore: 9.2
    };
  }

  private generateSorosAnalysis(stock: EnhancedScreenedStock) {
    return {
      reflexivityScore: 0.72,
      narrativeStrength: 0.85,
      positioningScore: 0.68,
      macroTheme: 'Tech Innovation Cycle'
    };
  }

  private generateDalioAnalysis(stock: EnhancedScreenedStock) {
    return {
      riskParityFit: 0.78,
      economicRegimeFit: 0.82,
      diversificationBenefit: 0.65,
      allWeatherScore: 0.75
    };
  }

  private generatePTJAnalysis(stock: EnhancedScreenedStock) {
    return {
      contrarian: 0.45,
      setupQuality: 0.78,
      riskReward: 4.2,
      momentumScore: 0.68
    };
  }
}

export default EnhancedTechnicalFundamentalScreener;