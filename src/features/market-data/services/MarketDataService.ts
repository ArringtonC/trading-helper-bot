/**
 * Market Data Service
 * 
 * Core service for S&P 500 market data and news management.
 * Integrates with existing MonitoringService and database infrastructure.
 * 
 * Features:
 * - S&P 500 price data synchronization
 * - Market news aggregation and filtering
 * - Real-time data updates
 * - Performance monitoring and alerting
 * - Data validation and consistency checks
 * - Event-driven architecture for service communication
 */

import { EventEmitter } from 'events';
import { MonitoringService } from '../../../shared/services/MonitoringService';
import { 
  insertSP500Prices, 
  getSP500Prices, 
  insertMarketNews, 
  getMarketNews,
  SP500PriceData,
  MarketNewsData 
} from '../../../shared/services/DatabaseService';

export interface MarketDataConfiguration {
  priceUpdateIntervalMs: number;
  newsUpdateIntervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  enableRealTimeUpdates: boolean;
  enableBatchUpdates: boolean;
  batchSizeLimit: number;
  dataSources: string[];
  cacheTimeoutMs: number;
  defaultDateRange: number; // days
}

export interface MarketDataResult {
  source: string;
  success: boolean;
  syncedAt: Date;
  duration: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
  warnings: string[];
  dataType: 'sp500_prices' | 'market_news';
}

export interface MarketDataState {
  isRunning: boolean;
  lastPriceUpdate: Date | null;
  lastNewsUpdate: Date | null;
  nextScheduledPriceUpdate: Date | null;
  nextScheduledNewsUpdate: Date | null;
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  currentOperations: Map<string, MarketDataOperation>;
}

export interface MarketDataOperation {
  id: string;
  source: string;
  type: 'sp500_prices' | 'market_news' | 'full_sync';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  startTime: Date;
  endTime?: Date;
  retryCount: number;
  error?: string;
  progress?: number;
}

export interface PriceDataRequest {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface NewsDataRequest {
  startDate?: string;
  endDate?: string;
  category?: 'fed_policy' | 'tariff' | 'general';
  minRelevanceScore?: number;
  limit?: number;
}

export class MarketDataService extends EventEmitter {
  private monitoring: MonitoringService;
  private config: MarketDataConfiguration;
  private state: MarketDataState;
  private priceUpdateTimer: NodeJS.Timeout | null = null;
  private newsUpdateTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private operationCounter: number = 0;
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();

  constructor(monitoring: MonitoringService, config?: Partial<MarketDataConfiguration>) {
    super();
    this.monitoring = monitoring;
    this.config = {
      priceUpdateIntervalMs: 300000, // 5 minutes
      newsUpdateIntervalMs: 900000, // 15 minutes
      maxRetries: 3,
      retryDelayMs: 5000,
      timeoutMs: 30000,
      enableRealTimeUpdates: true,
      enableBatchUpdates: true,
      batchSizeLimit: 1000,
      dataSources: ['yahoo_finance', 'alpha_vantage', 'polygon'],
      cacheTimeoutMs: 300000, // 5 minutes
      defaultDateRange: 30, // 30 days
      ...config
    };

    this.state = {
      isRunning: false,
      lastPriceUpdate: null,
      lastNewsUpdate: null,
      nextScheduledPriceUpdate: null,
      nextScheduledNewsUpdate: null,
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      currentOperations: new Map()
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the market data service
   */
  public async initialize(): Promise<void> {
    try {
      console.log('MarketDataService: Initializing market data service...');
      const span = this.monitoring.startSpan('market_data_service_initialize');

      // Validate data sources
      await this.validateDataSources();

      // Register service health checks
      this.monitoring.registerHealthCheck('market_data_service', async () => {
        return {
          status: this.state.isRunning ? 'healthy' : 'degraded',
          component: 'market_data_service',
          timestamp: Date.now(),
          details: {
            lastPriceUpdate: this.state.lastPriceUpdate?.toISOString(),
            lastNewsUpdate: this.state.lastNewsUpdate?.toISOString(),
            totalOperations: this.state.currentOperations.size,
            cacheSize: this.cache.size
          }
        };
      });

      // Register default metrics
      this.registerDefaultMetrics();

      this.isInitialized = true;
      span?.setStatus({ code: 0, message: 'Initialized successfully' });
      span?.finish();

      this.emit('service:initialized', {
        dataSources: this.config.dataSources,
        config: this.config
      });

      console.log('MarketDataService: Initialization complete.');
    } catch (error) {
      console.error('MarketDataService: Initialization failed:', error);
      this.monitoring.recordMetric('market_data_errors_total', 1, { 
        error_type: 'initialization' 
      });
      throw error;
    }
  }

  /**
   * Start the market data service
   */
  public async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('MarketDataService: Service not initialized. Call initialize() first.');
    }

    if (this.state.isRunning) {
      console.warn('MarketDataService: Service is already running');
      return;
    }

    console.log('MarketDataService: Starting market data service...');
    this.state.isRunning = true;

    // Schedule initial updates
    if (this.config.enableBatchUpdates) {
      await this.scheduleNextPriceUpdate();
      await this.scheduleNextNewsUpdate();
    }

    // Start real-time updates if enabled
    if (this.config.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }

    this.emit('service:started');
    console.log('MarketDataService: Service started successfully');
  }

  /**
   * Stop the market data service
   */
  public async stop(): Promise<void> {
    if (!this.state.isRunning) {
      console.warn('MarketDataService: Service is not running');
      return;
    }

    console.log('MarketDataService: Stopping market data service...');
    this.state.isRunning = false;

    // Clear timers
    if (this.priceUpdateTimer) {
      clearTimeout(this.priceUpdateTimer);
      this.priceUpdateTimer = null;
    }
    if (this.newsUpdateTimer) {
      clearTimeout(this.newsUpdateTimer);
      this.newsUpdateTimer = null;
    }

    // Wait for active operations to complete
    await this.waitForActiveOperations();

    this.emit('service:stopped');
    console.log('MarketDataService: Service stopped successfully');
  }

  /**
   * Get S&P 500 price data
   */
  public async getSP500Data(request: PriceDataRequest = {}): Promise<SP500PriceData[]> {
    const span = this.monitoring.startSpan('get_sp500_data');
    const cacheKey = `sp500_prices_${JSON.stringify(request)}`;

    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        span?.setStatus({ code: 0, message: 'Retrieved from cache' });
        return cached;
      }

      // Set default date range if not provided
      const endDate = request.endDate || new Date().toISOString().split('T')[0];
      const startDate = request.startDate || this.getDefaultStartDate(endDate);

      const data = await getSP500Prices(startDate, endDate);
      
      // Cache the result
      this.setCachedData(cacheKey, data);

      this.monitoring.recordMetric('market_data_requests_total', 1, {
        type: 'sp500_prices',
        source: 'database'
      });

      span?.setStatus({ code: 0, message: 'Retrieved successfully' });
      this.emit('data:retrieved', { 
        type: 'sp500_prices', 
        count: data.length, 
        dateRange: { startDate, endDate } 
      });

      return data;
    } catch (error) {
      span?.setStatus({ code: 1, message: `Failed: ${error}` });
      this.monitoring.recordMetric('market_data_errors_total', 1, {
        type: 'sp500_prices',
        error_type: 'retrieval'
      });
      throw error;
    } finally {
      span?.finish();
    }
  }

  /**
   * Get market news data
   */
  public async getMarketNewsData(request: NewsDataRequest = {}): Promise<MarketNewsData[]> {
    const span = this.monitoring.startSpan('get_market_news_data');
    const cacheKey = `market_news_${JSON.stringify(request)}`;

    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        span?.setStatus({ code: 0, message: 'Retrieved from cache' });
        return cached;
      }

      // Set default date range if not provided
      const endDate = request.endDate || new Date().toISOString().split('T')[0];
      const startDate = request.startDate || this.getDefaultStartDate(endDate);

      const data = await getMarketNews(
        startDate, 
        endDate, 
        request.category, 
        request.minRelevanceScore
      );
      
      // Apply limit if specified
      const limitedData = request.limit ? data.slice(0, request.limit) : data;
      
      // Cache the result
      this.setCachedData(cacheKey, limitedData);

      this.monitoring.recordMetric('market_data_requests_total', 1, {
        type: 'market_news',
        source: 'database',
        category: request.category || 'all'
      });

      span?.setStatus({ code: 0, message: 'Retrieved successfully' });
      this.emit('data:retrieved', { 
        type: 'market_news', 
        count: limitedData.length, 
        dateRange: { startDate, endDate },
        category: request.category 
      });

      return limitedData;
    } catch (error) {
      span?.setStatus({ code: 1, message: `Failed: ${error}` });
      this.monitoring.recordMetric('market_data_errors_total', 1, {
        type: 'market_news',
        error_type: 'retrieval'
      });
      throw error;
    } finally {
      span?.finish();
    }
  }

  /**
   * Sync S&P 500 price data from external sources
   */
  public async syncSP500Data(): Promise<MarketDataResult> {
    const operation = this.createOperation('external_api', 'sp500_prices');
    const span = this.monitoring.startSpan('sync_sp500_data');
    const startTime = Date.now();

    try {
      operation.status = 'running';
      this.state.currentOperations.set(operation.id, operation);

      console.log('MarketDataService: Syncing S&P 500 price data...');

      // Mock external API call - in production, would call Yahoo Finance, Alpha Vantage, etc.
      const mockPriceData: SP500PriceData[] = this.generateMockPriceData();

      // Insert into database
      const insertResult = await insertSP500Prices(mockPriceData);

      operation.status = 'completed';
      operation.endTime = new Date();
      this.state.lastPriceUpdate = new Date();
      this.state.successfulUpdates++;

      const result: MarketDataResult = {
        source: 'external_api',
        success: true,
        syncedAt: new Date(),
        duration: Date.now() - startTime,
        recordsUpdated: insertResult.successCount,
        recordsSkipped: insertResult.errors.length,
        errors: insertResult.errors,
        warnings: [],
        dataType: 'sp500_prices'
      };

      // Clear cache
      this.clearCacheByPattern('sp500_prices_*');

      this.monitoring.recordMetric('market_data_sync_total', 1, {
        type: 'sp500_prices',
        status: 'success'
      });

      span?.setStatus({ code: 0, message: 'Sync completed successfully' });
      this.emit('sync:completed', result);
      this.emit('sp500:data:updated', { count: insertResult.successCount, timestamp: new Date() });

      console.log(`MarketDataService: S&P 500 sync completed. Updated ${insertResult.successCount} records.`);
      return result;

    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : String(error);
      this.state.failedUpdates++;

      span?.setStatus({ code: 1, message: `Sync failed: ${error}` });
      this.monitoring.recordMetric('market_data_sync_total', 1, {
        type: 'sp500_prices',
        status: 'failed'
      });

      this.emit('sync:failed', { 
        type: 'sp500_prices', 
        error: operation.error, 
        operation: operation.id 
      });

      throw error;
    } finally {
      this.state.currentOperations.delete(operation.id);
      span?.finish();
    }
  }

  /**
   * Sync market news from external sources
   */
  public async syncMarketNews(): Promise<MarketDataResult> {
    const operation = this.createOperation('external_api', 'market_news');
    const span = this.monitoring.startSpan('sync_market_news');
    const startTime = Date.now();

    try {
      operation.status = 'running';
      this.state.currentOperations.set(operation.id, operation);

      console.log('MarketDataService: Syncing market news...');

      // Mock external API call - in production, would call news APIs
      const mockNewsData: MarketNewsData[] = this.generateMockNewsData();

      // Insert into database
      const insertResult = await insertMarketNews(mockNewsData);

      operation.status = 'completed';
      operation.endTime = new Date();
      this.state.lastNewsUpdate = new Date();
      this.state.successfulUpdates++;

      const result: MarketDataResult = {
        source: 'external_api',
        success: true,
        syncedAt: new Date(),
        duration: Date.now() - startTime,
        recordsUpdated: insertResult.successCount,
        recordsSkipped: insertResult.errors.length,
        errors: insertResult.errors,
        warnings: [],
        dataType: 'market_news'
      };

      // Clear cache
      this.clearCacheByPattern('market_news_*');

      this.monitoring.recordMetric('market_data_sync_total', 1, {
        type: 'market_news',
        status: 'success'
      });

      span?.setStatus({ code: 0, message: 'Sync completed successfully' });
      this.emit('sync:completed', result);
      this.emit('news:data:updated', { count: insertResult.successCount, timestamp: new Date() });

      console.log(`MarketDataService: Market news sync completed. Updated ${insertResult.successCount} records.`);
      return result;

    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : String(error);
      this.state.failedUpdates++;

      span?.setStatus({ code: 1, message: `Sync failed: ${error}` });
      this.monitoring.recordMetric('market_data_sync_total', 1, {
        type: 'market_news',
        status: 'failed'
      });

      this.emit('sync:failed', { 
        type: 'market_news', 
        error: operation.error, 
        operation: operation.id 
      });

      throw error;
    } finally {
      this.state.currentOperations.delete(operation.id);
      span?.finish();
    }
  }

  /**
   * Perform full synchronization of all market data
   */
  public async syncAll(): Promise<Map<string, MarketDataResult>> {
    const span = this.monitoring.startSpan('sync_all_market_data');
    const results = new Map<string, MarketDataResult>();

    try {
      console.log('MarketDataService: Starting full market data synchronization...');

      // Sync S&P 500 data
      try {
        const sp500Result = await this.syncSP500Data();
        results.set('sp500_prices', sp500Result);
      } catch (error) {
        console.error('MarketDataService: S&P 500 sync failed:', error);
      }

      // Sync market news
      try {
        const newsResult = await this.syncMarketNews();
        results.set('market_news', newsResult);
      } catch (error) {
        console.error('MarketDataService: Market news sync failed:', error);
      }

      span?.setStatus({ code: 0, message: 'Full sync completed' });
      this.emit('sync:all:completed', results);

      console.log(`MarketDataService: Full sync completed. ${results.size} data types updated.`);
      return results;

    } catch (error) {
      span?.setStatus({ code: 1, message: `Full sync failed: ${error}` });
      throw error;
    } finally {
      span?.finish();
    }
  }

  /**
   * Get current service state
   */
  public getState(): MarketDataState {
    return { ...this.state };
  }

  /**
   * Get service statistics
   */
  public getStatistics() {
    return {
      state: this.getState(),
      cacheSize: this.cache.size,
      uptime: this.isInitialized ? Date.now() - this.state.totalUpdates : 0,
      successRate: this.state.totalUpdates > 0 
        ? (this.state.successfulUpdates / this.state.totalUpdates) * 100 
        : 0
    };
  }

  /**
   * Update service configuration
   */
  public updateConfiguration(updates: Partial<MarketDataConfiguration>): void {
    this.config = { ...this.config, ...updates };
    console.log('MarketDataService: Configuration updated:', updates);
    this.emit('config:updated', this.config);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('data:retrieved', (event) => {
      this.monitoring.recordMetric('market_data_retrievals_total', 1, {
        type: event.type,
        source: 'cache_or_database'
      });
    });

    this.on('sync:completed', (result) => {
      this.monitoring.recordMetric('market_data_sync_duration_ms', result.duration, {
        type: result.dataType
      });
    });

    this.on('error', (error) => {
      console.error('MarketDataService: Error occurred:', error);
      this.monitoring.recordMetric('market_data_errors_total', 1, {
        error_type: 'general'
      });
    });
  }

  /**
   * Register default metrics
   */
  private registerDefaultMetrics(): void {
    const metrics = [
      {
        name: 'market_data_requests_total',
        description: 'Total number of market data requests',
        type: 'counter' as const,
        labels: ['type', 'source']
      },
      {
        name: 'market_data_sync_total',
        description: 'Total number of market data synchronizations',
        type: 'counter' as const,
        labels: ['type', 'status']
      },
      {
        name: 'market_data_sync_duration_ms',
        description: 'Duration of market data synchronization operations',
        type: 'histogram' as const,
        labels: ['type']
      },
      {
        name: 'market_data_errors_total',
        description: 'Total number of market data errors',
        type: 'counter' as const,
        labels: ['error_type']
      },
      {
        name: 'market_data_cache_hits_total',
        description: 'Total number of cache hits',
        type: 'counter' as const,
        labels: ['type']
      }
    ];

    metrics.forEach(metric => {
      this.monitoring.registerMetric(metric);
    });
  }

  /**
   * Validate configured data sources
   */
  private async validateDataSources(): Promise<void> {
    console.log('MarketDataService: Validating data sources:', this.config.dataSources);
    // In production, would test connectivity to external APIs
    // For now, just log the configured sources
  }

  /**
   * Schedule next price update
   */
  private async scheduleNextPriceUpdate(): Promise<void> {
    const nextUpdate = new Date(Date.now() + this.config.priceUpdateIntervalMs);
    this.state.nextScheduledPriceUpdate = nextUpdate;

    this.priceUpdateTimer = setTimeout(async () => {
      try {
        await this.syncSP500Data();
      } catch (error) {
        console.error('MarketDataService: Scheduled price update failed:', error);
      }
      
      // Schedule next update
      if (this.state.isRunning) {
        await this.scheduleNextPriceUpdate();
      }
    }, this.config.priceUpdateIntervalMs);

    console.log(`MarketDataService: Next price update scheduled for ${nextUpdate.toISOString()}`);
  }

  /**
   * Schedule next news update
   */
  private async scheduleNextNewsUpdate(): Promise<void> {
    const nextUpdate = new Date(Date.now() + this.config.newsUpdateIntervalMs);
    this.state.nextScheduledNewsUpdate = nextUpdate;

    this.newsUpdateTimer = setTimeout(async () => {
      try {
        await this.syncMarketNews();
      } catch (error) {
        console.error('MarketDataService: Scheduled news update failed:', error);
      }
      
      // Schedule next update
      if (this.state.isRunning) {
        await this.scheduleNextNewsUpdate();
      }
    }, this.config.newsUpdateIntervalMs);

    console.log(`MarketDataService: Next news update scheduled for ${nextUpdate.toISOString()}`);
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    console.log('MarketDataService: Starting real-time update monitoring...');
    // In production, this would set up WebSocket connections or event listeners
    // for real-time market data feeds
    this.emit('realtime:started');
  }

  /**
   * Wait for active operations to complete
   */
  private async waitForActiveOperations(timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (this.state.currentOperations.size > 0 && (Date.now() - startTime) < timeoutMs) {
      console.log(`MarketDataService: Waiting for ${this.state.currentOperations.size} operations to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.state.currentOperations.size > 0) {
      console.warn(`MarketDataService: ${this.state.currentOperations.size} operations still active after timeout`);
    }
  }

  /**
   * Create a new operation
   */
  private createOperation(source: string, type: MarketDataOperation['type']): MarketDataOperation {
    const id = `${type}_${Date.now()}_${++this.operationCounter}`;
    return {
      id,
      source,
      type,
      status: 'pending',
      startTime: new Date(),
      retryCount: 0
    };
  }

  /**
   * Get default start date based on configured range
   */
  private getDefaultStartDate(endDate: string): string {
    const end = new Date(endDate);
    const start = new Date(end.getTime() - (this.config.defaultDateRange * 24 * 60 * 60 * 1000));
    return start.toISOString().split('T')[0];
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.config.cacheTimeoutMs) {
      this.monitoring.recordMetric('market_data_cache_hits_total', 1, {
        type: key.split('_')[0]
      });
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached data
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: new Date() });
  }

  /**
   * Clear cache by pattern
   */
  private clearCacheByPattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];
    
    Array.from(this.cache.entries()).forEach(([key]) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`MarketDataService: Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
  }

  /**
   * Generate mock S&P 500 price data for testing
   */
  private generateMockPriceData(): SP500PriceData[] {
    const today = new Date();
    const mockData: SP500PriceData[] = [];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const basePrice = 5800 + (Math.random() - 0.5) * 100;
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        open: basePrice + (Math.random() - 0.5) * 20,
        high: basePrice + Math.random() * 30,
        low: basePrice - Math.random() * 30,
        close: basePrice + (Math.random() - 0.5) * 25,
        volume: Math.floor(3000000000 + Math.random() * 1000000000),
        adjusted_close: basePrice + (Math.random() - 0.5) * 25
      });
    }
    
    return mockData;
  }

  /**
   * Generate mock market news data for testing
   */
  private generateMockNewsData(): MarketNewsData[] {
    const today = new Date();
    const categories = ['fed_policy', 'tariff', 'general'] as const;
    const mockData: MarketNewsData[] = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const category = categories[i % categories.length];
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        title: `Mock ${category} News ${i + 1}`,
        description: `This is a mock news article about ${category} for testing purposes.`,
        source: 'Mock News API',
        category,
        relevance_score: Math.floor(Math.random() * 6) + 5, // 5-10
        keywords: JSON.stringify([category, 'market', 'economy']),
        impact_type: Math.random() > 0.5 ? 'positive' : 'negative',
        url: `https://mock-news.com/article-${i + 1}`,
        published_at: date.toISOString()
      });
    }
    
    return mockData;
  }
} 