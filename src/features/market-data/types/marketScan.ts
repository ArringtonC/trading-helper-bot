/**
 * Type definitions for Weekly Market Scan Service
 * 
 * Comprehensive type definitions for the trading challenge platform's
 * market scanning automation service.
 */

// Re-export main types from service for convenience
export type {
  StrategyClass,
  ScanResult,
  WeeklyScanData,
  ScanConfiguration,
  ScanOperation
} from '../services/WeeklyMarketScanService';

// Additional utility types
export interface ScanResultSummary {
  totalResults: number;
  criticalAlerts: number;
  highConfidenceSetups: number;
  averageConfidenceScore: number;
  topSector: string;
  totalXPAvailable: number;
}

export interface ScanHistory {
  userId: string;
  scans: ScanHistoryEntry[];
  totalScansCompleted: number;
  averageResultsPerScan: number;
  favoriteStrategy: StrategyClass;
  totalXPEarned: number;
}

export interface ScanHistoryEntry {
  scanId: string;
  strategyClass: StrategyClass;
  scanDate: Date;
  resultsCount: number;
  confidenceScore: number;
  xpEarned: number;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
}

export interface ScanAlert {
  id: string;
  symbol: string;
  strategyClass: StrategyClass;
  alertLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  expiresAt: Date;
  acknowledged: boolean;
}

export interface ScanPerformanceMetrics {
  strategy: StrategyClass;
  totalScans: number;
  averageResultsPerScan: number;
  averageConfidenceScore: number;
  successRate: number;
  topPerformingSectors: string[];
  xpPerformance: {
    totalXPGenerated: number;
    averageXPPerScan: number;
    bonusXPEarned: number;
  };
}

export interface MarketScannerPreferences {
  userId: string;
  defaultStrategy: StrategyClass;
  enabledStrategies: StrategyClass[];
  alertThresholds: {
    minConfidenceScore: number;
    maxResultsPerScan: number;
    enableCriticalAlerts: boolean;
  };
  scanning: {
    enableAutomaticScanning: boolean;
    scanFrequency: 'DAILY' | 'WEEKLY' | 'CUSTOM';
    preferredScanTime: string; // HH:MM format
    enableWeekendScanning: boolean;
  };
  notifications: {
    enableScanComplete: boolean;
    enableCriticalAlerts: boolean;
    enableWeeklyDigest: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

// Strategy-specific interfaces
export interface BuffettGuardianCriteria {
  maxPE: number;
  minROE: number;
  maxDebtEquity: number;
  minDividendYield?: number;
  minMarketCap: number;
  preferredSectors: string[];
  requireProfitability: boolean;
  minCurrentRatio?: number;
}

export interface DalioWarriorCriteria {
  rsiRange: { min: number; max: number };
  momentumThreshold: number;
  volumeSurgeMultiplier: number;
  trendStrengthRequired: number;
  correlationFactors: string[];
  macroIndicators: string[];
}

export interface SorosAssassinCriteria {
  maxRSI: number;
  minVIXLevel: number;
  volatilityThreshold: number;
  contrarian: boolean;
  marketStressIndicators: string[];
  divergenceDetection: boolean;
  sentimentExtremes: boolean;
}

export interface LynchScoutCriteria {
  maxPEG: number;
  minEarningsGrowth: number;
  maxMarketCap: number;
  growthSectors: string[];
  institutionalOwnership?: { min: number; max: number };
  revenueGrowthRequired: boolean;
  insiderBuying?: boolean;
}

// Challenge integration types
export interface ScanXPReward {
  baseXP: number;
  confidenceBonus: number;
  alertLevelBonus: number;
  strategyBonus: number;
  streakMultiplier: number;
  totalXP: number;
}

export interface WeeklyScanChallenge {
  challengeId: string;
  userId: string;
  weekNumber: number;
  requiredScans: StrategyClass[];
  completedScans: StrategyClass[];
  targetOpportunities: number;
  foundOpportunities: number;
  xpReward: number;
  bonusXP: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  deadline: Date;
}

// Market data integration types
export interface MarketCondition {
  date: Date;
  vixLevel: number;
  marketTrend: 'BULL' | 'BEAR' | 'SIDEWAYS';
  volatilityRegime: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  economicPhase: 'EXPANSION' | 'CONTRACTION' | 'RECOVERY' | 'PEAK';
  sectorRotation: {
    leading: string[];
    lagging: string[];
  };
}

export interface ScanContext {
  marketCondition: MarketCondition;
  economicEvents: EconomicEvent[];
  sectorPerformance: SectorPerformance[];
  optionsFlow: OptionsFlowData[];
}

export interface EconomicEvent {
  date: Date;
  event: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'EARNINGS' | 'FED' | 'ECONOMIC_DATA' | 'GEOPOLITICAL';
  expected?: string;
  actual?: string;
  previous?: string;
}

export interface SectorPerformance {
  sector: string;
  performance1D: number;
  performance1W: number;
  performance1M: number;
  relativeStrength: number;
  momentum: 'STRONG_UP' | 'UP' | 'NEUTRAL' | 'DOWN' | 'STRONG_DOWN';
}

export interface OptionsFlowData {
  symbol: string;
  callPutRatio: number;
  unusualActivity: boolean;
  impliedVolatility: number;
  impliedMove: number;
  flowSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

// Export utilities and constants
export const STRATEGY_DISPLAY_NAMES: Record<StrategyClass, string> = {
  'BUFFETT_GUARDIAN': 'Buffett Guardian (Value)',
  'DALIO_WARRIOR': 'Dalio Warrior (Momentum)', 
  'SOROS_ASSASSIN': 'Soros Assassin (Contrarian)',
  'LYNCH_SCOUT': 'Lynch Scout (Growth)'
};

export const CONFIDENCE_SCORE_RANGES = {
  CRITICAL: { min: 90, max: 100 },
  HIGH: { min: 75, max: 89 },
  MEDIUM: { min: 60, max: 74 },
  LOW: { min: 0, max: 59 }
};

export const XP_MULTIPLIERS = {
  SETUP_QUALITY: {
    'A+': 2.0,
    'A': 1.5,
    'B': 1.2,
    'C': 1.0
  },
  ALERT_LEVEL: {
    'CRITICAL': 2.0,
    'HIGH': 1.5,
    'MEDIUM': 1.2,
    'LOW': 1.0
  },
  STRATEGY_BONUS: {
    'BUFFETT_GUARDIAN': 1.1,
    'DALIO_WARRIOR': 1.2,
    'SOROS_ASSASSIN': 1.3,
    'LYNCH_SCOUT': 1.1
  }
};

// Default configurations
export const DEFAULT_SCAN_CONFIG: ScanConfiguration = {
  buffettGuardian: {
    maxPE: 15,
    minROE: 15,
    maxDebtEquity: 0.5,
    minMarketCap: 1000000000,
    sectors: ['Utilities', 'Consumer Staples', 'Healthcare', 'Financials']
  },
  dalioWarrior: {
    rsiMin: 40,
    rsiMax: 60,
    minMomentum: 5,
    minVolumeSurge: 1.5,
    trendStrength: 0.7
  },
  sorosAssassin: {
    maxRSI: 30,
    minVIXLevel: 20,
    volatilityThreshold: 25,
    contrarian: true
  },
  lynchScout: {
    maxPEG: 1.0,
    minEarningsGrowth: 20,
    maxMarketCap: 10000000000,
    growthSectors: ['Technology', 'Healthcare', 'Consumer Discretionary', 'Communication Services']
  },
  maxResultsPerStrategy: 10,
  minConfidenceScore: 60,
  enableWeekendScanning: true,
  sundayScheduleEnabled: true
};

// Mock data for testing
export const MOCK_SCAN_RESULTS: ScanResult[] = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    price: 175.25,
    marketCap: 2800000000000,
    sector: 'Technology',
    industry: 'Consumer Electronics',
    pe: 28.5,
    roe: 26.4,
    debtToEquity: 0.31,
    rsi: 52.1,
    priceChange1D: 1.2,
    priceChange1W: 3.5,
    priceChange1M: 8.7,
    volume: 45000000,
    volumeAvg: 38000000,
    peg: 1.8,
    earningsGrowth: 15.2,
    revenueGrowth: 12.4,
    volatility: 22.3,
    strategyClass: 'BUFFETT_GUARDIAN',
    confidenceScore: 78,
    reasoning: [
      'Strong ROE (26.4%) shows profitable business',
      'Conservative debt levels (0.31) reduce risk',
      'Large cap stability ($2.8T market cap)'
    ],
    alertLevel: 'HIGH',
    xpReward: 35,
    setupQuality: 'B',
    scanDate: new Date(),
    lastUpdated: new Date()
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    price: 242.75,
    marketCap: 770000000000,
    sector: 'Consumer Discretionary',
    industry: 'Auto Manufacturers',
    pe: 65.2,
    roe: 12.8,
    debtToEquity: 0.17,
    rsi: 68.3,
    priceChange1D: -2.1,
    priceChange1W: 5.8,
    priceChange1M: 15.2,
    volume: 85000000,
    volumeAvg: 62000000,
    peg: 2.1,
    earningsGrowth: 31.2,
    revenueGrowth: 28.7,
    volatility: 35.6,
    strategyClass: 'LYNCH_SCOUT',
    confidenceScore: 82,
    reasoning: [
      'Strong earnings growth (31.2%) drives value',
      'High-growth sector (Consumer Discretionary) with expansion potential',
      'Volume surge (137% of average)'
    ],
    alertLevel: 'HIGH',
    xpReward: 40,
    setupQuality: 'A',
    scanDate: new Date(),
    lastUpdated: new Date()
  }
];

export const MOCK_WEEKLY_SCAN_DATA: WeeklyScanData = {
  userId: 'user-001',
  scanDate: new Date(),
  strategyClass: 'BUFFETT_GUARDIAN',
  totalStocksScanned: 847,
  qualifyingStocks: 12,
  scanResults: MOCK_SCAN_RESULTS,
  overallMarketSentiment: 'BULLISH',
  topOpportunities: MOCK_SCAN_RESULTS.slice(0, 5),
  weeklyTheme: 'Defensive Value Week: Quality at a Discount',
  economicFactors: [
    'Fed policy dovish stance continues',
    'Inflation trending lower month-over-month',
    'Employment remains strong',
    'Consumer spending resilient'
  ],
  recommendedActions: [
    '⭐ 2 high-confidence setups identified',
    '📋 Review top 3 opportunities for position sizing',
    '🎯 Set alerts for price/volume confirmations',
    '💰 Focus on dividend yield and balance sheet strength'
  ],
  totalXPReward: 150,
  weeklyBonus: 75,
  streakMultiplier: 1.2
};