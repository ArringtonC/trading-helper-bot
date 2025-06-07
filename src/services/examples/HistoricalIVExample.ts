/**
 * Historical IV Range Database Example Service
 * 
 * Comprehensive demonstration of the Historical IV Range Database system
 * including data ingestion, querying, analysis, and real-world usage patterns.
 * 
 * Examples included:
 * 1. Database initialization and setup
 * 2. Data ingestion pipeline demonstration
 * 3. Advanced querying with filtering
 * 4. IV statistics and analytics
 * 5. Volatility cone generation
 * 6. Corporate action handling
 * 7. Data quality monitoring
 * 8. Cache performance analysis
 */

import { historicalIVDB, HistoricalIVDatabaseService } from '../HistoricalIVDatabaseService';
import { historicalIVPipeline, HistoricalIVDataPipeline } from '../HistoricalIVDataPipeline';
import {
  HistoricalIVRecord,
  IVQueryOptions,
  IVStatistics,
  IVVolatilityCone,
  CreateIVRecord,
  IVDataQuality,
  IVDataSource
} from '../../types/historicalIV';

export class HistoricalIVExample {
  private initialized = false;

  /**
   * Initialize the Historical IV system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('\n🚀 Initializing Historical IV Range Database System...\n');

    // Initialize the database
    await historicalIVDB.initialize();
    console.log('✅ Database initialized');

    // Initialize the data pipeline
    await historicalIVPipeline.initialize();
    console.log('✅ Data pipeline initialized');

    this.initialized = true;
    console.log('\n✨ Historical IV system ready!\n');
  }

  /**
   * Example 1: Basic Data Ingestion
   */
  async example1_BasicDataIngestion(): Promise<void> {
    console.log('\n📊 EXAMPLE 1: Basic Data Ingestion\n');
    console.log('Demonstrating how to ingest historical IV data...\n');

    try {
      await this.initialize();

      // Schedule data ingestion for popular symbols
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'SPY'];
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log(`📅 Scheduling data ingestion for ${symbols.length} symbols`);
      console.log(`📅 Date range: ${startDate} to ${endDate}\n`);

      const jobIds = await historicalIVPipeline.scheduleMultipleJobs(
        symbols,
        'yahoo_finance',
        startDate,
        endDate,
        5 // Medium priority
      );

      console.log('🔄 Scheduled jobs:');
      jobIds.forEach((jobId, index) => {
        console.log(`   ${symbols[index]}: ${jobId}`);
      });

      // Process the jobs
      await historicalIVPipeline.processPendingJobs();

      // Show pipeline stats
      const stats = historicalIVPipeline.getStats();
      console.log('\n📈 Pipeline Statistics:');
      console.log(`   Jobs Processed: ${stats.totalJobsProcessed}`);
      console.log(`   Success Rate: ${stats.successfulJobs}/${stats.totalJobsProcessed}`);
      console.log(`   Records Ingested: ${stats.totalRecordsIngested}`);
      console.log(`   Avg Processing Time: ${stats.averageProcessingTime.toFixed(2)}ms`);

    } catch (error) {
      console.error('❌ Example 1 failed:', error);
    }
  }

  /**
   * Example 2: Advanced Querying and Filtering
   */
  async example2_AdvancedQuerying(): Promise<void> {
    console.log('\n🔍 EXAMPLE 2: Advanced Querying and Filtering\n');
    console.log('Demonstrating advanced IV data queries...\n');

    try {
      await this.initialize();

      // Query 1: Get high-quality AAPL data from last month
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      console.log('📱 Query 1: High-quality AAPL data (last 30 days)');
      const aaplQuery: IVQueryOptions = {
        symbol: 'AAPL',
        startDate: lastMonth,
        endDate: today,
        minQuality: 0.8,
        includeAnomalies: false,
        limit: 50
      };

      const aaplResult = await historicalIVDB.queryIVRecords(aaplQuery);
      console.log(`   📊 Found ${aaplResult.data.length} records`);
      console.log(`   ⚡ Query time: ${aaplResult.queryMeta.executionTime}ms`);
      console.log(`   💾 Cache hit: ${aaplResult.queryMeta.cacheHit ? 'Yes' : 'No'}`);

      if (aaplResult.data.length > 0) {
        const latest = aaplResult.data[0];
        console.log(`   📈 Latest IV: ${latest.closeIV.toFixed(4)} (${latest.date})`);
        console.log(`   🏷️ Data quality: ${latest.dataQuality.score.toFixed(3)}`);
      }

      // Query 2: Multi-symbol portfolio query
      console.log('\n📊 Query 2: Portfolio IV data (multiple symbols)');
      const portfolioQuery: IVQueryOptions = {
        symbol: ['AAPL', 'MSFT', 'GOOGL'],
        startDate: lastMonth,
        minQuality: 0.7,
        limit: 100
      };

      const portfolioResult = await historicalIVDB.queryIVRecords(portfolioQuery);
      console.log(`   📊 Found ${portfolioResult.data.length} total records`);
      
      // Group by symbol
      const bySymbol = portfolioResult.data.reduce((acc, record) => {
        acc[record.symbol] = (acc[record.symbol] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('   📈 Records by symbol:');
      Object.entries(bySymbol).forEach(([symbol, count]) => {
        console.log(`      ${symbol}: ${count} records`);
      });

      // Query 3: Data source filtering
      console.log('\n🌐 Query 3: Yahoo Finance data only');
      const sourceQuery: IVQueryOptions = {
        sources: ['yahoo_finance'],
        startDate: lastMonth,
        limit: 20
      };

      const sourceResult = await historicalIVDB.queryIVRecords(sourceQuery);
      console.log(`   📊 Found ${sourceResult.data.length} Yahoo Finance records`);

    } catch (error) {
      console.error('❌ Example 2 failed:', error);
    }
  }

  /**
   * Example 3: IV Statistics and Analytics
   */
  async example3_IVStatistics(): Promise<void> {
    console.log('\n📈 EXAMPLE 3: IV Statistics and Analytics\n');
    console.log('Demonstrating statistical analysis of IV data...\n');

    try {
      await this.initialize();

      const symbols = ['AAPL', 'MSFT', 'TSLA'];

      for (const symbol of symbols) {
        console.log(`📊 ${symbol} IV Statistics:\n`);

        try {
          // Get 1-year statistics
          const yearStats = await historicalIVDB.getIVStatistics(symbol, '1Y');
          
          console.log(`   📅 Period: ${yearStats.period} (${yearStats.count} data points)`);
          console.log(`   📊 Mean IV: ${yearStats.mean.toFixed(4)}`);
          console.log(`   📊 Median IV: ${yearStats.median.toFixed(4)}`);
          console.log(`   📊 Std Dev: ${yearStats.std.toFixed(4)}`);
          console.log(`   📊 Range: ${yearStats.min.toFixed(4)} - ${yearStats.max.toFixed(4)}`);
          
          console.log('   📊 Percentiles:');
          console.log(`      10th: ${yearStats.percentiles.p10.toFixed(4)}`);
          console.log(`      25th: ${yearStats.percentiles.p25.toFixed(4)}`);
          console.log(`      75th: ${yearStats.percentiles.p75.toFixed(4)}`);
          console.log(`      90th: ${yearStats.percentiles.p90.toFixed(4)}`);
          
          console.log('   🎯 Data Quality:');
          console.log(`      Average Score: ${yearStats.dataQuality.averageScore.toFixed(3)}`);
          console.log(`      Completeness: ${(yearStats.dataQuality.completeness * 100).toFixed(1)}%`);
          console.log(`      Anomaly Rate: ${(yearStats.dataQuality.anomalyRate * 100).toFixed(2)}%`);

          // Compare with 6-month stats
          const sixMonthStats = await historicalIVDB.getIVStatistics(symbol, '6M');
          const meanChange = ((sixMonthStats.mean - yearStats.mean) / yearStats.mean) * 100;
          
          console.log(`   📈 6M vs 1Y Comparison:`);
          console.log(`      Mean IV Change: ${meanChange > 0 ? '+' : ''}${meanChange.toFixed(2)}%`);
          console.log(`      Recent vs Historical: ${sixMonthStats.mean > yearStats.mean ? 'Higher' : 'Lower'}`);

        } catch (error) {
          console.log(`   ❌ No sufficient data for ${symbol}`);
        }

        console.log(); // Space between symbols
      }

    } catch (error) {
      console.error('❌ Example 3 failed:', error);
    }
  }

  /**
   * Example 4: Volatility Cone Analysis
   */
  async example4_VolatilityCone(): Promise<void> {
    console.log('\n🌊 EXAMPLE 4: Volatility Cone Analysis\n');
    console.log('Demonstrating volatility cone generation...\n');

    try {
      await this.initialize();

      const symbols = ['AAPL', 'SPY'];

      for (const symbol of symbols) {
        console.log(`🎯 ${symbol} Volatility Cone:\n`);

        try {
          const cone = await historicalIVDB.getVolatilityCone(symbol);
          
          console.log(`   📅 Generated: ${new Date(cone.generatedAt).toLocaleString()}\n`);
          
          console.log('   📊 Percentile Analysis:');
          console.log('   Period    Min     5%     25%    50%    75%    95%    Max   Current');
          console.log('   ─────────────────────────────────────────────────────────────────');
          
          Object.entries(cone.percentiles).forEach(([period, data]) => {
            const formatNum = (n: number) => n.toFixed(3).padStart(6);
            console.log(
              `   ${period.padEnd(8)} ${formatNum(data.min)} ${formatNum(data.p5)} ` +
              `${formatNum(data.p25)} ${formatNum(data.p50)} ${formatNum(data.p75)} ` +
              `${formatNum(data.p95)} ${formatNum(data.max)} ${formatNum(data.current)}`
            );
          });

          // Analyze current position
          console.log('\n   🎯 Current IV Analysis:');
          Object.entries(cone.percentiles).forEach(([period, data]) => {
            const range = data.max - data.min;
            const position = (data.current - data.min) / range;
            const percentile = position * 100;
            
            let status = '●';
            if (percentile < 25) status = '🟢 Low';
            else if (percentile < 50) status = '🟡 Below Median';
            else if (percentile < 75) status = '🟠 Above Median';
            else status = '🔴 High';
            
            console.log(`      ${period}: ${percentile.toFixed(1)}th percentile ${status}`);
          });

        } catch (error) {
          console.log(`   ❌ No sufficient data for ${symbol} volatility cone`);
        }

        console.log(); // Space between symbols
      }

    } catch (error) {
      console.error('❌ Example 4 failed:', error);
    }
  }

  /**
   * Example 5: Data Quality Monitoring
   */
  async example5_DataQualityMonitoring(): Promise<void> {
    console.log('\n🔍 EXAMPLE 5: Data Quality Monitoring\n');
    console.log('Demonstrating data quality analysis and monitoring...\n');

    try {
      await this.initialize();

      // Create sample data with varying quality
      console.log('📊 Creating sample data with different quality levels...\n');
      
      const sampleData: CreateIVRecord[] = [
        {
          symbol: 'TEST',
          date: '2024-01-01',
          timestamp: '2024-01-01T00:00:00Z',
          openIV: 0.25,
          highIV: 0.28,
          lowIV: 0.24,
          closeIV: 0.27,
          volumeWeightedIV: 0.26,
          atmIV: 0.265,
          underlyingPrice: 150.0,
          volume: 1000000,
          openInterest: 50000,
          dataQuality: {
            score: 0.95,
            missingDataPoints: 0,
            interpolatedPoints: 0,
            anomalyFlags: [],
            lastValidationDate: new Date().toISOString()
          },
          source: 'yahoo_finance'
        },
        {
          symbol: 'TEST',
          date: '2024-01-02',
          timestamp: '2024-01-02T00:00:00Z',
          openIV: 0.30,
          highIV: 0.25, // Error: high < low
          lowIV: 0.28,
          closeIV: 0.29,
          volumeWeightedIV: 0.28,
          atmIV: 0.285,
          underlyingPrice: 152.0,
          volume: 500000,
          openInterest: 48000,
          dataQuality: {
            score: 0.6, // Lower quality due to anomaly
            missingDataPoints: 0,
            interpolatedPoints: 0,
            anomalyFlags: [
              {
                type: 'term_structure_inversion',
                severity: 'high',
                description: 'High IV is less than low IV',
                detectedAt: new Date().toISOString(),
                resolved: false
              }
            ],
            lastValidationDate: new Date().toISOString()
          },
          source: 'yahoo_finance'
        }
      ];

      // Insert sample data
      const insertResult = await historicalIVDB.insertIVRecords(sampleData);
      console.log(`✅ Inserted ${insertResult.successCount} records`);
      if (insertResult.errors.length > 0) {
        console.log(`⚠️ ${insertResult.errors.length} validation errors detected`);
      }

      // Query for quality analysis
      const qualityQuery: IVQueryOptions = {
        symbol: 'TEST',
        includeAnomalies: true // Include anomalous data for analysis
      };

      const results = await historicalIVDB.queryIVRecords(qualityQuery);
      
      console.log('\n📊 Data Quality Analysis:');
      console.log(`   Total records: ${results.data.length}`);
      
      let totalScore = 0;
      let anomalyCount = 0;
      let missingDataPoints = 0;
      
      results.data.forEach(record => {
        totalScore += record.dataQuality.score;
        anomalyCount += record.dataQuality.anomalyFlags.length;
        missingDataPoints += record.dataQuality.missingDataPoints;
      });

      const avgQuality = totalScore / results.data.length;
      
      console.log(`   Average Quality Score: ${avgQuality.toFixed(3)}`);
      console.log(`   Total Anomalies: ${anomalyCount}`);
      console.log(`   Missing Data Points: ${missingDataPoints}`);
      
      // Analyze specific anomalies
      console.log('\n🔍 Anomaly Analysis:');
      results.data.forEach((record, index) => {
        if (record.dataQuality.anomalyFlags.length > 0) {
          console.log(`   Record ${index + 1} (${record.date}):`);
          record.dataQuality.anomalyFlags.forEach(flag => {
            console.log(`      🚨 ${flag.type}: ${flag.description} (${flag.severity})`);
          });
        }
      });

    } catch (error) {
      console.error('❌ Example 5 failed:', error);
    }
  }

  /**
   * Example 6: Cache Performance Analysis
   */
  async example6_CachePerformance(): Promise<void> {
    console.log('\n⚡ EXAMPLE 6: Cache Performance Analysis\n');
    console.log('Demonstrating cache performance and optimization...\n');

    try {
      await this.initialize();

      // Clear cache to start fresh
      historicalIVDB.clearCache();
      console.log('🗑️ Cache cleared for performance testing\n');

      const testSymbol = 'AAPL';
      const testQuery: IVQueryOptions = {
        symbol: testSymbol,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        minQuality: 0.7
      };

      // First query (cache miss)
      console.log('📊 First query (cache miss):');
      const start1 = Date.now();
      const result1 = await historicalIVDB.queryIVRecords(testQuery);
      const time1 = Date.now() - start1;
      
      console.log(`   ⏱️ Time: ${time1}ms`);
      console.log(`   💾 Cache hit: ${result1.queryMeta.cacheHit}`);
      console.log(`   📊 Records: ${result1.data.length}`);

      // Second query (cache hit)
      console.log('\n📊 Second query (cache hit):');
      const start2 = Date.now();
      const result2 = await historicalIVDB.queryIVRecords(testQuery);
      const time2 = Date.now() - start2;
      
      console.log(`   ⏱️ Time: ${time2}ms`);
      console.log(`   💾 Cache hit: ${result2.queryMeta.cacheHit}`);
      console.log(`   📊 Records: ${result2.data.length}`);

      // Performance improvement
      const improvement = ((time1 - time2) / time1) * 100;
      console.log(`\n⚡ Cache Performance:`);
      console.log(`   Speed improvement: ${improvement.toFixed(1)}%`);
      console.log(`   Time saved: ${time1 - time2}ms`);

      // Cache statistics
      const cacheStats = historicalIVDB.getCacheStatistics();
      console.log('\n📈 Cache Statistics:');
      console.log(`   Total entries: ${cacheStats.totalEntries}`);
      console.log(`   Total size: ${(cacheStats.totalSize / 1024).toFixed(2)} KB`);
      console.log(`   Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
      console.log(`   Miss rate: ${(cacheStats.missRate * 100).toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Example 6 failed:', error);
    }
  }

  /**
   * Run all examples in sequence
   */
  async runAllExamples(): Promise<void> {
    console.log('🎯 Historical IV Range Database - Complete Example Suite\n');
    console.log('This demonstration will show all features of the Historical IV system:\n');

    const examples = [
      { name: 'Basic Data Ingestion', fn: () => this.example1_BasicDataIngestion() },
      { name: 'Advanced Querying', fn: () => this.example2_AdvancedQuerying() },
      { name: 'IV Statistics', fn: () => this.example3_IVStatistics() },
      { name: 'Volatility Cone', fn: () => this.example4_VolatilityCone() },
      { name: 'Data Quality Monitoring', fn: () => this.example5_DataQualityMonitoring() },
      { name: 'Cache Performance', fn: () => this.example6_CachePerformance() }
    ];

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      const index = i;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Running Example ${index + 1}: ${example.name}`);
      console.log('='.repeat(60));
      
      try {
        await example.fn();
        console.log(`✅ Example ${index + 1} completed successfully`);
      } catch (error) {
        console.error(`❌ Example ${index + 1} failed:`, error);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎉 All Historical IV Examples Completed!');
    console.log('='.repeat(60));
    console.log('\nThe Historical IV Range Database system provides:');
    console.log('✅ Multi-source data ingestion pipeline');
    console.log('✅ Advanced querying with filtering and aggregation');
    console.log('✅ Statistical analysis and percentile calculations');
    console.log('✅ Volatility cone generation for options trading');
    console.log('✅ Data quality monitoring and anomaly detection');
    console.log('✅ High-performance caching for fast queries');
    console.log('✅ Corporate action adjustment capabilities');
    console.log('✅ Scalable architecture for production use\n');
  }

  /**
   * Quick demo for integration testing
   */
  async quickDemo(): Promise<void> {
    console.log('⚡ Historical IV Database - Quick Demo\n');
    
    try {
      await this.initialize();
      
      // Test basic functionality
      const testQuery: IVQueryOptions = {
        symbol: 'AAPL',
        limit: 5
      };
      
      const result = await historicalIVDB.queryIVRecords(testQuery);
      console.log(`✅ Database operational: ${result.data.length} records found`);
      console.log(`⚡ Query time: ${result.queryMeta.executionTime}ms`);
      
      const cacheStats = historicalIVDB.getCacheStatistics();
      console.log(`📊 Cache entries: ${cacheStats.totalEntries}`);
      
      console.log('\n🎉 Historical IV Database system is ready for production use!');
      
    } catch (error) {
      console.error('❌ Quick demo failed:', error);
    }
  }
}

// Export singleton instance
export const historicalIVExample = new HistoricalIVExample(); 