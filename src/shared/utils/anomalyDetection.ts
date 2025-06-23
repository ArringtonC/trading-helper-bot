import { NormalizedTradeData } from '../types/trade';

export function detectTradeAnomalies(trade: NormalizedTradeData): string[] {
  const warnings: string[] = [];
  // Extreme values
  if (Math.abs(trade.quantity) > 10000) warnings.push('Unusually large quantity');
  if (Math.abs(trade.tradePrice) > 10000) warnings.push('Unusually large trade price');
  if (Math.abs(trade.netAmount) > 1_000_000) warnings.push('Unusually large net amount');
  // Negative/zero checks
  if (trade.quantity === 0) warnings.push('Zero quantity');
  if (trade.tradePrice === 0) warnings.push('Zero trade price');
  if (trade.assetCategory !== 'CASH' && trade.netAmount === 0) warnings.push('Zero net amount for non-cash trade');
  // Date checks
  const today = new Date();
  const tradeDate = new Date(trade.tradeDate);
  if (tradeDate > today) warnings.push('Trade date is in the future');
  if (tradeDate.getFullYear() < 2000) warnings.push('Trade date is suspiciously old');
  // Commission/fee checks
  if (trade.commission && Math.abs(trade.commission) > Math.abs(trade.netAmount) * 0.5) warnings.push('Commission unusually high relative to net amount');
  // Add more rules as needed
  return warnings;
} 