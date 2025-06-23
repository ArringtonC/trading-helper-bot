import { IBKRActivityStatementParser } from './IBKRActivityStatementParser';

describe('IBKRActivityStatementParser', () => {
  describe('extractTrades', () => {
    it('should calculate tradePL and cumulativePL correctly', () => {
      // Sample IBKR statement content with trades
      const content = `
Trades,Header,Asset Category,Date/Time,Symbol,Quantity,T. Price,Comm/Fee,Proceeds,Basis,Realized P&L
Trades,Data,STK,2024-01-01 10:00:00,AAPL,100,150.00,1.00,15000.00,14000.00,999.00
Trades,Data,STK,2024-01-02 11:00:00,MSFT,-50,300.00,1.00,-15000.00,-16000.00,999.00
Trades,Data,STK,2024-01-03 12:00:00,GOOGL,25,2800.00,1.00,70000.00,69000.00,999.00
`;

      const parser = new IBKRActivityStatementParser(content);
      const trades = parser.extractTrades();

      // Verify trade count
      expect(trades.length).toBe(3);

      // Verify first trade
      expect(trades[0].symbol).toBe('AAPL');
      expect(trades[0].tradePL).toBe(999.00);
      expect(trades[0].cumulativePL).toBe(999.00);

      // Verify second trade
      expect(trades[1].symbol).toBe('MSFT');
      expect(trades[1].tradePL).toBe(999.00);
      expect(trades[1].cumulativePL).toBe(1998.00); // 999 + 999

      // Verify third trade
      expect(trades[2].symbol).toBe('GOOGL');
      expect(trades[2].tradePL).toBe(999.00);
      expect(trades[2].cumulativePL).toBe(2997.00); // 1998 + 999
    });

    it('should handle trades with missing P&L values', () => {
      const content = `
Trades,Header,Asset Category,Date/Time,Symbol,Quantity,T. Price,Comm/Fee,Proceeds,Basis,Realized P&L
Trades,Data,STK,2024-01-01 10:00:00,AAPL,100,150.00,1.00,15000.00,14000.00,999.00
Trades,Data,STK,2024-01-02 11:00:00,MSFT,-50,300.00,1.00,-15000.00,-16000.00,
Trades,Data,STK,2024-01-03 12:00:00,GOOGL,25,2800.00,1.00,70000.00,69000.00,999.00
`;

      const parser = new IBKRActivityStatementParser(content);
      const trades = parser.extractTrades();

      // Verify trade count
      expect(trades.length).toBe(3);

      // Verify first trade
      expect(trades[0].tradePL).toBe(999.00);
      expect(trades[0].cumulativePL).toBe(999.00);

      // Verify second trade (missing P&L)
      expect(trades[1].tradePL).toBe(0);
      expect(trades[1].cumulativePL).toBe(999.00);

      // Verify third trade
      expect(trades[2].tradePL).toBe(999.00);
      expect(trades[2].cumulativePL).toBe(1998.00);
    });

    it('should handle trades with both realized and MTM P&L', () => {
      const content = `
Trades,Header,Asset Category,Date/Time,Symbol,Quantity,T. Price,Comm/Fee,Proceeds,Basis,Realized P&L,MTM P&L
Trades,Data,STK,2024-01-01 10:00:00,AAPL,100,150.00,1.00,15000.00,14000.00,999.00,0.00
Trades,Data,STK,2024-01-02 11:00:00,MSFT,-50,300.00,1.00,-15000.00,-16000.00,0.00,500.00
Trades,Data,STK,2024-01-03 12:00:00,GOOGL,25,2800.00,1.00,70000.00,69000.00,999.00,0.00
`;

      const parser = new IBKRActivityStatementParser(content);
      const trades = parser.extractTrades();

      // Verify trade count
      expect(trades.length).toBe(3);

      // Verify first trade (realized only)
      expect(trades[0].tradePL).toBe(999.00);
      expect(trades[0].cumulativePL).toBe(999.00);

      // Verify second trade (MTM only)
      expect(trades[1].tradePL).toBe(500.00);
      expect(trades[1].cumulativePL).toBe(1499.00);

      // Verify third trade (realized only)
      expect(trades[2].tradePL).toBe(999.00);
      expect(trades[2].cumulativePL).toBe(2498.00);
    });
  });
}); 