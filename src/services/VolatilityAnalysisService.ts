/**
 * Volatility Analysis Service - Complete Integration
 * 
 * High-level service that combines data fetching and calculation engines
 * to provide comprehensive volatility analysis for dashboards and applications.
 * 
 * Features:
 * - Single interface for all volatility analytics
 * - Automatic data sourcing and calculation orchestration
 * - Real-time and historical analysis
 * - Error handling and graceful degradation
 * - Performance optimization with intelligent caching
 * - Extensible for additional indicators
 */

import VolatilityCalculationEngine, { 
  VolatilityCalculationResult, 
  PriceData, 
  IVPercentileResult,
  BollingerBandsResult
} from './VolatilityCalculationEngine';
import VolatilityDataService, { DataSourceConfig } from './VolatilityDataService';

export interface VolatilityAnalysisConfig {
  dataSource: Partial<DataSourceConfig>;
  defaultLookbackDays: number;
  enableRealTimeUpdates: boolean;
  updateIntervalMs: number;
  maxConcurrentRequests: number;
}

export interface SymbolAnalysisRequest {
  symbol: string;
  startDate?: string;
  endDate?: string;
  includeVIXCorrelation?: boolean;
  customIV?: number;
}

export interface PortfolioAnalysisRequest {
  symbols: string[];
  startDate?: string;
  endDate?: string;
  includeCorrelationMatrix?: boolean;
}

export interface VolatilitySnapshot {
  symbol: string;
  timestamp: string;
  currentPrice: number;
  analysis: VolatilityCalculationResult;
  dataQuality: {
    priceDataPoints: number;
    volatilityDataPoints: number;
    dataSource: 'yahoo' | 'csv' | 'mock';
    lastUpdate: string;
  };
}

export interface PortfolioVolatilityAnalysis {
  symbols: string[];
  snapshots: VolatilitySnapshot[];
  correlationMatrix?: Record<string, Record<string, number>>;
  portfolioMetrics: {
    averageIVPercentile: number;
    portfolioVolatility: number;
    diversificationRatio: number;
    riskRegimeDistribution: Record<string, number>;
  };
  timestamp: string;
}

export interface VolatilityMetrics {
  currentVolatility: number;
  historicalVolatility: number;
  vixLevel: number;
  atr: number;
  bollingerBandWidth: number;
  volatilityRank: number;
  volatilityPercentile: number;
  impliedVolatility?: number;
  realized30DayVol?: number;
  vixCorrelation?: number;
  priceVolumeCorrelation?: number;
  garchVolatility?: number;
  normalizedVolatility?: number;
}

export class VolatilityAnalysisService {
  private calculationEngine: VolatilityCalculationEngine;
  private dataService: VolatilityDataService;
  private config: VolatilityAnalysisConfig;
  private activeRequests = new Map<string, Promise<any>>();

  constructor(config: Partial<VolatilityAnalysisConfig> = {}) {
    this.config = {
      dataSource: {
        enableYahooFinance: true,
        enableCSVFallback: true,
        cacheTimeoutMs: 5 * 60 * 1000,
        maxRetries: 3,
        rateLimitMs: 1000
      },
      defaultLookbackDays: 252,
      enableRealTimeUpdates: true,
      updateIntervalMs: 30000,
      maxConcurrentRequests: 10,
      ...config
    };

    this.calculationEngine = new VolatilityCalculationEngine();
    this.dataService = new VolatilityDataService(this.config.dataSource);
  }

  /**
   * Get comprehensive volatility analysis for a single symbol
   */
  public async getSymbolAnalysis(request: SymbolAnalysisRequest): Promise<VolatilitySnapshot> {
    const { symbol, startDate, endDate, includeVIXCorrelation = true, customIV } = request;
    
    // Prevent duplicate concurrent requests for the same symbol
    const requestKey = `${symbol}_${startDate}_${endDate}`;
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey);
    }

    const analysisPromise = this.performSymbolAnalysis(
      symbol, 
      startDate, 
      endDate, 
      includeVIXCorrelation, 
      customIV
    );
    
    this.activeRequests.set(requestKey, analysisPromise);
    
    try {
      const result = await analysisPromise;
      return result;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * Get volatility analysis for multiple symbols (portfolio analysis)
   */
  public async getPortfolioAnalysis(request: PortfolioAnalysisRequest): Promise<PortfolioVolatilityAnalysis> {
    const { symbols, startDate, endDate, includeCorrelationMatrix = false } = request;
    
    // Limit concurrent requests
    const batchSize = Math.min(this.config.maxConcurrentRequests, symbols.length);
    const snapshots: VolatilitySnapshot[] = [];
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => 
        this.getSymbolAnalysis({ symbol, startDate, endDate, includeVIXCorrelation: false })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          snapshots.push(result.value);
        } else {
          console.error(`❌ Failed to analyze ${batch[index]}:`, result.reason);
        }
      });
    }

    // Calculate portfolio metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(snapshots);
    
    // Calculate correlation matrix if requested
    let correlationMatrix: Record<string, Record<string, number>> | undefined;
    if (includeCorrelationMatrix && snapshots.length > 1) {
      correlationMatrix = await this.calculateCorrelationMatrix(symbols, startDate, endDate);
    }

    return {
      symbols,
      snapshots,
      correlationMatrix,
      portfolioMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get real-time volatility update for a symbol
   */
  public async getRealTimeUpdate(symbol: string): Promise<Partial<VolatilitySnapshot>> {
    try {
      const realtimePrice = await this.dataService.getRealTimePrice(symbol);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Get recent historical data for context
      const historicalPrices = await this.dataService.getHistoricalPrices(symbol, startDate, endDate);
      const volatilityData = await this.dataService.getVolatilityData(symbol, startDate, endDate);
      
      // Calculate current IV percentile and ATR
      const currentIV = volatilityData.length > 0 ? 
        volatilityData[volatilityData.length - 1].impliedVolatility : 0.25;
      
      const ivPercentile = this.calculationEngine.calculateIVPercentile(currentIV, volatilityData);
      const atr = this.calculationEngine.calculateATR([...historicalPrices, realtimePrice]);
      const bollingerBands = this.calculationEngine.calculateBollingerBands([...historicalPrices, realtimePrice]);

      return {
        symbol,
        timestamp: new Date().toISOString(),
        currentPrice: realtimePrice.close,
        analysis: {
          symbol,
          timestamp: new Date().toISOString(),
          ivPercentile,
          atr,
          bollingerBands,
          vixCorrelation: { correlation: 0, strength: 'weak', direction: 'negative', historicalAverage: -0.3 },
          marketRegime: this.determineMarketRegime(ivPercentile, bollingerBands)
        } as VolatilityCalculationResult
      };
    } catch (error) {
      console.error(`❌ Failed to get real-time update for ${symbol}:`, error);
      throw new Error(`Unable to get real-time update for ${symbol}: ${error}`);
    }
  }

  /**
   * Get available symbols for analysis
   */
  public getAvailableSymbols(): string[] {
    return [
      'SPY', 'QQQ', 'IWM', 'DIA',  // ETFs
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',  // Tech
      'JPM', 'BAC', 'WFC', 'GS',  // Finance
      'JNJ', 'PFE', 'UNH', 'ABBV',  // Healthcare
      '^VIX', '^VXN', '^RVX'  // Volatility indices
    ];
  }

  /**
   * Clear all caches
   */
  public clearCaches(): void {
    this.calculationEngine.clearCache();
    this.dataService.clearCache();
    this.activeRequests.clear();
  }

  /**
   * Get service statistics
   */
  public getServiceStats(): {
    calculationEngine: any;
    dataService: any;
    activeRequests: number;
    config: VolatilityAnalysisConfig;
  } {
    return {
      calculationEngine: this.calculationEngine.getStats(),
      dataService: this.dataService.getStats(),
      activeRequests: this.activeRequests.size,
      config: this.config
    };
  }

  /**
   * Private method to perform the actual symbol analysis
   */
  private async performSymbolAnalysis(
    symbol: string,
    startDate?: string,
    endDate?: string,
    includeVIXCorrelation = true,
    customIV?: number
  ): Promise<VolatilitySnapshot> {
    // Set default date range
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(
      Date.now() - this.config.defaultLookbackDays * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];

    try {
      // Fetch all required data
      const [priceData, volatilityData, vixData] = await Promise.all([
        this.dataService.getHistoricalPrices(symbol, start, end),
        this.dataService.getVolatilityData(symbol, start, end),
        includeVIXCorrelation ? this.dataService.getVIXData(start, end) : Promise.resolve([])
      ]);

      // Determine data source
      let dataSource: 'yahoo' | 'csv' | 'mock' = 'mock';
      if (priceData.length > 0) {
        // Simple heuristic: if we have a lot of data, it's likely from Yahoo
        dataSource = priceData.length > 50 ? 'yahoo' : 'csv';
      }

      // Use custom IV if provided, otherwise use the latest from volatility data
      const currentIV = customIV || (volatilityData.length > 0 ? 
        volatilityData[volatilityData.length - 1].impliedVolatility : 0.25);

      // Perform comprehensive analysis
      const analysis = this.calculationEngine.calculateComprehensiveVolatility(
        symbol,
        priceData,
        volatilityData,
        vixData,
        currentIV
      );

      return {
        symbol,
        timestamp: new Date().toISOString(),
        currentPrice: priceData.length > 0 ? priceData[priceData.length - 1].close : 0,
        analysis,
        dataQuality: {
          priceDataPoints: priceData.length,
          volatilityDataPoints: volatilityData.length,
          dataSource,
          lastUpdate: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`❌ Failed to analyze ${symbol}:`, error);
      throw new Error(`Unable to analyze ${symbol}: ${error}`);
    }
  }

  /**
   * Calculate portfolio-level metrics
   */
  private calculatePortfolioMetrics(snapshots: VolatilitySnapshot[]): {
    averageIVPercentile: number;
    portfolioVolatility: number;
    diversificationRatio: number;
    riskRegimeDistribution: Record<string, number>;
  } {
    if (snapshots.length === 0) {
      return {
        averageIVPercentile: 0,
        portfolioVolatility: 0,
        diversificationRatio: 0,
        riskRegimeDistribution: {}
      };
    }

    // Calculate average IV percentile
    const averageIVPercentile = snapshots.reduce(
      (sum, snapshot) => sum + snapshot.analysis.ivPercentile.percentile, 0
    ) / snapshots.length;

    // Calculate portfolio volatility (simplified - equal weights)
    const individualVolatilities = snapshots.map(s => s.analysis.atr.value);
    const portfolioVolatility = Math.sqrt(
      individualVolatilities.reduce((sum, vol) => sum + vol * vol, 0) / snapshots.length
    );

    // Calculate diversification ratio (simplified)
    const averageVolatility = individualVolatilities.reduce((sum, vol) => sum + vol, 0) / snapshots.length;
    const diversificationRatio = averageVolatility / portfolioVolatility;

    // Calculate risk regime distribution
    const regimeCounts = snapshots.reduce((counts, snapshot) => {
      const regime = snapshot.analysis.marketRegime;
      counts[regime] = (counts[regime] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const riskRegimeDistribution = Object.entries(regimeCounts).reduce((dist, [regime, count]) => {
      dist[regime] = (count / snapshots.length) * 100;
      return dist;
    }, {} as Record<string, number>);

    return {
      averageIVPercentile,
      portfolioVolatility,
      diversificationRatio,
      riskRegimeDistribution
    };
  }

  /**
   * Calculate correlation matrix for portfolio symbols
   */
  private async calculateCorrelationMatrix(
    symbols: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, Record<string, number>>> {
    const matrix: Record<string, Record<string, number>> = {};
    
    // Initialize matrix
    symbols.forEach(symbol1 => {
      matrix[symbol1] = {};
      symbols.forEach(symbol2 => {
        matrix[symbol1][symbol2] = symbol1 === symbol2 ? 1 : 0;
      });
    });

    // Calculate pairwise correlations
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const symbol1 = symbols[i];
        const symbol2 = symbols[j];
        
        try {
          const [data1, data2] = await Promise.all([
            this.dataService.getHistoricalPrices(symbol1, startDate || '', endDate || ''),
            this.dataService.getHistoricalPrices(symbol2, startDate || '', endDate || '')
          ]);
          
          const correlation = this.calculatePriceCorrelation(data1, data2);
          matrix[symbol1][symbol2] = correlation;
          matrix[symbol2][symbol1] = correlation;
        } catch (error) {
          console.warn(`⚠️ Failed to calculate correlation between ${symbol1} and ${symbol2}`);
        }
      }
    }

    return matrix;
  }

  /**
   * Calculate correlation between two price series
   */
  private calculatePriceCorrelation(data1: PriceData[], data2: PriceData[]): number {
    // Align data by date
    const aligned = this.alignPriceData(data1, data2);
    
    if (aligned.length < 10) return 0;

    // Calculate returns
    const returns1 = this.calculateReturns(aligned.map(d => d.price1));
    const returns2 = this.calculateReturns(aligned.map(d => d.price2));

    // Calculate correlation
    return this.calculateCorrelation(returns1, returns2);
  }

  /**
   * Align two price data series by date
   */
  private alignPriceData(data1: PriceData[], data2: PriceData[]): Array<{date: string, price1: number, price2: number}> {
    const map1 = new Map(data1.map(d => [d.date, d.close]));
    const aligned = [];

    for (const item of data2) {
      const price1 = map1.get(item.date);
      if (price1 !== undefined) {
        aligned.push({
          date: item.date,
          price1,
          price2: item.close
        });
      }
    }

    return aligned;
  }

  /**
   * Calculate returns from price series
   */
  private calculateReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  /**
   * Calculate correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Determine market regime from indicators
   */
  private determineMarketRegime(
    ivPercentile: IVPercentileResult, 
    bollingerBands: BollingerBandsResult
  ): 'low-vol' | 'normal' | 'high-vol' | 'crisis' {
    if (ivPercentile.zone === 'extreme' && bollingerBands.bandwidth > 30) {
      return 'crisis';
    } else if (ivPercentile.zone === 'high' || bollingerBands.bandwidth > 20) {
      return 'high-vol';
    } else if (ivPercentile.zone === 'low' && bollingerBands.bandwidth < 10) {
      return 'low-vol';
    } else {
      return 'normal';
    }
  }
}

export default VolatilityAnalysisService; 