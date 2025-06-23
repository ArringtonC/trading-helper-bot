import { detectBroker, BrokerType } from '../detectBroker';

describe('detectBroker', () => {
  it('should detect IBKR from characteristic headers', () => {
    const ibkrHeaders = [
      'Header', 'DataDiscriminator', 'Asset Category', 'Currency', 'Symbol',
      'TradeDate', 'Quantity', 'TradePrice', 'IBCommission', 'IBOrderID'
    ];
    expect(detectBroker(ibkrHeaders)).toBe(BrokerType.IBKR);
  });

  it('should detect Schwab from characteristic headers', () => {
    const schwabHeaders = [
      'Date', 'Action', 'Symbol', 'Description',
      'Quantity', 'Price', 'Fees & Commissions', 'Amount',
      'Date acquired', 'Date sold', 'Total proceeds', 'Total cost basis' // Specific to certain Schwab reports
    ];
    expect(detectBroker(schwabHeaders)).toBe(BrokerType.Schwab);
  });

  it('should return Unknown for empty headers', () => {
    expect(detectBroker([])).toBe(BrokerType.Unknown);
  });

  it('should return Unknown for generic headers', () => {
    const genericHeaders = ['Column A', 'Column B', 'Date', 'Value', 'Amount'];
    expect(detectBroker(genericHeaders)).toBe(BrokerType.Unknown);
  });

  it('should correctly identify minimal IBKR headers', () => {
    const minimalIbkr = ['Asset Category', 'Symbol', 'Currency', 'TradePrice'];
    expect(detectBroker(minimalIbkr)).toBe(BrokerType.IBKR);
  });

  it('should correctly identify minimal Schwab headers', () => {
    const minimalSchwab = ['Total proceeds', 'Total cost basis', 'Date acquired', 'Symbol'];
    expect(detectBroker(minimalSchwab)).toBe(BrokerType.Schwab);
  });
  
  it('should handle mixed headers and prefer stronger match if logic allows or default to Unknown', () => {
    // This test depends on the specific scoring and tie-breaking logic
    const mixedHeaders = ['Asset Category', 'Symbol', 'Total proceeds', 'Total cost basis', 'Some Other Column'];
    // Expecting IBKR due to current scoring (Asset Category is required and high weight for IBKR)
    // If both have equal required headers and similar scores, it might be Unknown or prefer one based on total score.
    // Current tie-breaker is simple higher score for non-tied required headers.
    const result = detectBroker(mixedHeaders);
    // This assertion might need to change if scoring is adjusted.
    // If IBKR has 2 required (Asset Category, Symbol) + Total Score (2+1=3)
    // If Schwab has 2 required (Total proceeds, Total cost basis) + Total Score (2+2=4)
    // Schwab would win here.
    expect(result).toBe(BrokerType.Schwab); 
  });

   it('should handle headers with different casing and whitespace', () => {
    const ibkrHeadersSpaced = [
      ' asset category ', ' ibcommission  ', 'tradeprice', 'SYMBOL', 'currency'
    ];
    expect(detectBroker(ibkrHeadersSpaced)).toBe(BrokerType.IBKR);
  });

  it('should return Unknown if not enough required headers are present for IBKR', () => {
    const notEnoughIbkr = ['IBCommission', 'TradePrice', 'TradeDate']; // Missing 'Asset Category' or 'Symbol' or 'Currency' (needs 2 of these)
    expect(detectBroker(notEnoughIbkr)).toBe(BrokerType.Unknown);
  });

  it('should return Unknown if not enough required headers are present for Schwab', () => {
    const notEnoughSchwab = ['Date acquired', 'Date sold', 'Quantity']; // Missing 'Total proceeds' or 'Total cost basis'
    expect(detectBroker(notEnoughSchwab)).toBe(BrokerType.Unknown);
  });

  // Example of a more specific IBKR report (Trades section)
  const ibkrTradeReportHeaders = [
    "Header","Trades","DataDiscriminator","Asset Category","Currency","Symbol","DateTime","Quantity","TradePrice","TradeMoney","Proceeds","IBCommission","IBCommissionCurrency","NetCash","ClosePrice","Open/CloseIndicator","Notes/Codes","CostBasis","FifoPnlRealized","MtmPnl","OrigTradePrice","OrigTradeDate","OrigTradeID","ClearingFirmID","TransactionID","IBOrderID","IBExecID","RelatedTransactionID","Exchange","ReportDate","ClientID","AccountAlias","Model","SecurityID","SecurityIDType","PrincipalAdjustFactor","Multiplier","Strike","Expiry","Put/Call","TradeID","VolatilityOrderLink","ExchOrderID","ExtExecID","OrderTime","OpenDateTime","HoldingPeriodDateTime","WhenRealized","WhenReopened","LevelOfDetail","ChangeInPrice","ChangeInQuantity","OrderType","Submitter","ExecExchange"
  ];
  it('should detect IBKR from a full trade report header list', () => {
    expect(detectBroker(ibkrTradeReportHeaders)).toBe(BrokerType.IBKR);
  });

  // Example of a more specific Schwab report
  const schwabGainsLossesHeaders = [
    "Symbol","Description","Quantity","Date Acquired","Date Sold","Proceeds","Cost Basis","Wash Sale Loss Disallowed","Net Gain or Loss"
  ];
   it('should detect Schwab from a gains/losses report header list', () => {
    expect(detectBroker(schwabGainsLossesHeaders)).toBe(BrokerType.Schwab);
  });

}); 