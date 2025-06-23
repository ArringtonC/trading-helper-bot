/**
 * Volatility Analysis Service - Usage Examples
 * 
 * This file demonstrates how to use the VolatilityAnalysisService
 * to get real market data and perform volatility analysis.
 * 
 * Examples include:
 * - Single symbol analysis
 * - Portfolio analysis
 * - Real-time updates
 * - Error handling
 */

import VolatilityAnalysisService from '../../shared/services/VolatilityAnalysisService';

// Initialize the service
const volatilityService = new VolatilityAnalysisService({
  dataSource: {
    enableYahooFinance: true,
    enableCSVFallback: true,
    cacheTimeoutMs: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    rateLimitMs: 1000 // 1 second between API calls
  },
  defaultLookbackDays: 252, // 1 year of trading days
  enableRealTimeUpdates: true,
  updateIntervalMs: 30000, // 30 seconds
  maxConcurrentRequests: 5
});

/**
 * Example 1: Single Symbol Analysis
 * Get comprehensive volatility analysis for a single stock
 */
export async function exampleSingleSymbolAnalysis() {
  console.log('🔍 Example 1: Single Symbol Analysis');
  
  try {
    const analysis = await volatilityService.getSymbolAnalysis({
      symbol: 'AAPL',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      includeVIXCorrelation: true
    });

    console.log('✅ AAPL Analysis Results:');
    console.log(`📊 Current Price: $${analysis.currentPrice.toFixed(2)}`);
    console.log(`📈 IV Percentile: ${analysis.analysis.ivPercentile.percentile.toFixed(1)}% (${analysis.analysis.ivPercentile.zone})`);
    console.log(`📉 ATR: ${analysis.analysis.atr.value.toFixed(2)} (${analysis.analysis.atr.trend})`);
    console.log(`🎯 Bollinger Position: ${(analysis.analysis.bollingerBands.position * 100).toFixed(1)}%`);
    console.log(`🌊 Market Regime: ${analysis.analysis.marketRegime}`);
    console.log(`📊 Data Quality: ${analysis.dataQuality.priceDataPoints} price points from ${analysis.dataQuality.dataSource}`);
    
    return analysis;
  } catch (error) {
    console.error('❌ Failed to analyze AAPL:', error);
    throw error;
  }
}

/**
 * Example 2: Portfolio Analysis
 * Analyze multiple symbols and get portfolio-level metrics
 */
export async function examplePortfolioAnalysis() {
  console.log('🔍 Example 2: Portfolio Analysis');
  
  const portfolioSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'SPY'];
  
  try {
    const portfolioAnalysis = await volatilityService.getPortfolioAnalysis({
      symbols: portfolioSymbols,
      startDate: '2023-06-01',
      endDate: '2024-01-01',
      includeCorrelationMatrix: true
    });

    console.log('✅ Portfolio Analysis Results:');
    console.log(`📊 Symbols Analyzed: ${portfolioAnalysis.snapshots.length}/${portfolioSymbols.length}`);
    console.log(`📈 Average IV Percentile: ${portfolioAnalysis.portfolioMetrics.averageIVPercentile.toFixed(1)}%`);
    console.log(`📉 Portfolio Volatility: ${portfolioAnalysis.portfolioMetrics.portfolioVolatility.toFixed(3)}`);
    console.log(`🎯 Diversification Ratio: ${portfolioAnalysis.portfolioMetrics.diversificationRatio.toFixed(2)}`);
    
    console.log('🌊 Risk Regime Distribution:');
    Object.entries(portfolioAnalysis.portfolioMetrics.riskRegimeDistribution).forEach(([regime, percentage]) => {
      console.log(`  ${regime}: ${percentage.toFixed(1)}%`);
    });

    if (portfolioAnalysis.correlationMatrix) {
      console.log('🔗 Sample Correlations:');
      console.log(`  AAPL-MSFT: ${portfolioAnalysis.correlationMatrix['AAPL']['MSFT'].toFixed(3)}`);
      console.log(`  TSLA-SPY: ${portfolioAnalysis.correlationMatrix['TSLA']['SPY'].toFixed(3)}`);
    }
    
    return portfolioAnalysis;
  } catch (error) {
    console.error('❌ Failed to analyze portfolio:', error);
    throw error;
  }
}

/**
 * Example 3: Real-Time Updates
 * Get real-time volatility updates for active monitoring
 */
export async function exampleRealTimeUpdates() {
  console.log('🔍 Example 3: Real-Time Updates');
  
  const symbol = 'SPY';
  
  try {
    const realtimeUpdate = await volatilityService.getRealTimeUpdate(symbol);

    console.log('✅ Real-Time Update Results:');
    console.log(`📊 Symbol: ${realtimeUpdate.symbol}`);
    console.log(`💰 Current Price: $${realtimeUpdate.currentPrice?.toFixed(2)}`);
    console.log(`📈 IV Percentile: ${realtimeUpdate.analysis?.ivPercentile.percentile.toFixed(1)}%`);
    console.log(`📉 ATR: ${realtimeUpdate.analysis?.atr.value.toFixed(2)}`);
    console.log(`🎯 BB Position: ${((realtimeUpdate.analysis?.bollingerBands.position || 0) * 100).toFixed(1)}%`);
    console.log(`⏰ Timestamp: ${realtimeUpdate.timestamp}`);
    
    return realtimeUpdate;
  } catch (error) {
    console.error('❌ Failed to get real-time update:', error);
    throw error;
  }
}

/**
 * Example 4: Available Symbols
 * Get list of supported symbols for analysis
 */
export function exampleAvailableSymbols() {
  console.log('🔍 Example 4: Available Symbols');
  
  const symbols = volatilityService.getAvailableSymbols();
  
  console.log('✅ Available Symbols for Analysis:');
  console.log(`📊 Total: ${symbols.length} symbols`);
  console.log('🏢 ETFs:', symbols.filter(s => ['SPY', 'QQQ', 'IWM', 'DIA'].includes(s)));
  console.log('💻 Tech:', symbols.filter(s => ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'].includes(s)));
  console.log('🏦 Finance:', symbols.filter(s => ['JPM', 'BAC', 'WFC', 'GS'].includes(s)));
  console.log('📈 Volatility:', symbols.filter(s => s.startsWith('^')));
  
  return symbols;
}

/**
 * Example 5: Service Statistics
 * Monitor service performance and cache usage
 */
export function exampleServiceStatistics() {
  console.log('🔍 Example 5: Service Statistics');
  
  const stats = volatilityService.getServiceStats();
  
  console.log('✅ Service Statistics:');
  console.log(`🗄️ Calculation Engine Cache: ${stats.calculationEngine.cacheSize} items`);
  console.log(`📡 Data Service Cache: ${stats.dataService.cacheSize} items`);
  console.log(`⚡ Active Requests: ${stats.activeRequests}`);
  console.log(`⚙️ Config - Lookback Days: ${stats.config.defaultLookbackDays}`);
  console.log(`⚙️ Config - Max Concurrent: ${stats.config.maxConcurrentRequests}`);
  console.log(`📡 Last API Call: ${stats.dataService.lastApiCall || 'Never'}`);
  
  return stats;
}

/**
 * Example 6: Error Handling and Fallbacks
 * Demonstrate graceful error handling
 */
export async function exampleErrorHandling() {
  console.log('🔍 Example 6: Error Handling');
  
  try {
    // Try to analyze an invalid symbol
    const analysis = await volatilityService.getSymbolAnalysis({
      symbol: 'INVALID_SYMBOL_12345',
      includeVIXCorrelation: false
    });
    
    console.log('✅ Analysis succeeded (likely using fallback data):', analysis.dataQuality.dataSource);
    return analysis;
  } catch (error) {
    console.log('⚠️ Expected error for invalid symbol:', error);
    
    // Try with a valid symbol to show recovery
    try {
      const validAnalysis = await volatilityService.getSymbolAnalysis({
        symbol: 'SPY',
        includeVIXCorrelation: false
      });
      
      console.log('✅ Recovery successful with valid symbol');
      return validAnalysis;
    } catch (recoveryError) {
      console.error('❌ Recovery also failed:', recoveryError);
      throw recoveryError;
    }
  }
}

/**
 * Example 7: Cache Management
 * Demonstrate cache clearing and performance
 */
export async function exampleCacheManagement() {
  console.log('🔍 Example 7: Cache Management');
  
  // Get initial stats
  const initialStats = volatilityService.getServiceStats();
  console.log(`📊 Initial cache sizes: Engine=${initialStats.calculationEngine.cacheSize}, Data=${initialStats.dataService.cacheSize}`);
  
  // Perform some analysis to populate cache
  await volatilityService.getSymbolAnalysis({ symbol: 'AAPL' });
  await volatilityService.getSymbolAnalysis({ symbol: 'MSFT' });
  
  const populatedStats = volatilityService.getServiceStats();
  console.log(`📊 After analysis cache sizes: Engine=${populatedStats.calculationEngine.cacheSize}, Data=${populatedStats.dataService.cacheSize}`);
  
  // Clear caches
  volatilityService.clearCaches();
  
  const clearedStats = volatilityService.getServiceStats();
  console.log(`📊 After clearing cache sizes: Engine=${clearedStats.calculationEngine.cacheSize}, Data=${clearedStats.dataService.cacheSize}`);
  
  return { initialStats, populatedStats, clearedStats };
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running All Volatility Analysis Examples\n');
  
  try {
    // Example 4 (no async)
    exampleAvailableSymbols();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 5 (no async)
    exampleServiceStatistics();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 1
    await exampleSingleSymbolAnalysis();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 3
    await exampleRealTimeUpdates();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 6
    await exampleErrorHandling();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 7
    await exampleCacheManagement();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Example 2 (most intensive, run last)
    await examplePortfolioAnalysis();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export the service instance for direct use
export { volatilityService };

/**
 * Usage Instructions:
 * 
 * 1. Import this file in your component or service:
 *    import { volatilityService, exampleSingleSymbolAnalysis } from './services/examples/VolatilityAnalysisExample';
 * 
 * 2. Use the service directly:
 *    const analysis = await volatilityService.getSymbolAnalysis({ symbol: 'AAPL' });
 * 
 * 3. Run examples to see how it works:
 *    await exampleSingleSymbolAnalysis();
 * 
 * 4. For dashboard integration:
 *    - Use getSymbolAnalysis() for individual symbol widgets
 *    - Use getPortfolioAnalysis() for portfolio overview
 *    - Use getRealTimeUpdate() for live data updates
 * 
 * 5. Error handling:
 *    - Service automatically falls back to mock data if APIs fail
 *    - Check dataQuality.dataSource to see what data was used
 *    - Use try/catch blocks for proper error handling
 */ 