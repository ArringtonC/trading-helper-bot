// Mock for WeekendGapRiskService
const mockGapAnalysis = {
  portfolioId: 'default',
  totalExposure: 105000,
  totalRisk: 2100,
  riskScore: 65,
  positions: [
    {
      symbol: 'AAPL',
      quantity: 100,
      positionValue: 15000,
      gapRisk: {
        expectedLoss: 300,
        riskScore: 6.5,
        scenarios: {
          small: { probability: 0.6, potentialLoss: 150 },
          medium: { probability: 0.3, potentialLoss: 450 },
          large: { probability: 0.1, potentialLoss: 1200 }
        }
      },
      gapStatistics: {
        symbol: 'AAPL',
        avgGapDown: -0.015,
        avgGapUp: 0.012,
        maxGapDown: -0.085,
        maxGapUp: 0.067,
        gapFrequency: 0.15,
        volatility: 0.25
      }
    },
    {
      symbol: 'TSLA',
      quantity: 50,
      positionValue: 10000,
      gapRisk: {
        expectedLoss: 400,
        riskScore: 8.2,
        scenarios: {
          small: { probability: 0.5, potentialLoss: 200 },
          medium: { probability: 0.35, potentialLoss: 600 },
          large: { probability: 0.15, potentialLoss: 1600 }
        }
      },
      gapStatistics: {
        symbol: 'TSLA',
        avgGapDown: -0.025,
        avgGapUp: 0.022,
        maxGapDown: -0.155,
        maxGapUp: 0.134,
        gapFrequency: 0.25,
        volatility: 0.45
      }
    },
    {
      symbol: 'SPY',
      quantity: 200,
      positionValue: 80000,
      gapRisk: {
        expectedLoss: 800,
        riskScore: 4.1,
        scenarios: {
          small: { probability: 0.7, potentialLoss: 400 },
          medium: { probability: 0.25, potentialLoss: 1200 },
          large: { probability: 0.05, potentialLoss: 3200 }
        }
      },
      gapStatistics: {
        symbol: 'SPY',
        avgGapDown: -0.008,
        avgGapUp: 0.007,
        maxGapDown: -0.045,
        maxGapUp: 0.038,
        gapFrequency: 0.08,
        volatility: 0.18
      }
    }
  ],
  portfolioMetrics: {
    totalWeekendExposure: 105000,
    highRiskPositions: 1,
    mediumRiskPositions: 1,
    lowRiskPositions: 1,
    avgRiskScore: 6.27,
    concentrationRisk: 0.76,
    diversificationScore: 8.2
  },
  recommendations: [
    {
      action: 'Reduce Position',
      description: 'Consider reducing AAPL position before weekend',
      priority: 'high',
      reasoning: 'High gap risk exposure relative to portfolio size',
      riskReduction: 25,
      timeline: 'Before market close on Friday'
    },
    {
      action: 'Add Hedge',
      description: 'Consider protective puts for TSLA position',
      priority: 'medium',
      reasoning: 'High volatility symbol with significant gap risk',
      riskReduction: 40,
      timeline: 'Next trading session'
    }
  ],
  summary: {
    totalPositionsEvaluated: 3,
    highRiskPositions: 1,
    mediumRiskPositions: 1,
    lowRiskPositions: 1,
    totalPortfolioValue: 105000,
    totalWeekendRisk: 2100,
    riskPercentage: 2.0
  }
};

export class WeekendGapRiskService {
  constructor() {
    this.config = {};
    this.gapStatisticsCache = new Map();
    this.historicalDataCache = new Map();
  }

  async analyzeSymbolGapRisk(symbol) {
    return {
      success: true,
      data: {
        symbol,
        avgGapDown: -0.015,
        avgGapUp: 0.012,
        maxGapDown: -0.085,
        maxGapUp: 0.067,
        gapFrequency: 0.15,
        volatility: 0.25
      },
      timestamp: new Date()
    };
  }

  async analyzePositionGapRisk(position, currentPrice) {
    const mockPosition = mockGapAnalysis.positions.find(p => p.symbol === position.symbol) || 
                        mockGapAnalysis.positions[0];
    
    return {
      success: true,
      data: mockPosition,
      timestamp: new Date()
    };
  }

  async analyzePortfolioGapRisk(positions, portfolioId = 'default') {
    return {
      success: true,
      data: mockGapAnalysis,
      timestamp: new Date()
    };
  }

  clearCache() {
    this.gapStatisticsCache.clear();
    this.historicalDataCache.clear();
  }

  updateConfiguration(config) {
    this.config = { ...this.config, ...config };
  }
}

export default WeekendGapRiskService; 