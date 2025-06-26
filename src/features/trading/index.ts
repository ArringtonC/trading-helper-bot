/**
 * Trading Features Module
 * 
 * Exports all trading-related components, services, and utilities
 * including the comprehensive Trading Strategy Database Service.
 */

// Core Trading Strategy Service
export { 
  TradingStrategyService,
  tradingStrategyService,
  StrategyCategory,
  RiskLevel,
  TimeHorizon,
  MarketCondition,
  SkillCategory
} from './services/TradingStrategyService';

// Trading Strategy Types
export type {
  TradingStrategy,
  StrategyRecommendation,
  MarketEnvironment,
  UserProfile,
  StrategyPerformance,
  EstimatedPerformance,
  EducationalContent,
  TradeExample,
  BacktestResults
} from './services/TradingStrategyService';

// Trading Components
export { default as CloseTradeForm } from './components/CloseTradeForm';
export { default as NewTradeForm } from './components/NewTradeForm';
export { default as PositionsTable } from './components/PositionsTable';
export { default as TradeCard } from './components/TradeCard';
export { default as TradeTable } from './components/TradeTable';
// export { default as TradesDataGrid } from './components/TradesDataGrid'; // Disabled - empty component
export { default as AutoWatchlistBuilder } from './components/AutoWatchlistBuilder';
export { default as BattleZoneMarkers } from './components/BattleZoneMarkers';
export { default as BreakoutAlertManager } from './components/BreakoutAlertManager';
export { default as EnhancedWeeklyPlanningWizard } from './components/EnhancedWeeklyPlanningWizard';

// Trading Services
export { EnhancedTradingSignalService } from './services/EnhancedTradingSignalService';
export { default as EnhancedTechnicalFundamentalScreener } from './services/EnhancedTechnicalFundamentalScreener';
export { default as MarketDataAPIService } from './services/MarketDataAPIService';

// Trading Context
export { TradesProvider, useTrades } from './hooks/TradesContext';

// Trading Utils
export * from './utils/tradeUtils';
export * from './utils/ruleEngine/ruleEngineCore';
export * from './utils/ruleEngine/actionExecutor';
export * from './utils/ruleEngine/conditionEvaluator';

// Trading Types
export type { WatchlistEntry, WatchlistCriteria } from './types/watchlist';