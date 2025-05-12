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
  optionTrades?: OptionTrade[]; // This is for the internal format
  errors?: string[]; // Added back
  warnings?: string[]; // Added back
  cumulativePL?: number;
}

/**
 * Parse IBKR option symbol to extract details
 */
export function parseIBKROptionSymbol(symbol: string): {
  underlying: string;
  expiry: Date;
  strike: number;
  putCall: 'PUT' | 'CALL';
} | null {
  // Example: AAPL 230915C00150000
  // Format: SYMBOL YYMMDD[C/P]STRIKE
  const match = symbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  
  if (!match) {
    return null;
  }

  const [, underlying, dateStr, putCall, strikeStr] = match;
  
  // Parse date (YYMMDD)
  const year = parseInt(dateStr.substring(0, 2)) + 2000;
  const month = parseInt(dateStr.substring(2, 4)) - 1; // JS months are 0-based
  const day = parseInt(dateStr.substring(4, 6));
  
  // Parse strike (divide by 1000 as IBKR stores strikes with 3 decimal places)
  const strike = parseInt(strikeStr) / 1000;

  return {
    underlying,
    expiry: new Date(year, month, day),
    strike,
    putCall: putCall === 'C' ? 'CALL' : 'PUT'
  };
}

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