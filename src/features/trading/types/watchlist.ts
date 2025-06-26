/**
 * AutoWatchlistBuilder Types
 * 
 * Type definitions for the intelligent watchlist generation system
 */

export interface WatchlistStock {
  id: string;
  symbol: string;
  companyName: string;
  price: number;
  marketCap: number;
  sector: string;
  volatility: number;
  confidenceScore: number;
  setupQuality: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  traderSignals: string[];
  technicalScore: number;
  fundamentalScore: number;
  momentum: number;
  correlationGroup?: string;
  positionSize?: number;
  shareQuantity?: number;
  stopLoss?: number;
  target?: number;
  riskAmount?: number;
}

export interface WatchlistMetrics {
  expectedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  diversificationScore: number;
  totalRisk: number;
  sectorBalance: number;
}

export interface OptimizationSettings {
  maxStocks: number;
  maxPerSector: number;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  stressLevel: number;
  preferredSectors: string[];
  avoidSectors: string[];
  minMarketCap: number;
  maxVolatility: number;
  correlationThreshold: number;
}