import { v4 as uuidv4 } from 'uuid';
import { OptionStrategy } from '../types/options';
var IBKRActivityStatementParser = /** @class */ (function () {
    function IBKRActivityStatementParser() {
    }
    IBKRActivityStatementParser.prototype.determinePutCall = function (symbol) {
        return symbol.includes('P') ? 'PUT' : 'CALL';
    };
    IBKRActivityStatementParser.prototype.extractStrike = function (symbol) {
        var strikeMatch = symbol.match(/\d+/);
        return strikeMatch ? parseFloat(strikeMatch[0]) : 0;
    };
    IBKRActivityStatementParser.prototype.parseQuantity = function (value) {
        if (!value)
            return 0;
        return parseInt(value);
    };
    IBKRActivityStatementParser.prototype.parsePremium = function (value) {
        if (!value)
            return 0;
        return parseFloat(value.replace(/[$,]/g, ''));
    };
    IBKRActivityStatementParser.prototype.parseCommission = function (value) {
        if (!value)
            return 0;
        return parseFloat(value.replace(/[$,]/g, ''));
    };
    IBKRActivityStatementParser.prototype.parseDate = function (value) {
        return new Date(value);
    };
    IBKRActivityStatementParser.prototype.extractOptionDetails = function (description) {
        // Example description format: "SPY 01/19/24 450 CALL"
        var parts = description.split(' ');
        var symbol = parts[0];
        var expiry = new Date(parts[1]);
        var strike = parseFloat(parts[2]);
        var putCall = parts[3];
        return { symbol: symbol, putCall: putCall, strike: strike, expiry: expiry };
    };
    IBKRActivityStatementParser.prototype.determineStrategy = function (putCall, quantity) {
        if (quantity > 0) {
            return putCall === 'CALL' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT;
        }
        else {
            return putCall === 'CALL' ? OptionStrategy.SHORT_CALL : OptionStrategy.SHORT_PUT;
        }
    };
    IBKRActivityStatementParser.prototype.parseTrade = function (row) {
        var date = row[0], symbol = row[1], putCall = row[2], strike = row[3], expiry = row[4], quantity = row[5], price = row[6], commission = row[7];
        return {
            id: uuidv4(),
            symbol: symbol,
            putCall: putCall,
            strike: parseFloat(strike),
            expiry: new Date(expiry),
            quantity: parseInt(quantity),
            premium: parseFloat(price),
            openDate: new Date(date),
            strategy: this.determineStrategy(putCall, parseInt(quantity)),
            commission: parseFloat(commission),
            notes: '',
            realizedPL: 0
        };
    };
    IBKRActivityStatementParser.prototype.parsePL = function (value) {
        if (!value)
            return 0;
        return parseFloat(value.replace(/[$,]/g, ''));
    };
    return IBKRActivityStatementParser;
}());
