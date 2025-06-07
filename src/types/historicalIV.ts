/**
 * Historical Implied Volatility (IV) Database Types
 * 
 * Comprehensive type definitions for storing and querying historical IV data,
 * including support for corporate actions, data quality metrics, and normalization.
 */

// Core IV Data Types
export interface HistoricalIVRecord {
  id: string;
  symbol: string;
  date: string; // YYYY-MM-DD format
  timestamp: string; // Full ISO datetime
  openIV: number;
  highIV: number;
  lowIV: number;
  closeIV: number;
  volumeWeightedIV: number;
  atmIV: number; // At-the-money IV
  underlyingPrice: number;
  volume: number;
  openInterest: number;
  dataQuality: IVDataQuality;
  normalizationVersion: number;
  source: IVDataSource;
  createdAt: string;
  updatedAt: string;
}

export interface IVRangeData {
  symbol: string;
  date: string;
  iv30: number; // 30-day IV
  iv60: number; // 60-day IV 
  iv90: number; // 90-day IV
  ivPercentile: number; // IV percentile (0-1)
  hvCorrelation: number; // Correlation with Historical Volatility
  ivRank: number; // IV rank (0-1)
  termStructure: IVTermStructure;
  skew: IVSkewData;
}

export interface IVTermStructure {
  iv7: number;
  iv14: number;
  iv30: number;
  iv60: number;
  iv90: number;
  iv180: number;
  iv365: number;
  slope: number; // Linear fit slope
  curvature: number; // Second derivative measure
}

export interface IVSkewData {
  atmIV: number;
  otm10PutIV: number;
  otm10CallIV: number;
  otm25PutIV: number;
  otm25CallIV: number;
  putCallSkew: number;
  skewSlope: number;
}

export interface IVDataQuality {
  score: number; // 0-1, 1 being highest quality
  missingDataPoints: number;
  interpolatedPoints: number;
  anomalyFlags: IVAnomalyFlag[];
  lastValidationDate: string;
  validationNotes?: string;
}

export interface IVAnomalyFlag {
  type: IVAnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  resolved: boolean;
  resolutionNotes?: string;
}

export type IVAnomalyType = 
  | 'spike'
  | 'gap'
  | 'missing_data'
  | 'negative_iv'
  | 'extreme_value'
  | 'term_structure_inversion'
  | 'calendar_spread_anomaly'
  | 'corporate_action'
  | 'data_source_error';

export type IVDataSource = 
  | 'yahoo_finance'
  | 'alpha_vantage'
  | 'polygon'
  | 'quandl'
  | 'cboe'
  | 'manual_import'
  | 'calculated'
  | 'interpolated';

// Corporate Action Types
export interface CorporateAction {
  id: string;
  symbol: string;
  actionType: CorporateActionType;
  exDate: string;
  recordDate: string;
  payableDate?: string;
  ratio?: number; // For splits/dividends
  amount?: number; // For cash dividends
  newSymbol?: string; // For symbol changes
  description: string;
  adjustmentFactor: number;
  processed: boolean;
  createdAt: string;
}

export type CorporateActionType = 
  | 'dividend'
  | 'split'
  | 'spin_off'
  | 'merger'
  | 'symbol_change'
  | 'delisting'
  | 'special_dividend';

// Database Query Types
export interface IVQueryOptions {
  symbol?: string | string[];
  startDate?: string;
  endDate?: string;
  minQuality?: number;
  sources?: IVDataSource[];
  includeAnomalies?: boolean;
  normalizeForCorporateActions?: boolean;
  aggregation?: 'daily' | 'weekly' | 'monthly';
  limit?: number;
  offset?: number;
}

export interface IVQueryResult {
  data: HistoricalIVRecord[];
  totalCount: number;
  hasMore: boolean;
  queryMeta: {
    executionTime: number;
    cacheHit: boolean;
    normalizedRecords: number;
    filteredRecords: number;
  };
}

export interface IVStatistics {
  symbol: string;
  period: string;
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  percentiles: {
    p10: number;
    p25: number;
    p75: number;
    p90: number;
  };
  dataQuality: {
    averageScore: number;
    completeness: number; // Percentage of trading days with data
    anomalyRate: number;
  };
}

// Data Pipeline Types
export interface IVDataIngestionJob {
  id: string;
  symbol: string;
  source: IVDataSource;
  startDate: string;
  endDate: string;
  status: IngestionStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type IngestionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export interface IVDataValidationResult {
  valid: boolean;
  errors: IVValidationError[];
  warnings: IVValidationWarning[];
  normalizedData?: HistoricalIVRecord;
}

export interface IVValidationError {
  field: string;
  value: any;
  message: string;
  code: string;
}

export interface IVValidationWarning {
  field: string;
  value: any;
  message: string;
  suggestion?: string;
}

// Database Configuration
export interface IVDatabaseConfig {
  retentionDays: number;
  maxRecordsPerSymbol: number;
  qualityThreshold: number;
  enableAutoCleanup: boolean;
  enableDataValidation: boolean;
  normalizationEnabled: boolean;
  archiveOldData: boolean;
}

// Cache Types
export interface IVCacheEntry {
  key: string;
  data: any;
  timestamp: string;
  ttl: number; // seconds
  size: number; // bytes
  hitCount: number;
  lastAccessed: string;
}

export interface IVCacheStatistics {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry: string;
  newestEntry: string;
}

// API Response Types
export interface IVDataResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    requestId: string;
    timestamp: string;
    executionTime: number;
    source: string;
    cached: boolean;
  };
}

// Historical Analysis Types
export interface IVRegressionAnalysis {
  symbol: string;
  period: string;
  r_squared: number;
  slope: number;
  intercept: number;
  correlation: number;
  significance: number;
  residuals: number[];
  predictions: number[];
}

export interface IVVolatilityCone {
  symbol: string;
  generatedAt: string;
  percentiles: {
    [key: string]: { // "7d", "30d", "60d", etc.
      min: number;
      p5: number;
      p25: number;
      p50: number;
      p75: number;
      p95: number;
      max: number;
      current: number;
    };
  };
}

// Export utility type for IV record creation
export type CreateIVRecord = Omit<HistoricalIVRecord, 'id' | 'createdAt' | 'updatedAt' | 'normalizationVersion'>; 