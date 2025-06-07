"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVFormatError = void 0;
exports.parsePositionCSV = parsePositionCSV;
const papaparse_1 = require("papaparse");
class CSVFormatError extends Error {
}
exports.CSVFormatError = CSVFormatError;
const parseNumber = (raw) => {
    const cleaned = (raw !== null && raw !== void 0 ? raw : '').replace(/[$,%"]/g, '').replace(/,/g, '').trim();
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};
function parsePositionCSV(text) {
    // Detect delimiter (typically comma, but fallback)
    const delim = [',', '\t', ';'].find(d => text.indexOf(d) > -1 && text.indexOf(d) < text.indexOf('\n')) || ',';
    const { data: rows } = (0, papaparse_1.parse)(text, { delimiter: delim, skipEmptyLines: true });
    // Find the header row
    let headerRow = [];
    const positions = [];
    for (const row of rows) {
        if (row.includes('Qty (Quantity)') && row.includes('Gain $ (Gain/Loss $)')) {
            headerRow = row.map(col => col.trim().replace(/^"|"$/g, ''));
            continue;
        }
        // Parse rows after header
        if (headerRow.length && row.length >= headerRow.length) {
            const record = {};
            headerRow.forEach((col, i) => {
                var _a, _b;
                const rawCell = row[i];
                switch (col) {
                    case 'Symbol':
                        record.symbol = (_a = rawCell === null || rawCell === void 0 ? void 0 : rawCell.trim().replace(/"/g, '')) !== null && _a !== void 0 ? _a : '';
                        break;
                    case 'Description':
                        record.description = (_b = rawCell === null || rawCell === void 0 ? void 0 : rawCell.trim().replace(/"/g, '')) !== null && _b !== void 0 ? _b : '';
                        break;
                    case 'Qty (Quantity)':
                        record.quantity = parseNumber(rawCell);
                        break;
                    case 'Price':
                        record.price = parseNumber(rawCell);
                        break;
                    case 'Mkt Val (Market Value)':
                        record.marketValue = parseNumber(rawCell);
                        break;
                    case 'Cost Basis':
                        record.costBasis = parseNumber(rawCell);
                        break;
                    case 'Gain $ (Gain/Loss $)':
                        record.gainDollar = parseNumber(rawCell);
                        break;
                    case 'Gain % (Gain/Loss %)':
                        record.gainPercent = parseNumber(rawCell);
                        break;
                }
            });
            if (record.symbol && typeof record.quantity === 'number') {
                positions.push(record);
            }
        }
    }
    if (!positions.length) {
        throw new CSVFormatError('No valid position data found. Ensure this is a position CSV export.');
    }
    return positions;
}
