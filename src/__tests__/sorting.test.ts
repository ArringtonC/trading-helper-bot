import { OptionTrade, OptionStrategy } from '../types/options';

// Test data with various edge cases
const testTrades: OptionTrade[] = [
  {
    id: '1',
    symbol: 'SPY',
    putCall: 'CALL',
    strike: 400,
    expiry: new Date('2024-12-20'),
    quantity: 1,
    premium: 5.25,
    openDate: new Date('2024-01-01'),
    closeDate: new Date('2024-01-15'),
    strategy: OptionStrategy.LONG_CALL,
    commission: 0.65,
    tradePL: 100
  },
  {
    id: '2',
    symbol: 'AAPL',
    putCall: 'PUT',
    strike: 180,
    expiry: new Date('2024-11-15'),
    quantity: -2,
    premium: undefined,
    openDate: new Date('2024-01-02'),
    strategy: OptionStrategy.SHORT_PUT,
    commission: 0.65,
    tradePL: 100  // Same P&L as first trade
  },
  {
    id: '3',
    symbol: 'TSLA',
    putCall: 'CALL',
    strike: 250,
    expiry: new Date('2024-10-18'),
    quantity: 1,
    premium: undefined,
    openDate: new Date('2024-01-03'),
    strategy: OptionStrategy.LONG_CALL,
    commission: 0.65,
    tradePL: -50
  }
];

describe('Trade Sorting', () => {
  // Helper function to mimic the component's sort function
  const sortTrades = (trades: OptionTrade[], field: string, direction: 'asc' | 'desc') => {
    return [...trades].sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'type':
          comparison = a.putCall.localeCompare(b.putCall);
          break;
        case 'strike':
          comparison = a.strike - b.strike;
          break;
        case 'expiry':
          comparison = new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'premium':
          comparison = (a.premium || 0) - (b.premium || 0);
          break;
        case 'openDate':
          comparison = new Date(a.openDate).getTime() - new Date(b.openDate).getTime();
          break;
        case 'closeDate':
          if (!a.closeDate && !b.closeDate) return 0;
          if (!a.closeDate) return 1;
          if (!b.closeDate) return -1;
          comparison = new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
          break;
        case 'pl':
        case 'pnl':
          comparison = (a.tradePL || 0) - (b.tradePL || 0);
          break;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  describe('Basic Sorting', () => {
    test('sorts by symbol ascending', () => {
      const sorted = sortTrades(testTrades, 'symbol', 'asc');
      expect(sorted.map(t => t.symbol)).toEqual(['AAPL', 'SPY', 'TSLA']);
    });

    test('sorts by symbol descending', () => {
      const sorted = sortTrades(testTrades, 'symbol', 'desc');
      expect(sorted.map(t => t.symbol)).toEqual(['TSLA', 'SPY', 'AAPL']);
    });

    test('sorts by P&L ascending', () => {
      const sorted = sortTrades(testTrades, 'pl', 'asc');
      expect(sorted.map(t => t.tradePL)).toEqual([-50, 100, 100]);
    });

    test('sorts by P&L descending', () => {
      const sorted = sortTrades(testTrades, 'pl', 'desc');
      expect(sorted.map(t => t.tradePL)).toEqual([100, 100, -50]);
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined values in premium sorting', () => {
      const sorted = sortTrades(testTrades, 'premium', 'asc');
      expect(sorted.map(t => t.premium)).toEqual([undefined, undefined, 5.25]);
    });

    test('maintains stable sort for equal P&L values', () => {
      const sorted = sortTrades(testTrades, 'pl', 'asc');
      const equalPLTrades = sorted.filter(t => t.tradePL === 100);
      expect(equalPLTrades).toHaveLength(2);
      expect(equalPLTrades[0].id).toBeLessThan(equalPLTrades[1].id);
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', () => {
      // Generate 1000 trades
      const largeTrades = Array.from({ length: 1000 }, (_, i) => ({
        ...testTrades[0],
        id: `${i}`,
        tradePL: Math.random() * 1000
      }));

      const start = performance.now();
      sortTrades(largeTrades, 'pl', 'desc');
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should sort in under 100ms
    });
  });
}); 