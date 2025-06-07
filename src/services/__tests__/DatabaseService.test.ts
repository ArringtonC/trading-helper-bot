import {
  initDatabase,
  insertNormalizedTrades,
  getTrades,
  resetDatabase,
  // getDb // Not typically exported for direct use in tests, but useful for direct manipulation if needed
} from '../DatabaseService';
import { NormalizedTradeData, BrokerType, AssetCategory, PutCall, OpenCloseIndicator } from '../../types/trade';
import { v4 as uuidv4 } from 'uuid';

// Mock sql.js a bit more thoroughly if direct db interaction for assertions is needed
// For now, we'll mostly rely on the service's own methods to verify state after actions.

describe('DatabaseService - Normalized Trades', () => {
  beforeEach(async () => {
    // Reset and re-initialize the database before each test to ensure a clean state.
    // The internal dbPromise in DatabaseService needs to be reset for this to work across tests.
    // This is a bit of a hack; ideally, the DatabaseService would provide a more robust test setup method.
    // For now, we call resetDatabase which internally nullifies dbPromise.
    await resetDatabase(); 
    await initDatabase(); // Ensure it's fresh for the next test
  });

  const createSampleTrade = (id: string, symbol: string, overrides: Partial<NormalizedTradeData> = {}): NormalizedTradeData => ({
    id,
    importTimestamp: new Date().toISOString(),
    broker: BrokerType.IBKR,
    tradeDate: '2023-11-01',
    symbol,
    assetCategory: 'STK',
    quantity: 10,
    tradePrice: 100,
    currency: 'USD',
    netAmount: -1000,
    rawCsvRow: { 'SomeHeader': 'SomeValue' },
    ...overrides,
  });

  it('should insert a single normalized trade successfully', async () => {
    const trade1 = createSampleTrade(uuidv4(), 'AAPL');
    const result = await insertNormalizedTrades([trade1]);

    expect(result.successCount).toBe(1);
    expect(result.errors.length).toBe(0);

    const tradesInDb = await getTrades();
    expect(tradesInDb.length).toBe(1);
    expect(tradesInDb[0].id).toBe(trade1.id);
    expect(tradesInDb[0].symbol).toBe('AAPL');
    expect(tradesInDb[0].assetCategory).toBe('STK');
  });

  it('should insert multiple normalized trades successfully in a transaction', async () => {
    const trade1 = createSampleTrade(uuidv4(), 'MSFT');
    const trade2 = createSampleTrade(uuidv4(), 'GOOG', { quantity: 5, tradePrice: 1000, netAmount: -5000 });
    const tradesToInsert = [trade1, trade2];

    const result = await insertNormalizedTrades(tradesToInsert);

    expect(result.successCount).toBe(2);
    expect(result.errors.length).toBe(0);

    const tradesInDb = await getTrades();
    expect(tradesInDb.length).toBe(2);
    // Verify order might be tricky if not explicitly ordered by insert time, but check presence
    expect(tradesInDb.find(t => t.id === trade1.id)).toBeDefined();
    expect(tradesInDb.find(t => t.id === trade2.id)).toBeDefined();
  });

  it('should return successCount 0 and no errors for an empty trades array', async () => {
    const result = await insertNormalizedTrades([]);
    expect(result.successCount).toBe(0);
    expect(result.errors.length).toBe(0);
    const tradesInDb = await getTrades();
    expect(tradesInDb.length).toBe(0);
  });
  
  // Note: Testing actual rollback due to db.run() error is hard without deeper mocking of sql.js internals.
  // The current implementation of insertNormalizedTrades logs errors and returns them,
  // and the transaction commit/rollback logic is there. 
  // We can test the error reporting part.

  it('should report errors and rollback if a trade has a UNIQUE constraint violation', async () => {
    const tradeId = uuidv4();
    const trade1 = createSampleTrade(tradeId, 'TSLA');
    const trade2_duplicateId = createSampleTrade(tradeId, 'NVDA'); 
    const trade3 = createSampleTrade(uuidv4(), 'AMD');

    await insertNormalizedTrades([trade1]); 
    let tradesInDb = await getTrades();
    expect(tradesInDb.length).toBe(1);

    const result = await insertNormalizedTrades([trade2_duplicateId, trade3]);

    expect(result.successCount).toBe(0); 
    expect(result.errors.length).toBeGreaterThan(0);
    // Check if the error message for the specific tradeId indicates a UNIQUE constraint failure.
    // The exact error message can vary by SQLite wrapper/version, so .includes() is safer.
    const specificError = result.errors.find(e => e.tradeId === tradeId);
    expect(specificError).toBeDefined();
    expect(typeof specificError?.error).toBe('string');
    expect(specificError?.error.toLowerCase()).toContain('unique constraint failed');

    tradesInDb = await getTrades();
    expect(tradesInDb.length).toBe(1); 
    expect(tradesInDb[0].id).toBe(trade1.id);
  });

   it('should insert trades with all optional fields correctly', async () => {
    const tradeWithAllFields: NormalizedTradeData = {
      id: uuidv4(),
      importTimestamp: new Date().toISOString(),
      broker: BrokerType.Schwab,
      accountId: 'ACC123',
      tradeDate: '2023-12-01',
      settleDate: '2023-12-03',
      symbol: 'SPY',
      description: 'SPDR S&P 500 ETF TRUST',
      assetCategory: 'OPT',
      action: 'Buy to Open',
      quantity: 5,
      tradePrice: 450.25,
      currency: 'USD',
      proceeds: null,
      cost: 2251.25,
      commission: -2.50,
      fees: -0.15,
      netAmount: -2253.90,
      openCloseIndicator: 'O',
      costBasis: 2253.90,
      optionSymbol: 'SPY240119C00450000',
      expiryDate: '2024-01-19',
      strikePrice: 450,
      putCall: 'C',
      multiplier: 100,
      orderID: 'SCHWAB_ORDER_1',
      executionID: 'SCHWAB_EXEC_1',
      notes: 'Assignment related trade',
      rawCsvRow: { 'OriginalHeader': 'OriginalValue' }
    };
    const result = await insertNormalizedTrades([tradeWithAllFields]);
    expect(result.successCount).toBe(1);
    expect(result.errors.length).toBe(0);

    const tradesInDb = await getTrades();
    expect(tradesInDb.length).toBe(1);
    const t = tradesInDb[0];
    expect(t.id).toBe(tradeWithAllFields.id);
    expect(t.broker).toBe(BrokerType.Schwab);
    expect(t.proceeds).toBeNull();
    expect(t.strikePrice).toBe(450);
    expect(t.assetCategory).toBe('OPT');
    expect(t.openCloseIndicator).toBe('O');
    expect(t.putCall).toBe('C');
  });

}); 