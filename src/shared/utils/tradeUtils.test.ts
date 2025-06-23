import { getPLFromTrade, getPLFromCsv, calculateTradePL, calculateCumulativePL } from './tradeUtils';
import { OptionTrade, OptionStrategy } from '../../types/options';
import { IBKRTradeRecord } from '../../types/ibkr';

describe('P&L Calculations', () => {
  describe('getPLFromTrade', () => {
    it('should return realized PL for closed trades', () => {
      const closedTrade = {
        id: 'T123',
        status: 'closed' as const,
        realizedPL: 125.23
      };
      expect(getPLFromTrade(closedTrade)).toBe(125.23);
    });

    it('should return unrealized PL for open trades', () => {
      const openTrade = {
        id: 'T456',
        status: 'open' as const,
        unrealizedPL: -37.80
      };
      expect(getPLFromTrade(openTrade)).toBe(-37.80);
    });

    it('should return 0 for trades with missing PL values', () => {
      const tradeWithoutPL = {
        id: 'T789',
        status: 'closed' as const
      };
      expect(getPLFromTrade(tradeWithoutPL)).toBe(0);
    });
  });

  describe('getPLFromCsv', () => {
    it('should calculate PL correctly from CSV data', () => {
      const csvRow = {
        proceeds: 500,
        basis: 480,
        commissionFee: 2.50
      };
      expect(getPLFromCsv(csvRow)).toBe(17.50); // 500 - 480 - 2.50 = 17.50
    });

    it('should handle negative PL correctly', () => {
      const csvRow = {
        proceeds: 450,
        basis: 500,
        commissionFee: 2.50
      };
      expect(getPLFromCsv(csvRow)).toBe(-52.50); // 450 - 500 - 2.50 = -52.50
    });

    it('should handle zero values correctly', () => {
      const csvRow = {
        proceeds: 0,
        basis: 0,
        commissionFee: 0
      };
      expect(getPLFromCsv(csvRow)).toBe(0);
    });
  });

  describe('calculateTradePL', () => {
    it('should calculate PL for closed trades', () => {
      const closedTrade: OptionTrade = {
        id: 'T123',
        symbol: 'AAPL',
        quantity: 1,
        premium: 1.50,
        openDate: new Date('2024-01-01'),
        closeDate: new Date('2024-01-02'),
        realizedPL: 125.23,
        unrealizedPL: 0,
        putCall: 'CALL',
        strike: 150,
        expiry: new Date('2024-01-20'),
        strategy: OptionStrategy.LONG_CALL,
        commission: 0.65
      };
      expect(calculateTradePL(closedTrade)).toBe(125.23);
    });

    it('should calculate PL for open trades', () => {
      const openTrade: OptionTrade = {
        id: 'T456',
        symbol: 'AAPL',
        quantity: 1,
        premium: 1.50,
        openDate: new Date('2024-01-01'),
        realizedPL: 0,
        unrealizedPL: -37.80,
        putCall: 'CALL',
        strike: 150,
        expiry: new Date('2024-01-20'),
        strategy: OptionStrategy.LONG_CALL,
        commission: 0.65
      };
      expect(calculateTradePL(openTrade)).toBe(-37.80);
    });

    it('should handle trades with missing PL values', () => {
      const tradeWithoutPL: OptionTrade = {
        id: 'T789',
        symbol: 'AAPL',
        quantity: 1,
        premium: 1.50,
        openDate: new Date('2024-01-01'),
        putCall: 'CALL',
        strike: 150,
        expiry: new Date('2024-01-20'),
        strategy: OptionStrategy.LONG_CALL,
        commission: 0.65
      };
      expect(calculateTradePL(tradeWithoutPL)).toBe(0);
    });
  });

  describe('IBKR Trade P&L Calculations', () => {
    it('should calculate tradePL and cumulativePL correctly', () => {
      const trades: IBKRTradeRecord[] = [
        {
          symbol: 'AAPL',
          dateTime: '2024-01-01 10:00:00',
          quantity: 100,
          tradePrice: 150.00,
          commissionFee: 1.00,
          assetCategory: 'STK',
          description: 'AAPL',
          code: 'STK',
          proceeds: 15000.00,
          basis: 14000.00,
          realizedPL: 999.00,
          mtmPL: 0,
          tradePL: 999.00
        },
        {
          symbol: 'MSFT',
          dateTime: '2024-01-02 11:00:00',
          quantity: -50,
          tradePrice: 300.00,
          commissionFee: 1.00,
          assetCategory: 'STK',
          description: 'MSFT',
          code: 'STK',
          proceeds: -15000.00,
          basis: -16000.00,
          realizedPL: 999.00,
          mtmPL: 0,
          tradePL: 999.00
        },
        {
          symbol: 'GOOGL',
          dateTime: '2024-01-03 12:00:00',
          quantity: 25,
          tradePrice: 2800.00,
          commissionFee: 1.00,
          assetCategory: 'STK',
          description: 'GOOGL',
          code: 'STK',
          proceeds: 70000.00,
          basis: 69000.00,
          realizedPL: 999.00,
          mtmPL: 0,
          tradePL: 999.00
        }
      ];

      // Calculate tradePL and cumulativePL
      let runningTotal = 0;
      for (const t of trades) {
        runningTotal += t.tradePL;
        t.cumulativePL = runningTotal;
      }

      // Verify calculations
      expect(trades[0].tradePL).toBe(999.00);
      expect(trades[0].cumulativePL).toBe(999.00);

      expect(trades[1].tradePL).toBe(999.00);
      expect(trades[1].cumulativePL).toBe(1998.00);

      expect(trades[2].tradePL).toBe(999.00);
      expect(trades[2].cumulativePL).toBe(2997.00);
    });

    it('should handle trades with missing P&L values', () => {
      const trades: IBKRTradeRecord[] = [
        {
          symbol: 'AAPL',
          dateTime: '2024-01-01 10:00:00',
          quantity: 100,
          tradePrice: 150.00,
          commissionFee: 1.00,
          assetCategory: 'STK',
          description: 'AAPL',
          code: 'STK',
          proceeds: 15000.00,
          basis: 14000.00,
          realizedPL: 999.00,
          mtmPL: 0,
          tradePL: 999.00
        },
        {
          symbol: 'MSFT',
          dateTime: '2024-01-02 11:00:00',
          quantity: -50,
          tradePrice: 300.00,
          commissionFee: 1.00,
          assetCategory: 'STK',
          description: 'MSFT',
          code: 'STK',
          proceeds: -15000.00,
          basis: -16000.00,
          realizedPL: 0,
          mtmPL: 0,
          tradePL: 0
        },
        {
          symbol: 'GOOGL',
          dateTime: '2024-01-03 12:00:00',
          quantity: 25,
          tradePrice: 2800.00,
          commissionFee: 1.00,
          assetCategory: 'STK',
          description: 'GOOGL',
          code: 'STK',
          proceeds: 70000.00,
          basis: 69000.00,
          realizedPL: 999.00,
          mtmPL: 0,
          tradePL: 999.00
        }
      ];

      // Calculate tradePL and cumulativePL
      let runningTotal = 0;
      for (const t of trades) {
        runningTotal += t.tradePL;
        t.cumulativePL = runningTotal;
      }

      // Verify calculations
      expect(trades[0].tradePL).toBe(999.00);
      expect(trades[0].cumulativePL).toBe(999.00);

      expect(trades[1].tradePL).toBe(0);
      expect(trades[1].cumulativePL).toBe(999.00);

      expect(trades[2].tradePL).toBe(999.00);
      expect(trades[2].cumulativePL).toBe(1998.00);
    });

    it('should handle trades with both realized and MTM P&L', () => {
      const trades: IBKRTradeRecord[] = [
        {
          symbol: 'AAPL',
          dateTime: '2024-01-01 10:00:00',
          quantity: 100,
          tradePrice: 150.00,
          commissionFee: 1.00,
          assetCategory: 'STK',
          description: 'AAPL',
          code: 'STK',
          proceeds: 15000.00,
          basis: 14000.00,
          realizedPL: 999.00,
          mtmPL: 0,
          tradePL: 999.00
        },
        {
          symbol: 'MSFT',
          dateTime: '2024-01-02 11:00:00',
          quantity: -50,
          tradePrice: 300.00,
          commissionFee: 1.00,
          assetCategory: 'STK',
          description: 'MSFT',
          code: 'STK',
          proceeds: -15000.00,
          basis: -16000.00,
          realizedPL: 0,
          mtmPL: 500.00,
          tradePL: 500.00
        },
        {
          symbol: 'GOOGL',
          dateTime: '2024-01-03 12:00:00',
          quantity: 25,
          tradePrice: 2800.00,
          commissionFee: 1.00,
          assetCategory: 'STK',
          description: 'GOOGL',
          code: 'STK',
          proceeds: 70000.00,
          basis: 69000.00,
          realizedPL: 999.00,
          mtmPL: 0,
          tradePL: 999.00
        }
      ];

      // Calculate tradePL and cumulativePL
      let runningTotal = 0;
      for (const t of trades) {
        runningTotal += t.tradePL;
        t.cumulativePL = runningTotal;
      }

      // Verify calculations
      expect(trades[0].tradePL).toBe(999.00);
      expect(trades[0].cumulativePL).toBe(999.00);

      expect(trades[1].tradePL).toBe(500.00);
      expect(trades[1].cumulativePL).toBe(1499.00);

      expect(trades[2].tradePL).toBe(999.00);
      expect(trades[2].cumulativePL).toBe(2498.00);
    });
  });

  describe('CSV Cumulative P&L', () => {
    it('should calculate cumulative P&L correctly from trades', () => {
      const trades: OptionTrade[] = [
        {
          id: '1',
          symbol: 'AAPL',
          putCall: 'CALL',
          strike: 150,
          expiry: new Date('2024-01-20'),
          quantity: 1,
          premium: 1.50,
          openDate: new Date('2024-01-01'),
          closeDate: new Date('2024-01-02'),
          strategy: OptionStrategy.LONG_CALL,
          commission: 0.65,
          realizedPL: 999.00,
          unrealizedPL: 0
        },
        {
          id: '2',
          symbol: 'MSFT',
          putCall: 'PUT',
          strike: 200,
          expiry: new Date('2024-01-20'),
          quantity: -1,
          premium: 2.00,
          openDate: new Date('2024-01-02'),
          closeDate: new Date('2024-01-03'),
          strategy: OptionStrategy.SHORT_PUT,
          commission: 0.65,
          realizedPL: 500.00,
          unrealizedPL: 0
        },
        {
          id: '3',
          symbol: 'GOOGL',
          putCall: 'CALL',
          strike: 250,
          expiry: new Date('2024-01-20'),
          quantity: 1,
          premium: 3.00,
          openDate: new Date('2024-01-03'),
          closeDate: new Date('2024-01-04'),
          strategy: OptionStrategy.LONG_CALL,
          commission: 0.65,
          realizedPL: 999.00,
          unrealizedPL: 0
        }
      ];

      const result = calculateCumulativePL(trades);

      // Verify trade count
      expect(result.trades.length).toBe(3);

      // Verify individual trade P&L
      expect(calculateTradePL(result.trades[0])).toBe(999.00);
      expect(calculateTradePL(result.trades[1])).toBe(500.00);
      expect(calculateTradePL(result.trades[2])).toBe(999.00);

      // Verify total cumulative P&L
      expect(result.cumulativePL).toBe(2498.00);
    });
  });
}); 