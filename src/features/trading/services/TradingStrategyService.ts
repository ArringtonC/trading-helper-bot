/**
 * Trading Strategy Database Service - Component 4
 * 
 * Comprehensive service for managing trading strategies with enterprise-grade features:
 * - Strategy recommendation based on market conditions and user profile
 * - Performance tracking and analytics integration
 * - Custom strategy support with user-defined criteria
 * - Integration with Challenge RPG system for XP rewards
 * - Market environment detection and adaptation
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { VolatilityRegime } from '../../../shared/services/MarketAnalysisService';
import { AnalyticsDataService } from '../../../shared/services/AnalyticsDataService';
import { NormalizedTradeData } from '../../../shared/types/trade';

// ===== Core Trading Strategy Types =====

export enum StrategyCategory {
  MOMENTUM = 'MOMENTUM',
  VALUE = 'VALUE', 
  GROWTH = 'GROWTH',
  SWING = 'SWING',
  SCALPING = 'SCALPING',
  MEAN_REVERSION = 'MEAN_REVERSION'
}

export enum RiskLevel {
  VERY_LOW = 'VERY_LOW',    // 0.5-1% risk per trade
  LOW = 'LOW',              // 1-2% risk per trade
  MODERATE = 'MODERATE',    // 2-3% risk per trade
  HIGH = 'HIGH',            // 3-5% risk per trade
  VERY_HIGH = 'VERY_HIGH'   // 5%+ risk per trade
}

export enum TimeHorizon {
  SCALPING = 'SCALPING',        // Minutes to hours
  DAY_TRADE = 'DAY_TRADE',      // Intraday
  SWING = 'SWING',              // Days to weeks
  POSITION = 'POSITION',        // Weeks to months
  LONG_TERM = 'LONG_TERM'       // Months to years
}

export enum MarketCondition {
  BULL_MARKET = 'BULL_MARKET',
  BEAR_MARKET = 'BEAR_MARKET',
  SIDEWAYS = 'SIDEWAYS',
  HIGH_VOLATILITY = 'HIGH_VOLATILITY',
  LOW_VOLATILITY = 'LOW_VOLATILITY',
  TRENDING = 'TRENDING',
  RANGE_BOUND = 'RANGE_BOUND'
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  category: StrategyCategory;
  
  // Risk and Performance Characteristics
  riskLevel: RiskLevel;
  timeHorizon: TimeHorizon;
  minAccountSize: number;
  winRateEstimate: number;        // 0-100 percentage
  avgProfitTarget: number;        // Average profit target %
  avgStopLoss: number;           // Average stop loss %
  profitFactor: number;          // Expected profit factor
  
  // Market Conditions
  idealMarketConditions: MarketCondition[];
  avoidMarketConditions: MarketCondition[];
  volatilityPreference: VolatilityRegime[];
  
  // Entry and Exit Criteria
  entrySignals: string[];
  exitSignals: string[];
  
  // Technical Requirements
  requiredIndicators: string[];
  optionalIndicators: string[];
  
  // User Preferences
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  timeCommitmentMinutes: number;  // Daily time commitment
  
  // Performance Tracking
  totalTrades: number;
  successfulTrades: number;
  actualWinRate: number;
  actualProfitFactor: number;
  
  // Challenge System Integration
  xpMultiplier: number;           // XP bonus for using this strategy
  skillCategories: SkillCategory[];
  difficultyRating: number;       // 1-10 difficulty scale
  
  // Custom Strategy Support
  isCustom: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Educational Content
  educationalContent?: EducationalContent;
  
  // Strategy Validation
  backtestResults?: BacktestResults;
  status: 'ACTIVE' | 'DEPRECATED' | 'TESTING' | 'CUSTOM';
}

export enum SkillCategory {
  PATIENCE = 'PATIENCE',
  RISK_MANAGEMENT = 'RISK_MANAGEMENT',
  SETUP_QUALITY = 'SETUP_QUALITY',
  STRATEGY_ADHERENCE = 'STRATEGY_ADHERENCE',
  STRESS_MANAGEMENT = 'STRESS_MANAGEMENT',
  PROFIT_PROTECTION = 'PROFIT_PROTECTION',
  DISCIPLINE_CONTROL = 'DISCIPLINE_CONTROL'
}

export interface EducationalContent {
  overview: string;
  keyPrinciples: string[];
  commonMistakes: string[];
  tips: string[];
  videoUrl?: string;
  documentationUrl?: string;
  examples: TradeExample[];
}

export interface TradeExample {
  symbol: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  reasoning: string;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN';
  profitLoss: number;
}

export interface BacktestResults {
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  calmarRatio: number;
  totalReturn: number;
  annualizedReturn: number;
}

// ===== Market Environment Detection =====

export interface MarketEnvironment {
  volatilityRegime: VolatilityRegime;
  trendDirection: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  marketCondition: MarketCondition;
  vixLevel: number;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sectorRotation: string[];
  economicCycle: 'EXPANSION' | 'PEAK' | 'CONTRACTION' | 'TROUGH';
}

// ===== User Profile Types =====

export interface UserProfile {
  userId: string;
  accountSize: number;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  riskTolerance: RiskLevel;
  timeAvailabilityMinutes: number; // Daily time available for trading
  preferredTimeframes: TimeHorizon[];
  skillLevels: Record<SkillCategory, number>; // 1-10 scale
  tradingGoals: string[];
  avoidedStrategies: string[]; // Strategy IDs to avoid
  preferredStrategies: string[]; // Strategy IDs preferred
  challengeParticipation: boolean;
  currentStrategyClass?: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
}

// ===== Strategy Recommendation Types =====

export interface StrategyRecommendation {
  strategy: TradingStrategy;
  confidenceScore: number; // 0-100 match confidence
  reasons: string[];
  warnings: string[];
  estimatedPerformance: EstimatedPerformance;
  xpPotential: number;
  difficultyMatch: boolean;
  marketConditionMatch: boolean;
  userPreferenceMatch: boolean;
}

export interface EstimatedPerformance {
  expectedWinRate: number;
  expectedProfitFactor: number;
  riskPerTrade: number;
  timeCommitment: number;
  learningCurve: 'EASY' | 'MODERATE' | 'STEEP';
}

// ===== Performance Tracking Types =====

export interface StrategyPerformance {
  strategyId: string;
  userId: string;
  startDate: Date;
  endDate?: Date;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  averageWin: number;
  averageLoss: number;
  maxWinStreak: number;
  maxLossStreak: number;
  maxDrawdown: number;
  averageHoldTime: number;
  totalCommissions: number;
  sharpeRatio?: number;
  // Challenge Integration
  totalXPEarned: number;
  skillPointsEarned: number;
  achievementsUnlocked: string[];
}

// ===== Service Events =====

export interface ServiceEvents {
  'strategy-recommended': (recommendations: StrategyRecommendation[]) => void;
  'performance-updated': (performance: StrategyPerformance) => void;
  'market-environment-changed': (environment: MarketEnvironment) => void;
  'custom-strategy-created': (strategy: TradingStrategy) => void;
  'xp-earned': (userId: string, amount: number, source: string) => void;
}

// ===== Main Trading Strategy Service =====

export class TradingStrategyService extends EventEmitter {
  private static instance: TradingStrategyService;
  private analyticsService: AnalyticsDataService;
  private strategies: Map<string, TradingStrategy> = new Map();
  private userPerformance: Map<string, StrategyPerformance[]> = new Map();
  private marketEnvironment: MarketEnvironment | null = null;

  private constructor() {
    super();
    this.analyticsService = new AnalyticsDataService();
    this.initializeStrategies();
  }

  public static getInstance(): TradingStrategyService {
    if (!TradingStrategyService.instance) {
      TradingStrategyService.instance = new TradingStrategyService();
    }
    return TradingStrategyService.instance;
  }

  // ===== Core Strategy Management =====

  /**
   * Get all available trading strategies
   */
  public getAllStrategies(): TradingStrategy[] {
    return Array.from(this.strategies.values())
      .filter(strategy => strategy.status === 'ACTIVE');
  }

  /**
   * Get strategies by category
   */
  public getStrategyByCategory(category: StrategyCategory): TradingStrategy[] {
    return this.getAllStrategies()
      .filter(strategy => strategy.category === category);
  }

  /**
   * Get strategy by ID
   */
  public getStrategyById(strategyId: string): TradingStrategy | null {
    return this.strategies.get(strategyId) || null;
  }

  // ===== Strategy Recommendation Engine =====

  /**
   * Get recommended strategies based on market conditions and user profile
   */
  public async getRecommendedStrategies(
    marketConditions: MarketEnvironment,
    userProfile: UserProfile,
    limit: number = 5
  ): Promise<StrategyRecommendation[]> {
    try {
      const allStrategies = this.getAllStrategies();
      const recommendations: StrategyRecommendation[] = [];

      for (const strategy of allStrategies) {
        const recommendation = await this.calculateStrategyMatch(
          strategy,
          marketConditions,
          userProfile
        );
        
        if (recommendation.confidenceScore > 30) { // Minimum threshold
          recommendations.push(recommendation);
        }
      }

      // Sort by confidence score and return top recommendations
      const sortedRecommendations = recommendations
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, limit);

      this.emit('strategy-recommended', sortedRecommendations);
      return sortedRecommendations;

    } catch (error) {
      console.error('[TradingStrategyService] Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate strategy match score for a given strategy, market conditions, and user profile
   */
  private async calculateStrategyMatch(
    strategy: TradingStrategy,
    marketConditions: MarketEnvironment,
    userProfile: UserProfile
  ): Promise<StrategyRecommendation> {
    let confidenceScore = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Market Condition Matching (40% weight)
    const marketMatch = this.calculateMarketMatch(strategy, marketConditions);
    confidenceScore += marketMatch.score * 0.4;
    reasons.push(...marketMatch.reasons);
    warnings.push(...marketMatch.warnings);

    // User Profile Matching (35% weight) 
    const userMatch = this.calculateUserMatch(strategy, userProfile);
    confidenceScore += userMatch.score * 0.35;
    reasons.push(...userMatch.reasons);
    warnings.push(...userMatch.warnings);

    // Historical Performance (25% weight)
    const performanceMatch = await this.calculatePerformanceMatch(strategy, userProfile.userId);
    confidenceScore += performanceMatch.score * 0.25;
    reasons.push(...performanceMatch.reasons);

    // Calculate XP potential based on difficulty and user skill
    const xpPotential = this.calculateXPPotential(strategy, userProfile);

    // Estimated performance based on historical data and user profile
    const estimatedPerformance = this.calculateEstimatedPerformance(strategy, userProfile);

    return {
      strategy,
      confidenceScore: Math.round(confidenceScore),
      reasons,
      warnings,
      estimatedPerformance,
      xpPotential,
      difficultyMatch: this.isDifficultyMatch(strategy, userProfile),
      marketConditionMatch: marketMatch.score > 70,
      userPreferenceMatch: userMatch.score > 70
    };
  }

  private calculateMarketMatch(
    strategy: TradingStrategy,
    marketConditions: MarketEnvironment
  ): { score: number; reasons: string[]; warnings: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Check ideal market conditions
    const idealMatch = strategy.idealMarketConditions.includes(marketConditions.marketCondition);
    if (idealMatch) {
      score += 60;
      reasons.push(`Ideal for ${marketConditions.marketCondition.toLowerCase()} conditions`);
    }

    // Check volatility preference
    const volatilityMatch = strategy.volatilityPreference.includes(marketConditions.volatilityRegime);
    if (volatilityMatch) {
      score += 30;
      reasons.push(`Optimized for ${marketConditions.volatilityRegime.toLowerCase()} volatility`);
    } else {
      score -= 20;
      warnings.push(`Not optimized for ${marketConditions.volatilityRegime.toLowerCase()} volatility`);
    }

    // Check avoided conditions
    const avoidMatch = strategy.avoidMarketConditions.includes(marketConditions.marketCondition);
    if (avoidMatch) {
      score -= 40;
      warnings.push(`Should avoid ${marketConditions.marketCondition.toLowerCase()} conditions`);
    }

    // VIX level considerations
    if (marketConditions.vixLevel > 30 && strategy.riskLevel === RiskLevel.VERY_HIGH) {
      score -= 20;
      warnings.push('High VIX suggests reducing risk exposure');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons, warnings };
  }

  private calculateUserMatch(
    strategy: TradingStrategy,
    userProfile: UserProfile
  ): { score: number; reasons: string[]; warnings: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Account size matching
    if (userProfile.accountSize >= strategy.minAccountSize) {
      score += 20;
      reasons.push('Meets minimum account size requirements');
    } else {
      score -= 30;
      warnings.push(`Requires minimum account size of $${strategy.minAccountSize.toLocaleString()}`);
    }

    // Risk tolerance matching
    const riskMatch = this.getRiskLevelScore(strategy.riskLevel, userProfile.riskTolerance);
    score += riskMatch * 0.25;
    if (riskMatch > 80) {
      reasons.push('Risk level matches your tolerance');
    } else if (riskMatch < 40) {
      warnings.push('Risk level may not match your tolerance');
    }

    // Time availability matching
    if (userProfile.timeAvailabilityMinutes >= strategy.timeCommitmentMinutes) {
      score += 15;
      reasons.push('Time commitment fits your schedule');
    } else {
      score -= 20;
      warnings.push(`Requires ${strategy.timeCommitmentMinutes} minutes daily`);
    }

    // Experience level matching
    const experienceMatch = this.getExperienceLevelScore(strategy.skillLevel, userProfile.experienceLevel);
    score += experienceMatch * 0.20;
    if (experienceMatch > 80) {
      reasons.push('Difficulty level matches your experience');
    } else if (experienceMatch < 40) {
      warnings.push('Strategy may be too complex for current experience level');
    }

    // Preferred strategies
    if (userProfile.preferredStrategies.includes(strategy.id)) {
      score += 25;
      reasons.push('Matches your preferred strategies');
    }

    // Avoided strategies
    if (userProfile.avoidedStrategies.includes(strategy.id)) {
      score -= 50;
      warnings.push('You have marked this strategy to avoid');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons, warnings };
  }

  private async calculatePerformanceMatch(
    strategy: TradingStrategy,
    userId: string
  ): Promise<{ score: number; reasons: string[] }> {
    const userPerformances = this.userPerformance.get(userId) || [];
    const strategyPerformance = userPerformances.find(p => p.strategyId === strategy.id);
    
    const reasons: string[] = [];
    let score = 50; // Default neutral score

    if (strategyPerformance) {
      // Adjust score based on historical performance
      if (strategyPerformance.winRate > strategy.winRateEstimate) {
        score += 30;
        reasons.push(`Your historical win rate (${strategyPerformance.winRate.toFixed(1)}%) exceeds estimate`);
      } else if (strategyPerformance.winRate < strategy.winRateEstimate * 0.7) {
        score -= 20;
        reasons.push(`Your historical win rate (${strategyPerformance.winRate.toFixed(1)}%) is below expectations`);
      }

      if (strategyPerformance.profitFactor > 1.5) {
        score += 20;
        reasons.push('Strong historical profit factor');
      } else if (strategyPerformance.profitFactor < 1.0) {
        score -= 30;
        reasons.push('Historical losses with this strategy');
      }
    } else {
      // No historical data - slight preference for new strategies to encourage learning
      score += 10;
      reasons.push('New strategy - opportunity to learn and earn XP');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  // ===== Market Environment Detection =====

  /**
   * Detect current market environment
   */
  public async detectMarketEnvironment(): Promise<MarketEnvironment> {
    try {
      // This would typically integrate with real market data APIs
      // For now, we'll use mock data and basic calculations
      
      const mockEnvironment: MarketEnvironment = {
        volatilityRegime: VolatilityRegime.MEDIUM,
        trendDirection: 'UPTREND',
        marketCondition: MarketCondition.BULL_MARKET,
        vixLevel: 18.5,
        marketSentiment: 'BULLISH',
        sectorRotation: ['Technology', 'Healthcare'],
        economicCycle: 'EXPANSION'
      };

      this.marketEnvironment = mockEnvironment;
      this.emit('market-environment-changed', mockEnvironment);
      
      return mockEnvironment;
    } catch (error) {
      console.error('[TradingStrategyService] Error detecting market environment:', error);
      throw error;
    }
  }

  // ===== Custom Strategy Management =====

  /**
   * Add a custom user-defined strategy
   */
  public async addCustomStrategy(
    strategy: Omit<TradingStrategy, 'id' | 'createdAt' | 'updatedAt' | 'isCustom'>
  ): Promise<TradingStrategy> {
    try {
      const customStrategy: TradingStrategy = {
        ...strategy,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isCustom: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'CUSTOM'
      };

      this.strategies.set(customStrategy.id, customStrategy);
      this.emit('custom-strategy-created', customStrategy);

      return customStrategy;
    } catch (error) {
      console.error('[TradingStrategyService] Error adding custom strategy:', error);
      throw error;
    }
  }

  // ===== Performance Tracking =====

  /**
   * Update strategy performance based on trade data
   */
  public async updateStrategyPerformance(
    strategyId: string,
    userId: string,
    trades: NormalizedTradeData[]
  ): Promise<void> {
    try {
      const strategy = this.strategies.get(strategyId);
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`);
      }

      const performance = this.calculatePerformanceMetrics(trades, strategyId, userId);
      
      // Update or create performance record
      const userPerformances = this.userPerformance.get(userId) || [];
      const existingIndex = userPerformances.findIndex(p => p.strategyId === strategyId);
      
      if (existingIndex >= 0) {
        userPerformances[existingIndex] = performance;
      } else {
        userPerformances.push(performance);
      }
      
      this.userPerformance.set(userId, userPerformances);

      // Update strategy's aggregate performance
      strategy.totalTrades = performance.totalTrades;
      strategy.successfulTrades = performance.winningTrades;
      strategy.actualWinRate = performance.winRate;
      strategy.actualProfitFactor = performance.profitFactor;
      strategy.updatedAt = new Date();

      // Award XP for strategy usage
      const xpEarned = this.calculateXPForPerformance(performance, strategy);
      if (xpEarned > 0) {
        this.emit('xp-earned', userId, xpEarned, `Strategy: ${strategy.name}`);
      }

      this.emit('performance-updated', performance);
      
    } catch (error) {
      console.error('[TradingStrategyService] Error updating performance:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for a user and strategy
   */
  public getStrategyPerformance(userId: string, strategyId?: string): StrategyPerformance[] {
    const userPerformances = this.userPerformance.get(userId) || [];
    
    if (strategyId) {
      return userPerformances.filter(p => p.strategyId === strategyId);
    }
    
    return userPerformances;
  }

  // ===== Helper Methods =====

  private getRiskLevelScore(strategyRisk: RiskLevel, userRisk: RiskLevel): number {
    const riskLevels = [RiskLevel.VERY_LOW, RiskLevel.LOW, RiskLevel.MODERATE, RiskLevel.HIGH, RiskLevel.VERY_HIGH];
    const strategyIndex = riskLevels.indexOf(strategyRisk);
    const userIndex = riskLevels.indexOf(userRisk);
    
    const difference = Math.abs(strategyIndex - userIndex);
    return Math.max(0, 100 - (difference * 25));
  }

  private getExperienceLevelScore(strategyLevel: string, userLevel: string): number {
    const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
    const strategyIndex = levels.indexOf(strategyLevel);
    const userIndex = levels.indexOf(userLevel);
    
    if (userIndex >= strategyIndex) {
      return 100; // User can handle this strategy
    } else {
      const difference = strategyIndex - userIndex;
      return Math.max(20, 100 - (difference * 30)); // Penalty for too advanced
    }
  }

  private isDifficultyMatch(strategy: TradingStrategy, userProfile: UserProfile): boolean {
    const userSkillAverage = Object.values(userProfile.skillLevels).reduce((a, b) => a + b, 0) / 
                            Object.values(userProfile.skillLevels).length;
    
    return Math.abs(strategy.difficultyRating - userSkillAverage) <= 2;
  }

  private calculateXPPotential(strategy: TradingStrategy, userProfile: UserProfile): number {
    const baseXP = strategy.difficultyRating * 10;
    const multiplier = strategy.xpMultiplier;
    const challengeBonus = userProfile.challengeParticipation ? 1.5 : 1.0;
    
    return Math.round(baseXP * multiplier * challengeBonus);
  }

  private calculateEstimatedPerformance(
    strategy: TradingStrategy,
    userProfile: UserProfile
  ): EstimatedPerformance {
    // Adjust expected performance based on user skill level
    const skillAdjustment = this.getSkillAdjustment(strategy, userProfile);
    
    return {
      expectedWinRate: Math.max(20, strategy.winRateEstimate * skillAdjustment),
      expectedProfitFactor: Math.max(0.5, strategy.profitFactor * skillAdjustment),
      riskPerTrade: this.getRiskPerTradeForLevel(strategy.riskLevel),
      timeCommitment: strategy.timeCommitmentMinutes,
      learningCurve: this.getLearningCurve(strategy, userProfile)
    };
  }

  private getSkillAdjustment(strategy: TradingStrategy, userProfile: UserProfile): number {
    const relevantSkills = strategy.skillCategories.map(cat => userProfile.skillLevels[cat] || 5);
    const averageSkill = relevantSkills.reduce((a, b) => a + b, 0) / relevantSkills.length;
    
    // Skill adjustment factor: 0.7 to 1.3 based on skill level (1-10 scale)
    return 0.7 + (averageSkill - 1) * 0.067;
  }

  private getRiskPerTradeForLevel(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case RiskLevel.VERY_LOW: return 0.75;
      case RiskLevel.LOW: return 1.5;
      case RiskLevel.MODERATE: return 2.5;
      case RiskLevel.HIGH: return 4.0;
      case RiskLevel.VERY_HIGH: return 6.0;
      default: return 2.0;
    }
  }

  private getLearningCurve(strategy: TradingStrategy, userProfile: UserProfile): 'EASY' | 'MODERATE' | 'STEEP' {
    const difficulty = strategy.difficultyRating;
    const userExperience = userProfile.experienceLevel;
    
    if (difficulty <= 3 || userExperience === 'EXPERT') return 'EASY';
    if (difficulty <= 6 || userExperience === 'ADVANCED') return 'MODERATE';
    return 'STEEP';
  }

  private calculatePerformanceMetrics(
    trades: NormalizedTradeData[],
    strategyId: string,
    userId: string
  ): StrategyPerformance {
    const winningTrades = trades.filter(t => t.netAmount > 0).length;
    const losingTrades = trades.filter(t => t.netAmount < 0).length;
    const breakEvenTrades = trades.filter(t => t.netAmount === 0).length;
    
    const totalPnL = trades.reduce((sum, t) => sum + t.netAmount, 0);
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
    
    const wins = trades.filter(t => t.netAmount > 0).map(t => t.netAmount);
    const losses = trades.filter(t => t.netAmount < 0).map(t => Math.abs(t.netAmount));
    
    const averageWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const averageLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    
    const profitFactor = averageLoss > 0 ? (averageWin * winningTrades) / (averageLoss * losingTrades) : 0;

    return {
      strategyId,
      userId,
      startDate: new Date(Math.min(...trades.map(t => new Date(t.tradeDate).getTime()))),
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      breakEvenTrades,
      winRate,
      profitFactor,
      totalPnL,
      averageWin,
      averageLoss,
      maxWinStreak: this.calculateMaxStreak(trades, true),
      maxLossStreak: this.calculateMaxStreak(trades, false),
      maxDrawdown: this.calculateMaxDrawdown(trades),
      averageHoldTime: this.calculateAverageHoldTime(trades),
      totalCommissions: trades.reduce((sum, t) => sum + (t.commission || 0), 0),
      totalXPEarned: 0, // Will be calculated separately
      skillPointsEarned: 0,
      achievementsUnlocked: []
    };
  }

  private calculateMaxStreak(trades: NormalizedTradeData[], isWinStreak: boolean): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const trade of trades) {
      const isWin = trade.netAmount > 0;
      if (isWin === isWinStreak) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }

  private calculateMaxDrawdown(trades: NormalizedTradeData[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    
    for (const trade of trades) {
      runningPnL += trade.netAmount;
      peak = Math.max(peak, runningPnL);
      const drawdown = peak - runningPnL;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }

  private calculateAverageHoldTime(trades: NormalizedTradeData[]): number {
    const holdTimes = trades
      .filter(t => t.settleDate || t.expiryDate)
      .map(t => {
        const exitDate = new Date(t.settleDate || t.expiryDate || t.tradeDate);
        const entryDate = new Date(t.tradeDate);
        return exitDate.getTime() - entryDate.getTime();
      });
    
    if (holdTimes.length === 0) return 0;
    
    const averageMs = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;
    return averageMs / (1000 * 60 * 60 * 24); // Convert to days
  }

  private calculateXPForPerformance(performance: StrategyPerformance, strategy: TradingStrategy): number {
    let xp = 0;
    
    // Base XP for trades
    xp += performance.totalTrades * 10;
    
    // Bonus for winning trades
    xp += performance.winningTrades * 25;
    
    // Strategy difficulty multiplier
    xp *= strategy.xpMultiplier;
    
    // Performance bonuses
    if (performance.winRate > 60) xp += 50;
    if (performance.profitFactor > 1.5) xp += 100;
    if (performance.totalPnL > 0) xp += Math.floor(performance.totalPnL * 0.1);
    
    return Math.round(xp);
  }

  // ===== Strategy Initialization =====

  private initializeStrategies(): void {
    // Initialize with mock strategies across all categories
    const mockStrategies = this.getMockStrategies();
    
    mockStrategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
    
    console.log(`[TradingStrategyService] Initialized with ${mockStrategies.length} strategies`);
  }

  private getMockStrategies(): TradingStrategy[] {
    const now = new Date();
    
    return [
      // MOMENTUM STRATEGIES
      {
        id: 'momentum-breakout-basic',
        name: 'Momentum Breakout - Basic',
        description: 'Trade stocks breaking out of key resistance levels with strong volume',
        category: StrategyCategory.MOMENTUM,
        riskLevel: RiskLevel.MODERATE,
        timeHorizon: TimeHorizon.SWING,
        minAccountSize: 5000,
        winRateEstimate: 45,
        avgProfitTarget: 8,
        avgStopLoss: 4,
        profitFactor: 1.8,
        idealMarketConditions: [MarketCondition.BULL_MARKET, MarketCondition.TRENDING],
        avoidMarketConditions: [MarketCondition.SIDEWAYS],
        volatilityPreference: [VolatilityRegime.MEDIUM, VolatilityRegime.HIGH],
        entrySignals: ['Price breaks above resistance', 'Volume > 1.5x average', 'RSI > 50'],
        exitSignals: ['8% profit target', '4% stop loss', 'Volume decline'],
        requiredIndicators: ['Volume', 'Support/Resistance'],
        optionalIndicators: ['RSI', 'MACD'],
        skillLevel: 'INTERMEDIATE',
        timeCommitmentMinutes: 45,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.2,
        skillCategories: [SkillCategory.SETUP_QUALITY, SkillCategory.RISK_MANAGEMENT],
        difficultyRating: 5,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE',
        educationalContent: {
          overview: 'Momentum breakout strategy focuses on capturing strong moves when stocks break through key resistance levels.',
          keyPrinciples: [
            'Only trade breakouts with strong volume confirmation',
            'Set stop losses below breakout level',
            'Take profits at predetermined targets',
            'Avoid trading in sideways markets'
          ],
          commonMistakes: [
            'Chasing breakouts without volume',
            'Not setting stop losses',
            'Trading in low volatility environments'
          ],
          tips: [
            'Wait for volume confirmation before entry',
            'Use market scanners to find breakout candidates',
            'Practice on paper first'
          ],
          examples: [
            {
              symbol: 'AAPL',
              entryDate: '2024-01-15',
              entryPrice: 185.50,
              exitDate: '2024-01-22',
              exitPrice: 200.25,
              reasoning: 'Clean breakout above $185 resistance with 2x volume',
              outcome: 'WIN',
              profitLoss: 1475
            }
          ]
        }
      },
      
      {
        id: 'momentum-trend-following',
        name: 'Trend Following Momentum',
        description: 'Ride strong trends using moving average crossovers and momentum indicators',
        category: StrategyCategory.MOMENTUM,
        riskLevel: RiskLevel.MODERATE,
        timeHorizon: TimeHorizon.SWING,
        minAccountSize: 10000,
        winRateEstimate: 40,
        avgProfitTarget: 12,
        avgStopLoss: 6,
        profitFactor: 2.0,
        idealMarketConditions: [MarketCondition.BULL_MARKET, MarketCondition.TRENDING],
        avoidMarketConditions: [MarketCondition.SIDEWAYS, MarketCondition.BEAR_MARKET],
        volatilityPreference: [VolatilityRegime.MEDIUM, VolatilityRegime.HIGH],
        entrySignals: ['20 EMA > 50 EMA', 'Price > 20 EMA', 'ADX > 25'],
        exitSignals: ['12% profit target', '6% stop loss', '20 EMA crosses below 50 EMA'],
        requiredIndicators: ['EMA 20', 'EMA 50', 'ADX'],
        optionalIndicators: ['MACD', 'Volume'],
        skillLevel: 'INTERMEDIATE',
        timeCommitmentMinutes: 30,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.3,
        skillCategories: [SkillCategory.STRATEGY_ADHERENCE, SkillCategory.PATIENCE],
        difficultyRating: 6,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      // VALUE STRATEGIES
      {
        id: 'value-pe-screening',
        name: 'P/E Value Screening',
        description: 'Buy undervalued stocks with low P/E ratios and strong fundamentals',
        category: StrategyCategory.VALUE,
        riskLevel: RiskLevel.LOW,
        timeHorizon: TimeHorizon.LONG_TERM,
        minAccountSize: 25000,
        winRateEstimate: 65,
        avgProfitTarget: 25,
        avgStopLoss: 15,
        profitFactor: 2.5,
        idealMarketConditions: [MarketCondition.BEAR_MARKET, MarketCondition.SIDEWAYS],
        avoidMarketConditions: [MarketCondition.HIGH_VOLATILITY],
        volatilityPreference: [VolatilityRegime.LOW, VolatilityRegime.MEDIUM],
        entrySignals: ['P/E < 15', 'PEG < 1.0', 'Debt/Equity < 0.5'],
        exitSignals: ['25% profit target', '15% stop loss', 'P/E > 20'],
        requiredIndicators: ['P/E Ratio', 'PEG Ratio', 'Debt/Equity'],
        optionalIndicators: ['ROE', 'Free Cash Flow'],
        skillLevel: 'ADVANCED',
        timeCommitmentMinutes: 60,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.5,
        skillCategories: [SkillCategory.PATIENCE, SkillCategory.SETUP_QUALITY],
        difficultyRating: 7,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      // GROWTH STRATEGIES
      {
        id: 'growth-earnings-momentum',
        name: 'Earnings Growth Momentum',
        description: 'Target stocks with accelerating earnings growth and strong fundamentals',
        category: StrategyCategory.GROWTH,
        riskLevel: RiskLevel.HIGH,
        timeHorizon: TimeHorizon.POSITION,
        minAccountSize: 15000,
        winRateEstimate: 55,
        avgProfitTarget: 20,
        avgStopLoss: 8,
        profitFactor: 2.2,
        idealMarketConditions: [MarketCondition.BULL_MARKET, MarketCondition.TRENDING],
        avoidMarketConditions: [MarketCondition.BEAR_MARKET],
        volatilityPreference: [VolatilityRegime.MEDIUM, VolatilityRegime.HIGH],
        entrySignals: ['EPS growth > 25%', 'Revenue growth > 20%', 'Earnings surprise > 5%'],
        exitSignals: ['20% profit target', '8% stop loss', 'Earnings guidance cut'],
        requiredIndicators: ['EPS Growth', 'Revenue Growth', 'Earnings Surprise'],
        optionalIndicators: ['PEG Ratio', 'Price/Sales'],
        skillLevel: 'INTERMEDIATE',
        timeCommitmentMinutes: 40,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.4,
        skillCategories: [SkillCategory.SETUP_QUALITY, SkillCategory.RISK_MANAGEMENT],
        difficultyRating: 6,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      // SWING STRATEGIES
      {
        id: 'swing-support-resistance',
        name: 'Support/Resistance Swing',
        description: 'Swing trade between key support and resistance levels',
        category: StrategyCategory.SWING,
        riskLevel: RiskLevel.MODERATE,
        timeHorizon: TimeHorizon.SWING,
        minAccountSize: 10000,
        winRateEstimate: 58,
        avgProfitTarget: 6,
        avgStopLoss: 3,
        profitFactor: 1.9,
        idealMarketConditions: [MarketCondition.SIDEWAYS, MarketCondition.RANGE_BOUND],
        avoidMarketConditions: [MarketCondition.HIGH_VOLATILITY],
        volatilityPreference: [VolatilityRegime.LOW, VolatilityRegime.MEDIUM],
        entrySignals: ['Price bounces off support', 'RSI < 30 at support', 'Volume confirmation'],
        exitSignals: ['6% profit target', '3% stop loss', 'Resistance break'],
        requiredIndicators: ['Support/Resistance', 'RSI', 'Volume'],
        optionalIndicators: ['Bollinger Bands', 'Stochastic'],
        skillLevel: 'BEGINNER',
        timeCommitmentMinutes: 25,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.1,
        skillCategories: [SkillCategory.SETUP_QUALITY, SkillCategory.PATIENCE],
        difficultyRating: 4,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      // SCALPING STRATEGIES
      {
        id: 'scalping-5min-momentum',
        name: '5-Minute Momentum Scalping',
        description: 'Quick scalps on 5-minute momentum moves with tight stops',
        category: StrategyCategory.SCALPING,
        riskLevel: RiskLevel.HIGH,
        timeHorizon: TimeHorizon.SCALPING,
        minAccountSize: 25000,
        winRateEstimate: 62,
        avgProfitTarget: 0.5,
        avgStopLoss: 0.3,
        profitFactor: 1.6,
        idealMarketConditions: [MarketCondition.HIGH_VOLATILITY, MarketCondition.TRENDING],
        avoidMarketConditions: [MarketCondition.SIDEWAYS, MarketCondition.LOW_VOLATILITY],
        volatilityPreference: [VolatilityRegime.HIGH],
        entrySignals: ['5-min momentum surge', 'Volume spike', 'Clean level break'],
        exitSignals: ['0.5% profit target', '0.3% stop loss', 'Momentum fades'],
        requiredIndicators: ['5-Min Chart', 'Volume', 'Level 2 Data'],
        optionalIndicators: ['VWAP', 'Tape Reading'],
        skillLevel: 'EXPERT',
        timeCommitmentMinutes: 180,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 2.0,
        skillCategories: [SkillCategory.STRESS_MANAGEMENT, SkillCategory.DISCIPLINE_CONTROL],
        difficultyRating: 9,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      // MEAN REVERSION STRATEGIES
      {
        id: 'mean-reversion-rsi',
        name: 'RSI Mean Reversion',
        description: 'Buy oversold conditions and sell overbought using RSI signals',
        category: StrategyCategory.MEAN_REVERSION,
        riskLevel: RiskLevel.MODERATE,
        timeHorizon: TimeHorizon.DAY_TRADE,
        minAccountSize: 8000,
        winRateEstimate: 68,
        avgProfitTarget: 3,
        avgStopLoss: 2,
        profitFactor: 1.7,
        idealMarketConditions: [MarketCondition.SIDEWAYS, MarketCondition.RANGE_BOUND],
        avoidMarketConditions: [MarketCondition.TRENDING, MarketCondition.HIGH_VOLATILITY],
        volatilityPreference: [VolatilityRegime.LOW, VolatilityRegime.MEDIUM],
        entrySignals: ['RSI < 30', 'Price at support', 'Bullish divergence'],
        exitSignals: ['3% profit target', '2% stop loss', 'RSI > 70'],
        requiredIndicators: ['RSI', 'Support/Resistance'],
        optionalIndicators: ['Bollinger Bands', 'Stochastic'],
        skillLevel: 'INTERMEDIATE',
        timeCommitmentMinutes: 35,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.2,
        skillCategories: [SkillCategory.PATIENCE, SkillCategory.SETUP_QUALITY],
        difficultyRating: 5,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      // Additional strategies for comprehensive coverage...
      {
        id: 'momentum-gap-up',
        name: 'Gap-Up Momentum Play',
        description: 'Trade stocks gapping up on news with strong follow-through',
        category: StrategyCategory.MOMENTUM,
        riskLevel: RiskLevel.HIGH,
        timeHorizon: TimeHorizon.DAY_TRADE,
        minAccountSize: 15000,
        winRateEstimate: 48,
        avgProfitTarget: 10,
        avgStopLoss: 5,
        profitFactor: 1.9,
        idealMarketConditions: [MarketCondition.BULL_MARKET, MarketCondition.HIGH_VOLATILITY],
        avoidMarketConditions: [MarketCondition.LOW_VOLATILITY],
        volatilityPreference: [VolatilityRegime.HIGH],
        entrySignals: ['Gap up > 3%', 'High volume', 'News catalyst'],
        exitSignals: ['10% profit target', '5% stop loss', 'Volume decline'],
        requiredIndicators: ['Gap Analysis', 'Volume', 'News Flow'],
        optionalIndicators: ['VWAP', 'Relative Volume'],
        skillLevel: 'ADVANCED',
        timeCommitmentMinutes: 90,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.8,
        skillCategories: [SkillCategory.SETUP_QUALITY, SkillCategory.STRESS_MANAGEMENT],
        difficultyRating: 8,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      {
        id: 'value-dividend-growth',
        name: 'Dividend Growth Value',
        description: 'Invest in undervalued dividend-growing companies',
        category: StrategyCategory.VALUE,
        riskLevel: RiskLevel.VERY_LOW,
        timeHorizon: TimeHorizon.LONG_TERM,
        minAccountSize: 50000,
        winRateEstimate: 75,
        avgProfitTarget: 30,
        avgStopLoss: 20,
        profitFactor: 3.0,
        idealMarketConditions: [MarketCondition.BEAR_MARKET, MarketCondition.SIDEWAYS],
        avoidMarketConditions: [MarketCondition.HIGH_VOLATILITY],
        volatilityPreference: [VolatilityRegime.LOW],
        entrySignals: ['Dividend yield > 3%', '10-year dividend growth', 'P/E < sector avg'],
        exitSignals: ['30% profit target', '20% stop loss', 'Dividend cut'],
        requiredIndicators: ['Dividend Yield', 'Dividend Growth Rate', 'Payout Ratio'],
        optionalIndicators: ['Free Cash Flow', 'Debt/Equity'],
        skillLevel: 'BEGINNER',
        timeCommitmentMinutes: 20,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.0,
        skillCategories: [SkillCategory.PATIENCE, SkillCategory.PROFIT_PROTECTION],
        difficultyRating: 3,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      {
        id: 'growth-small-cap-breakout',
        name: 'Small Cap Growth Breakout',
        description: 'Target small-cap growth stocks breaking out of consolidation',
        category: StrategyCategory.GROWTH,
        riskLevel: RiskLevel.VERY_HIGH,
        timeHorizon: TimeHorizon.POSITION,
        minAccountSize: 20000,
        winRateEstimate: 42,
        avgProfitTarget: 35,
        avgStopLoss: 12,
        profitFactor: 2.4,
        idealMarketConditions: [MarketCondition.BULL_MARKET, MarketCondition.HIGH_VOLATILITY],
        avoidMarketConditions: [MarketCondition.BEAR_MARKET, MarketCondition.LOW_VOLATILITY],
        volatilityPreference: [VolatilityRegime.HIGH],
        entrySignals: ['Market cap < $2B', 'Breakout from base', 'Volume surge'],
        exitSignals: ['35% profit target', '12% stop loss', 'Volume exhaustion'],
        requiredIndicators: ['Market Cap', 'Chart Patterns', 'Relative Volume'],
        optionalIndicators: ['Revenue Growth', 'Insider Buying'],
        skillLevel: 'EXPERT',
        timeCommitmentMinutes: 50,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 2.2,
        skillCategories: [SkillCategory.RISK_MANAGEMENT, SkillCategory.STRESS_MANAGEMENT],
        difficultyRating: 9,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      {
        id: 'swing-earnings-reaction',
        name: 'Earnings Reaction Swing',
        description: 'Swing trade post-earnings reactions based on guidance and results',
        category: StrategyCategory.SWING,
        riskLevel: RiskLevel.HIGH,
        timeHorizon: TimeHorizon.SWING,
        minAccountSize: 12000,
        winRateEstimate: 52,
        avgProfitTarget: 15,
        avgStopLoss: 8,
        profitFactor: 1.95,
        idealMarketConditions: [MarketCondition.BULL_MARKET, MarketCondition.BEAR_MARKET],
        avoidMarketConditions: [MarketCondition.LOW_VOLATILITY],
        volatilityPreference: [VolatilityRegime.MEDIUM, VolatilityRegime.HIGH],
        entrySignals: ['Earnings beat', 'Guidance raise', 'Analyst upgrades'],
        exitSignals: ['15% profit target', '8% stop loss', 'Momentum fades'],
        requiredIndicators: ['Earnings Calendar', 'Analyst Estimates', 'Options Flow'],
        optionalIndicators: ['Earnings Surprise History', 'Sector Performance'],
        skillLevel: 'ADVANCED',
        timeCommitmentMinutes: 55,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.6,
        skillCategories: [SkillCategory.SETUP_QUALITY, SkillCategory.RISK_MANAGEMENT],
        difficultyRating: 7,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      {
        id: 'scalping-tape-reading',
        name: 'Level 2 Tape Reading Scalp',
        description: 'Advanced scalping using Level 2 data and tape reading skills',
        category: StrategyCategory.SCALPING,
        riskLevel: RiskLevel.VERY_HIGH,
        timeHorizon: TimeHorizon.SCALPING,
        minAccountSize: 50000,
        winRateEstimate: 72,
        avgProfitTarget: 0.3,
        avgStopLoss: 0.2,
        profitFactor: 1.8,
        idealMarketConditions: [MarketCondition.HIGH_VOLATILITY, MarketCondition.TRENDING],
        avoidMarketConditions: [MarketCondition.LOW_VOLATILITY, MarketCondition.SIDEWAYS],
        volatilityPreference: [VolatilityRegime.HIGH],
        entrySignals: ['Level 2 absorption', 'Tape showing strength', 'Momentum shift'],
        exitSignals: ['0.3% profit target', '0.2% stop loss', 'Tape weakness'],
        requiredIndicators: ['Level 2 Data', 'Time & Sales', 'Order Flow'],
        optionalIndicators: ['VWAP', 'Market Depth'],
        skillLevel: 'EXPERT',
        timeCommitmentMinutes: 240,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 2.5,
        skillCategories: [SkillCategory.DISCIPLINE_CONTROL, SkillCategory.STRESS_MANAGEMENT],
        difficultyRating: 10,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      {
        id: 'mean-reversion-bollinger',
        name: 'Bollinger Band Mean Reversion',
        description: 'Trade bounces off Bollinger Band extremes in ranging markets',
        category: StrategyCategory.MEAN_REVERSION,
        riskLevel: RiskLevel.LOW,
        timeHorizon: TimeHorizon.DAY_TRADE,
        minAccountSize: 6000,
        winRateEstimate: 73,
        avgProfitTarget: 2.5,
        avgStopLoss: 1.5,
        profitFactor: 1.8,
        idealMarketConditions: [MarketCondition.SIDEWAYS, MarketCondition.LOW_VOLATILITY],
        avoidMarketConditions: [MarketCondition.TRENDING, MarketCondition.HIGH_VOLATILITY],
        volatilityPreference: [VolatilityRegime.LOW],
        entrySignals: ['Price at lower BB', 'RSI < 30', 'Support confluence'],
        exitSignals: ['2.5% profit target', '1.5% stop loss', 'Upper BB reach'],
        requiredIndicators: ['Bollinger Bands', 'RSI'],
        optionalIndicators: ['Stochastic', 'Williams %R'],
        skillLevel: 'BEGINNER',
        timeCommitmentMinutes: 30,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.0,
        skillCategories: [SkillCategory.PATIENCE, SkillCategory.SETUP_QUALITY],
        difficultyRating: 3,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      // Challenge System Integration Strategies
      {
        id: 'challenge-buffett-guardian',
        name: 'Buffett Guardian (Challenge)',
        description: 'Patient value investing approach with defensive position sizing',
        category: StrategyCategory.VALUE,
        riskLevel: RiskLevel.LOW,
        timeHorizon: TimeHorizon.LONG_TERM,
        minAccountSize: 30000,
        winRateEstimate: 70,
        avgProfitTarget: 20,
        avgStopLoss: 10,
        profitFactor: 2.8,
        idealMarketConditions: [MarketCondition.BEAR_MARKET, MarketCondition.SIDEWAYS],
        avoidMarketConditions: [MarketCondition.HIGH_VOLATILITY],
        volatilityPreference: [VolatilityRegime.LOW, VolatilityRegime.MEDIUM],
        entrySignals: ['Strong moat', 'P/E < 15', 'Consistent earnings'],
        exitSignals: ['20% profit target', '10% stop loss', 'Fundamentals deteriorate'],
        requiredIndicators: ['P/E Ratio', 'ROE', 'Debt/Equity'],
        optionalIndicators: ['Free Cash Flow', 'Dividend Yield'],
        skillLevel: 'INTERMEDIATE',
        timeCommitmentMinutes: 40,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 1.8,
        skillCategories: [SkillCategory.PATIENCE, SkillCategory.PROFIT_PROTECTION],
        difficultyRating: 5,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      },

      {
        id: 'challenge-soros-assassin',
        name: 'Soros Assassin (Challenge)',
        description: 'High-conviction contrarian plays with aggressive position sizing',
        category: StrategyCategory.MOMENTUM,
        riskLevel: RiskLevel.VERY_HIGH,
        timeHorizon: TimeHorizon.SWING,
        minAccountSize: 40000,
        winRateEstimate: 35,
        avgProfitTarget: 25,
        avgStopLoss: 8,
        profitFactor: 2.5,
        idealMarketConditions: [MarketCondition.HIGH_VOLATILITY, MarketCondition.BEAR_MARKET],
        avoidMarketConditions: [MarketCondition.LOW_VOLATILITY],
        volatilityPreference: [VolatilityRegime.HIGH],
        entrySignals: ['Market panic', 'Contrarian setup', 'High conviction'],
        exitSignals: ['25% profit target', '8% stop loss', 'Thesis invalidated'],
        requiredIndicators: ['VIX', 'Sentiment Indicators', 'Market Structure'],
        optionalIndicators: ['Put/Call Ratio', 'Margin Debt'],
        skillLevel: 'EXPERT',
        timeCommitmentMinutes: 60,
        totalTrades: 0,
        successfulTrades: 0,
        actualWinRate: 0,
        actualProfitFactor: 0,
        xpMultiplier: 2.5,
        skillCategories: [SkillCategory.STRESS_MANAGEMENT, SkillCategory.RISK_MANAGEMENT],
        difficultyRating: 10,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE'
      }
    ];
  }
}

// Export singleton instance
export const tradingStrategyService = TradingStrategyService.getInstance();

// Export all types for external use
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
};