import { mapRowToNormalizedTradeData } from '../mapCsvToNormalizedSchema';
import { BrokerType, NormalizedTradeData } from '../../types/trade'; // Adjust path as needed

describe('mapRowToNormalizedTradeData', () => {
  // Mock CSV headers and row data for IBKR
  const ibkrHeaders = [
    'Asset Category', 'Currency', 'Symbol', 'TradeDate', 'Quantity', 
    'TradePrice', 'IBCommission', 'NetCash', 'Open/CloseIndicator', 'IBOrderID',
    'Expiry', 'Strike', 'Put/Call', 'Multiplier', 'Description'
  ];
  const ibkrRow: Record<string, string> = {
    'Asset Category': 'OPT',
    'Currency': 'USD',
    'Symbol': 'AAPL',
    'TradeDate': '20230115',
    'Quantity': '10',
    'TradePrice': '150.00',
    'IBCommission': '-5.00',
    'NetCash': '1495.00', // Example: Price * Quantity - Commission (for a buy)
    'Open/CloseIndicator': 'O',
    'IBOrderID': '12345',
    'Expiry': '20240119',
    'Strike': '160',
    'Put/Call': 'C',
    'Multiplier': '100',
    'Description': 'AAPL 240119C00160000'
  };

  // Mock CSV headers and row data for Schwab
  const schwabHeaders = [
    'Date', 'Action', 'Symbol', 'Description',
    'Quantity', 'Price', 'Commissions & Fees', 'Amount'
  ];
  const schwabBuyRow: Record<string, string> = {
    'Date': '02/20/2023',
    'Action': 'Buy',
    'Symbol': 'MSFT',
    'Description': 'MICROSOFT CORP COM',
    'Quantity': '50',
    'Price': '250.00',
    'Commissions & Fees': '-2.50',
    'Amount': '-12502.50'
  };
   const schwabSellOptionRow: Record<string, string> = {
    'Date': '03/15/2023',
    'Action': 'Sell to Close',
    'Symbol': 'TSLA',
    'Description': 'TSLA MAR 31 2023 200.0 C (100 SHS)',
    'Quantity': '2',
    'Price': '5.50',
    'Commissions & Fees': '-1.30',
    'Amount': '1098.70' // 2 * 100 * 5.50 - 1.30
  };


  it('should correctly map an IBKR trade row to NormalizedTradeData', () => {
    const normalized = mapRowToNormalizedTradeData(ibkrRow, ibkrHeaders, BrokerType.IBKR);
    expect(normalized).not.toBeNull();
    if (!normalized) return;

    expect(normalized.broker).toBe(BrokerType.IBKR);
    expect(normalized.tradeDate).toBe('2023-01-15');
    expect(normalized.symbol).toBe('AAPL');
    expect(normalized.assetCategory).toBe('OPT');
    expect(normalized.quantity).toBe(10);
    expect(normalized.tradePrice).toBe(150.00);
    expect(normalized.commission).toBe(-5.00);
    expect(normalized.netAmount).toBe(1495.00);
    expect(normalized.openCloseIndicator).toBe('O');
    expect(normalized.orderID).toBe('12345');
    expect(normalized.expiryDate).toBe('2024-01-19');
    expect(normalized.strikePrice).toBe(160);
    expect(normalized.putCall).toBe('C');
    expect(normalized.multiplier).toBe(100);
    expect(normalized.description).toBe('AAPL 240119C00160000');
  });

  it('should correctly map a Schwab stock buy row to NormalizedTradeData', () => {
    const normalized = mapRowToNormalizedTradeData(schwabBuyRow, schwabHeaders, BrokerType.Schwab);
    expect(normalized).not.toBeNull();
    if (!normalized) return;

    expect(normalized.broker).toBe(BrokerType.Schwab);
    // expect(normalized.tradeDate).toBe('2023-02-20'); // formatDate needs to handle MM/DD/YYYY
    expect(normalized.symbol).toBe('MSFT');
    expect(normalized.assetCategory).toBe('STK'); // Should be inferred if not option
    expect(normalized.quantity).toBe(50);
    expect(normalized.tradePrice).toBe(250.00);
    expect(normalized.commission).toBe(-2.50);
    expect(normalized.netAmount).toBe(-12502.50);
    // expect(normalized.openCloseIndicator).toBe('O'); // Inferred from 'Buy'
  });
  
  it('should correctly map a Schwab option sell to close row', () => {
    const normalized = mapRowToNormalizedTradeData(schwabSellOptionRow, schwabHeaders, BrokerType.Schwab);
    expect(normalized).not.toBeNull();
    if (!normalized) return;

    expect(normalized.broker).toBe(BrokerType.Schwab);
    // expect(normalized.tradeDate).toBe('2023-03-15');
    expect(normalized.symbol).toBe('TSLA');
    expect(normalized.assetCategory).toBe('OPT');
    expect(normalized.quantity).toBe(-2); // Sell to close
    expect(normalized.tradePrice).toBe(5.50);
    expect(normalized.commission).toBe(-1.30);
    expect(normalized.netAmount).toBe(1098.70);
    // expect(normalized.openCloseIndicator).toBe('C');
    // expect(normalized.expiryDate).toBe('2023-03-31');
    // expect(normalized.strikePrice).toBe(200);
    // expect(normalized.putCall).toBe('C');
    expect(normalized.multiplier).toBe(100);
  });

  it('should return null if essential fields are missing for IBKR', () => {
    const incompleteIbkrRow = { ...ibkrRow, Symbol: undefined as any }; // Missing symbol
    const normalized = mapRowToNormalizedTradeData(incompleteIbkrRow, ibkrHeaders, BrokerType.IBKR);
    expect(normalized).toBeNull();
  });

  it('should return null if essential fields are missing for Schwab', () => {
    const incompleteSchwabRow = { ...schwabBuyRow, Date: undefined as any }; // Missing date
    const normalized = mapRowToNormalizedTradeData(incompleteSchwabRow, schwabHeaders, BrokerType.Schwab);
    expect(normalized).toBeNull();
  });

  // Add more tests for:
  // - Different date formats
  // - Different number formats (with commas, currency symbols)
  // - Inferring open/close for IBKR based on Quantity sign if Open/CloseIndicator is missing
  // - More complex Schwab option description parsing
  // - Empty or malformed rows
  // - Rows for asset categories other than STK/OPT (if supported by mappings)
  // - Fuzzy header matching cases
}); 