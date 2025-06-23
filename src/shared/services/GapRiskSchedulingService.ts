/**
 * Gap Risk Scheduling Service
 * 
 * Handles automated scheduling of gap risk analysis and report generation.
 * Supports Friday evening analysis, custom schedules, and notification triggers.
 */

import { GapRiskRuleEngine } from './GapRiskRuleEngine';
import { GapRiskExportService, ExportOptions } from './GapRiskExportService';
import { TradingStyleConfigService } from './TradingStyleConfigService';
import { TradingStyleGapAssessment } from '../../types/tradingStyleRules';
import { NormalizedTradeData } from '../../types/trade';

export interface ScheduleConfig {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  schedule: {
    type: 'weekly' | 'custom' | 'market_close';
    dayOfWeek?: number; // 0-6 (Sunday-Saturday)
    time?: string; // HH:MM format
    timezone?: string;
    marketEvents?: ('market_close' | 'friday_close' | 'weekend_start')[];
  };
  triggers: {
    riskThreshold?: number; // Trigger if risk score exceeds this
    positionCount?: number; // Trigger if position count exceeds this
    portfolioValue?: number; // Trigger if portfolio value exceeds this
    volatilityAlert?: boolean; // Trigger on high volatility periods
  };
  exportSettings: ExportOptions;
  notifications: {
    email?: string[];
    webhook?: string;
    slack?: string;
    inApp?: boolean;
  };
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assessment?: TradingStyleGapAssessment;
  exportResult?: any;
  error?: string;
  triggeredBy: 'schedule' | 'manual' | 'threshold' | 'market_event';
  metadata?: {
    positionCount: number;
    riskScore: number;
    portfolioValue: number;
    marketConditions?: string;
  };
}

export class GapRiskSchedulingService {
  private schedules: Map<string, ScheduleConfig> = new Map();
  private executions: Map<string, ScheduleExecution> = new Map();
  private ruleEngine: GapRiskRuleEngine;
  private exportService: GapRiskExportService;
  private configService: TradingStyleConfigService;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    ruleEngine: GapRiskRuleEngine,
    exportService: GapRiskExportService,
    configService: TradingStyleConfigService
  ) {
    this.ruleEngine = ruleEngine;
    this.exportService = exportService;
    this.configService = configService;
  }

  /**
   * Create a new analysis schedule
   */
  async createSchedule(config: Omit<ScheduleConfig, 'id' | 'createdAt' | 'nextRun'>): Promise<string> {
    const scheduleId = this.generateScheduleId();
    const schedule: ScheduleConfig = {
      ...config,
      id: scheduleId,
      createdAt: new Date(),
      nextRun: this.calculateNextRun(config.schedule)
    };

    this.schedules.set(scheduleId, schedule);
    
    // Start scheduler if this is the first schedule
    if (this.schedules.size === 1) {
      this.startScheduler();
    }

    console.log(`Created schedule ${scheduleId} for user ${config.userId}`);
    return scheduleId;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(scheduleId: string, updates: Partial<ScheduleConfig>): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return false;
    }

    const updatedSchedule = { ...schedule, ...updates };
    if (updates.schedule) {
      updatedSchedule.nextRun = this.calculateNextRun(updates.schedule);
    }

    this.schedules.set(scheduleId, updatedSchedule);
    return true;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    const deleted = this.schedules.delete(scheduleId);
    
    // Stop scheduler if no schedules remain
    if (this.schedules.size === 0) {
      this.stopScheduler();
    }

    return deleted;
  }

  /**
   * Get schedules for a user
   */
  getUserSchedules(userId: string): ScheduleConfig[] {
    return Array.from(this.schedules.values())
      .filter(schedule => schedule.userId === userId);
  }

  /**
   * Manually trigger a schedule execution
   */
  async triggerSchedule(
    scheduleId: string, 
    positions: NormalizedTradeData[]
  ): Promise<ScheduleExecution> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    return await this.executeSchedule(schedule, positions, 'manual');
  }

  /**
   * Create default Friday analysis schedule
   */
  async createFridayAnalysisSchedule(
    userId: string,
    notifications: ScheduleConfig['notifications'] = { inApp: true }
  ): Promise<string> {
    const config: Omit<ScheduleConfig, 'id' | 'createdAt' | 'nextRun'> = {
      userId,
      name: 'Friday Weekend Gap Risk Analysis',
      enabled: true,
      schedule: {
        type: 'weekly',
        dayOfWeek: 5, // Friday
        time: '16:00', // 4 PM (after market close)
        timezone: 'America/New_York',
        marketEvents: ['friday_close', 'weekend_start']
      },
      triggers: {
        riskThreshold: 70,
        positionCount: 10,
        volatilityAlert: true
      },
      exportSettings: {
        format: 'pdf',
        includePositions: true,
        includeRecommendations: true,
        includeCharts: true
      },
      notifications
    };

    return await this.createSchedule(config);
  }

  /**
   * Start the scheduler
   */
  private startScheduler(): void {
    if (this.intervalId) {
      return; // Already running
    }

    console.log('Starting gap risk scheduler...');
    
    // Check every minute for due schedules
    this.intervalId = setInterval(async () => {
      await this.checkDueSchedules();
    }, 60000);
  }

  /**
   * Stop the scheduler
   */
  private stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Stopped gap risk scheduler');
    }
  }

  /**
   * Check for schedules that are due to run
   */
  private async checkDueSchedules(): Promise<void> {
    const now = new Date();
    
    for (const schedule of Array.from(this.schedules.values())) {
      if (!schedule.enabled || !schedule.nextRun) {
        continue;
      }

      if (now >= schedule.nextRun) {
        try {
          // In a real implementation, we would fetch current positions here
          const mockPositions: NormalizedTradeData[] = []; // TODO: Get real positions
          
          await this.executeSchedule(schedule, mockPositions, 'schedule');
          
          // Update next run time
          schedule.lastRun = now;
          schedule.nextRun = this.calculateNextRun(schedule.schedule);
          this.schedules.set(schedule.id, schedule);
          
        } catch (error) {
          console.error(`Failed to execute schedule ${schedule.id}:`, error);
        }
      }
    }
  }

  /**
   * Execute a scheduled analysis
   */
  private async executeSchedule(
    schedule: ScheduleConfig,
    positions: NormalizedTradeData[],
    triggeredBy: ScheduleExecution['triggeredBy']
  ): Promise<ScheduleExecution> {
    const executionId = this.generateExecutionId();
    const execution: ScheduleExecution = {
      id: executionId,
      scheduleId: schedule.id,
      userId: schedule.userId,
      startTime: new Date(),
      status: 'running',
      triggeredBy,
      metadata: {
        positionCount: positions.length,
        riskScore: 0,
        portfolioValue: 0
      }
    };

    this.executions.set(executionId, execution);

    try {
      // Get user trading style configuration
      const userConfig = this.configService.getConfigForUser(schedule.userId);
      
      // Get rules for analysis - using the getRulesForStyleAndRisk from utils
      const { getRulesForStyleAndRisk } = await import('../utils/tradingStyleRuleTemplates');
      const rules = getRulesForStyleAndRisk(userConfig.style, userConfig.riskTolerance);

      // Run gap risk analysis
      const assessment = await this.ruleEngine.evaluatePositions(
        schedule.userId,
        positions,
        rules
      );

      // Update execution metadata
      execution.metadata!.riskScore = assessment.overallRiskScore;
      execution.metadata!.portfolioValue = assessment.portfolioMetrics.totalWeekendExposure || 0;

      // Check if analysis meets trigger conditions
      const shouldTrigger = this.checkTriggerConditions(schedule, assessment);
      
      if (shouldTrigger || triggeredBy === 'manual') {
        // Export report
        const exportResult = await this.exportService.exportAssessment(
          assessment,
          positions,
          schedule.exportSettings
        );

        // Send notifications
        await this.sendNotifications(schedule, assessment, exportResult);

        execution.assessment = assessment;
        execution.exportResult = exportResult;
      }

      execution.status = 'completed';
      execution.endTime = new Date();

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.endTime = new Date();
      console.error(`Schedule execution ${executionId} failed:`, error);
    }

    this.executions.set(executionId, execution);
    return execution;
  }

  /**
   * Check if trigger conditions are met
   */
  private checkTriggerConditions(
    schedule: ScheduleConfig,
    assessment: TradingStyleGapAssessment
  ): boolean {
    const { triggers } = schedule;

    if (triggers.riskThreshold && assessment.overallRiskScore >= triggers.riskThreshold) {
      return true;
    }

    if (triggers.positionCount && assessment.summary.totalPositionsEvaluated >= triggers.positionCount) {
      return true;
    }

    if (triggers.portfolioValue && 
        (assessment.portfolioMetrics.totalWeekendExposure || 0) >= triggers.portfolioValue) {
      return true;
    }

    return false;
  }

  /**
   * Send notifications based on schedule configuration
   */
  private async sendNotifications(
    schedule: ScheduleConfig,
    assessment: TradingStyleGapAssessment,
    exportResult: any
  ): Promise<void> {
    const { notifications } = schedule;

    // Mock notification sending
    if (notifications.email && notifications.email.length > 0) {
      console.log(`Sending email notification to: ${notifications.email.join(', ')}`);
    }

    if (notifications.webhook) {
      console.log(`Sending webhook notification to: ${notifications.webhook}`);
    }

    if (notifications.slack) {
      console.log(`Sending Slack notification to: ${notifications.slack}`);
    }

    if (notifications.inApp) {
      console.log('Creating in-app notification');
    }
  }

  /**
   * Calculate next run time based on schedule configuration
   */
  private calculateNextRun(scheduleConfig: ScheduleConfig['schedule']): Date {
    const now = new Date();
    const nextRun = new Date(now);

    if (scheduleConfig.type === 'weekly' && scheduleConfig.dayOfWeek !== undefined) {
      const currentDay = now.getDay();
      const targetDay = scheduleConfig.dayOfWeek;
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      
      nextRun.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
      
      if (scheduleConfig.time) {
        const [hours, minutes] = scheduleConfig.time.split(':').map(Number);
        nextRun.setHours(hours, minutes, 0, 0);
      }
    } else if (scheduleConfig.type === 'market_close') {
      // For market close, schedule for 4:30 PM ET on weekdays
      nextRun.setHours(16, 30, 0, 0);
      
      // If it's already past market close today, schedule for next trading day
      if (now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 30)) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      // Skip weekends
      while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    }

    return nextRun;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(userId: string, limit: number = 50): ScheduleExecution[] {
    return Array.from(this.executions.values())
      .filter(execution => execution.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Generate unique schedule ID
   */
  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old executions
   */
  async cleanupOldExecutions(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleaned = 0;
    for (const [id, execution] of Array.from(this.executions.entries())) {
      if (execution.startTime < cutoffDate) {
        this.executions.delete(id);
        cleaned++;
      }
    }
    
    return cleaned;
  }
} 