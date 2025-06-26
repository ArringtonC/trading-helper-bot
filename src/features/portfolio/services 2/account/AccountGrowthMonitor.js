/**
 * AccountGrowthMonitor - Real-time Account Progression Tracking
 * 
 * Research Integration:
 * - Dynamic classification with real-time growth monitoring
 * - Statistical performance analysis for level progression
 * - Risk pattern detection and early warning systems
 * - Account milestone tracking with upgrade recommendations
 */

import { ACCOUNT_LEVELS, GROWTH_MILESTONES } from './AccountLevelSystem';

/**
 * Growth Metrics Categories
 */
const GROWTH_METRICS = {
  FINANCIAL: 'financial',
  PERFORMANCE: 'performance', 
  EXPERIENCE: 'experience',
  RISK_MANAGEMENT: 'risk_management',
  COMPLEXITY: 'complexity'
};

/**
 * Performance Calculation Windows
 */
const PERFORMANCE_WINDOWS = {
  WEEKLY: 7,
  MONTHLY: 30,
  QUARTERLY: 90,
  ANNUAL: 365
};

/**
 * Risk Pattern Detection Thresholds
 */
const RISK_THRESHOLDS = {
  EXCESSIVE_DRAWDOWN: 0.20,
  LOW_WIN_RATE: 0.35,
  HIGH_VOLATILITY: 0.40,
  OVER_TRADING: 100, // trades per month
  POOR_RISK_REWARD: 1.5
};

export class AccountGrowthMonitor {
  constructor() {
    this.growthHistory = [];
    this.performanceSnapshots = [];
    this.milestoneTracking = new Map();
    this.riskPatterns = [];
    this.lastAnalysis = null;
  }

  /**
   * Analyze comprehensive account growth metrics
   */
  async analyzeGrowth(accountData) {
    try {
      const analysis = {
        timestamp: Date.now(),
        accountId: accountData.accountId || 'unknown',
        currentBalance: accountData.balance || 0,
        tradingHistory: await this.analyzeTradingHistory(accountData),
        performanceMetrics: await this.calculatePerformanceMetrics(accountData),
        experienceProgression: await this.assessExperienceProgression(accountData),
        riskManagementScore: await this.evaluateRiskManagement(accountData),
        complexityHandling: await this.assessComplexityHandling(accountData),
        milestoneProgress: await this.trackMilestoneProgress(accountData),
        growthTrajectory: await this.projectGrowthTrajectory(accountData)
      };

      // Calculate overall growth score
      analysis.overallGrowthScore = this.calculateOverallGrowthScore(analysis);

      // Store analysis
      this.growthHistory.push(analysis);
      this.lastAnalysis = analysis;

      return analysis;
    } catch (error) {
      console.error('Growth analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze trading history for progression indicators
   */
  async analyzeTradingHistory(accountData) {
    const trades = accountData.tradeHistory || [];
    const currentDate = new Date();
    
    const history = {
      totalTrades: trades.length,
      tradingDays: this.calculateTradingDays(trades),
      tradingFrequency: this.calculateTradingFrequency(trades),
      volumeProgression: this.analyzeVolumeProgression(trades),
      instrumentDiversity: this.analyzeInstrumentDiversity(trades),
      strategyEvolution: this.analyzeStrategyEvolution(trades),
      timeframe: this.getHistoryTimeframe(trades)
    };

    // Calculate progression trends
    history.progressionTrends = this.calculateProgressionTrends(trades);

    return history;
  }

  /**
   * Calculate comprehensive performance metrics
   */
  async calculatePerformanceMetrics(accountData) {
    const trades = accountData.tradeHistory || [];
    const initialBalance = accountData.initialBalance || accountData.balance || 0;
    const currentBalance = accountData.balance || 0;

    const metrics = {
      totalReturn: this.calculateTotalReturn(initialBalance, currentBalance),
      annualizedReturn: this.calculateAnnualizedReturn(trades, initialBalance, currentBalance),
      winRate: this.calculateWinRate(trades),
      avgWin: this.calculateAverageWin(trades),
      avgLoss: this.calculateAverageLoss(trades),
      profitFactor: this.calculateProfitFactor(trades),
      sharpeRatio: this.calculateSharpeRatio(trades),
      maxDrawdown: this.calculateMaxDrawdown(trades, initialBalance),
      calmarRatio: this.calculateCalmarRatio(trades),
      consistency: this.calculateConsistency(trades),
      riskAdjustedReturn: this.calculateRiskAdjustedReturn(trades)
    };

    // Performance across different timeframes
    metrics.performanceByPeriod = this.calculatePerformanceByPeriod(trades);

    // Recent performance trend
    metrics.recentTrend = this.calculateRecentTrend(trades);

    return metrics;
  }

  /**
   * Assess experience progression through trading sophistication
   */
  async assessExperienceProgression(accountData) {
    const trades = accountData.tradeHistory || [];
    
    const progression = {
      tradingDuration: this.calculateTradingDuration(trades),
      marketExposure: this.analyzeMarketExposure(trades),
      orderTypeUsage: this.analyzeOrderTypeUsage(trades),
      timingSkills: this.analyzeTimingSkills(trades),
      adaptability: this.assessAdaptability(trades),
      learningCurve: this.analyzeLearningCurve(trades)
    };

    // Calculate experience score
    progression.experienceScore = this.calculateExperienceScore(progression);

    return progression;
  }

  /**
   * Evaluate risk management sophistication
   */
  async evaluateRiskManagement(accountData) {
    const trades = accountData.tradeHistory || [];
    
    const riskMgmt = {
      stopLossUsage: this.analyzeStopLossUsage(trades),
      positionSizing: this.analyzePositionSizing(trades),
      diversification: this.analyzeDiversification(trades),
      riskRewardRatio: this.calculateRiskRewardRatio(trades),
      drawdownControl: this.analyzeDrawdownControl(trades),
      correlationAwareness: this.assessCorrelationAwareness(trades)
    };

    // Calculate risk management score
    riskMgmt.riskManagementScore = this.calculateRiskManagementScore(riskMgmt);

    return riskMgmt;
  }

  /**
   * Assess complexity handling capabilities
   */
  async assessComplexityHandling(accountData) {
    const trades = accountData.tradeHistory || [];
    
    const complexity = {
      instrumentComplexity: this.analyzeInstrumentComplexity(trades),
      strategyComplexity: this.analyzeStrategyComplexity(trades),
      marketConditionAdaptation: this.analyzeMarketAdaptation(trades),
      multiAssetManagement: this.analyzeMultiAssetManagement(trades),
      technicalAnalysisUsage: this.analyzeTechnicalAnalysisUsage(trades)
    };

    // Calculate complexity score
    complexity.complexityScore = this.calculateComplexityScore(complexity);

    return complexity;
  }

  /**
   * Track progress toward account level milestones
   */
  async trackMilestoneProgress(accountData) {
    const currentLevel = accountData.currentLevel || ACCOUNT_LEVELS.BEGINNER;
    let targetMilestones;

    if (currentLevel === ACCOUNT_LEVELS.BEGINNER) {
      targetMilestones = GROWTH_MILESTONES.BEGINNER_TO_INTERMEDIATE;
    } else if (currentLevel === ACCOUNT_LEVELS.INTERMEDIATE) {
      targetMilestones = GROWTH_MILESTONES.INTERMEDIATE_TO_ADVANCED;
    } else {
      return { level: ACCOUNT_LEVELS.ADVANCED, progress: 1.0, nextLevel: null };
    }

    const analysis = this.lastAnalysis || await this.analyzeGrowth(accountData);
    const progress = {};

    // Balance milestone
    progress.balance = {
      current: accountData.balance || 0,
      target: targetMilestones.minBalance,
      progress: Math.min(1.0, (accountData.balance || 0) / targetMilestones.minBalance),
      achieved: (accountData.balance || 0) >= targetMilestones.minBalance
    };

    // Trading days milestone
    progress.tradingDays = {
      current: analysis.tradingHistory?.tradingDays || 0,
      target: targetMilestones.minTradingDays,
      progress: Math.min(1.0, (analysis.tradingHistory?.tradingDays || 0) / targetMilestones.minTradingDays),
      achieved: (analysis.tradingHistory?.tradingDays || 0) >= targetMilestones.minTradingDays
    };

    // Successful trades milestone
    progress.successfulTrades = {
      current: this.countSuccessfulTrades(accountData.tradeHistory || []),
      target: targetMilestones.minSuccessfulTrades,
      progress: Math.min(1.0, this.countSuccessfulTrades(accountData.tradeHistory || []) / targetMilestones.minSuccessfulTrades),
      achieved: this.countSuccessfulTrades(accountData.tradeHistory || []) >= targetMilestones.minSuccessfulTrades
    };

    // Drawdown control milestone
    progress.drawdownControl = {
      current: analysis.performanceMetrics?.maxDrawdown || 0,
      target: targetMilestones.maxDrawdown,
      progress: (analysis.performanceMetrics?.maxDrawdown || 1) <= targetMilestones.maxDrawdown ? 1.0 : 0.0,
      achieved: (analysis.performanceMetrics?.maxDrawdown || 1) <= targetMilestones.maxDrawdown
    };

    // Win rate milestone
    progress.winRate = {
      current: analysis.performanceMetrics?.winRate || 0,
      target: targetMilestones.minWinRate,
      progress: Math.min(1.0, (analysis.performanceMetrics?.winRate || 0) / targetMilestones.minWinRate),
      achieved: (analysis.performanceMetrics?.winRate || 0) >= targetMilestones.minWinRate
    };

    // Complexity milestone (for advanced level)
    if (targetMilestones.complexityScore) {
      progress.complexity = {
        current: analysis.complexityHandling?.complexityScore || 0,
        target: targetMilestones.complexityScore,
        progress: Math.min(1.0, (analysis.complexityHandling?.complexityScore || 0) / targetMilestones.complexityScore),
        achieved: (analysis.complexityHandling?.complexityScore || 0) >= targetMilestones.complexityScore
      };
    }

    // Calculate overall milestone progress
    const progressValues = Object.values(progress).map(p => p.progress);
    const overallProgress = progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length;

    return {
      currentLevel,
      targetLevel: currentLevel === ACCOUNT_LEVELS.BEGINNER ? ACCOUNT_LEVELS.INTERMEDIATE : ACCOUNT_LEVELS.ADVANCED,
      overallProgress,
      milestones: progress,
      readyForUpgrade: overallProgress >= 0.8 // 80% threshold
    };
  }

  /**
   * Project future growth trajectory based on current trends
   */
  async projectGrowthTrajectory(accountData) {
    const recentHistory = this.growthHistory.slice(-10); // Last 10 analyses
    
    if (recentHistory.length < 3) {
      return {
        trajectory: 'insufficient_data',
        projectedBalance: accountData.balance,
        timeToNextLevel: null,
        confidence: 0
      };
    }

    const trajectory = {
      balanceGrowthRate: this.calculateBalanceGrowthRate(recentHistory),
      performanceTrend: this.calculatePerformanceTrend(recentHistory),
      skillDevelopmentRate: this.calculateSkillDevelopmentRate(recentHistory),
      projectedBalance: this.projectBalance(accountData.balance, recentHistory),
      timeToNextLevel: this.estimateTimeToNextLevel(accountData, recentHistory),
      confidence: this.calculateProjectionConfidence(recentHistory)
    };

    // Classify trajectory
    trajectory.classification = this.classifyTrajectory(trajectory);

    return trajectory;
  }

  /**
   * Calculate overall growth score combining all factors
   */
  calculateOverallGrowthScore(analysis) {
    const weights = {
      performance: 0.30,
      experience: 0.25,
      riskManagement: 0.25,
      complexity: 0.20
    };

    let score = 0;
    
    score += (analysis.performanceMetrics?.riskAdjustedReturn || 0) * weights.performance;
    score += (analysis.experienceProgression?.experienceScore || 0) * weights.experience;
    score += (analysis.riskManagementScore?.riskManagementScore || 0) * weights.riskManagement;
    score += (analysis.complexityHandling?.complexityScore || 0) * weights.complexity;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Helper methods for specific calculations
   */
  calculateTradingDays(trades) {
    if (trades.length === 0) return 0;
    
    const tradeDates = trades.map(trade => {
      const date = new Date(trade.date || trade.timestamp);
      return date.toDateString();
    });
    
    return new Set(tradeDates).size;
  }

  calculateTradingFrequency(trades) {
    if (trades.length === 0) return 0;
    
    const tradingDays = this.calculateTradingDays(trades);
    return tradingDays > 0 ? trades.length / tradingDays : 0;
  }

  calculateTotalReturn(initialBalance, currentBalance) {
    if (initialBalance <= 0) return 0;
    return (currentBalance - initialBalance) / initialBalance;
  }

  calculateAnnualizedReturn(trades, initialBalance, currentBalance) {
    if (trades.length === 0 || initialBalance <= 0) return 0;
    
    const firstTradeDate = new Date(trades[0].date || trades[0].timestamp);
    const lastTradeDate = new Date(trades[trades.length - 1].date || trades[trades.length - 1].timestamp);
    const daysDiff = (lastTradeDate - firstTradeDate) / (1000 * 60 * 60 * 24);
    const years = daysDiff / 365;
    
    if (years <= 0) return 0;
    
    const totalReturn = this.calculateTotalReturn(initialBalance, currentBalance);
    return Math.pow(1 + totalReturn, 1 / years) - 1;
  }

  calculateWinRate(trades) {
    if (trades.length === 0) return 0;
    
    const winners = trades.filter(trade => (trade.pnl || trade.profit || 0) > 0);
    return winners.length / trades.length;
  }

  calculateAverageWin(trades) {
    const winners = trades.filter(trade => (trade.pnl || trade.profit || 0) > 0);
    if (winners.length === 0) return 0;
    
    const totalWins = winners.reduce((sum, trade) => sum + (trade.pnl || trade.profit || 0), 0);
    return totalWins / winners.length;
  }

  calculateAverageLoss(trades) {
    const losers = trades.filter(trade => (trade.pnl || trade.profit || 0) < 0);
    if (losers.length === 0) return 0;
    
    const totalLosses = losers.reduce((sum, trade) => sum + Math.abs(trade.pnl || trade.profit || 0), 0);
    return totalLosses / losers.length;
  }

  calculateProfitFactor(trades) {
    const avgWin = this.calculateAverageWin(trades);
    const avgLoss = this.calculateAverageLoss(trades);
    const winRate = this.calculateWinRate(trades);
    
    if (avgLoss === 0) return avgWin > 0 ? Infinity : 0;
    
    return (avgWin * winRate) / (avgLoss * (1 - winRate));
  }

  calculateSharpeRatio(trades) {
    if (trades.length < 2) return 0;
    
    const returns = trades.map(trade => (trade.pnl || trade.profit || 0));
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  calculateMaxDrawdown(trades, initialBalance) {
    if (trades.length === 0) return 0;
    
    let balance = initialBalance;
    let peak = balance;
    let maxDrawdown = 0;
    
    for (const trade of trades) {
      balance += (trade.pnl || trade.profit || 0);
      
      if (balance > peak) {
        peak = balance;
      }
      
      const drawdown = (peak - balance) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }

  calculateConsistency(trades) {
    if (trades.length < 5) return 0;
    
    // Calculate monthly returns
    const monthlyReturns = this.groupTradesByMonth(trades);
    const returns = Object.values(monthlyReturns);
    
    if (returns.length < 2) return 0;
    
    const positiveMonths = returns.filter(ret => ret > 0).length;
    return positiveMonths / returns.length;
  }

  countSuccessfulTrades(trades) {
    return trades.filter(trade => (trade.pnl || trade.profit || 0) > 0).length;
  }

  groupTradesByMonth(trades) {
    const monthly = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.date || trade.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthly[monthKey]) {
        monthly[monthKey] = 0;
      }
      
      monthly[monthKey] += (trade.pnl || trade.profit || 0);
    });
    
    return monthly;
  }

  /**
   * Placeholder methods for more complex calculations
   * These would be implemented with more sophisticated logic in production
   */
  analyzeVolumeProgression(trades) {
    return { trend: 'stable', improvement: 0.1 };
  }

  analyzeInstrumentDiversity(trades) {
    const instruments = new Set(trades.map(t => t.symbol || t.instrument));
    return { uniqueInstruments: instruments.size, diversityScore: Math.min(1, instruments.size / 10) };
  }

  analyzeStrategyEvolution(trades) {
    return { strategiesUsed: 3, sophisticationTrend: 'improving' };
  }

  calculateProgressionTrends(trades) {
    return { overall: 'positive', recent: 'stable' };
  }

  getHistoryTimeframe(trades) {
    if (trades.length === 0) return 0;
    
    const first = new Date(trades[0].date || trades[0].timestamp);
    const last = new Date(trades[trades.length - 1].date || trades[trades.length - 1].timestamp);
    
    return (last - first) / (1000 * 60 * 60 * 24); // Days
  }

  calculatePerformanceByPeriod(trades) {
    return {
      last7Days: this.calculatePeriodPerformance(trades, 7),
      last30Days: this.calculatePeriodPerformance(trades, 30),
      last90Days: this.calculatePeriodPerformance(trades, 90)
    };
  }

  calculatePeriodPerformance(trades, days) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const periodTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date || trade.timestamp);
      return tradeDate.getTime() >= cutoff;
    });
    
    const totalPnL = periodTrades.reduce((sum, trade) => sum + (trade.pnl || trade.profit || 0), 0);
    return { trades: periodTrades.length, pnl: totalPnL, winRate: this.calculateWinRate(periodTrades) };
  }

  calculateRecentTrend(trades) {
    const recent = trades.slice(-10); // Last 10 trades
    const avgReturn = recent.reduce((sum, trade) => sum + (trade.pnl || trade.profit || 0), 0) / recent.length;
    
    return {
      direction: avgReturn > 0 ? 'positive' : 'negative',
      strength: Math.abs(avgReturn),
      consistency: this.calculateConsistency(recent)
    };
  }

  // Additional placeholder methods would be implemented here...
  calculateTradingDuration(trades) { return 90; }
  analyzeMarketExposure(trades) { return { score: 0.6 }; }
  analyzeOrderTypeUsage(trades) { return { sophistication: 0.5 }; }
  analyzeTimingSkills(trades) { return { score: 0.7 }; }
  assessAdaptability(trades) { return { score: 0.6 }; }
  analyzeLearningCurve(trades) { return { slope: 0.1 }; }
  calculateExperienceScore(progression) { return 0.6; }
  analyzeStopLossUsage(trades) { return { usage: 0.8 }; }
  analyzePositionSizing(trades) { return { consistency: 0.7 }; }
  analyzeDiversification(trades) { return { score: 0.6 }; }
  calculateRiskRewardRatio(trades) { return 1.8; }
  analyzeDrawdownControl(trades) { return { score: 0.7 }; }
  assessCorrelationAwareness(trades) { return { score: 0.5 }; }
  calculateRiskManagementScore(riskMgmt) { return 0.7; }
  analyzeInstrumentComplexity(trades) { return { score: 0.5 }; }
  analyzeStrategyComplexity(trades) { return { score: 0.6 }; }
  analyzeMarketAdaptation(trades) { return { score: 0.7 }; }
  analyzeMultiAssetManagement(trades) { return { score: 0.4 }; }
  analyzeTechnicalAnalysisUsage(trades) { return { score: 0.6 }; }
  calculateComplexityScore(complexity) { return 0.6; }
  calculateRiskAdjustedReturn(trades) { return 0.15; }
  calculateCalmarRatio(trades) { return 0.8; }
  calculateBalanceGrowthRate(history) { return 0.05; }
  calculatePerformanceTrend(history) { return 'improving'; }
  calculateSkillDevelopmentRate(history) { return 0.1; }
  projectBalance(currentBalance, history) { return currentBalance * 1.1; }
  estimateTimeToNextLevel(accountData, history) { return 120; } // days
  calculateProjectionConfidence(history) { return 0.75; }
  classifyTrajectory(trajectory) { return 'steady_growth'; }

  /**
   * Get growth analysis history
   */
  getGrowthHistory(limit = 50) {
    return this.growthHistory.slice(-limit);
  }

  /**
   * Get latest analysis
   */
  getLatestAnalysis() {
    return this.lastAnalysis;
  }
}

export default AccountGrowthMonitor; 