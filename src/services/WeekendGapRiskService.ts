/**
 * Weekend Gap Risk Service
 * 
 * This service provides comprehensive weekend gap risk analysis for trading positions.
 * It calculates statistical measures of price gaps, assesses position-specific risks,
 * and provides portfolio-level gap risk analysis.
 */

import { 
  PriceData, 
  GapEvent, 
  GapStatistics,
  PositionGapRisk,
  WeekendGapAnalysis,
  GapRiskConfiguration,
  GapRiskServiceResult,
  DEFAULT_GAP_RISK_CONFIG,
  GapMagnitude
} from '../types/gapRisk';

import { NormalizedTradeData } from '../types/trade';

import {
  detectWeekendGaps,
  calculateGapStatistics,
  validatePriceData,
  calculateMean
} from '../utils/gapAnalysis';

import { calculateCurrentVolatilityRegime, VolatilityRegime } from './MarketAnalysisService';

/**
 * Main service class for weekend gap risk analysis
 */
export class WeekendGapRiskService {
  private config: GapRiskConfiguration;
  private gapStatisticsCache: Map<string, { stats: GapStatistics; expiry: Date }>;
  private historicalDataCache: Map<string, { data: PriceData[]; expiry: Date }>;

  constructor(config: GapRiskConfiguration = DEFAULT_GAP_RISK_CONFIG) {
    this.config = config;
    this.gapStatisticsCache = new Map();
    this.historicalDataCache = new Map();
  }

  /**
   * Analyzes gap risk for a single symbol
   */
  async analyzeSymbolGapRisk(symbol: string): Promise<GapRiskServiceResult> {
    try {
      // Check cache first
      const cachedStats = this.getCachedGapStatistics(symbol);
      if (cachedStats) {
        return {
          success: true,
          data: cachedStats,
          timestamp: new Date()
        };
      }

      // Fetch historical data
      const historicalData = await this.getHistoricalData(symbol);
      if (!historicalData || historicalData.length === 0) {
        return {
          success: false,
          error: `No historical data available for symbol: ${symbol}`,
          timestamp: new Date()
        };
      }

      // Validate data
      if (!validatePriceData(historicalData)) {
        return {
          success: false,
          error: `Invalid price data for symbol: ${symbol}`,
          timestamp: new Date()
        };
      }

      // Detect gaps
      const gaps = detectWeekendGaps(historicalData, symbol, this.config);

      // Calculate statistics
      const gapStatistics = calculateGapStatistics(
        gaps, 
        symbol, 
        this.config.historicalPeriod, 
        this.config
      );

      // Cache the results
      this.cacheGapStatistics(symbol, gapStatistics);

      return {
        success: true,
        data: gapStatistics,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Error analyzing gap risk for ${symbol}:`, error);
      return {
        success: false,
        error: `Failed to analyze gap risk for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Analyzes gap risk for a specific position
   */
  async analyzePositionGapRisk(
    position: NormalizedTradeData,
    currentPrice?: number
  ): Promise<GapRiskServiceResult> {
    try {
      const symbol = position.symbol;
      const positionSize = Math.abs(position.quantity);
      const tradePrice = currentPrice || position.tradePrice;
      const positionValue = positionSize * tradePrice;

      // Get gap statistics for the symbol
      const symbolAnalysisResult = await this.analyzeSymbolGapRisk(symbol);
      if (!symbolAnalysisResult.success || !symbolAnalysisResult.data) {
        return symbolAnalysisResult;
      }

      const gapStats = symbolAnalysisResult.data as GapStatistics;

      // Get volatility regime
      const volatilityRegime = await this.getVolatilityRegime(symbol);

      // Calculate position-specific risk
      const positionGapRisk = this.calculatePositionGapRisk(
        position,
        gapStats,
        positionValue,
        tradePrice,
        volatilityRegime
      );

      return {
        success: true,
        data: positionGapRisk,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Error analyzing position gap risk:`, error);
      return {
        success: false,
        error: `Failed to analyze position gap risk: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Analyzes gap risk for an entire portfolio
   */
  async analyzePortfolioGapRisk(
    positions: NormalizedTradeData[],
    portfolioId: string = 'default'
  ): Promise<GapRiskServiceResult> {
    try {
      const positionRisks: PositionGapRisk[] = [];
      let totalExposure = 0;
      let totalRisk = 0;

      // Analyze each position
      for (const position of positions) {
        const positionResult = await this.analyzePositionGapRisk(position);
        if (positionResult.success && positionResult.data) {
          const positionRisk = positionResult.data as PositionGapRisk;
          positionRisks.push(positionRisk);
          totalExposure += positionRisk.positionValue;
          totalRisk += positionRisk.gapRisk.expectedLoss;
        }
      }

      // Calculate portfolio-level metrics
      const portfolioMetrics = this.calculatePortfolioMetrics(positionRisks);

      // Generate recommendations
      const recommendations = this.generateRiskRecommendations(
        positionRisks,
        portfolioMetrics,
        totalRisk / totalExposure
      );

      // Calculate overall risk score
      const riskScore = this.calculatePortfolioRiskScore(positionRisks, portfolioMetrics);

      const portfolioAnalysis: WeekendGapAnalysis = {
        portfolioId,
        totalExposure,
        totalRisk,
        riskScore,
        positions: positionRisks,
        portfolioMetrics,
        recommendations,
        calculatedAt: new Date()
      };

      return {
        success: true,
        data: portfolioAnalysis,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Error analyzing portfolio gap risk:`, error);
      return {
        success: false,
        error: `Failed to analyze portfolio gap risk: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Calculates position-specific gap risk
   */
  private calculatePositionGapRisk(
    position: NormalizedTradeData,
    gapStats: GapStatistics,
    positionValue: number,
    currentPrice: number,
    volatilityRegime: string
  ): PositionGapRisk {
    const isLong = position.quantity > 0;
    
    // Calculate scenario-based risks
    const scenarios = this.calculateScenarioRisks(
      gapStats,
      positionValue,
      currentPrice,
      isLong
    );

    // Calculate expected loss and maximum loss
    const expectedLoss = this.calculateExpectedLoss(scenarios, gapStats);
    const maximumLoss = Math.max(...Object.values(scenarios).map(s => s.potentialLoss));

    // Calculate risk score (0-100)
    const riskScore = this.calculateRiskScore(
      gapStats,
      positionValue,
      expectedLoss,
      volatilityRegime
    );

    // Assess risk factors
    const riskFactors = {
      volatilityRegime,
      liquidity: this.assessLiquidity(position.symbol),
      earnings: false, // TODO: Implement earnings detection
      events: [] // TODO: Implement event detection
    };

    return {
      positionId: position.id,
      symbol: position.symbol,
      positionSize: Math.abs(position.quantity),
      positionValue,
      currentPrice,
      gapRisk: {
        riskScore,
        probabilityOfLoss: gapStats.riskMetrics.probabilityOfGap,
        expectedLoss,
        maximumLoss,
        scenarios
      },
      riskFactors,
      calculatedAt: new Date()
    };
  }

  /**
   * Calculates scenario-based risks for different gap magnitudes
   */
  private calculateScenarioRisks(
    gapStats: GapStatistics,
    positionValue: number,
    currentPrice: number,
    isLong: boolean
  ): Record<GapMagnitude, { probability: number; potentialLoss: number }> {
    const scenarios = {} as Record<GapMagnitude, { probability: number; potentialLoss: number }>;

    Object.values(GapMagnitude).forEach(magnitude => {
      const frequency = gapStats.frequency.byMagnitude[magnitude];
      const probability = frequency / gapStats.frequency.total;

      // Estimate potential loss based on gap magnitude and position direction
      let potentialLoss = 0;
      
      switch (magnitude) {
        case GapMagnitude.SMALL:
          potentialLoss = this.calculateMagnitudeLoss(positionValue, 0.0075, isLong);
          break;
        case GapMagnitude.MEDIUM:
          potentialLoss = this.calculateMagnitudeLoss(positionValue, 0.02, isLong);
          break;
        case GapMagnitude.LARGE:
          potentialLoss = this.calculateMagnitudeLoss(positionValue, 0.04, isLong);
          break;
        case GapMagnitude.EXTREME:
          potentialLoss = this.calculateMagnitudeLoss(positionValue, 0.075, isLong);
          break;
      }

      scenarios[magnitude] = {
        probability: Math.max(0, Math.min(1, probability)),
        potentialLoss: Math.max(0, potentialLoss)
      };
    });

    return scenarios;
  }

  /**
   * Calculates potential loss for a given gap magnitude
   */
  private calculateMagnitudeLoss(
    positionValue: number,
    gapMagnitude: number,
    isLong: boolean
  ): number {
    if (isLong) {
      // Long positions lose on down gaps
      return positionValue * gapMagnitude;
    } else {
      // Short positions lose on up gaps
      return positionValue * gapMagnitude;
    }
  }

  /**
   * Calculates expected loss from scenario analysis
   */
  private calculateExpectedLoss(
    scenarios: Record<GapMagnitude, { probability: number; potentialLoss: number }>, 
    gapStats: GapStatistics
  ): number {
    let expectedLoss = 0;
    
    Object.values(scenarios).forEach((scenario) => {
      expectedLoss += scenario.probability * scenario.potentialLoss;
    });

    return expectedLoss;
  }

  /**
   * Calculates a risk score from 0-100
   */
  private calculateRiskScore(
    gapStats: GapStatistics,
    positionValue: number,
    expectedLoss: number,
    volatilityRegime: string
  ): number {
    // Base score from gap probability
    let score = gapStats.riskMetrics.probabilityOfGap * 50;

    // Adjust for expected loss relative to position value
    const lossRatio = expectedLoss / positionValue;
    score += lossRatio * 30;

    // Adjust for volatility regime
    switch (volatilityRegime) {
      case VolatilityRegime.HIGH:
        score *= 1.3;
        break;
      case VolatilityRegime.MEDIUM:
        score *= 1.1;
        break;
      case VolatilityRegime.LOW:
        score *= 0.9;
        break;
    }

    // Adjust for gap frequency
    if (gapStats.frequency.total > 50) {
      score *= 1.2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculates portfolio-level metrics
   */
  private calculatePortfolioMetrics(positions: PositionGapRisk[]) {
    const totalValue = positions.reduce((sum, pos) => sum + pos.positionValue, 0);
    const weightedRisks = positions.map(pos => ({
      weight: pos.positionValue / totalValue,
      risk: pos.gapRisk.riskScore
    }));

    // Calculate concentration risk (HHI of position weights)
    const concentrationRisk = positions.reduce((sum, pos) => {
      const weight = pos.positionValue / totalValue;
      return sum + weight * weight;
    }, 0);

    // Simple correlation risk estimate (average of position risks)
    const correlationRisk = calculateMean(positions.map(p => p.gapRisk.riskScore));

    // Diversification benefit (reduction in risk due to diversification)
    const diversificationBenefit = Math.max(0, 
      calculateMean(positions.map(p => p.gapRisk.riskScore)) - 
      Math.sqrt(concentrationRisk) * 100
    );

    // Net exposure (sum of signed position values)
    const netExposure = positions.reduce((sum, pos) => {
      return sum + (pos.positionSize * pos.currentPrice);
    }, 0);

    return {
      concentrationRisk,
      correlationRisk,
      diversificationBenefit,
      netExposure
    };
  }

  /**
   * Generates risk recommendations
   */
  private generateRiskRecommendations(
    positions: PositionGapRisk[],
    portfolioMetrics: any,
    riskRatio: number
  ) {
    const recommendations = [];

    // High overall risk
    if (riskRatio > 0.05) {
      recommendations.push({
        action: 'reduce' as const,
        urgency: 'high' as const,
        description: 'Portfolio has high gap risk exposure. Consider reducing position sizes or adding hedges.',
        hedgingOptions: ['VIX calls', 'Put options', 'Portfolio rebalancing']
      });
    }

    // High concentration risk
    if (portfolioMetrics.concentrationRisk > 0.5) {
      recommendations.push({
        action: 'reduce' as const,
        urgency: 'medium' as const,
        description: 'Portfolio is highly concentrated. Consider diversifying across more symbols.',
        hedgingOptions: ['Sector diversification', 'Size reduction']
      });
    }

    // Individual position risks
    positions.forEach(position => {
      if (position.gapRisk.riskScore > 80) {
        recommendations.push({
          action: 'hedge' as const,
          urgency: 'high' as const,
          description: `High gap risk for ${position.symbol}. Consider hedging this position.`,
          hedgingOptions: [`${position.symbol} puts`, 'Partial position closure']
        });
      }
    });

    if (recommendations.length === 0) {
      recommendations.push({
        action: 'hold' as const,
        urgency: 'low' as const,
        description: 'Gap risk levels are acceptable. Continue monitoring.'
      });
    }

    return recommendations;
  }

  /**
   * Calculates overall portfolio risk score
   */
  private calculatePortfolioRiskScore(
    positions: PositionGapRisk[],
    portfolioMetrics: any
  ): number {
    if (positions.length === 0) return 0;

    const weightedScore = positions.reduce((sum, pos) => {
      const weight = pos.positionValue / positions.reduce((total, p) => total + p.positionValue, 0);
      return sum + (weight * pos.gapRisk.riskScore);
    }, 0);

    // Adjust for concentration risk
    const concentrationAdjustment = portfolioMetrics.concentrationRisk * 20;

    return Math.max(0, Math.min(100, weightedScore + concentrationAdjustment));
  }

  /**
   * Helper methods for data retrieval and caching
   */
  private async getHistoricalData(symbol: string): Promise<PriceData[]> {
    // Check cache first
    const cachedData = this.getCachedHistoricalData(symbol);
    if (cachedData) {
      return cachedData;
    }

    try {
      // Use existing IBKR integration to fetch historical data
      // This is a placeholder - in a real implementation, you'd use:
      // const data = await window.electronAPI?.downloadIBKRHistoricalData({ symbol, period: '1Y' });
      
      // For now, return mock data structure
      const mockData: PriceData[] = await this.fetchHistoricalDataFromSource(symbol);
      
      // Cache the data
      this.cacheHistoricalData(symbol, mockData);
      
      return mockData;
    } catch (error) {
      console.error(`Failed to fetch historical data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Placeholder for actual historical data fetching
   */
  private async fetchHistoricalDataFromSource(symbol: string): Promise<PriceData[]> {
    // TODO: Implement actual data fetching using IBKR or other API
    // This is a placeholder that returns empty array
    console.log(`Fetching historical data for ${symbol}...`);
    return [];
  }

  /**
   * Gets volatility regime for a symbol
   */
  private async getVolatilityRegime(symbol: string): Promise<string> {
    try {
      // Use existing MarketAnalysisService to get volatility regime
      // This would require price data conversion
      return VolatilityRegime.MEDIUM; // Default fallback
    } catch (error) {
      console.error(`Failed to get volatility regime for ${symbol}:`, error);
      return VolatilityRegime.UNKNOWN;
    }
  }

  /**
   * Assesses liquidity for a symbol
   */
  private assessLiquidity(symbol: string): 'high' | 'medium' | 'low' {
    // Simple heuristic based on symbol patterns
    // TODO: Implement proper liquidity assessment using volume data
    if (['SPY', 'QQQ', 'IWM', 'AAPL', 'MSFT', 'GOOGL', 'TSLA'].includes(symbol)) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * Cache management methods
   */
  private getCachedGapStatistics(symbol: string): GapStatistics | null {
    const cached = this.gapStatisticsCache.get(symbol);
    if (cached && cached.expiry > new Date()) {
      return cached.stats;
    }
    return null;
  }

  private cacheGapStatistics(symbol: string, stats: GapStatistics): void {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // Cache for 24 hours
    this.gapStatisticsCache.set(symbol, { stats, expiry });
  }

  private getCachedHistoricalData(symbol: string): PriceData[] | null {
    const cached = this.historicalDataCache.get(symbol);
    if (cached && cached.expiry > new Date()) {
      return cached.data;
    }
    return null;
  }

  private cacheHistoricalData(symbol: string, data: PriceData[]): void {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 12); // Cache for 12 hours
    this.historicalDataCache.set(symbol, { data, expiry });
  }

  /**
   * Public utility methods
   */
  public clearCache(): void {
    this.gapStatisticsCache.clear();
    this.historicalDataCache.clear();
  }

  public updateConfiguration(config: Partial<GapRiskConfiguration>): void {
    this.config = { ...this.config, ...config };
    // Clear cache when configuration changes
    this.clearCache();
  }
}

// Export a singleton instance
export const weekendGapRiskService = new WeekendGapRiskService();
export default weekendGapRiskService; 