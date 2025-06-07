import {
  calculateFixedPercentageLimits,
  calculateRiskBasedLimits,
  calculateVolatilityBasedLimits,
  calculateStrategySpecificLimits,
  calculateCapitalObjectiveLimits,
  generateComprehensiveRecommendation,
  validateUserLimits,
  PositionSizingInput
} from '../positionLimitRecommendations';

describe('Position Limit Recommendations', () => {
  const baseInput: PositionSizingInput = {
    accountSize: 100000,
    riskTolerance: 'moderate',
    tradingStrategy: 'swing_trading',
    goalType: 'growth'
  };

  describe('calculateFixedPercentageLimits', () => {
    it('should return conservative limits for conservative risk tolerance', () => {
      const input = { ...baseInput, riskTolerance: 'conservative' as const };
      const result = calculateFixedPercentageLimits(input);
      
      expect(result.maxPositionSize).toBe(2);
      expect(result.maxTotalExposure).toBe(15);
      expect(result.method).toBe('Fixed Percentage');
      expect(result.confidence).toBe('high');
    });

    it('should return moderate limits for moderate risk tolerance', () => {
      const input = { ...baseInput, riskTolerance: 'moderate' as const };
      const result = calculateFixedPercentageLimits(input);
      
      expect(result.maxPositionSize).toBe(5);
      expect(result.maxTotalExposure).toBe(25);
    });

    it('should return aggressive limits for aggressive risk tolerance', () => {
      const input = { ...baseInput, riskTolerance: 'aggressive' as const };
      const result = calculateFixedPercentageLimits(input);
      
      expect(result.maxPositionSize).toBe(10);
      expect(result.maxTotalExposure).toBe(40);
    });

    it('should adjust for high-risk asset classes', () => {
      const input = { ...baseInput, assetClass: 'crypto' as const };
      const result = calculateFixedPercentageLimits(input);
      
      // Should be reduced due to crypto risk (0.4 multiplier)
      expect(result.maxPositionSize).toBe(2); // 5 * 0.4 = 2
      expect(result.maxTotalExposure).toBe(10); // 25 * 0.4 = 10
    });

    it('should reduce limits for beginners', () => {
      const input = { ...baseInput, experience: 'beginner' as const };
      const result = calculateFixedPercentageLimits(input);
      
      // Should be reduced for beginners (0.5 position, 0.6 exposure multiplier)
      expect(result.maxPositionSize).toBe(2.5); // 5 * 0.5 = 2.5
      expect(result.maxTotalExposure).toBe(15); // 25 * 0.6 = 15
    });

    it('should increase limits for advanced traders', () => {
      const input = { ...baseInput, experience: 'advanced' as const };
      const result = calculateFixedPercentageLimits(input);
      
      // Should be increased for advanced (1.2 position, 1.1 exposure multiplier)
      expect(result.maxPositionSize).toBe(6); // 5 * 1.2 = 6
      expect(result.maxTotalExposure).toBe(27.5); // 25 * 1.1 = 27.5
    });

    it('should include warnings for high position sizes', () => {
      const input = { ...baseInput, riskTolerance: 'aggressive' as const };
      const result = calculateFixedPercentageLimits(input);
      
      expect(result.warnings).toContain('High position concentration may increase portfolio volatility');
    });

    it('should cap position size at 15%', () => {
      const input = { 
        ...baseInput, 
        riskTolerance: 'aggressive' as const,
        experience: 'advanced' as const
      };
      const result = calculateFixedPercentageLimits(input);
      
      // 10 * 1.2 = 12, which is under the 15% cap
      expect(result.maxPositionSize).toBeLessThanOrEqual(15);
    });
  });

  describe('calculateRiskBasedLimits', () => {
    it('should calculate limits based on risk per trade', () => {
      const input = { ...baseInput, riskTolerance: 'moderate' as const };
      const result = calculateRiskBasedLimits(input);
      
      // 1% risk per trade, 5% stop loss -> 20% position size
      // But adjusted by strategy multiplier (1.0 for swing trading)
      expect(result.maxPositionSize).toBe(20); // (1.0 / 5) * 100 = 20
      expect(result.maxTotalExposure).toBe(50); // Capped at 50
      expect(result.method).toBe('Risk-Based');
    });

    it('should adjust for trading strategy', () => {
      const input = { ...baseInput, tradingStrategy: 'scalping' as const };
      const result = calculateRiskBasedLimits(input);
      
      // Scalping has 0.5 multiplier, so 1% * 0.5 = 0.5% risk per trade
      expect(result.maxPositionSize).toBe(10); // (0.5 / 5) * 100 = 10
    });

    it('should warn for high risk per trade', () => {
      const input = { ...baseInput, riskTolerance: 'aggressive' as const };
      const result = calculateRiskBasedLimits(input);
      
      // 2% risk per trade is above 1.5% threshold
      expect(result.warnings).toContain('High risk per trade may lead to significant drawdowns');
    });
  });

  describe('calculateVolatilityBasedLimits', () => {
    it('should increase limits in low volatility', () => {
      const input = { ...baseInput, volatilityContext: 'low' as const };
      const result = calculateVolatilityBasedLimits(input);
      
      // Should be 1.2x the base fixed percentage limits
      expect(result.maxPositionSize).toBe(6); // 5 * 1.2 = 6
      expect(result.maxTotalExposure).toBe(30); // 25 * 1.2 = 30
    });

    it('should decrease limits in high volatility', () => {
      const input = { ...baseInput, volatilityContext: 'high' as const };
      const result = calculateVolatilityBasedLimits(input);
      
      // Should be 0.6x the base fixed percentage limits
      expect(result.maxPositionSize).toBe(3); // 5 * 0.6 = 3
      expect(result.maxTotalExposure).toBe(15); // 25 * 0.6 = 15
      expect(result.warnings).toContain('Position sizes reduced due to high market volatility');
    });

    it('should further reduce for high-volatility assets', () => {
      const input = { 
        ...baseInput, 
        assetClass: 'crypto' as const,
        volatilityContext: 'high' as const 
      };
      const result = calculateVolatilityBasedLimits(input);
      
      // Base: 5 * 0.4 (crypto) * 0.6 (high vol) * 0.5 (additional crypto reduction) = 0.6
      expect(result.maxPositionSize).toBe(0.6);
    });
  });

  describe('calculateStrategySpecificLimits', () => {
    it('should provide day trading specific limits', () => {
      const input = { ...baseInput, tradingStrategy: 'day_trading' as const };
      const result = calculateStrategySpecificLimits(input);
      
      expect(result.maxPositionSize).toBe(6); // moderate day trading
      expect(result.maxTotalExposure).toBe(35);
      expect(result.reasoning).toContain('Day trading limits optimized for quick entries/exits');
    });

    it('should provide position trading specific limits', () => {
      const input = { 
        ...baseInput, 
        tradingStrategy: 'position_trading' as const,
        riskTolerance: 'conservative' as const
      };
      const result = calculateStrategySpecificLimits(input);
      
      expect(result.maxPositionSize).toBe(6); // conservative position trading
      expect(result.maxTotalExposure).toBe(30);
      expect(result.reasoning).toContain('Position trading limits for long-term holds');
    });

    it('should warn beginners about scalping', () => {
      const input = { 
        ...baseInput, 
        tradingStrategy: 'scalping' as const,
        experience: 'beginner' as const
      };
      const result = calculateStrategySpecificLimits(input);
      
      expect(result.warnings).toContain('Scalping requires advanced skills and may not be suitable for beginners');
    });

    it('should adjust for goal type', () => {
      const input = { ...baseInput, goalType: 'preservation' as const };
      const result = calculateStrategySpecificLimits(input);
      
      // Should be reduced for preservation goal (0.6 and 0.7 multipliers)
      expect(result.maxPositionSize).toBe(4.8); // 8 * 0.6 = 4.8
      expect(result.maxTotalExposure).toBe(28); // 40 * 0.7 = 28
    });
  });

  describe('calculateCapitalObjectiveLimits', () => {
    it('should calculate conservative limits for low target returns', () => {
      const result = calculateCapitalObjectiveLimits(
        baseInput,
        100000, // current
        110000, // target (10% growth)
        12 // 12 months
      );
      
      expect(result.maxPositionSize).toBe(3); // Low target return
      expect(result.maxTotalExposure).toBe(20);
      expect(result.reasoning).toContain('10.0% return over 12 months (10.0% annualized)');
    });

    it('should calculate aggressive limits for high target returns', () => {
      const result = calculateCapitalObjectiveLimits(
        baseInput,
        100000, // current
        200000, // target (100% growth)
        12 // 12 months
      );
      
      expect(result.maxPositionSize).toBe(10); // Very aggressive target
      expect(result.maxTotalExposure).toBe(50);
      expect(result.warnings).toContain('Target return is very aggressive and may require significant risk');
    });

    it('should warn about short time horizons', () => {
      const result = calculateCapitalObjectiveLimits(
        baseInput,
        100000,
        120000,
        3 // 3 months
      );
      
      expect(result.warnings).toContain('Short time horizon increases risk for achieving target');
    });

    it('should adjust for risk tolerance', () => {
      const conservativeInput = { ...baseInput, riskTolerance: 'conservative' as const };
      const result = calculateCapitalObjectiveLimits(
        conservativeInput,
        100000,
        130000, // 30% growth
        12
      );
      
      // Should be reduced by 0.7 multiplier for conservative
      expect(result.maxPositionSize).toBe(3.5); // 5 * 0.7 = 3.5
    });
  });

  describe('generateComprehensiveRecommendation', () => {
    it('should select capital objective as primary when applicable', () => {
      const input = { ...baseInput, goalType: 'capital_objective' as const };
      const capitalData = {
        currentBalance: 100000,
        targetBalance: 120000,
        timeHorizonMonths: 12
      };
      
      const result = generateComprehensiveRecommendation(input, capitalData);
      
      expect(result.primary.method).toBe('Capital Objective');
      expect(result.alternatives).toHaveLength(4); // All other methods
    });

    it('should select strategy-specific for non-swing trading', () => {
      const input = { ...baseInput, tradingStrategy: 'day_trading' as const };
      const result = generateComprehensiveRecommendation(input);
      
      expect(result.primary.method).toBe('Strategy-Specific');
    });

    it('should select volatility-based for non-normal volatility', () => {
      const input = { ...baseInput, volatilityContext: 'high' as const };
      const result = generateComprehensiveRecommendation(input);
      
      expect(result.primary.method).toBe('Volatility-Based');
    });

    it('should default to risk-based method', () => {
      const result = generateComprehensiveRecommendation(baseInput);
      
      expect(result.primary.method).toBe('Risk-Based');
    });

    it('should include risk metrics', () => {
      const result = generateComprehensiveRecommendation(baseInput);
      
      expect(result.riskMetrics).toHaveProperty('estimatedMaxDrawdown');
      expect(result.riskMetrics).toHaveProperty('concentrationRisk');
      expect(result.riskMetrics).toHaveProperty('liquidityRisk');
    });
  });

  describe('validateUserLimits', () => {
    const recommendation = {
      maxPositionSize: 5,
      maxTotalExposure: 25,
      reasoning: 'Test',
      method: 'Test',
      confidence: 'high' as const
    };

    it('should validate limits within acceptable range', () => {
      const result = validateUserLimits(4, 22, recommendation);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.severity).toBe('low');
    });

    it('should warn about moderate deviations', () => {
      const result = validateUserLimits(8, 40, recommendation); // 60% and 60% deviations
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Position size deviates 60% from recommended');
      expect(result.warnings).toContain('Total exposure deviates 60% from recommended');
      expect(result.severity).toBe('medium');
    });

    it('should warn about extreme deviations', () => {
      const result = validateUserLimits(12, 60, recommendation); // More than double
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Position size is more than double the recommended amount');
      expect(result.warnings).toContain('Total exposure is more than double the recommended amount');
      expect(result.severity).toBe('high');
    });

    it('should warn about absolute high limits', () => {
      const result = validateUserLimits(25, 85, recommendation);
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Position size above 20% carries very high concentration risk');
      expect(result.warnings).toContain('Total exposure above 80% leaves little room for risk management');
      expect(result.severity).toBe('high');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle zero account size gracefully', () => {
      const input = { ...baseInput, accountSize: 0 };
      const result = calculateFixedPercentageLimits(input);
      
      expect(result).toBeDefined();
      expect(result.maxPositionSize).toBeGreaterThan(0);
    });

    it('should handle invalid risk tolerance gracefully', () => {
      const input = { ...baseInput, riskTolerance: 'invalid' as any };
      const result = calculateFixedPercentageLimits(input);
      
      expect(result.maxPositionSize).toBe(5); // Should default to moderate
    });

    it('should handle missing optional parameters', () => {
      const minimalInput: PositionSizingInput = {
        accountSize: 50000,
        riskTolerance: 'moderate',
        tradingStrategy: 'swing_trading',
        goalType: 'growth'
      };
      
      const result = calculateFixedPercentageLimits(minimalInput);
      
      expect(result).toBeDefined();
      expect(result.maxPositionSize).toBe(5);
    });
  });
}); 
 
 
 