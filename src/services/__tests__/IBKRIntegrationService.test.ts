import { IBKRIntegrationService } from '../IBKRIntegrationService';

jest.mock('../ImprovedIBKRServiceAdapter', () => ({
  __esModule: true,
  default: {
    importActivityStatement: jest.fn((content) => Promise.resolve({
      account: { accountId: 'acct-1', accountName: 'Test Account', balance: 1000 },
      positions: [{ id: 'pos-1' }],
      optionTrades: [{ symbol: 'SPY', strike: 400, putCall: 'CALL', expiry: new Date(), openDate: new Date() }],
      trades: [],
      errors: [],
      warnings: [],
    })),
    getDebugLogs: jest.fn(() => ['debug log']),
  },
}));

jest.mock('../IBKRService', () => ({
  IBKRService: {
    parseActivityStatement: jest.fn((content) => Promise.resolve({
      account: { accountId: 'acct-1', accountName: 'Test Account', balance: 1000 },
      positions: [{ id: 'pos-1' }],
      optionTrades: [{ symbol: 'SPY', strike: 400, putCall: 'CALL', expiry: new Date(), openDate: new Date() }],
      trades: [],
      errors: [],
      warnings: [],
    })),
    convertToOptionTrades: jest.fn(() => [{ symbol: 'SPY', strike: 400, putCall: 'CALL', expiry: new Date(), openDate: new Date() }]),
  },
}));

jest.mock('../AccountService', () => ({
  AccountService: {
    getAccounts: jest.fn(() => Promise.resolve([])),
    addAccount: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../OptionService', () => ({
  OptionService: {
    getOpenPositions: jest.fn(() => Promise.resolve([])),
    addTrade: jest.fn(() => Promise.resolve()),
    closeTrade: jest.fn(() => Promise.resolve()),
  },
}));

describe('IBKRIntegrationService', () => {
  const service = new IBKRIntegrationService();

  it('should import activity statement (success case)', async () => {
    const result = await service.importActivityStatement('mock content', true);
    expect(result).toHaveProperty('accountId', 'acct-1');
    expect(result).toHaveProperty('accountName', 'Test Account');
    expect(result).toHaveProperty('totalTrades', 1);
    expect(result).toHaveProperty('newTrades', 1);
    expect(result).toHaveProperty('updatedTrades', 0);
    expect(result).toHaveProperty('positions', 1);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('should import multiple statements (success case)', async () => {
    const result = await service.importMultipleStatements(['mock content 1', 'mock content 2'], true);
    expect(result).toHaveProperty('totalFiles', 2);
    expect(result).toHaveProperty('successfulFiles', 2);
    expect(result).toHaveProperty('failedFiles', 0);
    expect(result.accounts).toContain('acct-1');
    expect(result.totalTrades).toBeGreaterThanOrEqual(2);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
}); 