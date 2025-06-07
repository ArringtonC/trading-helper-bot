import { OptionTrade, OptionStrategy } from './options';

/**
 * Represents a position imported from IBKR
 */
export interface IBKRPosition {
  symbol: string;
  quantity: number;
  marketPrice: number; // Close price from IBKR
  marketValue: number;
  averageCost: number; // Cost price from IBKR
  unrealizedPL: number;
  realizedPL: number;
  assetType: 'STOCK' | 'OPTION';
  currency: string;
  accountId: string; // Added to link position to account
  lastUpdated: Date;
  // Optional fields derived from symbol or Instrument Info
  putCall?: 'PUT' | 'CALL';
  strike?: number;
  expiry?: Date;
  multiplier?: number; // Typically 100 for options
  costBasis?: number; // Needed by parser
  commission?: number; // Needed by conversion
}

/**
 * Represents an account imported from IBKR (matching parser output)
 */
export interface IBKRAccount {
  accountId: string;
  accountName: string;
  accountType: string;
  baseCurrency: string;
  balance: number;
  marketValue?: number;
  lastUpdated?: Date;
}

/**
 * Represents a trade record from IBKR CSV
 */
export interface IBKRTradeRecord {
  symbol: string;
  dateTime: string;
  quantity: number;
  tradePrice: number;
  commissionFee: number;
  assetCategory: string;
  description: string;
  code: string;
  realizedPL: number;
  mtmPL: number;
  tradePL: number;
  // New fields from CSV for better financial calculation
  currency?: string; 
  ibkrAccountId?: string; // Renamed from accountId to avoid conflict with NormalizedTradeData.accountId
  csvProceeds?: number;
  csvBasis?: number;
  // Fields for parsed option details
  openDate?: Date;
  closeDate?: Date;
  // Add other potential fields from IBKR trade logs
  closePrice?: number;
  proceeds?: number;
  basis?: number;
  unrealizedPL?: number;
  totalPL?: number;
  cumulativePL?: number;
  // Add option-specific fields
  putCall?: 'PUT' | 'CALL';
  strike?: number;
  expiry?: Date;
}

/**
 * Represents instrument details from IBKR CSV
 */
export interface IBKRInstrumentInfo {
  symbol: string;
  putCall: 'PUT' | 'CALL';
  strike: number;
  expiry: Date;
  description?: string;
  assetCategory?: string;
  underlying?: string;
  multiplier?: number;
}

/**
 * Represents the overall result of parsing an IBKR statement
 */
export interface IBKRImportResult {
  success: boolean;
  error?: string;
  accountId?: string;
  accountName?: string;
  totalTrades?: number;
  newTrades?: number;
  updatedTrades?: number;
  positions?: IBKRPosition[] | number; // Allow both array and number
  debugLogs?: string[];
  account?: IBKRAccount;
  trades?: IBKRTradeRecord[];
  optionTrades?: OptionTrade[]; // Changed from IBKRTradeRecord[] to OptionTrade[]
  errors?: string[]; // Added back
  warnings?: string[]; // Added back
  cumulativePL?: number;
}

/**
 * Parse IBKR option symbol to extract details
 */
export const parseIBKROptionSymbol = (symbol: string): { underlying: string, expiry: Date, strike: number, putCall: 'PUT' | 'CALL' } | null => {
  // New Regex for format like: AAPL 28MAR25 222.5 C
  // Or: SPY 21MAR25 560 P
  const match = symbol.match(/^([A-Z0-9\.^]+)\s+(\d{2})([A-Z]{3})(\d{2})\s+([0-9.]+)\s+([CP])$/i);

  if (!match) {
    console.warn(`[parseIBKROptionSymbol] No match for symbol: ${symbol}`);
    return null;
  }

  const [, underlying, dayStr, monthNameStr, yearStr, strikeStr, pc] = match;
  
  const monthMap: { [key: string]: number } = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
  };

  const year = 2000 + parseInt(yearStr, 10);
  const month = monthMap[monthNameStr.toUpperCase()];
  const day = parseInt(dayStr, 10);
  const strike = parseFloat(strikeStr);
  const putCall = pc.toUpperCase() === 'C' ? 'CALL' : 'PUT';

  if (month === undefined) {
    console.warn(`[parseIBKROptionSymbol] Invalid month: ${monthNameStr} in symbol: ${symbol}`);
    return null;
  }

  const expiry = new Date(Date.UTC(year, month, day));
  if (isNaN(expiry.getTime())) {
    console.warn(`[parseIBKROptionSymbol] Invalid date computed for symbol: ${symbol} (Y:${year} M:${month} D:${day})`);
    return null;
  }

  return { underlying, expiry, strike, putCall };
};

/**
 * Convert IBKR position to internal option trade
 */
export function convertIBKRPositionToTrade(
  position: IBKRPosition,
  accountId: string
): OptionTrade | null {
  if (position.assetType !== 'OPTION' || !position.strike || !position.expiry) {
    return null;
  }

  const optionDetails = parseIBKROptionSymbol(position.symbol);
  if (!optionDetails) {
    return null;
  }

  // Calculate total P&L
  const totalPL = position.realizedPL + position.unrealizedPL;

  return {
    id: `${position.symbol}-${Date.now()}`,
    symbol: optionDetails.underlying,
    putCall: optionDetails.putCall,
    strike: optionDetails.strike,
    expiry: optionDetails.expiry,
    quantity: position.quantity,
    premium: position.marketPrice,
    openDate: position.lastUpdated,
    strategy: determineOptionStrategy(position),
    commission: 0, // IBKR commission would be in a separate transaction
    realizedPL: position.realizedPL,
    unrealizedPL: position.unrealizedPL,
    mtmPL: position.unrealizedPL, // Use unrealizedPL as mtmPL for positions
    notes: [
      `Imported from IBKR - ${position.symbol}`,
      `Market Price: $${position.marketPrice.toFixed(2)}`,
      `Market Value: $${position.marketValue.toFixed(2)}`,
      `Average Cost: $${position.averageCost.toFixed(2)}`,
      `Realized P&L: $${position.realizedPL.toFixed(2)}`,
      `Unrealized P&L: $${position.unrealizedPL.toFixed(2)}`,
      `Total P&L: $${totalPL.toFixed(2)}`,
      `Last Updated: ${position.lastUpdated.toLocaleString()}`
    ].join('\n')
  };
}

/**
 * Determine option strategy based on position details
 */
function determineOptionStrategy(position: IBKRPosition): OptionStrategy {
  if (!position.putCall) {
    return OptionStrategy.OTHER;
  }

  return position.quantity > 0
    ? position.putCall === 'CALL'
      ? OptionStrategy.LONG_CALL
      : OptionStrategy.LONG_PUT
    : position.putCall === 'CALL'
      ? OptionStrategy.SHORT_CALL
      : OptionStrategy.SHORT_PUT;
} 