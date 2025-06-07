import { fifoLots, Trade, Position } from '../fifo';

describe('FIFO Cost Basis Calculation', () => {
  describe('fifoLots', () => {
    it('should handle simple buy and sell', () => {
      const trades: Trade[] = [
        { qty: 100, price: 10, date: '2024-01-01' },
        { qty: -50, price: 12, date: '2024-01-02' },
      ];

      const result: Position = fifoLots(trades);

      expect(result.realised).toBe(100); // (12 - 10) * 50
      expect(result.remaining).toBe(50);
      expect(result.averageCost).toBe(10);
      expect(result.lots).toHaveLength(1);
      expect(result.lots[0].qty).toBe(50);
    });

    it('should handle multiple buys with partial sell', () => {
      const trades: Trade[] = [
        { qty: 100, price: 10, date: '2024-01-01' },
        { qty: 100, price: 15, date: '2024-01-02' },
        { qty: -150, price: 20, date: '2024-01-03' },
      ];

      const result: Position = fifoLots(trades);

      // First 100 shares sold at cost 10: (20 - 10) * 100 = 1000
      // Next 50 shares sold at cost 15: (20 - 15) * 50 = 250
      // Total realized: 1000 + 250 = 1250
      expect(result.realised).toBe(1250);
      expect(result.remaining).toBe(50);
      expect(result.averageCost).toBe(15); // Remaining 50 shares at $15
    });

    it('should handle complete liquidation', () => {
      const trades: Trade[] = [
        { qty: 100, price: 10, date: '2024-01-01' },
        { qty: -100, price: 15, date: '2024-01-02' },
      ];

      const result: Position = fifoLots(trades);

      expect(result.realised).toBe(500); // (15 - 10) * 100
      expect(result.remaining).toBe(0);
      expect(result.averageCost).toBe(0);
      expect(result.lots).toHaveLength(0);
    });

    it('should handle overselling (short position)', () => {
      const trades: Trade[] = [
        { qty: 100, price: 10, date: '2024-01-01' },
        { qty: -150, price: 15, date: '2024-01-02' },
      ];

      const result: Position = fifoLots(trades);

      expect(result.realised).toBe(500); // (15 - 10) * 100
      expect(result.remaining).toBe(0); // No remaining long position
      expect(result.averageCost).toBe(0);
      expect(result.lots).toHaveLength(0);
    });

    it('should handle multiple lots with complex trading', () => {
      const trades: Trade[] = [
        { qty: 100, price: 10, date: '2024-01-01' },
        { qty: 200, price: 12, date: '2024-01-02' },
        { qty: 100, price: 8, date: '2024-01-03' },
        { qty: -250, price: 15, date: '2024-01-04' },
      ];

      const result: Position = fifoLots(trades);

      // Sell 100 at $10: (15 - 10) * 100 = 500
      // Sell 150 at $12: (15 - 12) * 150 = 450
      // Total realized: 500 + 450 = 950
      expect(result.realised).toBe(950);
      expect(result.remaining).toBe(150); // 50 at $12 + 100 at $8
      
      // Average cost: (50 * 12 + 100 * 8) / 150 = (600 + 800) / 150 = 9.33
      expect(result.averageCost).toBeCloseTo(9.33, 2);
    });

    it('should handle empty trades array', () => {
      const trades: Trade[] = [];
      const result: Position = fifoLots(trades);

      expect(result.realised).toBe(0);
      expect(result.remaining).toBe(0);
      expect(result.averageCost).toBe(0);
      expect(result.lots).toHaveLength(0);
    });

    it('should handle only buy trades', () => {
      const trades: Trade[] = [
        { qty: 100, price: 10, date: '2024-01-01' },
        { qty: 50, price: 12, date: '2024-01-02' },
      ];

      const result: Position = fifoLots(trades);

      expect(result.realised).toBe(0);
      expect(result.remaining).toBe(150);
      expect(result.averageCost).toBeCloseTo(10.67, 2); // (100*10 + 50*12) / 150
      expect(result.lots).toHaveLength(2);
    });

    it('should handle only sell trades', () => {
      const trades: Trade[] = [
        { qty: -100, price: 10, date: '2024-01-01' },
        { qty: -50, price: 12, date: '2024-01-02' },
      ];

      const result: Position = fifoLots(trades);

      expect(result.realised).toBe(0); // No lots to sell against
      expect(result.remaining).toBe(0);
      expect(result.averageCost).toBe(0);
      expect(result.lots).toHaveLength(0);
    });

    it('should preserve lot dates correctly', () => {
      const trades: Trade[] = [
        { qty: 100, price: 10, date: '2024-01-01' },
        { qty: 100, price: 12, date: '2024-01-02' },
        { qty: -50, price: 15, date: '2024-01-03' },
      ];

      const result: Position = fifoLots(trades);

      expect(result.lots).toHaveLength(2);
      expect(result.lots[0].date).toBe('2024-01-01'); // Partial first lot
      expect(result.lots[0].qty).toBe(50);
      expect(result.lots[1].date).toBe('2024-01-02'); // Full second lot
      expect(result.lots[1].qty).toBe(100);
    });

    it('should handle fractional shares', () => {
      const trades: Trade[] = [
        { qty: 100.5, price: 10.25, date: '2024-01-01' },
        { qty: -50.25, price: 12.75, date: '2024-01-02' },
      ];

      const result: Position = fifoLots(trades);

      expect(result.realised).toBeCloseTo(125.625, 3); // (12.75 - 10.25) * 50.25
      expect(result.remaining).toBeCloseTo(50.25, 3);
      expect(result.averageCost).toBeCloseTo(10.25, 2);
    });
  });
}); 
 
 
 