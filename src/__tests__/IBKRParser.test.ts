import { IBKRActivityStatementParser } from '../services/IBKRActivityStatementParser';

// Sample activity statement for testing
const sampleActivityStatement = `Statement	Header	Field Name	Field Value													
Statement	Data	BrokerName	Interactive Brokers LLC													
Statement	Data	BrokerAddress	Two Pickwick Plaza, Greenwich, CT 06830													
Statement	Data	Title	Activity Statement													
Statement	Data	Period	January 1, 2025 - March 31, 2025													
Statement	Data	WhenGenerated	2025-04-01, 01:44:55 EDT													
Account Information	Header	Field Name	Field Value													
Account Information	Data	Name	Arrington Copeland													
Account Information	Data	Account	U5922405 (Custom Consolidated)													
Account Information	Data	Account Type	Individual													
Account Information	Data	Base Currency	USD													
Net Asset Value	Header	Asset Class	Prior Total	Current Long	Current Short	Current Total	Change									
Net Asset Value	Data	Cash 	5.6754	6223.1969996	0	6223.1969996	6217.5215996									
Net Asset Value	Data	Total	5.6754	6223.1969996	0	6223.1969996	6217.5215996									
Open Positions	Header	DataDiscriminator	Asset Category	Currency	Symbol	Quantity	Mult	Cost Price	Cost Basis	Close Price	Value	Unrealized P/L	Code			
Open Positions	Data	Summary	Equity and Index Options	USD	SPY 31MAR25 570 C	1	100	0.8315665	83.15665	0	0	-83.15665				
Open Positions	Total		Equity and Index Options	USD					83.15665		0	-83.15665				
Trades	Header	DataDiscriminator	Asset Category	Currency	Account	Symbol	Date/Time	Quantity	T. Price	C. Price	Proceeds	Comm/Fee	Basis	Realized P/L	MTM P/L	Code
Trades	Data	Order	Equity and Index Options	USD	U5922405	AAPL 28MAR25 222.5 C	2025-03-27, 10:30:15	1	1.22	2.0966	-122	-1.05665	123.05665	0	87.66	O
Trades	Data	Order	Equity and Index Options	USD	U5922405	AAPL 28MAR25 222.5 C	2025-03-27, 12:43:04	-1	2.23	2.0966	223	-1.0656394	-123.05665	98.877711	13.34	C
Trades	SubTotal		Equity and Index Options	USD	AAPL 28MAR25 222.5 C			0			122	-4.2421324	0	117.757868	122	
Financial Instrument Information	Header	Asset Category	Symbol	Description	Conid	Underlying	Listing Exch	Multiplier	Expiry	Delivery Month	Type	Strike	Code			
Financial Instrument Information	Data	Equity and Index Options	AAPL  250328C00222500	AAPL 28MAR25 222.5 C	767288575	AAPL	CBOE	100	2025-03-28	2025-03	C	222.5				
Financial Instrument Information	Data	Equity and Index Options	SPY   250331C00570000	SPY 31MAR25 570 C	693204214	SPY	CBOE	100	2025-03-31	2025-03	C	570				`;

describe('IBKR Activity Statement Parser', () => {
  let parser: IBKRActivityStatementParser;

  beforeEach(() => {
    parser = new IBKRActivityStatementParser(sampleActivityStatement);
  });

  describe('Account Information Parsing', () => {
    test('parses account information correctly', () => {
      const result = parser.parse();
      
      expect(result.accountInfo).toEqual({
        accountId: "U5922405",
        accountName: "Arrington Copeland",
        accountType: "Individual",
        baseCurrency: "USD",
        balance: 6223.1969996
      });
    });
  });

  describe('Positions Parsing', () => {
    test('parses open positions correctly', () => {
      const result = parser.parse();
      
      expect(result.positions.length).toBeGreaterThanOrEqual(1);
      
      const spyOption = result.positions.find(p => 
        p.symbol.includes("SPY") && p.symbol.includes("570")
      );
      
      expect(spyOption).toBeDefined();
      if (spyOption) {
        expect(spyOption.quantity).toBe(1);
        expect(spyOption.costBasis).toBe(83.15665);
      }
    });
  });

  describe('Trades Parsing', () => {
    test('parses trades correctly', () => {
      const result = parser.parse();
      
      expect(result.trades.length).toBeGreaterThanOrEqual(2);
      
      const aaplBuyTrade = result.trades.find(t => 
        t.symbol.includes("AAPL") && t.quantity > 0
      );
      
      expect(aaplBuyTrade).toBeDefined();
      if (aaplBuyTrade) {
        expect(aaplBuyTrade.tradePrice).toBe(1.22);
      }
    });
  });

  describe('Option Trades Conversion', () => {
    test('converts trades to option trades correctly', () => {
      const result = parser.parse();
      
      expect(result.optionTrades.length).toBeGreaterThanOrEqual(1);
      
      const optionTrade = result.optionTrades[0];
      expect(['AAPL', 'SPY']).toContain(optionTrade.symbol);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty statement', () => {
      const emptyParser = new IBKRActivityStatementParser("");
      const result = emptyParser.parse();
      
      expect(result.accountInfo).toBeDefined();
      expect(result.positions).toHaveLength(0);
      expect(result.trades).toHaveLength(0);
      expect(result.optionTrades).toHaveLength(0);
    });

    test('handles malformed statement', () => {
      const malformedParser = new IBKRActivityStatementParser("This is not a valid IBKR statement");
      const result = malformedParser.parse();
      
      expect(result.accountInfo).toBeDefined();
      expect(result.positions).toHaveLength(0);
      expect(result.trades).toHaveLength(0);
      expect(result.optionTrades).toHaveLength(0);
    });

    test('handles statement with no options', () => {
      const noOptionsStatement = `Statement	Header	Field Name	Field Value
Statement	Data	BrokerName	Interactive Brokers LLC
Account Information	Data	Name	Test Account
Account Information	Data	Account	U1234567
Account Information	Data	Base Currency	USD
Net Asset Value	Data	Cash 	10000
Net Asset Value	Data	Total	10000`;
      
      const noOptionsParser = new IBKRActivityStatementParser(noOptionsStatement);
      const result = noOptionsParser.parse();
      
      expect(result.optionTrades).toHaveLength(0);
      expect(result.positions).toHaveLength(0);
      expect(result.trades).toHaveLength(0);
    });
  });
}); 