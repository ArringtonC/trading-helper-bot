/**
 * Position Limit Recommendation Engine
 * 
 * This module combines position sizing algorithms and best practices to generate
 * comprehensive recommendations with rationale, warnings, and educational content.
 * 
 * Used by the GoalSizingWizard to provide intelligent position limit suggestions.
 */

import {
  PositionSizingInput,
  PositionLimitRecommendation,
  ComprehensiveRecommendation,
  generateComprehensiveRecommendation as calculateAlgorithmicRecommendation,
  validateUserLimits
} from './positionLimitRecommendations';

import {
  POSITION_SIZING_STANDARDS,
  ASSET_CLASS_GUIDELINES,
  STRATEGY_GUIDELINES,
  MARKET_CONDITION_ADJUSTMENTS,
  EXPERIENCE_LEVEL_ADJUSTMENTS,
  EDUCATIONAL_CONTENT,
  getBestPracticesFor,
  getCriticalRules,
  BestPracticeRule
} from '../data/positionSizingBestPractices';

export interface UserProfile {
  accountSize: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  tradingStrategy: 'day_trading' | 'swing_trading' | 'position_trading' | 'scalping';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  goalType: 'growth' | 'income' | 'preservation' | 'capital_objective';
  assetClass?: 'stocks' | 'options' | 'futures' | 'crypto' | 'forex';
  marketCondition?: 'low_volatility' | 'normal_volatility' | 'high_volatility' | 'bear_market' | 'bull_market' | 'crisis_conditions';
  capitalObjectiveParameters?: {
    currentBalance: number;
    targetBalance: number;
    timeHorizonMonths: number;
  };
}

// Internal recommendation type with risk per trade
interface InternalRecommendation {
  maxPositionSize: number;
  maxTotalExposure: number;
  riskPerTrade: number;
  reasoning: string;
  method: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface CurrentLimits {
  maxPositionSize: number;
  maxTotalExposure: number;
  riskPerTrade?: number;
}

export interface WarningLevel {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendation: string;
}

export interface RecommendationResult {
  recommended: {
    maxPositionSize: number;
    maxTotalExposure: number;
    riskPerTrade: number;
  };
  rationale: {
    primary: string;
    factors: string[];
    methodology: string;
  };
  comparison: {
    userLimits?: CurrentLimits;
    warnings: WarningLevel[];
    compliance: {
      conservative: boolean;
      moderate: boolean;
      aggressive: boolean;
    };
  };
  bestPractices: {
    applicableRules: BestPracticeRule[];
    criticalRules: BestPracticeRule[];
    educationalContent: Record<string, any>;
  };
  adjustments: {
    marketCondition?: number;
    experienceLevel?: number;
    assetClass?: string;
    applied: string[];
  };
  disclaimer: string;
}

/**
 * Generate comprehensive position limit recommendations
 */
export function generatePositionLimitRecommendations(
  userProfile: UserProfile,
  currentLimits?: CurrentLimits
): RecommendationResult {
  // Convert user profile to algorithm input format
  const algorithmInput: PositionSizingInput = {
    accountSize: userProfile.accountSize,
    riskTolerance: userProfile.riskTolerance,
    tradingStrategy: userProfile.tradingStrategy,
    goalType: userProfile.goalType,
    assetClass: userProfile.assetClass,
    experience: userProfile.experienceLevel,
    volatilityContext: userProfile.marketCondition === 'high_volatility' ? 'high' : 
                      userProfile.marketCondition === 'low_volatility' ? 'low' : 'normal'
  };

  // Get algorithmic recommendation
  const algorithmicResult = calculateAlgorithmicRecommendation(algorithmInput);
  const algorithmicRecommendation = algorithmicResult.primary;

  // Get best practices
  const applicableRules = getBestPracticesFor({
    assetClass: userProfile.assetClass,
    tradingStrategy: userProfile.tradingStrategy,
    riskProfile: userProfile.riskTolerance,
    experienceLevel: userProfile.experienceLevel,
    marketCondition: userProfile.marketCondition
  });

  const criticalRules = getCriticalRules();

  // Convert to internal format with estimated risk per trade
  const internalRecommendation: InternalRecommendation = {
    maxPositionSize: algorithmicRecommendation.maxPositionSize,
    maxTotalExposure: algorithmicRecommendation.maxTotalExposure,
    riskPerTrade: calculateEstimatedRiskPerTrade(algorithmicRecommendation, userProfile),
    reasoning: algorithmicRecommendation.reasoning,
    method: algorithmicRecommendation.method,
    confidence: algorithmicRecommendation.confidence
  };

  // Apply best practice adjustments
  const adjustedRecommendation = applyBestPracticeAdjustments(
    internalRecommendation,
    userProfile,
    applicableRules
  );

  // Generate rationale
  const rationale = generateRationale(userProfile, adjustedRecommendation, applicableRules);

  // Compare with user limits and generate warnings
  const comparison = currentLimits ? 
    compareWithUserLimits(adjustedRecommendation, currentLimits, criticalRules) :
    { warnings: [], compliance: generateComplianceCheck(adjustedRecommendation) };

  // Get relevant educational content
  const educationalContent = getRelevantEducationalContent(userProfile, applicableRules);

  // Document applied adjustments
  const adjustments = getAppliedAdjustments(userProfile);

  return {
    recommended: {
      maxPositionSize: adjustedRecommendation.maxPositionSize,
      maxTotalExposure: adjustedRecommendation.maxTotalExposure,
      riskPerTrade: adjustedRecommendation.riskPerTrade
    },
    rationale,
    comparison,
    bestPractices: {
      applicableRules,
      criticalRules,
      educationalContent
    },
    adjustments,
    disclaimer: "These are educational suggestions based on industry best practices. Not financial advice. Always consult with a qualified financial advisor and consider your individual circumstances."
  };
}

/**
 * Calculate estimated risk per trade based on position sizing
 */
function calculateEstimatedRiskPerTrade(recommendation: PositionLimitRecommendation, userProfile: UserProfile): number {
  // Estimate based on typical stop loss and position size
  const avgStopLoss = userProfile.tradingStrategy === 'day_trading' ? 2 : 
                     userProfile.tradingStrategy === 'scalping' ? 0.5 : 5;
  return (recommendation.maxPositionSize * avgStopLoss) / 100;
}

/**
 * Apply best practice adjustments to algorithmic recommendations
 */
function applyBestPracticeAdjustments(
  algorithmic: InternalRecommendation,
  userProfile: UserProfile,
  applicableRules: BestPracticeRule[]
): InternalRecommendation {
  let adjusted = { ...algorithmic };

  // Apply experience level adjustments
  if (userProfile.experienceLevel) {
    const experienceAdjustment = EXPERIENCE_LEVEL_ADJUSTMENTS[userProfile.experienceLevel];
    adjusted.maxPositionSize *= experienceAdjustment.maxPositionMultiplier;
    adjusted.maxTotalExposure *= experienceAdjustment.maxExposureMultiplier;
    adjusted.riskPerTrade *= experienceAdjustment.riskMultiplier;
  }

  // Apply market condition adjustments
  if (userProfile.marketCondition) {
    const marketAdjustment = MARKET_CONDITION_ADJUSTMENTS[userProfile.marketCondition];
    adjusted.maxPositionSize *= marketAdjustment.sizeMultiplier;
    adjusted.maxTotalExposure *= marketAdjustment.sizeMultiplier;
  }

  // Apply asset class specific limits
  if (userProfile.assetClass) {
    const assetGuidelines = ASSET_CLASS_GUIDELINES[userProfile.assetClass];
    if (assetGuidelines) {
      adjusted.maxPositionSize = Math.min(adjusted.maxPositionSize, assetGuidelines.maxPositionSize);
      adjusted.maxTotalExposure = Math.min(adjusted.maxTotalExposure, assetGuidelines.maxTotalExposure);
    }
  }

  // Apply strategy specific limits
  const strategyGuidelines = STRATEGY_GUIDELINES[userProfile.tradingStrategy];
  if (strategyGuidelines) {
    adjusted.maxPositionSize = Math.min(adjusted.maxPositionSize, strategyGuidelines.maxPositionSize);
    adjusted.maxTotalExposure = Math.min(adjusted.maxTotalExposure, strategyGuidelines.maxTotalExposure);
    adjusted.riskPerTrade = Math.min(adjusted.riskPerTrade, strategyGuidelines.riskPerTrade);
  }

  // Apply specific rule recommendations
  applicableRules.forEach(rule => {
    if (rule.recommendation.maxPositionSize !== undefined) {
      adjusted.maxPositionSize = Math.min(adjusted.maxPositionSize, rule.recommendation.maxPositionSize);
    }
    if (rule.recommendation.maxTotalExposure !== undefined) {
      adjusted.maxTotalExposure = Math.min(adjusted.maxTotalExposure, rule.recommendation.maxTotalExposure);
    }
    if (rule.recommendation.riskPerTrade !== undefined) {
      adjusted.riskPerTrade = Math.min(adjusted.riskPerTrade, rule.recommendation.riskPerTrade);
    }
  });

  // Ensure minimum values
  adjusted.maxPositionSize = Math.max(0.5, adjusted.maxPositionSize);
  adjusted.maxTotalExposure = Math.max(5, adjusted.maxTotalExposure);
  adjusted.riskPerTrade = Math.max(0.1, adjusted.riskPerTrade);

  // Round to reasonable precision
  adjusted.maxPositionSize = Math.round(adjusted.maxPositionSize * 10) / 10;
  adjusted.maxTotalExposure = Math.round(adjusted.maxTotalExposure * 10) / 10;
  adjusted.riskPerTrade = Math.round(adjusted.riskPerTrade * 100) / 100;

  return adjusted;
}

/**
 * Generate rationale for the recommendations
 */
function generateRationale(
  userProfile: UserProfile,
  recommendation: InternalRecommendation,
  applicableRules: BestPracticeRule[]
): RecommendationResult['rationale'] {
  const factors: string[] = [];
  
  // Risk tolerance factor
  const riskStandard = POSITION_SIZING_STANDARDS[userProfile.riskTolerance];
  factors.push(`${userProfile.riskTolerance.charAt(0).toUpperCase() + userProfile.riskTolerance.slice(1)} risk tolerance: ${riskStandard.description}`);
  
  // Trading strategy factor
  const strategyGuideline = STRATEGY_GUIDELINES[userProfile.tradingStrategy];
  factors.push(`${userProfile.tradingStrategy.replace('_', ' ')} strategy: ${strategyGuideline.notes}`);
  
  // Experience level factor
  if (userProfile.experienceLevel) {
    const experienceAdjustment = EXPERIENCE_LEVEL_ADJUSTMENTS[userProfile.experienceLevel];
    factors.push(`${userProfile.experienceLevel.charAt(0).toUpperCase() + userProfile.experienceLevel.slice(1)} experience level: ${experienceAdjustment.notes}`);
  }
  
  // Asset class factor
  if (userProfile.assetClass) {
    const assetGuideline = ASSET_CLASS_GUIDELINES[userProfile.assetClass];
    factors.push(`${userProfile.assetClass.charAt(0).toUpperCase() + userProfile.assetClass.slice(1)} asset class: ${assetGuideline.notes}`);
  }
  
  // Market condition factor
  if (userProfile.marketCondition) {
    const marketAdjustment = MARKET_CONDITION_ADJUSTMENTS[userProfile.marketCondition];
    factors.push(`${userProfile.marketCondition.replace('_', ' ')} market conditions: ${marketAdjustment.notes}`);
  }

  // Critical rules factor
  const criticalRulesCount = applicableRules.filter(rule => rule.severity === 'critical').length;
  if (criticalRulesCount > 0) {
    factors.push(`${criticalRulesCount} critical risk management rules applied`);
  }

  const primary = `Based on your ${userProfile.riskTolerance} risk tolerance and ${userProfile.tradingStrategy.replace('_', ' ')} strategy, we recommend limiting individual positions to ${recommendation.maxPositionSize}% of capital with maximum total exposure of ${recommendation.maxTotalExposure}%.`;

  const methodology = "Our recommendations combine algorithmic calculations with industry best practices from professional trading literature, adjusted for your specific profile and current market conditions.";

  return {
    primary,
    factors,
    methodology
  };
}

/**
 * Compare recommendations with user's current limits
 */
function compareWithUserLimits(
  recommendation: InternalRecommendation,
  userLimits: CurrentLimits,
  criticalRules: BestPracticeRule[]
): RecommendationResult['comparison'] {
  const warnings: WarningLevel[] = [];

  // Check position size
  if (userLimits.maxPositionSize > recommendation.maxPositionSize * 1.5) {
    warnings.push({
      severity: 'critical',
      message: `Your maximum position size (${userLimits.maxPositionSize}%) significantly exceeds our recommendation (${recommendation.maxPositionSize}%).`,
      recommendation: 'Consider reducing individual position sizes to improve risk management.'
    });
  } else if (userLimits.maxPositionSize > recommendation.maxPositionSize * 1.2) {
    warnings.push({
      severity: 'warning',
      message: `Your maximum position size (${userLimits.maxPositionSize}%) is above our recommendation (${recommendation.maxPositionSize}%).`,
      recommendation: 'Consider slightly reducing position sizes for better risk control.'
    });
  }

  // Check total exposure
  if (userLimits.maxTotalExposure > recommendation.maxTotalExposure * 1.3) {
    warnings.push({
      severity: 'critical',
      message: `Your total exposure limit (${userLimits.maxTotalExposure}%) significantly exceeds our recommendation (${recommendation.maxTotalExposure}%).`,
      recommendation: 'Consider maintaining higher cash reserves and reducing overall market exposure.'
    });
  } else if (userLimits.maxTotalExposure > recommendation.maxTotalExposure * 1.15) {
    warnings.push({
      severity: 'warning',
      message: `Your total exposure (${userLimits.maxTotalExposure}%) is above our recommendation (${recommendation.maxTotalExposure}%).`,
      recommendation: 'Consider maintaining slightly higher cash reserves.'
    });
  }

  // Check risk per trade
  if (userLimits.riskPerTrade && userLimits.riskPerTrade > recommendation.riskPerTrade * 2) {
    warnings.push({
      severity: 'critical',
      message: `Your risk per trade (${userLimits.riskPerTrade}%) violates the fundamental 1-2% rule.`,
      recommendation: 'Strongly consider reducing risk per trade to preserve capital longevity.'
    });
  }

  // Check against critical rules
  criticalRules.forEach(rule => {
    if (rule.recommendation.riskPerTrade && userLimits.riskPerTrade && 
        userLimits.riskPerTrade > rule.recommendation.riskPerTrade) {
      warnings.push({
        severity: 'critical',
        message: `Your limits violate critical rule: ${rule.title}`,
        recommendation: rule.description
      });
    }
  });

  const compliance = generateComplianceCheck(userLimits);

  return {
    userLimits,
    warnings,
    compliance
  };
}

/**
 * Generate compliance check against standard risk levels
 */
function generateComplianceCheck(limits: CurrentLimits | InternalRecommendation): { conservative: boolean; moderate: boolean; aggressive: boolean } {
  const { conservative, moderate, aggressive } = POSITION_SIZING_STANDARDS;

  return {
    conservative: limits.maxPositionSize <= conservative.maxPositionSize && 
                 limits.maxTotalExposure <= conservative.maxTotalExposure,
    moderate: limits.maxPositionSize <= moderate.maxPositionSize && 
             limits.maxTotalExposure <= moderate.maxTotalExposure,
    aggressive: limits.maxPositionSize <= aggressive.maxPositionSize && 
               limits.maxTotalExposure <= aggressive.maxTotalExposure
  };
}

/**
 * Get relevant educational content based on user profile
 */
function getRelevantEducationalContent(
  userProfile: UserProfile,
  applicableRules: BestPracticeRule[]
): Record<string, any> {
  const content: Record<string, any> = {};

  // Always include core concepts
  content.positionSizing = EDUCATIONAL_CONTENT.positionSizing;
  content.riskPerTrade = EDUCATIONAL_CONTENT.riskPerTrade;

  // Add diversification for multi-position strategies
  if (['swing_trading', 'position_trading'].includes(userProfile.tradingStrategy)) {
    content.diversification = EDUCATIONAL_CONTENT.diversification;
  }

  // Add volatility content for relevant assets or market conditions
  if (userProfile.assetClass === 'crypto' || 
      userProfile.marketCondition === 'high_volatility' ||
      applicableRules.some(rule => rule.category === 'market_conditions')) {
    content.volatility = EDUCATIONAL_CONTENT.volatility;
  }

  return content;
}

/**
 * Document which adjustments were applied
 */
function getAppliedAdjustments(userProfile: UserProfile): RecommendationResult['adjustments'] {
  const applied: string[] = [];
  let marketCondition: number | undefined;
  let experienceLevel: number | undefined;
  let assetClass: string | undefined;

  if (userProfile.experienceLevel) {
    const adjustment = EXPERIENCE_LEVEL_ADJUSTMENTS[userProfile.experienceLevel];
    experienceLevel = adjustment.maxPositionMultiplier;
    applied.push(`Experience level (${userProfile.experienceLevel}): ${Math.round((adjustment.maxPositionMultiplier - 1) * 100)}% adjustment`);
  }

  if (userProfile.marketCondition) {
    const adjustment = MARKET_CONDITION_ADJUSTMENTS[userProfile.marketCondition];
    marketCondition = adjustment.sizeMultiplier;
    applied.push(`Market conditions (${userProfile.marketCondition}): ${Math.round((adjustment.sizeMultiplier - 1) * 100)}% adjustment`);
  }

  if (userProfile.assetClass) {
    assetClass = userProfile.assetClass;
    applied.push(`Asset class (${userProfile.assetClass}): specific risk considerations applied`);
  }

  applied.push(`Trading strategy (${userProfile.tradingStrategy}): strategy-specific limits applied`);

  return {
    marketCondition,
    experienceLevel,
    assetClass,
    applied
  };
}

/**
 * Quick validation helper to check if user limits are reasonable
 */
export function validateUserPositionLimits(
  userLimits: CurrentLimits,
  userProfile: UserProfile
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for unreasonable values
  if (userLimits.maxPositionSize > 50) {
    errors.push('Position size cannot exceed 50% of capital');
  }
  if (userLimits.maxTotalExposure > 100) {
    errors.push('Total exposure cannot exceed 100%');
  }
  if (userLimits.riskPerTrade && userLimits.riskPerTrade > 10) {
    errors.push('Risk per trade cannot exceed 10%');
  }

  // Check against conservative guidelines
  const conservative = POSITION_SIZING_STANDARDS.conservative;
  if (userProfile.experienceLevel === 'beginner') {
    if (userLimits.maxPositionSize > conservative.maxPositionSize * 2) {
      warnings.push('Position size may be too high for beginner level');
    }
    if (userLimits.maxTotalExposure > conservative.maxTotalExposure * 1.5) {
      warnings.push('Total exposure may be too high for beginner level');
    }
  }

  // Check critical rules
  const criticalRules = getCriticalRules();
  criticalRules.forEach(rule => {
    if (rule.recommendation.riskPerTrade && userLimits.riskPerTrade && 
        userLimits.riskPerTrade > rule.recommendation.riskPerTrade * 2) {
      errors.push(`Violates critical rule: ${rule.title}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get a quick summary recommendation for simple use cases
 */
export function getQuickRecommendation(userProfile: UserProfile): {
  maxPositionSize: number;
  maxTotalExposure: number;
  riskPerTrade: number;
  summary: string;
} {
  const fullRecommendation = generatePositionLimitRecommendations(userProfile);
  
  return {
    maxPositionSize: fullRecommendation.recommended.maxPositionSize,
    maxTotalExposure: fullRecommendation.recommended.maxTotalExposure,
    riskPerTrade: fullRecommendation.recommended.riskPerTrade,
    summary: fullRecommendation.rationale.primary
  };
} 
 
 
 