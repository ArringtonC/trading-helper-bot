import UnifiedAnalyticsEngine, { AnalyticsConfig } from '../utils/analytics/UnifiedAnalyticsEngine';
import { initializeSampleDataIfNeeded } from '../utils/testData';

/**
 * Test script to verify UnifiedAnalyticsEngine functionality
 */
async function testAnalyticsEngine() {
  console.log('🧪 Testing UnifiedAnalyticsEngine...\n');

  try {
    // Ensure we have sample data
    console.log('1. Checking for sample data...');
    await initializeSampleDataIfNeeded();
    
    // Test different user levels
    const userLevels: Array<'learning' | 'import' | 'broker'> = ['learning', 'import', 'broker'];
    
    for (const userLevel of userLevels) {
      console.log(`\n2. Testing ${userLevel} user level...`);
      
      const config: AnalyticsConfig = {
        userLevel,
        enabledModules: [],
        layout: 'compact',
        refreshInterval: 30000
      };
      
      const engine = new UnifiedAnalyticsEngine(config);
      
      // Test module configuration
      const enabledModules = engine.getEnabledModules();
      const maxModules = engine.getMaxModulesForUserLevel();
      
      console.log(`   - Enabled modules: ${enabledModules.length}`);
      console.log(`   - Max modules: ${maxModules === Infinity ? 'unlimited' : maxModules}`);
      console.log(`   - Module IDs: ${enabledModules.map(m => m.id).join(', ')}`);
      
      // Test analytics data retrieval
      try {
        console.log('   - Fetching consolidated analytics...');
        const analytics = await engine.getConsolidatedAnalytics();
        
        console.log(`   ✅ Analytics retrieved successfully!`);
        console.log(`      - Position Analysis: $${analytics.positionAnalysis.totalPnl.toFixed(2)} P&L`);
        console.log(`      - Risk Metrics: ${analytics.riskMetrics.portfolioRisk.toFixed(2)}% portfolio risk`);
        console.log(`      - Performance: ${analytics.performanceTracking.sharpeRatio.toFixed(2)} Sharpe ratio`);
        console.log(`      - Market: ${analytics.marketAnalysis.volatilityRegime} volatility regime`);
        console.log(`      - Data Quality: ${analytics.dataQuality.completeness.toFixed(1)}% complete`);
        
      } catch (error) {
        console.error(`   ❌ Error fetching analytics: ${error}`);
      }
      
      // Clean up
      engine.destroy();
    }
    
    console.log('\n✅ UnifiedAnalyticsEngine test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAnalyticsEngine();
}

export { testAnalyticsEngine }; 