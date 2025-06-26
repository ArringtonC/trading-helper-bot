/**
 * Monday Range Calculator Service
 * 
 * Automates the Monday battlefield analysis strategy:
 * - Calculates Monday's SPY range (High - Low)
 * - Determines if range ≥16 points = "Boss Battle Mode" (high volatility)
 * - Sets breakout alerts for Tuesday-Thursday execution
 * 
 * Value: Saves 30 min/day manual calculation and improves breakout timing
 */

import { EventEmitter } from 'events';

export interface MondayRangeData {
  date: Date;
  symbol: string;
  high: number;
  low: number;
  range: number;
  open: number;
  close: number;
  volume: number;
  volatilityMode: 'BOSS_BATTLE' | 'STANDARD_DUNGEON';
  breakoutLevels: {
    upperBreakout: number;
    lowerBreakout: number;
    upperTarget1: number;
    upperTarget2: number;
    lowerTarget1: number;
    lowerTarget2: number;
  };
  marketCondition: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  recommendedStrategy: string;
}

export interface BreakoutAlert {
  id: string;
  timestamp: Date;
  symbol: string;
  currentPrice: number;
  breakoutLevel: number;
  breakoutType: 'ABOVE_HIGH' | 'BELOW_LOW';
  volatilityMode: 'BOSS_BATTLE' | 'STANDARD_DUNGEON';
  actionSignal: 'LONG_ATTACK' | 'SHORT_ATTACK';
  confidence: number;
  xpReward: number;
}

export interface RangeAnalysis {
  weekStartDate: Date;
  mondayRange: MondayRangeData;
  historicalAverageRange: number;
  rangePercentile: number;
  projectedWeeklyMove: number;
  breakoutProbability: {
    upperBreakout: number;
    lowerBreakout: number;
  };
  recommendations: string[];
}

export class MondayRangeCalculator extends EventEmitter {
  private static instance: MondayRangeCalculator;
  private currentMondayRange: MondayRangeData | null = null;
  private activeAlerts: Map<string, BreakoutAlert> = new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  // Historical data for analysis (mock data for demonstration)
  private historicalRanges: number[] = [
    12.5, 15.2, 18.7, 11.3, 22.4, 14.8, 16.9, 13.2, 19.5, 17.1,
    20.3, 14.5, 16.2, 12.8, 18.9, 15.7, 21.6, 13.9, 17.4, 16.8
  ];

  private constructor() {
    super();
  }

  public static getInstance(): MondayRangeCalculator {
    if (!MondayRangeCalculator.instance) {
      MondayRangeCalculator.instance = new MondayRangeCalculator();
    }
    return MondayRangeCalculator.instance;
  }

  /**
   * Calculate Monday's range for a given symbol
   */
  public async calculateMondayRange(
    symbol: string = 'SPY',
    mondayData?: {
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }
  ): Promise<MondayRangeData> {
    // In production, this would fetch real market data
    // For demo, using provided data or mock data
    const data = mondayData || this.getMockMondayData();
    
    const range = data.high - data.low;
    const volatilityMode = range >= 16 ? 'BOSS_BATTLE' : 'STANDARD_DUNGEON';
    
    // Calculate breakout levels with buffer
    const buffer = range * 0.1; // 10% buffer for false breakouts
    
    const mondayRange: MondayRangeData = {
      date: this.getLastMonday(),
      symbol,
      high: data.high,
      low: data.low,
      range: range,
      open: data.open,
      close: data.close,
      volume: data.volume,
      volatilityMode,
      breakoutLevels: {
        upperBreakout: data.high + buffer,
        lowerBreakout: data.low - buffer,
        upperTarget1: data.high + range * 0.5,
        upperTarget2: data.high + range * 1.0,
        lowerTarget1: data.low - range * 0.5,
        lowerTarget2: data.low - range * 1.0
      },
      marketCondition: this.determineMarketCondition(data),
      recommendedStrategy: this.getRecommendedStrategy(volatilityMode)
    };

    this.currentMondayRange = mondayRange;
    this.emit('rangeCalculated', mondayRange);
    
    return mondayRange;
  }

  /**
   * Analyze Monday's range in historical context
   */
  public analyzeRange(mondayRange: MondayRangeData): RangeAnalysis {
    const avgRange = this.calculateAverageRange();
    const percentile = this.calculateRangePercentile(mondayRange.range);
    
    const analysis: RangeAnalysis = {
      weekStartDate: mondayRange.date,
      mondayRange,
      historicalAverageRange: avgRange,
      rangePercentile: percentile,
      projectedWeeklyMove: this.projectWeeklyMove(mondayRange.range),
      breakoutProbability: {
        upperBreakout: this.calculateBreakoutProbability(mondayRange, 'upper'),
        lowerBreakout: this.calculateBreakoutProbability(mondayRange, 'lower')
      },
      recommendations: this.generateRecommendations(mondayRange, percentile)
    };

    return analysis;
  }

  /**
   * Start monitoring for breakout alerts
   */
  public startBreakoutMonitoring(
    currentPriceCallback: () => Promise<number>,
    intervalMs: number = 60000 // Check every minute
  ): void {
    if (!this.currentMondayRange) {
      throw new Error('No Monday range calculated. Run calculateMondayRange first.');
    }

    // Clear existing interval
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }

    // Start monitoring
    this.priceUpdateInterval = setInterval(async () => {
      try {
        const currentPrice = await currentPriceCallback();
        this.checkForBreakouts(currentPrice);
      } catch (error) {
        console.error('Error monitoring breakouts:', error);
      }
    }, intervalMs);

    console.log(`Started breakout monitoring every ${intervalMs/1000} seconds`);
  }

  /**
   * Stop breakout monitoring
   */
  public stopBreakoutMonitoring(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
      console.log('Stopped breakout monitoring');
    }
  }

  /**
   * Check current price for breakout conditions
   */
  private checkForBreakouts(currentPrice: number): void {
    if (!this.currentMondayRange) return;

    const { breakoutLevels, volatilityMode } = this.currentMondayRange;
    const alertId = `breakout-${Date.now()}`;

    // Check for upper breakout
    if (currentPrice > breakoutLevels.upperBreakout) {
      const alert: BreakoutAlert = {
        id: alertId,
        timestamp: new Date(),
        symbol: this.currentMondayRange.symbol,
        currentPrice,
        breakoutLevel: breakoutLevels.upperBreakout,
        breakoutType: 'ABOVE_HIGH',
        volatilityMode,
        actionSignal: 'LONG_ATTACK',
        confidence: this.calculateBreakoutConfidence(currentPrice, breakoutLevels.upperBreakout),
        xpReward: volatilityMode === 'BOSS_BATTLE' ? 50 : 30
      };

      if (!this.isDuplicateAlert(alert)) {
        this.activeAlerts.set(alertId, alert);
        this.emit('breakoutAlert', alert);
      }
    }

    // Check for lower breakout
    if (currentPrice < breakoutLevels.lowerBreakout) {
      const alert: BreakoutAlert = {
        id: alertId,
        timestamp: new Date(),
        symbol: this.currentMondayRange.symbol,
        currentPrice,
        breakoutLevel: breakoutLevels.lowerBreakout,
        breakoutType: 'BELOW_LOW',
        volatilityMode,
        actionSignal: 'SHORT_ATTACK',
        confidence: this.calculateBreakoutConfidence(currentPrice, breakoutLevels.lowerBreakout),
        xpReward: volatilityMode === 'BOSS_BATTLE' ? 50 : 30
      };

      if (!this.isDuplicateAlert(alert)) {
        this.activeAlerts.set(alertId, alert);
        this.emit('breakoutAlert', alert);
      }
    }
  }

  /**
   * Get battle zone markers for visualization
   */
  public getBattleZoneMarkers(): {
    mondayHigh: number;
    mondayLow: number;
    upperBreakout: number;
    lowerBreakout: number;
    targets: number[];
    labels: string[];
  } | null {
    if (!this.currentMondayRange) return null;

    const { high, low, breakoutLevels } = this.currentMondayRange;

    return {
      mondayHigh: high,
      mondayLow: low,
      upperBreakout: breakoutLevels.upperBreakout,
      lowerBreakout: breakoutLevels.lowerBreakout,
      targets: [
        breakoutLevels.upperTarget1,
        breakoutLevels.upperTarget2,
        breakoutLevels.lowerTarget1,
        breakoutLevels.lowerTarget2
      ],
      labels: [
        'Upper Target 1 (+50%)',
        'Upper Target 2 (+100%)',
        'Lower Target 1 (-50%)',
        'Lower Target 2 (-100%)'
      ]
    };
  }

  /**
   * Clear all alerts and reset
   */
  public reset(): void {
    this.currentMondayRange = null;
    this.activeAlerts.clear();
    this.stopBreakoutMonitoring();
  }

  // Helper methods
  private getMockMondayData() {
    // Mock SPY Monday data
    const basePrice = 450;
    const volatility = Math.random() > 0.3 ? 0.04 : 0.02; // 30% chance of high volatility
    
    const open = basePrice + (Math.random() - 0.5) * 5;
    const range = basePrice * volatility * (0.8 + Math.random() * 0.4);
    const high = open + range * (0.5 + Math.random() * 0.5);
    const low = high - range;
    const close = low + range * Math.random();

    return {
      open,
      high,
      low,
      close,
      volume: 80000000 + Math.random() * 40000000
    };
  }

  private getLastMonday(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysToMonday);
    lastMonday.setHours(0, 0, 0, 0);
    return lastMonday;
  }

  private determineMarketCondition(data: { open: number; close: number }): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    const changePercent = ((data.close - data.open) / data.open) * 100;
    if (changePercent > 0.5) return 'BULLISH';
    if (changePercent < -0.5) return 'BEARISH';
    return 'NEUTRAL';
  }

  private getRecommendedStrategy(volatilityMode: 'BOSS_BATTLE' | 'STANDARD_DUNGEON'): string {
    if (volatilityMode === 'BOSS_BATTLE') {
      return 'High volatility detected. Reduce position sizes by 50%. Focus on quick momentum trades with tight stops.';
    }
    return 'Normal volatility. Standard position sizes. Look for breakout continuation patterns.';
  }

  private calculateAverageRange(): number {
    return this.historicalRanges.reduce((sum, range) => sum + range, 0) / this.historicalRanges.length;
  }

  private calculateRangePercentile(currentRange: number): number {
    const belowCount = this.historicalRanges.filter(range => range < currentRange).length;
    return (belowCount / this.historicalRanges.length) * 100;
  }

  private projectWeeklyMove(mondayRange: number): number {
    // Historical analysis shows weekly move is typically 2.5x Monday's range
    return mondayRange * 2.5;
  }

  private calculateBreakoutProbability(
    mondayRange: MondayRangeData,
    direction: 'upper' | 'lower'
  ): number {
    // Simplified probability based on market condition and volatility
    const baseProb = 0.4; // 40% base probability
    let adjustment = 0;

    if (mondayRange.volatilityMode === 'BOSS_BATTLE') {
      adjustment += 0.2; // Higher volatility = higher breakout chance
    }

    if (direction === 'upper' && mondayRange.marketCondition === 'BULLISH') {
      adjustment += 0.15;
    } else if (direction === 'lower' && mondayRange.marketCondition === 'BEARISH') {
      adjustment += 0.15;
    }

    return Math.min(baseProb + adjustment, 0.75); // Cap at 75%
  }

  private generateRecommendations(mondayRange: MondayRangeData, percentile: number): string[] {
    const recommendations: string[] = [];

    if (mondayRange.volatilityMode === 'BOSS_BATTLE') {
      recommendations.push('⚠️ BOSS BATTLE MODE: Reduce all position sizes by 50%');
      recommendations.push('🛡️ Use wider stops to avoid volatility shakeouts');
      recommendations.push('⚡ Focus on momentum trades over mean reversion');
    } else {
      recommendations.push('✅ Standard volatility: Normal position sizing applies');
      recommendations.push('🎯 Look for clean breakouts with volume confirmation');
      recommendations.push('📊 Mean reversion strategies may work well');
    }

    if (percentile > 80) {
      recommendations.push('📈 Range in top 20% - Expect continued volatility');
    } else if (percentile < 20) {
      recommendations.push('😴 Range in bottom 20% - Possible volatility expansion coming');
    }

    return recommendations;
  }

  private calculateBreakoutConfidence(currentPrice: number, breakoutLevel: number): number {
    const distance = Math.abs(currentPrice - breakoutLevel);
    const percentAbove = (distance / breakoutLevel) * 100;
    
    // Higher distance from breakout = higher confidence
    if (percentAbove > 1) return 0.9;
    if (percentAbove > 0.5) return 0.7;
    if (percentAbove > 0.25) return 0.5;
    return 0.3;
  }

  private isDuplicateAlert(newAlert: BreakoutAlert): boolean {
    // Check if we already have a similar alert in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    for (const [_, alert] of this.activeAlerts) {
      if (
        alert.breakoutType === newAlert.breakoutType &&
        alert.timestamp > fiveMinutesAgo
      ) {
        return true;
      }
    }
    
    return false;
  }
}

export default MondayRangeCalculator;