import { OptionStrategy } from './options';
/**
 * Parse IBKR option symbol to extract details
 */
export function parseIBKROptionSymbol(symbol) {
    // Example: AAPL 230915C00150000
    // Format: SYMBOL YYMMDD[C/P]STRIKE
    var match = symbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
    if (!match) {
        return null;
    }
    var underlying = match[1], dateStr = match[2], putCall = match[3], strikeStr = match[4];
    // Parse date (YYMMDD)
    var year = parseInt(dateStr.substring(0, 2)) + 2000;
    var month = parseInt(dateStr.substring(2, 4)) - 1; // JS months are 0-based
    var day = parseInt(dateStr.substring(4, 6));
    // Parse strike (divide by 1000 as IBKR stores strikes with 3 decimal places)
    var strike = parseInt(strikeStr) / 1000;
    return {
        underlying: underlying,
        expiry: new Date(year, month, day),
        strike: strike,
        putCall: putCall === 'C' ? 'CALL' : 'PUT'
    };
}
/**
 * Convert IBKR position to internal option trade
 */
export function convertIBKRPositionToTrade(position, accountId) {
    if (position.assetType !== 'OPTION' || !position.strike || !position.expiry) {
        return null;
    }
    var optionDetails = parseIBKROptionSymbol(position.symbol);
    if (!optionDetails) {
        return null;
    }
    // Calculate total P&L
    var totalPL = position.realizedPL + position.unrealizedPL;
    return {
        id: "".concat(position.symbol, "-").concat(Date.now()),
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
            "Imported from IBKR - ".concat(position.symbol),
            "Market Price: $".concat(position.marketPrice.toFixed(2)),
            "Market Value: $".concat(position.marketValue.toFixed(2)),
            "Average Cost: $".concat(position.averageCost.toFixed(2)),
            "Realized P&L: $".concat(position.realizedPL.toFixed(2)),
            "Unrealized P&L: $".concat(position.unrealizedPL.toFixed(2)),
            "Total P&L: $".concat(totalPL.toFixed(2)),
            "Last Updated: ".concat(position.lastUpdated.toLocaleString())
        ].join('\n')
    };
}
/**
 * Determine option strategy based on position details
 */
function determineOptionStrategy(position) {
    if (!position.putCall) {
        return OptionStrategy.OTHER;
    }
    return position.quantity > 0
        ? position.putCall === 'CALL'
            ? OptionStrategy.LONG_CALL
            : OptionStrategy.LONG_PUT
        : position.putCall === 'CALL'
            ? OptionStrategy.SHORT_CALL
            : OptionStrategy.SHORT_PUT;
}
