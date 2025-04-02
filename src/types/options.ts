/**
 * Represents an options trading strategy
 */
export enum OptionStrategy {
  LONG_CALL = 'LONG_CALL',
  SHORT_CALL = 'SHORT_CALL',
  LONG_PUT = 'LONG_PUT',
  SHORT_PUT = 'SHORT_PUT',
  CALL_SPREAD = 'CALL_SPREAD',
  PUT_SPREAD = 'PUT_SPREAD',
  IRON_CONDOR = 'IRON_CONDOR',
  BUTTERFLY = 'BUTTERFLY',
  OTHER = 'OTHER'
}

/**
 * Represents an options trade
 */
export interface OptionTrade {
  id: string;
  symbol: string;
  putCall: 'PUT' | 'CALL';
  strike: number;
  expiry: Date;
  quantity: number;
  premium: number;
  openDate: Date;
  closeDate?: Date;
  closePremium?: number;
  strategy: OptionStrategy;
  commission?: number;
  notes?: string;
}

/**
 * Collection of option trades for an account
 */
export interface OptionsPortfolio {
  id: string;
  accountId: string;
  trades: OptionTrade[];
}

/**
 * Summary statistics for an options portfolio
 */
export interface OptionPortfolioStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  totalPL: number;
  averageDaysToExpiry: number;
}

/**
 * Calculate the multiplier for an option contract
 * Default is 100 shares per contract for equity options
 */
export function getContractMultiplier(trade: OptionTrade): number {
  // Standard options contract is 100 shares
  return 100;
}

/**
 * Calculate the profit/loss for a trade
 */
export function calculateTradePL(trade: OptionTrade): number {
  if (!trade.closeDate || !trade.closePremium) {
    return 0; // Trade is still open
  }

  const multiplier = 100; // Standard options contract multiplier
  const totalCost = trade.premium * trade.quantity * multiplier;
  const totalProceeds = trade.closePremium * trade.quantity * multiplier;
  const commission = trade.commission || 0;

  // For long positions: P&L = (Close Premium - Open Premium) * Quantity * Multiplier - Commission
  // For short positions: P&L = (Open Premium - Close Premium) * Quantity * Multiplier - Commission
  return trade.quantity > 0
    ? totalProceeds - totalCost - commission
    : totalCost - totalProceeds - commission;
}

/**
 * Check if an option is expired
 */
export function isExpired(trade: OptionTrade): boolean {
  return daysUntilExpiration(trade) <= 0;
}

/**
 * Calculate days until expiration
 */
export function daysUntilExpiration(trade: OptionTrade): number {
  const today = new Date();
  const expiry = new Date(trade.expiry);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
} 