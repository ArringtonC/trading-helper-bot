// Risk Management Components - Component 9: Risk Management System ($50)
// Comprehensive risk monitoring, PTJ rules integration, and alert system

export { default as RiskDashboard } from './RiskDashboard';
export type { RiskDashboardProps } from './RiskDashboard';

export { default as AlertPanel } from './AlertPanel';
export type { AlertPanelProps } from './AlertPanel';

// Re-export services for convenience
export { default as riskAlertService } from '../services/RiskAlertService';
export type {
  RiskAlert,
  AlertRule,
  AlertConfiguration,
  RiskParams
} from '../services/RiskAlertService';

export { default as PTJRulesService } from '../services/PTJRulesService';
export type {
  PTJPosition,
  PTJRiskMetrics,
  PTJSentimentIndicators,
  PTJTechnicalSetup,
  PTJMacroBackdrop,
  PTJContrarian,
  PTJSignal,
  PTJRuleValidation
} from '../services/PTJRulesService';

// Re-export existing risk utilities
export {
  generateRiskSummary,
  analyzeLeverage,
  calculateKelly,
  simulateLossSequence,
  formatPercentage,
  formatCurrency
} from '../../../shared/utils/riskCalculations';