import { NormalizedTradeData } from '../../types/trade';
import { FeatureDefinition } from '../types';
import { RSI, MACD, BollingerBands } from 'technicalindicators';
import { AnalyticsDataService } from '../../services/AnalyticsDataService';
import { VolatilityRegime, calculateCurrentVolatilityRegime } from '../../services/MarketAnalysisService';

/**
 * Calculates the duration of a trade in days.
 * Returns null if open/close dates are missing.
 */
export function tradeDuration(trade: NormalizedTradeData): number | null {
  const openDate = trade.tradeDate;
  const closeDate = trade.expiryDate || trade.settleDate || trade.tradeDate;
  if (!openDate || !closeDate) return null;
  const days = (new Date(closeDate).getTime() - new Date(openDate).getTime()) / (1000 * 60 * 60 * 24);
  return Math.round(days);
}

export const tradeDurationFeature: FeatureDefinition = {
  name: 'tradeDuration',
  description: 'Duration of the trade in days',
  calculate: (trade) => tradeDuration(trade),
};

/**
 * Computes the net P&L for a trade using netAmount.
 */
export function tradePL(trade: NormalizedTradeData): number {
  return trade.netAmount;
}

export const tradePLFeature: FeatureDefinition = {
  name: 'tradePL',
  description: 'Net profit and loss for the trade (netAmount field)',
  calculate: (trade) => tradePL(trade),
};

// Helper to get price history for a symbol from all trades
function getPriceHistory(allTrades: NormalizedTradeData[], symbol: string): number[] {
  return allTrades
    .filter(t => t.symbol === symbol && typeof t.tradePrice === 'number')
    .sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime())
    .map(t => t.tradePrice);
}

// RSI Feature
export const rsiFeature: FeatureDefinition = {
  name: 'rsi',
  description: 'Relative Strength Index (14-period) for the trade symbol',
  calculate: (trade, allTrades) => {
    const prices = getPriceHistory(allTrades, trade.symbol);
    if (prices.length < 14) return null;
    const rsi = RSI.calculate({ values: prices, period: 14 });
    if (rsi.length === 0 || rsi[rsi.length - 1] == null) return null;
    return rsi[rsi.length - 1] !== undefined ? rsi[rsi.length - 1] : null;
  },
};

// MACD Feature
export const macdFeature: FeatureDefinition = {
  name: 'macd',
  description: 'MACD (12,26,9) for the trade symbol',
  calculate: (trade, allTrades) => {
    const prices = getPriceHistory(allTrades, trade.symbol);
    if (prices.length < 26) return null;
    const macd = MACD.calculate({ values: prices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
    if (macd.length === 0 || macd[macd.length - 1].MACD == null) return null;
    return macd[macd.length - 1].MACD !== undefined ? macd[macd.length - 1].MACD as number : null;
  },
};

// Bollinger Bands Feature
export const bollingerFeature: FeatureDefinition = {
  name: 'bollingerUpper',
  description: 'Bollinger Bands Upper (20, 2) for the trade symbol',
  calculate: (trade, allTrades) => {
    const prices = getPriceHistory(allTrades, trade.symbol);
    if (prices.length < 20) return null;
    const bands = BollingerBands.calculate({ period: 20, stdDev: 2, values: prices });
    return bands.length > 0 && bands[bands.length - 1].upper != null ? bands[bands.length - 1].upper : null;
  },
};

/**
 * Calculates the consecutive win or loss streak for a trade based on netAmount.
 * Looks at previous trades for the same symbol.
 * Returns a positive number for a win streak, negative for a loss streak, and 0 otherwise.
 */
function calculateStreak(trade: NormalizedTradeData, allTrades: NormalizedTradeData[]): number {
  const symbolTrades = allTrades
    .filter(t => t.symbol === trade.symbol && t.tradeDate)
    .sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());

  const tradeIndex = symbolTrades.findIndex(t => t.id === trade.id);
  if (tradeIndex === -1) return 0; // Should not happen if trade is in allTrades

  let streak = 0;
  const currentTradePL = trade.netAmount;

  if (currentTradePL > 0) {
    // Check for win streak
    streak = 1; // Current trade is a win
    for (let i = tradeIndex - 1; i >= 0; i--) {
      if (symbolTrades[i].netAmount > 0) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
  } else if (currentTradePL < 0) {
    // Check for loss streak
    streak = -1; // Current trade is a loss
    for (let i = tradeIndex - 1; i >= 0; i--) {
      if (symbolTrades[i].netAmount < 0) {
        streak--;
      } else {
        break; // Streak broken
      }
    }
  }

  return streak;
}

export const streakFeature: FeatureDefinition = {
  name: 'streak',
  description: 'Consecutive win or loss streak for the trade symbol',
  calculate: (trade, allTrades) => calculateStreak(trade, allTrades),
};

// Instantiate the data service (could be done elsewhere and injected if preferred)
const analyticsDataService = new AnalyticsDataService();

// Market Regime Feature
export const marketRegimeFeature: FeatureDefinition = {
  name: 'marketRegime',
  description: 'Current market volatility regime (Low, Medium, High) for the trade symbol',
  calculate: async (trade: NormalizedTradeData, allTrades: NormalizedTradeData[]): Promise<VolatilityRegime | null> => {
    // Note: This feature requires async operation to fetch historical data.
    // The current batch processing might need adjustment to handle async features efficiently.
    // For now, fetching all trades for the symbol. This might be inefficient for large datasets.
    // A more optimized approach would be to pre-calculate market regimes or fetch only necessary data.

    // TODO: Optimize data fetching for market regime calculation
    const symbolTrades = await analyticsDataService.getTradesBySymbol(trade.symbol);

    // Need to format data for calculateCurrentVolatilityRegime { date: Date; price: number; }
    const priceData = symbolTrades
      .filter(t => t.tradeDate && typeof t.tradePrice === 'number')
      .map(t => ({ date: new Date(t.tradeDate), price: t.tradePrice }));

    if (priceData.length === 0) return VolatilityRegime.UNKNOWN;

    // Calculate regime (using default config for now)
    const regime = calculateCurrentVolatilityRegime(priceData);

    return regime;
  },
}; 