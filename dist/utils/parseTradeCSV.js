/*  parseTradeCSV.ts
    Robust "section-aware + header-mapping" IBKR trade-CSV parser
----------------------------------------------------------------- */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { parse } from 'papaparse';
// user-facing error to be thrown
var CSVFormatError = /** @class */ (function (_super) {
    __extends(CSVFormatError, _super);
    function CSVFormatError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CSVFormatError;
}(Error));
export { CSVFormatError };
// map exactly what your CSV calls each column → your internal key
var HEADER_ALIASES = {
    // ignore these (keep ignored for now, we'll focus on Code)
    Statement: '__ignore',
    Header: '__ignore',
    DataDiscriminator: '__ignore',
    // common IBKR header names → internal keys (keep ignored for now)
    'Asset Category': '__ignore',
    'Currency': '__ignore',
    'Account': '__ignore',
    'C. Price': '__ignore',
    'Realized P/L': 'rawRealizedPL', // Map Realized P/L to rawRealizedPL
    'MTM P/L': '__ignore',
    // the ones you *do* need:
    'Symbol': 'symbol',
    'Quantity': 'quantity',
    'Comm/Fee': 'commissionFee',
    'Date/Time': 'dateTime',
    'Proceeds': 'proceeds',
    'Basis': 'basis',
    // *** Include the 'Code' column ***
    'Code': 'tradeCode', // Map 'Code' to 'tradeCode'
};
// Add all possible price header variations
var PRICE_ALIASES = ['Price', 'T. Price', 'Trade Price', 'Trade_Price', 'Price Executed'];
PRICE_ALIASES.forEach(function (h) { return HEADER_ALIASES[h] = 'price'; });
export function isTradeCSV(text) {
    console.log('[DEBUG] isTradeCSV called');
    return text.includes('Trades,Header') && text.includes('Symbol') && text.includes('Quantity');
}
export function isPositionCSV(text) {
    return text.includes('Qty (Quantity)') && text.includes('Gain $') && text.includes('Market Value');
}
export function parseTradeCSV(fileText) {
    console.log('[DEBUG] parseTradeCSV called');
    var lines = fileText.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0)
        throw new Error('CSV is empty');
    var headers = lines[0].split(',').map(function (h) { return h.trim(); });
    console.log('[DEBUG] Detected CSV headers:', headers);
    // 1. detect delimiter (comma / tab / semicolon)
    var delim = [',', '\t', ';']
        .find(function (d) { return fileText.indexOf(d) > -1 && fileText.indexOf(d) < fileText.indexOf('\n'); }) || ',';
    var rows = parse(fileText, { delimiter: delim, skipEmptyLines: true }).data;
    var inTradesSection = false;
    var headerRow = [];
    var trades = [];
    var posByKey = {}; // Track positions by symbol
    var _loop_1 = function (row) {
        var _b = row.map(function (c) { return c.trim(); }), section = _b[0], type = _b[1], rest = _b.slice(2);
        // 2. find your header line
        if (section === 'Trades' && type === 'Header') {
            inTradesSection = true;
            headerRow = rest;
            console.log('[DEBUG] Detected Trades section headers:', headerRow);
            return "continue";
        }
        // 3. process each data row
        if (inTradesSection && section === 'Trades' && type === 'Data') {
            var record_1 = {};
            rest.forEach(function (cell, i) {
                var _a;
                var colName = (_a = headerRow[i]) !== null && _a !== void 0 ? _a : "col".concat(i);
                var alias = HEADER_ALIASES[colName];
                if (alias && alias !== '__ignore') {
                    // coerce numbers if needed
                    record_1[alias] =
                        alias === 'symbol' || alias === 'dateTime' || alias === 'tradeCode'
                            ? cell
                            : Number(cell);
                }
            });
            // Calculate position after trade and determine if it closes position using tradeCode or position flattening
            var key = record_1.symbol;
            var qty = record_1.quantity;
            var prev = posByKey[key] || 0;
            var after_1 = prev + qty;
            // Determine if the trade is closing based simply on whether raw Realized P/L is present
            var isClose = record_1.rawRealizedPL !== undefined;
            var parsedTrade = __assign(__assign({}, record_1), { positionAfter: after_1, isClose: isClose, 
                // realizedPL only when isClose is true
                realizedPL: isClose
                    ? record_1.proceeds - record_1.basis - record_1.commissionFee
                    : 0 });
            trades.push(parsedTrade);
            posByKey[key] = after_1;
            return "continue";
        }
        // 4. if we've left the Trades section, stop parsing
        if (inTradesSection && section !== 'Trades') {
            return "break";
        }
    };
    for (var _i = 0, _a = rows; _i < _a.length; _i++) {
        var row = _a[_i];
        var state_1 = _loop_1(row);
        if (state_1 === "break")
            break;
    }
    // 5. validate all required keys are present
    var missing = ['symbol', 'quantity', 'price', 'commissionFee', 'dateTime', 'proceeds', 'basis']
        .filter(function (k) { return trades.some(function (t) { return t[k] === undefined; }); });
    if (missing.length) {
        throw new CSVFormatError("Invalid Trades section format.\n" +
            "\u2022 Missing columns: ".concat(missing.join(', '), "\n") +
            "\u2022 Detected headers: ".concat(headerRow.join(', ')));
    }
    return trades;
}
