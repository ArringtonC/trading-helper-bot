import { v4 as uuidv4 } from 'uuid';

export function mapToDatabaseTrade(trade: any) {
  // Use the pre-calculated realizedPL from parser
  const realizedPL = trade.realizedPL ?? 0;
  
  // For now, unrealizedPL is 0 since we're dealing with closed trades
  const unrealizedPL = 0;
  
  // Total trade P&L is the sum of realized and unrealized
  const tradePL = realizedPL + unrealizedPL;

  return {
    id: uuidv4(),
    symbol: trade.symbol ?? '',
    dateTime: trade.dateTime ?? '',
    quantity: trade.quantity ?? 0,
    price: trade.price ?? 0,
    proceeds: trade.proceeds ?? 0,
    basis: trade.basis ?? 0,
    commissionFee: trade.commissionFee ?? 0,
    positionAfter: trade.positionAfter ?? 0,
    isClose: trade.isClose ?? false,
    realizedPL,
    unrealizedPL,
    tradePL
  };
}

// Helper function to calculate total P&L (only from closing trades)
export function calculateTotalPL(trades: ReturnType<typeof mapToDatabaseTrade>[]): number {
  return trades.reduce(
    (acc, t) => acc + (t.isClose ? t.realizedPL : 0),
    0
  );
} 