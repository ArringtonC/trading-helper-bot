import { getTrades } from './DatabaseService';

interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  tradePrice: number;
  netAmount: number;
  openCloseIndicator?: string;
  tradeDate: string;
  assetCategory: string;
  commission?: number | null;
  fees?: number | null;
  optionSymbol?: string;
  expiryDate?: string;
  strikePrice?: number | null;
  putCall?: string;
  broker: string;
}

interface AggregatedPosition {
  id: number;
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  marketValue: number;
  costBasis: number;
  gainDollar: number;
  gainPercent: number;
  date?: string;
  type?: 'stock' | 'option' | 'future';
  status?: 'open' | 'closed';
  broker?: string;
  lastTradeDate?: string;
  totalCommission?: number;
  totalFees?: number;
}

export class PositionAggregationService {
  /**
   * Aggregate all trades into current positions
   */
  static async aggregatePositions(): Promise<AggregatedPosition[]> {
    const trades = await getTrades();
    console.log(`[PositionAggregation] Processing ${trades.length} trades`);

    // Group trades by symbol
    const tradesBySymbol = new Map<string, Trade[]>();
    
    trades.forEach(trade => {
      const symbol = trade.symbol;
      if (!tradesBySymbol.has(symbol)) {
        tradesBySymbol.set(symbol, []);
      }
      tradesBySymbol.get(symbol)!.push(trade as Trade);
    });

    const positions: AggregatedPosition[] = [];
    let positionId = 1;

    // Process each symbol - use Array.from for Map iteration
    for (const [symbol, symbolTrades] of Array.from(tradesBySymbol.entries())) {
      const position = this.calculatePositionFromTrades(symbol, symbolTrades, positionId++);
      
      // Only include positions with non-zero quantity or realized P&L
      if (position.quantity !== 0 || position.gainDollar !== 0) {
        positions.push(position);
      }
    }

    console.log(`[PositionAggregation] Generated ${positions.length} positions`);
    return positions.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  /**
   * Calculate position metrics from trades for a single symbol
   */
  private static calculatePositionFromTrades(symbol: string, trades: Trade[], id: number): AggregatedPosition {
    let netQuantity = 0;
    let totalCost = 0;
    let totalCommission = 0;
    let totalFees = 0;
    let realizedPnL = 0;
    let lastTradeDate = '';
    let assetType: 'stock' | 'option' | 'future' = 'stock';
    let broker = '';
    let description = '';

    // Sort trades by date
    const sortedTrades = trades.sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());

    // Track FIFO cost basis for realized P&L calculation
    const openPositions: Array<{ quantity: number; price: number; cost: number }> = [];

    sortedTrades.forEach(trade => {
      const quantity = Number(trade.quantity);
      const price = Number(trade.tradePrice);
      const commission = Number(trade.commission || 0);
      const fees = Number(trade.fees || 0);

      // Update metadata
      lastTradeDate = trade.tradeDate;
      broker = trade.broker;
      totalCommission += commission;
      totalFees += fees;

      // Determine asset type
      if (trade.assetCategory?.toLowerCase().includes('option') || trade.optionSymbol) {
        assetType = 'option';
        // For options, create a more descriptive name
        if (trade.optionSymbol || (trade.strikePrice && trade.putCall && trade.expiryDate)) {
          const strike = trade.strikePrice ? `$${trade.strikePrice}` : '';
          const type = trade.putCall || '';
          const expiry = trade.expiryDate ? new Date(trade.expiryDate).toLocaleDateString() : '';
          description = `${symbol} ${strike} ${type} ${expiry}`.trim();
        } else {
          description = `${symbol} Option`;
        }
      } else if (trade.assetCategory?.toLowerCase().includes('future')) {
        assetType = 'future';
        description = `${symbol} Future`;
      } else {
        description = symbol;
      }

      // Calculate position changes
      if (quantity > 0) {
        // Buy trade - add to position
        netQuantity += quantity;
        const tradeCost = Math.abs(trade.netAmount) + commission + fees;
        totalCost += tradeCost;
        
        // Add to open positions for FIFO tracking
        openPositions.push({
          quantity: quantity,
          price: price,
          cost: tradeCost
        });
      } else if (quantity < 0) {
        // Sell trade - reduce position and calculate realized P&L
        let remainingToSell = Math.abs(quantity);
        netQuantity += quantity; // quantity is negative
        
        const saleProceeds = Math.abs(trade.netAmount) - commission - fees;
        let saleCostBasis = 0;

        // Calculate cost basis using FIFO
        while (remainingToSell > 0 && openPositions.length > 0) {
          const oldestPosition = openPositions[0];
          
          if (oldestPosition.quantity <= remainingToSell) {
            // Sell entire oldest position
            saleCostBasis += oldestPosition.cost;
            remainingToSell -= oldestPosition.quantity;
            totalCost -= oldestPosition.cost;
            openPositions.shift();
          } else {
            // Partial sale of oldest position
            const partialCost = (oldestPosition.cost / oldestPosition.quantity) * remainingToSell;
            saleCostBasis += partialCost;
            totalCost -= partialCost;
            oldestPosition.quantity -= remainingToSell;
            oldestPosition.cost -= partialCost;
            remainingToSell = 0;
          }
        }

        // Calculate realized P&L for this trade
        realizedPnL += saleProceeds - saleCostBasis;
      }
    });

    // Calculate current position metrics
    const avgPrice = netQuantity !== 0 ? totalCost / Math.abs(netQuantity) : 0;
    const currentPrice = sortedTrades.length > 0 ? Number(sortedTrades[sortedTrades.length - 1].tradePrice) : avgPrice;
    const marketValue = netQuantity * currentPrice;
    const unrealizedPnL = marketValue - totalCost;
    const totalPnL = realizedPnL + (netQuantity !== 0 ? unrealizedPnL : 0);
    const totalPnLPercent = totalCost !== 0 ? (totalPnL / Math.abs(totalCost)) * 100 : 0;

    // Determine status
    const status: 'open' | 'closed' = netQuantity !== 0 ? 'open' : 'closed';

    return {
      id,
      symbol,
      description,
      quantity: netQuantity,
      price: currentPrice,
      marketValue: Math.abs(marketValue),
      costBasis: Math.abs(totalCost),
      gainDollar: totalPnL,
      gainPercent: totalPnLPercent,
      date: lastTradeDate,
      type: assetType,
      status,
      broker,
      lastTradeDate,
      totalCommission,
      totalFees
    };
  }

  /**
   * Get summary statistics for all positions
   */
  static async getPositionSummary() {
    const positions = await this.aggregatePositions();
    
    const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const totalCostBasis = positions.reduce((sum, pos) => sum + pos.costBasis, 0);
    const totalGainLoss = positions.reduce((sum, pos) => sum + pos.gainDollar, 0);
    const totalCommissions = positions.reduce((sum, pos) => sum + (pos.totalCommission || 0), 0);
    const totalFees = positions.reduce((sum, pos) => sum + (pos.totalFees || 0), 0);
    
    const openPositions = positions.filter(p => p.status === 'open');
    const closedPositions = positions.filter(p => p.status === 'closed');
    
    const winningPositions = positions.filter(p => p.gainDollar > 0);
    const losingPositions = positions.filter(p => p.gainDollar < 0);
    
    const winRate = positions.length > 0 ? (winningPositions.length / positions.length) * 100 : 0;

    return {
      totalPositions: positions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalMarketValue,
      totalCostBasis,
      totalGainLoss,
      totalGainLossPercent: totalCostBasis !== 0 ? (totalGainLoss / totalCostBasis) * 100 : 0,
      totalCommissions,
      totalFees,
      winRate,
      winningPositions: winningPositions.length,
      losingPositions: losingPositions.length,
      avgWin: winningPositions.length > 0 ? winningPositions.reduce((sum, p) => sum + p.gainDollar, 0) / winningPositions.length : 0,
      avgLoss: losingPositions.length > 0 ? losingPositions.reduce((sum, p) => sum + p.gainDollar, 0) / losingPositions.length : 0,
    };
  }
} 
 
 
 