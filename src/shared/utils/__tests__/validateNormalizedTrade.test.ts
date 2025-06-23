import { validateNormalizedTradeData } from '../validateNormalizedTrade';
import { NormalizedTradeData, BrokerType, AssetCategory, OpenCloseIndicator, PutCall } from '../../types/trade';
import { v4 as uuidv4 } from 'uuid';

const createValidTrade = (overrides: Partial<NormalizedTradeData> = {}): NormalizedTradeData => ({
  id: uuidv4(),
  importTimestamp: new Date().toISOString(),
  broker: BrokerType.IBKR,
  tradeDate: '2023-10-26',
  symbol: 'AAPL',
  assetCategory: 'STK' as AssetCategory,
  quantity: 100,
  tradePrice: 150.00,
  currency: 'USD',
  netAmount: -15000.00,
  ...overrides,
});

describe('validateNormalizedTradeData', () => {
  it('should return no errors for a valid trade object', () => {
    const trade = createValidTrade();
    expect(validateNormalizedTradeData(trade)).toEqual([]);
  });

  it('should return an error if trade object is null', () => {
    expect(validateNormalizedTradeData(null)).toEqual(['Trade object is null or undefined.']);
  });

  // Test Essential Fields
  it('should detect missing or invalid id', () => {
    expect(validateNormalizedTradeData(createValidTrade({ id: '' }))).toContain('Missing or invalid trade ID.');
  });

  it('should detect missing or invalid importTimestamp', () => {
    expect(validateNormalizedTradeData(createValidTrade({ importTimestamp: 'invalid-date' }))).toContain('Missing or invalid import timestamp.');
  });

  it('should detect missing or invalid broker', () => {
    expect(validateNormalizedTradeData(createValidTrade({ broker: 'INVALID_BROKER' as BrokerType }))).toContain('Missing or invalid broker.');
  });

  it('should detect missing or invalid tradeDate format', () => {
    expect(validateNormalizedTradeData(createValidTrade({ tradeDate: '2023/10/26' }))).toContain('Invalid tradeDate format: 2023/10/26. Expected YYYY-MM-DD.');
    expect(validateNormalizedTradeData(createValidTrade({ tradeDate: 'invalid-date' }))).toContain('Invalid tradeDate format: invalid-date. Expected YYYY-MM-DD.');
  });
  
  it('should detect missing or invalid symbol', () => {
    expect(validateNormalizedTradeData(createValidTrade({ symbol: '' }))).toContain('Missing or invalid symbol.');
  });

  it('should detect missing or invalid assetCategory', () => {
    expect(validateNormalizedTradeData(createValidTrade({ assetCategory: 'INVALID_ASSET' as AssetCategory }))).toContain('Missing or invalid asset category.');
  });

  it('should detect non-numeric quantity', () => {
    expect(validateNormalizedTradeData(createValidTrade({ quantity: 'abc' as any }))).toContain('Missing or invalid quantity.');
  });
  
  it('should detect non-numeric tradePrice', () => {
    expect(validateNormalizedTradeData(createValidTrade({ tradePrice: 'xyz' as any }))).toContain('Missing or invalid trade price.');
  });

  it('should detect invalid currency code', () => {
    expect(validateNormalizedTradeData(createValidTrade({ currency: 'US' }))).toContain('Missing or invalid currency code (must be 3 letters).');
  });

  it('should detect non-numeric netAmount', () => {
    expect(validateNormalizedTradeData(createValidTrade({ netAmount: ' πολλά' as any }))).toContain('Missing or invalid net amount.');
  });

  // Test Optional Field Formats
  it('should detect invalid settleDate format', () => {
    expect(validateNormalizedTradeData(createValidTrade({ settleDate: '26/10/2023' }))).toContain('Invalid settleDate format: 26/10/2023. Expected YYYY-MM-DD.');
  });

  it('should detect invalid commission type', () => {
    expect(validateNormalizedTradeData(createValidTrade({ commission: 'not-a-number' as any }))).toContain('Invalid commission type, must be a number or null/undefined.');
  });

  // Option Specific Validations
  it('should require option fields if assetCategory is OPT', () => {
    const optTrade = createValidTrade({ 
      assetCategory: 'OPT', 
      expiryDate: undefined, 
      strikePrice: undefined, 
      putCall: undefined,
      multiplier: undefined 
    });
    const errors = validateNormalizedTradeData(optTrade);
    expect(errors).toContain('Options require a valid expiryDate (YYYY-MM-DD): undefined.');
    expect(errors).toContain('Options require a valid positive strikePrice.');
    expect(errors).toContain('Options require a valid putCall indicator (P or C).');
    expect(errors).toContain('Options require a valid positive multiplier.');
  });

  it('should validate correct option fields', () => {
    const optTrade = createValidTrade({
      assetCategory: 'OPT',
      expiryDate: '2024-01-19',
      strikePrice: 150,
      putCall: 'C' as PutCall,
      multiplier: 100,
    });
    expect(validateNormalizedTradeData(optTrade)).toEqual([]);
  });

  it('should flag invalid putCall for options', () => {
    const optTrade = createValidTrade({ assetCategory: 'OPT', expiryDate: '2024-01-19', strikePrice: 150, multiplier: 100, putCall: 'X' as PutCall });
    expect(validateNormalizedTradeData(optTrade)).toContain('Options require a valid putCall indicator (P or C).');
  });

}); 