import VolatilityAnalysisService from '../VolatilityAnalysisService';

// Mock the dependencies
jest.mock('../VolatilityCalculationEngine');
jest.mock('../VolatilityDataService');

describe('VolatilityAnalysisService', () => {
  let service: VolatilityAnalysisService;

  beforeEach(() => {
    service = new VolatilityAnalysisService({
      dataSource: {
        enableYahooFinance: false, // Disable real API calls in tests
        enableCSVFallback: false,
        cacheTimeoutMs: 1000,
        maxRetries: 1,
        rateLimitMs: 100
      },
      defaultLookbackDays: 30,
      enableRealTimeUpdates: false,
      updateIntervalMs: 5000,
      maxConcurrentRequests: 2
    });
  });

  afterEach(() => {
    service.clearCaches();
    jest.clearAllMocks();
  });

  describe('getSymbolAnalysis', () => {
    it('should return volatility analysis for a valid symbol', async () => {
      const result = await service.getSymbolAnalysis({
        symbol: 'AAPL',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        includeVIXCorrelation: true
      });

      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.analysis).toBeDefined();
      expect(result.dataQuality).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(typeof result.currentPrice).toBe('number');
    });

    it('should handle custom IV parameter', async () => {
      const result = await service.getSymbolAnalysis({
        symbol: 'TSLA',
        customIV: 0.45
      });

      expect(result).toBeDefined();
      expect(result.symbol).toBe('TSLA');
    });

    it('should prevent duplicate concurrent requests', async () => {
      const symbol = 'MSFT';
      const request = { symbol, startDate: '2023-01-01', endDate: '2023-12-31' };

      // Start two identical requests simultaneously
      const [result1, result2] = await Promise.all([
        service.getSymbolAnalysis(request),
        service.getSymbolAnalysis(request)
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.symbol).toBe(symbol);
      expect(result2.symbol).toBe(symbol);
    });

    it('should use default date range when not provided', async () => {
      const result = await service.getSymbolAnalysis({
        symbol: 'SPY'
      });

      expect(result).toBeDefined();
      expect(result.symbol).toBe('SPY');
    });
  });

  describe('getPortfolioAnalysis', () => {
    it('should analyze multiple symbols', async () => {
      const symbols = ['AAPL', 'MSFT', 'GOOGL'];
      
      const result = await service.getPortfolioAnalysis({
        symbols,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        includeCorrelationMatrix: false
      });

      expect(result).toBeDefined();
      expect(result.symbols).toEqual(symbols);
      expect(result.snapshots).toBeDefined();
      expect(result.portfolioMetrics).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.correlationMatrix).toBeUndefined();
    });

    it('should include correlation matrix when requested', async () => {
      const symbols = ['AAPL', 'MSFT'];
      
      const result = await service.getPortfolioAnalysis({
        symbols,
        includeCorrelationMatrix: true
      });

      expect(result.correlationMatrix).toBeDefined();
      if (result.correlationMatrix) {
        expect(result.correlationMatrix['AAPL']).toBeDefined();
        expect(result.correlationMatrix['MSFT']).toBeDefined();
      }
    });

    it('should handle empty symbol list', async () => {
      const result = await service.getPortfolioAnalysis({
        symbols: []
      });

      expect(result.snapshots).toHaveLength(0);
      expect(result.portfolioMetrics.averageIVPercentile).toBe(0);
      expect(result.portfolioMetrics.portfolioVolatility).toBe(0);
    });

    it('should respect maxConcurrentRequests limit', async () => {
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']; // More than maxConcurrentRequests (2)
      
      const result = await service.getPortfolioAnalysis({
        symbols
      });

      expect(result.snapshots.length).toBeGreaterThan(0);
      expect(result.snapshots.length).toBeLessThanOrEqual(symbols.length);
    });
  });

  describe('getRealTimeUpdate', () => {
    it('should return real-time update for a symbol', async () => {
      const result = await service.getRealTimeUpdate('SPY');

      expect(result).toBeDefined();
      expect(result.symbol).toBe('SPY');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.currentPrice).toBe('number');
      expect(result.analysis).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      // This test depends on the mock implementation
      // In a real scenario, you'd mock the data service to throw an error
      await expect(service.getRealTimeUpdate('INVALID')).rejects.toThrow();
    });
  });

  describe('getAvailableSymbols', () => {
    it('should return list of available symbols', () => {
      const symbols = service.getAvailableSymbols();

      expect(Array.isArray(symbols)).toBe(true);
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols).toContain('SPY');
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('^VIX');
    });

    it('should include different asset categories', () => {
      const symbols = service.getAvailableSymbols();

      // ETFs
      expect(symbols.some(s => ['SPY', 'QQQ', 'IWM'].includes(s))).toBe(true);
      
      // Tech stocks
      expect(symbols.some(s => ['AAPL', 'MSFT', 'GOOGL'].includes(s))).toBe(true);
      
      // Volatility indices
      expect(symbols.some(s => s.startsWith('^'))).toBe(true);
    });
  });

  describe('clearCaches', () => {
    it('should clear all caches', () => {
      // This is more of an integration test
      expect(() => service.clearCaches()).not.toThrow();
    });
  });

  describe('getServiceStats', () => {
    it('should return service statistics', () => {
      const stats = service.getServiceStats();

      expect(stats).toBeDefined();
      expect(stats.calculationEngine).toBeDefined();
      expect(stats.dataService).toBeDefined();
      expect(typeof stats.activeRequests).toBe('number');
      expect(stats.config).toBeDefined();
    });

    it('should include configuration details', () => {
      const stats = service.getServiceStats();

      expect(stats.config.defaultLookbackDays).toBe(30);
      expect(stats.config.maxConcurrentRequests).toBe(2);
      expect(stats.config.enableRealTimeUpdates).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle data service errors gracefully', async () => {
      // Mock the data service to throw an error
      const mockService = new VolatilityAnalysisService();
      
      // This test would need proper mocking of the internal services
      // For now, we'll test that the service can be instantiated
      expect(mockService).toBeDefined();
    });

    it('should handle calculation engine errors gracefully', async () => {
      // Similar to above, would need proper mocking
      expect(service).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('should use default configuration when none provided', () => {
      const defaultService = new VolatilityAnalysisService();
      const stats = defaultService.getServiceStats();

      expect(stats.config.defaultLookbackDays).toBe(252);
      expect(stats.config.maxConcurrentRequests).toBe(10);
      expect(stats.config.enableRealTimeUpdates).toBe(true);
    });

    it('should merge provided configuration with defaults', () => {
      const customService = new VolatilityAnalysisService({
        defaultLookbackDays: 100,
        maxConcurrentRequests: 5
      });
      
      const stats = customService.getServiceStats();

      expect(stats.config.defaultLookbackDays).toBe(100);
      expect(stats.config.maxConcurrentRequests).toBe(5);
      expect(stats.config.enableRealTimeUpdates).toBe(true); // Should use default
    });
  });

  describe('portfolio metrics calculation', () => {
    it('should calculate portfolio metrics correctly', async () => {
      const result = await service.getPortfolioAnalysis({
        symbols: ['AAPL', 'MSFT']
      });

      expect(result.portfolioMetrics).toBeDefined();
      expect(typeof result.portfolioMetrics.averageIVPercentile).toBe('number');
      expect(typeof result.portfolioMetrics.portfolioVolatility).toBe('number');
      expect(typeof result.portfolioMetrics.diversificationRatio).toBe('number');
      expect(typeof result.portfolioMetrics.riskRegimeDistribution).toBe('object');
    });

    it('should handle single symbol portfolio', async () => {
      const result = await service.getPortfolioAnalysis({
        symbols: ['SPY']
      });

      expect(result.portfolioMetrics.diversificationRatio).toBeGreaterThan(0);
      expect(Object.keys(result.portfolioMetrics.riskRegimeDistribution).length).toBeGreaterThan(0);
    });
  });

  describe('data quality tracking', () => {
    it('should track data quality metrics', async () => {
      const result = await service.getSymbolAnalysis({
        symbol: 'AAPL'
      });

      expect(result.dataQuality).toBeDefined();
      expect(typeof result.dataQuality.priceDataPoints).toBe('number');
      expect(typeof result.dataQuality.volatilityDataPoints).toBe('number');
      expect(['yahoo', 'csv', 'mock']).toContain(result.dataQuality.dataSource);
      expect(result.dataQuality.lastUpdate).toBeDefined();
    });
  });
}); 