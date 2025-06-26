/**
 * Trade Anomaly Detection Utilities
 * 
 * Simple anomaly detection functions for trade data validation
 */

import { NormalizedTradeData } from '../shared/types/trade';

/**
 * Detects potential anomalies in trade data
 * @param trade - The trade data to analyze
 * @returns Array of anomaly messages
 */
export function detectTradeAnomalies(trade: NormalizedTradeData): string[] {
  const anomalies: string[] = [];

  try {
    // Check for unrealistic trade prices
    if (trade.tradePrice && (trade.tradePrice <= 0 || trade.tradePrice > 10000)) {
      anomalies.push(`Unusual trade price: $${trade.tradePrice}`);
    }

    // Check for unrealistic quantities
    if (trade.quantity && Math.abs(trade.quantity) > 10000) {
      anomalies.push(`Unusual quantity: ${trade.quantity}`);
    }

    // Check for future trade dates
    if (trade.tradeDate) {
      const tradeDate = new Date(trade.tradeDate);
      const now = new Date();
      if (tradeDate > now) {
        anomalies.push(`Trade date is in the future: ${trade.tradeDate}`);
      }
    }

    // Check for very old trades (more than 10 years ago)
    if (trade.tradeDate) {
      const tradeDate = new Date(trade.tradeDate);
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      if (tradeDate < tenYearsAgo) {
        anomalies.push(`Very old trade date: ${trade.tradeDate}`);
      }
    }

    // Check for missing required fields
    if (!trade.symbol || trade.symbol.trim() === '') {
      anomalies.push('Missing or empty symbol');
    }

    // Check for unrealistic P&L values
    if (trade.realizedPnL && Math.abs(trade.realizedPnL) > 100000) {
      anomalies.push(`Unusual P&L amount: $${trade.realizedPnL}`);
    }

    // Check for invalid asset categories
    const validAssetCategories = ['STK', 'OPT', 'FUT', 'CASH', 'BOND', 'CRYPTO'];
    if (trade.assetCategory && !validAssetCategories.includes(trade.assetCategory)) {
      anomalies.push(`Unknown asset category: ${trade.assetCategory}`);
    }

  } catch (error) {
    anomalies.push(`Error during anomaly detection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return anomalies;
}

/**
 * Checks if a trade is potentially suspicious based on multiple factors
 * @param trade - The trade data to analyze
 * @returns Object with suspicion score and reasons
 */
export function analyzeTradeSuspicion(trade: NormalizedTradeData): {
  score: number;
  reasons: string[];
  isSuspicious: boolean;
} {
  const reasons: string[] = [];
  let score = 0;

  // High-value trades get attention
  if (trade.tradePrice && trade.tradePrice > 1000) {
    score += 1;
    reasons.push('High-value trade');
  }

  // Large quantities are suspicious
  if (trade.quantity && Math.abs(trade.quantity) > 1000) {
    score += 2;
    reasons.push('Large quantity');
  }

  // Weekend trades might be suspicious
  if (trade.tradeDate) {
    const tradeDate = new Date(trade.tradeDate);
    const dayOfWeek = tradeDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      score += 1;
      reasons.push('Weekend trade');
    }
  }

  return {
    score,
    reasons,
    isSuspicious: score >= 3
  };
}

/**
 * Validates trade data for completeness and consistency
 * @param trade - The trade data to validate
 * @returns Array of validation issues
 */
export function validateTradeData(trade: NormalizedTradeData): string[] {
  const issues: string[] = [];

  // Required field checks
  if (!trade.symbol) issues.push('Missing symbol');
  if (!trade.tradeDate) issues.push('Missing trade date');
  if (trade.quantity === undefined || trade.quantity === null) issues.push('Missing quantity');
  if (trade.tradePrice === undefined || trade.tradePrice === null) issues.push('Missing trade price');

  // Data type checks
  if (trade.quantity && typeof trade.quantity !== 'number') {
    issues.push('Quantity must be a number');
  }

  if (trade.tradePrice && typeof trade.tradePrice !== 'number') {
    issues.push('Trade price must be a number');
  }

  // Range checks
  if (trade.quantity && trade.quantity === 0) {
    issues.push('Quantity cannot be zero');
  }

  if (trade.tradePrice && trade.tradePrice < 0) {
    issues.push('Trade price cannot be negative');
  }

  return issues;
}