#!/usr/bin/env ts-node

/**
 * Strategy Optimizer Script for RPG Trading Challenge
 * Analyzes performance and recommends optimal strategy class selection
 */

import fs from 'fs';
import path from 'path';

interface StrategyPerformance {
  strategyClass: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
  period: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  totalPnL: number;
  maxDrawdown: number;
  averageHoldTime: number; // in hours
  bestSetups: string[];
  worstSetups: string[];
  marketConditions: {
    bullMarket: { trades: number; winRate: number; pnl: number };
    bearMarket: { trades: number; winRate: number; pnl: number };
    sidewaysMarket: { trades: number; winRate: number; pnl: number };
  };
}

interface StrategyRecommendation {
  date: string;
  currentMarketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE';
  recommendedStrategy: {
    primary: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
    secondary?: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reasoning: string;
  };
  strategyPerformance: StrategyPerformance[];
  optimizationSuggestions: {
    category: 'ENTRY_TIMING' | 'POSITION_SIZING' | 'STOP_PLACEMENT' | 'PROFIT_TAKING' | 'MARKET_SELECTION';
    suggestion: string;
    expectedImprovement: string;
  }[];
  riskAdjustment: {
    currentRisk: number;
    recommendedRisk: number;
    reasoning: string;
  };
}

class StrategyOptimizer {
  private dataDir: string;
  private outputDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'public', 'data');
    this.outputDir = path.join(this.dataDir, 'strategy-optimization');
    
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async optimizeStrategy(): Promise<StrategyRecommendation> {
    console.log('🎯 Optimizing trading strategy selection...');

    try {
      const marketRegime = await this.analyzeCurrentMarketRegime();
      const strategyPerformance = await this.analyzeStrategyPerformance();
      const recommendedStrategy = this.determineOptimalStrategy(marketRegime, strategyPerformance);
      const optimizationSuggestions = this.generateOptimizationSuggestions(strategyPerformance);
      const riskAdjustment = this.calculateRiskAdjustment(strategyPerformance, marketRegime);

      const recommendation: StrategyRecommendation = {
        date: new Date().toISOString().split('T')[0],
        currentMarketRegime: marketRegime,
        recommendedStrategy,
        strategyPerformance,
        optimizationSuggestions,
        riskAdjustment
      };

      await this.saveRecommendation(recommendation);
      this.displayRecommendation(recommendation);

      return recommendation;

    } catch (error) {
      console.error('❌ Error optimizing strategy:', error);
      throw error;
    }
  }

  private async analyzeCurrentMarketRegime(): Promise<'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE'> {
    console.log('📊 Analyzing current market regime...');

    // Mock market analysis - replace with actual market data
    // TODO: Integrate with real market data APIs
    // - SPY 20/50/200 day moving averages
    // - VIX levels and trends
    // - Market breadth indicators
    // - Sector rotation analysis

    const mockRegime: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE' = 'BULL';
    console.log(`📈 Current market regime: ${mockRegime}`);
    
    return mockRegime;
  }

  private async analyzeStrategyPerformance(): Promise<StrategyPerformance[]> {
    console.log('📈 Analyzing strategy class performance...');

    // Mock performance data - replace with actual trading history analysis
    const mockPerformance: StrategyPerformance[] = [
      {
        strategyClass: 'BUFFETT_GUARDIAN',
        period: 'Last 30 days',
        totalTrades: 12,
        winningTrades: 8,
        losingTrades: 4,
        winRate: 66.7,
        averageWin: 2.3,
        averageLoss: -1.2,
        profitFactor: 1.53,
        totalPnL: 850,
        maxDrawdown: -180,
        averageHoldTime: 48,
        bestSetups: ['Value dip buying', 'Dividend plays', 'Earnings reactions'],
        worstSetups: ['Momentum chasing', 'Growth at any price'],
        marketConditions: {
          bullMarket: { trades: 8, winRate: 75.0, pnl: 650 },
          bearMarket: { trades: 2, winRate: 50.0, pnl: 100 },
          sidewaysMarket: { trades: 2, winRate: 50.0, pnl: 100 }
        }
      },
      {
        strategyClass: 'DALIO_WARRIOR',
        period: 'Last 30 days',
        totalTrades: 18,
        winningTrades: 11,
        losingTrades: 7,
        winRate: 61.1,
        averageWin: 1.8,
        averageLoss: -1.5,
        profitFactor: 1.32,
        totalPnL: 720,
        maxDrawdown: -220,
        averageHoldTime: 24,
        bestSetups: ['Trend following', 'Momentum breakouts', 'ETF rotations'],
        worstSetups: ['Counter-trend trades', 'Range trading'],
        marketConditions: {
          bullMarket: { trades: 12, winRate: 66.7, pnl: 580 },
          bearMarket: { trades: 3, winRate: 33.3, pnl: 50 },
          sidewaysMarket: { trades: 3, winRate: 66.7, pnl: 90 }
        }
      },
      {
        strategyClass: 'SOROS_ASSASSIN',
        period: 'Last 30 days',
        totalTrades: 8,
        winningTrades: 6,
        losingTrades: 2,
        winRate: 75.0,
        averageWin: 3.2,
        averageLoss: -2.1,
        profitFactor: 2.29,
        totalPnL: 1150,
        maxDrawdown: -150,
        averageHoldTime: 6,
        bestSetups: ['Volatility spikes', 'Event-driven trades', 'Contrarian positioning'],
        worstSetups: ['Low volatility periods', 'Trend following'],
        marketConditions: {
          bullMarket: { trades: 2, winRate: 50.0, pnl: 200 },
          bearMarket: { trades: 4, winRate: 100.0, pnl: 800 },
          sidewaysMarket: { trades: 2, winRate: 75.0, pnl: 150 }
        }
      },
      {
        strategyClass: 'LYNCH_SCOUT',
        period: 'Last 30 days',
        totalTrades: 10,
        winningTrades: 7,
        losingTrades: 3,
        winRate: 70.0,
        averageWin: 2.8,
        averageLoss: -1.8,
        profitFactor: 1.89,
        totalPnL: 950,
        maxDrawdown: -200,
        averageHoldTime: 72,
        bestSetups: ['Growth at reasonable price', 'Earnings growth', 'Sector leadership'],
        worstSetups: ['Value traps', 'Momentum fading'],
        marketConditions: {
          bullMarket: { trades: 7, winRate: 85.7, pnl: 750 },
          bearMarket: { trades: 1, winRate: 0.0, pnl: -50 },
          sidewaysMarket: { trades: 2, winRate: 50.0, pnl: 250 }
        }
      }
    ];

    // TODO: Replace with actual performance analysis from trading history
    // - Parse trade logs from database
    // - Calculate performance metrics by strategy
    // - Analyze market condition performance
    // - Identify best/worst setups

    return mockPerformance;
  }

  private determineOptimalStrategy(
    marketRegime: string, 
    performance: StrategyPerformance[]
  ): StrategyRecommendation['recommendedStrategy'] {
    
    console.log('🎭 Determining optimal strategy class...');

    // Score each strategy based on current market conditions and performance
    const strategyScores = performance.map(perf => {
      let score = 0;

      // Base performance score
      score += perf.profitFactor * 20;
      score += perf.winRate * 0.5;
      score += (perf.totalPnL / 1000) * 10;

      // Market regime bonus
      switch (marketRegime) {
        case 'BULL':
          if (perf.strategyClass === 'LYNCH_SCOUT') score += 25;
          if (perf.strategyClass === 'BUFFETT_GUARDIAN') score += 20;
          if (perf.strategyClass === 'DALIO_WARRIOR') score += 15;
          break;
        case 'BEAR':
          if (perf.strategyClass === 'SOROS_ASSASSIN') score += 30;
          if (perf.strategyClass === 'BUFFETT_GUARDIAN') score += 15;
          break;
        case 'SIDEWAYS':
          if (perf.strategyClass === 'BUFFETT_GUARDIAN') score += 25;
          if (perf.strategyClass === 'SOROS_ASSASSIN') score += 20;
          break;
        case 'VOLATILE':
          if (perf.strategyClass === 'SOROS_ASSASSIN') score += 30;
          if (perf.strategyClass === 'DALIO_WARRIOR') score += 15;
          break;
      }

      return { strategy: perf.strategyClass, score };
    });

    // Sort by score
    strategyScores.sort((a, b) => b.score - a.score);

    const topStrategy = strategyScores[0];
    const secondStrategy = strategyScores[1];

    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (topStrategy.score > secondStrategy.score + 15) confidence = 'HIGH';
    if (topStrategy.score < secondStrategy.score + 5) confidence = 'LOW';

    const reasoning = this.generateStrategyReasoning(
      topStrategy.strategy, 
      marketRegime, 
      performance.find(p => p.strategyClass === topStrategy.strategy)!
    );

    return {
      primary: topStrategy.strategy,
      secondary: strategyScores[1].strategy,
      confidence,
      reasoning
    };
  }

  private generateStrategyReasoning(
    strategy: string, 
    marketRegime: string, 
    performance: StrategyPerformance
  ): string {
    const baseReasoning = `${strategy} selected based on ${performance.winRate.toFixed(1)}% win rate and ${performance.profitFactor.toFixed(2)} profit factor`;
    
    const marketReasoning = {
      'BULL': 'Current bull market conditions favor growth and value accumulation strategies',
      'BEAR': 'Bear market environment requires defensive positioning and contrarian opportunities',
      'SIDEWAYS': 'Range-bound market calls for value plays and selective opportunities',
      'VOLATILE': 'High volatility environment favors nimble, event-driven strategies'
    };

    return `${baseReasoning}. ${marketReasoning[marketRegime as keyof typeof marketReasoning]}. Best setups: ${performance.bestSetups.slice(0, 2).join(', ')}.`;
  }

  private generateOptimizationSuggestions(performance: StrategyPerformance[]): StrategyRecommendation['optimizationSuggestions'] {
    const suggestions: StrategyRecommendation['optimizationSuggestions'] = [];

    // Analyze common weaknesses across strategies
    const avgWinRate = performance.reduce((sum, p) => sum + p.winRate, 0) / performance.length;
    const avgProfitFactor = performance.reduce((sum, p) => sum + p.profitFactor, 0) / performance.length;

    if (avgWinRate < 60) {
      suggestions.push({
        category: 'ENTRY_TIMING',
        suggestion: 'Improve entry timing by waiting for stronger confirmation signals',
        expectedImprovement: '+10-15% win rate improvement'
      });
    }

    if (avgProfitFactor < 1.5) {
      suggestions.push({
        category: 'STOP_PLACEMENT',
        suggestion: 'Optimize stop-loss placement to improve risk/reward ratios',
        expectedImprovement: '+20-30% profit factor improvement'
      });
    }

    // Check for position sizing issues
    const highDrawdownStrategies = performance.filter(p => Math.abs(p.maxDrawdown) > 250);
    if (highDrawdownStrategies.length > 0) {
      suggestions.push({
        category: 'POSITION_SIZING',
        suggestion: 'Reduce position sizes during high volatility periods',
        expectedImprovement: '-30-40% maximum drawdown reduction'
      });
    }

    // Profit taking optimization
    suggestions.push({
      category: 'PROFIT_TAKING',
      suggestion: 'Implement systematic profit-taking at 2:1 and 3:1 risk/reward levels',
      expectedImprovement: '+15-25% profit factor improvement'
    });

    return suggestions;
  }

  private calculateRiskAdjustment(
    performance: StrategyPerformance[], 
    marketRegime: string
  ): StrategyRecommendation['riskAdjustment'] {
    
    const currentRisk = 2.0; // Assume 2% current risk per trade
    let recommendedRisk = currentRisk;
    let reasoning = '';

    // Calculate average drawdown across strategies
    const avgDrawdown = performance.reduce((sum, p) => sum + Math.abs(p.maxDrawdown), 0) / performance.length;

    if (avgDrawdown > 300) {
      recommendedRisk = Math.max(1.0, currentRisk - 0.5);
      reasoning = 'High drawdown levels suggest reducing risk per trade to preserve capital';
    } else if (avgDrawdown < 150 && marketRegime === 'BULL') {
      recommendedRisk = Math.min(2.5, currentRisk + 0.3);
      reasoning = 'Low drawdown and bull market conditions allow for slightly increased risk';
    } else if (marketRegime === 'VOLATILE') {
      recommendedRisk = Math.max(1.0, currentRisk - 0.3);
      reasoning = 'High volatility environment requires reduced position sizes';
    } else {
      reasoning = 'Current risk level is appropriate for market conditions';
    }

    return {
      currentRisk,
      recommendedRisk: Number(recommendedRisk.toFixed(1)),
      reasoning
    };
  }

  private async saveRecommendation(recommendation: StrategyRecommendation): Promise<void> {
    const filename = `strategy-optimization-${recommendation.date}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(recommendation, null, 2));
    
    // Save as latest
    const latestPath = path.join(this.outputDir, 'latest-strategy-recommendation.json');
    fs.writeFileSync(latestPath, JSON.stringify(recommendation, null, 2));
    
    console.log(`📄 Strategy recommendation saved: ${filepath}`);
  }

  private displayRecommendation(recommendation: StrategyRecommendation): void {
    console.log('\n🎯 STRATEGY OPTIMIZATION COMPLETE');
    console.log('═'.repeat(60));
    console.log(`📊 Market Regime: ${recommendation.currentMarketRegime}`);
    console.log(`🎭 Recommended Primary Strategy: ${recommendation.recommendedStrategy.primary}`);
    console.log(`🎭 Recommended Secondary Strategy: ${recommendation.recommendedStrategy.secondary || 'None'}`);
    console.log(`🎯 Confidence: ${recommendation.recommendedStrategy.confidence}`);
    console.log(`📝 Reasoning: ${recommendation.recommendedStrategy.reasoning}`);
    
    console.log('\n📈 STRATEGY PERFORMANCE SUMMARY:');
    recommendation.strategyPerformance.forEach(perf => {
      console.log(`\n${perf.strategyClass}:`);
      console.log(`  Win Rate: ${perf.winRate.toFixed(1)}%`);
      console.log(`  Profit Factor: ${perf.profitFactor.toFixed(2)}`);
      console.log(`  Total P&L: $${perf.totalPnL}`);
      console.log(`  Max Drawdown: $${perf.maxDrawdown}`);
    });
    
    console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
    recommendation.optimizationSuggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.category}:`);
      console.log(`   ${suggestion.suggestion}`);
      console.log(`   Expected: ${suggestion.expectedImprovement}`);
    });
    
    console.log('\n⚠️ RISK ADJUSTMENT:');
    console.log(`Current Risk: ${recommendation.riskAdjustment.currentRisk}%`);
    console.log(`Recommended Risk: ${recommendation.riskAdjustment.recommendedRisk}%`);
    console.log(`Reasoning: ${recommendation.riskAdjustment.reasoning}`);
    
    console.log('\n🚀 Strategy optimization complete!');
  }
}

// CLI execution
async function main() {
  try {
    const optimizer = new StrategyOptimizer();
    await optimizer.optimizeStrategy();
    
    console.log('\n🎮 Strategy Optimization Complete!');
    console.log('📊 Recommendation available at: public/data/strategy-optimization/latest-strategy-recommendation.json');
    console.log('🎭 Ready for optimal strategy class selection in RPG challenge!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to optimize strategy:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { StrategyOptimizer, type StrategyRecommendation };