import UserExperienceAssessment, {
  UserBehaviorMetrics,
  TradingHistoryData,
  ExplicitPreferences,
  AssessmentResult,
  RiskProfile
} from '../UserExperienceAssessment';

describe('UserExperienceAssessment', () => {
  let assessment: UserExperienceAssessment;

  beforeEach(() => {
    assessment = new UserExperienceAssessment();
  });

  describe('assessUser', () => {
    it('should assess a complete beginner correctly', () => {
      const behavior: Partial<UserBehaviorMetrics> = {
        timeSpentInApp: 30,
        featuresUsed: ['position-sizing'],
        errorRate: 0.4,
        complexFeaturesAccessed: []
      };

      const trading: Partial<TradingHistoryData> = {
        tradingExperienceYears: 0,
        totalTrades: 0,
        accountSize: 1000,
        hasLiveTradingExperience: false
      };

      const preferences: Partial<ExplicitPreferences> = {
        hasCompletedOnboarding: false
      };

      const result = assessment.assessUser(behavior, trading, preferences);

      expect(result.userLevel).toBe('beginner');
      expect(result.riskProfile.level).toBe('conservative');
      expect(result.shouldShowOnboarding).toBe(true);
      expect(result.recommendations).toContain('Start with the Position Sizing tool to learn proper risk management');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should assess an intermediate user correctly', () => {
      const behavior: Partial<UserBehaviorMetrics> = {
        timeSpentInApp: 200,
        featuresUsed: ['position-sizing', 'visualizer', 'analytics'],
        errorRate: 0.1,
        complexFeaturesAccessed: ['analytics', 'visualizer']
      };

      const trading: Partial<TradingHistoryData> = {
        tradingExperienceYears: 1.5,
        totalTrades: 50,
        accountSize: 15000,
        instrumentsTraded: ['stocks', 'options'],
        winRate: 0.55,
        hasLiveTradingExperience: true
      };

      const preferences: Partial<ExplicitPreferences> = {
        hasCompletedOnboarding: true,
        preferredComplexity: 'moderate'
      };

      const result = assessment.assessUser(behavior, trading, preferences);

      expect(result.userLevel).toBe('intermediate');
      expect(result.riskProfile.level).toBe('moderate');
      expect(result.shouldShowOnboarding).toBe(false);
      expect(result.recommendations).toContain('Explore the Options Trading tools for advanced strategies');
    });

    it('should assess an advanced user correctly', () => {
      const behavior: Partial<UserBehaviorMetrics> = {
        timeSpentInApp: 800,
        featuresUsed: ['position-sizing', 'visualizer', 'analytics', 'rule-engine', 'ai-analysis'],
        errorRate: 0.02,
        complexFeaturesAccessed: ['rule-engine', 'ai-analysis', 'advanced-analytics']
      };

      const trading: Partial<TradingHistoryData> = {
        tradingExperienceYears: 8,
        totalTrades: 500,
        accountSize: 150000,
        instrumentsTraded: ['stocks', 'options', 'futures'],
        winRate: 0.68,
        hasLiveTradingExperience: true
      };

      const preferences: Partial<ExplicitPreferences> = {
        hasCompletedOnboarding: true,
        preferredComplexity: 'advanced',
        preferredRiskLevel: 'aggressive'
      };

      const result = assessment.assessUser(behavior, trading, preferences);

      expect(result.userLevel).toBe('advanced');
      expect(result.riskProfile.level).toBe('aggressive');
      expect(result.shouldShowOnboarding).toBe(false);
      expect(result.recommendations).toContain('Set up IBKR connection for live data integration');
    });

    it('should handle manual override', () => {
      const preferences: Partial<ExplicitPreferences> = {
        manualOverride: 'advanced',
        preferredRiskLevel: 'moderate'
      };

      const result = assessment.assessUser({}, {}, preferences);

      expect(result.userLevel).toBe('advanced');
      expect(result.confidence).toBe(1.0);
      expect(result.reasoning).toContain('User manually set experience level to advanced');
    });

    it('should respect explicit self-reported level', () => {
      const behavior: Partial<UserBehaviorMetrics> = {
        timeSpentInApp: 30,
        featuresUsed: ['position-sizing'],
        errorRate: 0.4
      };

      const preferences: Partial<ExplicitPreferences> = {
        selfReportedLevel: 'intermediate'
      };

      const result = assessment.assessUser(behavior, {}, preferences);

      expect(result.userLevel).toBe('intermediate');
    });

    it('should identify warning flags', () => {
      const behavior: Partial<UserBehaviorMetrics> = {
        errorRate: 0.5, // High error rate
        timeSpentInApp: 30 // Low usage with large account
      };

      const trading: Partial<TradingHistoryData> = {
        accountSize: 200000, // Large account
        riskPerTrade: 0.08, // High risk per trade
        tradingExperienceYears: 0.5 // Low experience
      };

      const preferences: Partial<ExplicitPreferences> = {
        selfReportedLevel: 'advanced' // Inconsistent with experience
      };

      const result = assessment.assessUser(behavior, trading, preferences);

      expect(result.warningFlags).toContain('High error rate detected - consider additional tutorials');
      expect(result.warningFlags).toContain('Risk per trade is above recommended 5% maximum');
      expect(result.warningFlags).toContain('Large account with limited app usage - recommend thorough education');
      expect(result.warningFlags).toContain('Self-reported level may not match trading experience');
    });

    it('should calculate confidence based on data availability', () => {
      // Complete data
      const completeResult = assessment.assessUser(
        {
          timeSpentInApp: 100,
          featuresUsed: ['position-sizing', 'analytics'],
          errorRate: 0.1,
          complexFeaturesAccessed: ['analytics']
        },
        {
          tradingExperienceYears: 2,
          accountSize: 50000,
          instrumentsTraded: ['stocks', 'options'],
          winRate: 0.6,
          totalTrades: 100
        },
        {
          selfReportedLevel: 'intermediate'
        }
      );

      // Minimal data
      const minimalResult = assessment.assessUser({}, {}, {});

      expect(completeResult.confidence).toBeGreaterThan(minimalResult.confidence);
    });
  });

  describe('quickAssessment', () => {
    it('should provide quick assessment for new users', () => {
      const preferences: Partial<ExplicitPreferences> = {
        selfReportedLevel: 'beginner'
      };

      const result = assessment.quickAssessment(preferences);

      expect(result.userLevel).toBe('beginner');
      expect(result.riskProfile.level).toBe('conservative');
      expect(result.shouldShowOnboarding).toBe(true);
    });

    it('should handle minimal preferences in quick assessment', () => {
      const result = assessment.quickAssessment({});

      expect(result.userLevel).toBe('beginner'); // Default for new users
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('risk profile determination', () => {
    it('should assign conservative profile to beginners', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 30, featuresUsed: ['position-sizing'] },
        { tradingExperienceYears: 0 },
        {}
      );

      expect(result.riskProfile.level).toBe('conservative');
      expect(result.riskProfile.defaultRiskPercent).toBe(0.75);
      expect(result.riskProfile.maxRiskPercent).toBe(2.0);
      expect(result.riskProfile.vixAdjustmentEnabled).toBe(true);
    });

    it('should assign moderate profile to intermediate users', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 200, featuresUsed: ['position-sizing', 'analytics'] },
        { tradingExperienceYears: 2, accountSize: 30000 },
        {}
      );

      expect(result.riskProfile.level).toBe('moderate');
      expect(result.riskProfile.defaultRiskPercent).toBe(1.5);
      expect(result.riskProfile.maxRiskPercent).toBe(3.0);
    });

    it('should assign aggressive profile to advanced users with large accounts', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 500, featuresUsed: ['position-sizing', 'analytics', 'rule-engine'] },
        { tradingExperienceYears: 5, accountSize: 100000 },
        {}
      );

      expect(result.riskProfile.level).toBe('aggressive');
      expect(result.riskProfile.defaultRiskPercent).toBe(2.5);
      expect(result.riskProfile.maxRiskPercent).toBe(5.0);
      expect(result.riskProfile.vixAdjustmentEnabled).toBe(false);
    });

    it('should respect explicit risk preference', () => {
      const result = assessment.assessUser(
        {},
        {},
        { preferredRiskLevel: 'aggressive' }
      );

      expect(result.riskProfile.level).toBe('aggressive');
    });
  });

  describe('recommendations generation', () => {
    it('should provide beginner-appropriate recommendations', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 30, tutorialProgress: 25 },
        { tradingExperienceYears: 0 },
        {}
      );

      expect(result.recommendations).toContain('Start with the Position Sizing tool to learn proper risk management');
      expect(result.recommendations).toContain('Complete the Interactive Tutorial to understand key concepts');
      expect(result.recommendations).toContain('Continue working through the tutorial - you\'re making good progress!');
    });

    it('should provide intermediate-appropriate recommendations', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 200 },
        { tradingExperienceYears: 2, winRate: 0.45 },
        {}
      );

      expect(result.recommendations).toContain('Explore the Options Trading tools for advanced strategies');
      expect(result.recommendations).toContain('Focus on improving your win rate before increasing position sizes');
    });

    it('should provide advanced recommendations', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 600 },
        { tradingExperienceYears: 5 },
        {}
      );

      expect(result.recommendations).toContain('Set up IBKR connection for live data integration');
      expect(result.recommendations).toContain('Use AI Analysis for market insights');
    });
  });

  describe('suggested features', () => {
    it('should suggest appropriate features for beginners', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 30 },
        { tradingExperienceYears: 0 },
        {}
      );

      expect(result.suggestedFeatures).toEqual(['position-sizing', 'tutorial']);
    });

    it('should suggest appropriate features for intermediate users', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 200 },
        { tradingExperienceYears: 2 },
        {}
      );

      expect(result.suggestedFeatures).toContain('position-sizing');
      expect(result.suggestedFeatures).toContain('tutorial');
      expect(result.suggestedFeatures).toContain('options-trading');
      expect(result.suggestedFeatures).toContain('analytics');
    });

    it('should suggest all features for advanced users', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 600 },
        { tradingExperienceYears: 5 },
        {}
      );

      expect(result.suggestedFeatures).toContain('rule-engine');
      expect(result.suggestedFeatures).toContain('ai-analysis');
      expect(result.suggestedFeatures).toContain('advanced-analytics');
    });
  });

  describe('edge cases', () => {
    it('should handle empty input gracefully', () => {
      const result = assessment.assessUser({}, {}, {});

      expect(result.userLevel).toBe('beginner'); // Default fallback
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.riskProfile).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle partial data correctly', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 100 }, // Only behavior data
        {}, // No trading data
        {} // No preferences
      );

      expect(result.userLevel).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('should handle inconsistent data appropriately', () => {
      const result = assessment.assessUser(
        { 
          timeSpentInApp: 30, // Beginner behavior
          featuresUsed: ['position-sizing']
        },
        { 
          tradingExperienceYears: 10, // Advanced experience
          accountSize: 500000
        },
        {}
      );

      expect(result.confidence).toBeLessThan(0.8); // Lower confidence for inconsistent data
      expect(result.userLevel).toBeDefined();
    });

    it('should handle extreme values appropriately', () => {
      const result = assessment.assessUser(
        {
          timeSpentInApp: 10000, // Extreme usage
          errorRate: 0 // Perfect performance
        },
        {
          tradingExperienceYears: 50, // Extreme experience
          accountSize: 10000000 // Very large account
        },
        {}
      );

      expect(result.userLevel).toBe('advanced');
      expect(result.riskProfile.level).toBe('aggressive');
    });
  });

  describe('onboarding logic', () => {
    it('should show onboarding for beginners', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 30 },
        { tradingExperienceYears: 0 },
        { hasCompletedOnboarding: false }
      );

      expect(result.shouldShowOnboarding).toBe(true);
    });

    it('should not show onboarding if already completed', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 30 },
        { tradingExperienceYears: 0 },
        { hasCompletedOnboarding: true }
      );

      expect(result.shouldShowOnboarding).toBe(false);
    });

    it('should show onboarding for users without self-reported level', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 200 },
        { tradingExperienceYears: 2 },
        {} // No self-reported level
      );

      expect(result.shouldShowOnboarding).toBe(true);
    });

    it('should not show onboarding for advanced users', () => {
      const result = assessment.assessUser(
        { timeSpentInApp: 600 },
        { tradingExperienceYears: 5 },
        { selfReportedLevel: 'advanced' }
      );

      expect(result.shouldShowOnboarding).toBe(false);
    });
  });
}); 