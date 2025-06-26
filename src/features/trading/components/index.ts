/**
 * Trading Components Export Index
 * 
 * Central export point for all trading-related components including
 * the AutoWatchlistBuilder and other trading utilities.
 */

export { AutoWatchlistBuilder } from './AutoWatchlistBuilder';
export { default as AutoWatchlistBuilderDefault } from './AutoWatchlistBuilder';
export { default as TradingStrategyDashboard } from './TradingStrategyDashboard';
export { default as StrategyRecommendationEngine } from './StrategyRecommendationEngine';
export { default as StrategyRecommendationEngineDemo } from './StrategyRecommendationEngineDemo';

// Re-export types for external use
export type {
  WatchlistStock,
  WatchlistMetrics,
  OptimizationSettings
} from '../types/watchlist';