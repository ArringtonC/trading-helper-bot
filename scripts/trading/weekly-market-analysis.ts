#!/usr/bin/env ts-node

/**
 * Weekly Market Analysis Script for RPG Trading Challenge
 * Automatically gathers market intelligence for Sunday planning sessions
 */

import fs from 'fs';
import path from 'path';

interface MarketConditions {
  spyTrend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  vixLevel: number;
  vixTrend: 'RISING' | 'FALLING' | 'STABLE';
  sectorRotation: {
    leading: string[];
    lagging: string[];
  };
  marketRegime: 'RISK_ON' | 'RISK_OFF' | 'NEUTRAL';
  volatilityLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
}

interface EconomicEvent {
  date: string;
  time: string;
  event: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  actual?: string;
  forecast?: string;
  previous?: string;
}

interface EarningsEvent {
  symbol: string;
  date: string;
  time: 'BMO' | 'AMC'; // Before Market Open / After Market Close
  estimatedEPS?: number;
  actualEPS?: number;
  marketCap: string;
  sector: string;
}

interface WeeklyAnalysisReport {
  weekOf: string;
  marketConditions: MarketConditions;
  economicEvents: EconomicEvent[];
  majorEarnings: EarningsEvent[];
  recommendedStrategies: {
    primary: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
    secondary?: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
    reasoning: string;
  };
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  watchlistSuggestions: {
    symbol: string;
    reason: string;
    strategy: string;
    entryZone?: string;
    stopLevel?: string;
  }[];
  weeklyTargetAdjustment: number; // Percentage adjustment to $2,500 base target
}

class WeeklyMarketAnalyzer {
  private apiKey: string;
  private outputDir: string;

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    this.outputDir = path.join(process.cwd(), 'public', 'data', 'market-analysis');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateWeeklyReport(): Promise<WeeklyAnalysisReport> {
    console.log('🎮 Generating Weekly Market Analysis for RPG Challenge...');

    const weekOf = this.getNextMonday();
    
    try {
      // Parallel data gathering
      const [marketConditions, economicEvents, earnings] = await Promise.all([
        this.analyzeMarketConditions(),
        this.getEconomicEvents(weekOf),
        this.getMajorEarnings(weekOf)
      ]);

      const recommendedStrategies = this.determineOptimalStrategies(marketConditions);
      const riskLevel = this.assessRiskLevel(marketConditions, economicEvents);
      const watchlistSuggestions = this.generateWatchlist(marketConditions, recommendedStrategies.primary);
      const weeklyTargetAdjustment = this.calculateTargetAdjustment(riskLevel, marketConditions.volatilityLevel);

      const report: WeeklyAnalysisReport = {
        weekOf,
        marketConditions,
        economicEvents,
        majorEarnings: earnings,
        recommendedStrategies,
        riskLevel,
        watchlistSuggestions,
        weeklyTargetAdjustment
      };

      // Save report for challenge system
      await this.saveReport(report);
      
      console.log(`✅ Weekly analysis complete for ${weekOf}`);
      console.log(`📊 Market Regime: ${marketConditions.marketRegime}`);
      console.log(`🎯 Primary Strategy: ${recommendedStrategies.primary}`);
      console.log(`⚠️ Risk Level: ${riskLevel}`);
      
      return report;

    } catch (error) {
      console.error('❌ Error generating weekly report:', error);
      throw error;
    }
  }

  private async analyzeMarketConditions(): Promise<MarketConditions> {
    // Mock implementation - replace with real market data APIs
    console.log('📈 Analyzing current market conditions...');

    // Simulate market analysis
    const mockConditions: MarketConditions = {
      spyTrend: 'BULLISH',
      vixLevel: 18.5,
      vixTrend: 'FALLING',
      sectorRotation: {
        leading: ['Technology', 'Consumer Discretionary', 'Communication Services'],
        lagging: ['Energy', 'Utilities', 'Real Estate']
      },
      marketRegime: 'RISK_ON',
      volatilityLevel: 'NORMAL'
    };

    // TODO: Replace with actual market data API calls
    // - SPY price action analysis (20, 50, 200 day MAs)
    // - VIX level and trend analysis
    // - Sector performance comparison
    // - Volume analysis
    // - Breadth indicators (advance/decline, new highs/lows)

    return mockConditions;
  }

  private async getEconomicEvents(weekOf: string): Promise<EconomicEvent[]> {
    console.log('📅 Fetching economic calendar events...');

    // Mock economic events - replace with actual economic calendar API
    const mockEvents: EconomicEvent[] = [
      {
        date: '2024-06-25',
        time: '08:30',
        event: 'Initial Jobless Claims',
        impact: 'MEDIUM',
        forecast: '225K',
        previous: '229K'
      },
      {
        date: '2024-06-26',
        time: '14:00',
        event: 'FOMC Meeting Decision',
        impact: 'HIGH',
        forecast: '5.25%',
        previous: '5.25%'
      },
      {
        date: '2024-06-28',
        time: '08:30',
        event: 'Personal Income',
        impact: 'MEDIUM',
        forecast: '0.3%',
        previous: '0.2%'
      }
    ];

    // TODO: Replace with actual economic calendar API
    // - Trading Economics API
    // - Economic Calendar from Forex Factory
    // - Federal Reserve announcements

    return mockEvents;
  }

  private async getMajorEarnings(weekOf: string): Promise<EarningsEvent[]> {
    console.log('💼 Fetching major earnings announcements...');

    // Mock earnings data - replace with actual earnings calendar
    const mockEarnings: EarningsEvent[] = [
      {
        symbol: 'AAPL',
        date: '2024-06-25',
        time: 'AMC',
        estimatedEPS: 1.35,
        marketCap: 'Large',
        sector: 'Technology'
      },
      {
        symbol: 'MSFT',
        date: '2024-06-26',
        time: 'AMC',
        estimatedEPS: 2.45,
        marketCap: 'Large',
        sector: 'Technology'
      },
      {
        symbol: 'AMZN',
        date: '2024-06-27',
        time: 'AMC',
        estimatedEPS: 0.85,
        marketCap: 'Large',
        sector: 'Consumer Discretionary'
      }
    ];

    // TODO: Replace with actual earnings calendar API
    // - Alpha Vantage earnings calendar
    // - Yahoo Finance earnings
    // - Seeking Alpha earnings data

    return mockEarnings;
  }

  private determineOptimalStrategies(conditions: MarketConditions): WeeklyAnalysisReport['recommendedStrategies'] {
    console.log('🎭 Determining optimal strategy classes...');

    let primary: WeeklyAnalysisReport['recommendedStrategies']['primary'];
    let secondary: WeeklyAnalysisReport['recommendedStrategies']['secondary'];
    let reasoning: string;

    if (conditions.marketRegime === 'RISK_ON' && conditions.spyTrend === 'BULLISH') {
      if (conditions.volatilityLevel === 'LOW') {
        primary = 'BUFFETT_GUARDIAN';
        secondary = 'LYNCH_SCOUT';
        reasoning = 'Low volatility bull market favors value accumulation and growth stock selection';
      } else {
        primary = 'DALIO_WARRIOR';
        secondary = 'LYNCH_SCOUT';
        reasoning = 'Rising volatility in bull market calls for momentum strategies with growth exposure';
      }
    } else if (conditions.marketRegime === 'RISK_OFF' || conditions.spyTrend === 'BEARISH') {
      primary = 'SOROS_ASSASSIN';
      reasoning = 'Risk-off environment requires contrarian positioning and tactical flexibility';
    } else {
      primary = 'DALIO_WARRIOR';
      reasoning = 'Neutral/sideways market favors diversified trend-following approach';
    }

    return { primary, secondary, reasoning };
  }

  private assessRiskLevel(conditions: MarketConditions, events: EconomicEvent[]): 'LOW' | 'MODERATE' | 'HIGH' {
    let riskScore = 0;

    // VIX level assessment
    if (conditions.vixLevel > 30) riskScore += 3;
    else if (conditions.vixLevel > 20) riskScore += 2;
    else if (conditions.vixLevel > 15) riskScore += 1;

    // High impact events
    const highImpactEvents = events.filter(e => e.impact === 'HIGH').length;
    riskScore += highImpactEvents * 2;

    // Market regime
    if (conditions.marketRegime === 'RISK_OFF') riskScore += 2;

    // Volatility level
    if (conditions.volatilityLevel === 'EXTREME') riskScore += 3;
    else if (conditions.volatilityLevel === 'HIGH') riskScore += 2;

    if (riskScore >= 6) return 'HIGH';
    if (riskScore >= 3) return 'MODERATE';
    return 'LOW';
  }

  private generateWatchlist(conditions: MarketConditions, primaryStrategy: string): WeeklyAnalysisReport['watchlistSuggestions'] {
    console.log('🎯 Generating strategic watchlist...');

    const suggestions: WeeklyAnalysisReport['watchlistSuggestions'] = [];

    switch (primaryStrategy) {
      case 'BUFFETT_GUARDIAN':
        suggestions.push(
          {
            symbol: 'AAPL',
            reason: 'Strong fundamentals, reasonable valuation, dividend growth',
            strategy: 'Value accumulation on dips',
            entryZone: '$175-180',
            stopLevel: '$165'
          },
          {
            symbol: 'MSFT',
            reason: 'Cloud dominance, consistent cash flow, moat protection',
            strategy: 'Long-term position building',
            entryZone: '$420-430',
            stopLevel: '$400'
          }
        );
        break;

      case 'DALIO_WARRIOR':
        suggestions.push(
          {
            symbol: 'SPY',
            reason: 'Broad market momentum, trend continuation',
            strategy: 'Trend following with momentum confirmation',
            entryZone: 'Above $520',
            stopLevel: '$515'
          },
          {
            symbol: 'QQQ',
            reason: 'Tech sector leadership, momentum acceleration',
            strategy: 'Growth momentum play',
            entryZone: 'Above $450',
            stopLevel: '$445'
          }
        );
        break;

      case 'SOROS_ASSASSIN':
        suggestions.push(
          {
            symbol: 'UVXY',
            reason: 'Volatility spike potential, contrarian positioning',
            strategy: 'Short-term volatility trade',
            entryZone: '$12-13',
            stopLevel: '$15'
          },
          {
            symbol: 'TLT',
            reason: 'Flight to safety, bond rally potential',
            strategy: 'Risk-off hedge position',
            entryZone: '$95-97',
            stopLevel: '$92'
          }
        );
        break;

      case 'LYNCH_SCOUT':
        suggestions.push(
          {
            symbol: 'NVDA',
            reason: 'AI growth story, earnings momentum',
            strategy: 'Growth at reasonable price',
            entryZone: '$900-920',
            stopLevel: '$850'
          },
          {
            symbol: 'GOOGL',
            reason: 'AI integration, search dominance, cloud growth',
            strategy: 'Quality growth with AI exposure',
            entryZone: '$160-165',
            stopLevel: '$150'
          }
        );
        break;
    }

    // Add SPY for Monday range analysis regardless of strategy
    if (!suggestions.some(s => s.symbol === 'SPY')) {
      suggestions.push({
        symbol: 'SPY',
        reason: 'Monday range analysis - required for all strategies',
        strategy: 'Breakout setup identification',
        entryZone: 'Above Monday high',
        stopLevel: 'Monday low'
      });
    }

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }

  private calculateTargetAdjustment(riskLevel: string, volatilityLevel: string): number {
    // Adjust weekly $2,500 target based on market conditions
    let adjustment = 0;

    if (riskLevel === 'HIGH') adjustment -= 0.3; // -30% in high risk
    else if (riskLevel === 'LOW') adjustment += 0.2; // +20% in low risk

    if (volatilityLevel === 'EXTREME') adjustment -= 0.2;
    else if (volatilityLevel === 'LOW') adjustment += 0.1;

    return Math.max(-0.5, Math.min(0.5, adjustment)); // Cap at ±50%
  }

  private getNextMonday(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // 0 = Sunday
    const nextMonday = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
    return nextMonday.toISOString().split('T')[0];
  }

  private async saveReport(report: WeeklyAnalysisReport): Promise<void> {
    const filename = `weekly-analysis-${report.weekOf}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    // Also save as latest.json for easy access by the app
    const latestPath = path.join(this.outputDir, 'latest-analysis.json');
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved to: ${filepath}`);
  }
}

// CLI execution
async function main() {
  try {
    const analyzer = new WeeklyMarketAnalyzer();
    const report = await analyzer.generateWeeklyReport();
    
    console.log('\n🎮 Weekly Market Analysis Complete!');
    console.log('📊 Report available at: public/data/market-analysis/latest-analysis.json');
    console.log('🚀 Ready for Sunday planning session in the RPG challenge!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to generate weekly analysis:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { WeeklyMarketAnalyzer, type WeeklyAnalysisReport };