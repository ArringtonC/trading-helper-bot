/**
 * Goals Components - Export index for Goal Assessment System & Template Matching System
 * 
 * Phase 2, Task 1: Goal Assessment System Implementation
 * Research-backed goal identification with SMART framework validation,
 * psychological bias detection, and progressive disclosure.
 * 
 * Phase 2, Task 2: Template Matching System Implementation
 * Intelligent goal-to-stock matching using genetic algorithms (28.41% returns),
 * TS-Deep-LtM algorithm (30% outperformance), and real-time alignment scoring.
 */

// Type definitions
export type GoalCategory = 'income_generation' | 'growth_seeking' | 'capital_preservation' | 'learning_practice' | 'active_trading';
export type BiasType = 'overconfidence' | 'loss_aversion' | 'projection' | 'dunning_kruger' | 'present_bias' | 'planning_fallacy' | 'anchoring' | 'optimism' | 'representativeness' | 'status_quo_bias' | 'illusion_of_control';
export type SMARTCriteria = 'specific' | 'measurable' | 'attainable' | 'relevant' | 'time_bound';
export type RiskLevel = 'low' | 'medium' | 'medium-high' | 'high';
export type TimeHorizon = 'short-term' | 'medium-long-term' | 'long-term' | '3-12 months';

// Core Assessment Components
export { default as GoalQuestionnaire } from './GoalQuestionnaire';
export { default as GoalDefinitionStep } from './GoalDefinitionStep';
export { default as GoalAssessmentContainer } from './GoalAssessmentContainer';
export { default as GoalAssessmentDemo } from './GoalAssessmentDemo';

// Template Matching System Components
export { default as StockRecommendationCard } from './StockRecommendationCard';
export { default as TemplateMatchingInterface } from './TemplateMatchingInterface';
export { default as TemplateMatchingDemo } from './TemplateMatchingDemo';

// Account Classification System Components
export { default as AccountClassificationInterface } from './AccountClassificationInterface';
export { default as AccountClassificationDemo } from './AccountClassificationDemo';

// Question Type Components
export {
  MultipleChoiceQuestion,
  LikertScaleQuestion,
  ScenarioQuestion,
  RankingQuestion,
  NumericQuestion,
  QuestionTypes
} from './QuestionTypes';

// Services and Utilities
export { default as GoalIdentificationSystem } from '../../services/goals/GoalIdentificationSystem';
export { default as GoalFlowIntegration } from '../../services/userFlow/GoalFlowIntegration';
export { default as GoalBasedTemplateSystem } from '../../services/goals/GoalBasedTemplateSystem';

// Specialized Components
export { default as ConflictDetector } from './ConflictDetector';
export { default as RealismValidator } from './RealismValidator';
export { default as EducationalContent } from './EducationalContent';

// Constants and Types
export const GOAL_CATEGORIES: Record<string, GoalCategory> = {
  INCOME_GENERATION: 'income_generation',
  GROWTH_SEEKING: 'growth_seeking',
  CAPITAL_PRESERVATION: 'capital_preservation',
  LEARNING_PRACTICE: 'learning_practice',
  ACTIVE_TRADING: 'active_trading'
} as const;

export const BIAS_TYPES: Record<string, BiasType> = {
  OVERCONFIDENCE: 'overconfidence',
  LOSS_AVERSION: 'loss_aversion',
  PROJECTION: 'projection',
  DUNNING_KRUGER: 'dunning_kruger',
  PRESENT_BIAS: 'present_bias',
  PLANNING_FALLACY: 'planning_fallacy',
  ANCHORING: 'anchoring',
  OPTIMISM: 'optimism',
  REPRESENTATIVENESS: 'representativeness',
  STATUS_QUO_BIAS: 'status_quo_bias',
  ILLUSION_OF_CONTROL: 'illusion_of_control'
} as const;

export const SMART_CRITERIA: Record<string, SMARTCriteria> = {
  SPECIFIC: 'specific',
  MEASURABLE: 'measurable',
  ATTAINABLE: 'attainable',
  RELEVANT: 'relevant',
  TIME_BOUND: 'time_bound'
} as const;

// Interface definitions
interface GoalCategoryInfo {
  name: string;
  description: string;
  typicalReturn: string;
  riskLevel: RiskLevel;
  timeHorizon: TimeHorizon;
  percentage: number;
}

interface BiasInfo {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  prevalence: string;
  impact: string;
}

interface SMARTValidationCriteria {
  specific: boolean;
  measurable: boolean;
  attainable: boolean;
  relevant: boolean;
  time_bound: boolean;
}

interface SMARTValidationResult {
  isValid: boolean;
  issues: string[];
  score: number;
  criteria: SMARTValidationCriteria;
}

interface Goal {
  id?: string;
  description?: string;
  targetAmount?: number;
  percentage?: number;
  quantity?: number;
  realismScore?: number;
  category?: GoalCategory;
  strategy?: string;
  timeframe?: string;
}

// Research Constants
export const RESEARCH_METRICS = {
  PERFORMANCE_IMPROVEMENT: 400, // basis points
  QUIT_RATE_REDUCTION: 25, // percentage
  OVERLOAD_REDUCTION: 45, // percentage
  GOAL_CATEGORIES_DISTRIBUTION: {
    income_generation: 32,
    growth_seeking: 28,
    capital_preservation: 25,
    learning_practice: 10,
    active_trading: 5
  },
  
  // Template Matching System Metrics
  GENETIC_ALGORITHM_RETURNS: 28.41, // percentage
  TS_DEEP_LTM_OUTPERFORMANCE: 30, // percentage higher than benchmarks
  STOCK_PREDICTION_ACCURACY: 90, // 9 out of 10 predictions correct
  GOAL_ALIGNMENT_ACCURACY: 80, // >80% accuracy target
  TEMPLATE_EVOLUTION_GENERATIONS: 100,
  POPULATION_SIZE: 50,
  MULTI_FACTOR_SCREENING: ['pe_ratio', 'peg_ratio', 'pb_ratio', 'ps_ratio', 'short_ratio']
} as const;

// Utility Functions
export const getGoalCategoryInfo = (category: GoalCategory): GoalCategoryInfo | null => {
  const categoryInfo: Record<GoalCategory, GoalCategoryInfo> = {
    income_generation: {
      name: 'Income Generation',
      description: 'Generate steady income through dividends and covered calls',
      typicalReturn: '3-6%',
      riskLevel: 'medium',
      timeHorizon: 'long-term',
      percentage: 32
    },
    growth_seeking: {
      name: 'Growth Seeking',
      description: 'Grow wealth through capital appreciation',
      typicalReturn: '8-15%',
      riskLevel: 'medium-high',
      timeHorizon: 'medium-long-term',
      percentage: 28
    },
    capital_preservation: {
      name: 'Capital Preservation',
      description: 'Protect money from inflation with stable investments',
      typicalReturn: '3-5%',
      riskLevel: 'medium',
      timeHorizon: 'long-term',
      percentage: 25
    },
    learning_practice: {
      name: 'Learning & Practice',
      description: 'Educational experience to build knowledge',
      typicalReturn: 'learning',
      riskLevel: 'low',
      timeHorizon: '3-12 months',
      percentage: 10
    },
    active_trading: {
      name: 'Active Trading',
      description: 'Day trading and short-term opportunities',
      typicalReturn: '10-30%',
      riskLevel: 'high',
      timeHorizon: 'short-term',
      percentage: 5
    }
  };

  return categoryInfo[category] || null;
};

export const getBiasInfo = (biasType: BiasType): BiasInfo | null => {
  const biasInfo: Record<BiasType, BiasInfo> = {
    overconfidence: {
      name: 'Overconfidence Bias',
      description: 'Tendency to overestimate one\'s abilities and knowledge',
      severity: 'high',
      prevalence: '80-90%',
      impact: 'Excessive risk-taking, overtrading'
    },
    loss_aversion: {
      name: 'Loss Aversion',
      description: 'Feeling losses more strongly than equivalent gains',
      severity: 'medium',
      prevalence: '95%+',
      impact: 'Holding losers too long, selling winners too early'
    },
    projection: {
      name: 'Projection Bias',
      description: 'Projecting current preferences into the future',
      severity: 'medium',
      prevalence: '70%',
      impact: 'Inconsistent long-term planning'
    },
    dunning_kruger: {
      name: 'Dunning-Kruger Effect',
      description: 'Overestimating competence when lacking skill',
      severity: 'high',
      prevalence: '75%',
      impact: 'Premature confidence, inadequate preparation'
    },
    present_bias: {
      name: 'Present Bias',
      description: 'Overweighting immediate rewards vs future benefits',
      severity: 'medium',
      prevalence: '80%',
      impact: 'Short-term thinking, impatience'
    },
    planning_fallacy: {
      name: 'Planning Fallacy',
      description: 'Underestimating time and overestimating benefits',
      severity: 'medium',
      prevalence: '65%',
      impact: 'Unrealistic timelines and expectations'
    },
    anchoring: {
      name: 'Anchoring Bias',
      description: 'Over-relying on first piece of information',
      severity: 'medium',
      prevalence: '90%+',
      impact: 'Inadequate adjustment from initial impressions'
    },
    optimism: {
      name: 'Optimism Bias',
      description: 'Overestimating positive outcomes',
      severity: 'medium',
      prevalence: '80%',
      impact: 'Insufficient risk management'
    },
    representativeness: {
      name: 'Representativeness Heuristic',
      description: 'Making decisions based on similarity to mental prototypes',
      severity: 'medium',
      prevalence: '70%',
      impact: 'Ignoring base rates and probability'
    },
    status_quo_bias: {
      name: 'Status Quo Bias',
      description: 'Preference for keeping things the same',
      severity: 'low',
      prevalence: '85%',
      impact: 'Resistance to beneficial changes'
    },
    illusion_of_control: {
      name: 'Illusion of Control',
      description: 'Overestimating ability to control outcomes',
      severity: 'high',
      prevalence: '75%',
      impact: 'Excessive confidence in predictions'
    }
  };

  return biasInfo[biasType] || null;
};

export const validateSMARTGoal = (goal: Goal): SMARTValidationResult => {
  const validation: SMARTValidationResult = {
    isValid: true,
    issues: [],
    score: 0,
    criteria: {
      specific: false,
      measurable: false,
      attainable: false,
      relevant: false,
      time_bound: false
    }
  };

  // Specific
  const isSpecific = goal.description && goal.description.length > 10;
  validation.criteria.specific = isSpecific;
  if (isSpecific) validation.score += 20;
  else validation.issues.push('Goal needs more specific description');

  // Measurable
  const isMeasurable = !!(goal.targetAmount || goal.percentage || goal.quantity);
  validation.criteria.measurable = isMeasurable;
  if (isMeasurable) validation.score += 20;
  else validation.issues.push('Goal needs measurable target');

  // Attainable
  const isAttainable = goal.realismScore ? goal.realismScore > 60 : true;
  validation.criteria.attainable = isAttainable;
  if (isAttainable) validation.score += 20;
  else validation.issues.push('Goal may not be attainable');

  // Relevant
  const isRelevant = !!(goal.category && goal.strategy);
  validation.criteria.relevant = isRelevant;
  if (isRelevant) validation.score += 20;
  else validation.issues.push('Goal needs relevant strategy');

  // Time-bound
  const isTimeBound = goal.timeframe && goal.timeframe !== 'undefined';
  validation.criteria.time_bound = isTimeBound;
  if (isTimeBound) validation.score += 20;
  else validation.issues.push('Goal needs specific timeframe');

  validation.isValid = validation.score >= 60 && validation.issues.length === 0;
  
  return validation;
};