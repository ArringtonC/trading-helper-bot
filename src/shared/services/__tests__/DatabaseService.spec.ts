import { v4 as uuidv4 } from 'uuid';
import { BrokerType, NormalizedTradeData } from '../../types/trade';
import {
    getDb,
    getTrades,
    insertNormalizedTrades,
    resetDatabase
} from '../DatabaseService';

// Mock sql.js a bit more thoroughly if direct db interaction for assertions is needed
// For now, we'll mostly rely on the service's own methods to verify state after actions.

describe('DatabaseService - Normalized Trades', () => {
  beforeEach(async () => {
    // Reset and re-initialize the database before each test to ensure a clean state.
    // The internal dbPromise in DatabaseService needs to be reset for this to work across tests.
    // This is a bit of a hack; ideally, the DatabaseService would provide a more robust test setup method.
    // For now, we call resetDatabase which internally nullifies dbPromise.
    await resetDatabase(); 
    await getDb(); // Ensure it's fresh for the next test
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

  it('should skip duplicate trades and log deduplication warnings', async () => {
    const tradeA = createSampleTrade(uuidv4(), 'AAPL');
    const tradeB = { ...tradeA, id: uuidv4() }; // Same fields except id
    // Insert tradeA
    await insertNormalizedTrades([tradeA]);
    // Insert tradeA again (should be skipped as duplicate)
    const result = await insertNormalizedTrades([tradeA, tradeB]);
    expect(result.successCount).toBe(0); // No new trades inserted
    expect(result.errors.length).toBe(0);
    const tradesInDb = await getTrades();
    expect(tradesInDb.length).toBe(1); // Only the first trade is present
  });

  it('should log anomalies to the errors table for outlier trades', async () => {
    const outlierTrade = createSampleTrade(uuidv4(), 'TSLA');
    outlierTrade.quantity = 999999; // Unusually large quantity
    outlierTrade.tradePrice = 0; // Zero price (anomaly)
    outlierTrade.netAmount = 0; // Zero net amount (anomaly)
    await insertNormalizedTrades([outlierTrade]);
    // Query errors table for anomaly logs
    const db = await getDb();
    const errors = db.exec("SELECT * FROM errors WHERE message LIKE '%ANOMALY%'");
    expect(errors.length).toBeGreaterThan(0);
    const errorRows = (errors[0]?.values || []) as (string | number | null)[][];
    const messages = errorRows.map((row: (string | number | null)[]) => row[2] as string);
    expect(messages.some((m: string) => m.includes('Unusually large quantity'))).toBe(true);
    expect(messages.some((m: string) => m.includes('Zero trade price'))).toBe(true);
    expect(messages.some((m: string) => m.includes('Zero net amount'))).toBe(true);
  });

  it('should report errors for invalid trades and not insert them', async () => {
    const invalidTrade = { ...createSampleTrade(uuidv4(), 'MSFT'), id: '' }; // Invalid id (empty string)
    const result = await insertNormalizedTrades([invalidTrade]);
    expect(result.successCount).toBe(0);
    expect(result.errors.length).toBe(0); // Errors are now logged, not returned
    // Optionally, check that the error was logged in the errors table
    const db = await getDb();
    const errors = db.exec("SELECT * FROM errors WHERE message LIKE '%VALIDATION ERROR%'");
    expect(errors.length).toBeGreaterThan(0);
    const errorRows = (errors[0]?.values || []) as (string | number | null)[][];
    const messages = errorRows.map((row: (string | number | null)[]) => row[2] as string);
    expect(messages.some((m: string) => m.includes('Missing required fields'))).toBe(true);
  });

});

describe('DatabaseService - Goal Sizing Config', () => {
  const { DatabaseService } = require('../DatabaseService');
  let dbService: typeof DatabaseService.prototype;

  const sampleConfig = {
    goalType: 'growth',
    sizingRules: { maxPositionSize: 2, maxTotalExposure: 10 },
    capitalObjectiveParameters: { currentBalance: 10000, targetBalance: 50000, timeHorizonMonths: 12 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    dbService = new DatabaseService();
    await dbService.init();
  });

  it('should migrate and create the goal_sizing_config table', async () => {
    dbService.saveGoalConfig(sampleConfig);
    const loaded = dbService.loadGoalConfig();
    expect(loaded).toBeTruthy();
    expect(loaded.goalType).toBe('growth');
  });

  it('should save and load a GoalSizingConfig object', async () => {
    dbService.saveGoalConfig(sampleConfig);
    const loaded = dbService.loadGoalConfig();
    expect(loaded).toMatchObject(sampleConfig);
  });

  it('should return null if no config is present', async () => {
    const loaded = dbService.loadGoalConfig();
    expect(loaded).toBeNull();
  });
}); 