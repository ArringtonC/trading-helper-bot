/**
 * Trading Style-Specific Rule Types
 * 
 * Extends the existing rule engine to support trading style-specific
 * gap risk evaluation and recommendations.
 */

import { Rule, Action, Condition } from './RuleSchema';
import { GapMagnitude, PositionGapRisk, WeekendGapAnalysis } from './gapRisk';

// Trading style categories
export type TradingStyle = 
  | 'day_trading'
  | 'swing_trading' 
  | 'position_trading'
  | 'scalping';

// Risk tolerance levels
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

// Market session considerations for gap risk
export type MarketSession = 'pre_market' | 'regular_hours' | 'after_hours' | 'weekend';

// Trading style configuration
export interface TradingStyleConfig {
  style: TradingStyle;
  riskTolerance: RiskTolerance;
  
  // Position sizing preferences
  maxPositionSize: number; // Percentage of portfolio
  maxTotalExposure: number; // Total exposure limit
  
  // Time horizon preferences
  typicalHoldTime: number; // Days
  weekendHoldingAllowed: boolean;
  
  // Risk thresholds
  maxGapRiskScore: number; // 0-100 scale
  acceptableGapMagnitudes: GapMagnitude[];
  
  // Account constraints
  accountSize: number;
  availableBuyingPower: number;
  
  // Strategy-specific parameters
  strategyParameters: Record<string, any>;
}

// Extended rule for gap risk evaluation
export interface GapRiskRule extends Rule {
  type: 'gap_risk';
  
  // Trading style targeting
  applicableStyles: TradingStyle[];
  applicableRiskTolerance: RiskTolerance[];
  
  // Gap risk specific conditions
  gapRiskConditions: {
    minRiskScore?: number;
    maxRiskScore?: number;
    allowedMagnitudes?: GapMagnitude[];
    volatilityRegime?: string[];
    marketSession?: MarketSession[];
    positionValue?: {
      min?: number;
      max?: number;
    };
  };
  
  // Time-based constraints
  timeConstraints?: {
    daysToWeekend?: number; // Days until weekend
    holdTimeLimit?: number; // Max days to hold
    marketHoursOnly?: boolean;
  };
}

// Gap risk specific actions
export interface GapRiskAction extends Action {
  type: 
    | 'reduce_position'
    | 'close_position'
    | 'add_hedge'
    | 'set_stop_loss'
    | 'delay_entry'
    | 'require_approval'
    | 'send_alert'
    | 'adjust_position_size';
    
  parameters: {
    // Position adjustment parameters
    reductionPercent?: number;
    newPositionSize?: number;
    hedgeRatio?: number;
    stopLossPercent?: number;
    
    // Alert parameters
    alertLevel?: 'info' | 'warning' | 'critical';
    message?: string;
    channels?: string[];
    
    // Approval workflow
    approvalRequired?: boolean;
    approvers?: string[];
    timeoutHours?: number;
  };
}

// Context data for rule evaluation
export interface GapRiskRuleContext {
  // Position information
  position: {
    symbol: string;
    size: number;
    value: number;
    entryDate: Date;
    assetClass: string;
  };
  
  // Gap risk analysis
  gapRisk: PositionGapRisk;
  
  // Portfolio context
  portfolio?: {
    totalValue: number;
    totalExposure: number;
    weekendExposure: number;
    positions: any[];
  };
  
  // Market context
  market: {
    volatilityRegime: string;
    daysToWeekend: number;
    marketSession: MarketSession;
    vixLevel?: number;
  };
  
  // User configuration
  tradingStyle: TradingStyleConfig;
  
  // Time context
  timestamp: Date;
}

// Rule evaluation result
export interface GapRiskEvaluationResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskScore: number;
  
  // Recommended actions
  recommendedActions: GapRiskAction[];
  
  // Reasoning
  reasoning: string;
  triggers: string[];
  
  // Metadata
  evaluatedAt: Date;
  applicableStyle: TradingStyle;
}

// Pre-built rule templates by trading style
export interface TradingStyleRuleTemplate {
  style: TradingStyle;
  name: string;
  description: string;
  rules: GapRiskRule[];
  defaultConfig: Partial<TradingStyleConfig>;
}

// Risk recommendation with action priority
export interface GapRiskRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  description: string;
  reasoning: string;
  
  // Implementation details
  targetPositions?: string[];
  parameters?: Record<string, any>;
  timeline?: string;
  
  // Risk impact
  riskReduction?: number; // Percentage
  costImpact?: number; // Dollar amount
  
  metadata: {
    ruleId: string;
    evaluatedAt: Date;
    validUntil?: Date;
  };
}

// Comprehensive gap risk assessment result
export interface TradingStyleGapAssessment {
  userId: string;
  tradingStyle: TradingStyleConfig;
  
  // Overall assessment
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  
  // Position-level results
  positionEvaluations: GapRiskEvaluationResult[];
  
  // Portfolio-level analysis
  portfolioMetrics: {
    totalWeekendExposure: number;
    concentrationRisk: number;
    diversificationScore: number;
  };
  
  // Actionable recommendations
  recommendations: GapRiskRecommendation[];
  
  // Summary
  summary: {
    totalPositionsEvaluated: number;
    highRiskPositions: number;
    recommendedActions: number;
    estimatedRiskReduction: number;
  };
  
  // Metadata
  assessmentDate: Date;
  validUntil: Date;
  version: string;
}

// Configuration for the gap risk rule engine
export interface GapRiskEngineConfig {
  // Rule evaluation settings
  enableRealTimeEvaluation: boolean;
  evaluationInterval: number; // Minutes
  
  // Risk thresholds
  globalRiskThresholds: {
    low: number;
    medium: number;
    high: number;
    extreme: number;
  };
  
  // Action execution settings
  autoExecuteActions: boolean;
  requireApprovalForHighRisk: boolean;
  
  // Notification settings
  notificationChannels: string[];
  alertThresholds: {
    info: number;
    warning: number;
    critical: number;
  };
  
  // Performance settings
  cacheDuration: number; // Minutes
  maxConcurrentEvaluations: number;
  
  // Integration settings
  integrations: {
    weekendGapRiskService: boolean;
    marketAnalysisService: boolean;
    riskService: boolean;
  };
} 