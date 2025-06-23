/**
 * User Experience Assessment Logic
 * 
 * Evaluates user behavior, trading history, and explicit preferences to categorize users
 * as beginner, intermediate, or advanced. Determines appropriate risk profile defaults
 * and interface complexity settings.
 */

import { UserExperienceLevel } from '../ux/UXLayersController';

export interface UserBehaviorMetrics {
  timeSpentInApp: number; // minutes
  pagesVisited: string[];
  featuresUsed: string[];
  calculationsPerformed: number;
  tutorialProgress: number; // 0-100%
  errorRate: number; // 0-1 (percentage of errors)
  helpRequestsCount: number;
  sessionDuration: number; // minutes
  returnVisits: number;
  complexFeaturesAccessed: string[];
}

export interface TradingHistoryData {
  totalTrades: number;
  tradingExperienceYears: number;
  accountSize: number;
  averagePositionSize: number;
  riskPerTrade: number;
  winRate: number;
  instrumentsTraded: string[]; // ['stocks', 'options', 'futures', 'forex']
  strategiesUsed: string[];
  maxDrawdown: number;
  hasLiveTradingExperience: boolean;
}

export interface ExplicitPreferences {
  selfReportedLevel: UserExperienceLevel | null;
  preferredRiskLevel: 'conservative' | 'moderate' | 'aggressive' | null;
  primaryTradingGoal: 'income' | 'growth' | 'speculation' | 'learning' | null;
  timeAvailableForTrading: 'minimal' | 'moderate' | 'extensive' | null;
  preferredComplexity: 'simple' | 'moderate' | 'broker' | null;
  hasCompletedOnboarding: boolean;
  manualOverride: UserExperienceLevel | null;
}

export interface RiskProfile {
  level: 'conservative' | 'moderate' | 'aggressive';
  defaultRiskPercent: number;
  maxRiskPercent: number;
  recommendedPositionSize: number;
  kellyFraction: number;
  vixAdjustmentEnabled: boolean;
  description: string;
}

export interface AssessmentResult {
  userLevel: UserExperienceLevel;
  confidence: number; // 0-1
  riskProfile: RiskProfile;
  recommendations: string[];
  reasoning: string[];
  shouldShowOnboarding: boolean;
  suggestedFeatures: string[];
  warningFlags: string[];
}

export interface AssessmentCriteria {
  behavior: {
    timeSpent: { beginner: number; intermediate: number; advanced: number };
    featuresUsed: { beginner: number; intermediate: number; advanced: number };
    errorRate: { beginner: number; intermediate: number; advanced: number };
    complexityAccess: { beginner: string[]; intermediate: string[]; advanced: string[] };
  };
  trading: {
    experience: { beginner: number; intermediate: number; advanced: number };
    accountSize: { beginner: number; intermediate: number; advanced: number };
    instruments: { beginner: number; intermediate: number; advanced: number };
    winRate: { beginner: number; intermediate: number; advanced: number };
  };
  weights: {
    behavior: number;
    trading: number;
    explicit: number;
  };
}

export class UserExperienceAssessment {
  private readonly assessmentCriteria: AssessmentCriteria = {
    behavior: {
      timeSpent: { beginner: 60, intermediate: 300, advanced: 500 }, // minutes
      featuresUsed: { beginner: 3, intermediate: 8, advanced: 15 },
      errorRate: { beginner: 0.3, intermediate: 0.15, advanced: 0.05 },
      complexityAccess: {
        beginner: ['position-sizing', 'tutorial'],
        intermediate: ['options-trading', 'analytics', 'visualizer'],
        advanced: ['rule-engine', 'api-connections', 'advanced-analytics', 'ai-analysis']
      }
    },
    trading: {
      experience: { beginner: 0.5, intermediate: 2, advanced: 4 }, // years
      accountSize: { beginner: 5000, intermediate: 25000, advanced: 75000 },
      instruments: { beginner: 1, intermediate: 2, advanced: 3 }, // number of instrument types
      winRate: { beginner: 0.4, intermediate: 0.55, advanced: 0.65 }
    },
    weights: {
      behavior: 0.4,
      trading: 0.4,
      explicit: 0.2
    }
  };

  private readonly riskProfiles: Record<string, RiskProfile> = {
    conservative: {
      level: 'conservative',
      defaultRiskPercent: 0.75,
      maxRiskPercent: 2.0,
      recommendedPositionSize: 50,
      kellyFraction: 0.25,
      vixAdjustmentEnabled: true,
      description: 'Low-risk approach focusing on capital preservation'
    },
    moderate: {
      level: 'moderate',
      defaultRiskPercent: 1.5,
      maxRiskPercent: 3.0,
      recommendedPositionSize: 100,
      kellyFraction: 0.35,
      vixAdjustmentEnabled: true,
      description: 'Balanced approach between growth and preservation'
    },
    aggressive: {
      level: 'aggressive',
      defaultRiskPercent: 2.5,
      maxRiskPercent: 5.0,
      recommendedPositionSize: 200,
      kellyFraction: 0.5,
      vixAdjustmentEnabled: false,
      description: 'Growth-focused approach with higher risk tolerance'
    }
  };

  /**
   * Perform comprehensive user experience assessment
   */
  assessUser(
    behavior: Partial<UserBehaviorMetrics>,
    trading: Partial<TradingHistoryData>,
    preferences: Partial<ExplicitPreferences>
  ): AssessmentResult {
    // Handle manual override first
    if (preferences.manualOverride) {
      return this.createOverrideResult(preferences.manualOverride, preferences);
    }

    // Handle explicit self-reported level with high weight
    if (preferences.selfReportedLevel) {
      const userLevel = preferences.selfReportedLevel;
      const riskProfile = this.determineRiskProfile(userLevel, trading, preferences);
      const recommendations = this.generateRecommendations(userLevel, behavior, trading);
      const warningFlags = this.identifyWarningFlags(behavior, trading, preferences);
      
      return {
        userLevel,
        confidence: 0.9,
        riskProfile,
        recommendations,
        reasoning: [`Self-reported level: ${preferences.selfReportedLevel}`],
        shouldShowOnboarding: this.shouldShowOnboarding(userLevel, preferences),
        suggestedFeatures: this.getSuggestedFeatures(userLevel),
        warningFlags
      };
    }

    // Calculate scores for each category
    const behaviorScore = this.calculateBehaviorScore(behavior);
    const tradingScore = this.calculateTradingScore(trading);
    const explicitScore = this.calculateExplicitScore(preferences);

    // Calculate weighted overall score
    const { weights } = this.assessmentCriteria;
    const overallScore = (
      behaviorScore.score * weights.behavior +
      tradingScore.score * weights.trading +
      explicitScore.score * weights.explicit
    );

    // Determine user level
    const userLevel = this.scoreToUserLevel(overallScore);
    
    // Calculate confidence based on data availability and consistency
    const confidence = this.calculateConfidence(behaviorScore, tradingScore, explicitScore);
    
    // Determine risk profile
    const riskProfile = this.determineRiskProfile(userLevel, trading, preferences);
    
    // Generate recommendations and warnings
    const recommendations = this.generateRecommendations(userLevel, behavior, trading);
    const reasoning = this.generateReasoning(behaviorScore, tradingScore, explicitScore, userLevel);
    const warningFlags = this.identifyWarningFlags(behavior, trading, preferences);
    
    return {
      userLevel,
      confidence,
      riskProfile,
      recommendations,
      reasoning,
      shouldShowOnboarding: this.shouldShowOnboarding(userLevel, preferences),
      suggestedFeatures: this.getSuggestedFeatures(userLevel),
      warningFlags
    };
  }

  /**
   * Calculate behavior-based score
   */
  private calculateBehaviorScore(behavior: Partial<UserBehaviorMetrics>): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;
    let factorCount = 0;

    // Time spent analysis
    if (behavior.timeSpentInApp !== undefined) {
      const timeScore = this.normalizeMetric(
        behavior.timeSpentInApp,
        this.assessmentCriteria.behavior.timeSpent
      );
      score += timeScore;
      factorCount++;
      factors.push(`Time spent: ${behavior.timeSpentInApp} minutes (${this.scoreToLevel(timeScore)})`);
    }

    // Features used analysis - enhanced to consider advanced features
    if (behavior.featuresUsed !== undefined) {
      let featureScore = this.normalizeMetric(
        behavior.featuresUsed.length,
        this.assessmentCriteria.behavior.featuresUsed
      );
      
      // Boost score if advanced features are used
      const advancedFeatures = behavior.featuresUsed.filter(f => 
        this.assessmentCriteria.behavior.complexityAccess.advanced.includes(f)
      );
      if (advancedFeatures.length > 0) {
        featureScore = Math.max(featureScore, 0.75);
      }
      
      score += featureScore;
      factorCount++;
      factors.push(`Features used: ${behavior.featuresUsed.length} (${this.scoreToLevel(featureScore)})`);
    }

    // Error rate analysis (inverted - lower error rate = higher score)
    if (behavior.errorRate !== undefined) {
      const errorScore = 1 - this.normalizeMetric(
        behavior.errorRate,
        this.assessmentCriteria.behavior.errorRate
      );
      score += Math.max(0, errorScore);
      factorCount++;
      factors.push(`Error rate: ${(behavior.errorRate * 100).toFixed(1)}% (${this.scoreToLevel(errorScore)})`);
    }

    // Complex features access - check both featuresUsed and complexFeaturesAccessed
    const allFeatures = [
      ...(behavior.featuresUsed || []),
      ...(behavior.complexFeaturesAccessed || [])
    ];
    
    if (allFeatures.length > 0) {
      const complexityScore = this.assessComplexityAccess(allFeatures);
      score += complexityScore;
      factorCount++;
      factors.push(`Complex features: ${allFeatures.length} (${this.scoreToLevel(complexityScore)})`);
    }

    return {
      score: factorCount > 0 ? score / factorCount : 0.25, // Default to beginner if no data
      factors
    };
  }

  /**
   * Calculate trading history-based score
   */
  private calculateTradingScore(trading: Partial<TradingHistoryData>): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;
    let factorCount = 0;

    // Trading experience
    if (trading.tradingExperienceYears !== undefined) {
      const expScore = this.normalizeMetric(
        trading.tradingExperienceYears,
        this.assessmentCriteria.trading.experience
      );
      score += expScore;
      factorCount++;
      factors.push(`Experience: ${trading.tradingExperienceYears} years (${this.scoreToLevel(expScore)})`);
    }

    // Account size
    if (trading.accountSize !== undefined) {
      const sizeScore = this.normalizeMetric(
        trading.accountSize,
        this.assessmentCriteria.trading.accountSize
      );
      score += sizeScore;
      factorCount++;
      factors.push(`Account size: $${trading.accountSize.toLocaleString()} (${this.scoreToLevel(sizeScore)})`);
    }

    // Instruments traded
    if (trading.instrumentsTraded !== undefined) {
      const instScore = this.normalizeMetric(
        trading.instrumentsTraded.length,
        this.assessmentCriteria.trading.instruments
      );
      score += instScore;
      factorCount++;
      factors.push(`Instruments: ${trading.instrumentsTraded.join(', ')} (${this.scoreToLevel(instScore)})`);
    }

    // Win rate (if available)
    if (trading.winRate !== undefined && trading.totalTrades && trading.totalTrades > 10) {
      const winScore = this.normalizeMetric(
        trading.winRate,
        this.assessmentCriteria.trading.winRate
      );
      score += winScore;
      factorCount++;
      factors.push(`Win rate: ${(trading.winRate * 100).toFixed(1)}% (${this.scoreToLevel(winScore)})`);
    }

    return {
      score: factorCount > 0 ? score / factorCount : 0.25, // Default to beginner if no data
      factors
    };
  }

  /**
   * Calculate explicit preferences score
   */
  private calculateExplicitScore(preferences: Partial<ExplicitPreferences>): { score: number; factors: string[] } {
    const factors: string[] = [];
    
    // If no explicit level, infer from other preferences
    let score = 0.25; // Default to beginner
    
    if (preferences.preferredComplexity) {
      switch (preferences.preferredComplexity) {
        case 'simple': score = 0.25; break;
        case 'moderate': score = 0.5; break;
        case 'broker': score = 0.75; break;
      }
      factors.push(`Preferred complexity: ${preferences.preferredComplexity}`);
    }

    return { score, factors };
  }

  /**
   * Normalize a metric value to a 0-1 score based on level thresholds
   */
  private normalizeMetric(value: number, thresholds: { beginner: number; intermediate: number; advanced: number }): number {
    if (value <= thresholds.beginner) return 0.25;
    if (value <= thresholds.intermediate) return 0.5;
    if (value >= thresholds.advanced) return 0.75;
    return 1.0;
  }

  /**
   * Assess complexity access level
   */
  private assessComplexityAccess(features: string[]): number {
    const { complexityAccess } = this.assessmentCriteria.behavior;
    
    const advancedMatches = features.filter(f => complexityAccess.advanced.includes(f)).length;
    const intermediateMatches = features.filter(f => complexityAccess.intermediate.includes(f)).length;
    
    if (advancedMatches > 0) return 0.75 + Math.min(advancedMatches * 0.05, 0.25);
    if (intermediateMatches > 0) return 0.5 + Math.min(intermediateMatches * 0.05, 0.25);
    return 0.25;
  }

  /**
   * Convert overall score to user level
   */
  private scoreToUserLevel(score: number): UserExperienceLevel {
    if (score < 0.4) return 'learning';
    if (score < 0.6) return 'import';
    return 'broker';
  }

  /**
   * Convert user level to score
   */
  private userLevelToScore(level: UserExperienceLevel): number {
    switch (level) {
      case 'learning': return 0.25;
      case 'import': return 0.5;
      case 'broker': return 0.75;
    }
  }

  /**
   * Convert score to readable level
   */
  private scoreToLevel(score: number): string {
    if (score < 0.4) return 'learning';
    if (score < 0.7) return 'import';
    return 'broker';
  }

  /**
   * Calculate confidence in assessment
   */
  private calculateConfidence(
    behaviorScore: { score: number; factors: string[] },
    tradingScore: { score: number; factors: string[] },
    explicitScore: { score: number; factors: string[] }
  ): number {
    const dataPoints = behaviorScore.factors.length + tradingScore.factors.length + explicitScore.factors.length;
    const maxDataPoints = 8; // Maximum expected data points
    
    const dataAvailability = Math.min(dataPoints / maxDataPoints, 1.0);
    
    // Consistency check - lower confidence if scores are very different
    const scores = [behaviorScore.score, tradingScore.score, explicitScore.score];
    const variance = this.calculateVariance(scores);
    const consistency = Math.max(0, 1 - variance * 2);
    
    return (dataAvailability * 0.7 + consistency * 0.3);
  }

  /**
   * Calculate variance of scores
   */
  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    return variance;
  }

  /**
   * Determine appropriate risk profile
   */
  private determineRiskProfile(
    userLevel: UserExperienceLevel,
    trading: Partial<TradingHistoryData>,
    preferences: Partial<ExplicitPreferences>
  ): RiskProfile {
    // Explicit preference takes priority
    if (preferences.preferredRiskLevel) {
      return this.riskProfiles[preferences.preferredRiskLevel];
    }

    // Infer from user level and trading data
    let riskLevel: string;
    
    if (userLevel === 'learning') {
      riskLevel = 'conservative';
    } else if (userLevel === 'broker') {
      // For advanced users, check if they have substantial account or experience
      if (trading.accountSize && trading.accountSize >= 100000) {
        riskLevel = 'aggressive';
      } else if (trading.tradingExperienceYears && trading.tradingExperienceYears >= 5) {
        riskLevel = 'aggressive';
      } else {
        riskLevel = 'moderate';
      }
    } else {
      riskLevel = 'moderate';
    }

    return this.riskProfiles[riskLevel];
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    userLevel: UserExperienceLevel,
    behavior: Partial<UserBehaviorMetrics>,
    trading: Partial<TradingHistoryData>
  ): string[] {
    const recommendations: string[] = [];

    if (userLevel === 'learning') {
      recommendations.push('Start with the Position Sizing tool to learn proper risk management');
      recommendations.push('Complete the Interactive Tutorial to understand key concepts');
      recommendations.push('Use the Strategy Visualizer to see how different approaches work');
      
      if (behavior.tutorialProgress && behavior.tutorialProgress < 50) {
        recommendations.push('Continue working through the tutorial - you\'re making good progress!');
      }
    } else if (userLevel === 'import') {
      recommendations.push('Explore the Options Trading tools for advanced strategies');
      recommendations.push('Use Interactive Analytics to analyze your performance');
      recommendations.push('Consider enabling VIX-adjusted position sizing');
      
      if (trading.winRate && trading.winRate < 0.5) {
        recommendations.push('Focus on improving your win rate before increasing position sizes');
      }
    } else {
      recommendations.push('Set up IBKR connection for live data integration');
      recommendations.push('Use AI Analysis for market insights');
      recommendations.push('Explore the Rule Engine for automated strategies');
      recommendations.push('Consider advanced risk management features');
    }

    return recommendations;
  }

  /**
   * Generate reasoning for the assessment
   */
  private generateReasoning(
    behaviorScore: { score: number; factors: string[] },
    tradingScore: { score: number; factors: string[] },
    explicitScore: { score: number; factors: string[] },
    userLevel: UserExperienceLevel
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Assessment determined ${userLevel} level based on:`);
    
    if (behaviorScore.factors.length > 0) {
      reasoning.push('Behavior patterns:');
      behaviorScore.factors.forEach(factor => reasoning.push(`  • ${factor}`));
    }
    
    if (tradingScore.factors.length > 0) {
      reasoning.push('Trading experience:');
      tradingScore.factors.forEach(factor => reasoning.push(`  • ${factor}`));
    }
    
    if (explicitScore.factors.length > 0) {
      reasoning.push('User preferences:');
      explicitScore.factors.forEach(factor => reasoning.push(`  • ${factor}`));
    }

    return reasoning;
  }

  /**
   * Identify potential warning flags
   */
  private identifyWarningFlags(
    behavior: Partial<UserBehaviorMetrics>,
    trading: Partial<TradingHistoryData>,
    preferences: Partial<ExplicitPreferences>
  ): string[] {
    const warnings: string[] = [];

    // High error rate warning
    if (behavior.errorRate && behavior.errorRate > 0.3) {
      warnings.push('High error rate detected - consider additional tutorials');
    }

    // Risky trading behavior
    if (trading.riskPerTrade && trading.riskPerTrade > 0.05) {
      warnings.push('Risk per trade is above recommended 5% maximum');
    }

    // Large account with beginner behavior
    if (trading.accountSize && trading.accountSize > 100000 && behavior.timeSpentInApp && behavior.timeSpentInApp < 60) {
      warnings.push('Large account with limited app usage - recommend thorough education');
    }

    // Inconsistent self-reporting
    if (preferences.selfReportedLevel === 'broker' && trading.tradingExperienceYears && trading.tradingExperienceYears < 1) {
      warnings.push('Self-reported level may not match trading experience');
    }

    return warnings;
  }

  /**
   * Determine if onboarding should be shown
   */
  private shouldShowOnboarding(userLevel: UserExperienceLevel, preferences: Partial<ExplicitPreferences>): boolean {
    if (preferences.hasCompletedOnboarding) return false;
    return userLevel === 'learning' || !preferences.selfReportedLevel;
  }

  /**
   * Get suggested features for user level
   */
  private getSuggestedFeatures(userLevel: UserExperienceLevel): string[] {
    const features = this.assessmentCriteria.behavior.complexityAccess;
    
    switch (userLevel) {
      case 'learning':
        return features.beginner;
      case 'import':
        return [...features.beginner, ...features.intermediate];
      case 'broker':
        return [...features.beginner, ...features.intermediate, ...features.advanced];
    }
  }

  /**
   * Create result for manual override
   */
  private createOverrideResult(level: UserExperienceLevel, preferences: Partial<ExplicitPreferences>): AssessmentResult {
    return {
      userLevel: level,
      confidence: 1.0,
      riskProfile: this.determineRiskProfile(level, {}, preferences),
      recommendations: [`Using manual override: ${level} level`],
      reasoning: [`User manually set experience level to ${level}`],
      shouldShowOnboarding: false,
      suggestedFeatures: this.getSuggestedFeatures(level),
      warningFlags: []
    };
  }

  /**
   * Quick assessment for new users with minimal data
   */
  quickAssessment(preferences: Partial<ExplicitPreferences>): AssessmentResult {
    const defaultBehavior: Partial<UserBehaviorMetrics> = {
      timeSpentInApp: 0,
      featuresUsed: [],
      errorRate: 0.2,
      complexFeaturesAccessed: []
    };

    const defaultTrading: Partial<TradingHistoryData> = {
      tradingExperienceYears: 0,
      totalTrades: 0,
      hasLiveTradingExperience: false
    };

    return this.assessUser(defaultBehavior, defaultTrading, preferences);
  }
}

export default UserExperienceAssessment; 