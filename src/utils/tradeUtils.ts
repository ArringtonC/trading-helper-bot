import { OptionTrade } from '../types/options';

export const calculateTradePL = (trade: OptionTrade): number => {
  if (!trade.closeDate) {
    return 0;
  }
  
  // For imported trades, use the realizedPL from notes if available
  if (trade.notes && trade.notes.includes('Realized P&L:')) {
    const plMatch = trade.notes.match(/Realized P&L: \$([\d.]+)/);
    if (plMatch && plMatch[1]) {
      return parseFloat(plMatch[1]);
    }
  }
  
  // For manually closed trades, calculate based on premium difference
  if (trade.closePremium !== undefined) {
    const premiumDiff = trade.closePremium - trade.premium;
    const totalPL = premiumDiff * trade.quantity;
    return totalPL - (trade.commission || 0);
  }
  
  // Default calculation based on premium difference
  const premiumDiff = (trade.closePremium || 0) - (trade.premium || 0);
  const totalPL = premiumDiff * (trade.quantity || 0);
  return totalPL - (trade.commission || 0);
}; 