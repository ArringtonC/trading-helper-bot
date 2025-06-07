import { AnalyticsDataService } from '../AnalyticsDataService';

jest.mock('../DatabaseService', () => ({
  getTrades: jest.fn(),
}));

import { getTrades } from '../DatabaseService';

describe('AnalyticsDataService', () => {
  const service = new AnalyticsDataService();

  const mockTrades = [
    {
      symbol: 'AAPL',
      tradeDate: '2024-05-01',
      settleDate: '',
      expiryDate: '',
      dateTime: '',
      quantity: 10,
      tradePrice: 150,
      netAmount: 1500,
      proceeds: 1500,
      cost: 1400,
      commission: 10,
      fees: 2,
      costBasis: 1400,
      strikePrice: 145,
      multiplier: 100,
      description: 'Apple trade',
      action: 'BUY',
    },
    {
      symbol: 'GOOG',
      tradeDate: '2024-05-02',
      settleDate: '2024-05-03',
      expiryDate: '',
      dateTime: '',
      quantity: 5,
      tradePrice: 2500,
      netAmount: 12500,
      proceeds: 12500,
      cost: 12400,
      commission: 15,
      fees: 3,
      costBasis: 12400,
      strikePrice: 0,
      multiplier: undefined,
      description: '',
      action: '',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get all trades and preprocess them (normal case)', async () => {
    (getTrades as jest.Mock).mockResolvedValueOnce(mockTrades);
    const result = await service.getAllTrades();
    expect(result).toHaveLength(2);
    // Preprocessing: settleDate, expiryDate, dateTime should be undefined if empty string
    expect(result[0].settleDate).toBeUndefined();
    expect(result[0].expiryDate).toBeUndefined();
    expect(result[0].dateTime).toBeUndefined();
    // Preprocessing: description and action should be non-empty strings
    expect(result[1].description).toBe('');
    expect(result[1].action).toBe('');
  });

  it('should return empty array if no trades', async () => {
    (getTrades as jest.Mock).mockResolvedValueOnce([]);
    const result = await service.getAllTrades();
    expect(result).toEqual([]);
  });

  it('should filter trades by symbol', async () => {
    (getTrades as jest.Mock).mockResolvedValueOnce(mockTrades);
    const result = await service.getTradesBySymbol('AAPL');
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('AAPL');
  });

  it('should return empty array if symbol not found', async () => {
    (getTrades as jest.Mock).mockResolvedValueOnce(mockTrades);
    const result = await service.getTradesBySymbol('MSFT');
    expect(result).toEqual([]);
  });
}); 