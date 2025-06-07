/**
 * Represents an options trading strategy
 */
export var OptionStrategy;
(function (OptionStrategy) {
    OptionStrategy["LONG_CALL"] = "LONG_CALL";
    OptionStrategy["SHORT_CALL"] = "SHORT_CALL";
    OptionStrategy["LONG_PUT"] = "LONG_PUT";
    OptionStrategy["SHORT_PUT"] = "SHORT_PUT";
    OptionStrategy["CALL_SPREAD"] = "CALL_SPREAD";
    OptionStrategy["PUT_SPREAD"] = "PUT_SPREAD";
    OptionStrategy["IRON_CONDOR"] = "IRON_CONDOR";
    OptionStrategy["BUTTERFLY"] = "BUTTERFLY";
    OptionStrategy["OTHER"] = "OTHER";
})(OptionStrategy || (OptionStrategy = {}));
/**
 * Calculate the multiplier for an option contract
 * Default is 100 shares per contract for equity options
 */
export function getContractMultiplier(trade) {
    // Standard options contract is 100 shares
    return 100;
}
/**
 * Calculate the profit/loss for a trade
 */
export function calculateTradePL(trade) {
    console.log("\n\uD83D\uDD0D Calculating P&L for trade: ".concat(trade.symbol));
    console.log('Trade details:', JSON.stringify({
        id: trade.id,
        symbol: trade.symbol,
        putCall: trade.putCall,
        strike: trade.strike,
        quantity: trade.quantity,
        premium: trade.premium,
        openDate: trade.openDate,
        closeDate: trade.closeDate,
        closePremium: trade.closePremium,
        strategy: trade.strategy,
        commission: trade.commission,
        notes: trade.notes
    }, null, 2));
    // Check if P&L is stored in notes
    if (trade.notes) {
        // Try to extract total P&L first
        var totalPLMatch = trade.notes.match(/Total P&L: \$([-\d.]+)/);
        if (totalPLMatch && totalPLMatch[1]) {
            var pl_1 = parseFloat(totalPLMatch[1]);
            console.log('Found total P&L in notes:', pl_1);
            return pl_1;
        }
        // If no total P&L, try to calculate from realized and unrealized P&L
        var realizedPLMatch = trade.notes.match(/Realized P&L: \$([-\d.]+)/);
        var unrealizedPLMatch = trade.notes.match(/Unrealized P&L: \$([-\d.]+)/);
        if (realizedPLMatch && unrealizedPLMatch) {
            var realizedPL = parseFloat(realizedPLMatch[1]);
            var unrealizedPL = parseFloat(unrealizedPLMatch[1]);
            var totalPL = realizedPL + unrealizedPL;
            console.log('Calculated P&L from realized and unrealized:', totalPL);
            return totalPL;
        }
    }
    var standardMultiplier = 100; // Standard options contract multiplier
    var quantity = Math.abs(trade.quantity); // Quantity is already in contracts
    var commission = trade.commission || 0;
    // For open trades, calculate unrealized P&L
    if (!trade.closeDate || !trade.closePremium) {
        // If premium is undefined, we can't calculate P&L
        if (trade.premium === undefined) {
            console.log('Premium is undefined, returning 0');
            return 0;
        }
        // Premium is per share, total cost is premium * 100 per contract
        var totalCost = trade.premium * standardMultiplier * quantity;
        // For long positions (positive quantity), cost is negative
        // For short positions (negative quantity), cost is positive
        var pl_2 = trade.quantity > 0 ? -totalCost : totalCost;
        console.log('Open trade P&L calculation:', JSON.stringify({
            standardMultiplier: standardMultiplier,
            quantity: quantity,
            premium: trade.premium,
            totalCost: totalCost,
            isLong: trade.quantity > 0,
            commission: commission,
            pl: pl_2 - commission
        }, null, 2));
        return pl_2 - commission;
    }
    // For closed trades, calculate realized P&L
    // If either premium is undefined, we can't calculate P&L
    if (trade.premium === undefined) {
        console.log('Premium is undefined, returning 0');
        return 0;
    }
    var openCost = trade.premium * standardMultiplier * quantity;
    var closeCost = trade.closePremium * standardMultiplier * quantity;
    var pl;
    if (trade.quantity > 0) {
        // Long position: Sell price - Buy price
        pl = closeCost - openCost - commission;
    }
    else {
        // Short position: Buy price - Sell price
        pl = openCost - closeCost - commission;
    }
    console.log('Closed trade P&L calculation:', JSON.stringify({
        standardMultiplier: standardMultiplier,
        quantity: quantity,
        openPremium: trade.premium,
        closePremium: trade.closePremium,
        openCost: openCost,
        closeCost: closeCost,
        commission: commission,
        isLong: trade.quantity > 0,
        pl: pl
    }, null, 2));
    return pl;
}
/**
 * Check if an option is expired
 */
export function isExpired(trade) {
    return daysUntilExpiration(trade) <= 0;
}
/**
 * Calculate days until expiration
 */
export function daysUntilExpiration(trade) {
    var today = new Date();
    var expiry = new Date(trade.expiry);
    var diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
