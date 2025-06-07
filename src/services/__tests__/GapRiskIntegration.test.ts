/**
 * Gap Risk Integration Tests
 * 
 * Comprehensive integration tests for the complete Weekend Gap Risk system
 * including export, scheduling, rule engine, and dashboard integration.
 */

import { GapRiskRuleEngine } from '../GapRiskRuleEngine';
import { GapRiskExportService, ExportOptions } from '../GapRiskExportService';
import { GapRiskSchedulingService } from '../GapRiskSchedulingService';
import { TradingStyleConfigService } from '../TradingStyleConfigService';
import { WeekendGapRiskService } from '../WeekendGapRiskService';
import { getRulesForStyleAndRisk } from '../../utils/tradingStyleRuleTemplates';
import { NormalizedTradeData, BrokerType } from '../../types/trade';
import { TradingStyle, RiskTolerance } from '../../types/tradingStyleRules';

describe('Gap Risk Integration Tests', () => {
  let ruleEngine: GapRiskRuleEngine;
  let exportService: GapRiskExportService;
  let schedulingService: GapRiskSchedulingService;
  let configService: TradingStyleConfigService;
  let weekendGapService: WeekendGapRiskService;

  const mockPositions: NormalizedTradeData[] = [
    {
      id: 'test-1',
      importTimestamp: new Date().toISOString(),
      broker: BrokerType.IBKR,
      tradeDate: '2024-12-13',
      symbol: 'AAPL',
      quantity: 100,
      tradePrice: 150.00,
      currency: 'USD',
      netAmount: -15000,
      assetCategory: 'STK'
    },
    {
      id: 'test-2',
      importTimestamp: new Date().toISOString(),
      broker: BrokerType.IBKR,
      tradeDate: '2024-12-13',
      symbol: 'TSLA',
      quantity: 50,
      tradePrice: 200.00,
      currency: 'USD',
      netAmount: -10000,
      assetCategory: 'STK'
    }
  ];

  beforeEach(() => {
    weekendGapService = new WeekendGapRiskService();
    configService = new TradingStyleConfigService();
    ruleEngine = new GapRiskRuleEngine(weekendGapService, configService);
    exportService = new GapRiskExportService();
    schedulingService = new GapRiskSchedulingService(ruleEngine, exportService, configService);
  });

  describe('End-to-End Analysis Workflow', () => {
    test('should complete full analysis workflow from configuration to export', async () => {
      // Step 1: Configure trading style
      const userId = 'test-user';
      const config = configService.getDefaultConfigForStyle('swing_trading', 'moderate');
      configService.setUserConfig(userId, config);

      // Step 2: Get rules for trading style
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      expect(rules).toHaveLength(expect.any(Number));

      // Step 3: Run gap risk analysis
      const assessment = await ruleEngine.evaluatePositions(userId, mockPositions, rules);
      
      expect(assessment).toBeDefined();
      expect(assessment.summary.totalPositionsEvaluated).toBe(2);
      expect(assessment.positionEvaluations).toHaveLength(expect.any(Number));
      expect(assessment.recommendations).toBeDefined();

      // Step 4: Export results
      const exportOptions: ExportOptions = {
        format: 'csv',
        includePositions: true,
        includeRecommendations: true
      };

      const exportResult = await exportService.exportAssessment(
        assessment,
        mockPositions,
        exportOptions
      );

      expect(exportResult.success).toBe(true);
      expect(exportResult.fileName).toContain('gap-risk-report');
      expect(exportResult.metadata?.recordCount).toBeGreaterThan(0);
    });

    test('should handle PDF export with all options', async () => {
      const userId = 'test-user';
      const config = configService.getDefaultConfigForStyle('day_trading', 'conservative');
      configService.setUserConfig(userId, config);

      const rules = getRulesForStyleAndRisk('day_trading', 'conservative');
      const assessment = await ruleEngine.evaluatePositions(userId, mockPositions, rules);

      const exportOptions: ExportOptions = {
        format: 'pdf',
        includePositions: true,
        includeRecommendations: true,
        includeCharts: true,
        filters: {
          symbols: ['AAPL'],
          priority: ['high', 'medium']
        }
      };

      const exportResult = await exportService.exportAssessment(
        assessment,
        mockPositions,
        exportOptions
      );

      expect(exportResult.success).toBe(true);
      expect(exportResult.fileName).toContain('.pdf');
      expect(exportResult.metadata?.format).toBe('pdf');
    });
  });

  describe('Scheduling Integration', () => {
    test('should create and manage analysis schedules', async () => {
      const userId = 'test-user';
      
      // Create Friday schedule
      const scheduleId = await schedulingService.createFridayAnalysisSchedule(
        userId,
        { inApp: true, email: ['test@example.com'] }
      );

      expect(scheduleId).toBeDefined();
      expect(scheduleId).toMatch(/^schedule_/);

      // Get user schedules
      const schedules = schedulingService.getUserSchedules(userId);
      expect(schedules).toHaveLength(1);
      expect(schedules[0].name).toBe('Friday Weekend Gap Risk Analysis');
      expect(schedules[0].schedule.dayOfWeek).toBe(5); // Friday
      expect(schedules[0].enabled).toBe(true);

      // Manually trigger schedule
      const execution = await schedulingService.triggerSchedule(scheduleId, mockPositions);
      expect(execution.status).toBe('completed');
      expect(execution.triggeredBy).toBe('manual');
      expect(execution.metadata?.positionCount).toBe(2);
    });

    test('should handle custom schedule configuration', async () => {
      const userId = 'test-user';
      
      const customScheduleConfig = {
        userId,
        name: 'Custom Risk Analysis',
        enabled: true,
        schedule: {
          type: 'weekly' as const,
          dayOfWeek: 1, // Monday
          time: '09:00',
          timezone: 'America/New_York'
        },
        triggers: {
          riskThreshold: 60,
          positionCount: 5,
          portfolioValue: 100000
        },
        exportSettings: {
          format: 'pdf' as const,
          includePositions: true,
          includeRecommendations: true
        },
        notifications: {
          email: ['custom@example.com'],
          inApp: true
        }
      };

      const scheduleId = await schedulingService.createSchedule(customScheduleConfig);
      expect(scheduleId).toBeDefined();

      const schedules = schedulingService.getUserSchedules(userId);
      const customSchedule = schedules.find(s => s.id === scheduleId);
      
      expect(customSchedule).toBeDefined();
      expect(customSchedule!.schedule.dayOfWeek).toBe(1);
      expect(customSchedule!.triggers.riskThreshold).toBe(60);
    });

    test('should manage execution history', async () => {
      const userId = 'test-user';
      const scheduleId = await schedulingService.createFridayAnalysisSchedule(userId);

      // Trigger multiple executions
      await schedulingService.triggerSchedule(scheduleId, mockPositions);
      await schedulingService.triggerSchedule(scheduleId, mockPositions);

      const history = schedulingService.getExecutionHistory(userId, 10);
      expect(history).toHaveLength(2);
      expect(history[0].startTime).toBeInstanceOf(Date);
      expect(history[0].status).toBe('completed');
    });
  });

  describe('Multi-Style Trading Integration', () => {
    test('should handle different trading styles appropriately', async () => {
      const styles: TradingStyle[] = ['day_trading', 'swing_trading', 'position_trading', 'scalping'];
      const tolerances: RiskTolerance[] = ['conservative', 'moderate', 'aggressive'];

      for (const style of styles) {
        for (const tolerance of tolerances) {
          const userId = `user-${style}-${tolerance}`;
          const config = configService.getDefaultConfigForStyle(style, tolerance);
          configService.setUserConfig(userId, config);

          const rules = getRulesForStyleAndRisk(style, tolerance);
          const assessment = await ruleEngine.evaluatePositions(userId, mockPositions, rules);

          expect(assessment).toBeDefined();
          expect(assessment.riskLevel).toMatch(/^(low|medium|high|extreme)$/);
          
          // Verify style-specific constraints are applied
          if (style === 'day_trading' || style === 'scalping') {
            // These styles should have stricter weekend risk rules
            expect(assessment.overallRiskScore).toBeDefined();
          }
        }
      }
    });

    test('should apply risk tolerance adjustments correctly', async () => {
      const userId = 'test-user';
      const symbol = 'AAPL';

      // Test conservative vs aggressive risk tolerance
      const conservativeConfig = configService.getDefaultConfigForStyle('swing_trading', 'conservative');
      const aggressiveConfig = configService.getDefaultConfigForStyle('swing_trading', 'aggressive');

      expect(conservativeConfig.maxPositionSize).toBeLessThan(aggressiveConfig.maxPositionSize);
      expect(conservativeConfig.maxGapRiskScore).toBeLessThan(aggressiveConfig.maxGapRiskScore);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty position lists gracefully', async () => {
      const userId = 'test-user';
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      
      const assessment = await ruleEngine.evaluatePositions(userId, [], rules);
      
      expect(assessment.summary.totalPositionsEvaluated).toBe(0);
      expect(assessment.positionEvaluations).toHaveLength(0);
      expect(assessment.overallRiskScore).toBeDefined();
    });

    test('should handle invalid export options gracefully', async () => {
      const userId = 'test-user';
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const assessment = await ruleEngine.evaluatePositions(userId, mockPositions, rules);

      const invalidExportOptions: ExportOptions = {
        format: 'invalid' as any,
        includePositions: true
      };

      const exportResult = await exportService.exportAssessment(
        assessment,
        mockPositions,
        invalidExportOptions
      );

      expect(exportResult.success).toBe(false);
      expect(exportResult.error).toContain('Unsupported export format');
    });

    test('should handle schedule execution failures', async () => {
      const userId = 'test-user';
      const scheduleId = await schedulingService.createFridayAnalysisSchedule(userId);

      // Simulate execution with invalid data to trigger failure
      const invalidPositions: any[] = [{ invalid: 'data' }];
      
      const execution = await schedulingService.triggerSchedule(scheduleId, invalidPositions as any);
      
      expect(execution.status).toBe('failed');
      expect(execution.error).toBeDefined();
    });
  });

  describe('Configuration and Settings Integration', () => {
    test('should persist and retrieve user configurations correctly', async () => {
      const userId = 'test-user';
      const originalConfig = configService.getDefaultConfigForStyle('position_trading', 'aggressive');
      
      // Modify configuration
      const customConfig = {
        ...originalConfig,
        maxPositionSize: 8,
        accountSize: 250000
      };

      configService.setUserConfig(userId, customConfig);
      
      const retrievedConfig = configService.getConfigForUser(userId);
      expect(retrievedConfig.maxPositionSize).toBe(8);
      expect(retrievedConfig.accountSize).toBe(250000);
    });

    test('should validate configuration constraints', async () => {
      const userId = 'test-user';
      
      expect(() => {
        const invalidConfig = configService.getDefaultConfigForStyle('swing_trading', 'moderate');
        invalidConfig.maxPositionSize = 30; // Invalid: > 25%
        configService.setUserConfig(userId, invalidConfig);
      }).toThrow('Max position size must be between 0 and 25%');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large position lists efficiently', async () => {
      const userId = 'test-user';
      const largePositionList: NormalizedTradeData[] = [];
      
      // Create 100 mock positions
      for (let i = 0; i < 100; i++) {
        largePositionList.push({
          id: `test-${i}`,
          importTimestamp: new Date().toISOString(),
          broker: BrokerType.IBKR,
          tradeDate: '2024-12-13',
          symbol: `STOCK${i}`,
          quantity: 100,
          tradePrice: 50 + i,
          currency: 'USD',
          netAmount: -(50 + i) * 100,
          assetCategory: 'STK'
        });
      }

      const rules = getRulesForStyleAndRisk('position_trading', 'moderate');
      const startTime = Date.now();
      
      const assessment = await ruleEngine.evaluatePositions(userId, largePositionList, rules);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(assessment.summary.totalPositionsEvaluated).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle concurrent export requests', async () => {
      const userId = 'test-user';
      const rules = getRulesForStyleAndRisk('swing_trading', 'moderate');
      const assessment = await ruleEngine.evaluatePositions(userId, mockPositions, rules);

      const exportPromises = [
        exportService.exportAssessment(assessment, mockPositions, { format: 'csv', includePositions: true }),
        exportService.exportAssessment(assessment, mockPositions, { format: 'pdf', includePositions: true }),
        exportService.exportAssessment(assessment, mockPositions, { format: 'csv', includeRecommendations: true })
      ];

      const results = await Promise.all(exportPromises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.fileName).toBeDefined();
      });
    });
  });
}); 