import { IBKRActivityStatementParser } from '../services/IBKRActivityStatementParser';
// Sample activity statement for testing
var sampleActivityStatement = "Statement,Header,Field Name,Field Value,,,,,,,,,,,,,,,,,\nStatement,Data,BrokerName,Interactive Brokers LLC,,,,,,,,,,,,,,,,,\nStatement,Data,BrokerAddress,Two Pickwick Plaza, Greenwich, CT 06830,,,,,,,,,,,,,,,,,\nStatement,Data,Title,Activity Statement,,,,,,,,,,,,,,,,,\nStatement,Data,Period,January 1, 2025 - March 31, 2025,,,,,,,,,,,,,,,,,\nStatement,Data,WhenGenerated,2025-04-01, 01:44:55 EDT,,,,,,,,,,,,,,,,,\nAccount Information,Header,Field Name,Field Value,,,,,,,,,,,,,,,,,\nAccount Information,Data,Name,Arrington Copeland,,,,,,,,,,,,,,,,,\nAccount Information,Data,Account,U5922405 (Custom Consolidated),,,,,,,,,,,,,,,,,,\nAccount Information,Data,Account Type,Individual,,,,,,,,,,,,,,,,,\nAccount Information,Data,Base Currency,USD,,,,,,,,,,,,,,,,,\nNet Asset Value,Header,Asset Class,Prior Total,Current Long,Current Short,Current Total,Change,,,,,,,,,,,,,,,\nNet Asset Value,Data,Cash ,5.6754,6223.1969996,0,6223.1969996,6217.5215996,,,,,,,,,,,,,,,\nNet Asset Value,Data,Total,5.6754,6223.1969996,0,6223.1969996,6217.5215996,,,,,,,,,,,,,,,\nOpen Positions,Header,DataDiscriminator,Asset Category,Currency,Symbol,Quantity,Mult,Cost Price,Cost Basis,Close Price,Value,Unrealized P/L,Code,,,,\nOpen Positions,Data,Summary,Equity and Index Options,USD,SPY 31MAR25 570 C,1,100,0.8315665,83.15665,0,0,-83.15665,,,,\nOpen Positions,Total,,Equity and Index Options,USD,,,,,,83.15665,,0,-83.15665,,,,\nTrades,Header,DataDiscriminator,Asset Category,Currency,Account,Symbol,Date/Time,Quantity,T. Price,C. Price,Proceeds,Comm/Fee,Basis,Realized P/L,MTM P/L,Code\nTrades,Data,Order,Equity and Index Options,USD,U5922405,AAPL 28MAR25 222.5 C,2025-03-27, 10:30:15,1,1.22,2.0966,-122,-1.05665,123.05665,0,87.66,O\nTrades,Data,Order,Equity and Index Options,USD,U5922405,AAPL 28MAR25 222.5 C,2025-03-27, 12:43:04,-1,2.23,2.0966,223,-1.0656394,-123.05665,98.877711,13.34,C\nTrades,SubTotal,,Equity and Index Options,USD,AAPL 28MAR25 222.5 C,,,,0,,,122,-4.2421324,0,117.757868,122,\nFinancial Instrument Information,Header,Asset Category,Symbol,Description,Conid,Underlying,Listing Exch,Multiplier,Expiry,Delivery Month,Type,Strike,Code,,,\nFinancial Instrument Information,Data,Equity and Index Options,AAPL  250328C00222500,AAPL 28MAR25 222.5 C,767288575,AAPL,CBOE,100,2025-03-28,2025-03,C,222.5,,,\nFinancial Instrument Information,Data,Equity and Index Options,SPY   250331C00570000,SPY 31MAR25 570 C,693204214,SPY,CBOE,100,2025-03-31,2025-03,C,570,,,\n";
describe('IBKR Activity Statement Parser', function () {
    var parser;
    beforeEach(function () {
        parser = new IBKRActivityStatementParser(sampleActivityStatement);
    });
    describe('Account Information Parsing', function () {
        test('parses account information correctly', function () {
            var result = parser.parse();
            expect(result.account).toEqual({
                accountId: "U5922405",
                accountName: "Arrington Copeland",
                accountType: "Individual",
                baseCurrency: "USD",
                balance: 6223.1969996
            });
        });
    });
    describe('Positions Parsing', function () {
        test('parses open positions correctly', function () {
            var _a;
            var result = parser.parse();
            // Print parser debug logs for full visibility
            for (var _i = 0, _b = parser.getDebugState(); _i < _b.length; _i++) {
                var log = _b[_i];
                // eslint-disable-next-line no-console
                console.log(log);
            }
            // Debug: print Open Positions section and header row
            var openPositionsSection = (_a = parser['sections']) === null || _a === void 0 ? void 0 : _a.get('Open Positions');
            // Print the Open Positions section
            // eslint-disable-next-line no-console
            console.log('Open Positions Section:', JSON.stringify(openPositionsSection, null, 2));
            // Print the detected header row
            if (openPositionsSection) {
                var headerRow = openPositionsSection.find(function (row) { return row[1] === 'Header'; });
                // eslint-disable-next-line no-console
                console.log('Detected Header Row:', JSON.stringify(headerRow));
            }
            // Print the parsed positions
            // eslint-disable-next-line no-console
            console.log('Parsed Positions:', JSON.stringify(result.positions, null, 2));
            if (Array.isArray(result.positions)) {
                expect(result.positions.length).toBeGreaterThanOrEqual(1);
                var spyOption = result.positions.find(function (p) {
                    return p.symbol.includes("SPY") && p.symbol.includes("570");
                });
                expect(spyOption).toBeDefined();
                if (spyOption) {
                    expect(spyOption.quantity).toBe(1);
                    expect(spyOption.costBasis).toBe(83.15665);
                }
            }
            else {
                throw new Error('positions is not an array');
            }
        });
    });
    describe('Trades Parsing', function () {
        test('parses trades correctly', function () {
            var result = parser.parse();
            if (Array.isArray(result.trades)) {
                expect(result.trades.length).toBeGreaterThanOrEqual(2);
                var aaplBuyTrade = result.trades.find(function (t) {
                    return t.symbol.includes("AAPL") && t.quantity > 0;
                });
                expect(aaplBuyTrade).toBeDefined();
                if (aaplBuyTrade) {
                    expect(aaplBuyTrade.tradePrice).toBe(1.22);
                }
            }
            else {
                throw new Error('trades is not an array');
            }
        });
    });
    describe('Option Trades Conversion', function () {
        test('converts trades to option trades correctly', function () {
            var result = parser.parse();
            if (Array.isArray(result.optionTrades)) {
                expect(result.optionTrades.length).toBeGreaterThanOrEqual(1);
                var optionTrade = result.optionTrades[0];
                // Extract the underlying symbol from the option symbol string (e.g., "AAPL 28MAR25 222.5 C" -> "AAPL")
                var underlyingSymbolMatch = optionTrade.symbol.match(/^([A-Z]+)\s/);
                var underlyingSymbol = underlyingSymbolMatch ? underlyingSymbolMatch[1] : optionTrade.symbol;
                expect(['AAPL', 'SPY']).toContain(underlyingSymbol);
            }
            else {
                throw new Error('optionTrades is not an array');
            }
        });
    });
    describe('Edge Cases', function () {
        test('handles empty statement', function () {
            var emptyParser = new IBKRActivityStatementParser("");
            var result = emptyParser.parse();
            expect(result.account).toBeDefined();
            expect(Array.isArray(result.positions) ? result.positions.length : 0).toBe(0);
            expect(Array.isArray(result.trades) ? result.trades.length : 0).toBe(0);
            expect(Array.isArray(result.optionTrades) ? result.optionTrades.length : 0).toBe(0);
        });
        test('handles malformed statement', function () {
            var malformedParser = new IBKRActivityStatementParser("This is not a valid IBKR statement");
            var result = malformedParser.parse();
            expect(result.account).toBeDefined();
            expect(Array.isArray(result.positions) ? result.positions.length : 0).toBe(0);
            expect(Array.isArray(result.trades) ? result.trades.length : 0).toBe(0);
            expect(Array.isArray(result.optionTrades) ? result.optionTrades.length : 0).toBe(0);
        });
        test('handles statement with no options', function () {
            var noOptionsStatement = "Statement\tHeader\tField Name\tField Value\nStatement\tData\tBrokerName\tInteractive Brokers LLC\nAccount Information\tData\tName\tTest Account\nAccount Information\tData\tAccount\tU1234567\nAccount Information\tData\tBase Currency\tUSD\nNet Asset Value\tData\tCash \t10000\nNet Asset Value\tData\tTotal\t10000";
            var noOptionsParser = new IBKRActivityStatementParser(noOptionsStatement);
            var result = noOptionsParser.parse();
            expect(result.optionTrades).toHaveLength(0);
            expect(result.positions).toHaveLength(0);
            expect(result.trades).toHaveLength(0);
        });
    });
});
