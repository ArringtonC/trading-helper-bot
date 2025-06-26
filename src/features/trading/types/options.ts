/**
 * Options Trading Types
 * Legacy type definitions for options trading components
 */

export interface OptionContract {
  id: string;
  symbol: string;
  strike: number;
  expiry: Date;
  type: 'call' | 'put';
  premium: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionPosition {
  id: string;
  contract: OptionContract;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  openDate: Date;
  status: 'open' | 'closed' | 'expired';
}

export interface OptionTrade {
  id: string;
  optionPosition: OptionPosition;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: Date;
  fees: number;
}

export enum OptionStrategy {
  LONG_CALL = 'LONG_CALL',
  LONG_PUT = 'LONG_PUT',
  SHORT_CALL = 'SHORT_CALL',
  SHORT_PUT = 'SHORT_PUT',
  COVERED_CALL = 'COVERED_CALL',
  PROTECTIVE_PUT = 'PROTECTIVE_PUT',
  BULL_CALL_SPREAD = 'BULL_CALL_SPREAD',
  BEAR_PUT_SPREAD = 'BEAR_PUT_SPREAD',
  IRON_CONDOR = 'IRON_CONDOR',
  STRADDLE = 'STRADDLE',
  STRANGLE = 'STRANGLE'
}

export interface OptionStrategyDetails {
  id: string;
  name: string;
  description: string;
  legs: OptionContract[];
  maxRisk: number;
  maxProfit: number;
  breakeven: number[];
  complexity: 'low' | 'medium' | 'high';
  marketOutlook: 'bullish' | 'bearish' | 'neutral';
}

export type OptionType = 'call' | 'put';
export type OptionAction = 'buy' | 'sell';
export type PositionStatus = 'open' | 'closed' | 'expired';