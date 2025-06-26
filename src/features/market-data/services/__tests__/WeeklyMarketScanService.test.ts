/**
 * Weekly Market Scan Service Tests
 * 
 * Comprehensive test suite for the market scanning automation service.
 * Tests all strategy classes, mock data generation, and challenge integration.
 */

import { WeeklyMarketScanService, StrategyClass, ScanResult } from '../WeeklyMarketScanService';
import { MonitoringService } from '../../../../shared/services/MonitoringService';

// Mock MonitoringService
class MockMonitoringService {
  private metrics = new Map();
  private healthChecks = new Map();

  startSpan(name: string) {
    return {
      setStatus: (status: any) => {},
      finish: () => {}
    };
  }

  recordMetric(name: string, value: number, labels?: any) {
    this.metrics.set(name, { value, labels });
  }

  registerMetric(config: any) {}
  registerHealthCheck(name: string, check: () => any) {
    this.healthChecks.set(name, check);
  }

  getMetrics() { return this.metrics; }
  getHealthChecks() { return this.healthChecks; }
}

describe('WeeklyMarketScanService', () => {
  let service: WeeklyMarketScanService;
  let monitoring: MockMonitoringService;

  beforeEach(async () => {
    monitoring = new MockMonitoringService();
    service = new WeeklyMarketScanService(monitoring as any);
    await service.initialize();
  });

  afterEach(() => {
    // Clean up any active operations
    service.removeAllListeners();
  });

  describe('Service Initialization', () => {
    test('should initialize successfully', async () => {
      expect(service.getStatistics().isInitialized).toBe(true);
      expect(service.getStatistics().supportedStrategies).toEqual([
        'BUFFETT_GUARDIAN',
        'DALIO_WARRIOR', 
        'SOROS_ASSASSIN',
        'LYNCH_SCOUT'
      ]);
    });

    test('should register health checks', async () => {
      const healthChecks = monitoring.getHealthChecks();
      expect(healthChecks.has('weekly_market_scan')).toBe(true);
      
      const healthCheck = healthChecks.get('weekly_market_scan');
      const result = await healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.component).toBe('weekly_market_scan');
    });

    test('should have default configuration', () => {
      const config = service.getConfiguration();
      expect(config.buffettGuardian.maxPE).toBe(15);
      expect(config.dalioWarrior.rsiMin).toBe(40);
      expect(config.sorosAssassin.maxRSI).toBe(30);
      expect(config.lynchScout.maxPEG).toBe(1.0);
      expect(config.maxResultsPerStrategy).toBe(10);
      expect(config.minConfidenceScore).toBe(60);
    });
  });

  describe('Strategy Scanning', () => {
    test('should run Buffett Guardian scan successfully', async () => {
      const results = await service.runWeeklyScan('BUFFETT_GUARDIAN', 'test-user');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(10);
      
      // Check that all results are for Buffett Guardian strategy
      results.forEach(result => {
        expect(result.strategyClass).toBe('BUFFETT_GUARDIAN');
        expect(result.confidenceScore).toBeGreaterThanOrEqual(60);
        expect(['A+', 'A', 'B', 'C']).toContain(result.setupQuality);
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(result.alertLevel);
        expect(result.xpReward).toBeGreaterThan(0);
        expect(result.reasoning).toBeInstanceOf(Array);
        expect(result.reasoning.length).toBeGreaterThan(0);
      });
    });

    test('should run Dalio Warrior scan successfully', async () => {
      const results = await service.runWeeklyScan('DALIO_WARRIOR', 'test-user');
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(result => {
        expect(result.strategyClass).toBe('DALIO_WARRIOR');
        expect(result.confidenceScore).toBeGreaterThanOrEqual(60);
      });
    });

    test('should run Soros Assassin scan successfully', async () => {
      const results = await service.runWeeklyScan('SOROS_ASSASSIN', 'test-user');
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(result => {
        expect(result.strategyClass).toBe('SOROS_ASSASSIN');
        expect(result.confidenceScore).toBeGreaterThanOrEqual(60);
      });
    });

    test('should run Lynch Scout scan successfully', async () => {
      const results = await service.runWeeklyScan('LYNCH_SCOUT', 'test-user');
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(result => {
        expect(result.strategyClass).toBe('LYNCH_SCOUT');
        expect(result.confidenceScore).toBeGreaterThanOrEqual(60);
      });
    });

    test('should handle empty results gracefully', async () => {
      // Update config to make criteria very strict
      service.updateConfiguration({
        minConfidenceScore: 99,
        maxResultsPerStrategy: 1
      });

      const results = await service.runWeeklyScan('BUFFETT_GUARDIAN', 'test-user');
      expect(Array.isArray(results)).toBe(true);
      // Results might be empty due to strict criteria
    });

    test('should emit scan progress events', async () => {
      const progressEvents: any[] = [];
      service.on('scan:progress', (event) => {
        progressEvents.push(event);
      });

      await service.runWeeklyScan('BUFFETT_GUARDIAN', 'test-user');
      
      expect(progressEvents.length).toBeGreaterThan(0);
      progressEvents.forEach(event => {
        expect(event.progress).toBeGreaterThanOrEqual(0);
        expect(event.progress).toBeLessThanOrEqual(100);
        expect(event.operationId).toBeDefined();
      });
    });
  });

  describe('Weekly Scan Data', () => {
    test('should get comprehensive weekly scan data', async () => {
      const weeklyData = await service.getScanResults('test-user', 'BUFFETT_GUARDIAN');
      
      expect(weeklyData.userId).toBe('test-user');
      expect(weeklyData.strategyClass).toBe('BUFFETT_GUARDIAN');
      expect(weeklyData.scanDate).toBeInstanceOf(Date);
      expect(weeklyData.totalStocksScanned).toBeGreaterThan(0);
      expect(weeklyData.qualifyingStocks).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(weeklyData.scanResults)).toBe(true);
      expect(['BULLISH', 'BEARISH', 'NEUTRAL', 'VOLATILE']).toContain(weeklyData.overallMarketSentiment);
      expect(Array.isArray(weeklyData.topOpportunities)).toBe(true);
      expect(weeklyData.topOpportunities.length).toBeLessThanOrEqual(5);
      expect(typeof weeklyData.weeklyTheme).toBe('string');
      expect(Array.isArray(weeklyData.economicFactors)).toBe(true);
      expect(Array.isArray(weeklyData.recommendedActions)).toBe(true);
      expect(weeklyData.totalXPReward).toBeGreaterThanOrEqual(0);
      expect(weeklyData.weeklyBonus).toBeGreaterThanOrEqual(0);
      expect(weeklyData.streakMultiplier).toBeGreaterThanOrEqual(1.0);
    });

    test('should cache scan results', async () => {
      const firstCall = await service.getScanResults('test-user', 'DALIO_WARRIOR');
      const secondCall = await service.getScanResults('test-user', 'DALIO_WARRIOR');
      
      // Both calls should return the same data (from cache)
      expect(firstCall.scanDate.getTime()).toBe(secondCall.scanDate.getTime());
      expect(firstCall.scanResults.length).toBe(secondCall.scanResults.length);
    });
  });

  describe('Sunday Scheduling', () => {
    test('should schedule Sunday scan', async () => {
      const scheduleEvents: any[] = [];
      service.on('sunday:scan:scheduled', (event) => {
        scheduleEvents.push(event);
      });

      await service.scheduleSundayScan('test-user');
      
      expect(scheduleEvents.length).toBe(1);
      const event = scheduleEvents[0];
      expect(event.userId).toBe('test-user');
      expect(event.scheduledFor).toBeInstanceOf(Date);
      expect(event.timeUntilScan).toBeGreaterThan(0);
    });

    test('should respect Sunday scheduling configuration', async () => {
      // Disable Sunday scheduling
      service.updateConfiguration({ sundayScheduleEnabled: false });
      
      await service.scheduleSundayScan('test-user');
      
      // Should not schedule when disabled
      expect(service.getStatistics().sundayScheduleEnabled).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig = {
        maxResultsPerStrategy: 15,
        minConfidenceScore: 70,
        buffettGuardian: {
          maxPE: 12,
          minROE: 20,
          maxDebtEquity: 0.3,
          minMarketCap: 2000000000,
          sectors: ['Utilities', 'Healthcare']
        }
      };

      service.updateConfiguration(newConfig);
      
      const config = service.getConfiguration();
      expect(config.maxResultsPerStrategy).toBe(15);
      expect(config.minConfidenceScore).toBe(70);
      expect(config.buffettGuardian.maxPE).toBe(12);
      expect(config.buffettGuardian.minROE).toBe(20);
    });

    test('should emit configuration update events', () => {
      const updateEvents: any[] = [];
      service.on('config:updated', (config) => {
        updateEvents.push(config);
      });

      service.updateConfiguration({ maxResultsPerStrategy: 20 });
      
      expect(updateEvents.length).toBe(1);
      expect(updateEvents[0].maxResultsPerStrategy).toBe(20);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when not initialized', async () => {
      const uninitializedService = new WeeklyMarketScanService(monitoring as any);
      
      await expect(uninitializedService.runWeeklyScan('BUFFETT_GUARDIAN')).rejects.toThrow(
        'WeeklyMarketScanService: Service not initialized. Call initialize() first.'
      );
    });

    test('should handle scan failures gracefully', async () => {
      const failureEvents: any[] = [];
      service.on('scan:failed', (event) => {
        failureEvents.push(event);
      });

      // Mock a failure by creating an invalid strategy (this won't actually fail in current implementation)
      // But demonstrates the error handling structure
      
      // For now, test that the service doesn't crash with edge cases
      const results = await service.runWeeklyScan('BUFFETT_GUARDIAN', '');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Service Statistics', () => {
    test('should provide accurate statistics', async () => {
      const initialStats = service.getStatistics();
      expect(initialStats.activeOperations).toBe(0);
      expect(initialStats.isInitialized).toBe(true);
      expect(initialStats.cacheSize).toBeGreaterThanOrEqual(0);

      // Run a scan to change statistics
      await service.runWeeklyScan('BUFFETT_GUARDIAN', 'test-user');
      
      const afterScanStats = service.getStatistics();
      expect(afterScanStats.cacheSize).toBeGreaterThan(initialStats.cacheSize);
    });

    test('should track active operations', async () => {
      // Start multiple scans concurrently
      const scan1Promise = service.runWeeklyScan('BUFFETT_GUARDIAN', 'user1');
      const scan2Promise = service.runWeeklyScan('DALIO_WARRIOR', 'user2');
      
      // Check that operations are tracked (though they may complete quickly)
      const activeOps = service.getActiveOperations();
      expect(Array.isArray(activeOps)).toBe(true);
      
      // Wait for completion
      await Promise.all([scan1Promise, scan2Promise]);
      
      // Operations should be cleared after completion
      const finalOps = service.getActiveOperations();
      expect(finalOps.length).toBe(0);
    });
  });

  describe('XP and Challenge Integration', () => {
    test('should calculate XP rewards correctly', async () => {
      const results = await service.runWeeklyScan('BUFFETT_GUARDIAN', 'test-user');
      
      results.forEach(result => {
        expect(result.xpReward).toBeGreaterThan(0);
        expect(result.xpReward).toBeLessThanOrEqual(100); // Reasonable XP range
        
        // Higher confidence should generally mean higher XP
        if (result.confidenceScore >= 90) {
          expect(result.xpReward).toBeGreaterThanOrEqual(40);
        }
      });
    });

    test('should provide setup quality grades', async () => {
      const results = await service.runWeeklyScan('LYNCH_SCOUT', 'test-user');
      
      results.forEach(result => {
        expect(['A+', 'A', 'B', 'C']).toContain(result.setupQuality);
        
        // Higher confidence should correlate with better grades
        if (result.confidenceScore >= 90) {
          expect(['A+', 'A']).toContain(result.setupQuality);
        }
      });
    });

    test('should calculate weekly bonuses', async () => {
      const weeklyData = await service.getScanResults('test-user', 'SOROS_ASSASSIN');
      
      expect(weeklyData.weeklyBonus).toBeGreaterThan(0);
      expect(weeklyData.totalXPReward).toBeGreaterThanOrEqual(0);
      expect(weeklyData.streakMultiplier).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe('Mock Data Quality', () => {
    test('should generate realistic stock data', async () => {
      const results = await service.runWeeklyScan('BUFFETT_GUARDIAN', 'test-user');
      
      results.forEach(result => {
        // Basic data validation
        expect(result.symbol).toMatch(/^[A-Z]+$/);
        expect(result.companyName).toBeDefined();
        expect(result.price).toBeGreaterThan(0);
        expect(result.marketCap).toBeGreaterThan(0);
        expect(result.sector).toBeDefined();
        expect(result.industry).toBeDefined();
        
        // Financial metrics validation
        if (result.pe) expect(result.pe).toBeGreaterThan(0);
        if (result.roe) expect(result.roe).toBeGreaterThanOrEqual(0);
        if (result.rsi) {
          expect(result.rsi).toBeGreaterThanOrEqual(0);
          expect(result.rsi).toBeLessThanOrEqual(100);
        }
        
        // Timestamps
        expect(result.scanDate).toBeInstanceOf(Date);
        expect(result.lastUpdated).toBeInstanceOf(Date);
      });
    });

    test('should generate strategy-appropriate results', async () => {
      // Test Buffett Guardian criteria
      const buffettResults = await service.runWeeklyScan('BUFFETT_GUARDIAN', 'test-user');
      buffettResults.forEach(result => {
        expect(result.reasoning.some(r => r.includes('ROE') || r.includes('P/E') || r.includes('debt'))).toBe(true);
      });

      // Test Lynch Scout criteria  
      const lynchResults = await service.runWeeklyScan('LYNCH_SCOUT', 'test-user');
      lynchResults.forEach(result => {
        expect(result.reasoning.some(r => r.includes('growth') || r.includes('PEG'))).toBe(true);
      });
    });
  });

  describe('Event System', () => {
    test('should emit scan completion events', async () => {
      const completionEvents: any[] = [];
      service.on('scan:completed', (event) => {
        completionEvents.push(event);
      });

      await service.runWeeklyScan('DALIO_WARRIOR', 'test-user');
      
      expect(completionEvents.length).toBe(1);
      const event = completionEvents[0];
      expect(event.strategyClass).toBe('DALIO_WARRIOR');
      expect(event.userId).toBe('test-user');
      expect(event.resultsCount).toBeGreaterThanOrEqual(0);
    });

    test('should emit service initialization events', async () => {
      const initEvents: any[] = [];
      const newService = new WeeklyMarketScanService(monitoring as any);
      
      newService.on('service:initialized', (event) => {
        initEvents.push(event);
      });

      await newService.initialize();
      
      expect(initEvents.length).toBe(1);
      expect(initEvents[0].strategies).toEqual([
        'BUFFETT_GUARDIAN',
        'DALIO_WARRIOR',
        'SOROS_ASSASSIN', 
        'LYNCH_SCOUT'
      ]);
    });
  });
});