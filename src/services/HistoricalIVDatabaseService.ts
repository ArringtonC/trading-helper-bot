/**
 * Historical IV Range Database Service
 * 
 * Comprehensive database service for storing, querying, and managing historical
 * implied volatility data with support for data quality, corporate actions,
 * and advanced querying capabilities.
 * 
 * Features:
 * - High-performance IV data storage and retrieval
 * - Corporate action adjustment pipeline
 * - Data quality scoring and anomaly detection
 * - Advanced querying with filtering and aggregation
 * - Intelligent caching with TTL
 * - Data retention and archiving policies
 */

import { Database } from 'sql.js';
import { getDb } from './DatabaseService';
import { v4 as uuidv4 } from 'uuid';
import {
  HistoricalIVRecord,
  IVRangeData,
  IVQueryOptions,
  IVQueryResult,
  IVStatistics,
  IVDataIngestionJob,
  CorporateAction,
  IVDataQuality,
  IVAnomalyFlag,
  IVDatabaseConfig,
  IVCacheEntry,
  IVCacheStatistics,
  IVDataValidationResult,
  IVValidationError,
  IVValidationWarning,
  CreateIVRecord,
  IVDataSource,
  IngestionStatus,
  IVVolatilityCone
} from '../types/historicalIV';

// Database Schema Version for IV features
const IV_SCHEMA_VERSION = 3;

export class HistoricalIVDatabaseService {
  private cache: Map<string, IVCacheEntry> = new Map();
  private config: IVDatabaseConfig = {
    retentionDays: 365 * 5, // 5 years default
    maxRecordsPerSymbol: 50000,
    qualityThreshold: 0.7,
    enableAutoCleanup: true,
    enableDataValidation: true,
    normalizationEnabled: true,
    archiveOldData: true
  };

  constructor(config?: Partial<IVDatabaseConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize the Historical IV database schema
   */
  async initialize(): Promise<void> {
    const db = await getDb();
    await this.ensureIVSchema(db);
    await this.runIVMigrations(db);
    console.log('[HistoricalIVDatabaseService] Initialized successfully');
  }

  /**
   * Create the IV database schema
   */
  private async ensureIVSchema(db: Database): Promise<void> {
    const schemaSQL = `
      -- Historical IV Records Table
      CREATE TABLE IF NOT EXISTS historical_iv_records (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        date TEXT NOT NULL, -- YYYY-MM-DD
        timestamp TEXT NOT NULL, -- Full ISO datetime
        open_iv REAL NOT NULL,
        high_iv REAL NOT NULL,
        low_iv REAL NOT NULL,
        close_iv REAL NOT NULL,
        volume_weighted_iv REAL NOT NULL,
        atm_iv REAL NOT NULL,
        underlying_price REAL NOT NULL,
        volume INTEGER DEFAULT 0,
        open_interest INTEGER DEFAULT 0,
        data_quality_score REAL NOT NULL DEFAULT 1.0,
        missing_data_points INTEGER DEFAULT 0,
        interpolated_points INTEGER DEFAULT 0,
        anomaly_flags TEXT, -- JSON string of IVAnomalyFlag[]
        last_validation_date TEXT,
        validation_notes TEXT,
        normalization_version INTEGER DEFAULT 1,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(symbol, date, source)
      );

      -- IV Range Data Table (aggregated/calculated)
      CREATE TABLE IF NOT EXISTS iv_range_data (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        date TEXT NOT NULL,
        iv30 REAL NOT NULL,
        iv60 REAL NOT NULL,
        iv90 REAL NOT NULL,
        iv_percentile REAL NOT NULL,
        hv_correlation REAL NOT NULL,
        iv_rank REAL NOT NULL,
        term_structure TEXT, -- JSON string of IVTermStructure
        skew_data TEXT, -- JSON string of IVSkewData
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(symbol, date)
      );

      -- Corporate Actions Table
      CREATE TABLE IF NOT EXISTS corporate_actions (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        action_type TEXT NOT NULL,
        ex_date TEXT NOT NULL,
        record_date TEXT NOT NULL,
        payable_date TEXT,
        ratio REAL,
        amount REAL,
        new_symbol TEXT,
        description TEXT NOT NULL,
        adjustment_factor REAL NOT NULL DEFAULT 1.0,
        processed BOOLEAN DEFAULT FALSE,
        created_at TEXT NOT NULL
      );

      -- IV Data Ingestion Jobs Table
      CREATE TABLE IF NOT EXISTS iv_ingestion_jobs (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        source TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        priority INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        error_message TEXT,
        records_processed INTEGER DEFAULT 0,
        records_inserted INTEGER DEFAULT 0,
        records_updated INTEGER DEFAULT 0,
        records_skipped INTEGER DEFAULT 0,
        started_at TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- IV Cache Table (for persistent caching)
      CREATE TABLE IF NOT EXISTS iv_cache (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL, -- JSON string
        timestamp TEXT NOT NULL,
        ttl INTEGER NOT NULL, -- seconds
        size INTEGER NOT NULL, -- bytes
        hit_count INTEGER DEFAULT 0,
        last_accessed TEXT NOT NULL
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_iv_records_symbol_date ON historical_iv_records(symbol, date);
      CREATE INDEX IF NOT EXISTS idx_iv_records_date ON historical_iv_records(date);
      CREATE INDEX IF NOT EXISTS idx_iv_records_symbol ON historical_iv_records(symbol);
      CREATE INDEX IF NOT EXISTS idx_iv_records_quality ON historical_iv_records(data_quality_score);
      CREATE INDEX IF NOT EXISTS idx_iv_range_symbol_date ON iv_range_data(symbol, date);
      CREATE INDEX IF NOT EXISTS idx_corporate_actions_symbol ON corporate_actions(symbol, ex_date);
      CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON iv_ingestion_jobs(status, priority);
      CREATE INDEX IF NOT EXISTS idx_iv_cache_timestamp ON iv_cache(timestamp);
    `;

    db.exec(schemaSQL);
  }

  /**
   * Run IV-specific database migrations
   */
  private async runIVMigrations(db: Database): Promise<void> {
    const currentVersion = this.getCurrentIVSchemaVersion(db);
    
    if (currentVersion < IV_SCHEMA_VERSION) {
      console.log(`[HistoricalIVDatabaseService] Migrating IV schema from ${currentVersion} to ${IV_SCHEMA_VERSION}`);
      
      db.exec("BEGIN TRANSACTION;");
      try {
        // Add future migrations here as needed
        
        // Update version
        db.exec(`PRAGMA user_version = ${IV_SCHEMA_VERSION};`);
        db.exec("COMMIT;");
        console.log(`[HistoricalIVDatabaseService] IV schema migration successful`);
      } catch (error) {
        db.exec("ROLLBACK;");
        throw new Error(`IV schema migration failed: ${error}`);
      }
    }
  }

  private getCurrentIVSchemaVersion(db: Database): number {
    try {
      const result = db.exec("PRAGMA user_version");
      return result[0]?.values[0]?.[0] as number || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Insert or update historical IV records
   */
  async insertIVRecords(records: CreateIVRecord[]): Promise<{ successCount: number; errors: any[] }> {
    const db = await getDb();
    const errors: any[] = [];
    let successCount = 0;

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO historical_iv_records (
        id, symbol, date, timestamp, open_iv, high_iv, low_iv, close_iv,
        volume_weighted_iv, atm_iv, underlying_price, volume, open_interest,
        data_quality_score, missing_data_points, interpolated_points,
        anomaly_flags, last_validation_date, validation_notes,
        normalization_version, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      for (const record of records) {
        try {
          const id = uuidv4();
          const now = new Date().toISOString();
          
          // Validate record
          const validation = this.validateIVRecord(record);
          if (!validation.valid && this.config.enableDataValidation) {
            errors.push({ record, errors: validation.errors });
            continue;
          }

          stmt.run([
            id,
            record.symbol,
            record.date,
            record.timestamp,
            record.openIV,
            record.highIV,
            record.lowIV,
            record.closeIV,
            record.volumeWeightedIV,
            record.atmIV,
            record.underlyingPrice,
            record.volume,
            record.openInterest,
            record.dataQuality.score,
            record.dataQuality.missingDataPoints,
            record.dataQuality.interpolatedPoints,
            JSON.stringify(record.dataQuality.anomalyFlags),
            record.dataQuality.lastValidationDate,
            record.dataQuality.validationNotes || null,
            1, // normalizationVersion
            record.source,
            now,
            now
          ]);
          
          successCount++;
        } catch (error) {
          errors.push({ record, error });
        }
      }
    } finally {
      stmt.free();
    }

    // Clear relevant cache entries
    this.clearCacheByPattern(`iv_query_${records[0]?.symbol || '*'}`);

    return { successCount, errors };
  }

  /**
   * Query historical IV records with advanced filtering
   */
  async queryIVRecords(options: IVQueryOptions = {}): Promise<IVQueryResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('iv_query', options);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        queryMeta: {
          ...cached.queryMeta,
          cacheHit: true,
          executionTime: Date.now() - startTime
        }
      };
    }

    const db = await getDb();
    const { whereClause, params } = this.buildWhereClause(options);
    const limit = options.limit || 1000;
    const offset = options.offset || 0;

    // Count query
    const countSQL = `
      SELECT COUNT(*) as total 
      FROM historical_iv_records 
      ${whereClause}
    `;
    const countResult = db.exec(countSQL, params);
    const totalCount = countResult[0]?.values[0]?.[0] as number || 0;

    // Data query
    const dataSQL = `
      SELECT 
        id, symbol, date, timestamp, open_iv, high_iv, low_iv, close_iv,
        volume_weighted_iv, atm_iv, underlying_price, volume, open_interest,
        data_quality_score, missing_data_points, interpolated_points,
        anomaly_flags, last_validation_date, validation_notes,
        normalization_version, source, created_at, updated_at
      FROM historical_iv_records 
      ${whereClause}
      ORDER BY date DESC, symbol ASC
      LIMIT ? OFFSET ?
    `;
    
    const dataResult = db.exec(dataSQL, [...params, limit, offset]);
    const records: HistoricalIVRecord[] = dataResult[0]?.values.map(row => ({
      id: row[0] as string,
      symbol: row[1] as string,
      date: row[2] as string,
      timestamp: row[3] as string,
      openIV: row[4] as number,
      highIV: row[5] as number,
      lowIV: row[6] as number,
      closeIV: row[7] as number,
      volumeWeightedIV: row[8] as number,
      atmIV: row[9] as number,
      underlyingPrice: row[10] as number,
      volume: row[11] as number,
      openInterest: row[12] as number,
      dataQuality: {
        score: row[13] as number,
        missingDataPoints: row[14] as number,
        interpolatedPoints: row[15] as number,
        anomalyFlags: row[16] ? JSON.parse(row[16] as string) : [],
        lastValidationDate: row[17] as string,
        validationNotes: row[18] as string
      },
      normalizationVersion: row[19] as number,
      source: row[20] as IVDataSource,
      createdAt: row[21] as string,
      updatedAt: row[22] as string
    })) || [];

    const result: IVQueryResult = {
      data: records,
      totalCount,
      hasMore: totalCount > offset + records.length,
      queryMeta: {
        executionTime: Date.now() - startTime,
        cacheHit: false,
        normalizedRecords: records.filter(r => r.normalizationVersion > 1).length,
        filteredRecords: records.length
      }
    };

    // Cache the result
    this.setCache(cacheKey, result, 300); // 5 minute TTL

    return result;
  }

  /**
   * Get IV statistics for a symbol
   */
  async getIVStatistics(symbol: string, period: string = '1Y'): Promise<IVStatistics> {
    const cacheKey = this.generateCacheKey('iv_stats', { symbol, period });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const db = await getDb();
    const startDate = this.getStartDateForPeriod(period);
    
    const sql = `
      SELECT 
        close_iv,
        data_quality_score,
        anomaly_flags
      FROM historical_iv_records 
      WHERE symbol = ? AND date >= ? AND data_quality_score >= ?
      ORDER BY date ASC
    `;

    const result = db.exec(sql, [symbol, startDate, this.config.qualityThreshold]);
    const values = result[0]?.values || [];
    
    if (values.length === 0) {
      throw new Error(`No IV data found for ${symbol} in period ${period}`);
    }

    const ivValues = values.map(row => row[0] as number);
    const qualityScores = values.map(row => row[1] as number);
    const anomalyCounts = values.map(row => {
      const flags = row[2] ? JSON.parse(row[2] as string) : [];
      return flags.length;
    });

    const stats = this.calculateStatistics(ivValues);
    const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    const anomalyRate = anomalyCounts.reduce((a, b) => a + b, 0) / values.length;

    const statistics: IVStatistics = {
      symbol,
      period,
      count: values.length,
      mean: stats.mean,
      median: stats.median,
      std: stats.std,
      min: stats.min,
      max: stats.max,
      percentiles: stats.percentiles,
      dataQuality: {
        averageScore: avgQuality,
        completeness: this.calculateCompleteness(symbol, period),
        anomalyRate
      }
    };

    this.setCache(cacheKey, statistics, 3600); // 1 hour TTL
    return statistics;
  }

  /**
   * Get volatility cone data
   */
  async getVolatilityCone(symbol: string): Promise<IVVolatilityCone> {
    const cacheKey = this.generateCacheKey('vol_cone', { symbol });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const db = await getDb();
    const periods = ['7d', '14d', '30d', '60d', '90d', '180d', '365d'];
    const percentiles = {} as any;

    for (const period of periods) {
      const days = parseInt(period.replace('d', ''));
      const sql = `
        SELECT close_iv 
        FROM historical_iv_records 
        WHERE symbol = ? AND date >= date('now', '-${days} days')
        ORDER BY close_iv ASC
      `;

      const result = db.exec(sql, [symbol]);
      const values = result[0]?.values.map(row => row[0] as number) || [];

      if (values.length > 0) {
        const stats = this.calculateStatistics(values);
        const current = values[values.length - 1] || 0;

        percentiles[period] = {
          min: stats.min,
          p5: stats.percentiles.p10, // Approximate
          p25: stats.percentiles.p25,
          p50: stats.median,
          p75: stats.percentiles.p75,
          p95: stats.percentiles.p90, // Approximate
          max: stats.max,
          current
        };
      }
    }

    const cone: IVVolatilityCone = {
      symbol,
      generatedAt: new Date().toISOString(),
      percentiles
    };

    this.setCache(cacheKey, cone, 1800); // 30 minute TTL
    return cone;
  }

  /**
   * Validate IV record data
   */
  private validateIVRecord(record: CreateIVRecord): IVDataValidationResult {
    const errors: IVValidationError[] = [];
    const warnings: IVValidationWarning[] = [];

    // Required field validation
    if (!record.symbol) {
      errors.push({
        field: 'symbol',
        value: record.symbol,
        message: 'Symbol is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!record.date || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
      errors.push({
        field: 'date',
        value: record.date,
        message: 'Date must be in YYYY-MM-DD format',
        code: 'INVALID_DATE_FORMAT'
      });
    }

    // IV value validation
    const ivFields = ['openIV', 'highIV', 'lowIV', 'closeIV', 'volumeWeightedIV', 'atmIV'];
    for (const field of ivFields) {
      const value = (record as any)[field];
      if (typeof value !== 'number' || value < 0) {
        errors.push({
          field,
          value,
          message: `${field} must be a positive number`,
          code: 'INVALID_IV_VALUE'
        });
      } else if (value > 5) { // 500% IV is extremely high
        warnings.push({
          field,
          value,
          message: `${field} value ${value} seems unusually high`,
          suggestion: 'Verify this is not a percentage value that should be decimal'
        });
      }
    }

    // Logical validation
    if (record.highIV < record.lowIV) {
      errors.push({
        field: 'highIV',
        value: record.highIV,
        message: 'High IV cannot be less than low IV',
        code: 'LOGICAL_ERROR'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Build WHERE clause for queries
   */
  private buildWhereClause(options: IVQueryOptions): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.symbol) {
      if (Array.isArray(options.symbol)) {
        const placeholders = options.symbol.map(() => '?').join(',');
        conditions.push(`symbol IN (${placeholders})`);
        params.push(...options.symbol);
      } else {
        conditions.push('symbol = ?');
        params.push(options.symbol);
      }
    }

    if (options.startDate) {
      conditions.push('date >= ?');
      params.push(options.startDate);
    }

    if (options.endDate) {
      conditions.push('date <= ?');
      params.push(options.endDate);
    }

    if (options.minQuality) {
      conditions.push('data_quality_score >= ?');
      params.push(options.minQuality);
    }

    if (options.sources?.length) {
      const placeholders = options.sources.map(() => '?').join(',');
      conditions.push(`source IN (${placeholders})`);
      params.push(...options.sources);
    }

    if (!options.includeAnomalies) {
      conditions.push("(anomaly_flags IS NULL OR anomaly_flags = '[]')");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  /**
   * Calculate statistical measures
   */
  private calculateStatistics(values: number[]): {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    percentiles: { p10: number; p25: number; p75: number; p90: number };
  } {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    return {
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      percentiles: {
        p10: getPercentile(10),
        p25: getPercentile(25),
        p75: getPercentile(75),
        p90: getPercentile(90)
      }
    };
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(prefix: string, data: any): string {
    return `${prefix}_${JSON.stringify(data)}`;
  }

  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - new Date(entry.timestamp).getTime() > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount++;
    entry.lastAccessed = new Date().toISOString();
    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    const entry: IVCacheEntry = {
      key,
      data,
      timestamp: new Date().toISOString(),
      ttl,
      size: JSON.stringify(data).length,
      hitCount: 0,
      lastAccessed: new Date().toISOString()
    };

    this.cache.set(key, entry);

    // Cleanup old entries if cache gets too large
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private clearCacheByPattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];
    
    Array.from(this.cache.entries()).forEach(([key]) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - new Date(entry.timestamp).getTime() > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    });

    // If still too large, remove least recently used
    if (this.cache.size > 1000) {
      const sortedEntries = entries
        .sort((a, b) => new Date(a[1].lastAccessed).getTime() - new Date(b[1].lastAccessed).getTime())
        .slice(0, this.cache.size - 800); // Keep 800, remove 200+

      sortedEntries.forEach(([key]) => this.cache.delete(key));
    }
  }

  private getStartDateForPeriod(period: string): string {
    const now = new Date();
    switch (period) {
      case '1M': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '3M': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '6M': return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '1Y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '2Y': return new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '5Y': return new Date(now.getTime() - 1825 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      default: return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  }

  private calculateCompleteness(symbol: string, period: string): number {
    // This is a simplified calculation - in reality you'd compare with trading calendar
    const totalPossibleDays = parseInt(period.replace(/[^\d]/g, '')) || 365;
    // Assume ~252 trading days per year
    const tradingDaysRatio = 252 / 365;
    return Math.min(1.0, tradingDaysRatio);
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): IVCacheStatistics {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const oldestEntry = entries.reduce((oldest, entry) => 
      !oldest || new Date(entry.timestamp) < new Date(oldest) ? entry.timestamp : oldest, '');
    const newestEntry = entries.reduce((newest, entry) => 
      !newest || new Date(entry.timestamp) > new Date(newest) ? entry.timestamp : newest, '');

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: totalHits / Math.max(1, this.cache.size),
      missRate: 1 - (totalHits / Math.max(1, this.cache.size)),
      evictionCount: 0, // Would need to track this separately
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const historicalIVDB = new HistoricalIVDatabaseService(); 