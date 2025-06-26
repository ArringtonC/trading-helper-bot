import {
  generatePositionLimitRecommendations,
  validateUserPositionLimits,
  getQuickRecommendation,
  UserProfile,
  CurrentLimits,
  RecommendationResult
} from '../positionLimitEngine';

describe('Position Limit Recommendation Engine', () => {
  const baseUserProfile: UserProfile = {
    accountSize: 100000,
    riskTolerance: 'moderate',
    tradingStrategy: 'swing_trading',
    experienceLevel: 'import',
    goalType: 'growth'
  };

  describe('generatePositionLimitRecommendations', () => {
    it('should generate recommendations for moderate risk user', () => {
      const result = generatePositionLimitRecommendations(baseUserProfile);

      expect(result).toHaveProperty('recommended');
      expect(result).toHaveProperty('rationale');
      expect(result).toHaveProperty('comparison');
      expect(result).toHaveProperty('bestPractices');
      expect(result).toHaveProperty('adjustments');
      expect(result).toHaveProperty('disclaimer');

      expect(result.recommended.maxPositionSize).toBeGreaterThan(0);
      expect(result.recommended.maxTotalExposure).toBeGreaterThan(0);
      expect(result.recommended.riskPerTrade).toBeGreaterThan(0);

      expect(result.rationale.primary).toContain('moderate');
      expect(result.rationale.factors).toBeInstanceOf(Array);
      expect(result.rationale.factors.length).toBeGreaterThan(0);
    });

    it('should apply conservative limits for conservative users', () => {
      const conservativeProfile: UserProfile = {
        ...baseUserProfile,
        riskTolerance: 'conservative',
        experienceLevel: 'learning'
      };

      const result = generatePositionLimitRecommendations(conservativeProfile);

      expect(result.recommended.maxPositionSize).toBeLessThan(5);
      expect(result.recommended.maxTotalExposure).toBeLessThan(25);
      expect(result.rationale.primary).toContain('conservative');
    });

    it('should apply appropriate adjustments for crypto assets', () => {
      const cryptoProfile: UserProfile = {
        ...baseUserProfile,
        assetClass: 'crypto',
        marketCondition: 'high_volatility'
      };

      const normalResult = generatePositionLimitRecommendations(baseUserProfile);
      const cryptoResult = generatePositionLimitRecommendations(cryptoProfile);

      // Crypto should have lower position limits due to higher volatility
      expect(cryptoResult.recommended.maxPositionSize).toBeLessThan(normalResult.recommended.maxPositionSize);
      expect(cryptoResult.adjustments.applied.length).toBeGreaterThan(0);
    });

    it('should generate warnings when comparing with risky user limits', () => {
      const riskyLimits: CurrentLimits = {
        maxPositionSize: 25, // Very high
        maxTotalExposure: 80, // Very high
        riskPerTrade: 5 // Very high
      };

      const result = generatePositionLimitRecommendations(baseUserProfile, riskyLimits);

      expect(result.comparison.warnings.length).toBeGreaterThan(0);
      expect(result.comparison.warnings.some(w => w.severity === 'critical')).toBe(true);
    });

    it('should include educational content for relevant scenarios', () => {
      const cryptoProfile: UserProfile = {
        ...baseUserProfile,
        assetClass: 'crypto',
        tradingStrategy: 'swing_trading'
      };

      const result = generatePositionLimitRecommendations(cryptoProfile);

      expect(result.bestPractices.educationalContent).toHaveProperty('positionSizing');
      expect(result.bestPractices.educationalContent).toHaveProperty('riskPerTrade');
      expect(result.bestPractices.educationalContent).toHaveProperty('diversification');
      expect(result.bestPractices.educationalContent).toHaveProperty('volatility');
    });

    it('should generate compliance indicators', () => {
      const result = generatePositionLimitRecommendations(baseUserProfile);

      expect(result.comparison.compliance).toHaveProperty('conservative');
      expect(result.comparison.compliance).toHaveProperty('moderate');
      expect(result.comparison.compliance).toHaveProperty('aggressive');
      expect(typeof result.comparison.compliance.conservative).toBe('boolean');
    });
  });

  describe('validateUserPositionLimits', () => {
    it('should validate reasonable limits', () => {
      const reasonableLimits: CurrentLimits = {
        maxPositionSize: 5,
        maxTotalExposure: 25,
        riskPerTrade: 1
      };

      const result = validateUserPositionLimits(reasonableLimits, baseUserProfile);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject unreasonable limits', () => {
      const unreasonableLimits: CurrentLimits = {
        maxPositionSize: 60, // Too high
        maxTotalExposure: 120, // Impossible
        riskPerTrade: 15 // Too high
      };

      const result = validateUserPositionLimits(unreasonableLimits, baseUserProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn beginners about high limits', () => {
      const beginnerProfile: UserProfile = {
        ...baseUserProfile,
        experienceLevel: 'learning'
      };

      const highLimits: CurrentLimits = {
        maxPositionSize: 8,
        maxTotalExposure: 35,
        riskPerTrade: 2
      };

      const result = validateUserPositionLimits(highLimits, beginnerProfile);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getQuickRecommendation', () => {
    it('should provide quick summary recommendations', () => {
      const result = getQuickRecommendation(baseUserProfile);

      expect(result).toHaveProperty('maxPositionSize');
      expect(result).toHaveProperty('maxTotalExposure');
      expect(result).toHaveProperty('riskPerTrade');
      expect(result).toHaveProperty('summary');

      expect(typeof result.maxPositionSize).toBe('number');
      expect(typeof result.maxTotalExposure).toBe('number');
      expect(typeof result.riskPerTrade).toBe('number');
      expect(typeof result.summary).toBe('string');

      expect(result.maxPositionSize).toBeGreaterThan(0);
      expect(result.maxTotalExposure).toBeGreaterThan(0);
      expect(result.riskPerTrade).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle minimal account sizes', () => {
      const smallAccountProfile: UserProfile = {
        ...baseUserProfile,
        accountSize: 1000
      };

      const result = generatePositionLimitRecommendations(smallAccountProfile);

      expect(result.recommended.maxPositionSize).toBeGreaterThan(0);
      expect(result.recommended.maxTotalExposure).toBeGreaterThan(0);
    });

    it('should handle large account sizes', () => {
      const largeAccountProfile: UserProfile = {
        ...baseUserProfile,
        accountSize: 10000000
      };

      const result = generatePositionLimitRecommendations(largeAccountProfile);

      expect(result.recommended.maxPositionSize).toBeGreaterThan(0);
      expect(result.recommended.maxTotalExposure).toBeGreaterThan(0);
    });

    it('should handle aggressive day trader profile', () => {
      const aggressiveProfile: UserProfile = {
        ...baseUserProfile,
        riskTolerance: 'aggressive',
        tradingStrategy: 'day_trading',
        experienceLevel: 'broker',
        assetClass: 'stocks'
      };

      const result = generatePositionLimitRecommendations(aggressiveProfile);

      expect(result.recommended.maxPositionSize).toBeGreaterThan(0);
      expect(result.rationale.primary).toContain('aggressive');
    });

    it('should handle capital objective parameters', () => {
      const capitalObjectiveProfile: UserProfile = {
        ...baseUserProfile,
        goalType: 'capital_objective',
        capitalObjectiveParameters: {
          currentBalance: 100000,
          targetBalance: 150000,
          timeHorizonMonths: 24
        }
      };

      const result = generatePositionLimitRecommendations(capitalObjectiveProfile);

      expect(result.recommended.maxPositionSize).toBeGreaterThan(0);
      expect(result.recommended.maxTotalExposure).toBeGreaterThan(0);
    });
  });

  describe('Market Conditions Integration', () => {
    it('should adjust for bear market conditions', () => {
      const bearMarketProfile: UserProfile = {
        ...baseUserProfile,
        marketCondition: 'bear_market'
      };

      const normalResult = generatePositionLimitRecommendations(baseUserProfile);
      const bearResult = generatePositionLimitRecommendations(bearMarketProfile);

      // Bear market should generally result in more conservative positioning
      expect(bearResult.adjustments.applied.some(adj => adj.includes('market'))).toBe(true);
    });

    it('should adjust for crisis conditions', () => {
      const crisisProfile: UserProfile = {
        ...baseUserProfile,
        marketCondition: 'crisis_conditions'
      };

      const result = generatePositionLimitRecommendations(crisisProfile);

      expect(result.adjustments.applied.some(adj => adj.includes('crisis') || adj.includes('market'))).toBe(true);
    });
  });

  describe('Best Practices Integration', () => {
    it('should include applicable best practice rules', () => {
      const result = generatePositionLimitRecommendations(baseUserProfile);

      expect(result.bestPractices.applicableRules).toBeInstanceOf(Array);
      expect(result.bestPractices.criticalRules).toBeInstanceOf(Array);
      expect(result.bestPractices.criticalRules.length).toBeGreaterThan(0);
    });

    it('should provide rationale factors based on profile', () => {
      const result = generatePositionLimitRecommendations(baseUserProfile);

      expect(result.rationale.factors.some(factor => factor.includes('moderate'))).toBe(true);
      expect(result.rationale.factors.some(factor => factor.includes('swing trading'))).toBe(true);
      expect(result.rationale.factors.some(factor => factor.includes('import'))).toBe(true);
    });
  });

  describe('Warning System', () => {
    it('should generate appropriate warning levels', () => {
      const moderatelyRiskyLimits: CurrentLimits = {
        maxPositionSize: 8, // Slightly high
        maxTotalExposure: 35, // Slightly high
        riskPerTrade: 1.5
      };

      const result = generatePositionLimitRecommendations(baseUserProfile, moderatelyRiskyLimits);

      const hasWarnings = result.comparison.warnings.length > 0;
      if (hasWarnings) {
        expect(result.comparison.warnings.every(w => ['info', 'warning', 'critical'].includes(w.severity))).toBe(true);
        expect(result.comparison.warnings.every(w => w.message.length > 0)).toBe(true);
        expect(result.comparison.warnings.every(w => w.recommendation.length > 0)).toBe(true);
      }
    });
  });
}); 
 
 
 