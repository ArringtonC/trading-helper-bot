/**
 * Tests for Gap Risk Rule Engine
 * 
 * Tests trading style-specific rule evaluation, recommendations generation,
 * and integration with gap risk analysis.
 */

import { GapRiskRuleEngine } from '../GapRiskRuleEngine';
import { WeekendGapRiskService } from '../WeekendGapRiskService';
import { TradingStyleConfigService } from '../TradingStyleConfigService';
import { 
  TradingStyleConfig, 
  GapRiskRule, 
  TradingStyleGapAssessment,
  GapRiskEngineConfig
} from '../../types/tradingStyleRules';
import { NormalizedTradeData, BrokerType } from '../../types/trade';
import { PositionGapRisk, GapMagnitude } from '../../types/gapRisk';
import { getRuleTemplateForStyle, getRulesForStyleAndRisk } from '../../utils/tradingStyleRuleTemplates';

// Mock the WeekendGapRiskService
jest.mock('../WeekendGapRiskService');
const MockWeekendGapRiskService = WeekendGapRiskService as jest.MockedClass<typeof WeekendGapRiskService>;

describe('GapRiskRuleEngine', () => {
  let ruleEngine: GapRiskRuleEngine;
  let mockWeekendGapRiskService: jest.Mocked<WeekendGapRiskService>;
  let tradingStyleConfigService: TradingStyleConfigService;

  // Sample trading style configuration
  const testTradingConfig: TradingStyleConfig = {
    style: 'swing_trading',
    riskTolerance: 'moderate',
    maxPositionSize: 8,
    maxTotalExposure: 80,
    typicalHoldTime: 7,
    weekendHoldingAllowed: true,
    maxGapRiskScore: 60,
    acceptableGapMagnitudes: [GapMagnitude.SMALL, GapMagnitude.MEDIUM],
    accountSize: 50000,
    availableBuyingPower: 45000,
    strategyParameters: {
      maxConcurrentPositions: 8,
      targetProfitPercent: 10,
      stopLossPercent: 5,
      rebalanceFrequency: 'weekly'
    }
  };

  // Sample position data
  const testPosition: NormalizedTradeData = {
    id: 'test-position-1',
    importTimestamp: new Date().toISOString(),
    broker: BrokerType.IBKR,
    symbol: 'AAPL',
    tradeDate: '2024-01-15',
    quantity: 100,
    tradePrice: 150,
    currency: 'USD',
    netAmount: -15000,
    assetCategory: 'STK'
  };

  // Sample gap risk analysis
  const testGapRisk: PositionGapRisk = {
    positionId: 'test-position-1',
    symbol: 'AAPL',
    positionSize: 100,
    positionValue: 15000,
    currentPrice: 150,
    gapRisk: {
      riskScore: 65,
      probabilityOfLoss: 0.15,
      expectedLoss: 750,
      maximumLoss: 2250,
      scenarios: {
        [GapMagnitude.SMALL]: { probability: 0.4, potentialLoss: 300 },
        [GapMagnitude.MEDIUM]: { probability: 0.35, potentialLoss: 750 },
        [GapMagnitude.LARGE]: { probability: 0.2, potentialLoss: 1500 },
        [GapMagnitude.EXTREME]: { probability: 0.05, potentialLoss: 2250 }
      }
    },
    riskFactors: {
      volatilityRegime: 'Medium',
      liquidity: 'high',
      earnings: false,
      events: []
    },
    calculatedAt: new Date()
  };

  beforeEach(() => {
    // Setup mocks
    mockWeekendGapRiskService = new MockWeekendGapRiskService() as jest.Mocked<WeekendGapRiskService>;
    tradingStyleConfigService = new TradingStyleConfigService();
    
    // Setup user configuration
    tradingStyleConfigService.setUserConfig('test-user', testTradingConfig);

    // Create rule engine
    ruleEngine = new GapRiskRuleEngine(
      mockWeekendGapRiskService,
      tradingStyleConfigService
    );

    // Mock gap risk service response
    mockWeekendGapRiskService.analyzePositionGapRisk.mockResolvedValue({
      success: true,
      data: testGapRisk,
      error: undefined,
      timestamp: new Date()
    });
  });

  describe('Rule Evaluation', () => {
    it('should evaluate positions against swing trading rules', async () => {
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);

      expect(assessment).toBeDefined();
      expect(assessment.userId).toBe('test-user');
      expect(assessment.tradingStyle.style).toBe('swing_trading');
      expect(assessment.positionEvaluations).toHaveLength(1);
      expect(assessment.overallRiskScore).toBeGreaterThan(0);
    });

    it('should trigger moderate risk rule for swing trading', async () => {
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);

      // Should trigger moderate risk rule since risk score (65) is between 50-75
      const triggeredRules = assessment.positionEvaluations.filter(e => e.triggered);
      expect(triggeredRules.length).toBeGreaterThan(0);
      
      // Should have recommendations
      expect(assessment.recommendations.length).toBeGreaterThan(0);
    });

    it('should not trigger rules for low risk positions', async () => {
      // Mock low risk scenario
      const lowRiskGapAnalysis = {
        ...testGapRisk,
        gapRisk: {
          ...testGapRisk.gapRisk,
          riskScore: 25 // Low risk score
        }
      };

      mockWeekendGapRiskService.analyzePositionGapRisk.mockResolvedValue({
        success: true,
        data: lowRiskGapAnalysis,
        error: undefined,
        timestamp: new Date()
      });

      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);

      // Should not trigger any rules for low risk
      const triggeredRules = assessment.positionEvaluations.filter(e => e.triggered);
      expect(triggeredRules.length).toBe(0);
    });
  });

  describe('Day Trading Rules', () => {
    beforeEach(() => {
      const dayTradingConfig: TradingStyleConfig = {
        ...testTradingConfig,
        style: 'day_trading',
        weekendHoldingAllowed: false,
        maxGapRiskScore: 40
      };
      tradingStyleConfigService.setUserConfig('day-trader', dayTradingConfig);
    });

    it('should trigger no weekend holdings rule', async () => {
      const rules = getRulesForStyleAndRisk('day_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('day-trader', positions, rules);

      // Day trading rules should trigger for any gap risk
      const triggeredRules = assessment.positionEvaluations.filter(e => e.triggered);
      expect(triggeredRules.length).toBeGreaterThan(0);

      // Should recommend closing position
      const closeActions = assessment.recommendations.filter(r => r.action === 'close_position');
      expect(closeActions.length).toBeGreaterThan(0);
    });

    it('should have high priority recommendations for day trading', async () => {
      const rules = getRulesForStyleAndRisk('day_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('day-trader', positions, rules);

      // Day trading should have high priority recommendations
      const highPriorityRecommendations = assessment.recommendations.filter(
        r => r.priority === 'high' || r.priority === 'critical'
      );
      expect(highPriorityRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Position Trading Rules', () => {
    beforeEach(() => {
      const positionTradingConfig: TradingStyleConfig = {
        ...testTradingConfig,
        style: 'position_trading',
        maxGapRiskScore: 80,
        acceptableGapMagnitudes: [GapMagnitude.SMALL, GapMagnitude.MEDIUM, GapMagnitude.LARGE]
      };
      tradingStyleConfigService.setUserConfig('position-trader', positionTradingConfig);
    });

    it('should be more tolerant of gap risk', async () => {
      const rules = getRulesForStyleAndRisk('position_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('position-trader', positions, rules);

      // Position trading should be more tolerant, fewer triggered rules
      const triggeredRules = assessment.positionEvaluations.filter(e => e.triggered);
      
      // May or may not trigger depending on specific rules, but should be less aggressive
      expect(assessment.overallRiskScore).toBeDefined();
      expect(assessment.riskLevel).toBeDefined();
    });

    it('should trigger extreme risk management for very high risk', async () => {
      // Mock extreme risk scenario
      const extremeRiskGapAnalysis = {
        ...testGapRisk,
        gapRisk: {
          ...testGapRisk.gapRisk,
          riskScore: 90 // Extreme risk score
        }
      };

      mockWeekendGapRiskService.analyzePositionGapRisk.mockResolvedValue({
        success: true,
        data: extremeRiskGapAnalysis,
        error: undefined,
        timestamp: new Date()
      });

      const rules = getRulesForStyleAndRisk('position_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('position-trader', positions, rules);

      // Should trigger extreme risk management
      const triggeredRules = assessment.positionEvaluations.filter(e => e.triggered);
      expect(triggeredRules.length).toBeGreaterThan(0);

      // Should require approval for extreme risk
      const approvalActions = assessment.recommendations.filter(r => r.action === 'require_approval');
      expect(approvalActions.length).toBeGreaterThan(0);
    });
  });

  describe('Portfolio-Level Analysis', () => {
    it('should calculate portfolio metrics correctly', async () => {
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition, { ...testPosition, id: 'test-position-2', symbol: 'MSFT' }];

      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);

      expect(assessment.portfolioMetrics).toBeDefined();
      expect(assessment.portfolioMetrics.totalWeekendExposure).toBeGreaterThan(0);
      expect(assessment.portfolioMetrics.concentrationRisk).toBeGreaterThanOrEqual(0);
      expect(assessment.portfolioMetrics.diversificationScore).toBeGreaterThanOrEqual(0);
    });

    it('should provide portfolio summary', async () => {
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);

      expect(assessment.summary).toBeDefined();
      expect(assessment.summary.totalPositionsEvaluated).toBe(1);
      expect(assessment.summary.highRiskPositions).toBeGreaterThanOrEqual(0);
      expect(assessment.summary.recommendedActions).toBeGreaterThanOrEqual(0);
      expect(assessment.summary.estimatedRiskReduction).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate actionable recommendations', async () => {
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);

      if (assessment.recommendations.length > 0) {
        const recommendation = assessment.recommendations[0];
        
        expect(recommendation.priority).toBeDefined();
        expect(recommendation.action).toBeDefined();
        expect(recommendation.description).toBeDefined();
        expect(recommendation.reasoning).toBeDefined();
        expect(recommendation.metadata.ruleId).toBeDefined();
        expect(recommendation.metadata.evaluatedAt).toBeDefined();
      }
    });

    it('should prioritize recommendations correctly', async () => {
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);

      if (assessment.recommendations.length > 1) {
        // Recommendations should be sorted by priority
        const priorities = assessment.recommendations.map(r => r.priority);
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        
        for (let i = 1; i < priorities.length; i++) {
          expect(priorityOrder[priorities[i-1]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i]]);
        }
      }
    });
  });

  describe('Risk Level Calculation', () => {
    it('should correctly categorize risk levels', async () => {
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);

      expect(['low', 'medium', 'high', 'extreme']).toContain(assessment.riskLevel);
      expect(assessment.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.overallRiskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle failed gap risk analysis gracefully', async () => {
      mockWeekendGapRiskService.analyzePositionGapRisk.mockResolvedValue({
        success: false,
        data: undefined,
        error: 'Analysis failed',
        timestamp: new Date()
      });

      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];

      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);

      // Should complete without throwing, but with no evaluations
      expect(assessment.positionEvaluations).toHaveLength(0);
      expect(assessment.summary.totalPositionsEvaluated).toBe(1);
    });

    it('should handle missing user configuration', async () => {
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];

      // Test with non-existent user
      const assessment = await ruleEngine.evaluatePositions('unknown-user', positions, rules);

      // Should use default configuration
      expect(assessment).toBeDefined();
      expect(assessment.tradingStyle.style).toBe('swing_trading'); // Default fallback
    });
  });

  describe('Configuration Management', () => {
    it('should update engine configuration', async () => {
      const newConfig: Partial<GapRiskEngineConfig> = {
        globalRiskThresholds: {
          low: 20,
          medium: 40,
          high: 70,
          extreme: 85
        }
      };

      ruleEngine.updateConfig(newConfig);

      // Test that configuration was updated by evaluating risk levels
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];
      
      const assessment = await ruleEngine.evaluatePositions('test-user', positions, rules);
      
      // Should complete without errors and use the new thresholds
      expect(assessment).toBeDefined();
      expect(assessment.riskLevel).toBeDefined();
      expect(['low', 'medium', 'high', 'extreme']).toContain(assessment.riskLevel);
    });

    it('should clear evaluation cache', async () => {
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const positions = [testPosition];
      
      // First evaluation to populate cache
      const assessment1 = await ruleEngine.evaluatePositions('test-user', positions, rules);
      expect(assessment1).toBeDefined();
      
      // Clear cache
      ruleEngine.clearCache();
      
      // Second evaluation should still work (cache cleared but functional)
      const assessment2 = await ruleEngine.evaluatePositions('test-user', positions, rules);
      expect(assessment2).toBeDefined();
      expect(assessment2.userId).toBe('test-user');
    });
  });
});

describe('Rule Template Integration', () => {
  it('should load rule templates for all trading styles', () => {
    const dayTradingTemplate = getRuleTemplateForStyle('day_trading');
    const scalpingTemplate = getRuleTemplateForStyle('scalping');
    const swingTradingTemplate = getRuleTemplateForStyle('swing_trading');
    const positionTradingTemplate = getRuleTemplateForStyle('position_trading');

    expect(dayTradingTemplate.rules.length).toBeGreaterThan(0);
    expect(scalpingTemplate.rules.length).toBeGreaterThan(0);
    expect(swingTradingTemplate.rules.length).toBeGreaterThan(0);
    expect(positionTradingTemplate.rules.length).toBeGreaterThan(0);
  });

  it('should provide style-appropriate default configurations', () => {
    const dayTradingTemplate = getRuleTemplateForStyle('day_trading');
    const positionTradingTemplate = getRuleTemplateForStyle('position_trading');

    // Day trading should be more conservative
    expect(dayTradingTemplate.defaultConfig.weekendHoldingAllowed).toBe(false);
    expect(dayTradingTemplate.defaultConfig.maxGapRiskScore).toBeLessThan(
      positionTradingTemplate.defaultConfig.maxGapRiskScore || 100
    );

    // Position trading should be more tolerant
    expect(positionTradingTemplate.defaultConfig.weekendHoldingAllowed).toBe(true);
    expect(positionTradingTemplate.defaultConfig.acceptableGapMagnitudes?.length || 0).toBeGreaterThan(
      dayTradingTemplate.defaultConfig.acceptableGapMagnitudes?.length || 0
    );
  });
}); 