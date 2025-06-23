import { tradeDuration, tradePL } from './tradeFeatures';
import { NormalizedTradeData, BrokerType } from '../../shared/types/trade';
import { rsiFeature, macdFeature, bollingerFeature, streakFeature, marketRegimeFeature } from './tradeFeatures';

describe('tradeFeatures', () => {
  const baseTrade: NormalizedTradeData = {
    id: '1',
    importTimestamp: '2024-05-21T00:00:00Z',
    broker: BrokerType.IBKR,
    tradeDate: '2024-05-01',
    symbol: 'AAPL',
    assetCategory: 'STK',
    quantity: 10,
    tradePrice: 150,
    currency: 'USD',
    netAmount: 1000,
  };

  it('calculates trade duration in days', () => {
    const trade = { ...baseTrade, expiryDate: '2024-05-10' };
    expect(tradeDuration(trade)).toBe(9);
  });

  it('returns 0 duration if open and close are the same', () => {
    expect(tradeDuration(baseTrade)).toBe(0);
  });

  it('returns null if dates are missing', () => {
    const trade = { ...baseTrade, tradeDate: undefined as any };
    expect(tradeDuration(trade)).toBeNull();
  });

  it('computes tradePL as netAmount', () => {
    expect(tradePL(baseTrade)).toBe(1000);
  });
});

describe('Feature Definitions', () => {
  it('should compute RSI (TODO: mock price history)', () => {
    // TODO: Provide mock trades and test rsiFeature.calculate
  });
  it('should compute MACD (TODO: mock price history)', () => {
    // TODO: Provide mock trades and test macdFeature.calculate
  });
  it('should compute Bollinger Bands (TODO: mock price history)', () => {
    // TODO: Provide mock trades and test bollingerFeature.calculate
  });
  it('should compute streak (TODO: mock trades)', () => {
    // TODO: Provide mock trades and test streakFeature.calculate
  });
  it('should compute market regime (TODO: mock AnalyticsDataService)', async () => {
    // TODO: Mock AnalyticsDataService and test marketRegimeFeature.calculate
  });
}); 