// Mock for GapRiskRuleEngine
export class GapRiskRuleEngine {
  constructor(weekendGapService, configService) {
    this.weekendGapService = weekendGapService;
    this.configService = configService;
  }

  async evaluatePositions(userId, positions, rules) {
    // Return mock assessment similar to what's expected by the component
    return {
      portfolioId: userId,
      totalExposure: 105000,
      totalRisk: 2100,
      riskScore: 65,
      overallRiskScore: 65,
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
  }

  async evaluatePosition(position, rules) {
    return {
      symbol: position.symbol,
      riskLevel: 'medium',
      riskScore: 6.5,
      recommendations: ['Consider position sizing adjustment']
    };
  }

  updateRules(rules) {
    this.rules = rules;
  }
}

export default GapRiskRuleEngine; 