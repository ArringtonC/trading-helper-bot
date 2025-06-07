/**
 * Types for Weekend Gap Risk Analysis
 * 
 * This module defines the data structures used for analyzing 
 * weekend price gaps and their associated risks.
 */

export interface PriceData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GapEvent {
  date: Date;
  gapSize: number; // Percentage gap (positive for up gaps, negative for down gaps)
  gapSizeAbsolute: number; // Price difference in absolute terms
  fridayClose: number;
  mondayOpen: number;
  symbol: string;
  magnitude: GapMagnitude;
}

export enum GapMagnitude {
  SMALL = 'small',     // 0-1%
  MEDIUM = 'medium',   // 1-3%
  LARGE = 'large',     // 3-5%
  EXTREME = 'extreme'  // 5%+
}

export enum GapDirection {
  UP = 'up',
  DOWN = 'down',
  NEUTRAL = 'neutral'
}

export interface GapStatistics {
  symbol: string;
  timeframe: number; // Number of days of historical data used
  totalGaps: number;
  
  // Frequency analysis
  frequency: {
    total: number; // Total gaps per year
    byMagnitude: {
      [GapMagnitude.SMALL]: number;
      [GapMagnitude.MEDIUM]: number;
      [GapMagnitude.LARGE]: number;
      [GapMagnitude.EXTREME]: number;
    };
    byDirection: {
      [GapDirection.UP]: number;
      [GapDirection.DOWN]: number;
      [GapDirection.NEUTRAL]: number;
    };
  };
  
  // Statistical measures
  statistics: {
    meanGapSize: number;
    medianGapSize: number;
    standardDeviation: number;
    maxUpGap: number;
    maxDownGap: number;
    percentiles: {
      p10: number;
      p25: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
  
  // Risk metrics
  riskMetrics: {
    probabilityOfGap: number; // Percentage probability of any gap occurring
    averageGapMagnitude: number;
    worstCaseScenario: {
      upGap: number;
      downGap: number;
    };
    valueAtRisk: {
      var95: number; // 95% VaR
      var99: number; // 99% VaR
    };
  };
  
  calculatedAt: Date;
}

export interface PositionGapRisk {
  positionId: string;
  symbol: string;
  positionSize: number;
  positionValue: number;
  currentPrice: number;
  
  // Gap risk assessment
  gapRisk: {
    riskScore: number; // 0-100 scale
    probabilityOfLoss: number;
    expectedLoss: number;
    maximumLoss: number;
    
    // Scenario analysis
    scenarios: {
      [GapMagnitude.SMALL]: {
        probability: number;
        potentialLoss: number;
      };
      [GapMagnitude.MEDIUM]: {
        probability: number;
        potentialLoss: number;
      };
      [GapMagnitude.LARGE]: {
        probability: number;
        potentialLoss: number;
      };
      [GapMagnitude.EXTREME]: {
        probability: number;
        potentialLoss: number;
      };
    };
  };
  
  // Risk factors
  riskFactors: {
    volatilityRegime: string; // From MarketAnalysisService
    liquidity: 'high' | 'medium' | 'low';
    earnings: boolean; // Is earnings announcement imminent?
    events: string[]; // Known events that could cause gaps
  };
  
  calculatedAt: Date;
}

export interface WeekendGapAnalysis {
  portfolioId: string;
  totalExposure: number;
  totalRisk: number;
  riskScore: number; // Overall portfolio gap risk score
  
  // Position-level analysis
  positions: PositionGapRisk[];
  
  // Portfolio-level metrics
  portfolioMetrics: {
    concentrationRisk: number;
    correlationRisk: number;
    diversificationBenefit: number;
    netExposure: number;
  };
  
  // Recommendations
  recommendations: {
    action: 'hold' | 'reduce' | 'hedge' | 'close';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    hedgingOptions?: string[];
  }[];
  
  calculatedAt: Date;
}

export interface GapRiskConfiguration {
  // Historical data parameters
  historicalPeriod: number; // Days of historical data to analyze
  minimumGapThreshold: number; // Minimum gap size to consider (percentage)
  
  // Risk calculation parameters
  riskFreeRate: number;
  confidenceLevel: number; // For VaR calculations (0.95 or 0.99)
  
  // Categorization thresholds
  gapThresholds: {
    [GapMagnitude.SMALL]: [number, number]; // [min, max] percentage
    [GapMagnitude.MEDIUM]: [number, number];
    [GapMagnitude.LARGE]: [number, number];
    [GapMagnitude.EXTREME]: [number, number];
  };
}

export interface GapRiskServiceResult {
  success: boolean;
  data?: WeekendGapAnalysis | GapStatistics | PositionGapRisk;
  error?: string;
  timestamp: Date;
}

// Default configuration
export const DEFAULT_GAP_RISK_CONFIG: GapRiskConfiguration = {
  historicalPeriod: 252, // 1 year of trading days
  minimumGapThreshold: 0.005, // 0.5%
  riskFreeRate: 0.03, // 3%
  confidenceLevel: 0.95,
  gapThresholds: {
    [GapMagnitude.SMALL]: [0.005, 0.01],   // 0.5% - 1%
    [GapMagnitude.MEDIUM]: [0.01, 0.03],   // 1% - 3%
    [GapMagnitude.LARGE]: [0.03, 0.05],    // 3% - 5%
    [GapMagnitude.EXTREME]: [0.05, 1.0],   // 5%+
  },
}; 