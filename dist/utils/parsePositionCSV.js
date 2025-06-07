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
import { parse } from 'papaparse';
var CSVFormatError = /** @class */ (function (_super) {
    __extends(CSVFormatError, _super);
    function CSVFormatError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CSVFormatError;
}(Error));
export { CSVFormatError };
var parseNumber = function (raw) {
    var cleaned = (raw !== null && raw !== void 0 ? raw : '').replace(/[$,%"]/g, '').replace(/,/g, '').trim();
    var value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};
export function parsePositionCSV(text) {
    // Detect delimiter (typically comma, but fallback)
    var delim = [',', '\t', ';'].find(function (d) { return text.indexOf(d) > -1 && text.indexOf(d) < text.indexOf('\n'); }) || ',';
    var rows = parse(text, { delimiter: delim, skipEmptyLines: true }).data;
    // Find the header row
    var headerRow = [];
    var positions = [];
    var _loop_1 = function (row) {
        if (row.includes('Qty (Quantity)') && row.includes('Gain $ (Gain/Loss $)')) {
            headerRow = row.map(function (col) { return col.trim().replace(/^"|"$/g, ''); });
            return "continue";
        }
        // Parse rows after header
        if (headerRow.length && row.length >= headerRow.length) {
            var record_1 = {};
            headerRow.forEach(function (col, i) {
                var _a, _b;
                var rawCell = row[i];
                switch (col) {
                    case 'Symbol':
                        record_1.symbol = (_a = rawCell === null || rawCell === void 0 ? void 0 : rawCell.trim().replace(/"/g, '')) !== null && _a !== void 0 ? _a : '';
                        break;
                    case 'Description':
                        record_1.description = (_b = rawCell === null || rawCell === void 0 ? void 0 : rawCell.trim().replace(/"/g, '')) !== null && _b !== void 0 ? _b : '';
                        break;
                    case 'Qty (Quantity)':
                        record_1.quantity = parseNumber(rawCell);
                        break;
                    case 'Price':
                        record_1.price = parseNumber(rawCell);
                        break;
                    case 'Mkt Val (Market Value)':
                        record_1.marketValue = parseNumber(rawCell);
                        break;
                    case 'Cost Basis':
                        record_1.costBasis = parseNumber(rawCell);
                        break;
                    case 'Gain $ (Gain/Loss $)':
                        record_1.gainDollar = parseNumber(rawCell);
                        break;
                    case 'Gain % (Gain/Loss %)':
                        record_1.gainPercent = parseNumber(rawCell);
                        break;
                }
            });
            if (record_1.symbol && typeof record_1.quantity === 'number') {
                positions.push(record_1);
            }
        }
    };
    for (var _i = 0, _a = rows; _i < _a.length; _i++) {
        var row = _a[_i];
        _loop_1(row);
    }
    if (!positions.length) {
        throw new CSVFormatError('No valid position data found. Ensure this is a position CSV export.');
    }
    return positions;
}
