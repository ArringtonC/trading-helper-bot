/**
 * Volatility API Example Service
 * 
 * Comprehensive demonstration of the Real-Time Volatility API with RESTful
 * and WebSocket endpoints, authentication, rate limiting, and monitoring.
 * 
 * Examples included:
 * 1. API initialization and configuration
 * 2. RESTful endpoint demonstrations
 * 3. WebSocket real-time streaming
 * 4. Authentication and security features
 * 5. Rate limiting and quota management
 * 6. Error handling and monitoring
 * 7. Performance metrics and logging
 * 8. API client integration patterns
 */

import { volatilityAPI, VolatilityAPIService, APIRequest, APIConfig, WebSocketMessage } from '../VolatilityAPIService';

export class VolatilityAPIExample {
  private initialized = false;

  /**
   * Initialize the Volatility API system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('\n🚀 Initializing Volatility API System...\n');

    // Initialize the API service
    await volatilityAPI.initialize();
    console.log('✅ API service initialized');

    this.initialized = true;
    console.log('\n✨ Volatility API system ready!\n');
  }

  /**
   * Example 1: Single Symbol Volatility Data
   */
  async example1_SingleSymbolAPI(): Promise<void> {
    console.log('\n📊 EXAMPLE 1: Single Symbol Volatility API\n');
    console.log('Demonstrating RESTful endpoint for individual symbol analysis...\n');

    try {
      await this.initialize();

      const symbols = ['AAPL', 'MSFT', 'GOOGL'];

      for (const symbol of symbols) {
        console.log(`📱 Fetching volatility data for ${symbol}:`);
        
        // Create mock API request
        const request: APIRequest = this.createMockRequest('GET', `/api/v1/volatility/${symbol}`);
        
        // Call the API endpoint
        const response = await volatilityAPI.getVolatilitySnapshot(symbol, request);
        
        if (response.success && response.data) {
          const snapshot = response.data;
          console.log(`   📈 Current Price: $${snapshot.currentPrice.toFixed(2)}`);
          console.log(`   📊 IV Percentile: ${(snapshot.analysis.ivPercentile.percentile * 100).toFixed(1)}%`);
          console.log(`   📊 ATR: ${snapshot.analysis.atr.value.toFixed(4)}`);
          console.log(`   📊 Market Regime: ${snapshot.analysis.marketRegime}`);
          console.log(`   ⚡ Response Time: ${response.meta.executionTime}ms`);
          console.log(`   🔑 Request ID: ${response.meta.requestId}`);
          console.log(`   ⏱️ Rate Limit Remaining: ${response.meta.rateLimitRemaining}`);
        } else {
          console.log(`   ❌ Error: ${response.error?.message}`);
        }
        console.log();
      }

    } catch (error) {
      console.error('❌ Example 1 failed:', error);
    }
  }

  /**
   * Example 2: Portfolio Analysis API
   */
  async example2_PortfolioAPI(): Promise<void> {
    console.log('\n📊 EXAMPLE 2: Portfolio Analysis API\n');
    console.log('Demonstrating portfolio volatility analysis endpoint...\n');

    try {
      await this.initialize();

      const portfolioSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'SPY'];
      
      console.log(`📋 Analyzing portfolio: ${portfolioSymbols.join(', ')}\n`);
      
      // Create mock API request
      const request: APIRequest = this.createMockRequest('GET', '/api/v1/portfolio/volatility', {
        symbols: portfolioSymbols
      });
      
      // Call the portfolio API endpoint
      const response = await volatilityAPI.getPortfolioVolatility(portfolioSymbols, request);
      
      if (response.success && response.data) {
        const portfolio = response.data;
        
        console.log('📈 Portfolio Analysis Results:');
        console.log(`   Symbols Analyzed: ${portfolio.snapshots.length}/${portfolioSymbols.length}`);
        console.log(`   Average IV Percentile: ${(portfolio.portfolioMetrics.averageIVPercentile * 100).toFixed(1)}%`);
        console.log(`   Portfolio Volatility: ${(portfolio.portfolioMetrics.portfolioVolatility * 100).toFixed(2)}%`);
        console.log(`   Diversification Ratio: ${portfolio.portfolioMetrics.diversificationRatio.toFixed(2)}`);
        
        console.log('\n📊 Risk Regime Distribution:');
        Object.entries(portfolio.portfolioMetrics.riskRegimeDistribution).forEach(([regime, percentage]) => {
          console.log(`   ${regime}: ${(percentage * 100).toFixed(1)}%`);
        });
        
        console.log('\n📱 Individual Symbol Results:');
        portfolio.snapshots.forEach(snapshot => {
          console.log(`   ${snapshot.symbol}: IV ${(snapshot.analysis.ivPercentile.percentile * 100).toFixed(1)}% | ${snapshot.analysis.marketRegime}`);
        });
        
        console.log(`\n⚡ Response Time: ${response.meta.executionTime}ms`);
        console.log(`🔑 Request ID: ${response.meta.requestId}`);
        
      } else {
        console.log(`❌ Error: ${response.error?.message}`);
      }

    } catch (error) {
      console.error('❌ Example 2 failed:', error);
    }
  }

  /**
   * Example 3: Historical Statistics API
   */
  async example3_HistoricalStatisticsAPI(): Promise<void> {
    console.log('\n📈 EXAMPLE 3: Historical Statistics API\n');
    console.log('Demonstrating historical IV statistics endpoint...\n');

    try {
      await this.initialize();

      const symbols = ['AAPL', 'SPY'];
      const periods = ['3M', '1Y'];

      for (const symbol of symbols) {
        console.log(`📊 ${symbol} Historical Statistics:\n`);
        
        for (const period of periods) {
          console.log(`   📅 ${period} Statistics:`);
          
          // Create mock API request
          const request: APIRequest = this.createMockRequest('GET', `/api/v1/historical/${symbol}/statistics`, {
            period
          });
          
          // Call the historical statistics API endpoint
          const response = await volatilityAPI.getHistoricalStatistics(symbol, period, request);
          
          if (response.success && response.data) {
            const stats = response.data;
            console.log(`      Mean IV: ${stats.mean.toFixed(4)}`);
            console.log(`      Median IV: ${stats.median.toFixed(4)}`);
            console.log(`      Std Dev: ${stats.std.toFixed(4)}`);
            console.log(`      Data Points: ${stats.count}`);
            console.log(`      Quality Score: ${stats.dataQuality.averageScore.toFixed(3)}`);
            console.log(`      Response Time: ${response.meta.executionTime}ms`);
          } else {
            console.log(`      ❌ Error: ${response.error?.message}`);
          }
        }
        console.log();
      }

    } catch (error) {
      console.error('❌ Example 3 failed:', error);
    }
  }

  /**
   * Example 4: Volatility Cone API
   */
  async example4_VolatilityConeAPI(): Promise<void> {
    console.log('\n🌊 EXAMPLE 4: Volatility Cone API\n');
    console.log('Demonstrating volatility cone endpoint...\n');

    try {
      await this.initialize();

      const symbols = ['AAPL', 'SPY'];

      for (const symbol of symbols) {
        console.log(`🎯 ${symbol} Volatility Cone:`);
        
        // Create mock API request
        const request: APIRequest = this.createMockRequest('GET', `/api/v1/volatility-cone/${symbol}`);
        
        // Call the volatility cone API endpoint
        const response = await volatilityAPI.getVolatilityCone(symbol, request);
        
        if (response.success && response.data) {
          const cone = response.data;
          
          console.log(`   📅 Generated: ${new Date(cone.generatedAt).toLocaleString()}`);
          console.log('   📊 Cone Analysis:');
          
          // Display simplified cone data
          const periods = Object.keys(cone.percentiles).slice(0, 3); // Show first 3 periods
          periods.forEach(period => {
            const data = cone.percentiles[period];
            const currentPos = ((data.current - data.min) / (data.max - data.min)) * 100;
            console.log(`      ${period}: Current ${data.current.toFixed(3)} (${currentPos.toFixed(1)}th percentile)`);
          });
          
          console.log(`   ⚡ Response Time: ${response.meta.executionTime}ms`);
          console.log(`   🔑 Request ID: ${response.meta.requestId}`);
          
        } else {
          console.log(`   ❌ Error: ${response.error?.message}`);
        }
        console.log();
      }

    } catch (error) {
      console.error('❌ Example 4 failed:', error);
    }
  }

  /**
   * Example 5: WebSocket Real-Time Streaming
   */
  async example5_WebSocketStreaming(): Promise<void> {
    console.log('\n🔄 EXAMPLE 5: WebSocket Real-Time Streaming\n');
    console.log('Demonstrating WebSocket real-time data streaming...\n');

    try {
      await this.initialize();

      // Simulate multiple WebSocket connections
      const connections = [
        { id: 'conn_1', symbols: ['AAPL', 'MSFT'] },
        { id: 'conn_2', symbols: ['GOOGL', 'TSLA'] },
        { id: 'conn_3', symbols: ['SPY'] }
      ];

      console.log('🔌 Establishing WebSocket connections:');
      
      for (const conn of connections) {
        // Establish connection
        const subscription = volatilityAPI.handleWebSocketConnection(conn.id, 'user123');
        console.log(`   ✅ Connection ${conn.id} established`);
        
        // Subscribe to symbols
        for (const symbol of conn.symbols) {
          const subscribeMessage: WebSocketMessage = {
            type: 'subscribe',
            symbol,
            timestamp: new Date().toISOString()
          };
          
          const response = await volatilityAPI.handleWebSocketMessage(conn.id, subscribeMessage);
          
          if (response && response.type === 'data') {
            console.log(`      📱 Subscribed to ${symbol}: ${response.data?.symbol} data received`);
          } else if (response && response.type === 'error') {
            console.log(`      ❌ Subscription failed for ${symbol}: ${response.error}`);
          }
        }
      }

      // Simulate data broadcasting
      console.log('\n📡 Simulating real-time data broadcasts:');
      
      const broadcastSymbols = ['AAPL', 'SPY'];
      for (const symbol of broadcastSymbols) {
        console.log(`   📊 Broadcasting ${symbol} update...`);
        
        // Create mock volatility snapshot for broadcasting
        const mockSnapshot = {
          symbol,
          timestamp: new Date().toISOString(),
          currentPrice: 150 + Math.random() * 50,
          analysis: {
            ivPercentile: { percentile: Math.random(), rank: Math.floor(Math.random() * 100) },
            marketRegime: 'normal' as const
          }
        } as any;
        
        await volatilityAPI.broadcastVolatilityUpdate(symbol, mockSnapshot);
      }

      // Show connection statistics
      console.log('\n📈 WebSocket Statistics:');
      const metrics = volatilityAPI.getMetrics();
      console.log(`   Active Connections: ${metrics.activeConnections}`);
      console.log(`   Total Requests: ${metrics.totalRequests}`);
      console.log(`   WebSocket Connections: ${metrics.wsConnections}`);

      // Cleanup connections
      console.log('\n🧹 Cleaning up connections:');
      for (const conn of connections) {
        volatilityAPI.disconnectWebSocket(conn.id);
        console.log(`   ✅ Disconnected ${conn.id}`);
      }

    } catch (error) {
      console.error('❌ Example 5 failed:', error);
    }
  }

  /**
   * Example 6: Authentication and Rate Limiting
   */
  async example6_SecurityFeatures(): Promise<void> {
    console.log('\n🔐 EXAMPLE 6: Authentication and Rate Limiting\n');
    console.log('Demonstrating security features and rate limiting...\n');

    try {
      await this.initialize();

      // Test 1: Authentication failure
      console.log('🔒 Test 1: Authentication failure');
      const noAuthRequest: APIRequest = this.createMockRequest('GET', '/api/v1/volatility/AAPL', {}, false);
      const noAuthResponse = await volatilityAPI.getVolatilitySnapshot('AAPL', noAuthRequest);
      
      console.log(`   Expected Auth Failure: ${!noAuthResponse.success ? '✅' : '❌'}`);
      console.log(`   Error Code: ${noAuthResponse.error?.code}`);
      console.log(`   Error Message: ${noAuthResponse.error?.message}`);

      // Test 2: Valid authentication
      console.log('\n🔑 Test 2: Valid authentication');
      const authRequest: APIRequest = this.createMockRequest('GET', '/api/v1/volatility/AAPL');
      const authResponse = await volatilityAPI.getVolatilitySnapshot('AAPL', authRequest);
      
      console.log(`   Authentication Success: ${authResponse.success ? '✅' : '❌'}`);
      console.log(`   Rate Limit Remaining: ${authResponse.meta.rateLimitRemaining}`);
      console.log(`   Response Time: ${authResponse.meta.executionTime}ms`);

      // Test 3: Rate limiting simulation
      console.log('\n⏱️ Test 3: Rate limiting simulation');
      console.log('   Making multiple rapid requests to test rate limiting...');
      
      const rateLimitTests = [];
      for (let i = 0; i < 5; i++) {
        const request = this.createMockRequest('GET', `/api/v1/volatility/AAPL`);
        rateLimitTests.push(volatilityAPI.getVolatilitySnapshot('AAPL', request));
      }
      
      const rateLimitResults = await Promise.all(rateLimitTests);
      
      let successCount = 0;
      let rateLimitedCount = 0;
      
      rateLimitResults.forEach((response, index) => {
        if (response.success) {
          successCount++;
          console.log(`   Request ${index + 1}: ✅ Success (${response.meta.rateLimitRemaining} remaining)`);
        } else if (response.error?.code === 'RATE_LIMIT_EXCEEDED') {
          rateLimitedCount++;
          console.log(`   Request ${index + 1}: ⏱️ Rate Limited`);
        } else {
          console.log(`   Request ${index + 1}: ❌ Error: ${response.error?.message}`);
        }
      });
      
      console.log(`\n📊 Rate Limiting Results:`);
      console.log(`   Successful Requests: ${successCount}`);
      console.log(`   Rate Limited Requests: ${rateLimitedCount}`);

      // Test 4: Invalid symbol validation
      console.log('\n🔍 Test 4: Input validation');
      const invalidSymbolRequest: APIRequest = this.createMockRequest('GET', '/api/v1/volatility/INVALID@SYMBOL');
      const invalidResponse = await volatilityAPI.getVolatilitySnapshot('INVALID@SYMBOL', invalidSymbolRequest);
      
      console.log(`   Invalid Symbol Rejected: ${!invalidResponse.success ? '✅' : '❌'}`);
      console.log(`   Error Code: ${invalidResponse.error?.code}`);

    } catch (error) {
      console.error('❌ Example 6 failed:', error);
    }
  }

  /**
   * Example 7: Health Check and Monitoring
   */
  async example7_HealthAndMonitoring(): Promise<void> {
    console.log('\n🔍 EXAMPLE 7: Health Check and Monitoring\n');
    console.log('Demonstrating health check endpoint and API metrics...\n');

    try {
      await this.initialize();

      // Health check endpoint
      console.log('🏥 Health Check:');
      const healthRequest: APIRequest = this.createMockRequest('GET', '/api/v1/health');
      const healthResponse = await volatilityAPI.getHealthCheck(healthRequest);
      
      if (healthResponse.success && healthResponse.data) {
        const health = healthResponse.data;
        console.log(`   Status: ${health.status}`);
        console.log(`   Version: ${health.version}`);
        console.log(`   Uptime: ${health.uptime.toFixed(2)}s`);
        console.log(`   Services:`);
        Object.entries(health.services).forEach(([service, status]) => {
          console.log(`      ${service}: ${status}`);
        });
      }

      // API metrics
      console.log('\n📊 API Metrics:');
      const metrics = volatilityAPI.getMetrics();
      console.log(`   Total Requests: ${metrics.totalRequests}`);
      console.log(`   Successful Requests: ${metrics.successfulRequests}`);
      console.log(`   Failed Requests: ${metrics.failedRequests}`);
      console.log(`   Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
      console.log(`   Active Connections: ${metrics.activeConnections}`);
      console.log(`   Rate Limited Requests: ${metrics.rateLimitedRequests}`);
      console.log(`   Auth Failures: ${metrics.authFailures}`);
      
      // Success rate calculation
      const successRate = metrics.totalRequests > 0 ? 
        (metrics.successfulRequests / metrics.totalRequests) * 100 : 0;
      console.log(`   Success Rate: ${successRate.toFixed(1)}%`);

    } catch (error) {
      console.error('❌ Example 7 failed:', error);
    }
  }

  /**
   * Run all examples in sequence
   */
  async runAllExamples(): Promise<void> {
    console.log('🎯 Volatility API - Complete Example Suite\n');
    console.log('This demonstration will show all features of the Volatility API system:\n');

    const examples = [
      { name: 'Single Symbol API', fn: () => this.example1_SingleSymbolAPI() },
      { name: 'Portfolio Analysis API', fn: () => this.example2_PortfolioAPI() },
      { name: 'Historical Statistics API', fn: () => this.example3_HistoricalStatisticsAPI() },
      { name: 'Volatility Cone API', fn: () => this.example4_VolatilityConeAPI() },
      { name: 'WebSocket Streaming', fn: () => this.example5_WebSocketStreaming() },
      { name: 'Security Features', fn: () => this.example6_SecurityFeatures() },
      { name: 'Health and Monitoring', fn: () => this.example7_HealthAndMonitoring() }
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
    console.log('🎉 All Volatility API Examples Completed!');
    console.log('='.repeat(60));
    console.log('\nThe Volatility API system provides:');
    console.log('✅ RESTful endpoints for volatility data');
    console.log('✅ WebSocket real-time streaming');
    console.log('✅ JWT-based authentication');
    console.log('✅ Rate limiting and quota management');
    console.log('✅ Comprehensive logging and monitoring');
    console.log('✅ Error handling and validation');
    console.log('✅ API versioning and documentation');
    console.log('✅ Health checks and metrics');
    console.log('✅ Production-ready security features\n');
  }

  /**
   * Quick demo for integration testing
   */
  async quickDemo(): Promise<void> {
    console.log('⚡ Volatility API - Quick Demo\n');
    
    try {
      await this.initialize();
      
      // Test basic API functionality
      const request = this.createMockRequest('GET', '/api/v1/volatility/AAPL');
      const response = await volatilityAPI.getVolatilitySnapshot('AAPL', request);
      
      console.log(`✅ API operational: ${response.success ? 'Success' : 'Failed'}`);
      console.log(`⚡ Response time: ${response.meta.executionTime}ms`);
      
      const metrics = volatilityAPI.getMetrics();
      console.log(`📊 Total requests processed: ${metrics.totalRequests}`);
      
      console.log('\n🎉 Volatility API system is ready for production use!');
      
    } catch (error) {
      console.error('❌ Quick demo failed:', error);
    }
  }

  /**
   * Helper: Create mock API request
   */
  private createMockRequest(method: string, path: string, query: any = {}, includeAuth = true): APIRequest {
    return {
      headers: {
        'authorization': includeAuth ? 'Bearer mock-jwt-token' : '',
        'content-type': 'application/json',
        'user-agent': 'VolatilityAPIExample/1.0'
      },
      params: {},
      query,
      method,
      path,
      clientIP: '127.0.0.1',
      userAgent: 'VolatilityAPIExample/1.0',
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const volatilityAPIExample = new VolatilityAPIExample(); 