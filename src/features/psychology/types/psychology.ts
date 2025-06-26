/**
 * Psychology System Types for Trading Behavioral Enhancement
 * Supports anti-panic protection, profit extraction, and behavioral analytics
 */

import { NormalizedTradeData } from '../../../shared/types/trade';

// Emotional State Tracking
export interface EmotionalState {
  current: 'CALM' | 'FOCUSED' | 'STRESSED' | 'PANICKED' | 'EUPHORIC' | 'FEARFUL';
  stressLevel: number; // 1-10 scale
  confidence: number; // 1-10 scale
  timestamp: Date;
  notes?: string;
}

export interface StressMetrics {
  dailyStress: number;
  weeklyAverageStress: number;
  stressVsPerformanceCorrelation: number;
  optimalStressRange: { min: number; max: number };
  stressHistory: { date: Date; stress: number; performance: number }[];
}

// Anti-Panic Protection System
export interface PanicDetectionResult {
  isPanicking: boolean;
  isAtRisk?: boolean; // Alias for isPanicking for compatibility
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggers: PanicTrigger[];
  recommendations: string[];
  recommendedActions?: string[]; // Alias for recommendations for compatibility
  shouldBlockTrading: boolean;
  coolingOffPeriod?: number; // minutes
}

export interface PanicTrigger {
  type: 'CONSECUTIVE_LOSSES' | 'HIGH_STRESS' | 'REVENGE_TRADING' | 'POSITION_SIZE_ESCALATION' | 'RAPID_FIRE_TRADES';
  severity: 'WARNING' | 'CRITICAL';
  description: string;
  value: number;
  threshold: number;
}

export interface BreatherSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  triggerReason: string;
  stressLevelBefore: number;
  stressLevelAfter?: number;
  reflectionNotes?: string;
  wasEffective?: boolean;
}

// Profit Extraction System
export interface ProfitExtractionConfig {
  monthlyExtractionTarget: number; // percentage of profits
  autoExtractionEnabled: boolean;
  minProfitThreshold: number; // minimum profit before extraction
  emergencyExtractionTriggers: string[];
  reinvestmentStrategy: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}

export interface ProfitExtractionEvent {
  id: string;
  date: Date;
  amount: number;
  accountSizeBefore: number;
  accountSizeAfter: number;
  extractionType: 'MANUAL' | 'AUTOMATIC' | 'EMERGENCY';
  reason: string;
  marketCondition: string;
}

export interface ProfitExtractionAnalysis {
  totalExtracted: number;
  extractionCount: number;
  averageExtraction: number;
  extractionDisciplineScore: number; // 0-100
  projectedSavingsFromCrashes: number;
  compoundGrowthBenefit: number;
  monthlyExtractionHistory: {
    month: string;
    extracted: number;
    marketReturn: number;
    protectionBenefit: number;
  }[];
}

// Position Size Enforcement
export interface PositionSizeViolation {
  type: 'SIZE_EXCEEDED' | 'WEEKLY_OPTIONS_ADDICTION' | 'TOTAL_EXPOSURE_HIGH' | 'CORRELATION_RISK';
  severity: 'WARNING' | 'BLOCK' | 'FORCE_ADJUSTMENT';
  currentSize: number;
  maxAllowedSize: number;
  suggestedSize?: number;
  reasoning: string;
  alternativeSuggestions: string[];
}

export interface DisciplineMetrics {
  positionSizeCompliance: number; // percentage of trades within limits
  stopLossCompliance: number;
  strategyAdherence: number;
  weeklyOptionsAvoidance: number;
  overallDisciplineScore: number;
  consecutiveDisciplinedDays: number;
  disciplineStreak: {
    current: number;
    best: number;
    category: 'NOVICE' | 'SKILLED' | 'DISCIPLINED' | 'MASTER';
  };
}

// Behavioral Analytics
export interface BehavioralPattern {
  pattern: 'REVENGE_TRADING' | 'FOMO_ENTRY' | 'PANIC_EXIT' | 'OVERSIZE_POSITIONS' | 'WEEKLY_OPTIONS_ADDICTION';
  frequency: number;
  impact: number; // negative impact on returns
  lastOccurrence: Date;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  interventionSuggestions: string[];
}

export interface PsychologyAchievement {
  id: string;
  category: 'STRESS_MANAGEMENT' | 'PROFIT_PROTECTION' | 'DISCIPLINE' | 'EMOTIONAL_CONTROL';
  name: string;
  description: string;
  criteria: string;
  xpReward: number;
  unlockedAt?: Date;
  progress: number; // 0-100
  milestones: {
    threshold: number;
    description: string;
    achieved: boolean;
  }[];
}

export interface BehavioralSession {
  id: string;
  date: Date;
  sessionType: 'TRADING' | 'PLANNING' | 'ANALYSIS' | 'EDUCATION';
  duration: number; // minutes
  stressLevelStart: number;
  stressLevelEnd: number;
  emotionalState: EmotionalState;
  tradesExecuted: number;
  rulesViolated: string[];
  achievements: string[];
  notes?: string;
}

// Psychology Service Interfaces
export interface PsychologyAnalytics {
  stressMetrics: StressMetrics;
  disciplineMetrics: DisciplineMetrics;
  behavioralPatterns: BehavioralPattern[];
  profitExtractionAnalysis: ProfitExtractionAnalysis;
  overallPsychologyScore: number;
  improvementTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  keyRecommendations: string[];
}

export interface TradingPsychologyProfile {
  userId: string;
  profileType: 'EMOTIONAL_TRADER' | 'DISCIPLINED_TRADER' | 'ANALYTICAL_TRADER' | 'INTUITIVE_TRADER';
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  commonTriggers: PanicTrigger[];
  strengthAreas: string[];
  improvementAreas: string[];
  personalizedStrategies: string[];
  lastUpdated: Date;
}

// Quest and Achievement System Extensions
export interface PsychologyQuest {
  id: string;
  type: 'STRESS_MANAGEMENT' | 'PROFIT_EXTRACTION' | 'DISCIPLINE' | 'PATIENCE';
  name: string;
  description: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  xpReward: number;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  startDate: Date;
  endDate: Date;
}

// Market Condition Awareness
export interface PsychologyMarketFilter {
  stressLevel: number;
  complexityReduction: boolean;
  maxRecommendations: number;
  weeklyOptionsFilter: boolean;
  riskAdjustment: 'CONSERVATIVE' | 'NORMAL' | 'AGGRESSIVE';
  analysisSimplification: boolean;
}

// Analytics and Reporting
export interface PsychologyReport {
  reportDate: Date;
  timeframe: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  overallScore: number;
  keyMetrics: {
    averageStressLevel: number;
    disciplineScore: number;
    profitExtractionCompliance: number;
    emotionalConsistency: number;
  };
  improvements: string[];
  concerns: string[];
  recommendations: string[];
  nextGoals: string[];
}

export interface StressCorrelationData {
  stressLevel: number;
  winRate: number;
  profitFactor: number;
  decisionQuality: number;
  date: Date;
}

// Event Tracking
export interface PsychologyEvent {
  id: string;
  type: 'STRESS_LOG' | 'PANIC_DETECTION' | 'BREATHER_SESSION' | 'PROFIT_EXTRACTION' | 'RULE_VIOLATION' | 'ACHIEVEMENT_UNLOCK';
  timestamp: Date;
  data: any;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Configuration
export interface PsychologySettings {
  stressTrackingEnabled: boolean;
  panicDetectionSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  automaticBreatherMode: boolean;
  profitExtractionReminders: boolean;
  hardPositionLimits: boolean;
  weeklyOptionsWarnings: boolean;
  behavioralAnalyticsEnabled: boolean;
  achievementNotifications: boolean;
}