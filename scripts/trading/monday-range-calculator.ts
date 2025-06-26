#!/usr/bin/env ts-node

/**
 * Monday Range Calculator Script for RPG Trading Challenge
 * Analyzes Monday's price action to set up Tuesday-Thursday battle strategy
 */

import fs from 'fs';
import path from 'path';

interface MondayRangeData {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  range: number;
  rangePercent: number;
}

interface RangeAnalysis {
  date: string;
  symbol: string;
  rangeData: MondayRangeData;
  classification: 'HUGE_RANGE' | 'LARGE_RANGE' | 'NORMAL_RANGE' | 'SMALL_RANGE';
  battleStrategy: {
    type: 'HIGH_VOLATILITY_BREAKOUT' | 'COMPRESSION_SETUP' | 'STANDARD_RANGE' | 'TREND_CONTINUATION';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
  };
  breakoutLevels: {
    bullishBreakout: number;
    bearishBreakout: number;
    midpoint: number;
  };
  stopLossLevels: {
    bullish: number;
    bearish: number;
  };
  positionSizing: {
    riskLevel: 'LOW' | 'NORMAL' | 'HIGH';
    maxPositionSize: number; // Percentage of account
    recommendedRisk: number; // Percentage per trade
  };
  tradingSignals: {
    setup: string;
    entry: string;
    stop: string;
    target: string;
    riskReward: number;
  }[];
}

class MondayRangeCalculator {
  private dataDir: string;
  private outputDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'public', 'data');
    this.outputDir = path.join(this.dataDir, 'monday-analysis');
    
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async analyzeMondayRange(symbol: string = 'SPY'): Promise<RangeAnalysis> {
    console.log(`🏕️ Analyzing Monday range for ${symbol}...`);

    try {
      const mondayData = await this.getMondayPriceData(symbol);
      const classification = this.classifyRange(mondayData);
      const battleStrategy = this.determineBattleStrategy(mondayData, classification);
      const breakoutLevels = this.calculateBreakoutLevels(mondayData);
      const stopLossLevels = this.calculateStopLossLevels(mondayData, classification);
      const positionSizing = this.calculatePositionSizing(classification, mondayData);
      const tradingSignals = this.generateTradingSignals(mondayData, breakoutLevels, stopLossLevels);

      const analysis: RangeAnalysis = {
        date: mondayData.date,
        symbol: mondayData.symbol,
        rangeData: mondayData,
        classification,
        battleStrategy,
        breakoutLevels,
        stopLossLevels,
        positionSizing,
        tradingSignals
      };

      await this.saveAnalysis(analysis);
      this.displayAnalysis(analysis);

      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing Monday range:', error);
      throw error;
    }
  }

  private async getMondayPriceData(symbol: string): Promise<MondayRangeData> {
    // Mock Monday data - replace with actual market data API
    const mockData: MondayRangeData = {
      symbol,
      date: this.getLastMonday(),
      open: 520.15,
      high: 523.75,
      low: 518.20,
      close: 522.40,
      volume: 85000000,
      range: 5.55, // high - low
      rangePercent: 1.07 // (range / close) * 100
    };

    // TODO: Replace with actual market data API call
    // - Alpha Vantage daily data
    // - Yahoo Finance API
    // - Polygon.io market data
    
    console.log(`📊 Monday Data: ${symbol} Range: $${mockData.range.toFixed(2)} (${mockData.rangePercent.toFixed(2)}%)`);
    
    return mockData;
  }

  private classifyRange(data: MondayRangeData): RangeAnalysis['classification'] {
    const { range, rangePercent } = data;

    // SPY-specific thresholds (adjust for other symbols)
    if (range >= 16 || rangePercent >= 3.0) {
      return 'HUGE_RANGE';
    } else if (range >= 10 || rangePercent >= 2.0) {
      return 'LARGE_RANGE';
    } else if (range >= 5 || rangePercent >= 1.0) {
      return 'NORMAL_RANGE';
    } else {
      return 'SMALL_RANGE';
    }
  }

  private determineBattleStrategy(data: MondayRangeData, classification: RangeAnalysis['classification']): RangeAnalysis['battleStrategy'] {
    switch (classification) {
      case 'HUGE_RANGE':
        return {
          type: 'HIGH_VOLATILITY_BREAKOUT',
          confidence: 'HIGH',
          description: '⚔️ BOSS BATTLE MODE: Huge volatility detected. Wait for confirmed breakout with volume. High risk, high reward scenario.'
        };

      case 'LARGE_RANGE':
        return {
          type: 'STANDARD_RANGE',
          confidence: 'MEDIUM',
          description: '🎯 Standard volatility setup. Look for breakout above/below Monday range with good risk/reward ratios.'
        };

      case 'NORMAL_RANGE':
        return {
          type: 'STANDARD_RANGE',
          confidence: 'MEDIUM',
          description: '📈 Normal market conditions. Follow Monday high/low breakout strategy with standard position sizing.'
        };

      case 'SMALL_RANGE':
        return {
          type: 'COMPRESSION_SETUP',
          confidence: 'MEDIUM',
          description: '🐌 Low volatility compression. Prepare for potential volatility expansion. Smaller positions recommended.'
        };

      default:
        return {
          type: 'STANDARD_RANGE',
          confidence: 'LOW',
          description: '❓ Unknown range classification. Use standard breakout approach with caution.'
        };
    }
  }

  private calculateBreakoutLevels(data: MondayRangeData): RangeAnalysis['breakoutLevels'] {
    const { high, low, range } = data;
    
    return {
      bullishBreakout: high + (range * 0.1), // 10% of range above high
      bearishBreakout: low - (range * 0.1),  // 10% of range below low
      midpoint: (high + low) / 2
    };
  }

  private calculateStopLossLevels(data: MondayRangeData, classification: RangeAnalysis['classification']): RangeAnalysis['stopLossLevels'] {
    const { high, low, range } = data;

    if (classification === 'HUGE_RANGE') {
      // For huge ranges, use 50% of range for stops
      return {
        bullish: high - (range * 0.5),
        bearish: low + (range * 0.5)
      };
    } else {
      // For normal ranges, use Monday low/high as stops
      return {
        bullish: low,
        bearish: high
      };
    }
  }

  private calculatePositionSizing(classification: RangeAnalysis['classification'], data: MondayRangeData): RangeAnalysis['positionSizing'] {
    switch (classification) {
      case 'HUGE_RANGE':
        return {
          riskLevel: 'HIGH',
          maxPositionSize: 15, // 15% max position size
          recommendedRisk: 1.5  // 1.5% risk per trade
        };

      case 'LARGE_RANGE':
        return {
          riskLevel: 'NORMAL',
          maxPositionSize: 20, // 20% max position size
          recommendedRisk: 2.0  // 2% risk per trade
        };

      case 'SMALL_RANGE':
        return {
          riskLevel: 'LOW',
          maxPositionSize: 25, // 25% max position size
          recommendedRisk: 1.0  // 1% risk per trade (smaller ranges = smaller moves)
        };

      default:
        return {
          riskLevel: 'NORMAL',
          maxPositionSize: 20,
          recommendedRisk: 2.0
        };
    }
  }

  private generateTradingSignals(data: MondayRangeData, breakouts: RangeAnalysis['breakoutLevels'], stops: RangeAnalysis['stopLossLevels']): RangeAnalysis['tradingSignals'] {
    const signals: RangeAnalysis['tradingSignals'] = [];

    // Bullish breakout signal
    const bullishTarget = breakouts.bullishBreakout + (data.range * 0.5);
    const bullishRisk = breakouts.bullishBreakout - stops.bullish;
    const bullishReward = bullishTarget - breakouts.bullishBreakout;
    
    signals.push({
      setup: 'Bullish Breakout',
      entry: `Above $${breakouts.bullishBreakout.toFixed(2)}`,
      stop: `$${stops.bullish.toFixed(2)}`,
      target: `$${bullishTarget.toFixed(2)}`,
      riskReward: Number((bullishReward / bullishRisk).toFixed(2))
    });

    // Bearish breakout signal
    const bearishTarget = breakouts.bearishBreakout - (data.range * 0.5);
    const bearishRisk = stops.bearish - breakouts.bearishBreakout;
    const bearishReward = breakouts.bearishBreakout - bearishTarget;
    
    signals.push({
      setup: 'Bearish Breakout',
      entry: `Below $${breakouts.bearishBreakout.toFixed(2)}`,
      stop: `$${stops.bearish.toFixed(2)}`,
      target: `$${bearishTarget.toFixed(2)}`,
      riskReward: Number((bearishReward / bearishRisk).toFixed(2))
    });

    return signals;
  }

  private getLastMonday(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Calculate days to subtract to get to last Monday
    let daysBack;
    if (dayOfWeek === 0) { // Sunday
      daysBack = 6;
    } else if (dayOfWeek === 1) { // Monday
      daysBack = 0; // Today is Monday
    } else {
      daysBack = dayOfWeek - 1; // Days since Monday
    }
    
    const lastMonday = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    return lastMonday.toISOString().split('T')[0];
  }

  private async saveAnalysis(analysis: RangeAnalysis): Promise<void> {
    const filename = `monday-range-${analysis.date}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));
    
    // Save as latest for easy access
    const latestPath = path.join(this.outputDir, 'latest-monday-analysis.json');
    fs.writeFileSync(latestPath, JSON.stringify(analysis, null, 2));
    
    console.log(`📄 Monday analysis saved: ${filepath}`);
  }

  private displayAnalysis(analysis: RangeAnalysis): void {
    console.log('\n🏕️ MONDAY RANGE ANALYSIS COMPLETE');
    console.log('═'.repeat(50));
    console.log(`📊 Symbol: ${analysis.symbol}`);
    console.log(`📅 Date: ${analysis.date}`);
    console.log(`📏 Range: $${analysis.rangeData.range.toFixed(2)} (${analysis.rangeData.rangePercent.toFixed(2)}%)`);
    console.log(`🏷️ Classification: ${analysis.classification}`);
    console.log(`⚔️ Battle Strategy: ${analysis.battleStrategy.type}`);
    console.log(`🎯 Confidence: ${analysis.battleStrategy.confidence}`);
    console.log(`📝 Description: ${analysis.battleStrategy.description}`);
    
    console.log('\n🎯 BREAKOUT LEVELS:');
    console.log(`📈 Bullish: $${analysis.breakoutLevels.bullishBreakout.toFixed(2)}`);
    console.log(`📉 Bearish: $${analysis.breakoutLevels.bearishBreakout.toFixed(2)}`);
    console.log(`⚖️ Midpoint: $${analysis.breakoutLevels.midpoint.toFixed(2)}`);
    
    console.log('\n🛡️ STOP LOSS LEVELS:');
    console.log(`📈 Bullish Stop: $${analysis.stopLossLevels.bullish.toFixed(2)}`);
    console.log(`📉 Bearish Stop: $${analysis.stopLossLevels.bearish.toFixed(2)}`);
    
    console.log('\n💰 POSITION SIZING:');
    console.log(`⚠️ Risk Level: ${analysis.positionSizing.riskLevel}`);
    console.log(`📊 Max Position: ${analysis.positionSizing.maxPositionSize}%`);
    console.log(`🎯 Recommended Risk: ${analysis.positionSizing.recommendedRisk}%`);
    
    console.log('\n⚔️ TRADING SIGNALS:');
    analysis.tradingSignals.forEach((signal, index) => {
      console.log(`${index + 1}. ${signal.setup}:`);
      console.log(`   Entry: ${signal.entry}`);
      console.log(`   Stop: ${signal.stop}`);
      console.log(`   Target: ${signal.target}`);
      console.log(`   Risk/Reward: ${signal.riskReward}:1`);
    });
    
    console.log('\n🚀 Ready for Tuesday-Thursday execution phase!');
  }
}

// CLI execution
async function main() {
  try {
    const calculator = new MondayRangeCalculator();
    const symbol = process.argv[2] || 'SPY';
    
    await calculator.analyzeMondayRange(symbol);
    
    console.log('\n🎮 Monday Range Analysis Complete!');
    console.log('📊 Analysis available at: public/data/monday-analysis/latest-monday-analysis.json');
    console.log('⚔️ Ready for combat execution in the RPG challenge!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to analyze Monday range:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { MondayRangeCalculator, type RangeAnalysis };