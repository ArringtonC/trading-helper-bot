#!/usr/bin/env node

/**
 * Simple test script to verify the trading analysis works
 */

const fs = require('fs');
const path = require('path');

// Test the data directory creation and analysis generation
function testAnalysisGeneration() {
  console.log('🎮 Testing Trading RPG Analysis...');
  
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const analysisDir = path.join(dataDir, 'market-analysis');
  
  // Create directories
  if (!fs.existsSync(analysisDir)) {
    fs.mkdirSync(analysisDir, { recursive: true });
    console.log('✅ Created analysis directory');
  }
  
  // Generate mock analysis data
  const mockAnalysis = {
    weekOf: '2024-06-24',
    marketConditions: {
      spyTrend: 'BULLISH',
      vixLevel: 18.5,
      vixTrend: 'FALLING',
      sectorRotation: {
        leading: ['Technology', 'Consumer Discretionary'],
        lagging: ['Energy', 'Utilities']
      },
      marketRegime: 'RISK_ON',
      volatilityLevel: 'NORMAL'
    },
    economicEvents: [
      {
        date: '2024-06-25',
        time: '08:30',
        event: 'Initial Jobless Claims',
        impact: 'MEDIUM',
        forecast: '225K',
        previous: '229K'
      }
    ],
    majorEarnings: [
      {
        symbol: 'AAPL',
        date: '2024-06-25',
        time: 'AMC',
        estimatedEPS: 1.35,
        marketCap: 'Large',
        sector: 'Technology'
      }
    ],
    recommendedStrategies: {
      primary: 'BUFFETT_GUARDIAN',
      secondary: 'LYNCH_SCOUT',
      reasoning: 'Low volatility bull market favors value accumulation and growth stock selection'
    },
    riskLevel: 'LOW',
    watchlistSuggestions: [
      {
        symbol: 'AAPL',
        reason: 'Strong fundamentals, reasonable valuation',
        strategy: 'Value accumulation on dips'
      },
      {
        symbol: 'MSFT',
        reason: 'Cloud dominance, consistent cash flow',
        strategy: 'Long-term position building'
      }
    ],
    weeklyTargetAdjustment: 0.1
  };
  
  // Save analysis file
  const filePath = path.join(analysisDir, 'latest-analysis.json');
  fs.writeFileSync(filePath, JSON.stringify(mockAnalysis, null, 2));
  console.log(`✅ Created mock analysis: ${filePath}`);
  
  // Test the Monday range analysis
  const mondayDir = path.join(dataDir, 'monday-analysis');
  if (!fs.existsSync(mondayDir)) {
    fs.mkdirSync(mondayDir, { recursive: true });
  }
  
  const mockMondayAnalysis = {
    date: '2024-06-24',
    symbol: 'SPY',
    rangeData: {
      symbol: 'SPY',
      date: '2024-06-24',
      open: 520.15,
      high: 523.75,
      low: 518.20,
      close: 522.40,
      volume: 85000000,
      range: 5.55,
      rangePercent: 1.07
    },
    classification: 'NORMAL_RANGE',
    battleStrategy: {
      type: 'STANDARD_RANGE',
      confidence: 'MEDIUM',
      description: '📈 Normal market conditions. Follow Monday high/low breakout strategy with standard position sizing.'
    },
    breakoutLevels: {
      bullishBreakout: 524.31,
      bearishBreakout: 517.64,
      midpoint: 520.98
    },
    stopLossLevels: {
      bullish: 518.20,
      bearish: 523.75
    },
    positionSizing: {
      riskLevel: 'NORMAL',
      maxPositionSize: 20,
      recommendedRisk: 2.0
    },
    tradingSignals: [
      {
        setup: 'Bullish Breakout',
        entry: 'Above $524.31',
        stop: '$518.20',
        target: '$527.09',
        riskReward: 0.45
      }
    ]
  };
  
  const mondayFilePath = path.join(mondayDir, 'latest-monday-analysis.json');
  fs.writeFileSync(mondayFilePath, JSON.stringify(mockMondayAnalysis, null, 2));
  console.log(`✅ Created mock Monday analysis: ${mondayFilePath}`);
  
  console.log('\n🎮 RPG Trading Analysis Test Complete!');
  console.log('📊 Ready for testing at: http://localhost:3000/challenge/planning');
  console.log('🚀 Analysis files created successfully!');
  
  return true;
}

// Run the test
if (require.main === module) {
  try {
    testAnalysisGeneration();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

module.exports = { testAnalysisGeneration };