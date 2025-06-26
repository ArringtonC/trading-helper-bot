/**
 * Volatility Scheduling Service
 * 
 * Manages scheduled updates of volatility indicators:
 * - Regular calculation updates
 * - Data refresh scheduling
 * - Real-time update coordination
 * - Error handling and retry logic
 * 
 * Features:
 * - Configurable update intervals
 * - Market hours awareness
 * - Graceful error handling
 * - Performance monitoring
 */

import VolatilityCalculationEngine, { VolatilityCalculationResult } from './VolatilityCalculationEngine';
import VolatilityDataService from './VolatilityDataService';

export interface SchedulerConfig {
  updateIntervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
  enableMarketHoursCheck: boolean;
  symbols: string[];
  enableRealTimeUpdates: boolean;
  batchSize: number;
}

export interface ScheduledUpdate {
  id: string;
  symbol: string;
  scheduledTime: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: VolatilityCalculationResult;
  error?: string;
  retryCount: number;
}

export interface SchedulerStats {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  averageUpdateTimeMs: number;
  lastUpdateTime: Date | null;
  activeSymbols: number;
}

type UpdateCallback = (symbol: string, result: VolatilityCalculationResult) => void;
type ErrorCallback = (symbol: string, error: Error) => void;

export class VolatilitySchedulingService {
  private calculationEngine: VolatilityCalculationEngine;
  private dataService: VolatilityDataService;
  private config: SchedulerConfig;
  private updateTimers = new Map<string, NodeJS.Timeout>();
  private scheduledUpdates = new Map<string, ScheduledUpdate>();
  private isRunning = false;
  private stats: SchedulerStats;
  private updateCallbacks: UpdateCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];

  constructor(
    calculationEngine: VolatilityCalculationEngine,
    dataService: VolatilityDataService,
    config: Partial<SchedulerConfig> = {}
  ) {
    this.calculationEngine = calculationEngine;
    this.dataService = dataService;
    this.config = {
      updateIntervalMs: 30000, // 30 seconds default
      maxRetries: 3,
      retryDelayMs: 5000,
      enableMarketHoursCheck: true,
      symbols: ['SPY', 'AAPL', 'TSLA', 'QQQ'],
      enableRealTimeUpdates: true,
      batchSize: 5,
      ...config
    };

    this.stats = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      averageUpdateTimeMs: 0,
      lastUpdateTime: null,
      activeSymbols: this.config.symbols.length
    };
  }

  /**
   * Start the scheduling service
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('Volatility scheduling service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting volatility scheduling service with config:', {
      symbols: this.config.symbols,
      updateInterval: this.config.updateIntervalMs,
      realTimeUpdates: this.config.enableRealTimeUpdates
    });

    // Schedule initial updates for all symbols
    this.scheduleSymbolUpdates();

    // Start real-time update monitoring if enabled
    if (this.config.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }
  }

  /**
   * Stop the scheduling service
   */
  public stop(): void {
    if (!this.isRunning) {
      console.warn('Volatility scheduling service is not running');
      return;
    }

    this.isRunning = false;
    console.log('Stopping volatility scheduling service');

    // Clear all timers
    Array.from(this.updateTimers.values()).forEach(timer => {
      clearTimeout(timer);
    });
    this.updateTimers.clear();

    // Clear pending updates
    this.scheduledUpdates.clear();
  }

  /**
   * Schedule updates for all configured symbols
   */
  private scheduleSymbolUpdates(): void {
    const now = new Date();
    
    for (const symbol of this.config.symbols) {
      this.scheduleSymbolUpdate(symbol, now);
    }
  }

  /**
   * Schedule an update for a specific symbol
   */
  private scheduleSymbolUpdate(symbol: string, baseTime: Date = new Date()): void {
    // Check if update should be scheduled based on market hours
    if (this.config.enableMarketHoursCheck && !this.isMarketHours(baseTime)) {
      const nextMarketOpen = this.getNextMarketOpen(baseTime);
      this.scheduleSymbolUpdate(symbol, nextMarketOpen);
      return;
    }

    const updateId = `${symbol}_${Date.now()}`;
    const scheduledTime = new Date(baseTime.getTime() + this.config.updateIntervalMs);

    const scheduledUpdate: ScheduledUpdate = {
      id: updateId,
      symbol,
      scheduledTime,
      status: 'pending',
      retryCount: 0
    };

    this.scheduledUpdates.set(updateId, scheduledUpdate);

    const timer = setTimeout(() => {
      this.executeUpdate(updateId);
    }, this.config.updateIntervalMs);

    this.updateTimers.set(updateId, timer);
  }

  /**
   * Execute a scheduled update
   */
  private async executeUpdate(updateId: string): Promise<void> {
    const update = this.scheduledUpdates.get(updateId);
    if (!update) {
      console.warn(`Update ${updateId} not found`);
      return;
    }

    update.status = 'running';
    const startTime = Date.now();

    try {
      console.log(`Executing volatility update for ${update.symbol}`);
      
      // Fetch required data
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [priceData, volatilityData, vixData] = await Promise.all([
        this.dataService.getHistoricalPrices(update.symbol, startDate, endDate),
        this.dataService.getVolatilityData(update.symbol, startDate, endDate),
        this.dataService.getVIXData(startDate, endDate)
      ]);

      // Get current IV (use latest from volatility data)
      const currentIV = volatilityData[volatilityData.length - 1]?.impliedVolatility || 0.25;

      // Calculate comprehensive volatility
      const result = this.calculationEngine.calculateComprehensiveVolatility(
        update.symbol,
        priceData,
        volatilityData,
        vixData,
        currentIV
      );

      update.result = result;
      update.status = 'completed';

      // Update statistics
      const updateTime = Date.now() - startTime;
      this.updateStats(true, updateTime);

      // Notify callbacks
      this.notifyUpdateCallbacks(update.symbol, result);

      console.log(`Volatility update completed for ${update.symbol} in ${updateTime}ms`);

    } catch (error) {
      console.error(`Volatility update failed for ${update.symbol}:`, error);
      
      update.error = error instanceof Error ? error.message : 'Unknown error';
      update.retryCount++;

      if (update.retryCount < this.config.maxRetries) {
        console.log(`Retrying update for ${update.symbol} (attempt ${update.retryCount + 1}/${this.config.maxRetries})`);
        
        // Schedule retry
        setTimeout(() => {
          this.executeUpdate(updateId);
        }, this.config.retryDelayMs);
      } else {
        update.status = 'failed';
        this.updateStats(false, Date.now() - startTime);
        this.notifyErrorCallbacks(update.symbol, error instanceof Error ? error : new Error('Unknown error'));
      }
    }

    // Schedule next update if service is still running
    if (this.isRunning && update.status === 'completed') {
      this.scheduleSymbolUpdate(update.symbol);
    }

    // Clean up completed/failed updates
    if (update.status === 'completed' || update.status === 'failed') {
      this.updateTimers.delete(updateId);
      // Keep update in scheduledUpdates for history (could implement cleanup later)
    }
  }

  /**
   * Start real-time update monitoring
   */
  private startRealTimeUpdates(): void {
    // This would typically connect to WebSocket feeds or polling mechanisms
    // For now, we'll implement a simplified version that triggers more frequent updates during market hours
    
    const checkRealTimeUpdates = () => {
      if (!this.isRunning) return;

      if (this.isMarketHours()) {
        // During market hours, trigger updates more frequently
        const highPrioritySymbols = ['SPY', 'QQQ']; // Major indices
        
        for (const symbol of highPrioritySymbols) {
          if (this.config.symbols.includes(symbol)) {
            // Trigger immediate update if last update was more than 5 minutes ago
            const lastUpdate = this.getLastUpdateTime(symbol);
            if (!lastUpdate || Date.now() - lastUpdate.getTime() > 5 * 60 * 1000) {
              this.triggerImmediateUpdate(symbol);
            }
          }
        }
      }

      // Schedule next real-time check
      setTimeout(checkRealTimeUpdates, 60000); // Check every minute
    };

    checkRealTimeUpdates();
  }

  /**
   * Trigger an immediate update for a symbol
   */
  public triggerImmediateUpdate(symbol: string): void {
    if (!this.config.symbols.includes(symbol)) {
      console.warn(`Symbol ${symbol} not in configured symbols list`);
      return;
    }

    const updateId = `${symbol}_immediate_${Date.now()}`;
    const scheduledUpdate: ScheduledUpdate = {
      id: updateId,
      symbol,
      scheduledTime: new Date(),
      status: 'pending',
      retryCount: 0
    };

    this.scheduledUpdates.set(updateId, scheduledUpdate);
    this.executeUpdate(updateId);
  }

  /**
   * Check if current time is within market hours (simplified - US market hours)
   */
  private isMarketHours(time: Date = new Date()): boolean {
    if (!this.config.enableMarketHoursCheck) return true;

    const day = time.getDay();
    const hour = time.getHours();
    
    // Weekend check
    if (day === 0 || day === 6) return false;
    
    // Market hours: 9:30 AM - 4:00 PM EST (simplified)
    return hour >= 9 && hour < 16;
  }

  /**
   * Get the next market open time
   */
  private getNextMarketOpen(from: Date): Date {
    const nextOpen = new Date(from);
    
    // If weekend, go to Monday
    if (nextOpen.getDay() === 0) { // Sunday
      nextOpen.setDate(nextOpen.getDate() + 1);
    } else if (nextOpen.getDay() === 6) { // Saturday
      nextOpen.setDate(nextOpen.getDate() + 2);
    } else if (nextOpen.getHours() >= 16) { // After market close
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    nextOpen.setHours(9, 30, 0, 0); // 9:30 AM
    return nextOpen;
  }

  /**
   * Get last update time for a symbol
   */
  private getLastUpdateTime(symbol: string): Date | null {
    const updates = Array.from(this.scheduledUpdates.values())
      .filter(update => update.symbol === symbol && update.status === 'completed')
      .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());
    
    return updates.length > 0 ? updates[0].scheduledTime : null;
  }

  /**
   * Update service statistics
   */
  private updateStats(success: boolean, updateTimeMs: number): void {
    this.stats.totalUpdates++;
    
    if (success) {
      this.stats.successfulUpdates++;
    } else {
      this.stats.failedUpdates++;
    }

    // Update average update time
    this.stats.averageUpdateTimeMs = (
      (this.stats.averageUpdateTimeMs * (this.stats.totalUpdates - 1)) + updateTimeMs
    ) / this.stats.totalUpdates;

    this.stats.lastUpdateTime = new Date();
  }

  /**
   * Register callback for successful updates
   */
  public onUpdate(callback: UpdateCallback): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Register callback for update errors
   */
  public onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Notify update callbacks
   */
  private notifyUpdateCallbacks(symbol: string, result: VolatilityCalculationResult): void {
    for (const callback of this.updateCallbacks) {
      try {
        callback(symbol, result);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    }
  }

  /**
   * Notify error callbacks
   */
  private notifyErrorCallbacks(symbol: string, error: Error): void {
    for (const callback of this.errorCallbacks) {
      try {
        callback(symbol, error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    }
  }

  /**
   * Add symbols to the scheduler
   */
  public addSymbols(symbols: string[]): void {
    for (const symbol of symbols) {
      if (!this.config.symbols.includes(symbol)) {
        this.config.symbols.push(symbol);
        
        if (this.isRunning) {
          this.scheduleSymbolUpdate(symbol);
        }
      }
    }
    
    this.stats.activeSymbols = this.config.symbols.length;
  }

  /**
   * Remove symbols from the scheduler
   */
  public removeSymbols(symbols: string[]): void {
    for (const symbol of symbols) {
      const index = this.config.symbols.indexOf(symbol);
      if (index > -1) {
        this.config.symbols.splice(index, 1);
        
        // Cancel pending updates for this symbol
        Array.from(this.scheduledUpdates.entries()).forEach(([updateId, update]) => {
          if (update.symbol === symbol && update.status === 'pending') {
            const timer = this.updateTimers.get(updateId);
            if (timer) {
              clearTimeout(timer);
              this.updateTimers.delete(updateId);
            }
            this.scheduledUpdates.delete(updateId);
          }
        });
      }
    }
    
    this.stats.activeSymbols = this.config.symbols.length;
  }

  /**
   * Get service statistics
   */
  public getStats(): SchedulerStats {
    return { ...this.stats };
  }

  /**
   * Get current scheduled updates
   */
  public getScheduledUpdates(): ScheduledUpdate[] {
    return Array.from(this.scheduledUpdates.values());
  }

  /**
   * Update scheduler configuration
   */
  public updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // If running and interval changed, restart scheduling
    if (this.isRunning && newConfig.updateIntervalMs) {
      this.stop();
      this.start();
    }
  }

  /**
   * Check service health
   */
  public getHealthStatus(): {
    isRunning: boolean;
    activeUpdates: number;
    failureRate: number;
    lastErrorTime: Date | null;
  } {
    const failureRate = this.stats.totalUpdates > 0 
      ? this.stats.failedUpdates / this.stats.totalUpdates 
      : 0;

    const activeUpdates = Array.from(this.scheduledUpdates.values())
      .filter(update => update.status === 'running' || update.status === 'pending').length;

    // Get last error time
    const failedUpdates = Array.from(this.scheduledUpdates.values())
      .filter(update => update.status === 'failed')
      .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());

    const lastErrorTime = failedUpdates.length > 0 ? failedUpdates[0].scheduledTime : null;

    return {
      isRunning: this.isRunning,
      activeUpdates,
      failureRate,
      lastErrorTime
    };
  }
}

export default VolatilitySchedulingService; 