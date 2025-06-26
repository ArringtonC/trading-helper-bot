/**
 * Trading Strategy Service Test Suite
 * 
 * Comprehensive tests for the Trading Strategy Database Service
 * covering strategy management, recommendations, performance tracking,
 * and Challenge RPG system integration.
 */

import { 
  TradingStrategyService, 
  StrategyCategory, 
  RiskLevel, 
  TimeHorizon,
  MarketCondition,
  MarketEnvironment,
  UserProfile,
  SkillCategory,
  StrategyRecommendation,
  TradingStrategy
} from '../TradingStrategyService';
import { VolatilityRegime } from '../../../../shared/services/MarketAnalysisService';
import { NormalizedTradeData, BrokerType } from '../../../../shared/types/trade';

describe('TradingStrategyService', () => {
  let service: TradingStrategyService;
  let mockUserProfile: UserProfile;
  let mockMarketEnvironment: MarketEnvironment;
  let mockTrades: NormalizedTradeData[];

  beforeEach(() => {
    service = TradingStrategyService.getInstance();
    
    // Mock user profile
    mockUserProfile = {
      userId: 'test-user-001',
      accountSize: 25000,
      experienceLevel: 'INTERMEDIATE',
      riskTolerance: RiskLevel.MODERATE,
      timeAvailabilityMinutes: 60,
      preferredTimeframes: [TimeHorizon.SWING, TimeHorizon.DAY_TRADE],
      skillLevels: {
        [SkillCategory.PATIENCE]: 6,
        [SkillCategory.RISK_MANAGEMENT]: 7,
        [SkillCategory.SETUP_QUALITY]: 5,
        [SkillCategory.STRATEGY_ADHERENCE]: 6,
        [SkillCategory.STRESS_MANAGEMENT]: 4,
        [SkillCategory.PROFIT_PROTECTION]: 5,
        [SkillCategory.DISCIPLINE_CONTROL]: 6
      },
      tradingGoals: ['Consistent profitability', 'Risk management'],
      avoidedStrategies: [],
      preferredStrategies: [],
      challengeParticipation: true,
      currentStrategyClass: 'BUFFETT_GUARDIAN'
    };

    // Mock market environment
    mockMarketEnvironment = {
      volatilityRegime: VolatilityRegime.MEDIUM,
      trendDirection: 'UPTREND',
      marketCondition: MarketCondition.BULL_MARKET,
      vixLevel: 18.5,
      marketSentiment: 'BULLISH',
      sectorRotation: ['Technology', 'Healthcare'],
      economicCycle: 'EXPANSION'
    };

    // Mock trade data
    mockTrades = [
      {
        id: 'trade-001',
        importTimestamp: '2024-01-15T10:00:00Z',
        tradeDate: '2024-01-15',
        symbol: 'AAPL',
        description: 'Apple Inc',
        quantity: 100,
        tradePrice: 185.50,
        netAmount: 1500,
        commission: 1.0,
        assetCategory: 'STK',
        action: 'BUY',
        broker: BrokerType.IBKR,
        openCloseIndicator: 'O',
        currency: 'USD'
      },
      {
        id: 'trade-002',
        importTimestamp: '2024-01-22T15:30:00Z',
        tradeDate: '2024-01-22',
        symbol: 'AAPL',
        description: 'Apple Inc',
        quantity: -100,
        tradePrice: 200.25,
        netAmount: 1475,
        commission: 1.0,
        assetCategory: 'STK',
        action: 'SELL',
        broker: BrokerType.IBKR,
        openCloseIndicator: 'C',
        currency: 'USD'
      }
    ];
  });

  describe('Strategy Management', () => {
    test('should return all active strategies', () => {
      const strategies = service.getAllStrategies();
      expect(strategies).toHaveLength(15); // Based on mock data
      expect(strategies.every(s => s.status === 'ACTIVE')).toBe(true);
    });

    test('should filter strategies by category', () => {
      const momentumStrategies = service.getStrategyByCategory(StrategyCategory.MOMENTUM);
      expect(momentumStrategies.length).toBeGreaterThan(0);
      expect(momentumStrategies.every(s => s.category === StrategyCategory.MOMENTUM)).toBe(true);
    });

    test('should retrieve strategy by ID', () => {
      const strategies = service.getAllStrategies();
      const firstStrategy = strategies[0];
      const retrievedStrategy = service.getStrategyById(firstStrategy.id);
      
      expect(retrievedStrategy).not.toBeNull();
      expect(retrievedStrategy?.id).toBe(firstStrategy.id);
    });

    test('should return null for non-existent strategy ID', () => {
      const strategy = service.getStrategyById('non-existent-id');
      expect(strategy).toBeNull();
    });
  });

  describe('Strategy Recommendations', () => {
    test('should generate strategy recommendations', async () => {
      const recommendations = await service.getRecommendedStrategies(
        mockMarketEnvironment,
        mockUserProfile,
        5
      );

      expect(recommendations).toHaveLength(5);
      expect(recommendations[0].confidenceScore).toBeGreaterThan(30);
      expect(recommendations.every(r => r.confidenceScore >= recommendations[recommendations.length - 1].confidenceScore)).toBe(true);
    });

    test('should include reasons and warnings in recommendations', async () => {
      const recommendations = await service.getRecommendedStrategies(
        mockMarketEnvironment,
        mockUserProfile,
        3
      );

      recommendations.forEach(rec => {
        expect(rec.reasons.length).toBeGreaterThan(0);
        expect(rec.estimatedPerformance).toBeDefined();
        expect(rec.xpPotential).toBeGreaterThan(0);
      });
    });

    test('should adjust recommendations based on account size', async () => {
      const smallAccountProfile = { ...mockUserProfile, accountSize: 3000 };
      const recommendations = await service.getRecommendedStrategies(
        mockMarketEnvironment,
        smallAccountProfile,
        10
      );

      // Should exclude strategies requiring larger accounts
      const expensiveStrategies = recommendations.filter(r => 
        r.strategy.minAccountSize > smallAccountProfile.accountSize
      );
      expect(expensiveStrategies.length).toBe(0);
    });

    test('should consider risk tolerance in recommendations', async () => {
      const conservativeProfile = { ...mockUserProfile, riskTolerance: RiskLevel.VERY_LOW };
      const recommendations = await service.getRecommendedStrategies(
        mockMarketEnvironment,
        conservativeProfile,
        5
      );

      // Should prefer lower risk strategies
      const highRiskStrategies = recommendations.filter(r => 
        r.strategy.riskLevel === RiskLevel.VERY_HIGH
      );
      expect(highRiskStrategies.length).toBeLessThan(3);
    });

    test('should consider market conditions in recommendations', async () => {
      const bearMarketEnvironment = {
        ...mockMarketEnvironment,
        marketCondition: MarketCondition.BEAR_MARKET,
        marketSentiment: 'BEARISH' as const
      };

      const recommendations = await service.getRecommendedStrategies(
        bearMarketEnvironment,
        mockUserProfile,
        5
      );

      // Should favor strategies suited for bear markets
      const bearMarketSuitedStrategies = recommendations.filter(r =>
        r.strategy.idealMarketConditions.includes(MarketCondition.BEAR_MARKET)
      );
      expect(bearMarketSuitedStrategies.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Strategy Management', () => {
    test('should add custom strategy', async () => {
      const customStrategyData = {
        name: 'My Custom Strategy',
        description: 'A personalized trading strategy',
        category: StrategyCategory.SWING,
        riskLevel: RiskLevel.MODERATE,
        timeHorizon: TimeHorizon.SWING,
        minAccountSize: 10000,
        winRateEstimate: 55,
        avgProfitTarget: 8,
        avgStopLoss: 4,
        profitFactor: 1.8,
        idealMarketConditions: [MarketCondition.BULL_MARKET],
        avoidMarketConditions: [MarketCondition.BEAR_MARKET],
        volatilityPreference: [VolatilityRegime.MEDIUM],
        entrySignals: ['Custom signal 1'],
        exitSignals: ['Custom exit 1'],
        requiredIndicators: ['RSI'],
        optionalIndicators: ['MACD'],
        skillLevel: 'INTERMEDIATE' as const,
        timeCommitmentMinutes: 30,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.0,
        skillCategories: [SkillCategory.SETUP_QUALITY],
        difficultyRating: 5,
        status: 'ACTIVE' as const,
        createdBy: 'test-user-001'
      };

      const customStrategy = await service.addCustomStrategy(customStrategyData);

      expect(customStrategy.id).toBeDefined();
      expect(customStrategy.isCustom).toBe(true);
      expect(customStrategy.name).toBe('My Custom Strategy');
      expect(customStrategy.status).toBe('CUSTOM');
    });

    test('should emit event when custom strategy is created', async () => {
      const eventSpy = jest.fn();
      service.on('custom-strategy-created', eventSpy);

      const customStrategyData = {
        name: 'Test Strategy',
        description: 'Test description',
        category: StrategyCategory.MOMENTUM,
        riskLevel: RiskLevel.LOW,
        timeHorizon: TimeHorizon.DAY_TRADE,
        minAccountSize: 5000,
        winRateEstimate: 50,
        avgProfitTarget: 5,
        avgStopLoss: 3,
        profitFactor: 1.5,
        idealMarketConditions: [MarketCondition.BULL_MARKET],
        avoidMarketConditions: [],
        volatilityPreference: [VolatilityRegime.LOW],
        entrySignals: [],
        exitSignals: [],
        requiredIndicators: [],
        optionalIndicators: [],
        skillLevel: 'BEGINNER' as const,
        timeCommitmentMinutes: 20,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.0,
        skillCategories: [SkillCategory.PATIENCE],
        difficultyRating: 3,
        status: 'ACTIVE' as const
      };

      await service.addCustomStrategy(customStrategyData);
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Tracking', () => {
    test('should update strategy performance with trade data', async () => {
      const strategies = service.getAllStrategies();
      const testStrategy = strategies[0];

      await service.updateStrategyPerformance(
        testStrategy.id,
        mockUserProfile.userId,
        mockTrades
      );

      const performance = service.getStrategyPerformance(
        mockUserProfile.userId,
        testStrategy.id
      );

      expect(performance).toHaveLength(1);
      expect(performance[0].totalTrades).toBe(2);
      expect(performance[0].winningTrades).toBe(1);
      expect(performance[0].winRate).toBe(50);
      expect(performance[0].totalPnL).toBe(2975);
    });

    test('should emit performance update event', async () => {
      const eventSpy = jest.fn();
      service.on('performance-updated', eventSpy);

      const strategies = service.getAllStrategies();
      const testStrategy = strategies[0];

      await service.updateStrategyPerformance(
        testStrategy.id,
        mockUserProfile.userId,
        mockTrades
      );

      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    test('should emit XP earned event for good performance', async () => {
      const xpEventSpy = jest.fn();
      service.on('xp-earned', xpEventSpy);

      const strategies = service.getAllStrategies();
      const testStrategy = strategies[0];

      const profitableTrades = [
        {
          ...mockTrades[0],
          netAmount: 1000
        },
        {
          ...mockTrades[1],
          netAmount: 800
        }
      ];

      await service.updateStrategyPerformance(
        testStrategy.id,
        mockUserProfile.userId,
        profitableTrades
      );

      expect(xpEventSpy).toHaveBeenCalledWith(
        mockUserProfile.userId,
        expect.any(Number),
        expect.stringContaining('Strategy:')
      );
    });

    test('should calculate correct performance metrics', async () => {
      const strategies = service.getAllStrategies();
      const testStrategy = strategies[0];

      const testTrades = [
        { ...mockTrades[0], netAmount: 1000 },  // Win
        { ...mockTrades[1], netAmount: -500 },  // Loss
        { ...mockTrades[0], id: 'trade-003', netAmount: 800 },   // Win
        { ...mockTrades[1], id: 'trade-004', netAmount: -300 }   // Loss
      ];

      await service.updateStrategyPerformance(
        testStrategy.id,
        mockUserProfile.userId,
        testTrades
      );

      const performance = service.getStrategyPerformance(
        mockUserProfile.userId,
        testStrategy.id
      )[0];

      expect(performance.totalTrades).toBe(4);
      expect(performance.winningTrades).toBe(2);
      expect(performance.losingTrades).toBe(2);
      expect(performance.winRate).toBe(50);
      expect(performance.averageWin).toBe(900); // (1000 + 800) / 2
      expect(performance.averageLoss).toBe(400); // (500 + 300) / 2
      expect(performance.profitFactor).toBeCloseTo(2.25); // (900 * 2) / (400 * 2)
    });

    test('should get all performance data for user', () => {
      const allPerformance = service.getStrategyPerformance(mockUserProfile.userId);
      expect(Array.isArray(allPerformance)).toBe(true);
    });
  });

  describe('Market Environment Detection', () => {
    test('should detect market environment', async () => {
      const environment = await service.detectMarketEnvironment();

      expect(environment).toBeDefined();
      expect(environment.volatilityRegime).toBeDefined();
      expect(environment.trendDirection).toBeDefined();
      expect(environment.marketCondition).toBeDefined();
      expect(environment.vixLevel).toBeGreaterThan(0);
    });

    test('should emit market environment change event', async () => {
      const eventSpy = jest.fn();
      service.on('market-environment-changed', eventSpy);

      await service.detectMarketEnvironment();
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Challenge System Integration', () => {
    test('should include XP potential in recommendations', async () => {
      const recommendations = await service.getRecommendedStrategies(
        mockMarketEnvironment,
        mockUserProfile,
        3
      );

      recommendations.forEach(rec => {
        expect(rec.xpPotential).toBeGreaterThan(0);
        expect(typeof rec.xpPotential).toBe('number');
      });
    });

    test('should boost XP for challenge participants', async () => {
      const challengeProfile = { ...mockUserProfile, challengeParticipation: true };
      const nonChallengeProfile = { ...mockUserProfile, challengeParticipation: false };

      const challengeRecs = await service.getRecommendedStrategies(
        mockMarketEnvironment,
        challengeProfile,
        3
      );

      const nonChallengeRecs = await service.getRecommendedStrategies(
        mockMarketEnvironment,
        nonChallengeProfile,
        3
      );

      // XP potential should be higher for challenge participants
      expect(challengeRecs[0].xpPotential).toBeGreaterThan(nonChallengeRecs[0].xpPotential);
    });

    test('should include strategy class specific strategies', () => {
      const strategies = service.getAllStrategies();
      const challengeStrategies = strategies.filter(s => 
        s.name.includes('Challenge') || s.name.includes('Buffett') || s.name.includes('Soros')
      );

      expect(challengeStrategies.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid strategy ID in performance update', async () => {
      await expect(service.updateStrategyPerformance(
        'invalid-strategy-id',
        mockUserProfile.userId,
        mockTrades
      )).rejects.toThrow('Strategy invalid-strategy-id not found');
    });

    test('should handle empty trade data gracefully', async () => {
      const strategies = service.getAllStrategies();
      const testStrategy = strategies[0];

      await expect(service.updateStrategyPerformance(
        testStrategy.id,
        mockUserProfile.userId,
        []
      )).resolves.not.toThrow();
    });

    test('should return empty array for recommendations on error', async () => {
      // Force an error condition
      const invalidMarketEnvironment = null as any;
      const recommendations = await service.getRecommendedStrategies(
        invalidMarketEnvironment,
        mockUserProfile,
        5
      );

      expect(recommendations).toEqual([]);
    });
  });

  describe('Service Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = TradingStrategyService.getInstance();
      const instance2 = TradingStrategyService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Strategy Data Validation', () => {
    test('should have valid strategy data structure', () => {
      const strategies = service.getAllStrategies();
      
      strategies.forEach(strategy => {
        expect(strategy.id).toBeDefined();
        expect(strategy.name).toBeDefined();
        expect(strategy.description).toBeDefined();
        expect(strategy.category).toBeDefined();
        expect(strategy.riskLevel).toBeDefined();
        expect(strategy.timeHorizon).toBeDefined();
        expect(strategy.minAccountSize).toBeGreaterThan(0);
        expect(strategy.winRateEstimate).toBeGreaterThanOrEqual(0);
        expect(strategy.winRateEstimate).toBeLessThanOrEqual(100);
        expect(strategy.difficultyRating).toBeGreaterThanOrEqual(1);
        expect(strategy.difficultyRating).toBeLessThanOrEqual(10);
        expect(strategy.xpMultiplier).toBeGreaterThan(0);
        expect(Array.isArray(strategy.skillCategories)).toBe(true);
        expect(Array.isArray(strategy.entrySignals)).toBe(true);
        expect(Array.isArray(strategy.exitSignals)).toBe(true);
      });
    });

    test('should have educational content for some strategies', () => {
      const strategies = service.getAllStrategies();
      const strategiesWithEducation = strategies.filter(s => s.educationalContent);
      
      expect(strategiesWithEducation.length).toBeGreaterThan(0);
      
      strategiesWithEducation.forEach(strategy => {
        const education = strategy.educationalContent!;
        expect(education.overview).toBeDefined();
        expect(Array.isArray(education.keyPrinciples)).toBe(true);
        expect(Array.isArray(education.commonMistakes)).toBe(true);
        expect(Array.isArray(education.tips)).toBe(true);
      });
    });
  });
});