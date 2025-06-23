import { ExportService, exportOpenPositionsToCSV, exportTradesToCSV } from '../ExportService';

jest.mock('../AccountService', () => ({
  AccountService: {
    getAccounts: jest.fn(() => ([
      { id: '1', name: 'Test Account', type: 'Demo', balance: 1000, lastUpdated: new Date() }
    ])),
    getAccountById: jest.fn((id) => ({ id, name: 'Test Account', type: 'Demo', balance: 1000, lastUpdated: new Date() })),
  }
}));

jest.mock('../OptionService', () => ({
  OptionService: {
    getOptionsPortfolio: jest.fn(() => ({ trades: [] })),
    calculateStats: jest.fn(() => ({ openTrades: 1, closedTrades: 2, winRate: 0.5, totalPL: 123.45 })),
    getOpenPositions: jest.fn(() => ([])),
    getClosedPositions: jest.fn(() => ([])),
    calculatePL: jest.fn(() => 42),
  }
}));

jest.mock('../ProjectionService', () => ({
  ProjectionService: {
    calculateYearlyProjections: jest.fn(() => ([{ month: 'Jan', balance: 1100 }]))
  }
}));

describe('ExportService', () => {
  it('should export capabilities with expected CSV content', () => {
    const csv = ExportService.exportCapabilities();
    expect(csv).toContain('Trading Helper Bot - Capabilities Export');
    expect(csv).toContain('Account Management');
    expect(csv).toContain('Test Account');
    expect(csv).toContain('Options Trading Statistics');
    expect(csv).toContain('1 account(s)');
  });

  it('should export option trades with expected CSV content', () => {
    const csv = ExportService.exportOptionTrades('1');
    expect(csv).toContain('Option Trades Export - Test Account');
    expect(csv).toContain('ID,Symbol,Type,Strike,Expiry,Quantity,Premium,Open Date,Close Date,Close Premium,P&L,Strategy,Notes');
  });

  it('should throw if account not found', () => {
    const { AccountService } = require('../AccountService');
    AccountService.getAccountById.mockReturnValueOnce(undefined);
    expect(() => ExportService.exportOptionTrades('notfound')).toThrow('Account notfound not found');
  });

  it('should export projections with expected CSV content', () => {
    const csv = ExportService.exportProjections('1');
    expect(csv).toContain('Account Projections Export - Test Account');
    expect(csv).toContain('Month,Projected Balance');
    expect(csv).toContain('Jan,1100');
  });

  it('should throw if account not found (projections)', () => {
    const { AccountService } = require('../AccountService');
    AccountService.getAccountById.mockReturnValueOnce(undefined);
    expect(() => ExportService.exportProjections('notfound')).toThrow('Account notfound not found');
  });

  it('should download CSV and trigger a download link', () => {
    // Set up jsdom
    document.body.innerHTML = '';
    const clickMock = jest.fn();
    const realCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: any) => {
      if (tag === 'a') {
        const el = realCreateElement(tag);
        Object.defineProperty(el, 'click', { value: clickMock });
        return el;
      }
      return realCreateElement(tag);
    });
    // Define global.URL.createObjectURL if not present
    const originalCreateObjectURL = global.URL.createObjectURL;
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    // Call downloadCSV
    ExportService.downloadCSV('test-content', 'test.csv');
    // Check that a link was created and clicked
    expect(clickMock).toHaveBeenCalled();
    expect(document.querySelector('a')).toBeNull(); // Should be removed after click
    createElementSpy.mockRestore();
    // Restore or delete createObjectURL
    if (originalCreateObjectURL) {
      global.URL.createObjectURL = originalCreateObjectURL;
    } else {
      delete (global.URL as any).createObjectURL;
    }
  });
});

describe('exportOpenPositionsToCSV', () => {
  it('should export open positions to CSV with expected content', () => {
    const mockPortfolios = {
      '1': {
        id: '1',
        trades: [
          {
            id: 't1', symbol: 'AAPL', putCall: 'CALL', strike: 150, expiry: new Date('2025-01-01'), quantity: 2, premium: 1.5, openDate: new Date('2024-01-01'), closeDate: undefined
          }
        ]
      }
    };
    const csv = exportOpenPositionsToCSV(mockPortfolios as any);
    expect(csv).toContain('Account,Symbol,Type,Strike,Expiry,Quantity,Premium,OpenDate,DaysToExpiry');
    expect(csv).toContain('AAPL');
    expect(csv).toContain('CALL');
    expect(csv).toContain('150.00');
  });
});

describe('exportTradesToCSV', () => {
  it('should export trades to CSV with expected content', () => {
    const mockTrades = [
      {
        id: 't1', symbol: 'AAPL', putCall: 'CALL', strike: 150, expiry: new Date('2025-01-01'), quantity: 2, premium: 1.5, openDate: new Date('2024-01-01'), closeDate: new Date('2024-01-10'), closePremium: 2.0, strategy: 'Test', notes: 'note'
      }
    ];
    // OptionService.calculatePL is already mocked to return 42
    const csv = exportTradesToCSV(mockTrades as any);
    expect(csv).toContain('ID,Symbol,Type,Strike,Expiry,Quantity,Premium,OpenDate,CloseDate,ClosePremium,P&L,Strategy,Notes');
    expect(csv).toContain('AAPL');
    expect(csv).toContain('CALL');
    expect(csv).toContain('150.00');
    expect(csv).toContain('42');
    expect(csv).toContain('Test');
    expect(csv).toContain('note');
  });
}); 