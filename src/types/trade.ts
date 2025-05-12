export enum BrokerType { // Re-exporting for convenience if used with NormalizedTradeData
  IBKR = 'IBKR',
  Schwab = 'Schwab',
  Unknown = 'Unknown',
}

export type AssetCategory = 'STK' | 'OPT' | 'FUT' | 'CASH' | 'FX' | 'BOND' | 'Unknown';
export type OpenCloseIndicator = 'O' | 'C' | 'N/A'; // N/A for transactions not directly opening/closing a position
export type PutCall = 'P' | 'C' | 'N/A';

export interface NormalizedTradeData {
  id: string; // Unique ID for the trade row, can be generated (e.g., UUID)
  importTimestamp: string; // ISO timestamp of when this record was imported/created
  broker: BrokerType;
  accountId?: string; // Optional: if available in the CSV
  tradeDate: string; // YYYY-MM-DD format
  settleDate?: string; // YYYY-MM-DD format, optional
  symbol: string; // Underlying or security symbol
  dateTime?: string; // Optional: combined date and time (for brokers that provide it)
  description?: string; // Full description of the security
  assetCategory: AssetCategory;
  action?: string; // Original action from CSV (e.g., BUY, SELL, ASSIGN, EXPIRE)
  quantity: number; // Positive for buys, negative for sells/assignments
  tradePrice: number;
  currency: string;
  
  // Financials - ensure consistency (e.g., all negative for debits, positive for credits, or use netAmount)
  proceeds?: number | null; // Total money received (for sells)
  cost?: number | null; // Total money paid (for buys, excluding commissions/fees)
  commission?: number | null; // Should be negative or positive consistently (e.g. always positive, subtract from net)
  fees?: number | null; // Should be negative or positive consistently (e.g. always positive, subtract from net)
  netAmount: number; // Net cash change for the transaction (proceeds - cost - commissions - fees)

  openCloseIndicator?: OpenCloseIndicator;
  costBasis?: number | null; // Cost basis of the shares/contracts for this specific lot/trade, if available
  
  // Option specifics
  optionSymbol?: string; // Full option contract symbol if different from 'symbol'
  expiryDate?: string; // YYYY-MM-DD for options
  strikePrice?: number | null;
  putCall?: PutCall;
  multiplier?: number; // e.g., 100 for standard US equity options

  // Linkage & Identifiers
  orderID?: string;
  executionID?: string;
  notes?: string;

  // Raw row data from CSV for debugging or reprocessing if needed
  rawCsvRow?: Record<string, string>;
  rawRealizedPL?: number; // Include raw Realized P/L for debugging
} 