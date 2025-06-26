/**
 * Multi-Indicator Volatility Calculation Engine
 * 
 * Provides modular calculation services for:
 * - IV Percentile with historical range analysis
 * - ATR (Average True Range) with configurable periods
 * - Bollinger Bands with adjustable standard deviation
 * - VIX correlation analysis
 * 
 * Features:
 * - Efficient caching mechanism for performance
 * - Real-time and historical data processing
 * - Industry-standard calculation formulas
 * - Error handling for data interruptions
 * - Extensible design for future indicators
 */

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface VolatilityData {
  date: string;
  impliedVolatility: number;
  historicalVolatility: number;
  symbol: string;
}

export interface IVPercentileResult {
  current: number;
  percentile: number;
  historicalRange: {
    min: number;
    max: number;
    mean: number;
  };
  zone: 'low' | 'medium' | 'high' | 'extreme';
}

export interface ATRResult {
  value: number;
  period: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  historicalComparison: number; // Percentage compared to 30-day average
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  position: number; // Where current price sits within bands (0-1)
  squeeze: boolean; // True if bands are contracting
}

export interface VIXCorrelationResult {
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  historicalAverage: number;
}

export interface VolatilityCalculationResult {
  symbol: string;
  timestamp: string;
  ivPercentile: IVPercentileResult;
  atr: ATRResult;
  bollingerBands: BollingerBandsResult;
  vixCorrelation: VIXCorrelationResult;
  marketRegime: 'low-vol' | 'normal' | 'high-vol' | 'crisis';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class VolatilityCalculationEngine {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Clear all cached calculations
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Store result in cache
   */
  private setCachedResult<T>(key: string, data: T, ttl = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Calculate IV Percentile with historical context
   */
  public calculateIVPercentile(
    currentIV: number,
    historicalIVData: VolatilityData[],
    lookbackDays = 252
  ): IVPercentileResult {
    const cacheKey = `iv_percentile_${currentIV}_${lookbackDays}_${historicalIVData.length}`;
    const cached = this.getCachedResult<IVPercentileResult>(cacheKey);
    if (cached) return cached;

    // Use the most recent lookbackDays of data
    const recentData = historicalIVData.slice(-lookbackDays);
    const ivValues = recentData.map(d => d.impliedVolatility).filter(iv => iv > 0);

    if (ivValues.length === 0) {
      throw new Error('No valid IV data available for calculation');
    }

    // Calculate percentile
    const sortedIVs = [...ivValues].sort((a, b) => a - b);
    const belowCurrent = sortedIVs.filter(iv => iv <= currentIV).length;
    const percentile = (belowCurrent / sortedIVs.length) * 100;

    // Calculate historical range
    const min = Math.min(...ivValues);
    const max = Math.max(...ivValues);
    const mean = ivValues.reduce((sum, iv) => sum + iv, 0) / ivValues.length;

    // Determine volatility zone
    let zone: 'low' | 'medium' | 'high' | 'extreme';
    if (percentile <= 20) zone = 'low';
    else if (percentile <= 50) zone = 'medium';
    else if (percentile <= 80) zone = 'high';
    else zone = 'extreme';

    const result: IVPercentileResult = {
      current: currentIV,
      percentile,
      historicalRange: { min, max, mean },
      zone
    };

    this.setCachedResult(cacheKey, result);
    return result;
  }

  /**
   * Calculate Average True Range (ATR)
   */
  public calculateATR(priceData: PriceData[], period = 14): ATRResult {
    const cacheKey = `atr_${period}_${priceData.length}_${priceData[priceData.length - 1]?.date}`;
    const cached = this.getCachedResult<ATRResult>(cacheKey);
    if (cached) return cached;

    if (priceData.length < period + 1) {
      throw new Error(`Insufficient data for ATR calculation. Need at least ${period + 1} periods.`);
    }

    // Calculate True Range for each period
    const trueRanges: number[] = [];
    
    for (let i = 1; i < priceData.length; i++) {
      const current = priceData[i];
      const previous = priceData[i - 1];
      
      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    if (trueRanges.length < period) {
      throw new Error('Insufficient true range data for ATR calculation');
    }

    // Calculate ATR using Simple Moving Average for initial value
    let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;

    // Use Wilder's smoothing for subsequent values
    for (let i = period; i < trueRanges.length; i++) {
      atr = ((atr * (period - 1)) + trueRanges[i]) / period;
    }

    // Calculate trend and historical comparison
    const recentATRs = trueRanges.slice(-30).map((_, idx, arr) => {
      const startIdx = Math.max(0, arr.length - 30 + idx - period + 1);
      const subset = arr.slice(startIdx, arr.length - 30 + idx + 1);
      return subset.reduce((sum, tr) => sum + tr, 0) / Math.min(subset.length, period);
    });

    const avgATR = recentATRs.reduce((sum, a) => sum + a, 0) / recentATRs.length;
    const trend = atr > avgATR * 1.05 ? 'increasing' : 
                  atr < avgATR * 0.95 ? 'decreasing' : 'stable';
    
    const historicalComparison = ((atr - avgATR) / avgATR) * 100;

    const result: ATRResult = {
      value: atr,
      period,
      trend,
      historicalComparison
    };

    this.setCachedResult(cacheKey, result);
    return result;
  }

  /**
   * Calculate Bollinger Bands
   */
  public calculateBollingerBands(
    priceData: PriceData[], 
    period = 20, 
    standardDeviations = 2
  ): BollingerBandsResult {
    const cacheKey = `bb_${period}_${standardDeviations}_${priceData.length}_${priceData[priceData.length - 1]?.date}`;
    const cached = this.getCachedResult<BollingerBandsResult>(cacheKey);
    if (cached) return cached;

    if (priceData.length < period) {
      throw new Error(`Insufficient data for Bollinger Bands. Need at least ${period} periods.`);
    }

    // Get the most recent data
    const recentData = priceData.slice(-period);
    const closePrices = recentData.map(d => d.close);

    // Calculate Simple Moving Average (middle band)
    const sma = closePrices.reduce((sum, price) => sum + price, 0) / period;

    // Calculate standard deviation
    const variance = closePrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    // Calculate bands
    const upper = sma + (standardDeviations * stdDev);
    const lower = sma - (standardDeviations * stdDev);
    const middle = sma;

    // Calculate bandwidth (volatility measure)
    const bandwidth = ((upper - lower) / middle) * 100;

    // Calculate current price position within bands
    const currentPrice = priceData[priceData.length - 1].close;
    let position: number;
    if (upper === lower) {
      position = 0.5;
    } else {
      position = (currentPrice - lower) / (upper - lower);
    }
    position = Math.max(0, Math.min(1, position));

    // Detect squeeze (bands contracting)
    const previousPeriodData = priceData.slice(-period * 2, -period);
    let previousBandwidth = 0;
    
    if (previousPeriodData.length >= period) {
      const prevClosePrices = previousPeriodData.slice(-period).map(d => d.close);
      const prevSMA = prevClosePrices.reduce((sum, price) => sum + price, 0) / period;
      const prevVariance = prevClosePrices.reduce((sum, price) => sum + Math.pow(price - prevSMA, 2), 0) / period;
      const prevStdDev = Math.sqrt(prevVariance);
      const prevUpper = prevSMA + (standardDeviations * prevStdDev);
      const prevLower = prevSMA - (standardDeviations * prevStdDev);
      previousBandwidth = ((prevUpper - prevLower) / prevSMA) * 100;
    }

    const squeeze = previousBandwidth > 0 && bandwidth < previousBandwidth * 0.9;

    const result: BollingerBandsResult = {
      upper,
      middle,
      lower,
      bandwidth,
      position,
      squeeze
    };

    this.setCachedResult(cacheKey, result);
    return result;
  }

  /**
   * Calculate VIX correlation
   */
  public calculateVIXCorrelation(
    securityPrices: PriceData[],
    vixData: PriceData[],
    lookbackPeriod = 30
  ): VIXCorrelationResult {
    const cacheKey = `vix_corr_${lookbackPeriod}_${securityPrices.length}_${vixData.length}`;
    const cached = this.getCachedResult<VIXCorrelationResult>(cacheKey);
    if (cached) return cached;

    if (securityPrices.length < lookbackPeriod || vixData.length < lookbackPeriod) {
      throw new Error('Insufficient data for VIX correlation calculation');
    }

    // Calculate daily returns for both security and VIX
    const securityReturns = this.calculateDailyReturns(securityPrices.slice(-lookbackPeriod));
    const vixReturns = this.calculateDailyReturns(vixData.slice(-lookbackPeriod));

    // Align data by dates (in case of missing data)
    const alignedData = this.alignDataByDate(securityReturns, vixReturns);
    
    if (alignedData.length < 10) {
      throw new Error('Insufficient aligned data for correlation calculation');
    }

    // Calculate Pearson correlation coefficient
    const correlation = this.calculateCorrelation(
      alignedData.map(d => d.security),
      alignedData.map(d => d.vix)
    );

    // Determine correlation strength and direction
    const absCorr = Math.abs(correlation);
    const strength = absCorr >= 0.7 ? 'strong' : absCorr >= 0.3 ? 'moderate' : 'weak';
    const direction = correlation >= 0 ? 'positive' : 'negative';

    // Calculate historical average (simplified - would need more historical data in real implementation)
    const historicalAverage = -0.3; // Typical negative correlation between stocks and VIX

    const result: VIXCorrelationResult = {
      correlation,
      strength,
      direction,
      historicalAverage
    };

    this.setCachedResult(cacheKey, result);
    return result;
  }

  /**
   * Comprehensive volatility analysis
   */
  public calculateComprehensiveVolatility(
    symbol: string,
    priceData: PriceData[],
    volatilityData: VolatilityData[],
    vixData: PriceData[],
    currentIV: number
  ): VolatilityCalculationResult {
    const ivPercentile = this.calculateIVPercentile(currentIV, volatilityData);
    const atr = this.calculateATR(priceData);
    const bollingerBands = this.calculateBollingerBands(priceData);
    const vixCorrelation = this.calculateVIXCorrelation(priceData, vixData);

    // Determine market regime based on multiple indicators
    let marketRegime: 'low-vol' | 'normal' | 'high-vol' | 'crisis';
    
    if (ivPercentile.zone === 'extreme' && bollingerBands.bandwidth > 30) {
      marketRegime = 'crisis';
    } else if (ivPercentile.zone === 'high' || bollingerBands.bandwidth > 20) {
      marketRegime = 'high-vol';
    } else if (ivPercentile.zone === 'low' && bollingerBands.bandwidth < 10) {
      marketRegime = 'low-vol';
    } else {
      marketRegime = 'normal';
    }

    return {
      symbol,
      timestamp: new Date().toISOString(),
      ivPercentile,
      atr,
      bollingerBands,
      vixCorrelation,
      marketRegime
    };
  }

  /**
   * Calculate daily returns from price data
   */
  private calculateDailyReturns(priceData: PriceData[]): Array<{date: string, return: number}> {
    const returns = [];
    for (let i = 1; i < priceData.length; i++) {
      const currentPrice = priceData[i].close;
      const previousPrice = priceData[i - 1].close;
      const dailyReturn = (currentPrice - previousPrice) / previousPrice;
      returns.push({
        date: priceData[i].date,
        return: dailyReturn
      });
    }
    return returns;
  }

  /**
   * Align two return series by date
   */
  private alignDataByDate(
    securityReturns: Array<{date: string, return: number}>,
    vixReturns: Array<{date: string, return: number}>
  ): Array<{date: string, security: number, vix: number}> {
    const securityMap = new Map(securityReturns.map(d => [d.date, d.return]));
    const aligned = [];

    for (const vixReturn of vixReturns) {
      const securityReturn = securityMap.get(vixReturn.date);
      if (securityReturn !== undefined) {
        aligned.push({
          date: vixReturn.date,
          security: securityReturn,
          vix: vixReturn.return
        });
      }
    }

    return aligned;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Arrays must have the same non-zero length');
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    if (denominator === 0) return 0;
    
    return numerator / denominator;
  }

  /**
   * Get calculation engine statistics
   */
  public getStats(): {
    cacheSize: number;
    cacheHitRate: number;
    lastCalculation: string | null;
  } {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: 0, // Would need to track hits/misses for real implementation
      lastCalculation: null // Would track last calculation timestamp
    };
  }
}

export default VolatilityCalculationEngine; 