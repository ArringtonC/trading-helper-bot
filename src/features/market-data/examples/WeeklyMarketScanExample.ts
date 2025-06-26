/**
 * Weekly Market Scan Service Usage Examples
 * 
 * Demonstrates how to integrate and use the WeeklyMarketScanService
 * for the $10K→$20K trading challenge platform.
 */

import { WeeklyMarketScanService, StrategyClass } from '../services/WeeklyMarketScanService';
import { MonitoringService } from '../../../shared/services/MonitoringService';

/**
 * Example 1: Basic Service Setup and Initialization
 */
export async function basicServiceSetup() {
  console.log('=== Example 1: Basic Service Setup ===');
  
  // Initialize monitoring service (use your existing one)
  const monitoring = new MonitoringService({
    serviceName: 'weekly-market-scan-demo',
    environment: 'development'
  });

  // Create the weekly scan service
  const scanService = new WeeklyMarketScanService(monitoring, {
    // Custom configuration
    maxResultsPerStrategy: 8,
    minConfidenceScore: 65,
    sundayScheduleEnabled: true,
    
    // Customize Buffett Guardian criteria
    buffettGuardian: {
      maxPE: 12,        // More strict P/E requirement
      minROE: 18,       // Higher ROE requirement
      maxDebtEquity: 0.4, // Lower debt tolerance
      minMarketCap: 2000000000, // $2B minimum
      sectors: ['Utilities', 'Consumer Staples', 'Healthcare']
    }
  });

  // Initialize the service
  await scanService.initialize();
  
  console.log('Service initialized successfully!');
  console.log('Configuration:', scanService.getConfiguration());
  console.log('Statistics:', scanService.getStatistics());
  
  return scanService;
}

/**
 * Example 2: Running Scans for All Strategy Classes
 */
export async function runAllStrategyScans(userId: string = 'demo-user') {
  console.log('=== Example 2: Running All Strategy Scans ===');
  
  const scanService = await basicServiceSetup();
  const strategies: StrategyClass[] = ['BUFFETT_GUARDIAN', 'DALIO_WARRIOR', 'SOROS_ASSASSIN', 'LYNCH_SCOUT'];
  const results = new Map<StrategyClass, any>();

  for (const strategy of strategies) {
    console.log(`\n🔍 Scanning for ${strategy}...`);
    
    try {
      const scanResults = await scanService.runWeeklyScan(strategy, userId);
      results.set(strategy, scanResults);
      
      console.log(`✅ ${strategy}: Found ${scanResults.length} opportunities`);
      
      // Show top 3 results
      const top3 = scanResults.slice(0, 3);
      top3.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.symbol} - Confidence: ${result.confidenceScore}% - XP: ${result.xpReward}`);
        console.log(`     Setup Quality: ${result.setupQuality} | Alert: ${result.alertLevel}`);
        console.log(`     Reasoning: ${result.reasoning[0]}`);
      });
      
    } catch (error) {
      console.error(`❌ Error scanning ${strategy}:`, error);
    }
  }

  return results;
}

/**
 * Example 3: Getting Comprehensive Weekly Data
 */
export async function getWeeklyAnalysis(userId: string = 'demo-user') {
  console.log('=== Example 3: Weekly Analysis ===');
  
  const scanService = await basicServiceSetup();
  
  // Get comprehensive weekly data for Buffett Guardian strategy
  const weeklyData = await scanService.getScanResults(userId, 'BUFFETT_GUARDIAN');
  
  console.log('\n📊 Weekly Market Analysis:');
  console.log(`Strategy Class: ${weeklyData.strategyClass}`);
  console.log(`Scan Date: ${weeklyData.scanDate.toLocaleDateString()}`);
  console.log(`Total Stocks Scanned: ${weeklyData.totalStocksScanned.toLocaleString()}`);
  console.log(`Qualifying Stocks: ${weeklyData.qualifyingStocks}`);
  console.log(`Market Sentiment: ${weeklyData.overallMarketSentiment}`);
  console.log(`Weekly Theme: ${weeklyData.weeklyTheme}`);
  
  console.log('\n💰 XP Rewards:');
  console.log(`Total XP Available: ${weeklyData.totalXPReward}`);
  console.log(`Weekly Bonus: ${weeklyData.weeklyBonus}`);
  console.log(`Streak Multiplier: ${weeklyData.streakMultiplier}x`);
  
  console.log('\n🎯 Top Opportunities:');
  weeklyData.topOpportunities.forEach((opp, index) => {
    console.log(`  ${index + 1}. ${opp.symbol} (${opp.setupQuality}) - ${opp.confidenceScore}% confidence`);
  });
  
  console.log('\n📈 Economic Factors:');
  weeklyData.economicFactors.forEach((factor, index) => {
    console.log(`  ${index + 1}. ${factor}`);
  });
  
  console.log('\n✅ Recommended Actions:');
  weeklyData.recommendedActions.forEach((action, index) => {
    console.log(`  ${index + 1}. ${action}`);
  });
  
  return weeklyData;
}

/**
 * Example 4: Sunday Challenge Quest Integration
 */
export async function sundayQuestExample(userId: string = 'demo-user') {
  console.log('=== Example 4: Sunday Challenge Quest ===');
  
  const scanService = await basicServiceSetup();
  
  // Setup event listeners for Sunday quest tracking
  scanService.on('sunday:scan:scheduled', (event) => {
    console.log(`🗓️ Sunday scan scheduled for ${event.scheduledFor.toLocaleString()}`);
    console.log(`   Time until scan: ${Math.round(event.timeUntilScan / (1000 * 60 * 60))} hours`);
  });
  
  scanService.on('sunday:scan:completed', (event) => {
    console.log(`🎉 Sunday scan completed for ${event.userId}!`);
    console.log(`   Total opportunities found: ${event.totalOpportunities}`);
    console.log(`   Strategies scanned: ${Object.keys(event.results).join(', ')}`);
    
    // Calculate quest rewards
    const questXP = event.totalOpportunities * 10; // 10 XP per opportunity
    const completionBonus = 100; // Bonus for completing all strategy scans
    const totalXP = questXP + completionBonus;
    
    console.log(`   Quest XP Earned: ${totalXP} (${questXP} + ${completionBonus} bonus)`);
  });
  
  // Schedule the Sunday quest
  await scanService.scheduleSundayScan(userId);
  
  console.log('Sunday quest scheduled! Check logs for completion.');
}

/**
 * Example 5: Real-time Progress Tracking
 */
export async function progressTrackingExample(userId: string = 'demo-user') {
  console.log('=== Example 5: Progress Tracking ===');
  
  const scanService = await basicServiceSetup();
  
  // Setup progress tracking
  scanService.on('scan:progress', (event) => {
    const progress = Math.round(event.progress);
    const bar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
    console.log(`[${bar}] ${progress}% - Operation: ${event.operationId}`);
  });
  
  scanService.on('scan:completed', (event) => {
    console.log(`✅ Scan completed: ${event.strategyClass} found ${event.resultsCount} results`);
  });
  
  scanService.on('scan:failed', (event) => {
    console.log(`❌ Scan failed: ${event.strategyClass} - ${event.error}`);
  });
  
  // Run a scan with progress tracking
  console.log('Starting Dalio Warrior scan with progress tracking...');
  const results = await scanService.runWeeklyScan('DALIO_WARRIOR', userId);
  
  return results;
}

/**
 * Example 6: Custom Strategy Configuration
 */
export async function customStrategyConfiguration() {
  console.log('=== Example 6: Custom Strategy Configuration ===');
  
  const monitoring = new MonitoringService({
    serviceName: 'custom-scan-demo',
    environment: 'development'
  });

  // Create service with highly customized strategy criteria
  const scanService = new WeeklyMarketScanService(monitoring, {
    // Aggressive Buffett Guardian settings
    buffettGuardian: {
      maxPE: 10,          // Very low P/E
      minROE: 25,         // Very high ROE
      maxDebtEquity: 0.2, // Very low debt
      minMarketCap: 5000000000, // Large caps only ($5B+)
      sectors: ['Utilities', 'Consumer Staples'] // Only defensive sectors
    },
    
    // Momentum-focused Dalio Warrior
    dalioWarrior: {
      rsiMin: 50,         // Stronger momentum
      rsiMax: 70,         // Allow more momentum
      minMomentum: 10,    // 10% minimum momentum
      minVolumeSurge: 2.0, // 200% volume surge required
      trendStrength: 0.8   // Very strong trend required
    },
    
    // Contrarian Soros Assassin
    sorosAssassin: {
      maxRSI: 25,         // Very oversold
      minVIXLevel: 25,    // Higher volatility required
      volatilityThreshold: 30, // Higher volatility threshold
      contrarian: true
    },
    
    // Growth-focused Lynch Scout
    lynchScout: {
      maxPEG: 0.8,        // More strict PEG requirement
      minEarningsGrowth: 30, // Higher growth requirement
      maxMarketCap: 5000000000, // Smaller caps for growth
      growthSectors: ['Technology', 'Healthcare', 'Consumer Discretionary']
    },
    
    maxResultsPerStrategy: 5,  // Fewer, higher-quality results
    minConfidenceScore: 80     // Higher confidence threshold
  });

  await scanService.initialize();
  
  console.log('Custom configuration applied:');
  console.log(JSON.stringify(scanService.getConfiguration(), null, 2));
  
  // Test the custom configuration
  const results = await scanService.runWeeklyScan('BUFFETT_GUARDIAN', 'custom-user');
  console.log(`\nCustom Buffett Guardian scan found ${results.length} ultra-high-quality opportunities`);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.symbol} - ${result.confidenceScore}% confidence`);
    console.log(`   PE: ${result.pe?.toFixed(1)}, ROE: ${result.roe?.toFixed(1)}%, Debt/Equity: ${result.debtToEquity?.toFixed(2)}`);
  });
  
  return scanService;
}

/**
 * Example 7: Integration with Challenge System
 */
export async function challengeIntegrationExample(userId: string = 'challenge-user') {
  console.log('=== Example 7: Challenge Integration ===');
  
  const scanService = await basicServiceSetup();
  
  // Simulate a challenge participant's weekly scan routine
  console.log(`Starting weekly scan routine for challenge participant: ${userId}`);
  
  // Day 1 (Sunday): Market preparation scan
  console.log('\n📅 Sunday: Weekly Market Preparation');
  const sundayData = await scanService.getScanResults(userId, 'BUFFETT_GUARDIAN');
  console.log(`Sunday prep complete - ${sundayData.qualifyingStocks} opportunities identified`);
  console.log(`Weekly theme: ${sundayData.weeklyTheme}`);
  
  // Calculate challenge scoring
  const challengeScore = {
    scanCompleted: true,
    opportunitiesFound: sundayData.qualifyingStocks,
    xpEarned: sundayData.totalXPReward + sundayData.weeklyBonus,
    setupQualityPoints: sundayData.scanResults.reduce((total, result) => {
      const qualityPoints = {
        'A+': 4,
        'A': 3,
        'B': 2,
        'C': 1
      };
      return total + (qualityPoints[result.setupQuality] || 0);
    }, 0),
    streakBonus: sundayData.streakMultiplier > 1 ? Math.floor((sundayData.streakMultiplier - 1) * 100) : 0
  };
  
  console.log('\n🏆 Challenge Scoring:');
  console.log(`XP Earned: ${challengeScore.xpEarned}`);
  console.log(`Setup Quality Points: ${challengeScore.setupQualityPoints}`);
  console.log(`Streak Bonus: ${challengeScore.streakBonus}`);
  
  // Wednesday: Mid-week momentum check
  console.log('\n📅 Wednesday: Mid-week Momentum Check');
  const momentumResults = await scanService.runWeeklyScan('DALIO_WARRIOR', userId);
  console.log(`Momentum scan complete - ${momentumResults.length} momentum plays identified`);
  
  // Friday: Contrarian opportunity scan
  console.log('\n📅 Friday: Contrarian Opportunity Scan');
  const contrarianResults = await scanService.runWeeklyScan('SOROS_ASSASSIN', userId);
  console.log(`Contrarian scan complete - ${contrarianResults.length} contrarian setups found`);
  
  // Calculate weekly challenge performance
  const weeklyPerformance = {
    totalScansCompleted: 3,
    totalOpportunities: sundayData.qualifyingStocks + momentumResults.length + contrarianResults.length,
    totalXP: sundayData.totalXPReward + 
             momentumResults.reduce((sum, r) => sum + r.xpReward, 0) +
             contrarianResults.reduce((sum, r) => sum + r.xpReward, 0),
    strategiesMastered: 3,
    weeklyGoalProgress: 75 // Simulated progress toward weekly goal
  };
  
  console.log('\n📊 Weekly Challenge Performance:');
  console.log(`Scans Completed: ${weeklyPerformance.totalScansCompleted}/3`);
  console.log(`Total Opportunities: ${weeklyPerformance.totalOpportunities}`);
  console.log(`Total XP Earned: ${weeklyPerformance.totalXP}`);
  console.log(`Weekly Goal Progress: ${weeklyPerformance.weeklyGoalProgress}%`);
  
  return weeklyPerformance;
}

/**
 * Example 8: Service Monitoring and Health Checks
 */
export async function monitoringExample() {
  console.log('=== Example 8: Service Monitoring ===');
  
  const scanService = await basicServiceSetup();
  
  // Get service statistics
  const stats = scanService.getStatistics();
  console.log('Service Statistics:', stats);
  
  // Check service health
  const monitoring = new MonitoringService({
    serviceName: 'weekly-scan-monitoring',
    environment: 'development'
  });
  
  // Register the health check that was created during initialization
  await scanService.initialize();
  
  console.log('Service is healthy and monitoring is active');
  
  // Show active operations
  const activeOps = scanService.getActiveOperations();
  console.log(`Active operations: ${activeOps.length}`);
  
  return { stats, activeOps };
}

/**
 * Main demo function that runs all examples
 */
export async function runAllExamples() {
  console.log('🚀 Starting Weekly Market Scan Service Examples...\n');
  
  try {
    // Run all examples
    await basicServiceSetup();
    await runAllStrategyScans();
    await getWeeklyAnalysis();
    await sundayQuestExample();
    await progressTrackingExample();
    await customStrategyConfiguration();
    await challengeIntegrationExample();
    await monitoringExample();
    
    console.log('\n✅ All examples completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('1. Integrate with your existing challenge framework');
    console.log('2. Connect to real market data APIs');
    console.log('3. Setup database persistence for scan results');
    console.log('4. Add push notifications for critical alerts');
    console.log('5. Create dashboard UI components for scan results');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export individual examples for testing
export {
  basicServiceSetup,
  runAllStrategyScans,
  getWeeklyAnalysis,
  sundayQuestExample,
  progressTrackingExample,
  customStrategyConfiguration,
  challengeIntegrationExample,
  monitoringExample
};