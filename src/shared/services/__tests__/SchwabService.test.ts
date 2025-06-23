import { SchwabService } from '../SchwabService';
import { Account, OrderRequest, OrderResponse, Quote, Position, Transaction, SchwabServiceCredentials } from '../../types/schwab';

const mockAccounts = [{ hashValue: 'acc1' }] as Account[];
const mockOrderRequest: OrderRequest = {
  orderType: 'LIMIT',
  session: 'NORMAL',
  duration: 'DAY',
  orderStrategyType: 'SINGLE',
  orderLegCollection: [],
};
const mockOrderResponse = { orderId: 'order1' } as OrderResponse;
const mockQuote: Quote = {
  symbol: 'AAPL',
  bidPrice: 99,
  askPrice: 101,
  lastPrice: 100,
  // Add any other required properties here
};
const mockQuotes = [mockQuote] as Quote[];
const mockPositions: Position[] = [{
  accountHash: 'acc1',
  symbol: 'AAPL',
  longQuantity: 10,
  shortQuantity: 0,
  averagePrice: 100,
  marketValue: 1000,
}];
const mockTransactions: Transaction[] = [{
  transactionId: 'txn1',
  type: 'BUY',
  settlementDate: '2024-01-02',
  amount: 1000,
}];

const mockMarketClient = {
  quoteById: jest.fn().mockResolvedValue(mockQuote),
  quotes: jest.fn().mockResolvedValue(mockQuotes),
};
const mockTradingClient = {
  accountsNumbers: jest.fn().mockResolvedValue(mockAccounts),
  placeOrderByAcct: jest.fn().mockResolvedValue(mockOrderResponse),
  accountsDetails: jest.fn().mockResolvedValue({ positions: mockPositions }),
  transactByAcct: jest.fn().mockResolvedValue(mockTransactions),
};

jest.mock('schwab-client-js', () => ({
  MarketApiClient: jest.fn(() => mockMarketClient),
  TradingApiClient: jest.fn(() => mockTradingClient),
}));

describe('SchwabService', () => {
  const validCreds: SchwabServiceCredentials = {
    appKey: 'key',
    appSecret: 'secret',
    refreshToken: 'token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTradingClient.accountsNumbers.mockResolvedValue(mockAccounts);
    mockTradingClient.placeOrderByAcct.mockResolvedValue(mockOrderResponse);
    mockTradingClient.accountsDetails.mockResolvedValue({ positions: mockPositions });
    mockTradingClient.transactByAcct.mockResolvedValue(mockTransactions);
    mockMarketClient.quoteById.mockResolvedValue(mockQuote);
    mockMarketClient.quotes.mockResolvedValue(mockQuotes);
  });

  it('connects successfully with valid credentials', async () => {
    const service = new SchwabService(validCreds);
    await service.connect();
    expect(service.getIsConnected()).toBe(true);
  });

  it('throws if credentials are missing', () => {
    expect(() => new SchwabService({ appKey: '', appSecret: '', refreshToken: '' } as any)).toThrow();
  });

  it('fetches accounts', async () => {
    const service = new SchwabService(validCreds);
    await service.connect();
    const accounts = await service.getAccounts();
    expect(accounts).toEqual(mockAccounts);
    expect(mockTradingClient.accountsNumbers).toHaveBeenCalled();
  });

  it('places an order', async () => {
    const service = new SchwabService(validCreds);
    await service.connect();
    const resp = await service.placeOrder('acc1', mockOrderRequest);
    expect(resp).toEqual(mockOrderResponse);
    expect(mockTradingClient.placeOrderByAcct).toHaveBeenCalledWith('acc1', mockOrderRequest);
  });

  it('fetches a quote', async () => {
    const service = new SchwabService(validCreds);
    await service.connect();
    const quote = await service.getQuote('AAPL');
    expect(quote).toEqual(mockQuote);
    expect(mockMarketClient.quoteById).toHaveBeenCalledWith('AAPL', 'quote');
  });

  it('fetches multiple quotes', async () => {
    const service = new SchwabService(validCreds);
    await service.connect();
    const quotes = await service.getQuotes(['AAPL', 'GOOG']);
    expect(quotes).toEqual(mockQuotes);
    expect(mockMarketClient.quotes).toHaveBeenCalledWith('AAPL,GOOG', 'quote');
  });

  it('fetches positions', async () => {
    const service = new SchwabService(validCreds);
    await service.connect();
    const positions = await service.getPositions('acc1');
    expect(positions).toEqual(mockPositions);
    expect(mockTradingClient.accountsDetails).toHaveBeenCalledWith('acc1', 'positions');
  });

  it('fetches transactions', async () => {
    const service = new SchwabService(validCreds);
    await service.connect();
    const txns = await service.getTransactions('acc1', { startDate: '2024-01-01', endDate: '2024-01-31' });
    expect(txns).toEqual(mockTransactions);
    expect(mockTradingClient.transactByAcct).toHaveBeenCalledWith('acc1', 'ALL', '2024-01-01', '2024-01-31', null);
  });

  it('handles connection failure', async () => {
    mockTradingClient.accountsNumbers.mockRejectedValueOnce(new Error('fail'));
    const service = new SchwabService(validCreds);
    await expect(service.connect()).rejects.toThrow('SchwabService: Initial connection/validation failed. Refresh token might be invalid, expired, or credentials incorrect.');
  });

  it('handles API errors in methods', async () => {
    const service = new SchwabService(validCreds);
    await service.connect();
    mockTradingClient.accountsNumbers.mockRejectedValueOnce(new Error('fail'));
    await expect(service.getAccounts()).rejects.toThrow('fail');
    mockTradingClient.placeOrderByAcct.mockRejectedValueOnce(new Error('fail'));
    await expect(service.placeOrder('acc1', mockOrderRequest)).rejects.toThrow('fail');
    mockMarketClient.quoteById.mockRejectedValueOnce(new Error('fail'));
    await expect(service.getQuote('AAPL')).rejects.toThrow('fail');
    mockMarketClient.quotes.mockRejectedValueOnce(new Error('fail'));
    await expect(service.getQuotes(['AAPL'])).rejects.toThrow('fail');
    mockTradingClient.accountsDetails.mockRejectedValueOnce(new Error('fail'));
    await expect(service.getPositions('acc1')).rejects.toThrow('fail');
    mockTradingClient.transactByAcct.mockRejectedValueOnce(new Error('fail'));
    await expect(service.getTransactions('acc1', { startDate: '2024-01-01', endDate: '2024-01-31' })).rejects.toThrow('fail');
  });
}); 