import { getTrades } from './DatabaseService';
import { NormalizedTradeData } from '../types/trade';
import { Challenge, ChallengeStreaks, Achievement } from '../features/challenges/types/challenge';
import { 
  ProfitExtractionConfig, 
  ProfitExtractionEvent, 
  ProfitExtractionAnalysis,
  StressCorrelationData,
  BehavioralPattern,
  DisciplineMetrics,
  EmotionalState
} from '../features/psychology/types/psychology';

// Performance Analytics Types
export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  avgTradeReturn: number;
  successRate: number;
  riskRewardRatio: number;
}

export interface WinRateAnalysis {
  overallWinRate: number;
  monthlyWinRates: { month: string; winRate: number; trades: number }[];
  symbolWinRates: { symbol: string; winRate: number; trades: number }[];
  strategyWinRates: { strategy: string; winRate: number; trades: number }[];
  timeOfDayWinRates: { hour: number; winRate: number; trades: number }[];
  trendAnalysis: 'IMPROVING' | 'DECLINING' | 'STABLE';
}

export interface RPGProgress {
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  xpFromTrades: number;
  xpFromTasks: number;
  xpFromStreaks: number;
  skillBreakdown: {
    patience: { level: number; xp: number };
    riskManagement: { level: number; xp: number };
    setupQuality: { level: number; xp: number };
    strategyAdherence: { level: number; xp: number };
  };
  progressToTarget: number;
  rankStatus: 'NOVICE' | 'SKILLED' | 'EXPERT' | 'MASTER' | 'LEGENDARY';
}

export interface StreakData {
  loginStreak: { current: number; best: number; category: string };
  taskCompletionStreak: { current: number; best: number; category: string };
  riskDisciplineStreak: { current: number; best: number; category: string };
  platformUsageStreak: { current: number; best: number; category: string };
  profitableDaysStreak: { current: number; best: number; category: string };
  overallScore: number;
  motivation: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface UserActivity {
  date: Date;
  type: 'LOGIN' | 'TASK_COMPLETION' | 'TRADE' | 'PLATFORM_USE';
  value?: number;
  metadata?: any;
}

/**
 * Service for accessing and providing trade data for analytics and ML purposes.
 */
export class AnalyticsDataService {
  /**
   * Retrieves all normalized trade data from the database.
   * @returns A promise resolving to an array of NormalizedTradeData.
   */
  public async getAllTrades(): Promise<NormalizedTradeData[]> {
    // Use the existing DatabaseService to fetch trades
    const trades = await getTrades();
    // Apply preprocessing steps
    const preprocessedTrades = this.preprocessTrades(trades);
    return preprocessedTrades;
  }

  /**
   * Applies preprocessing steps to trade data.
   * This is a placeholder and can be expanded for cleaning, transformation, etc.
   * @param trades - Array of NormalizedTradeData.
   * @returns The preprocessed array of NormalizedTradeData.
   */
  private preprocessTrades(trades: NormalizedTradeData[]): NormalizedTradeData[] {
    console.log(`[AnalyticsDataService] Starting preprocessing for ${trades.length} trades.`);

    return trades.map(trade => {
      const processedTrade = { ...trade };

      // Basic date validation: Ensure date strings are not empty if they exist
      // tradeDate is NOT optional in type, ensure it's a string.
      if (processedTrade.tradeDate === '') { /* Decide how to handle empty tradeDate if necessary, for now keep as empty string */ }
      if (processedTrade.settleDate === '') processedTrade.settleDate = undefined; // settleDate IS optional, can be undefined
      if (processedTrade.expiryDate === '') processedTrade.expiryDate = undefined; // expiryDate IS optional, can be undefined
      if (processedTrade.dateTime === '') processedTrade.dateTime = undefined; // dateTime IS optional, can be undefined

      // Ensure key numerical fields are finite numbers or null if they were optional
      // The type definition for quantity, tradePrice, netAmount is number, which implies they should always be finite after initial parsing
      // For optional number fields that can be null, ensure they are not NaN or Infinity
      if (processedTrade.proceeds !== undefined && processedTrade.proceeds !== null && !Number.isFinite(processedTrade.proceeds)) processedTrade.proceeds = null;
      if (processedTrade.cost !== undefined && processedTrade.cost !== null && !Number.isFinite(processedTrade.cost)) processedTrade.cost = null;
      if (processedTrade.commission !== undefined && processedTrade.commission !== null && !Number.isFinite(processedTrade.commission)) processedTrade.commission = null;
      if (processedTrade.fees !== undefined && processedTrade.fees !== null && !Number.isFinite(processedTrade.fees)) processedTrade.fees = null;
      if (processedTrade.costBasis !== undefined && processedTrade.costBasis !== null && !Number.isFinite(processedTrade.costBasis)) processedTrade.costBasis = null;
      if (processedTrade.strikePrice !== undefined && processedTrade.strikePrice !== null && !Number.isFinite(processedTrade.strikePrice)) processedTrade.strikePrice = null;
      if (processedTrade.multiplier !== undefined && processedTrade.multiplier !== null && !Number.isFinite(processedTrade.multiplier)) processedTrade.multiplier = undefined; // Multiplier is number | undefined

      // Example preprocessing: Convert date strings to Date objects for easier time-series analysis
      // Note: This might be done later in feature engineering, but can be done here too.
      // processedTrade.tradeDate = new Date(processedTrade.tradeDate); // Requires updating NormalizedTradeData type if uncommented

      // Example preprocessing: Handle potential missing values for numerical fields
      // For required fields (quantity, tradePrice, netAmount), they should ideally be valid numbers from initial parsing.
      // For optional number fields that can be null:
      if (processedTrade.proceeds === null) { /* Decide how to handle, e.g., impute with 0 or a statistical measure */ }
      if (processedTrade.cost === null) { /* Decide how to handle */ }
      if (processedTrade.commission === null) { /* Decide how to handle */ }
      if (processedTrade.fees === null) { /* Decide how to handle */ }
      if (processedTrade.costBasis === null) { /* Decide how to handle */ }
      if (processedTrade.strikePrice === null) { /* Decide how to handle */ }
      if (processedTrade.multiplier === undefined) { /* Decide how to handle */ } // Multiplier is number | undefined

      // Example preprocessing: Ensure specific string fields have default values if empty or null
      if (!processedTrade.description) processedTrade.description = '';
      if (!processedTrade.action) processedTrade.action = '';

      // TODO: Add more sophisticated cleaning like outlier detection, handling missing values based on context, etc.

      return processedTrade as NormalizedTradeData; // Cast back to ensure type consistency
    });
  }

  /**
   * Retrieves normalized trade data for a specific symbol from the database.
   * @param symbol - The trading symbol to filter by.
   * @returns A promise resolving to an array of NormalizedTradeData for the given symbol.
   */
  public async getTradesBySymbol(symbol: string): Promise<NormalizedTradeData[]> {
    // For now, fetch all trades and filter in memory. For larger datasets, this should be a database query.
    const allTrades = await this.getAllTrades();
    const filteredTrades = allTrades.filter(trade => trade.symbol === symbol);
    console.log(`[AnalyticsDataService] Retrieved ${filteredTrades.length} trades for symbol: ${symbol}`);
    // TODO: Add more sophisticated filtering or sorting here if needed
    return filteredTrades;
  }

  /**
   * Calculate comprehensive performance metrics from trade data
   * @param trades - Array of trade data
   * @returns Performance metrics including win rate, P&L, ratios
   */
  public calculatePerformanceMetrics(trades: NormalizedTradeData[]): PerformanceMetrics {
    if (trades.length === 0) {
      return this.getEmptyPerformanceMetrics();
    }

    const pnlTrades = trades.filter(trade => trade.netAmount !== null && trade.netAmount !== undefined);
    const winningTrades = pnlTrades.filter(trade => trade.netAmount! > 0);
    const losingTrades = pnlTrades.filter(trade => trade.netAmount! < 0);
    
    const totalPnL = pnlTrades.reduce((sum, trade) => sum + trade.netAmount!, 0);
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, trade) => sum + trade.netAmount!, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? 
      Math.abs(losingTrades.reduce((sum, trade) => sum + trade.netAmount!, 0) / losingTrades.length) : 0;
    
    const profitFactor = avgLoss > 0 ? (winningTrades.length * avgWin) / (losingTrades.length * avgLoss) : 0;
    const winRate = pnlTrades.length > 0 ? (winningTrades.length / pnlTrades.length) * 100 : 0;
    
    // Calculate drawdown
    const maxDrawdown = this.calculateMaxDrawdown(pnlTrades);
    
    // Calculate Sharpe ratio (simplified)
    const returns = pnlTrades.map(trade => trade.netAmount!);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const returnStdDev = this.calculateStandardDeviation(returns);
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;
    
    const bestTrade = pnlTrades.length > 0 ? Math.max(...pnlTrades.map(t => t.netAmount!)) : 0;
    const worstTrade = pnlTrades.length > 0 ? Math.min(...pnlTrades.map(t => t.netAmount!)) : 0;
    
    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: Math.round(winRate * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      avgTradeReturn: Math.round(avgReturn * 100) / 100,
      successRate: winRate,
      riskRewardRatio: avgLoss > 0 ? Math.round((avgWin / avgLoss) * 100) / 100 : 0
    };
  }

  /**
   * Generate detailed win rate analysis with breakdowns
   * @param dateRange - Date range for analysis
   * @returns Win rate analysis with various breakdowns
   */
  public async generateWinRateAnalysis(dateRange: DateRange): Promise<WinRateAnalysis> {
    const trades = await this.getTradesInDateRange(dateRange);
    const pnlTrades = trades.filter(trade => trade.netAmount !== null && trade.netAmount !== undefined);
    
    if (pnlTrades.length === 0) {
      return this.getEmptyWinRateAnalysis();
    }

    const overallWinRate = this.calculateWinRate(pnlTrades);
    
    // Monthly breakdown
    const monthlyWinRates = this.calculateMonthlyWinRates(pnlTrades);
    
    // Symbol breakdown
    const symbolWinRates = this.calculateSymbolWinRates(pnlTrades);
    
    // Strategy breakdown (if available in trade metadata)
    const strategyWinRates = this.calculateStrategyWinRates(pnlTrades);
    
    // Time of day breakdown
    const timeOfDayWinRates = this.calculateTimeOfDayWinRates(pnlTrades);
    
    // Trend analysis
    const trendAnalysis = this.analyzeTrend(monthlyWinRates);
    
    return {
      overallWinRate,
      monthlyWinRates,
      symbolWinRates,
      strategyWinRates,
      timeOfDayWinRates,
      trendAnalysis
    };
  }

  /**
   * Create RPG progress data from challenge and performance metrics
   * @param challenge - Current challenge data
   * @returns RPG progress including levels, XP, and skills
   */
  public createRPGProgressData(challenge: Challenge): RPGProgress {
    const currentLevel = challenge.characterLevel;
    const totalXP = challenge.totalXP;
    
    // Calculate XP to next level (100 XP per level, exponential growth)
    const xpForNextLevel = this.calculateXPForLevel(currentLevel + 1);
    const xpToNextLevel = xpForNextLevel - totalXP;
    
    // Estimate XP sources (would be tracked in real implementation)
    const xpFromTrades = Math.floor(totalXP * 0.4); // 40% from trading
    const xpFromTasks = Math.floor(totalXP * 0.45);  // 45% from tasks
    const xpFromStreaks = Math.floor(totalXP * 0.15); // 15% from streaks
    
    // Calculate skill breakdown
    const skillBreakdown = {
      patience: {
        level: challenge.masteryLevels.patience,
        xp: challenge.masteryLevels.patience * 50 // 50 XP per skill level
      },
      riskManagement: {
        level: challenge.masteryLevels.riskManagement,
        xp: challenge.masteryLevels.riskManagement * 50
      },
      setupQuality: {
        level: challenge.masteryLevels.setupQuality,
        xp: challenge.masteryLevels.setupQuality * 50
      },
      strategyAdherence: {
        level: challenge.masteryLevels.strategyAdherence,
        xp: challenge.masteryLevels.strategyAdherence * 50
      }
    };
    
    // Calculate progress to target
    const progressToTarget = ((challenge.currentAmount - challenge.startingAmount) / 
      (challenge.targetAmount - challenge.startingAmount)) * 100;
    
    // Determine rank status
    const rankStatus = this.determineRankStatus(currentLevel);
    
    return {
      currentLevel,
      totalXP,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      xpFromTrades,
      xpFromTasks,
      xpFromStreaks,
      skillBreakdown,
      progressToTarget: Math.max(0, Math.min(100, progressToTarget)),
      rankStatus
    };
  }

  /**
   * Calculate streak metrics from user activities
   * @param activities - Array of user activities
   * @returns Streak data with current and best streaks
   */
  public calculateStreakMetrics(activities: UserActivity[]): StreakData {
    const loginStreak = this.calculateSpecificStreak(activities, 'LOGIN');
    const taskCompletionStreak = this.calculateSpecificStreak(activities, 'TASK_COMPLETION');
    const platformUsageStreak = this.calculateSpecificStreak(activities, 'PLATFORM_USE');
    
    // Calculate trading streaks from trade data
    const tradeActivities = activities.filter(a => a.type === 'TRADE');
    const profitableDaysStreak = this.calculateProfitableStreak(tradeActivities);
    
    // Risk discipline streak (would need trade size data)
    const riskDisciplineStreak = this.calculateRiskDisciplineStreak(tradeActivities);
    
    // Overall streak score (weighted average)
    const overallScore = Math.round(
      (loginStreak.current * 0.2 + 
       taskCompletionStreak.current * 0.3 + 
       riskDisciplineStreak.current * 0.25 + 
       platformUsageStreak.current * 0.15 + 
       profitableDaysStreak.current * 0.1) * 10
    ) / 10;
    
    const motivation = this.generateStreakMotivation(overallScore);
    
    return {
      loginStreak,
      taskCompletionStreak,
      riskDisciplineStreak,
      platformUsageStreak,
      profitableDaysStreak,
      overallScore,
      motivation
    };
  }

  // Helper methods
  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0,
      totalPnL: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, sharpeRatio: 0,
      maxDrawdown: 0, bestTrade: 0, worstTrade: 0, avgTradeReturn: 0,
      successRate: 0, riskRewardRatio: 0
    };
  }

  private getEmptyWinRateAnalysis(): WinRateAnalysis {
    return {
      overallWinRate: 0, monthlyWinRates: [], symbolWinRates: [],
      strategyWinRates: [], timeOfDayWinRates: [], trendAnalysis: 'STABLE'
    };
  }

  private calculateMaxDrawdown(trades: NormalizedTradeData[]): number {
    let peak = 0;
    let maxDrawdown = 0;
    let runningTotal = 0;
    
    for (const trade of trades) {
      runningTotal += trade.netAmount!;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private async getTradesInDateRange(dateRange: DateRange): Promise<NormalizedTradeData[]> {
    const allTrades = await this.getAllTrades();
    return allTrades.filter(trade => {
      const tradeDate = new Date(trade.tradeDate);
      return tradeDate >= dateRange.startDate && tradeDate <= dateRange.endDate;
    });
  }

  private calculateWinRate(trades: NormalizedTradeData[]): number {
    const winningTrades = trades.filter(trade => trade.netAmount! > 0);
    return trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  }

  private calculateMonthlyWinRates(trades: NormalizedTradeData[]): { month: string; winRate: number; trades: number }[] {
    const monthlyData: { [key: string]: { wins: number; total: number } } = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.tradeDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { wins: 0, total: 0 };
      }
      
      monthlyData[monthKey].total++;
      if (trade.netAmount! > 0) {
        monthlyData[monthKey].wins++;
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      winRate: (data.wins / data.total) * 100,
      trades: data.total
    }));
  }

  private calculateSymbolWinRates(trades: NormalizedTradeData[]): { symbol: string; winRate: number; trades: number }[] {
    const symbolData: { [key: string]: { wins: number; total: number } } = {};
    
    trades.forEach(trade => {
      if (!symbolData[trade.symbol]) {
        symbolData[trade.symbol] = { wins: 0, total: 0 };
      }
      
      symbolData[trade.symbol].total++;
      if (trade.netAmount! > 0) {
        symbolData[trade.symbol].wins++;
      }
    });
    
    return Object.entries(symbolData)
      .map(([symbol, data]) => ({
        symbol,
        winRate: (data.wins / data.total) * 100,
        trades: data.total
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 10); // Top 10 symbols by trade count
  }

  private calculateStrategyWinRates(trades: NormalizedTradeData[]): { strategy: string; winRate: number; trades: number }[] {
    // This would use strategy metadata if available
    // For now, return empty array
    return [];
  }

  private calculateTimeOfDayWinRates(trades: NormalizedTradeData[]): { hour: number; winRate: number; trades: number }[] {
    const hourlyData: { [key: number]: { wins: number; total: number } } = {};
    
    trades.forEach(trade => {
      if (trade.dateTime) {
        const date = new Date(trade.dateTime);
        const hour = date.getHours();
        
        if (!hourlyData[hour]) {
          hourlyData[hour] = { wins: 0, total: 0 };
        }
        
        hourlyData[hour].total++;
        if (trade.netAmount! > 0) {
          hourlyData[hour].wins++;
        }
      }
    });
    
    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      winRate: (data.wins / data.total) * 100,
      trades: data.total
    }));
  }

  private analyzeTrend(monthlyData: { month: string; winRate: number; trades: number }[]): 'IMPROVING' | 'DECLINING' | 'STABLE' {
    if (monthlyData.length < 2) return 'STABLE';
    
    const recentMonths = monthlyData.slice(-3); // Last 3 months
    const earlyMonths = monthlyData.slice(0, 3);  // First 3 months
    
    const recentAvg = recentMonths.reduce((sum, month) => sum + month.winRate, 0) / recentMonths.length;
    const earlyAvg = earlyMonths.reduce((sum, month) => sum + month.winRate, 0) / earlyMonths.length;
    
    const difference = recentAvg - earlyAvg;
    
    if (difference > 5) return 'IMPROVING';
    if (difference < -5) return 'DECLINING';
    return 'STABLE';
  }

  private calculateXPForLevel(level: number): number {
    // Exponential XP growth: Level 1 = 100 XP, Level 2 = 300 XP, Level 3 = 600 XP, etc.
    return level * 100 + (level - 1) * 50;
  }

  private determineRankStatus(level: number): 'NOVICE' | 'SKILLED' | 'EXPERT' | 'MASTER' | 'LEGENDARY' {
    if (level >= 20) return 'LEGENDARY';
    if (level >= 15) return 'MASTER';
    if (level >= 10) return 'EXPERT';
    if (level >= 5) return 'SKILLED';
    return 'NOVICE';
  }

  private calculateSpecificStreak(activities: UserActivity[], type: string): { current: number; best: number; category: string } {
    const typeActivities = activities.filter(a => a.type === type).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    
    for (const activity of typeActivities) {
      if (lastDate) {
        const daysDiff = Math.floor((activity.date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
      
      lastDate = activity.date;
    }
    
    // Current streak is the most recent consecutive days
    const today = new Date();
    currentStreak = this.calculateCurrentStreak(typeActivities, today);
    
    const category = this.getStreakCategory(currentStreak);
    
    return { current: currentStreak, best: bestStreak, category };
  }

  private calculateProfitableStreak(tradeActivities: UserActivity[]): { current: number; best: number; category: string } {
    // Implementation for profitable days streak
    // This would analyze trade profitability by day
    return { current: 0, best: 0, category: 'GETTING_STARTED' };
  }

  private calculateRiskDisciplineStreak(tradeActivities: UserActivity[]): { current: number; best: number; category: string } {
    // Implementation for risk discipline streak
    // This would analyze if trades stayed within risk limits
    return { current: 0, best: 0, category: 'GETTING_STARTED' };
  }

  private calculateCurrentStreak(activities: UserActivity[], today: Date): number {
    // Calculate how many consecutive days from today backwards
    let streak = 0;
    const sortedActivities = activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    for (let i = 0; i < sortedActivities.length; i++) {
      const daysDiff = Math.floor((today.getTime() - sortedActivities[i].date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private getStreakCategory(streak: number): string {
    if (streak >= 30) return 'LEGENDARY';
    if (streak >= 14) return 'IMPRESSIVE';
    if (streak >= 7) return 'SOLID';
    if (streak >= 3) return 'BUILDING';
    return 'GETTING_STARTED';
  }

  private generateStreakMotivation(score: number): string {
    if (score >= 20) return 'Outstanding discipline! You\'re in the elite tier of traders.';
    if (score >= 15) return 'Excellent consistency! Your habits are paying off.';
    if (score >= 10) return 'Great progress! Keep building those winning streaks.';
    if (score >= 5) return 'Good momentum! Focus on daily consistency.';
    return 'Every expert was once a beginner. Start your streak today!';
  }

  /**
   * Profit Extraction Automation Methods
   */

  /**
   * Calculate optimal monthly profit extraction amount
   */
  public calculateMonthlyProfitExtraction(
    accountSize: number, 
    monthlyProfits: number,
    config: ProfitExtractionConfig
  ): { 
    recommendedExtraction: number; 
    safetyBuffer: number; 
    reasoning: string[] 
  } {
    const extractionRate = config.monthlyExtractionTarget / 100;
    const baseExtraction = monthlyProfits * extractionRate;
    
    // Apply safety considerations
    let adjustedExtraction = baseExtraction;
    const reasoning: string[] = [];

    // Don't extract if profits are below minimum threshold
    if (monthlyProfits < config.minProfitThreshold) {
      adjustedExtraction = 0;
      reasoning.push(`Monthly profits (${monthlyProfits}) below minimum threshold (${config.minProfitThreshold})`);
    }

    // Ensure extraction doesn't reduce account below comfort level
    const remainingCapital = accountSize - adjustedExtraction;
    const minimumCapital = accountSize * 0.8; // Keep at least 80% of original capital
    
    if (remainingCapital < minimumCapital) {
      adjustedExtraction = accountSize - minimumCapital;
      reasoning.push('Adjusted to maintain minimum 80% capital buffer');
    }

    // Market condition adjustments
    const safetyBuffer = adjustedExtraction * 0.1; // 10% safety buffer

    if (adjustedExtraction > 0) {
      reasoning.push(`Extracting ${config.monthlyExtractionTarget}% of monthly profits`);
      reasoning.push('This protects gains from market volatility');
      reasoning.push('Compound growth on remaining capital continues');
    }

    return {
      recommendedExtraction: Math.max(0, adjustedExtraction),
      safetyBuffer,
      reasoning
    };
  }

  /**
   * Generate profit extraction analysis and history
   */
  public generateProfitExtractionAnalysis(
    trades: NormalizedTradeData[],
    extractions: ProfitExtractionEvent[]
  ): ProfitExtractionAnalysis {
    const totalExtracted = extractions.reduce((sum, ext) => sum + ext.amount, 0);
    const extractionCount = extractions.length;
    const averageExtraction = extractionCount > 0 ? totalExtracted / extractionCount : 0;

    // Calculate discipline score based on extraction consistency
    const monthsWithProfits = this.getMonthsWithProfits(trades);
    const monthsWithExtractions = this.getMonthsWithExtractions(extractions);
    const extractionDisciplineScore = monthsWithProfits > 0 ? 
      (monthsWithExtractions / monthsWithProfits) * 100 : 0;

    // Project savings from market crashes (historical simulation)
    const projectedSavingsFromCrashes = this.calculateCrashProtectionBenefit(extractions);

    // Calculate compound growth benefit
    const compoundGrowthBenefit = this.calculateCompoundGrowthBenefit(extractions);

    // Monthly extraction history
    const monthlyExtractionHistory = this.generateMonthlyExtractionHistory(trades, extractions);

    return {
      totalExtracted,
      extractionCount,
      averageExtraction,
      extractionDisciplineScore,
      projectedSavingsFromCrashes,
      compoundGrowthBenefit,
      monthlyExtractionHistory
    };
  }

  /**
   * Calculate stress correlation with trading performance
   */
  public calculateStressCorrelation(
    trades: NormalizedTradeData[],
    stressData: StressCorrelationData[]
  ): {
    correlation: number;
    optimalStressRange: { min: number; max: number };
    recommendations: string[];
  } {
    // Calculate correlation between stress levels and win rate
    const correlationData = this.alignTradesWithStressData(trades, stressData);
    
    const correlation = this.calculatePearsonCorrelation(
      correlationData.map(d => d.stressLevel),
      correlationData.map(d => d.winRate)
    );

    // Find optimal stress range (where performance is highest)
    const stressBuckets = this.groupByStressLevel(correlationData);
    const optimalBucket = Object.entries(stressBuckets)
      .sort(([,a], [,b]) => b.avgWinRate - a.avgWinRate)[0];

    const optimalStressRange = {
      min: Math.max(1, parseFloat(optimalBucket[0]) - 1),
      max: Math.min(10, parseFloat(optimalBucket[0]) + 1)
    };

    const recommendations = this.generateStressRecommendations(correlation, optimalStressRange);

    return {
      correlation,
      optimalStressRange,
      recommendations
    };
  }

  /**
   * Analyze behavioral patterns from trading data
   */
  public analyzeBehavioralPatterns(
    trades: NormalizedTradeData[],
    emotionalStates: EmotionalState[]
  ): BehavioralPattern[] {
    const patterns: BehavioralPattern[] = [];

    // Revenge trading pattern
    const revengeTradingPattern = this.detectRevengeTradingPattern(trades);
    if (revengeTradingPattern.frequency > 0) {
      patterns.push(revengeTradingPattern);
    }

    // FOMO entry pattern
    const fomoPattern = this.detectFOMOPattern(trades, emotionalStates);
    if (fomoPattern.frequency > 0) {
      patterns.push(fomoPattern);
    }

    // Panic exit pattern
    const panicExitPattern = this.detectPanicExitPattern(trades, emotionalStates);
    if (panicExitPattern.frequency > 0) {
      patterns.push(panicExitPattern);
    }

    // Position size escalation pattern
    const oversizePattern = this.detectOversizePositionPattern(trades);
    if (oversizePattern.frequency > 0) {
      patterns.push(oversizePattern);
    }

    return patterns;
  }

  /**
   * Calculate discipline metrics for psychology tracking
   */
  public calculateDisciplineMetrics(
    trades: NormalizedTradeData[],
    targetPositionSize: number = 2,
    targetStopLossPercentage: number = 2
  ): DisciplineMetrics {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        positionSizeCompliance: 100,
        stopLossCompliance: 100,
        strategyAdherence: 100,
        weeklyOptionsAvoidance: 100,
        overallDisciplineScore: 100,
        consecutiveDisciplinedDays: 0,
        disciplineStreak: { current: 0, best: 0, category: 'NOVICE' }
      };
    }

    // Calculate compliance metrics
    const positionSizeCompliant = trades.filter(t => 
      this.calculatePositionSizePercentage(t) <= targetPositionSize
    ).length;
    const positionSizeCompliance = (positionSizeCompliant / totalTrades) * 100;

    // Mock other metrics for demonstration
    const stopLossCompliance = 85 + Math.random() * 10;
    const strategyAdherence = 80 + Math.random() * 15;
    
    // Weekly options avoidance (prefer monthly options)
    const weeklyOptionsCount = trades.filter(t => 
      this.isWeeklyOption(t)
    ).length;
    const weeklyOptionsAvoidance = ((totalTrades - weeklyOptionsCount) / totalTrades) * 100;

    const overallDisciplineScore = (
      positionSizeCompliance + 
      stopLossCompliance + 
      strategyAdherence + 
      weeklyOptionsAvoidance
    ) / 4;

    // Calculate discipline streak
    const consecutiveDisciplinedDays = this.calculateDisciplineStreak(trades);
    const disciplineStreak = {
      current: consecutiveDisciplinedDays,
      best: Math.max(consecutiveDisciplinedDays, 15), // Mock best streak
      category: this.getDisciplineCategory(consecutiveDisciplinedDays)
    };

    return {
      positionSizeCompliance,
      stopLossCompliance,
      strategyAdherence,
      weeklyOptionsAvoidance,
      overallDisciplineScore,
      consecutiveDisciplinedDays,
      disciplineStreak
    };
  }

  // Helper methods for profit extraction and psychology analysis

  private getMonthsWithProfits(trades: NormalizedTradeData[]): number {
    const monthlyPnL = new Map<string, number>();
    
    trades.forEach(trade => {
      const month = new Date(trade.tradeDate).toISOString().slice(0, 7); // YYYY-MM
      const pnl = trade.netAmount || 0;
      monthlyPnL.set(month, (monthlyPnL.get(month) || 0) + pnl);
    });

    return Array.from(monthlyPnL.values()).filter(pnl => pnl > 0).length;
  }

  private getMonthsWithExtractions(extractions: ProfitExtractionEvent[]): number {
    const months = new Set(
      extractions.map(ext => ext.date.toISOString().slice(0, 7))
    );
    return months.size;
  }

  private calculateCrashProtectionBenefit(extractions: ProfitExtractionEvent[]): number {
    // Simulate benefit during historical market crashes
    const totalExtracted = extractions.reduce((sum, ext) => sum + ext.amount, 0);
    // Assume 30% average market crash protection benefit
    return totalExtracted * 0.3;
  }

  private calculateCompoundGrowthBenefit(extractions: ProfitExtractionEvent[]): number {
    // Calculate the compound growth on extracted funds (assuming safe investment)
    const totalExtracted = extractions.reduce((sum, ext) => sum + ext.amount, 0);
    // Assume 5% annual safe return on extracted funds
    return totalExtracted * 0.05;
  }

  private generateMonthlyExtractionHistory(
    trades: NormalizedTradeData[], 
    extractions: ProfitExtractionEvent[]
  ) {
    // Generate monthly extraction history with market performance correlation
    const months = this.getUniqueMonths(trades);
    
    return months.map(month => ({
      month,
      extracted: extractions
        .filter(ext => ext.date.toISOString().slice(0, 7) === month)
        .reduce((sum, ext) => sum + ext.amount, 0),
      marketReturn: -5 + Math.random() * 20, // Mock market return
      protectionBenefit: 100 + Math.random() * 500 // Mock protection benefit
    }));
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private alignTradesWithStressData(
    trades: NormalizedTradeData[], 
    stressData: StressCorrelationData[]
  ): StressCorrelationData[] {
    // Align trades with stress data by date and calculate performance metrics
    return stressData.map(stress => ({
      ...stress,
      winRate: 60 + Math.random() * 30, // Mock win rate calculation
      profitFactor: 1.2 + Math.random() * 0.8,
      decisionQuality: 70 + Math.random() * 25
    }));
  }

  private groupByStressLevel(data: StressCorrelationData[]) {
    const buckets: Record<string, { avgWinRate: number; count: number }> = {};
    
    data.forEach(item => {
      const bucket = Math.floor(item.stressLevel).toString();
      if (!buckets[bucket]) {
        buckets[bucket] = { avgWinRate: 0, count: 0 };
      }
      buckets[bucket].avgWinRate += item.winRate;
      buckets[bucket].count += 1;
    });

    // Calculate averages
    Object.values(buckets).forEach(bucket => {
      bucket.avgWinRate /= bucket.count;
    });

    return buckets;
  }

  private generateStressRecommendations(
    correlation: number, 
    optimalRange: { min: number; max: number }
  ): string[] {
    const recommendations: string[] = [];

    if (correlation < -0.3) {
      recommendations.push('High stress significantly hurts your performance');
      recommendations.push('Implement stress reduction techniques before trading');
    } else if (correlation > 0.3) {
      recommendations.push('Some stress appears to improve your focus');
      recommendations.push('Maintain moderate alertness while trading');
    } else {
      recommendations.push('Stress has minimal impact on your performance');
    }

    recommendations.push(`Your optimal stress range is ${optimalRange.min}-${optimalRange.max}`);
    recommendations.push('Track stress levels daily for better awareness');

    return recommendations;
  }

  private detectRevengeTradingPattern(trades: NormalizedTradeData[]): BehavioralPattern {
    // Detect consecutive loss followed by larger position size
    let revengeTradeCount = 0;
    let consecutiveLosses = 0;
    
    for (let i = 0; i < trades.length - 1; i++) {
      const currentTrade = trades[i];
      const nextTrade = trades[i + 1];
      
      if ((currentTrade.netAmount || 0) < 0) {
        consecutiveLosses++;
      } else {
        consecutiveLosses = 0;
      }
      
      // Check if next trade after loss has larger position size
      if (consecutiveLosses >= 1 && this.isLargerPositionSize(currentTrade, nextTrade)) {
        revengeTradeCount++;
      }
    }

    return {
      pattern: 'REVENGE_TRADING',
      frequency: revengeTradeCount,
      impact: revengeTradeCount * -250, // Estimated negative impact
      lastOccurrence: new Date(),
      trend: revengeTradeCount > 3 ? 'WORSENING' : 'STABLE',
      interventionSuggestions: [
        'Take a 30-minute break after any loss',
        'Stick to predetermined position sizes',
        'Use stop-loss orders consistently'
      ]
    };
  }

  private detectFOMOPattern(trades: NormalizedTradeData[], emotionalStates: EmotionalState[]): BehavioralPattern {
    // Mock FOMO detection based on trade timing and emotional state
    const fomoTrades = trades.filter(trade => {
      // Look for trades made during euphoric states or market highs
      return Math.random() < 0.1; // 10% of trades classified as FOMO
    });

    return {
      pattern: 'FOMO_ENTRY',
      frequency: fomoTrades.length,
      impact: fomoTrades.length * -150,
      lastOccurrence: new Date(),
      trend: 'STABLE',
      interventionSuggestions: [
        'Wait for pullbacks before entering',
        'Set price alerts instead of watching constantly',
        'Stick to your predetermined watchlist'
      ]
    };
  }

  private detectPanicExitPattern(trades: NormalizedTradeData[], emotionalStates: EmotionalState[]): BehavioralPattern {
    // Mock panic exit detection
    const panicExits = trades.filter(trade => {
      return (trade.netAmount || 0) < 0 && Math.random() < 0.15; // 15% of losing trades classified as panic
    });

    return {
      pattern: 'PANIC_EXIT',
      frequency: panicExits.length,
      impact: panicExits.length * -200,
      lastOccurrence: new Date(),
      trend: 'IMPROVING',
      interventionSuggestions: [
        'Set stop-losses when entering positions',
        'Use position sizing to reduce emotional impact',
        'Practice breathing exercises during drawdowns'
      ]
    };
  }

  private detectOversizePositionPattern(trades: NormalizedTradeData[]): BehavioralPattern {
    const oversizeTrades = trades.filter(trade => 
      this.calculatePositionSizePercentage(trade) > 5 // More than 5% of account
    );

    return {
      pattern: 'OVERSIZE_POSITIONS',
      frequency: oversizeTrades.length,
      impact: oversizeTrades.length * -300,
      lastOccurrence: new Date(),
      trend: 'STABLE',
      interventionSuggestions: [
        'Never risk more than 2% per trade',
        'Use position sizing calculator',
        'Set hard limits in your trading platform'
      ]
    };
  }

  private calculatePositionSizePercentage(trade: NormalizedTradeData): number {
    // Mock calculation - would need account size data
    const mockAccountSize = 100000;
    const positionValue = Math.abs(trade.netAmount || 0) * 10; // Estimate position value
    return (positionValue / mockAccountSize) * 100;
  }

  private isWeeklyOption(trade: NormalizedTradeData): boolean {
    // Check if trade is a weekly option (expires within 7 days of trade date)
    if (!trade.expiryDate || !trade.tradeDate) return false;
    
    const tradeDate = new Date(trade.tradeDate);
    const expiryDate = new Date(trade.expiryDate);
    const daysToExpiry = (expiryDate.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysToExpiry <= 7;
  }

  private calculateDisciplineStreak(trades: NormalizedTradeData[]): number {
    // Mock calculation of consecutive disciplined trading days
    return Math.floor(Math.random() * 30) + 1;
  }

  private getDisciplineCategory(consecutiveDays: number): 'NOVICE' | 'SKILLED' | 'DISCIPLINED' | 'MASTER' {
    if (consecutiveDays >= 90) return 'MASTER';
    if (consecutiveDays >= 60) return 'DISCIPLINED';
    if (consecutiveDays >= 30) return 'SKILLED';
    return 'NOVICE';
  }

  private isLargerPositionSize(trade1: NormalizedTradeData, trade2: NormalizedTradeData): boolean {
    const size1 = Math.abs(trade1.netAmount || 0);
    const size2 = Math.abs(trade2.netAmount || 0);
    return size2 > size1 * 1.5; // 50% larger position size
  }

  private getUniqueMonths(trades: NormalizedTradeData[]): string[] {
    const months = new Set(
      trades.map(trade => new Date(trade.tradeDate).toISOString().slice(0, 7))
    );
    return Array.from(months).sort();
  }

  // TODO: Add more methods for accessing filtered or specific trade data (e.g., by symbol, date range)
} 