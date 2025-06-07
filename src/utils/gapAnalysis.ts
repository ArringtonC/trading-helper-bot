/**
 * Gap Analysis Utility Functions
 * 
 * This module provides statistical and analytical functions for 
 * weekend gap risk analysis.
 */

import { 
  PriceData, 
  GapEvent, 
  GapMagnitude, 
  GapDirection, 
  GapStatistics,
  GapRiskConfiguration,
  DEFAULT_GAP_RISK_CONFIG
} from '../types/gapRisk';

/**
 * Detects weekend gaps from historical price data
 * @param priceData Historical OHLCV data sorted by date
 * @param symbol Stock symbol for the data
 * @param config Configuration for gap detection
 * @returns Array of detected gap events
 */
export function detectWeekendGaps(
  priceData: PriceData[], 
  symbol: string,
  config: GapRiskConfiguration = DEFAULT_GAP_RISK_CONFIG
): GapEvent[] {
  const gaps: GapEvent[] = [];
  
  if (priceData.length < 2) {
    return gaps;
  }

  for (let i = 1; i < priceData.length; i++) {
    const currentDay = priceData[i];
    const previousDay = priceData[i - 1];
    
    // Check if this is a weekend gap (Monday after Friday)
    const currentDate = new Date(currentDay.date);
    const previousDate = new Date(previousDay.date);
    
    // Calculate day difference to detect weekend gaps
    const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Weekend gap: Friday to Monday (3 days) or longer (holidays)
    if (dayDiff >= 3) {
      const fridayClose = previousDay.close;
      const mondayOpen = currentDay.open;
      
      // Calculate gap size as percentage
      const gapSize = (mondayOpen - fridayClose) / fridayClose;
      const gapSizeAbsolute = mondayOpen - fridayClose;
      
      // Only include gaps above minimum threshold
      if (Math.abs(gapSize) >= config.minimumGapThreshold) {
        const magnitude = categorizeGapMagnitude(Math.abs(gapSize), config);
        
        gaps.push({
          date: currentDate,
          gapSize,
          gapSizeAbsolute,
          fridayClose,
          mondayOpen,
          symbol,
          magnitude
        });
      }
    }
  }
  
  return gaps;
}

/**
 * Categorizes gap magnitude based on configuration thresholds
 */
export function categorizeGapMagnitude(
  gapSizeAbs: number, 
  config: GapRiskConfiguration = DEFAULT_GAP_RISK_CONFIG
): GapMagnitude {
  const thresholds = config.gapThresholds;
  
  if (gapSizeAbs >= thresholds[GapMagnitude.EXTREME][0]) {
    return GapMagnitude.EXTREME;
  } else if (gapSizeAbs >= thresholds[GapMagnitude.LARGE][0]) {
    return GapMagnitude.LARGE;
  } else if (gapSizeAbs >= thresholds[GapMagnitude.MEDIUM][0]) {
    return GapMagnitude.MEDIUM;
  } else {
    return GapMagnitude.SMALL;
  }
}

/**
 * Determines gap direction
 */
export function getGapDirection(gapSize: number): GapDirection {
  if (gapSize > 0.001) {
    return GapDirection.UP;
  } else if (gapSize < -0.001) {
    return GapDirection.DOWN;
  } else {
    return GapDirection.NEUTRAL;
  }
}

/**
 * Calculates comprehensive gap statistics from detected gaps
 */
export function calculateGapStatistics(
  gaps: GapEvent[],
  symbol: string,
  timeframe: number,
  config: GapRiskConfiguration = DEFAULT_GAP_RISK_CONFIG
): GapStatistics {
  if (gaps.length === 0) {
    return createEmptyGapStatistics(symbol, timeframe);
  }

  const gapSizes = gaps.map(g => g.gapSize);
  const absoluteGapSizes = gapSizes.map(Math.abs);
  
  // Calculate frequency analysis
  const frequency = calculateGapFrequency(gaps, timeframe);
  
  // Calculate statistical measures
  const statistics = calculateGapStatisticalMeasures(gapSizes);
  
  // Calculate risk metrics
  const riskMetrics = calculateGapRiskMetrics(gaps, gapSizes, config);
  
  return {
    symbol,
    timeframe,
    totalGaps: gaps.length,
    frequency,
    statistics,
    riskMetrics,
    calculatedAt: new Date()
  };
}

/**
 * Calculates gap frequency analysis
 */
function calculateGapFrequency(gaps: GapEvent[], timeframe: number) {
  const yearFactor = 252 / timeframe; // Convert to annual frequency
  
  // Count by magnitude
  const magnitudeCounts = {
    [GapMagnitude.SMALL]: 0,
    [GapMagnitude.MEDIUM]: 0,
    [GapMagnitude.LARGE]: 0,
    [GapMagnitude.EXTREME]: 0,
  };
  
  // Count by direction
  const directionCounts = {
    [GapDirection.UP]: 0,
    [GapDirection.DOWN]: 0,
    [GapDirection.NEUTRAL]: 0,
  };
  
  gaps.forEach(gap => {
    magnitudeCounts[gap.magnitude]++;
    directionCounts[getGapDirection(gap.gapSize)]++;
  });
  
  return {
    total: gaps.length * yearFactor,
    byMagnitude: {
      [GapMagnitude.SMALL]: magnitudeCounts[GapMagnitude.SMALL] * yearFactor,
      [GapMagnitude.MEDIUM]: magnitudeCounts[GapMagnitude.MEDIUM] * yearFactor,
      [GapMagnitude.LARGE]: magnitudeCounts[GapMagnitude.LARGE] * yearFactor,
      [GapMagnitude.EXTREME]: magnitudeCounts[GapMagnitude.EXTREME] * yearFactor,
    },
    byDirection: {
      [GapDirection.UP]: directionCounts[GapDirection.UP] * yearFactor,
      [GapDirection.DOWN]: directionCounts[GapDirection.DOWN] * yearFactor,
      [GapDirection.NEUTRAL]: directionCounts[GapDirection.NEUTRAL] * yearFactor,
    }
  };
}

/**
 * Calculates statistical measures for gap sizes
 */
function calculateGapStatisticalMeasures(gapSizes: number[]) {
  const sortedGaps = [...gapSizes].sort((a, b) => a - b);
  const upGaps = gapSizes.filter(g => g > 0);
  const downGaps = gapSizes.filter(g => g < 0);
  
  return {
    meanGapSize: calculateMean(gapSizes),
    medianGapSize: calculateMedian(sortedGaps),
    standardDeviation: calculateStandardDeviation(gapSizes),
    maxUpGap: upGaps.length > 0 ? Math.max(...upGaps) : 0,
    maxDownGap: downGaps.length > 0 ? Math.min(...downGaps) : 0,
    percentiles: {
      p10: calculatePercentile(sortedGaps, 0.10),
      p25: calculatePercentile(sortedGaps, 0.25),
      p75: calculatePercentile(sortedGaps, 0.75),
      p90: calculatePercentile(sortedGaps, 0.90),
      p95: calculatePercentile(sortedGaps, 0.95),
      p99: calculatePercentile(sortedGaps, 0.99),
    }
  };
}

/**
 * Calculates risk metrics from gap data
 */
function calculateGapRiskMetrics(
  gaps: GapEvent[], 
  gapSizes: number[],
  config: GapRiskConfiguration
) {
  const totalPeriods = Math.floor(config.historicalPeriod / 7); // Number of weeks
  const probabilityOfGap = gaps.length / totalPeriods;
  
  const absoluteGapSizes = gapSizes.map(Math.abs);
  const averageGapMagnitude = absoluteGapSizes.length > 0 
    ? calculateMean(absoluteGapSizes) 
    : 0;
  
  const upGaps = gapSizes.filter(g => g > 0);
  const downGaps = gapSizes.filter(g => g < 0);
  
  const sortedGaps = [...gapSizes].sort((a, b) => a - b);
  
  return {
    probabilityOfGap,
    averageGapMagnitude,
    worstCaseScenario: {
      upGap: upGaps.length > 0 ? Math.max(...upGaps) : 0,
      downGap: downGaps.length > 0 ? Math.min(...downGaps) : 0,
    },
    valueAtRisk: {
      var95: calculatePercentile(sortedGaps, 0.05), // 5th percentile for downside risk
      var99: calculatePercentile(sortedGaps, 0.01), // 1st percentile for extreme downside risk
    }
  };
}

/**
 * Statistical utility functions
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function calculateMedian(sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0;
  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 === 0
    ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
    : sortedValues[mid];
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = calculateMean(squaredDiffs);
  return Math.sqrt(avgSquaredDiff);
}

export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = percentile * (sortedValues.length - 1);
  
  if (Number.isInteger(index)) {
    return sortedValues[index];
  } else {
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const weight = index - lowerIndex;
    return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
  }
}

/**
 * Creates an empty gap statistics object for symbols with no gaps
 */
function createEmptyGapStatistics(symbol: string, timeframe: number): GapStatistics {
  return {
    symbol,
    timeframe,
    totalGaps: 0,
    frequency: {
      total: 0,
      byMagnitude: {
        [GapMagnitude.SMALL]: 0,
        [GapMagnitude.MEDIUM]: 0,
        [GapMagnitude.LARGE]: 0,
        [GapMagnitude.EXTREME]: 0,
      },
      byDirection: {
        [GapDirection.UP]: 0,
        [GapDirection.DOWN]: 0,
        [GapDirection.NEUTRAL]: 0,
      }
    },
    statistics: {
      meanGapSize: 0,
      medianGapSize: 0,
      standardDeviation: 0,
      maxUpGap: 0,
      maxDownGap: 0,
      percentiles: {
        p10: 0,
        p25: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      }
    },
    riskMetrics: {
      probabilityOfGap: 0,
      averageGapMagnitude: 0,
      worstCaseScenario: {
        upGap: 0,
        downGap: 0,
      },
      valueAtRisk: {
        var95: 0,
        var99: 0,
      }
    },
    calculatedAt: new Date()
  };
}

/**
 * Validates price data for gap analysis
 */
export function validatePriceData(priceData: PriceData[]): boolean {
  if (!Array.isArray(priceData) || priceData.length === 0) {
    return false;
  }

  return priceData.every(data => {
    return data.date instanceof Date &&
           typeof data.open === 'number' && data.open > 0 &&
           typeof data.high === 'number' && data.high > 0 &&
           typeof data.low === 'number' && data.low > 0 &&
           typeof data.close === 'number' && data.close > 0 &&
           typeof data.volume === 'number' && data.volume >= 0 &&
           data.high >= data.low &&
           data.high >= data.open &&
           data.high >= data.close &&
           data.low <= data.open &&
           data.low <= data.close;
  });
} 