/**
 * Market Data Feature Module
 * 
 * Central export point for all market data functionality
 */

// Services
export { MarketDataService } from './services/MarketDataService';
export { WeeklyMarketScanService } from './services/WeeklyMarketScanService';

// Types
export type {
  StrategyClass,
  ScanResult,
  WeeklyScanData,
  ScanConfiguration,
  ScanOperation
} from './services/WeeklyMarketScanService';

export type {
  MarketDataConfiguration,
  MarketDataResult,
  MarketDataState,
  PriceDataRequest,
  NewsDataRequest
} from './services/MarketDataService';

// Market scan types
export type * from './types/marketScan';

// Examples and demos
export * as WeeklyMarketScanExamples from './examples/WeeklyMarketScanExample';