import UnifiedAnalyticsEngine, { 
  AnalyticsConfig, 
  ConsolidatedAnalytics,
  PositionAnalysisData,
  RiskMetricsData,
  PerformanceTrackingData,
  MarketAnalysisData
} from '../UnifiedAnalyticsEngine';
import { VolatilityRegime } from '../../../../../shared/services/MarketAnalysisService';
import { NormalizedTradeData, BrokerType } from '../../../../../shared/types/trade';

// Mock the services
jest.mock('../../../../../shared/services/DatabaseService', () => ({
  getTrades: jest.fn(),
  getPositions: jest.fn()
}));

jest.mock('../../../../../shared/services/AnalyticsDataService', () => ({
  AnalyticsDataService: jest.fn().mockImplementation(() => ({
    getAllTrades: jest.fn(),
    getTradesBySymbol: jest.fn()
  }))
}));

jest.mock('../../../../../shared/services/MarketAnalysisService', () => ({
  calculateCurrentVolatilityRegime: jest.fn(),
  VolatilityRegime: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    UNKNOWN: 'Unknown'
  }
}));

jest.mock('../../../../../shared/services/RiskService', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    onRiskData: jest.fn(() => jest.fn()) // Returns unsubscribe function
  }
}));

describe('UnifiedAnalyticsEngine', () => {
  let engine: UnifiedAnalyticsEngine;
  let mockConfig: AnalyticsConfig;

  beforeEach(() => {
    mockConfig = {
      userLevel: 'import',
      enabledModules: [],
      layout: 'compact',
      refreshInterval: 30000
    };
    
    engine = new UnifiedAnalyticsEngine(mockConfig);
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('Initialization', () => {
    test('should initialize with correct config', () => {
      expect(engine).toBeDefined();
    });

    test('should register all modules based on user level', () => {
      const modules = engine.getEnabledModules();
      expect(modules.length).toBeGreaterThan(0);
      
      // Should have core modules
      expect(modules.some(m => m.id === 'position-summary')).toBe(true);
      expect(modules.some(m => m.id === 'basic-risk')).toBe(true);
      expect(modules.some(m => m.id === 'trade-performance')).toBe(true);
      
      // Should have intermediate modules for intermediate user
      expect(modules.some(m => m.id === 'performance-charts')).toBe(true);
      expect(modules.some(m => m.id === 'risk-analysis')).toBe(true);
    });

    test('should not show advanced modules for intermediate user', () => {
      const modules = engine.getEnabledModules();
      expect(modules.some(m => m.id === 'greeks-dashboard')).toBe(false);
      expect(modules.some(m => m.id === 'portfolio-optimization')).toBe(false);
    });

    test('should show all modules for advanced user', () => {
      const advancedConfig: AnalyticsConfig = {
        ...mockConfig,
        userLevel: 'broker'
      };
      const advancedEngine = new UnifiedAnalyticsEngine(advancedConfig);
      
      const modules = advancedEngine.getEnabledModules();
      expect(modules.some(m => m.id === 'greeks-dashboard')).toBe(true);
      expect(modules.some(m => m.id === 'portfolio-optimization')).toBe(true);
      
      advancedEngine.destroy();
    });

    test('should limit modules for beginner user', () => {
      const beginnerConfig: AnalyticsConfig = {
        ...mockConfig,
        userLevel: 'learning'
      };
      const beginnerEngine = new UnifiedAnalyticsEngine(beginnerConfig);
      
      const modules = beginnerEngine.getEnabledModules();
      expect(modules.some(m => m.id === 'performance-charts')).toBe(false);
      expect(modules.some(m => m.id === 'risk-analysis')).toBe(false);
      
      beginnerEngine.destroy();
    });
  });

  describe('Module Management', () => {
    test('should return modules in priority order', () => {
      const modules = engine.getEnabledModules();
      
      for (let i = 1; i < modules.length; i++) {
        expect(modules[i].priority).toBeGreaterThanOrEqual(modules[i - 1].priority);
      }
    });

    test('should filter modules by category', () => {
      const coreModules = engine.getModulesByCategory('core');
      const intermediateModules = engine.getModulesByCategory('import');
      const advancedModules = engine.getModulesByCategory('broker');
      
      expect(coreModules.every(m => m.category === 'core')).toBe(true);
      expect(intermediateModules.every(m => m.category === 'import')).toBe(true);
      expect(advancedModules.every(m => m.category === 'broker')).toBe(true);
    });

    test('should respect max modules for user level', () => {
      const beginnerEngine = new UnifiedAnalyticsEngine({
        ...mockConfig,
        userLevel: 'learning'
      });
      
      expect(beginnerEngine.getMaxModulesForUserLevel()).toBe(3);
      
      const intermediateEngine = new UnifiedAnalyticsEngine({
        ...mockConfig,
        userLevel: 'import'
      });
      
      expect(intermediateEngine.getMaxModulesForUserLevel()).toBe(6);
      
      const advancedEngine = new UnifiedAnalyticsEngine({
        ...mockConfig,
        userLevel: 'broker'
      });
      
      expect(advancedEngine.getMaxModulesForUserLevel()).toBe(Infinity);
      
      beginnerEngine.destroy();
      intermediateEngine.destroy();
      advancedEngine.destroy();
    });
  });

  describe('Position Analysis', () => {
    test('should calculate position metrics correctly', async () => {
      const mockTrades: NormalizedTradeData[] = [
        {
          id: '1',
          tradeDate: '2024-01-01',
          symbol: 'AAPL',
          quantity: 100,
          tradePrice: 150,
          netAmount: 1000,
          action: 'BUY',
          assetCategory: 'STK',
          description: 'Test trade',
          importTimestamp: new Date().toISOString(),
          broker: BrokerType.IBKR,
          currency: 'USD'
        },
        {
          id: '2',
          tradeDate: '2024-01-02',
          symbol: 'AAPL',
          quantity: -100,
          tradePrice: 160,
          netAmount: -500,
          action: 'SELL',
          assetCategory: 'STK',
          description: 'Test trade',
          importTimestamp: new Date().toISOString(),
          broker: BrokerType.IBKR,
          currency: 'USD'
        }
      ];

      const mockPositions = [
        { symbol: 'AAPL', quantity: 100, marketValue: 15000 },
        { symbol: 'GOOGL', quantity: 50, marketValue: 8000 }
      ];

      // Mock the analytics data service
      const mockAnalyticsService = engine['analyticsDataService'];
      mockAnalyticsService.getAllTrades = jest.fn().mockResolvedValue(mockTrades);
      
      // Mock getPositions
      const { getPositions } = require('../../../services/DatabaseService');
      getPositions.mockResolvedValue(mockPositions);

      const analytics = await engine.getConsolidatedAnalytics();
      
      expect(analytics.positionAnalysis.totalTrades).toBe(2);
      expect(analytics.positionAnalysis.openPositions).toBe(2);
      expect(analytics.positionAnalysis.totalValue).toBe(23000);
      expect(analytics.positionAnalysis.winRate).toBe(50); // 1 profitable out of 2 trades
    });

    test('should handle empty trade data gracefully', async () => {
      const mockAnalyticsService = engine['analyticsDataService'];
      mockAnalyticsService.getAllTrades = jest.fn().mockResolvedValue([]);
      
      const { getPositions } = require('../../../services/DatabaseService');
      getPositions.mockResolvedValue([]);

      const analytics = await engine.getConsolidatedAnalytics();
      
      expect(analytics.positionAnalysis.totalTrades).toBe(0);
      expect(analytics.positionAnalysis.winRate).toBe(0);
      expect(analytics.positionAnalysis.totalValue).toBe(0);
    });
  });

  describe('Risk Metrics', () => {
    test('should calculate advanced risk metrics', async () => {
      const mockRiskData = {
        delta: 0.5,
        theta: -10,
        gamma: 0.1,
        vega: 50,
        timestamp: new Date().toISOString()
      };

      // Set mock risk data
      engine['latestRiskData'] = mockRiskData;

      const mockPositions = [
        { symbol: 'AAPL', quantity: 100, marketValue: 15000 },
        { symbol: 'GOOGL', quantity: 50, marketValue: 5000 }
      ];

      const mockTrades: NormalizedTradeData[] = [
        {
          id: '1',
          tradeDate: '2024-01-01',
          symbol: 'AAPL',
          quantity: 100,
          tradePrice: 150,
          netAmount: 1000,
          action: 'BUY',
          assetCategory: 'STK',
          description: 'Test trade',
          importTimestamp: new Date().toISOString(),
          broker: BrokerType.IBKR,
          currency: 'USD'
        }
      ];

      const { getPositions } = require('../../../services/DatabaseService');
      getPositions.mockResolvedValue(mockPositions);

      const mockAnalyticsService = engine['analyticsDataService'];
      mockAnalyticsService.getAllTrades = jest.fn().mockResolvedValue(mockTrades);

      const analytics = await engine.getConsolidatedAnalytics();
      
      expect(analytics.riskMetrics.delta).toBe(0.5);
      expect(analytics.riskMetrics.theta).toBe(-10);
      expect(analytics.riskMetrics.portfolioRisk).toBeGreaterThan(0);
      expect(analytics.riskMetrics.concentrationRisk).toBeGreaterThan(0);
      expect(analytics.riskMetrics.diversificationScore).toBeGreaterThan(0);
    });

    test('should handle missing risk data', async () => {
      engine['latestRiskData'] = null;

      const { getPositions } = require('../../../services/DatabaseService');
      getPositions.mockResolvedValue([]);

      const mockAnalyticsService = engine['analyticsDataService'];
      mockAnalyticsService.getAllTrades = jest.fn().mockResolvedValue([]);

      const analytics = await engine.getConsolidatedAnalytics();
      
      expect(analytics.riskMetrics.delta).toBe(0);
      expect(analytics.riskMetrics.portfolioRisk).toBe(0);
    });
  });

  describe('Performance Tracking', () => {
    test('should calculate performance metrics correctly', async () => {
      const mockTrades: NormalizedTradeData[] = [
        {
          id: '1',
          tradeDate: '2024-01-01',
          symbol: 'AAPL',
          quantity: 100,
          tradePrice: 150,
          netAmount: 1000,
          action: 'BUY',
          assetCategory: 'STK',
          description: 'Winning trade',
          importTimestamp: new Date().toISOString(),
          broker: BrokerType.IBKR,
          currency: 'USD'
        },
        {
          id: '2',
          tradeDate: '2024-01-02',
          symbol: 'GOOGL',
          quantity: 50,
          tradePrice: 100,
          netAmount: -500,
          action: 'SELL',
          assetCategory: 'STK',
          description: 'Losing trade',
          importTimestamp: new Date().toISOString(),
          broker: BrokerType.IBKR,
          currency: 'USD'
        },
        {
          id: '3',
          tradeDate: '2024-01-03',
          symbol: 'MSFT',
          quantity: 75,
          tradePrice: 200,
          netAmount: 750,
          action: 'BUY',
          assetCategory: 'STK',
          description: 'Winning trade',
          importTimestamp: new Date().toISOString(),
          broker: BrokerType.IBKR,
          currency: 'USD'
        }
      ];

      const mockAnalyticsService = engine['analyticsDataService'];
      mockAnalyticsService.getAllTrades = jest.fn().mockResolvedValue(mockTrades);

      const analytics = await engine.getConsolidatedAnalytics();
      
      expect(analytics.performanceTracking.dailyReturns.length).toBe(3);
      expect(analytics.performanceTracking.cumulativeReturns.length).toBe(3);
      expect(analytics.performanceTracking.sharpeRatio).toBeDefined();
      expect(analytics.performanceTracking.profitFactor).toBeGreaterThan(0);
      expect(analytics.performanceTracking.winLossRatio).toBeGreaterThan(0);
      expect(analytics.performanceTracking.consecutiveWins).toBeGreaterThanOrEqual(1);
    });

    test('should calculate drawdown correctly', () => {
      const cumulativeReturns = [0.1, 0.15, 0.05, -0.1, 0.2];
      const maxDrawdown = engine['calculateMaxDrawdown'](cumulativeReturns);
      
      expect(maxDrawdown).toBeLessThan(0); // Drawdown should be negative
      expect(typeof maxDrawdown).toBe('number');
    });

    test('should calculate standard deviation correctly', () => {
      const values = [1, 2, 3, 4, 5];
      const stdDev = engine['calculateStandardDeviation'](values);
      
      expect(stdDev).toBeCloseTo(1.414, 2); // Expected std dev for this series
    });
  });

  describe('Market Analysis', () => {
    test('should calculate market metrics', async () => {
      // Provide at least 21 trades to trigger volatility regime calculation
      const mockTrades = Array.from({ length: 22 }, (_, i) => ({
        id: String(i + 1),
        tradeDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        symbol: 'SPY',
        quantity: 100,
        tradePrice: 400 + i * 2, // Vary price
        netAmount: 1000 + i * 10,
        action: i % 2 === 0 ? 'BUY' : 'SELL',
        assetCategory: 'STK',
        description: 'Market trade',
        importTimestamp: new Date().toISOString(),
        broker: BrokerType.IBKR,
        currency: 'USD'
      }));

      const mockAnalyticsService = engine['analyticsDataService'];
      mockAnalyticsService.getAllTrades = jest.fn().mockResolvedValue(mockTrades);

      // Mock the function properly at the module level
      const { calculateCurrentVolatilityRegime } = require('../../../services/MarketAnalysisService');
      calculateCurrentVolatilityRegime.mockReturnValue(VolatilityRegime.MEDIUM);

      const analytics = await engine.getConsolidatedAnalytics();
      
      expect(analytics.marketAnalysis.vixLevel).toBeGreaterThan(0);
      expect(analytics.marketAnalysis.marketRegime).toMatch(/bull|bear|sideways/);
      expect(analytics.marketAnalysis.volatilityRegime).toBe(VolatilityRegime.MEDIUM);
      expect(analytics.marketAnalysis.rsi).toBeGreaterThanOrEqual(0);
      expect(analytics.marketAnalysis.rsi).toBeLessThanOrEqual(100);
      expect(analytics.marketAnalysis.macdSignal).toMatch(/buy|sell|neutral/);
    });

    test('should calculate RSI correctly', () => {
      const prices = [44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 47.25, 47.92, 46.23, 44.18, 46.57, 46.61, 46.5];
      const rsi = engine['calculateRSI'](prices);
      
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
      expect(typeof rsi).toBe('number');
    });

    test('should calculate support and resistance levels', () => {
      const prices = [100, 105, 95, 110, 90, 115, 85, 120];
      const { supportLevel, resistanceLevel } = engine['calculateSupportResistance'](prices);
      
      expect(supportLevel).toBeLessThan(resistanceLevel);
      expect(supportLevel).toBeGreaterThanOrEqual(85);
      expect(resistanceLevel).toBeLessThanOrEqual(120);
    });
  });

  describe('Caching', () => {
    test('should cache analytics data', async () => {
      const mockAnalyticsService = engine['analyticsDataService'];
      mockAnalyticsService.getAllTrades = jest.fn().mockResolvedValue([]);
      
      const { getPositions } = require('../../../services/DatabaseService');
      getPositions.mockResolvedValue([]);

      // First call should hit the service
      await engine.getConsolidatedAnalytics();
      expect(mockAnalyticsService.getAllTrades).toHaveBeenCalledTimes(4); // Called for each metric type (position, risk, performance, market)

      // Second call should use cache
      await engine.getConsolidatedAnalytics();
      expect(mockAnalyticsService.getAllTrades).toHaveBeenCalledTimes(4); // Should not increase
    });

    test('should clear cache when requested', async () => {
      engine.clearCache();
      
      // Verify cache is empty
      const cachedData = engine['getFromCache']('consolidated-analytics');
      expect(cachedData).toBeNull();
    });
  });

  describe('Data Quality', () => {
    test('should calculate data quality metrics', async () => {
      const mockAnalyticsService = engine['analyticsDataService'];
      mockAnalyticsService.getAllTrades = jest.fn().mockResolvedValue([]);
      
      const { getPositions } = require('../../../services/DatabaseService');
      getPositions.mockResolvedValue([]);

      const analytics = await engine.getConsolidatedAnalytics();
      
      expect(analytics.dataQuality).toBeDefined();
      expect(analytics.dataQuality.completeness).toBeGreaterThanOrEqual(0);
      expect(analytics.dataQuality.completeness).toBeLessThanOrEqual(100);
      expect(analytics.dataQuality.positionDataAge).toBeGreaterThanOrEqual(0);
      expect(analytics.dataQuality.riskDataAge).toBeGreaterThanOrEqual(0);
      expect(analytics.dataQuality.marketDataAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Subscription Management', () => {
    test('should manage subscribers correctly', () => {
      const mockCallback = jest.fn();
      const unsubscribe = engine.subscribe(mockCallback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Unsubscribe should remove the callback
      unsubscribe();
      
      // Verify callback is removed (this is internal state, so we test indirectly)
      expect(engine['subscribers'].size).toBe(0);
    });
  });

  describe('Progressive Disclosure', () => {
    test('should show appropriate features for user level', () => {
      expect(engine.shouldShowIntermediateFeatures()).toBe(true);
      expect(engine.shouldShowAdvancedFeatures()).toBe(false);
      
      const advancedEngine = new UnifiedAnalyticsEngine({
        ...mockConfig,
        userLevel: 'broker'
      });
      
      expect(advancedEngine.shouldShowAdvancedFeatures()).toBe(true);
      
      advancedEngine.destroy();
    });
  });

  describe('Insights and Export', () => {
    test('should generate analytics insights', () => {
      const insights = engine.getAnalyticsInsights();
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      expect(typeof insights[0]).toBe('string');
    });

    test('should export analytics configuration', () => {
      const exported = engine.exportAnalytics();
      
      expect(exported.config).toBeDefined();
      expect(exported.modules).toBeDefined();
      expect(exported.lastExported).toBeDefined();
      expect(Array.isArray(exported.modules)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      const mockAnalyticsService = engine['analyticsDataService'];
      mockAnalyticsService.getAllTrades = jest.fn().mockRejectedValue(new Error('Service error'));
      
      const { getPositions } = require('../../../services/DatabaseService');
      getPositions.mockRejectedValue(new Error('Database error'));

      // Should not throw, but return default values
      const analytics = await engine.getConsolidatedAnalytics();
      
      expect(analytics).toBeDefined();
      expect(analytics.positionAnalysis.totalTrades).toBe(0);
      expect(analytics.riskMetrics.delta).toBe(0);
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration and module visibility', () => {
      const initialModules = engine.getEnabledModules().length;
      
      engine.updateConfig({ userLevel: 'broker' });
      
      const updatedModules = engine.getEnabledModules().length;
      expect(updatedModules).toBeGreaterThan(initialModules);
    });
  });

  describe('Cleanup', () => {
    test('should clean up resources on destroy', () => {
      const mockUnsubscribe = jest.fn();
      engine['riskDataSubscription'] = mockUnsubscribe;
      
      engine.destroy();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(engine['subscribers'].size).toBe(0);
    });
  });
}); 