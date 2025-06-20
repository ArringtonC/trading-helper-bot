import { MarketDataService, MarketDataConfiguration } from '../MarketDataService';
import { MonitoringService } from '../MonitoringService';
import * as DatabaseService from '../DatabaseService';

// Mock the MonitoringService
jest.mock('../MonitoringService');
const MockedMonitoringService = MonitoringService as jest.MockedClass<typeof MonitoringService>;

// Mock the DatabaseService
jest.mock('../DatabaseService', () => ({
  insertSP500Prices: jest.fn(),
  getSP500Prices: jest.fn(),
  insertMarketNews: jest.fn(),
  getMarketNews: jest.fn(),
}));

const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

describe('MarketDataService', () => {
  let marketDataService: MarketDataService;
  let mockMonitoring: jest.Mocked<MonitoringService>;
  let mockConfig: Partial<MarketDataConfiguration>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock monitoring service
    mockMonitoring = new MockedMonitoringService() as jest.Mocked<MonitoringService>;
    mockMonitoring.startSpan = jest.fn().mockReturnValue({
      setStatus: jest.fn(),
      finish: jest.fn()
    });
    mockMonitoring.recordMetric = jest.fn();
    mockMonitoring.registerHealthCheck = jest.fn();
    mockMonitoring.registerMetric = jest.fn();

    // Test configuration
    mockConfig = {
      priceUpdateIntervalMs: 10000, // 10 seconds for testing
      newsUpdateIntervalMs: 15000, // 15 seconds for testing
      enableRealTimeUpdates: false, // Disable for tests
      enableBatchUpdates: false, // Disable for tests
      cacheTimeoutMs: 5000, // 5 seconds for testing
      defaultDateRange: 7 // 7 days for testing
    };

    marketDataService = new MarketDataService(mockMonitoring, mockConfig);
  });

  afterEach(async () => {
    // Clean up service
    if (marketDataService.getState().isRunning) {
      await marketDataService.stop();
    }
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      await marketDataService.initialize();

      expect(mockMonitoring.registerHealthCheck).toHaveBeenCalledWith(
        'market_data_service',
        expect.any(Function)
      );
      expect(mockMonitoring.registerMetric).toHaveBeenCalledTimes(5);
      
      const state = marketDataService.getState();
      expect(state.isRunning).toBe(false);
      expect(state.totalUpdates).toBe(0);
    });

    it('should handle initialization errors', async () => {
      mockMonitoring.registerHealthCheck.mockImplementation(() => {
        throw new Error('Mock initialization error');
      });

      await expect(marketDataService.initialize()).rejects.toThrow('Mock initialization error');
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith(
        'market_data_errors_total',
        1,
        { error_type: 'initialization' }
      );
    });

    it('should start and stop successfully', async () => {
      await marketDataService.initialize();
      
      const startSpy = jest.fn();
      const stopSpy = jest.fn();
      marketDataService.on('service:started', startSpy);
      marketDataService.on('service:stopped', stopSpy);

      await marketDataService.start();
      expect(marketDataService.getState().isRunning).toBe(true);
      expect(startSpy).toHaveBeenCalled();

      await marketDataService.stop();
      expect(marketDataService.getState().isRunning).toBe(false);
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('S&P 500 Data Operations', () => {
    beforeEach(async () => {
      await marketDataService.initialize();
    });

    it('should retrieve S&P 500 data successfully', async () => {
      const mockPriceData = [
        {
          date: '2025-01-15',
          open: 5800.50,
          high: 5825.75,
          low: 5790.25,
          close: 5815.30,
          volume: 3500000000,
          adjusted_close: 5815.30
        }
      ];

      mockDatabaseService.getSP500Prices.mockResolvedValue(mockPriceData);

      const result = await marketDataService.getSP500Data({
        startDate: '2025-01-15',
        endDate: '2025-01-15'
      });

      expect(result).toEqual(mockPriceData);
      expect(mockDatabaseService.getSP500Prices).toHaveBeenCalledWith('2025-01-15', '2025-01-15');
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith(
        'market_data_requests_total',
        1,
        { type: 'sp500_prices', source: 'database' }
      );
    });

    it('should use default date range when no dates provided', async () => {
      const mockPriceData: any[] = [];
      mockDatabaseService.getSP500Prices.mockResolvedValue(mockPriceData);

      await marketDataService.getSP500Data();

      expect(mockDatabaseService.getSP500Prices).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle S&P 500 data retrieval errors', async () => {
      const mockError = new Error('Database connection failed');
      mockDatabaseService.getSP500Prices.mockRejectedValue(mockError);

      await expect(marketDataService.getSP500Data()).rejects.toThrow('Database connection failed');
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith(
        'market_data_errors_total',
        1,
        { type: 'sp500_prices', error_type: 'retrieval' }
      );
    });

    it('should sync S&P 500 data successfully', async () => {
      const mockInsertResult = { successCount: 5, errors: [] };
      mockDatabaseService.insertSP500Prices.mockResolvedValue(mockInsertResult);

      const syncSpy = jest.fn();
      marketDataService.on('sync:completed', syncSpy);

      const result = await marketDataService.syncSP500Data();

      expect(result.success).toBe(true);
      expect(result.recordsUpdated).toBe(5);
      expect(result.dataType).toBe('sp500_prices');
      expect(syncSpy).toHaveBeenCalled();
      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith(
        'market_data_sync_total',
        1,
        { type: 'sp500_prices', status: 'success' }
      );
    });

    it('should handle S&P 500 sync errors', async () => {
      const mockError = new Error('External API failed');
      mockDatabaseService.insertSP500Prices.mockRejectedValue(mockError);

      const failSpy = jest.fn();
      marketDataService.on('sync:failed', failSpy);

      await expect(marketDataService.syncSP500Data()).rejects.toThrow('External API failed');
      expect(failSpy).toHaveBeenCalledWith({
        type: 'sp500_prices',
        error: 'External API failed',
        operation: expect.stringContaining('sp500_prices_')
      });
    });
  });

  describe('Market News Operations', () => {
    beforeEach(async () => {
      await marketDataService.initialize();
    });

    it('should retrieve market news successfully', async () => {
      const mockNewsData = [
        {
          date: '2025-01-15',
          title: 'Fed Policy Update',
          description: 'Federal Reserve announces new policy',
          source: 'Reuters',
          category: 'fed_policy' as const,
          relevance_score: 9,
          keywords: JSON.stringify(['Federal Reserve', 'rates']),
          impact_type: 'neutral' as const,
          url: 'https://example.com/news',
          published_at: '2025-01-15T14:00:00Z'
        }
      ];

      mockDatabaseService.getMarketNews.mockResolvedValue(mockNewsData);

      const result = await marketDataService.getMarketNewsData({
        category: 'fed_policy',
        minRelevanceScore: 8
      });

      expect(result).toEqual(mockNewsData);
      expect(mockDatabaseService.getMarketNews).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'fed_policy',
        8
      );
    });

    it('should apply limit when specified', async () => {
      const mockNewsData = Array(10).fill(null).map((_, i) => ({
        date: '2025-01-15',
        title: `News Item ${i + 1}`,
        category: 'general' as const,
        relevance_score: 5
      }));

      mockDatabaseService.getMarketNews.mockResolvedValue(mockNewsData);

      const result = await marketDataService.getMarketNewsData({ limit: 3 });

      expect(result).toHaveLength(3);
    });

    it('should sync market news successfully', async () => {
      const mockInsertResult = { successCount: 3, errors: [] };
      mockDatabaseService.insertMarketNews.mockResolvedValue(mockInsertResult);

      const result = await marketDataService.syncMarketNews();

      expect(result.success).toBe(true);
      expect(result.recordsUpdated).toBe(3);
      expect(result.dataType).toBe('market_news');
    });
  });

  describe('Full Synchronization', () => {
    beforeEach(async () => {
      await marketDataService.initialize();
    });

    it('should sync all data types successfully', async () => {
      mockDatabaseService.insertSP500Prices.mockResolvedValue({ successCount: 5, errors: [] });
      mockDatabaseService.insertMarketNews.mockResolvedValue({ successCount: 3, errors: [] });

      const syncAllSpy = jest.fn();
      marketDataService.on('sync:all:completed', syncAllSpy);

      const results = await marketDataService.syncAll();

      expect(results.size).toBe(2);
      expect(results.has('sp500_prices')).toBe(true);
      expect(results.has('market_news')).toBe(true);
      expect(syncAllSpy).toHaveBeenCalledWith(results);
    });

    it('should handle partial failures in full sync', async () => {
      mockDatabaseService.insertSP500Prices.mockResolvedValue({ successCount: 5, errors: [] });
      mockDatabaseService.insertMarketNews.mockRejectedValue(new Error('News API failed'));

      const results = await marketDataService.syncAll();

      // Should still return result for S&P 500 even if news failed
      expect(results.size).toBe(1);
      expect(results.has('sp500_prices')).toBe(true);
      expect(results.has('market_news')).toBe(false);
    });
  });

  describe('Caching', () => {
    beforeEach(async () => {
      await marketDataService.initialize();
    });

    it('should cache and return cached data', async () => {
      const mockPriceData = [{ 
        date: '2025-01-15', 
        open: 5810.00,
        high: 5820.00, 
        low: 5800.00,
        close: 5815.30 
      }];
      mockDatabaseService.getSP500Prices.mockResolvedValue(mockPriceData);

      // First call should hit database
      const result1 = await marketDataService.getSP500Data({ startDate: '2025-01-15' });
      expect(mockDatabaseService.getSP500Prices).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await marketDataService.getSP500Data({ startDate: '2025-01-15' });
      expect(mockDatabaseService.getSP500Prices).toHaveBeenCalledTimes(1); // Still 1
      expect(result2).toEqual(result1);

      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith(
        'market_data_cache_hits_total',
        1,
        { type: 'sp500' }
      );
    });

    it('should clear cache after sync', async () => {
      const mockPriceData = [{ 
        date: '2025-01-15', 
        open: 5810.00,
        high: 5820.00, 
        low: 5800.00,
        close: 5815.30 
      }];
      mockDatabaseService.getSP500Prices.mockResolvedValue(mockPriceData);
      mockDatabaseService.insertSP500Prices.mockResolvedValue({ successCount: 1, errors: [] });

      // Fill cache
      await marketDataService.getSP500Data({ startDate: '2025-01-15' });
      expect(mockDatabaseService.getSP500Prices).toHaveBeenCalledTimes(1);

      // Sync (should clear cache)
      await marketDataService.syncSP500Data();

      // Next call should hit database again
      await marketDataService.getSP500Data({ startDate: '2025-01-15' });
      expect(mockDatabaseService.getSP500Prices).toHaveBeenCalledTimes(2);
    });
  });

  describe('Service State and Configuration', () => {
    beforeEach(async () => {
      await marketDataService.initialize();
    });

    it('should return current state', () => {
      const state = marketDataService.getState();
      
      expect(state).toHaveProperty('isRunning');
      expect(state).toHaveProperty('lastPriceUpdate');
      expect(state).toHaveProperty('lastNewsUpdate');
      expect(state).toHaveProperty('totalUpdates');
      expect(state).toHaveProperty('currentOperations');
    });

    it('should return service statistics', () => {
      const stats = marketDataService.getStatistics();
      
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('successRate');
    });

    it('should update configuration', () => {
      const configSpy = jest.fn();
      marketDataService.on('config:updated', configSpy);

      const updates = { defaultDateRange: 14 };
      marketDataService.updateConfiguration(updates);

      expect(configSpy).toHaveBeenCalledWith(
        expect.objectContaining(updates)
      );
    });
  });

  describe('Event Emission', () => {
    beforeEach(async () => {
      await marketDataService.initialize();
    });

    it('should emit data:retrieved events', async () => {
      const mockPriceData = [{ 
        date: '2025-01-15', 
        open: 5810.00,
        high: 5820.00, 
        low: 5800.00,
        close: 5815.30 
      }];
      mockDatabaseService.getSP500Prices.mockResolvedValue(mockPriceData);

      const dataSpy = jest.fn();
      marketDataService.on('data:retrieved', dataSpy);

      await marketDataService.getSP500Data();

      expect(dataSpy).toHaveBeenCalledWith({
        type: 'sp500_prices',
        count: 1,
        dateRange: expect.any(Object)
      });
    });

    it('should emit sp500:data:updated events on sync', async () => {
      mockDatabaseService.insertSP500Prices.mockResolvedValue({ successCount: 5, errors: [] });

      const updateSpy = jest.fn();
      marketDataService.on('sp500:data:updated', updateSpy);

      await marketDataService.syncSP500Data();

      expect(updateSpy).toHaveBeenCalledWith({
        count: 5,
        timestamp: expect.any(Date)
      });
    });
  });
}); 