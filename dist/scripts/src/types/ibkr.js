"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIBKROptionSymbol = void 0;
exports.convertIBKRPositionToTrade = convertIBKRPositionToTrade;
const options_1 = require("./options");
/**
 * Parse IBKR option symbol to extract details
 */
const parseIBKROptionSymbol = (symbol) => {
    // New Regex for format like: AAPL 28MAR25 222.5 C
    // Or: SPY 21MAR25 560 P
    const match = symbol.match(/^([A-Z0-9\.^]+)\s+(\d{2})([A-Z]{3})(\d{2})\s+([0-9.]+)\s+([CP])$/i);
    if (!match) {
        console.warn(`[parseIBKROptionSymbol] No match for symbol: ${symbol}`);
        return null;
    }
    const [, underlying, dayStr, monthNameStr, yearStr, strikeStr, pc] = match;
    const monthMap = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };
    const year = 2000 + parseInt(yearStr, 10);
    const month = monthMap[monthNameStr.toUpperCase()];
    const day = parseInt(dayStr, 10);
    const strike = parseFloat(strikeStr);
    const putCall = pc.toUpperCase() === 'C' ? 'CALL' : 'PUT';
    if (month === undefined) {
        console.warn(`[parseIBKROptionSymbol] Invalid month: ${monthNameStr} in symbol: ${symbol}`);
        return null;
    }
    const expiry = new Date(Date.UTC(year, month, day));
    if (isNaN(expiry.getTime())) {
        console.warn(`[parseIBKROptionSymbol] Invalid date computed for symbol: ${symbol} (Y:${year} M:${month} D:${day})`);
        return null;
    }
    return { underlying, expiry, strike, putCall };
};
exports.parseIBKROptionSymbol = parseIBKROptionSymbol;
/**
 * Convert IBKR position to internal option trade
 */
function convertIBKRPositionToTrade(position, accountId) {
    if (position.assetType !== 'OPTION' || !position.strike || !position.expiry) {
        return null;
    }
    const optionDetails = (0, exports.parseIBKROptionSymbol)(position.symbol);
    if (!optionDetails) {
        return null;
    }
    // Calculate total P&L
    const totalPL = position.realizedPL + position.unrealizedPL;
    return {
        id: `${position.symbol}-${Date.now()}`,
        symbol: optionDetails.underlying,
        putCall: optionDetails.putCall,
        strike: optionDetails.strike,
        expiry: optionDetails.expiry,
        quantity: position.quantity,
        premium: position.marketPrice,
        openDate: position.lastUpdated,
        strategy: determineOptionStrategy(position),
        commission: 0, // IBKR commission would be in a separate transaction
        realizedPL: position.realizedPL,
        unrealizedPL: position.unrealizedPL,
        mtmPL: position.unrealizedPL, // Use unrealizedPL as mtmPL for positions
        notes: [
            `Imported from IBKR - ${position.symbol}`,
            `Market Price: $${position.marketPrice.toFixed(2)}`,
            `Market Value: $${position.marketValue.toFixed(2)}`,
            `Average Cost: $${position.averageCost.toFixed(2)}`,
            `Realized P&L: $${position.realizedPL.toFixed(2)}`,
            `Unrealized P&L: $${position.unrealizedPL.toFixed(2)}`,
            `Total P&L: $${totalPL.toFixed(2)}`,
            `Last Updated: ${position.lastUpdated.toLocaleString()}`
        ].join('\n')
    };
}
/**
 * Determine option strategy based on position details
 */
function determineOptionStrategy(position) {
    if (!position.putCall) {
        return options_1.OptionStrategy.OTHER;
    }
    return position.quantity > 0
        ? position.putCall === 'CALL'
            ? options_1.OptionStrategy.LONG_CALL
            : options_1.OptionStrategy.LONG_PUT
        : position.putCall === 'CALL'
            ? options_1.OptionStrategy.SHORT_CALL
            : options_1.OptionStrategy.SHORT_PUT;
}
