// Mock the DatabaseService module at the top level - Jest hoists this automatically
jest.mock('./DatabaseService', () => ({
  getTrades: jest.fn(),
}));

import { AnalyticsDataService } from './AnalyticsDataService';
import { NormalizedTradeData, BrokerType, PutCall, OpenCloseIndicator } from '../types/trade';
import { getTrades } from './DatabaseService';

// Get the mocked function with proper typing
const mockedGetTrades = getTrades as jest.MockedFunction<typeof getTrades>;

describe('AnalyticsDataService', () => {
  let service: AnalyticsDataService;
  
  const mockTradeData = {
    id: '1',
    importTimestamp: '2023-01-01T10:00:00Z',
    broker: BrokerType.IBKR,
    accountId: 'TEST123' as string | undefined,
    symbol: 'AAPL',
    assetCategory: 'STK' as const,
    quantity: 100,
    tradePrice: 150.50,
    currency: 'USD',
    netAmount: 15050,
    tradeDate: '2023-01-01',
    action: 'BUY',
    description: 'Test trade',
    settleDate: undefined as string | undefined,
    dateTime: undefined as string | undefined,
    proceeds: null as number | null,
    cost: null as number | null,
    commission: null as number | null,
    fees: null as number | null,
    costBasis: null as number | null,
    strikePrice: null as number | null,
    multiplier: undefined as number | undefined,
    expiryDate: undefined as string | undefined,
    putCall: undefined as PutCall | undefined,
    openCloseIndicator: undefined as OpenCloseIndicator | undefined,
    optionSymbol: undefined as string | undefined,
    orderID: undefined as string | undefined,
    executionID: undefined as string | undefined,
    notes: undefined as string | undefined,
    rawCsvRow: {} as Record<string, string> | undefined,
    rawRealizedPL: undefined as number | undefined
  };

  beforeEach(() => {
    service = new AnalyticsDataService();
    mockedGetTrades.mockClear();
    mockedGetTrades.mockResolvedValue([mockTradeData]);
  });

  describe('Constructor', () => {
    it('should initialize successfully', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(AnalyticsDataService);
    });
  });

  describe('getAllTrades', () => {
    it('should exist and be callable', () => {
      expect(typeof service.getAllTrades).toBe('function');
    });

    it('should return array of trades', async () => {
      const result = await service.getAllTrades();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].symbol).toBe('AAPL');
    });

    it('should call DatabaseService.getTrades', async () => {
      await service.getAllTrades();
      expect(mockedGetTrades).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTradesBySymbol', () => {
    it('should exist and be callable', () => {
      expect(typeof service.getTradesBySymbol).toBe('function');
    });

    it('should return trades for specific symbol', async () => {
      const result = await service.getTradesBySymbol('AAPL');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].symbol).toBe('AAPL');
    });

    it('should return empty array for non-matching symbol', async () => {
      const result = await service.getTradesBySymbol('TSLA');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle empty symbol', async () => {
      const result = await service.getTradesBySymbol('');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockedGetTrades.mockRejectedValue(new Error('Database error'));
      
      await expect(service.getAllTrades()).rejects.toThrow('Database error');
      await expect(service.getTradesBySymbol('AAPL')).rejects.toThrow('Database error');
    });

    it('should handle empty database response', async () => {
      mockedGetTrades.mockResolvedValue([]);
      
      const allTrades = await service.getAllTrades();
      expect(allTrades).toEqual([]);
      
      const symbolTrades = await service.getTradesBySymbol('AAPL');
      expect(symbolTrades).toEqual([]);
    });
  });
});
