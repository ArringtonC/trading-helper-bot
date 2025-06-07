export interface Lot { 
  qty: number; 
  cost: number; 
  date: string; 
}

export interface Trade { 
  qty: number; 
  price: number; 
  date: string; 
}

export interface Position { 
  realised: number; 
  remaining: number; 
  averageCost: number;
  lots: Lot[];
}

export function fifoLots(trades: Trade[]): Position {
  /** FIFO cost-basis calc handling partial fills */
  const lots: Lot[] = [];
  let realised = 0;

  trades.forEach(trade => {
    if (trade.qty > 0) {
      // Opening trade - add to lots
      lots.push({ 
        qty: trade.qty, 
        cost: trade.price, 
        date: trade.date 
      });
    } else {
      // Closing trade - consume lots FIFO
      let qtyToClose = -trade.qty;
      
      while (qtyToClose > 0 && lots.length > 0) {
        const lot = lots[0];
        const qtyTaken = Math.min(qtyToClose, lot.qty);
        
        // Calculate realized P&L
        realised += qtyTaken * (trade.price - lot.cost);
        
        // Update lot and remaining quantity
        lot.qty -= qtyTaken;
        qtyToClose -= qtyTaken;
        
        // Remove lot if fully consumed
        if (lot.qty === 0) {
          lots.shift();
        }
      }
    }
  });

  // Calculate remaining position metrics
  const totalQty = lots.reduce((sum, lot) => sum + lot.qty, 0);
  const totalCost = lots.reduce((sum, lot) => sum + (lot.qty * lot.cost), 0);
  const averageCost = totalQty > 0 ? totalCost / totalQty : 0;

  return { 
    realised, 
    remaining: totalQty,
    averageCost,
    lots: [...lots] // Return copy to prevent mutation
  };
} 
 
 
 