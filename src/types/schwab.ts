export type OrderType = "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT" | "TRAILING_STOP" | "CABINET" | "NON_MARKETABLE" | "MARKET_ON_CLOSE" | "EXERCISE" | "TRAILING_STOP_LIMIT" | "NET_DEBIT" | "NET_CREDIT" | "NET_ZERO" | "LIMIT_ON_CLOSE";
export type SessionType = "NORMAL" | "AM" | "PM" | "SEAMLESS";
export type DurationType = "DAY" | "GOOD_TILL_CANCEL" | "FILL_OR_KILL" | "IMMEDIATE_OR_CANCEL" | "END_OF_WEEK" | "END_OF_MONTH" | "NEXT_END_OF_MONTH" | "UNKNOWN";
export type OrderStrategyType = "SINGLE" | "CANCEL" | "RECALL" | "PAIR" | "FLATTEN" | "TWO_DAY_SWAP" | "BLAST_ALL" | "OCO" | "TRIGGER";
export type ComplexOrderStrategyType = "NONE" | "COVERED" | "VERTICAL" | "BACK_RATIO" | "CALENDAR" | "DIAGONAL" | "STRADDLE" | "STRANGLE" | "COLLAR_SYNTHETIC" | "BUTTERFLY" | "CONDOR" | "IRON_CONDOR" | "VERTICAL_ROLL" | "COLLAR_WITH_STOCK" | "DOUBLE_DIAGONAL" | "UNBALANCED_BUTTERFLY" | "UNBALANCED_CONDOR" | "UNBALANCED_IRON_CONDOR" | "UNBALANCED_VERTICAL_ROLL" | "MUTUAL_FUND_SWAP" | "CUSTOM";
export type InstructionType = "BUY" | "SELL" | "BUY_TO_COVER" | "SELL_SHORT" | "BUY_TO_OPEN" | "BUY_TO_CLOSE" | "SELL_TO_OPEN" | "SELL_TO_CLOSE" | "EXCHANGE" | "SELL_SHORT_EXEMPT";
export type AssetType = "EQUITY" | "OPTION";

export interface Instrument {
    symbol: string;
    assetType: AssetType;
}

export interface OrderLeg {
    instruction: InstructionType;
    quantity: number;
    instrument: Instrument;
}

export interface OrderRequest { // Renamed from Order in orderhelp.d.ts
    orderType: OrderType;
    session: SessionType;
    duration: DurationType;
    orderStrategyType: OrderStrategyType;
    complexOrderStrategyType?: ComplexOrderStrategyType;
    quantity?: number;
    price?: string;
    orderLegCollection: OrderLeg[];
    childOrderStrategies?: OrderRequest[]; // Self-reference adjusted
}

// Copied from SchwabService.ts
export interface Position {
  accountHash: string; // This might not be part of the API response for a position, but useful if we aggregate
  symbol: string;
  longQuantity: number;
  shortQuantity: number;
  averagePrice: number;
  marketValue: number;
  // Add other relevant fields based on Schwab API documentation for positions
}

// Account interface
export interface Account {
  hashValue: string;         // Schwab's hashed account identifier
  accountNumber: string;     // The actual Schwab account number (masked or full)
  isPrimary?: boolean;       // Optional: true if this is the primary account
  accountType?: string;      // Optional: e.g., 'INDIVIDUAL', 'JOINT', etc.
  displayName?: string;      // Optional: user-friendly account name
}

// Quote interface
export interface Quote {
  symbol: string;            // Ticker symbol, e.g., 'AAPL'
  bidPrice: number;          // Current bid price
  askPrice: number;          // Current ask price
  lastPrice: number;         // Last traded price
  mark?: number;             // Mark price (midpoint or calculated)
  bidSize?: number;          // Optional: bid size
  askSize?: number;          // Optional: ask size
  totalVolume?: number;      // Optional: total volume traded
  quoteTimeInLong?: number;  // Optional: quote timestamp (epoch ms)
  [key: string]: any;        // To allow for additional Schwab fields
}

// Transaction interface
export interface Transaction {
  transactionId: string;     // Unique identifier for the transaction
  type: string;              // e.g., 'BUY', 'SELL', 'DIVIDEND', etc.
  settlementDate: string;    // ISO date string, e.g., '2025-05-19'
  amount: number;            // Transaction amount (positive/negative)
  description?: string;      // Optional: human-readable description
  symbol?: string;           // Optional: security symbol involved
  quantity?: number;         // Optional: number of shares/contracts
  price?: number;            // Optional: price per share/contract
}

// OrderResponse interface
export interface OrderResponse {
  orderId: string;           // Schwab's order identifier
  status: string;            // e.g., 'PENDING', 'FILLED', 'CANCELED'
  filledQuantity?: number;   // Optional: how much was filled
  remainingQuantity?: number;// Optional: how much remains
  averagePrice?: number;     // Optional: average fill price
  submittedAt?: string;      // Optional: ISO timestamp for submission
  [key: string]: any;        // To allow for additional Schwab fields
}

// Credentials to be passed to the service
export interface SchwabServiceCredentials {
  appKey: string;
  appSecret: string;
  refreshToken: string; 
}

// Params for getAccountTransactions, matching transactByAcct more closely
// This is for internal use in SchwabService.ts, based on the library's d.ts
export interface SchwabTransactionApiParams {
  accountHash: string;
  types: string;      // e.g., 'ALL', 'BUY', 'SELL', 'DIVIDEND'
  startDate: string;  // e.g., 'YYYY-MM-DD'
  endDate: string;    // e.g., 'YYYY-MM-DD'
  symbol?: string | null;
} 
 
 
 
 
 