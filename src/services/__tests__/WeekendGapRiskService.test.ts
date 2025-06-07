/**
 * Tests for Weekend Gap Risk Service
 */

import { WeekendGapRiskService } from '../WeekendGapRiskService';
import { detectWeekendGaps, calculateGapStatistics } from '../../utils/gapAnalysis';
import { PriceData, GapMagnitude, DEFAULT_GAP_RISK_CONFIG } from '../../types/gapRisk';
import { NormalizedTradeData, BrokerType } from '../../types/trade';

describe('WeekendGapRiskService', () => {
  let service: WeekendGapRiskService;

  beforeEach(() => {
    service = new WeekendGapRiskService();
  });

  describe('Gap Detection', () => {
    it('should detect weekend gaps correctly', () => {
      // Mock price data with a weekend gap
      const mockPriceData: PriceData[] = [
        {
          date: new Date('2024-01-05'), // Friday
          open: 100,
          high: 102,
          low: 99,
          close: 101,
          volume: 1000000
        },
        {
          date: new Date('2024-01-08'), // Monday (weekend gap)
          open: 105, // 4% gap up
          high: 106,
          low: 104,
          close: 105.5,
          volume: 1200000
        }
      ];

      const gaps = detectWeekendGaps(mockPriceData, 'TEST', DEFAULT_GAP_RISK_CONFIG);
      
      expect(gaps).toHaveLength(1);
      expect(gaps[0].symbol).toBe('TEST');
      expect(gaps[0].gapSize).toBeCloseTo(0.0396, 3); // ~4% gap
      expect(gaps[0].magnitude).toBe(GapMagnitude.LARGE);
      expect(gaps[0].fridayClose).toBe(101);
      expect(gaps[0].mondayOpen).toBe(105);
    });

    it('should not detect gaps on regular trading days', () => {
      // Mock price data without weekend gaps
      const mockPriceData: PriceData[] = [
        {
          date: new Date('2024-01-05'),
          open: 100,
          high: 102,
          low: 99,
          close: 101,
          volume: 1000000
        },
        {
          date: new Date('2024-01-06'), // Next trading day
          open: 101.5,
          high: 103,
          low: 100.5,
          close: 102,
          volume: 1100000
        }
      ];

      const gaps = detectWeekendGaps(mockPriceData, 'TEST', DEFAULT_GAP_RISK_CONFIG);
      
      expect(gaps).toHaveLength(0);
    });
  });

  describe('Gap Statistics Calculation', () => {
    it('should calculate gap statistics correctly', () => {
      // Create mock gap data
      const mockPriceData: PriceData[] = [
        // Week 1
        { date: new Date('2024-01-05'), open: 100, high: 102, low: 99, close: 100, volume: 1000000 },
        { date: new Date('2024-01-08'), open: 102, high: 104, low: 101, close: 103, volume: 1100000 }, // 2% gap
        
        // Week 2
        { date: new Date('2024-01-12'), open: 103, high: 105, low: 102, close: 104, volume: 1000000 },
        { date: new Date('2024-01-16'), open: 100, high: 102, low: 99, close: 101, volume: 1200000 }, // -2.88% gap
        
        // Week 3
        { date: new Date('2024-01-19'), open: 101, high: 103, low: 100, close: 102, volume: 1000000 },
        { date: new Date('2024-01-22'), open: 108, high: 110, low: 107, close: 109, volume: 1300000 } // 5.88% gap
      ];

      const gaps = detectWeekendGaps(mockPriceData, 'TEST', DEFAULT_GAP_RISK_CONFIG);
      const stats = calculateGapStatistics(gaps, 'TEST', 252, DEFAULT_GAP_RISK_CONFIG);

      expect(stats.totalGaps).toBe(3);
      expect(stats.symbol).toBe('TEST');
      expect(stats.frequency.total).toBeGreaterThan(0);
      expect(stats.statistics.meanGapSize).toBeDefined();
      expect(stats.riskMetrics.probabilityOfGap).toBeGreaterThan(0);
    });
  });

  describe('Position Gap Risk Analysis', () => {
    it('should analyze position gap risk', async () => {
      // Mock position data
      const mockPosition: NormalizedTradeData = {
        id: 'test-1',
        importTimestamp: new Date().toISOString(),
        broker: BrokerType.IBKR,
        tradeDate: '2024-01-01',
        symbol: 'SPY',
        assetCategory: 'STK',
        quantity: 100,
        tradePrice: 450,
        currency: 'USD',
        netAmount: -45000
      };

      // Mock the service's private methods by overriding them
      jest.spyOn(service as any, 'getHistoricalData').mockResolvedValue([]);
      
      const result = await service.analyzePositionGapRisk(mockPosition);
      
      // Since we mocked empty historical data, it should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toContain('No historical data available');
    });
  });

  describe('Service Configuration', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        historicalPeriod: 500,
        minimumGapThreshold: 0.01
      };

      service.updateConfiguration(newConfig);
      
      // Configuration should be updated
      expect((service as any).config.historicalPeriod).toBe(500);
      expect((service as any).config.minimumGapThreshold).toBe(0.01);
    });

    it('should clear cache when configuration changes', () => {
      const clearCacheSpy = jest.spyOn(service, 'clearCache');
      
      service.updateConfiguration({ historicalPeriod: 300 });
      
      expect(clearCacheSpy).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', () => {
      service.clearCache();
      
      // Verify caches are empty
      expect((service as any).gapStatisticsCache.size).toBe(0);
      expect((service as any).historicalDataCache.size).toBe(0);
    });
  });
});

// Integration test demonstrating the complete workflow
describe('WeekendGapRiskService Integration', () => {
  it('should handle the complete gap risk analysis workflow', async () => {
    const service = new WeekendGapRiskService();
    
    // Mock portfolio positions
    const mockPositions: NormalizedTradeData[] = [
      {
        id: 'pos-1',
        importTimestamp: new Date().toISOString(),
        broker: BrokerType.IBKR,
        tradeDate: '2024-01-01',
        symbol: 'SPY',
        assetCategory: 'STK',
        quantity: 100,
        tradePrice: 450,
        currency: 'USD',
        netAmount: -45000
      },
      {
        id: 'pos-2',
        importTimestamp: new Date().toISOString(),
        broker: BrokerType.IBKR,
        tradeDate: '2024-01-01',
        symbol: 'QQQ',
        assetCategory: 'STK',
        quantity: 50,
        tradePrice: 380,
        currency: 'USD',
        netAmount: -19000
      }
    ];

    // Mock the historical data method to return empty data
    jest.spyOn(service as any, 'getHistoricalData').mockResolvedValue([]);
    
    const result = await service.analyzePortfolioGapRisk(mockPositions, 'test-portfolio');
    
    // Should handle the case gracefully
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    const analysis = result.data as any;
    expect(analysis.portfolioId).toBe('test-portfolio');
    expect(analysis.positions).toHaveLength(0); // No positions analyzed due to no data
    expect(analysis.recommendations).toBeDefined();
  });
}); 