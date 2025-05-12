import { IBKRActivityStatementParser } from '../src/services/IBKRActivityStatementParser';
import { IBKRImportResult, IBKRTradeRecord } from '../src/types/ibkr';

const GOLDEN_CSV = `
Trades,Data,Order,Equity and Index Options,USD,U5922405,AAPL 28MAR25 222.5 C,2025-03-27,12:43:04,-1,2.23,2.0966,223,-1.0656394,-123.05665,98.877711,13.34,C
Trades,Data,Order,Equity and Index Options,USD,U5922405,SPY 26APR25 500 P,2025-04-26,10:15:22,1,1.85,1.7225,500,0.8775,-82.45,53.34,0,P
Trades,Data,Order,Equity and Index Options,USD,U5922405,TSLA 03MAY25 180 C,2025-05-03,14:30:45,-2,3.15,2.9925,180,-2.1525,-156.85,48.92,0,C
Realized & Unrealized Performance Summary,Data,Total,,0,2416.0862774,-786.2636604,0,0,1629.822617,0,0,0,0,0,1629.822617
`.trim();

describe('IBKRActivityStatementParser — Golden Samples', () => {
  let parser: IBKRActivityStatementParser;
  let result: IBKRImportResult;

  beforeAll(() => {
    parser = new IBKRActivityStatementParser(GOLDEN_CSV);
    result = parser.parse();
    console.log('Parser debug logs:', parser.getDebugState());
    console.log('Parse result:', result);
    expect(result.success).toBe(true);
  });

  it('extracts exactly 3 trades', () => {
    expect(result.trades).toBeDefined();
    expect(result.trades as IBKRTradeRecord[]).toHaveLength(3);
  });

  it('parses AAPL 28MAR25 222.5 C correctly', () => {
    expect(result.trades).toBeDefined();
    const trades = result.trades as IBKRTradeRecord[];
    const aapl = trades.find(t => t.symbol.includes('AAPL 28MAR25 222.5 C'));
    expect(aapl).toBeDefined();
    if (aapl) {
      expect(aapl.realizedPL).toBeCloseTo(98.877711, 6);
      expect(aapl.mtmPL).toBeCloseTo(13.34, 2);
      expect(aapl.tradePL).toBeCloseTo(112.217711, 6);
    }
  });

  it('parses SPY 26APR25 500 P correctly', () => {
    expect(result.trades).toBeDefined();
    const trades = result.trades as IBKRTradeRecord[];
    const spy = trades.find(t => t.symbol.includes('SPY 26APR25 500 P'));
    expect(spy).toBeDefined();
    if (spy) {
      // From CSV: realizedPL = 53.34, mtmPL = 0 → tradePL = 53.34
      expect(spy.realizedPL).toBeCloseTo(53.34, 2);
      expect(spy.mtmPL).toBeCloseTo(0, 2);
      expect(spy.tradePL).toBeCloseTo(53.34, 2);
    }
  });

  it('parses TSLA 03MAY25 180 C correctly', () => {
    expect(result.trades).toBeDefined();
    const trades = result.trades as IBKRTradeRecord[];
    const tsla = trades.find(t => t.symbol.includes('TSLA 03MAY25 180 C'));
    expect(tsla).toBeDefined();
    if (tsla) {
      // From CSV: realizedPL = 48.92, mtmPL = 0 → tradePL = 48.92
      expect(tsla.realizedPL).toBeCloseTo(48.92, 2);
      expect(tsla.mtmPL).toBeCloseTo(0, 2);
      expect(tsla.tradePL).toBeCloseTo(48.92, 2);
    }
  });

  it('extracts cumulativePL from summary row', () => {
    expect(result.cumulativePL).toBeDefined();
    // Should pick the 10th numeric after "Total"
    expect(result.cumulativePL as number).toBeCloseTo(1629.822617, 6);
  });

  it('rounds and binds UI value correctly (simulated)', () => {
    expect(result.cumulativePL).toBeDefined();
    // Simulate how UI shows two decimals
    const displayed = (result.cumulativePL as number).toFixed(2);
    expect(displayed).toBe('1629.82');
  });
}); 