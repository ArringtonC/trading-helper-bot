import { OptionTrade, OptionStrategy } from './options';

/**
 * Represents a position imported from IBKR
 */
export interface IBKRPosition {
  symbol: string;
  quantity: number;
  marketPrice: number;
  marketValue: number;
  averageCost: number;
  unrealizedPL: number;
  realizedPL: number;
  strike?: number;
  expiry?: Date;
  putCall?: 'PUT' | 'CALL';
  assetType: 'STOCK' | 'OPTION' | 'FUTURE' | 'OTHER';
  currency: string;
  accountId: string;
  lastUpdated: Date;
}

/**
 * Represents an account imported from IBKR
 */
export interface IBKRAccount {
  id: string;
  name: string;
  type: 'CASH' | 'MARGIN';
  currency: string;
  balance: number;
  cash: number;
  marketValue: number;
  positions: IBKRPosition[];
  lastUpdated: Date;
}

export interface IBKRImportResult {
  account: IBKRAccount;
  positions: IBKRPosition[];
  errors: string[];
  warnings: string[];
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
    notes: `Imported from IBKR - ${position.symbol}`
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